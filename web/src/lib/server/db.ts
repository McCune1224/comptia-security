import Database from 'better-sqlite3';
import fs from 'node:fs';
import path from 'node:path';
import type { QuestionResponse, QuizResult, SessionMode, SessionStatus, SessionType } from '$lib/types';
import type { QuestionDefinition } from './question-bank';
import { COURSE_DEFINITION, defaultExamDate, type CourseAssignment, type CourseLesson, type CourseModule, type SubmissionRecord } from './course';

export const DB_PATH = path.resolve(process.cwd(), 'data/quiz.db');

type SessionRow = {
	id: string; started_at: string; completed_at: string | null; type: SessionType; domain: number | null;
	mode: SessionMode; status: SessionStatus; points_earned: number; points_possible: number; updated_at: string;
	assignment_id: string | null;
};
type StateRow = { deadline_at: string | null; current_index: number; questions_json: string; result_json: string | null };

export interface StoredGoogleOAuth {
	accessToken: string;
	refreshToken: string;
	expiresAt: number; // epoch ms
	email: string;
	calendarId: string | null;
}

export interface StoredSyncedEvent {
	source: string;
	eventId: string;
	summary: string;
	dueDate: string;
	syncedAt: string;
}

export interface StoredSession {
	summary: SessionRow;
	deadlineAt: string | null;
	currentIndex: number;
	questions: QuestionDefinition[];
	result: QuizResult | null;
	responses: Record<number, QuestionResponse>;
	flags: number[];
}

export interface ReviewCardRow {
	questionId: string;
	intervalDays: number;
	ease: number;
	lapses: number;
	dueAt: string; // local calendar date YYYY-MM-DD
	lastResult: 'correct' | 'wrong' | null;
	reviewCount: number;
	firstSeenAt: string;
}

export interface StudyDayRow {
	dateKey: string;
	questions: number;
	sessions: number;
	updatedAt: string;
}

export interface AnswerHistoryRow {
	questionId: string;
	isCorrect: boolean;
	completedAt: string;
}

export interface QuizRepository {
	createSession(session: { id: string; type: SessionType; mode: SessionMode; domain: number | null; startedAt: string; deadlineAt: string | null; questions: QuestionDefinition[]; assignmentId?: string | null }): void;
	getSession(id: string): StoredSession | null;
	getActiveSession(): StoredSession | null;
	saveResponse(id: string, index: number, response: QuestionResponse, answeredAt: string): void;
	updateState(id: string, currentIndex?: number, flag?: { questionIndex: number; value: boolean }, updatedAt?: string): void;
	abandon(id: string, updatedAt: string): boolean;
	complete(id: string, result: QuizResult, answers: { index: number; question: QuestionDefinition; response: QuestionResponse | null; points: number }[], completedAt: string): QuizResult;
	getAllDomainProgress(): Record<number, { attempted: number; correct: number; earnedPoints: number; possiblePoints: number; percentage: number; lastReviewed: string | null }>;
	getRecentSessions(limit?: number): SessionRow[];
	getAllCompletedSessions(): SessionRow[];
	getWeakTopics(): { domain: number; objective: string; earnedPoints: number; possiblePoints: number; percentage: number; severity: 'high' | 'review' }[];
	getReviewCards(): ReviewCardRow[];
	upsertReviewCard(card: ReviewCardRow): void;
	getStudyLog(): StudyDayRow[];
	recordStudyDay(dateKey: string, questions: number, updatedAt: string): void;
	getAnswerHistory(): AnswerHistoryRow[];
	getAnsweredQuestionIds(): string[];
	getObjectiveProgress(): { objective: string; attempted: number; earnedPoints: number; possiblePoints: number }[];
	getExamDate(): string;
	setExamDate(examDate: string): void;
	getCourseModules(): CourseModule[];
	getCourseLessons(): CourseLesson[];
	getCourseAssignments(): CourseAssignment[];
	getLessonCompletions(): Set<string>;
	setLessonCompleted(lessonId: string, completed: boolean): void;
	getSubmissions(): SubmissionRecord[];
	recordSubmission(submission: SubmissionRecord): void;
	getGoogleOAuth(): StoredGoogleOAuth | null;
	saveGoogleOAuth(oauth: { accessToken: string; refreshToken: string; expiresAt: number; email: string; calendarId?: string | null }): void;
	clearGoogleOAuth(): void;
	getSyncedEvents(): StoredSyncedEvent[];
	recordSyncedEvent(source: string, eventId: string, summary: string, dueDate: string, syncedAt: string): void;
	removeSyncedEvent(source: string): void;
	close(): void;
}

function parseStoredSession(row: SessionRow & StateRow, responseRows: { question_index: number; response_json: string; flagged: number }[]): StoredSession {
	const responses: Record<number, QuestionResponse> = {};
	const flags: number[] = [];
	for (const response of responseRows) {
		if (response.response_json) responses[response.question_index] = JSON.parse(response.response_json) as QuestionResponse;
		if (response.flagged) flags.push(response.question_index);
	}
	return { summary: row, deadlineAt: row.deadline_at, currentIndex: row.current_index, questions: JSON.parse(row.questions_json) as QuestionDefinition[], result: row.result_json ? JSON.parse(row.result_json) as QuizResult : null, responses, flags };
}

function seedCourse(db: Database.Database): void {
	const seed = db.transaction(() => {
		if (!db.prepare("SELECT 1 FROM course_meta WHERE key = 'exam_date'").get()) {
			db.prepare('INSERT INTO course_meta (key, value) VALUES (?, ?)').run('exam_date', defaultExamDate());
		}
		const insertModule = db.prepare('INSERT OR IGNORE INTO course_modules (id, week, title, description, position) VALUES (?, ?, ?, ?, ?)');
		for (const module of COURSE_DEFINITION.modules) insertModule.run(module.id, module.week, module.title, module.description, module.position);
		const insertLesson = db.prepare('INSERT INTO course_lessons (id, module_id, title, summary, content, position) VALUES (?, ?, ?, ?, ?, ?) ON CONFLICT(id) DO UPDATE SET module_id = excluded.module_id, title = excluded.title, summary = excluded.summary, content = excluded.content, position = excluded.position');
		for (const lesson of COURSE_DEFINITION.lessons) insertLesson.run(lesson.id, lesson.moduleId, lesson.title, lesson.summary, lesson.content, lesson.position);
		const insertAssignment = db.prepare('INSERT OR IGNORE INTO course_assignments (id, module_id, title, description, kind, category, points, count, domain, mode, duration_minutes, due_offset_days, position) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)');
		for (const assignment of COURSE_DEFINITION.assignments) insertAssignment.run(assignment.id, assignment.moduleId, assignment.title, assignment.description, assignment.kind, assignment.category, assignment.points, assignment.count, assignment.domain, assignment.mode, assignment.durationMinutes, assignment.dueOffsetDays, assignment.position);
	});
	seed();
}

export function createQuizRepository(filename = process.env.QUIZ_DB_PATH ?? DB_PATH): QuizRepository {
	if (filename !== ':memory:') fs.mkdirSync(path.dirname(filename), { recursive: true });
	const db = new Database(filename);
	db.pragma('foreign_keys = ON');
	db.pragma('journal_mode = WAL');
	db.exec(`
		CREATE TABLE IF NOT EXISTS quiz_sessions (id TEXT PRIMARY KEY, started_at TEXT NOT NULL, completed_at TEXT, type TEXT NOT NULL, domain INTEGER, total_questions INTEGER NOT NULL DEFAULT 0, correct_answers INTEGER NOT NULL DEFAULT 0);
		CREATE TABLE IF NOT EXISTS quiz_answers (id INTEGER PRIMARY KEY AUTOINCREMENT, session_id TEXT NOT NULL, question_index INTEGER NOT NULL, prompt TEXT NOT NULL DEFAULT '', domain INTEGER NOT NULL, category TEXT, correct_answer TEXT NOT NULL DEFAULT '', user_answer TEXT NOT NULL DEFAULT '', is_correct INTEGER NOT NULL DEFAULT 0, FOREIGN KEY (session_id) REFERENCES quiz_sessions(id));
		CREATE TABLE IF NOT EXISTS domain_progress (domain INTEGER PRIMARY KEY, total_attempted INTEGER NOT NULL DEFAULT 0, total_correct INTEGER NOT NULL DEFAULT 0, last_reviewed_at TEXT);
	`);
	const columns = (table: string) => new Set((db.prepare(`PRAGMA table_info(${table})`).all() as { name: string }[]).map((column) => column.name));
	const sessionColumns = columns('quiz_sessions');
	const answerColumns = columns('quiz_answers');
	const progressColumns = columns('domain_progress');
	const migrate = db.transaction(() => {
		for (const [name, sql] of [['mode', "TEXT NOT NULL DEFAULT 'practice'"], ['status', "TEXT NOT NULL DEFAULT 'active'"], ['points_earned', 'REAL NOT NULL DEFAULT 0'], ['points_possible', 'REAL NOT NULL DEFAULT 0'], ['updated_at', "TEXT NOT NULL DEFAULT ''"], ['assignment_id', 'TEXT']] as const) if (!sessionColumns.has(name)) db.exec(`ALTER TABLE quiz_sessions ADD COLUMN ${name} ${sql}`);
		for (const [name, sql] of [['question_id', 'TEXT'], ['objective', 'TEXT'], ['response_json', 'TEXT'], ['points_earned', 'REAL NOT NULL DEFAULT 0'], ['points_possible', 'REAL NOT NULL DEFAULT 0']] as const) if (!answerColumns.has(name)) db.exec(`ALTER TABLE quiz_answers ADD COLUMN ${name} ${sql}`);
		for (const [name, sql] of [['points_earned', 'REAL NOT NULL DEFAULT 0'], ['points_possible', 'REAL NOT NULL DEFAULT 0']] as const) if (!progressColumns.has(name)) db.exec(`ALTER TABLE domain_progress ADD COLUMN ${name} ${sql}`);
		db.exec(`CREATE TABLE IF NOT EXISTS quiz_session_state (session_id TEXT PRIMARY KEY, schema_version INTEGER NOT NULL, deadline_at TEXT, current_index INTEGER NOT NULL DEFAULT 0, questions_json TEXT NOT NULL, result_json TEXT, updated_at TEXT NOT NULL, FOREIGN KEY (session_id) REFERENCES quiz_sessions(id));
		CREATE TABLE IF NOT EXISTS quiz_session_responses (session_id TEXT NOT NULL, question_index INTEGER NOT NULL, response_json TEXT, flagged INTEGER NOT NULL DEFAULT 0, answered_at TEXT, PRIMARY KEY(session_id, question_index), FOREIGN KEY (session_id) REFERENCES quiz_sessions(id));
		CREATE TABLE IF NOT EXISTS review_cards (question_id TEXT PRIMARY KEY, interval_days REAL NOT NULL DEFAULT 0, ease REAL NOT NULL DEFAULT 2.5, lapses INTEGER NOT NULL DEFAULT 0, due_at TEXT NOT NULL, last_result TEXT, review_count INTEGER NOT NULL DEFAULT 0, first_seen_at TEXT NOT NULL);
		CREATE TABLE IF NOT EXISTS study_log (date_key TEXT PRIMARY KEY, questions INTEGER NOT NULL DEFAULT 0, sessions INTEGER NOT NULL DEFAULT 0, updated_at TEXT NOT NULL);
		CREATE TABLE IF NOT EXISTS course_meta (key TEXT PRIMARY KEY, value TEXT NOT NULL);
		CREATE TABLE IF NOT EXISTS course_modules (id TEXT PRIMARY KEY, week INTEGER NOT NULL, title TEXT NOT NULL, description TEXT NOT NULL, position INTEGER NOT NULL);
		CREATE TABLE IF NOT EXISTS course_lessons (id TEXT PRIMARY KEY, module_id TEXT NOT NULL, title TEXT NOT NULL, summary TEXT NOT NULL, content TEXT NOT NULL DEFAULT '', position INTEGER NOT NULL);
		CREATE TABLE IF NOT EXISTS course_assignments (id TEXT PRIMARY KEY, module_id TEXT NOT NULL, title TEXT NOT NULL, description TEXT NOT NULL, kind TEXT NOT NULL, category TEXT NOT NULL, points REAL NOT NULL, count INTEGER NOT NULL, domain INTEGER, mode TEXT NOT NULL, duration_minutes INTEGER NOT NULL, due_offset_days INTEGER NOT NULL, position INTEGER NOT NULL);
		CREATE TABLE IF NOT EXISTS course_assignment_submissions (assignment_id TEXT NOT NULL, session_id TEXT NOT NULL, earned REAL NOT NULL, percentage REAL NOT NULL, completed_at TEXT NOT NULL, PRIMARY KEY (assignment_id, session_id));
		CREATE TABLE IF NOT EXISTS course_lesson_completions (lesson_id TEXT PRIMARY KEY, completed_at TEXT NOT NULL);
		CREATE TABLE IF NOT EXISTS google_oauth (id INTEGER PRIMARY KEY CHECK (id = 1), access_token TEXT NOT NULL, refresh_token TEXT NOT NULL, expires_at INTEGER NOT NULL, email TEXT NOT NULL, calendar_id TEXT, created_at TEXT NOT NULL, updated_at TEXT NOT NULL);
		CREATE TABLE IF NOT EXISTS google_synced_events (source TEXT PRIMARY KEY, event_id TEXT NOT NULL, summary TEXT NOT NULL, due_date TEXT NOT NULL, synced_at TEXT NOT NULL);`);
		db.prepare("UPDATE quiz_sessions SET mode = COALESCE(NULLIF(mode, ''), 'practice'), status = CASE WHEN completed_at IS NOT NULL THEN 'completed' WHEN id NOT IN (SELECT session_id FROM quiz_session_state) THEN 'abandoned' ELSE 'active' END, points_earned = CASE WHEN completed_at IS NOT NULL THEN correct_answers ELSE points_earned END, points_possible = CASE WHEN completed_at IS NOT NULL THEN total_questions ELSE points_possible END, updated_at = COALESCE(NULLIF(updated_at, ''), started_at)").run();
		db.prepare('UPDATE quiz_answers SET points_earned = is_correct, points_possible = 1 WHERE points_possible = 0').run();
		db.pragma('user_version = 5');
	});
	if (db.pragma('user_version', { simple: true }) !== 5) migrate();
	seedCourse(db);
	const readSession = (id: string): StoredSession | null => {
		const row = db.prepare('SELECT s.*, st.deadline_at, st.current_index, st.questions_json, st.result_json FROM quiz_sessions s JOIN quiz_session_state st ON st.session_id = s.id WHERE s.id = ?').get(id) as (SessionRow & StateRow) | undefined;
		if (!row) return null;
		return parseStoredSession(row, db.prepare('SELECT question_index, response_json, flagged FROM quiz_session_responses WHERE session_id = ?').all(id) as { question_index: number; response_json: string; flagged: number }[]);
	};
	return {
		createSession(session) {
			const create = db.transaction(() => {
				db.prepare('INSERT INTO quiz_sessions (id, started_at, type, domain, total_questions, mode, status, updated_at, assignment_id) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)').run(session.id, session.startedAt, session.type, session.domain, session.questions.length, session.mode, 'active', session.startedAt, session.assignmentId ?? null);
				db.prepare('INSERT INTO quiz_session_state (session_id, schema_version, deadline_at, current_index, questions_json, updated_at) VALUES (?, 1, ?, 0, ?, ?)').run(session.id, session.deadlineAt, JSON.stringify(session.questions), session.startedAt);
			}); create();
		},
		getSession: readSession,
		getActiveSession() {
			const row = db.prepare("SELECT id FROM quiz_sessions WHERE status = 'active' ORDER BY started_at DESC LIMIT 1").get() as { id: string } | undefined;
			return row ? readSession(row.id) : null;
		},
		saveResponse(id, index, response, answeredAt) { db.prepare('INSERT INTO quiz_session_responses (session_id, question_index, response_json, flagged, answered_at) VALUES (?, ?, ?, 0, ?) ON CONFLICT(session_id, question_index) DO UPDATE SET response_json = excluded.response_json, answered_at = excluded.answered_at').run(id, index, JSON.stringify(response), answeredAt); db.prepare('UPDATE quiz_sessions SET updated_at = ? WHERE id = ?').run(answeredAt, id); },
		updateState(id, currentIndex, flag, updatedAt = new Date().toISOString()) {
			const update = db.transaction(() => {
				if (currentIndex !== undefined) db.prepare('UPDATE quiz_session_state SET current_index = ?, updated_at = ? WHERE session_id = ?').run(currentIndex, updatedAt, id);
				if (flag) db.prepare('INSERT INTO quiz_session_responses (session_id, question_index, flagged) VALUES (?, ?, ?) ON CONFLICT(session_id, question_index) DO UPDATE SET flagged = excluded.flagged').run(id, flag.questionIndex, flag.value ? 1 : 0);
				db.prepare('UPDATE quiz_sessions SET updated_at = ? WHERE id = ?').run(updatedAt, id);
			}); update();
		},
		abandon(id, updatedAt) { return db.prepare("UPDATE quiz_sessions SET status = 'abandoned', updated_at = ? WHERE id = ? AND status = 'active'").run(updatedAt, id).changes === 1; },
		complete(id, result, answers, completedAt) {
			const finalize = db.transaction(() => {
				const existing = db.prepare('SELECT result_json FROM quiz_session_state WHERE session_id = ?').get(id) as { result_json: string | null } | undefined;
				if (existing?.result_json) return JSON.parse(existing.result_json) as QuizResult;
				for (const answer of answers) db.prepare('INSERT INTO quiz_answers (session_id, question_index, prompt, domain, category, correct_answer, user_answer, is_correct, question_id, objective, response_json, points_earned, points_possible) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)').run(id, answer.index, answer.question.prompt, answer.question.domain, answer.question.objective, '', JSON.stringify(answer.response), answer.points === 1 ? 1 : 0, answer.question.id, answer.question.objective, JSON.stringify(answer.response), answer.points, 1);
				for (const domain of [1, 2, 3, 4, 5]) { const breakdown = result.domainBreakdown[domain as 1 | 2 | 3 | 4 | 5]; if (breakdown.possiblePoints) db.prepare('INSERT INTO domain_progress (domain, total_attempted, total_correct, points_earned, points_possible, last_reviewed_at) VALUES (?, ?, ?, ?, ?, ?) ON CONFLICT(domain) DO UPDATE SET total_attempted = total_attempted + excluded.total_attempted, total_correct = total_correct + excluded.total_correct, points_earned = points_earned + excluded.points_earned, points_possible = points_possible + excluded.points_possible, last_reviewed_at = excluded.last_reviewed_at').run(domain, breakdown.totalQuestions, breakdown.fullyCorrect, breakdown.earnedPoints, breakdown.possiblePoints, completedAt); }
				db.prepare("UPDATE quiz_sessions SET status = 'completed', completed_at = ?, points_earned = ?, points_possible = ?, correct_answers = ?, total_questions = ?, updated_at = ? WHERE id = ? AND status = 'active'").run(completedAt, result.earnedPoints, result.possiblePoints, result.fullyCorrect, result.totalQuestions, completedAt, id);
				db.prepare('UPDATE quiz_session_state SET result_json = ?, updated_at = ? WHERE session_id = ?').run(JSON.stringify(result), completedAt, id);
				return result;
			}); return finalize();
		},
		getAllDomainProgress() { const result: Record<number, { attempted: number; correct: number; earnedPoints: number; possiblePoints: number; percentage: number; lastReviewed: string | null }> = {}; for (const row of db.prepare('SELECT * FROM domain_progress').all() as { domain: number; total_attempted: number; total_correct: number; points_earned: number; points_possible: number; last_reviewed_at: string | null }[]) result[row.domain] = { attempted: row.total_attempted, correct: row.total_correct, earnedPoints: row.points_earned, possiblePoints: row.points_possible, percentage: row.points_possible ? Math.round(row.points_earned / row.points_possible * 1000) / 10 : 0, lastReviewed: row.last_reviewed_at }; return result; },
		getRecentSessions(limit = 10) { return db.prepare("SELECT * FROM quiz_sessions WHERE status = 'completed' ORDER BY completed_at DESC LIMIT ?").all(limit) as SessionRow[]; },
		getAllCompletedSessions() { return db.prepare("SELECT * FROM quiz_sessions WHERE status = 'completed' ORDER BY completed_at DESC").all() as SessionRow[]; },
		getWeakTopics() { return (db.prepare("SELECT domain, objective, SUM(points_earned) earnedPoints, SUM(points_possible) possiblePoints FROM quiz_answers WHERE objective IS NOT NULL GROUP BY domain, objective HAVING SUM(points_possible) >= 3 AND SUM(points_earned) * 1.0 / SUM(points_possible) < .85 ORDER BY earnedPoints * 1.0 / possiblePoints").all() as { domain: number; objective: string; earnedPoints: number; possiblePoints: number }[]).map((row) => ({ ...row, percentage: Math.round(row.earnedPoints / row.possiblePoints * 1000) / 10, severity: row.earnedPoints / row.possiblePoints < .7 ? 'high' : 'review' })); },
		getReviewCards() { return db.prepare('SELECT question_id AS questionId, interval_days AS intervalDays, ease, lapses, due_at AS dueAt, last_result AS lastResult, review_count AS reviewCount, first_seen_at AS firstSeenAt FROM review_cards').all() as unknown as ReviewCardRow[]; },
		upsertReviewCard(card) { db.prepare('INSERT INTO review_cards (question_id, interval_days, ease, lapses, due_at, last_result, review_count, first_seen_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?) ON CONFLICT(question_id) DO UPDATE SET interval_days = excluded.interval_days, ease = excluded.ease, lapses = excluded.lapses, due_at = excluded.due_at, last_result = excluded.last_result, review_count = excluded.review_count').run(card.questionId, card.intervalDays, card.ease, card.lapses, card.dueAt, card.lastResult, card.reviewCount, card.firstSeenAt); },
		getStudyLog() { return db.prepare('SELECT date_key AS dateKey, questions, sessions, updated_at AS updatedAt FROM study_log ORDER BY date_key').all() as unknown as StudyDayRow[]; },
		recordStudyDay(dateKey, questions, updatedAt) { db.prepare('INSERT INTO study_log (date_key, questions, sessions, updated_at) VALUES (?, ?, 1, ?) ON CONFLICT(date_key) DO UPDATE SET questions = questions + excluded.questions, sessions = sessions + 1, updated_at = excluded.updated_at').run(dateKey, questions, updatedAt); },
		getAnswerHistory() { return db.prepare("SELECT a.question_id AS questionId, a.is_correct AS isCorrect, s.completed_at AS completedAt FROM quiz_answers a JOIN quiz_sessions s ON s.id = a.session_id WHERE a.question_id IS NOT NULL AND s.status = 'completed'").all() as unknown as AnswerHistoryRow[]; },
		getAnsweredQuestionIds() { return (db.prepare('SELECT DISTINCT question_id FROM quiz_answers WHERE question_id IS NOT NULL').all() as { question_id: string }[]).map((row) => row.question_id); },
		getObjectiveProgress() { return db.prepare('SELECT objective, COUNT(*) AS attempted, SUM(points_earned) AS earnedPoints, SUM(points_possible) AS possiblePoints FROM quiz_answers WHERE objective IS NOT NULL GROUP BY objective').all() as { objective: string; attempted: number; earnedPoints: number; possiblePoints: number }[]; },
		getExamDate() { return (db.prepare("SELECT value FROM course_meta WHERE key = 'exam_date'").get() as { value: string } | undefined)?.value ?? defaultExamDate(); },
		setExamDate(examDate) { db.prepare("INSERT INTO course_meta (key, value) VALUES ('exam_date', ?) ON CONFLICT(key) DO UPDATE SET value = excluded.value").run(examDate); },
		getCourseModules() { return db.prepare('SELECT id, week, title, description, position FROM course_modules ORDER BY position').all() as CourseModule[]; },
		getCourseLessons() { return db.prepare('SELECT id, module_id AS moduleId, title, summary, content, position FROM course_lessons ORDER BY position').all() as unknown as CourseLesson[]; },
		getCourseAssignments() { return db.prepare('SELECT id, module_id AS moduleId, title, description, kind, category, points, count, domain, mode, duration_minutes AS durationMinutes, due_offset_days AS dueOffsetDays, position FROM course_assignments ORDER BY position').all() as unknown as CourseAssignment[]; },
		getLessonCompletions() { return new Set((db.prepare('SELECT lesson_id FROM course_lesson_completions').all() as { lesson_id: string }[]).map((row) => row.lesson_id)); },
		setLessonCompleted(lessonId, completed) { if (completed) db.prepare('INSERT INTO course_lesson_completions (lesson_id, completed_at) VALUES (?, ?) ON CONFLICT(lesson_id) DO UPDATE SET completed_at = excluded.completed_at').run(lessonId, new Date().toISOString()); else db.prepare('DELETE FROM course_lesson_completions WHERE lesson_id = ?').run(lessonId); },
		getSubmissions() { return db.prepare('SELECT assignment_id AS assignmentId, session_id AS sessionId, earned, percentage, completed_at AS completedAt FROM course_assignment_submissions').all() as unknown as SubmissionRecord[]; },
		recordSubmission(submission) { db.prepare('INSERT INTO course_assignment_submissions (assignment_id, session_id, earned, percentage, completed_at) VALUES (?, ?, ?, ?, ?) ON CONFLICT(assignment_id, session_id) DO UPDATE SET earned = excluded.earned, percentage = excluded.percentage, completed_at = excluded.completed_at').run(submission.assignmentId, submission.sessionId, submission.earned, submission.percentage, submission.completedAt); },
		getGoogleOAuth() {
			const row = db
				.prepare('SELECT access_token AS accessToken, refresh_token AS refreshToken, expires_at AS expiresAt, email, calendar_id AS calendarId FROM google_oauth WHERE id = 1')
				.get() as StoredGoogleOAuth | undefined;
			return row ?? null;
		},
		saveGoogleOAuth(oauth) {
			const now = new Date().toISOString();
			db.prepare('INSERT INTO google_oauth (id, access_token, refresh_token, expires_at, email, calendar_id, created_at, updated_at) VALUES (1, ?, ?, ?, ?, ?, ?, ?) ON CONFLICT(id) DO UPDATE SET access_token = excluded.access_token, refresh_token = excluded.refresh_token, expires_at = excluded.expires_at, email = excluded.email, calendar_id = COALESCE(excluded.calendar_id, google_oauth.calendar_id), updated_at = excluded.updated_at').run(oauth.accessToken, oauth.refreshToken, oauth.expiresAt, oauth.email, oauth.calendarId ?? null, now, now);
		},
		clearGoogleOAuth() { db.prepare('DELETE FROM google_oauth WHERE id = 1').run(); },
		getSyncedEvents() { return db.prepare('SELECT source, event_id AS eventId, summary, due_date AS dueDate, synced_at AS syncedAt FROM google_synced_events ORDER BY source').all() as StoredSyncedEvent[]; },
		recordSyncedEvent(source, eventId, summary, dueDate, syncedAt) { db.prepare('INSERT INTO google_synced_events (source, event_id, summary, due_date, synced_at) VALUES (?, ?, ?, ?, ?) ON CONFLICT(source) DO UPDATE SET event_id = excluded.event_id, summary = excluded.summary, due_date = excluded.due_date, synced_at = excluded.synced_at').run(source, eventId, summary, dueDate, syncedAt); },
		removeSyncedEvent(source) { db.prepare('DELETE FROM google_synced_events WHERE source = ?').run(source); },
		close() { db.close(); }
	};
}

export const quizRepository = createQuizRepository(process.env.VITEST ? ':memory:' : undefined);
