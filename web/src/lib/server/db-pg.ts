import { env } from '$env/dynamic/private';
import postgres from 'postgres';
import crypto from 'node:crypto';
import type { QuestionResponse, QuizResult } from '$lib/types';
import type { QuestionDefinition } from './question-bank';
import {
	defaultExamDate,
	type CourseAssignment,
	type CourseLesson,
	type CourseModule,
	type SubmissionRecord
} from './course';
import type {
	QuizRepository,
	StoredSession,
	StoredGoogleOAuth,
	StoredSyncedEvent,
	ReviewCardRow,
	StudyDayRow,
	AnswerHistoryRow,
	Scope,
	ProfileRow,
	SessionRow,
	StateRow
} from './db';
import { DEFAULT_SCOPE, MAX_PROFILES } from './db';
import { applyPgSchema } from './schema-pg';
import { seedCourseContent } from './pg-seed';
import { ScopedReadCache, type ScopedCacheStats } from './scoped-cache';
import {
	BACKUP_FORMAT,
	BACKUP_VERSION,
	type BackupAnswer,
	type BackupSessionResponse,
	type ProgressBackup
} from './backup';

/**
 * Deletes every progress row for one profile+course scope inside a transaction:
 * quiz sessions (children first), answers, domain progress, review cards, the
 * profile's study log, and this course's submissions + lesson completions.
 * Profiles, course content, exam date and due-date overrides are untouched.
 * Study days are per-profile by design (streaks span courses), so they wipe
 * profile-wide — the table has no course column to filter by.
 */
async function wipeScopeProgress(tx: postgres.TransactionSql, scope: Scope): Promise<void> {
	await tx`DELETE FROM quiz_session_responses WHERE session_id IN (
		SELECT id FROM quiz_sessions WHERE profile_id = ${scope.profileId} AND course_id = ${scope.courseId}
	)`;
	await tx`DELETE FROM quiz_session_state WHERE session_id IN (
		SELECT id FROM quiz_sessions WHERE profile_id = ${scope.profileId} AND course_id = ${scope.courseId}
	)`;
	await tx`DELETE FROM quiz_answers
		WHERE profile_id = ${scope.profileId} AND course_id = ${scope.courseId}`;
	await tx`DELETE FROM quiz_sessions
		WHERE profile_id = ${scope.profileId} AND course_id = ${scope.courseId}`;
	await tx`DELETE FROM domain_progress
		WHERE profile_id = ${scope.profileId} AND course_id = ${scope.courseId}`;
	await tx`DELETE FROM review_cards
		WHERE profile_id = ${scope.profileId} AND course_id = ${scope.courseId}`;
	await tx`DELETE FROM study_log WHERE profile_id = ${scope.profileId}`;
	await tx`DELETE FROM course_assignment_submissions
		WHERE profile_id = ${scope.profileId}
			AND assignment_id IN (SELECT id FROM course_assignments WHERE course_id = ${scope.courseId})`;
	await tx`DELETE FROM course_lesson_completions
		WHERE profile_id = ${scope.profileId}
			AND lesson_id IN (SELECT id FROM course_lessons WHERE course_id = ${scope.courseId})`;
}

/**
 * Resolves the PostgreSQL connection string the same way the Google Calendar
 * credentials resolve: `$env/dynamic/private` (loaded from `.env` in dev via
 * Vite, from the process environment in production). `process.env` is kept as
 * a fallback for non-Vite entry points.
 */
function resolveConnectionString(explicit?: string): string {
	const url = explicit ?? env.DATABASE_URL ?? process.env.DATABASE_URL;
	if (!url)
		throw new Error(
			'DATABASE_URL is not set. Add it to web/.env (dev) or the process environment (production) — see web/.env.example.'
		);
	return url;
}

/** Create a PostgreSQL-backed quiz repository. */
export function createPgQuizRepository(connectionString?: string): QuizRepository {
	const sql = postgres(resolveConnectionString(connectionString), {
		max: 10,
		idle_timeout: 20,
		connect_timeout: 10
	});
	const cache = new ScopedReadCache();

	const make = (scope: Scope): QuizRepository => {
		const readSession = async (id: string): Promise<StoredSession | null> => {
			cache.bypass();
			const rows = await sql`
				SELECT s.*, st.deadline_at, st.current_index, st.questions_json, st.result_json
				FROM quiz_sessions s
				JOIN quiz_session_state st ON st.session_id = s.id
				WHERE s.id = ${id}
					AND s.profile_id = ${scope.profileId}
					AND s.course_id = ${scope.courseId}
			`;
			if (rows.length === 0) return null;
			const responseRows = await sql`
				SELECT question_index, response_json, flagged, retries, hint_used
				FROM quiz_session_responses
				WHERE session_id = ${id}
				ORDER BY question_index
			`;
			return parseStoredSession(rows[0] as unknown as SessionRow & StateRow, responseRows as never);
		};

		return {
			async getProfiles() {
				const rows = await sql`
					SELECT id, name, color, course_id AS "courseId", created_at AS "createdAt"
					FROM profiles
					ORDER BY created_at
				`;
				return rows as unknown as ProfileRow[];
			},
			async createProfile(name, color, courseId = DEFAULT_SCOPE.courseId) {
				return sql.begin(async (tx) => {
					const counted = await tx`SELECT COUNT(*)::int AS c FROM profiles`;
					if (counted[0].c >= MAX_PROFILES)
						throw new Error(`Profile cap of ${MAX_PROFILES} reached.`);
					const id = crypto.randomUUID();
					const createdAt = new Date().toISOString();
					await tx`
						INSERT INTO profiles (id, name, color, course_id, created_at)
						VALUES (${id}, ${name}, ${color}, ${courseId}, ${createdAt})
					`;
					return { id, name, color, createdAt, courseId };
				});
			},
			async renameProfile(id, name) {
				await sql`UPDATE profiles SET name = ${name} WHERE id = ${id}`;
			},
			async setProfileCourse(id, courseId) {
				await sql`UPDATE profiles SET course_id = ${courseId} WHERE id = ${id}`;
			},
			async deleteProfile(id) {
				if (id === DEFAULT_SCOPE.profileId)
					throw new Error('The default profile cannot be deleted.');
				await sql.begin(async (tx) => {
					await tx`DELETE FROM quiz_session_responses WHERE session_id IN (SELECT id FROM quiz_sessions WHERE profile_id = ${id})`;
					await tx`DELETE FROM quiz_session_state WHERE session_id IN (SELECT id FROM quiz_sessions WHERE profile_id = ${id})`;
					for (const table of [
						'quiz_sessions',
						'quiz_answers',
						'domain_progress',
						'review_cards',
						'study_log',
						'course_meta',
						'course_assignment_submissions',
						'course_lesson_completions',
						'google_oauth',
						'google_synced_events'
					] as const)
						await tx`DELETE FROM ${sql(table)} WHERE profile_id = ${id}`;
					await tx`DELETE FROM profiles WHERE id = ${id}`;
				});
			},
			forScope: make,
			async seed() {
				await applyPgSchema(sql);
				await seedCourseContent(sql);
			},
			async createSession(session) {
				await sql.begin(async (tx) => {
					await tx`INSERT INTO quiz_sessions (id, started_at, type, domain, total_questions, mode, status, updated_at, assignment_id, profile_id, course_id)
						VALUES (${session.id}, ${session.startedAt}, ${session.type}, ${session.domain}, ${session.questions.length}, ${session.mode}, 'active', ${session.startedAt}, ${session.assignmentId ?? null}, ${scope.profileId}, ${scope.courseId})`;
					await tx`INSERT INTO quiz_session_state (session_id, schema_version, deadline_at, current_index, questions_json, updated_at)
						VALUES (${session.id}, 1, ${session.deadlineAt}, 0, ${JSON.stringify(session.questions)}, ${session.startedAt})`;
				});
			},
			getSession: readSession,
			async getActiveSession() {
				cache.bypass();
				const rows = await sql`
					SELECT id FROM quiz_sessions
					WHERE status = 'active' AND profile_id = ${scope.profileId} AND course_id = ${scope.courseId}
					ORDER BY started_at DESC LIMIT 1
				`;
				return rows.length > 0 ? readSession(rows[0].id) : null;
			},
			async saveResponse(id, index, response, answeredAt, opts = {}) {
				const { incrementRetries = true } = opts;
				await sql.begin(async (tx) => {
					const owned =
						await tx`SELECT 1 FROM quiz_sessions WHERE id = ${id} AND profile_id = ${scope.profileId} AND course_id = ${scope.courseId}`;
					if (owned.length === 0) return;
					if (incrementRetries)
						await tx`INSERT INTO quiz_session_responses (session_id, question_index, response_json, flagged, retries, answered_at)
							VALUES (${id}, ${index}, ${JSON.stringify(response)}, 0, 0, ${answeredAt})
							ON CONFLICT (session_id, question_index) DO UPDATE
							SET response_json = EXCLUDED.response_json, answered_at = EXCLUDED.answered_at, retries = quiz_session_responses.retries + 1`;
					else
						await tx`INSERT INTO quiz_session_responses (session_id, question_index, response_json, flagged, retries, answered_at)
							VALUES (${id}, ${index}, ${JSON.stringify(response)}, 0, 0, ${answeredAt})
							ON CONFLICT (session_id, question_index) DO UPDATE
							SET response_json = EXCLUDED.response_json, answered_at = EXCLUDED.answered_at`;
					await tx`UPDATE quiz_sessions SET updated_at = ${answeredAt} WHERE id = ${id} AND profile_id = ${scope.profileId} AND course_id = ${scope.courseId}`;
				});
			},
			async markHintUsed(id, index, updatedAt) {
				await sql.begin(async (tx) => {
					const owned =
						await tx`SELECT 1 FROM quiz_sessions WHERE id = ${id} AND profile_id = ${scope.profileId} AND course_id = ${scope.courseId}`;
					if (owned.length === 0) return;
					await tx`INSERT INTO quiz_session_responses (session_id, question_index, hint_used)
						VALUES (${id}, ${index}, 1)
						ON CONFLICT (session_id, question_index) DO UPDATE SET hint_used = 1`;
					await tx`UPDATE quiz_sessions SET updated_at = ${updatedAt} WHERE id = ${id} AND profile_id = ${scope.profileId} AND course_id = ${scope.courseId}`;
				});
			},
			async updateState(id, currentIndex, flag, updatedAt = new Date().toISOString()) {
				await sql.begin(async (tx) => {
					const owned =
						await tx`SELECT 1 FROM quiz_sessions WHERE id = ${id} AND profile_id = ${scope.profileId} AND course_id = ${scope.courseId}`;
					if (owned.length === 0) return;
					if (currentIndex !== undefined)
						await tx`UPDATE quiz_session_state SET current_index = ${currentIndex}, updated_at = ${updatedAt} WHERE session_id = ${id}`;
					if (flag)
						await tx`INSERT INTO quiz_session_responses (session_id, question_index, flagged)
							VALUES (${id}, ${flag.questionIndex}, ${flag.value ? 1 : 0})
							ON CONFLICT (session_id, question_index) DO UPDATE SET flagged = EXCLUDED.flagged`;
					await tx`UPDATE quiz_sessions SET updated_at = ${updatedAt} WHERE id = ${id} AND profile_id = ${scope.profileId} AND course_id = ${scope.courseId}`;
				});
			},
			async abandon(id, updatedAt) {
				const result = await sql`UPDATE quiz_sessions
					SET status = 'abandoned', updated_at = ${updatedAt}
					WHERE id = ${id} AND status = 'active' AND profile_id = ${scope.profileId} AND course_id = ${scope.courseId}`;
				return result.count === 1;
			},
			async complete(id, result, answers, completedAt) {
				return sql.begin(async (tx) => {
					const owned =
						await tx`SELECT 1 FROM quiz_sessions WHERE id = ${id} AND profile_id = ${scope.profileId} AND course_id = ${scope.courseId}`;
					if (owned.length === 0) throw new Error('Session is outside the active scope.');
					const existing =
						await tx`SELECT result_json FROM quiz_session_state WHERE session_id = ${id}`;
					if (existing.length > 0 && existing[0].result_json)
						return { result: JSON.parse(existing[0].result_json) as QuizResult, finalized: false };
					// Answers + domain progress follow the session's own scope.
					const sessionScopeRows =
						await tx`SELECT profile_id, course_id FROM quiz_sessions WHERE id = ${id}`;
					const sessionScope = sessionScopeRows[0] ?? {
						profile_id: scope.profileId,
						course_id: scope.courseId
					};
					for (const answer of answers)
						await tx`INSERT INTO quiz_answers (session_id, question_index, prompt, domain, category, correct_answer, user_answer, is_correct, question_id, objective, response_json, points_earned, points_possible, profile_id, course_id)
							VALUES (${id}, ${answer.index}, ${answer.question.prompt}, ${answer.question.domain}, ${answer.question.objective}, '', ${JSON.stringify(answer.response)}, ${answer.points === 1 ? 1 : 0}, ${answer.question.id}, ${answer.question.objective}, ${JSON.stringify(answer.response)}, ${answer.points}, 1, ${sessionScope.profile_id}, ${sessionScope.course_id})`;
					for (const domain of [1, 2, 3, 4, 5]) {
						const breakdown = result.domainBreakdown[domain as 1 | 2 | 3 | 4 | 5];
						if (breakdown.possiblePoints)
							await tx`INSERT INTO domain_progress (profile_id, course_id, domain, total_attempted, total_correct, points_earned, points_possible, last_reviewed_at)
								VALUES (${sessionScope.profile_id}, ${sessionScope.course_id}, ${domain}, ${breakdown.totalQuestions}, ${breakdown.fullyCorrect}, ${breakdown.earnedPoints}, ${breakdown.possiblePoints}, ${completedAt})
								ON CONFLICT (profile_id, course_id, domain) DO UPDATE
								SET total_attempted = domain_progress.total_attempted + EXCLUDED.total_attempted,
									total_correct = domain_progress.total_correct + EXCLUDED.total_correct,
									points_earned = domain_progress.points_earned + EXCLUDED.points_earned,
									points_possible = domain_progress.points_possible + EXCLUDED.points_possible,
									last_reviewed_at = EXCLUDED.last_reviewed_at`;
					}
					await tx`UPDATE quiz_sessions
						SET status = 'completed', completed_at = ${completedAt}, points_earned = ${result.earnedPoints}, points_possible = ${result.possiblePoints}, correct_answers = ${result.fullyCorrect}, total_questions = ${result.totalQuestions}, elapsed_seconds = ${result.elapsedSeconds ?? null}, duration_seconds = ${result.durationSeconds ?? null}, updated_at = ${completedAt}
						WHERE id = ${id} AND status = 'active'`;
					await tx`UPDATE quiz_session_state SET result_json = ${JSON.stringify(result)}, updated_at = ${completedAt} WHERE session_id = ${id}`;
					return { result, finalized: true };
				});
			},
			async getAllDomainProgress() {
				cache.bypass();
				const rows =
					await sql`SELECT * FROM domain_progress WHERE profile_id = ${scope.profileId} AND course_id = ${scope.courseId}`;
				const result: Record<
					number,
					{
						attempted: number;
						correct: number;
						earnedPoints: number;
						possiblePoints: number;
						percentage: number;
						lastReviewed: string | null;
					}
				> = {};
				for (const row of rows)
					result[row.domain] = {
						attempted: row.total_attempted,
						correct: row.total_correct,
						earnedPoints: row.points_earned,
						possiblePoints: row.points_possible,
						percentage: row.points_possible
							? Math.round((row.points_earned / row.points_possible) * 1000) / 10
							: 0,
						lastReviewed: row.last_reviewed_at
					};
				return result;
			},
			async getRecentSessions(limit = 10) {
				cache.bypass();
				const rows = await sql`SELECT * FROM quiz_sessions
					WHERE status = 'completed' AND profile_id = ${scope.profileId} AND course_id = ${scope.courseId}
					ORDER BY completed_at DESC LIMIT ${limit}`;
				return rows as unknown as SessionRow[];
			},
			async getAllCompletedSessions() {
				cache.bypass();
				const rows = await sql`SELECT * FROM quiz_sessions
					WHERE status = 'completed' AND profile_id = ${scope.profileId} AND course_id = ${scope.courseId}
					ORDER BY completed_at DESC`;
				return rows as unknown as SessionRow[];
			},
			async getWeakTopics() {
				cache.bypass();
				const rows =
					await sql`SELECT domain, objective, SUM(points_earned) AS "earnedPoints", SUM(points_possible) AS "possiblePoints"
					FROM quiz_answers
					WHERE objective IS NOT NULL AND profile_id = ${scope.profileId} AND course_id = ${scope.courseId}
					GROUP BY domain, objective
					HAVING SUM(points_possible) >= 3 AND SUM(points_earned)::float / SUM(points_possible) < 0.85
					ORDER BY SUM(points_earned)::float / SUM(points_possible)`;
				return rows.map((row) => {
					const earnedPoints = Number(row.earnedPoints);
					const possiblePoints = Number(row.possiblePoints);
					return {
						domain: row.domain,
						objective: row.objective,
						earnedPoints,
						possiblePoints,
						percentage: Math.round((earnedPoints / possiblePoints) * 1000) / 10,
						severity: (earnedPoints / possiblePoints < 0.7 ? 'high' : 'review') as 'high' | 'review'
					};
				});
			},
			async getReviewCards() {
				const rows =
					await sql`SELECT question_id AS "questionId", interval_days AS "intervalDays", ease, lapses, due_at AS "dueAt", last_result AS "lastResult", review_count AS "reviewCount", first_seen_at AS "firstSeenAt"
					FROM review_cards
					WHERE profile_id = ${scope.profileId} AND course_id = ${scope.courseId}`;
				return rows as unknown as ReviewCardRow[];
			},
			async upsertReviewCard(card) {
				await sql`INSERT INTO review_cards (profile_id, course_id, question_id, interval_days, ease, lapses, due_at, last_result, review_count, first_seen_at)
					VALUES (${scope.profileId}, ${scope.courseId}, ${card.questionId}, ${card.intervalDays}, ${card.ease}, ${card.lapses}, ${card.dueAt}, ${card.lastResult}, ${card.reviewCount}, ${card.firstSeenAt})
					ON CONFLICT (profile_id, course_id, question_id) DO UPDATE
					SET interval_days = EXCLUDED.interval_days, ease = EXCLUDED.ease, lapses = EXCLUDED.lapses,
						due_at = EXCLUDED.due_at, last_result = EXCLUDED.last_result, review_count = EXCLUDED.review_count`;
			},
			async getStudyLog() {
				const rows =
					await sql`SELECT date_key AS "dateKey", questions, sessions, updated_at AS "updatedAt"
					FROM study_log
					WHERE profile_id = ${scope.profileId}
					ORDER BY date_key`;
				return rows as unknown as StudyDayRow[];
			},
			async recordStudyDay(dateKey, questions, updatedAt) {
				await sql`INSERT INTO study_log (profile_id, date_key, questions, sessions, updated_at)
					VALUES (${scope.profileId}, ${dateKey}, ${questions}, 1, ${updatedAt})
					ON CONFLICT (profile_id, date_key) DO UPDATE
					SET questions = study_log.questions + EXCLUDED.questions,
						sessions = study_log.sessions + 1,
						updated_at = EXCLUDED.updated_at`;
			},
			async getAnswerHistory() {
				const rows =
					await sql`SELECT a.question_id AS "questionId", a.is_correct AS "isCorrect", s.completed_at AS "completedAt"
					FROM quiz_answers a
					JOIN quiz_sessions s ON s.id = a.session_id
					WHERE a.question_id IS NOT NULL AND s.status = 'completed'
						AND a.profile_id = ${scope.profileId} AND a.course_id = ${scope.courseId}`;
				return rows as unknown as AnswerHistoryRow[];
			},
			async getAnsweredQuestionIds() {
				const rows = await sql`SELECT DISTINCT question_id
					FROM quiz_answers
					WHERE question_id IS NOT NULL AND profile_id = ${scope.profileId} AND course_id = ${scope.courseId}`;
				return rows.map((row) => row.question_id as string);
			},
			async getObjectiveProgress() {
				const rows =
					await sql`SELECT objective, COUNT(*)::int AS attempted, SUM(points_earned) AS "earnedPoints", SUM(points_possible) AS "possiblePoints"
					FROM quiz_answers
					WHERE objective IS NOT NULL AND profile_id = ${scope.profileId} AND course_id = ${scope.courseId}
					GROUP BY objective`;
				return rows.map((row) => ({
					objective: row.objective,
					attempted: row.attempted,
					earnedPoints: Number(row.earnedPoints),
					possiblePoints: Number(row.possiblePoints)
				}));
			},
			async getExamDate() {
				const rows = await sql`SELECT value FROM course_meta
					WHERE profile_id = ${scope.profileId} AND course_id = ${scope.courseId} AND key = 'exam_date'`;
				return rows.length > 0 ? rows[0].value : defaultExamDate();
			},
			async setExamDate(examDate) {
				await sql`INSERT INTO course_meta (profile_id, course_id, key, value)
					VALUES (${scope.profileId}, ${scope.courseId}, 'exam_date', ${examDate})
					ON CONFLICT (profile_id, course_id, key) DO UPDATE SET value = EXCLUDED.value`;
				cache.invalidateScope(scope);
			},
			async getDueDateOverrides() {
				const rows = await sql`SELECT assignment_id, due_date FROM course_assignment_overrides
					WHERE profile_id = ${scope.profileId} AND course_id = ${scope.courseId}`;
				const overrides: Record<string, string> = {};
				for (const row of rows) overrides[row.assignment_id as string] = row.due_date as string;
				return overrides;
			},
			async setDueDateOverride(assignmentId, dueDate) {
				if (dueDate === null)
					await sql`DELETE FROM course_assignment_overrides
						WHERE profile_id = ${scope.profileId} AND course_id = ${scope.courseId}
							AND assignment_id = ${assignmentId}`;
				else
					await sql`INSERT INTO course_assignment_overrides (profile_id, course_id, assignment_id, due_date, updated_at)
						VALUES (${scope.profileId}, ${scope.courseId}, ${assignmentId}, ${dueDate}, ${new Date().toISOString()})
						ON CONFLICT (profile_id, course_id, assignment_id) DO UPDATE
						SET due_date = EXCLUDED.due_date, updated_at = EXCLUDED.updated_at`;
				cache.invalidateScope(scope);
			},
			async resetProgress() {
				await sql.begin((tx) => wipeScopeProgress(tx, scope));
				cache.invalidateScope(scope);
			},
			async exportProgress() {
				cache.bypass();
				const sessionFilter = sql`
					WHERE profile_id = ${scope.profileId} AND course_id = ${scope.courseId}`;
				const [
					examDate,
					overrideRows,
					sessionRows,
					answerRows,
					domainRows,
					cardRows,
					logRows,
					submissionRows,
					completionRows
				] = await Promise.all([
					this.getExamDate(),
					this.getDueDateOverrides(),
					sql`SELECT * FROM quiz_sessions ${sessionFilter} ORDER BY started_at`,
					sql`SELECT * FROM quiz_answers ${sessionFilter}`,
					sql`SELECT * FROM domain_progress ${sessionFilter} ORDER BY domain`,
					sql`SELECT * FROM review_cards ${sessionFilter}`,
					sql`SELECT * FROM study_log WHERE profile_id = ${scope.profileId} ORDER BY date_key`,
					sql`SELECT * FROM course_assignment_submissions
							WHERE profile_id = ${scope.profileId}
								AND assignment_id IN (SELECT id FROM course_assignments WHERE course_id = ${scope.courseId})`,
					sql`SELECT * FROM course_lesson_completions
							WHERE profile_id = ${scope.profileId}
								AND lesson_id IN (SELECT id FROM course_lessons WHERE course_id = ${scope.courseId})`
				]);
				const sessionIds = sessionRows.map((row) => row.id as string);
				const [stateRows, responseRows] = await Promise.all([
					sessionIds.length
						? sql`SELECT * FROM quiz_session_state WHERE session_id IN ${sql(sessionIds)}`
						: [],
					sessionIds.length
						? sql`SELECT * FROM quiz_session_responses WHERE session_id IN ${sql(sessionIds)}`
						: []
				]);
				const stateBySession = new Map(stateRows.map((row) => [row.session_id as string, row]));
				const responsesBySession = new Map<string, BackupSessionResponse[]>();
				for (const row of responseRows) {
					const list = responsesBySession.get(row.session_id as string) ?? [];
					list.push({
						questionIndex: row.question_index as number,
						responseJson: (row.response_json as string | null) ?? null,
						flagged: row.flagged as number,
						retries: row.retries as number,
						hintUsed: row.hint_used as number,
						answeredAt: (row.answered_at as string | null) ?? null
					});
					responsesBySession.set(row.session_id as string, list);
				}
				const answersBySession = new Map<string, BackupAnswer[]>();
				for (const row of answerRows) {
					const list = answersBySession.get(row.session_id as string) ?? [];
					list.push({
						questionIndex: row.question_index as number,
						prompt: row.prompt as string,
						domain: row.domain as number,
						category: (row.category as string | null) ?? null,
						correctAnswer: (row.correct_answer as string) ?? '',
						userAnswer: (row.user_answer as string) ?? '',
						isCorrect: row.is_correct as number,
						questionId: (row.question_id as string | null) ?? null,
						objective: (row.objective as string | null) ?? null,
						responseJson: (row.response_json as string | null) ?? null,
						pointsEarned: Number(row.points_earned),
						pointsPossible: Number(row.points_possible)
					});
					answersBySession.set(row.session_id as string, list);
				}
				return {
					format: BACKUP_FORMAT,
					version: BACKUP_VERSION,
					courseId: scope.courseId,
					exportedAt: new Date().toISOString(),
					examDate,
					dueDateOverrides: overrideRows,
					sessions: sessionRows.map((row) => ({
						id: row.id as string,
						startedAt: row.started_at as string,
						completedAt: (row.completed_at as string | null) ?? null,
						type: row.type as string,
						domain: (row.domain as number | null) ?? null,
						totalQuestions: row.total_questions as number,
						correctAnswers: row.correct_answers as number,
						mode: row.mode as string,
						status: row.status as string,
						pointsEarned: Number(row.points_earned),
						pointsPossible: Number(row.points_possible),
						updatedAt: row.updated_at as string,
						assignmentId: (row.assignment_id as string | null) ?? null,
						elapsedSeconds: (row.elapsed_seconds as number | null) ?? null,
						durationSeconds: (row.duration_seconds as number | null) ?? null,
						state: (() => {
							const state = stateBySession.get(row.id as string);
							return state
								? {
										deadlineAt: (state.deadline_at as string | null) ?? null,
										currentIndex: state.current_index as number,
										questionsJson: state.questions_json as string,
										resultJson: (state.result_json as string | null) ?? null
									}
								: null;
						})(),
						responses: (responsesBySession.get(row.id as string) ?? []).sort(
							(a, b) => a.questionIndex - b.questionIndex
						),
						answers: (answersBySession.get(row.id as string) ?? []).sort(
							(a, b) => a.questionIndex - b.questionIndex
						)
					})),
					domainProgress: domainRows.map((row) => ({
						domain: row.domain as number,
						totalAttempted: row.total_attempted as number,
						totalCorrect: row.total_correct as number,
						pointsEarned: Number(row.points_earned),
						pointsPossible: Number(row.points_possible),
						lastReviewedAt: (row.last_reviewed_at as string | null) ?? null
					})),
					reviewCards: cardRows.map((row) => ({
						questionId: row.question_id as string,
						intervalDays: Number(row.interval_days),
						ease: Number(row.ease),
						lapses: row.lapses as number,
						dueAt: row.due_at as string,
						lastResult: (row.last_result as ReviewCardRow['lastResult']) ?? null,
						reviewCount: row.review_count as number,
						firstSeenAt: row.first_seen_at as string
					})),
					studyLog: logRows.map((row) => ({
						dateKey: row.date_key as string,
						questions: row.questions as number,
						sessions: row.sessions as number,
						updatedAt: row.updated_at as string
					})),
					submissions: submissionRows.map((row) => ({
						assignmentId: row.assignment_id as string,
						sessionId: row.session_id as string,
						earned: Number(row.earned),
						percentage: Number(row.percentage),
						completedAt: row.completed_at as string
					})),
					lessonCompletions: completionRows.map((row) => ({
						lessonId: row.lesson_id as string,
						completedAt: row.completed_at as string
					}))
				};
			},
			async importProgress(backup) {
				if (backup.courseId !== scope.courseId)
					throw new Error(
						`Backup is for course ${backup.courseId} but the active course is ${scope.courseId}.`
					);
				await sql.begin(async (tx) => {
					await wipeScopeProgress(tx, scope);
					// Configuration travels with the backup (exam date + due-date overrides).
					// The document is the source of truth: overrides absent from it are dropped.
					await tx`INSERT INTO course_meta (profile_id, course_id, key, value)
						VALUES (${scope.profileId}, ${scope.courseId}, 'exam_date', ${backup.examDate})
						ON CONFLICT (profile_id, course_id, key) DO UPDATE SET value = EXCLUDED.value`;
					await tx`DELETE FROM course_assignment_overrides
						WHERE profile_id = ${scope.profileId} AND course_id = ${scope.courseId}`;
					const assignmentRows =
						await tx`SELECT id FROM course_assignments WHERE course_id = ${scope.courseId}`;
					const knownAssignments = new Set(assignmentRows.map((row) => row.id as string));
					for (const [assignmentId, dueDate] of Object.entries(backup.dueDateOverrides)) {
						if (!knownAssignments.has(assignmentId)) continue;
						await tx`INSERT INTO course_assignment_overrides (profile_id, course_id, assignment_id, due_date, updated_at)
							VALUES (${scope.profileId}, ${scope.courseId}, ${assignmentId}, ${dueDate}, ${backup.exportedAt})
							ON CONFLICT (profile_id, course_id, assignment_id) DO UPDATE
							SET due_date = EXCLUDED.due_date, updated_at = EXCLUDED.updated_at`;
					}
					// Session ids are remapped so a backup can never collide with live rows.
					const sessionIdMap = new Map<string, string>();
					for (const session of backup.sessions) {
						const newId = crypto.randomUUID();
						sessionIdMap.set(session.id, newId);
						await tx`INSERT INTO quiz_sessions (id, started_at, completed_at, type, domain, total_questions, correct_answers, mode, status, points_earned, points_possible, updated_at, assignment_id, profile_id, course_id, elapsed_seconds, duration_seconds)
							VALUES (${newId}, ${session.startedAt}, ${session.completedAt}, ${session.type}, ${session.domain}, ${session.totalQuestions}, ${session.correctAnswers}, ${session.mode}, ${session.status}, ${session.pointsEarned}, ${session.pointsPossible}, ${session.updatedAt}, ${session.assignmentId}, ${scope.profileId}, ${scope.courseId}, ${session.elapsedSeconds}, ${session.durationSeconds})`;
						if (session.state)
							await tx`INSERT INTO quiz_session_state (session_id, schema_version, deadline_at, current_index, questions_json, result_json, updated_at)
								VALUES (${newId}, 1, ${session.state.deadlineAt}, ${session.state.currentIndex}, ${session.state.questionsJson}, ${session.state.resultJson}, ${session.updatedAt})`;
						for (const response of session.responses)
							await tx`INSERT INTO quiz_session_responses (session_id, question_index, response_json, flagged, retries, hint_used, answered_at)
								VALUES (${newId}, ${response.questionIndex}, ${response.responseJson}, ${response.flagged}, ${response.retries}, ${response.hintUsed}, ${response.answeredAt})`;
						for (const answer of session.answers)
							await tx`INSERT INTO quiz_answers (session_id, question_index, prompt, domain, category, correct_answer, user_answer, is_correct, question_id, objective, response_json, points_earned, points_possible, profile_id, course_id)
								VALUES (${newId}, ${answer.questionIndex}, ${answer.prompt}, ${answer.domain}, ${answer.category}, ${answer.correctAnswer}, ${answer.userAnswer}, ${answer.isCorrect}, ${answer.questionId}, ${answer.objective}, ${answer.responseJson}, ${answer.pointsEarned}, ${answer.pointsPossible}, ${scope.profileId}, ${scope.courseId})`;
					}
					for (const row of backup.domainProgress)
						await tx`INSERT INTO domain_progress (profile_id, course_id, domain, total_attempted, total_correct, points_earned, points_possible, last_reviewed_at)
							VALUES (${scope.profileId}, ${scope.courseId}, ${row.domain}, ${row.totalAttempted}, ${row.totalCorrect}, ${row.pointsEarned}, ${row.pointsPossible}, ${row.lastReviewedAt})
							ON CONFLICT (profile_id, course_id, domain) DO UPDATE
							SET total_attempted = EXCLUDED.total_attempted, total_correct = EXCLUDED.total_correct,
								points_earned = EXCLUDED.points_earned, points_possible = EXCLUDED.points_possible,
								last_reviewed_at = EXCLUDED.last_reviewed_at`;
					for (const card of backup.reviewCards)
						await tx`INSERT INTO review_cards (profile_id, course_id, question_id, interval_days, ease, lapses, due_at, last_result, review_count, first_seen_at)
							VALUES (${scope.profileId}, ${scope.courseId}, ${card.questionId}, ${card.intervalDays}, ${card.ease}, ${card.lapses}, ${card.dueAt}, ${card.lastResult}, ${card.reviewCount}, ${card.firstSeenAt})
							ON CONFLICT (profile_id, course_id, question_id) DO UPDATE
							SET interval_days = EXCLUDED.interval_days, ease = EXCLUDED.ease, lapses = EXCLUDED.lapses,
								due_at = EXCLUDED.due_at, last_result = EXCLUDED.last_result, review_count = EXCLUDED.review_count`;
					for (const day of backup.studyLog)
						await tx`INSERT INTO study_log (profile_id, date_key, questions, sessions, updated_at)
							VALUES (${scope.profileId}, ${day.dateKey}, ${day.questions}, ${day.sessions}, ${day.updatedAt})
							ON CONFLICT (profile_id, date_key) DO UPDATE
							SET questions = EXCLUDED.questions, sessions = EXCLUDED.sessions, updated_at = EXCLUDED.updated_at`;
					for (const submission of backup.submissions) {
						if (!knownAssignments.has(submission.assignmentId)) continue;
						await tx`INSERT INTO course_assignment_submissions (profile_id, assignment_id, session_id, earned, percentage, completed_at)
							VALUES (${scope.profileId}, ${submission.assignmentId}, ${sessionIdMap.get(submission.sessionId) ?? submission.sessionId}, ${submission.earned}, ${submission.percentage}, ${submission.completedAt})
							ON CONFLICT (profile_id, assignment_id, session_id) DO UPDATE
							SET earned = EXCLUDED.earned, percentage = EXCLUDED.percentage, completed_at = EXCLUDED.completed_at`;
					}
					const lessonRows =
						await tx`SELECT id FROM course_lessons WHERE course_id = ${scope.courseId}`;
					const knownLessons = new Set(lessonRows.map((row) => row.id as string));
					for (const completion of backup.lessonCompletions) {
						if (!knownLessons.has(completion.lessonId)) continue;
						await tx`INSERT INTO course_lesson_completions (profile_id, lesson_id, completed_at)
							VALUES (${scope.profileId}, ${completion.lessonId}, ${completion.completedAt})
							ON CONFLICT (profile_id, lesson_id) DO UPDATE SET completed_at = EXCLUDED.completed_at`;
					}
				});
				cache.invalidateScope(scope);
			},
			async getCourseModules() {
				return cache.read(cache.key(scope, 'course-modules'), async () => {
					const rows = await sql`SELECT id, week, title, description, position
						FROM course_modules
						WHERE course_id = ${scope.courseId}
						ORDER BY position`;
					return rows as unknown as CourseModule[];
				});
			},
			async getCourseLessons() {
				return cache.read(cache.key(scope, 'course-lessons'), async () => {
					const rows =
						await sql`SELECT id, module_id AS "moduleId", title, summary, content, objective_ids AS "objectiveIds", position
						FROM course_lessons
						WHERE course_id = ${scope.courseId}
						ORDER BY position`;
					return (rows as unknown as (CourseLesson & { objectiveIds: string | null })[]).map(
						(lesson) => ({
							...lesson,
							// Parse the stored JSON explicitly — never cast the string to the array type.
							objectiveIds: lesson.objectiveIds
								? (JSON.parse(lesson.objectiveIds) as string[])
								: undefined
						})
					);
				});
			},
			async getCourseAssignments() {
				return cache.read(cache.key(scope, 'course-assignments'), async () => {
					const rows =
						await sql`SELECT id, module_id AS "moduleId", title, description, kind, category, points, count, domain, mode, duration_minutes AS "durationMinutes", due_offset_days AS "dueOffsetDays", position
						FROM course_assignments
						WHERE course_id = ${scope.courseId}
						ORDER BY position`;
					return rows as unknown as CourseAssignment[];
				});
			},
			async getLessonCompletions() {
				const rows =
					await sql`SELECT lesson_id FROM course_lesson_completions WHERE profile_id = ${scope.profileId}`;
				return new Set(rows.map((row) => row.lesson_id as string));
			},
			async setLessonCompleted(lessonId, completed) {
				if (completed)
					await sql`INSERT INTO course_lesson_completions (profile_id, lesson_id, completed_at)
						VALUES (${scope.profileId}, ${lessonId}, ${new Date().toISOString()})
						ON CONFLICT (profile_id, lesson_id) DO UPDATE SET completed_at = EXCLUDED.completed_at`;
				else
					await sql`DELETE FROM course_lesson_completions WHERE profile_id = ${scope.profileId} AND lesson_id = ${lessonId}`;
				cache.invalidateScope(scope);
			},
			async getSubmissions() {
				cache.bypass();
				const rows =
					await sql`SELECT assignment_id AS "assignmentId", session_id AS "sessionId", earned, percentage, completed_at AS "completedAt"
					FROM course_assignment_submissions
					WHERE profile_id = ${scope.profileId}`;
				return rows as unknown as SubmissionRecord[];
			},
			async recordSubmission(submission) {
				await sql`INSERT INTO course_assignment_submissions (profile_id, assignment_id, session_id, earned, percentage, completed_at)
					VALUES (${scope.profileId}, ${submission.assignmentId}, ${submission.sessionId}, ${submission.earned}, ${submission.percentage}, ${submission.completedAt})
					ON CONFLICT (profile_id, assignment_id, session_id) DO UPDATE
					SET earned = EXCLUDED.earned, percentage = EXCLUDED.percentage, completed_at = EXCLUDED.completed_at`;
				cache.invalidateScope(scope);
			},
			async getGoogleOAuth() {
				const rows =
					await sql`SELECT access_token AS "accessToken", refresh_token AS "refreshToken", expires_at AS "expiresAt", email, calendar_id AS "calendarId"
					FROM google_oauth
					WHERE profile_id = ${scope.profileId}`;
				return rows.length > 0 ? (rows[0] as unknown as StoredGoogleOAuth) : null;
			},
			async saveGoogleOAuth(oauth) {
				const now = new Date().toISOString();
				await sql`INSERT INTO google_oauth (profile_id, access_token, refresh_token, expires_at, email, calendar_id, created_at, updated_at)
					VALUES (${scope.profileId}, ${oauth.accessToken}, ${oauth.refreshToken}, ${oauth.expiresAt}, ${oauth.email}, ${oauth.calendarId ?? null}, ${now}, ${now})
					ON CONFLICT (profile_id) DO UPDATE
					SET access_token = EXCLUDED.access_token, refresh_token = EXCLUDED.refresh_token,
						expires_at = EXCLUDED.expires_at, email = EXCLUDED.email,
						calendar_id = COALESCE(EXCLUDED.calendar_id, google_oauth.calendar_id),
						updated_at = EXCLUDED.updated_at`;
			},
			async clearGoogleOAuth() {
				await sql`DELETE FROM google_oauth WHERE profile_id = ${scope.profileId}`;
			},
			async getSyncedEvents() {
				const rows =
					await sql`SELECT source, event_id AS "eventId", summary, due_date AS "dueDate", synced_at AS "syncedAt"
					FROM google_synced_events
					WHERE profile_id = ${scope.profileId}
					ORDER BY source`;
				return rows as unknown as StoredSyncedEvent[];
			},
			async recordSyncedEvent(source, eventId, summary, dueDate, syncedAt) {
				await sql`INSERT INTO google_synced_events (profile_id, source, event_id, summary, due_date, synced_at)
					VALUES (${scope.profileId}, ${source}, ${eventId}, ${summary}, ${dueDate}, ${syncedAt})
					ON CONFLICT (profile_id, source) DO UPDATE
					SET event_id = EXCLUDED.event_id, summary = EXCLUDED.summary,
						due_date = EXCLUDED.due_date, synced_at = EXCLUDED.synced_at`;
			},
			async removeSyncedEvent(source) {
				await sql`DELETE FROM google_synced_events WHERE profile_id = ${scope.profileId} AND source = ${source}`;
			},
			getCacheStats(): ScopedCacheStats {
				return cache.getStats();
			},
			async close() {
				await sql.end({ timeout: 5 });
			}
		};
	};

	return make(DEFAULT_SCOPE);
}

/**
 * Test-database guard: the suite runs against an isolated Postgres supplied
 * via TEST_DATABASE_URL and must never touch the runtime DATABASE_URL.
 */
export function testDatabaseUrl(): string {
	const url = process.env.TEST_DATABASE_URL;
	if (!url)
		throw new Error(
			'TEST_DATABASE_URL is not set. Point it at an isolated PostgreSQL database (see web/.env.example); tests must never run against DATABASE_URL.'
		);
	const runtimeUrl = process.env.DATABASE_URL;
	if (runtimeUrl && runtimeUrl === url)
		throw new Error('TEST_DATABASE_URL must differ from DATABASE_URL — tests wipe all data.');
	return url;
}

/**
 * App-wide singleton, created on first use rather than at module scope. Lazy
 * because the SvelteKit build's analyse step imports server modules without a
 * runtime environment — resolving DATABASE_URL eagerly would fail `vite build`.
 * Under vitest it binds to the isolated test database instead, mirroring the
 * old SQLite repository's `:memory:`-under-vitest behavior.
 */
let singleton: QuizRepository | null = null;
export function quizRepository(): QuizRepository {
	singleton ??= createPgQuizRepository(process.env.VITEST ? testDatabaseUrl() : undefined);
	return singleton;
}
function parseStoredSession(
	row: SessionRow & StateRow,
	responseRows: {
		question_index: number;
		response_json: string | null;
		flagged: number;
		retries: number;
		hint_used: number;
	}[]
): StoredSession {
	const responses: Record<number, QuestionResponse> = {};
	const retries: Record<number, number> = {};
	const hints: Record<number, boolean> = {};
	const flags: number[] = [];
	for (const response of responseRows) {
		if (response.response_json)
			responses[response.question_index] = JSON.parse(response.response_json) as QuestionResponse;
		retries[response.question_index] = response.retries;
		hints[response.question_index] = response.hint_used === 1;
		if (response.flagged) flags.push(response.question_index);
	}
	return {
		summary: row,
		deadlineAt: row.deadline_at,
		currentIndex: row.current_index,
		questions: JSON.parse(row.questions_json) as QuestionDefinition[],
		result: row.result_json ? (JSON.parse(row.result_json) as QuizResult) : null,
		responses,
		retries,
		hints,
		flags
	};
}
