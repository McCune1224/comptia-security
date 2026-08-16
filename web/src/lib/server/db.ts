import Database from 'better-sqlite3';
import crypto from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';
import type {
	CourseId,
	QuestionResponse,
	QuizResult,
	SessionMode,
	SessionStatus,
	SessionType
} from '$lib/types';
import type { QuestionDefinition } from './question-bank';
import {
	ACTIVE_COURSES,
	COURSES,
	defaultExamDate,
	type CourseAssignment,
	type CourseLesson,
	type CourseModule,
	type SubmissionRecord
} from './course';
import { ScopedReadCache, type ScopedCacheStats } from './scoped-cache';

export const DB_PATH = path.resolve(process.cwd(), 'data/quiz.db');

/** Hard cap on profiles (local study app; two users). */
export const MAX_PROFILES = 2;

/** Who the current request is acting as: a profile plus a course. */
export interface Scope {
	profileId: string;
	courseId: CourseId;
}

export const DEFAULT_SCOPE: Scope = { profileId: 'default', courseId: 'secp-701' };

export interface ProfileRow {
	id: string;
	name: string;
	color: string;
	createdAt: string;
	/** The course this profile is currently studying (drives profile→course coupling). */
	courseId: CourseId;
}

type SessionRow = {
	id: string;
	started_at: string;
	completed_at: string | null;
	type: SessionType;
	domain: number | null;
	mode: SessionMode;
	status: SessionStatus;
	points_earned: number;
	points_possible: number;
	updated_at: string;
	assignment_id: string | null;
	elapsed_seconds: number | null;
	duration_seconds: number | null;
};
type StateRow = {
	deadline_at: string | null;
	current_index: number;
	questions_json: string;
	result_json: string | null;
};

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
	/** Practice-mode retry count per question index (0 = first attempt). */
	retries: Record<number, number>;
	/** Practice-mode hint revealed per question index. */
	hints: Record<number, boolean>;
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
	// Profile management (global — not scope-filtered).
	getProfiles(): ProfileRow[];
	createProfile(name: string, color: string, courseId?: CourseId): ProfileRow;
	renameProfile(id: string, name: string): void;
	/** Persist which course a profile is studying (profile→course coupling). */
	setProfileCourse(id: string, courseId: CourseId): void;
	deleteProfile(id: string): void;
	/** Returns a view of the same connection bound to a different scope. */
	forScope(scope: Scope): QuizRepository;

	createSession(session: {
		id: string;
		type: SessionType;
		mode: SessionMode;
		domain: number | null;
		startedAt: string;
		deadlineAt: string | null;
		questions: QuestionDefinition[];
		assignmentId?: string | null;
	}): void;
	getSession(id: string): StoredSession | null;
	getActiveSession(): StoredSession | null;
	saveResponse(
		id: string,
		index: number,
		response: QuestionResponse,
		answeredAt: string,
		opts?: { incrementRetries?: boolean }
	): void;
	/** Marks a practice-mode hint as revealed for a question index (server-enforced cost). */
	markHintUsed(id: string, index: number, updatedAt: string): void;
	updateState(
		id: string,
		currentIndex?: number,
		flag?: { questionIndex: number; value: boolean },
		updatedAt?: string
	): void;
	abandon(id: string, updatedAt: string): boolean;
	complete(
		id: string,
		result: QuizResult,
		answers: {
			index: number;
			question: QuestionDefinition;
			response: QuestionResponse | null;
			points: number;
		}[],
		completedAt: string
	): { result: QuizResult; finalized: boolean };
	getAllDomainProgress(): Record<
		number,
		{
			attempted: number;
			correct: number;
			earnedPoints: number;
			possiblePoints: number;
			percentage: number;
			lastReviewed: string | null;
		}
	>;
	getRecentSessions(limit?: number): SessionRow[];
	getAllCompletedSessions(): SessionRow[];
	getWeakTopics(): {
		domain: number;
		objective: string;
		earnedPoints: number;
		possiblePoints: number;
		percentage: number;
		severity: 'high' | 'review';
	}[];
	getReviewCards(): ReviewCardRow[];
	upsertReviewCard(card: ReviewCardRow): void;
	getStudyLog(): StudyDayRow[];
	recordStudyDay(dateKey: string, questions: number, updatedAt: string): void;
	getAnswerHistory(): AnswerHistoryRow[];
	getAnsweredQuestionIds(): string[];
	getObjectiveProgress(): {
		objective: string;
		attempted: number;
		earnedPoints: number;
		possiblePoints: number;
	}[];
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
	saveGoogleOAuth(oauth: {
		accessToken: string;
		refreshToken: string;
		expiresAt: number;
		email: string;
		calendarId?: string | null;
	}): void;
	clearGoogleOAuth(): void;
	getSyncedEvents(): StoredSyncedEvent[];
	recordSyncedEvent(
		source: string,
		eventId: string,
		summary: string,
		dueDate: string,
		syncedAt: string
	): void;
	removeSyncedEvent(source: string): void;
	/** Test/dev-only counters for the bounded read cache; zeroed in production. */
	getCacheStats(): ScopedCacheStats;
	close(): void;
}

function parseStoredSession(
	row: SessionRow & StateRow,
	responseRows: {
		question_index: number;
		response_json: string;
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

/** Content + default-profile seeding. Runs after migration; idempotent by design. */
function seedCourse(db: Database.Database): void {
	const seed = db.transaction(() => {
		const now = new Date().toISOString();
		// Two profiles out of the box: Alex (default / Security+) and Ash (A+).
		// ON CONFLICT DO NOTHING keeps later user renames and course prefs intact.
		db.prepare(
			"INSERT INTO profiles (id, name, color, course_id, created_at) VALUES ('default', 'Alex', '#67B8A8', 'secp-701', ?) ON CONFLICT(id) DO NOTHING"
		).run(now);
		db.prepare(
			"INSERT INTO profiles (id, name, color, course_id, created_at) VALUES ('ash', 'Ash', '#82B5D5', 'aplus-1201', ?) ON CONFLICT(id) DO NOTHING"
		).run(now);
		const insertExamDate = db.prepare(
			"INSERT INTO course_meta (profile_id, course_id, key, value) VALUES ('default', ?, 'exam_date', ?) ON CONFLICT(profile_id, course_id, key) DO NOTHING"
		);
		// Upsert (not INSERT OR IGNORE): content updates must reach existing DBs,
		// and a mis-stamped course_id (rows seeded before the v6 scope column
		// existed, then backfilled with the 'secp-701' DEFAULT) is healed on the
		// next open. The lessons statement below already follows this pattern.
		const insertModule = db.prepare(
			'INSERT INTO course_modules (id, course_id, week, title, description, position) VALUES (?, ?, ?, ?, ?, ?) ON CONFLICT(id) DO UPDATE SET course_id = excluded.course_id, week = excluded.week, title = excluded.title, description = excluded.description, position = excluded.position'
		);
		const insertLesson = db.prepare(
			'INSERT INTO course_lessons (id, course_id, module_id, title, summary, content, objective_ids, position) VALUES (?, ?, ?, ?, ?, ?, ?, ?) ON CONFLICT(id) DO UPDATE SET course_id = excluded.course_id, module_id = excluded.module_id, title = excluded.title, summary = excluded.summary, content = excluded.content, objective_ids = excluded.objective_ids, position = excluded.position'
		);
		const insertAssignment = db.prepare(
			'INSERT INTO course_assignments (id, course_id, module_id, title, description, kind, category, points, count, domain, mode, duration_minutes, due_offset_days, position) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?) ON CONFLICT(id) DO UPDATE SET course_id = excluded.course_id, module_id = excluded.module_id, title = excluded.title, description = excluded.description, kind = excluded.kind, category = excluded.category, points = excluded.points, count = excluded.count, domain = excluded.domain, mode = excluded.mode, duration_minutes = excluded.duration_minutes, due_offset_days = excluded.due_offset_days, position = excluded.position'
		);
		for (const courseId of ACTIVE_COURSES) {
			const definition = COURSES[courseId];
			if (!definition) continue;
			insertExamDate.run(courseId, defaultExamDate());
			for (const module of definition.modules)
				insertModule.run(
					module.id,
					courseId,
					module.week,
					module.title,
					module.description,
					module.position
				);
			for (const lesson of definition.lessons)
				insertLesson.run(
					lesson.id,
					courseId,
					lesson.moduleId,
					lesson.title,
					lesson.summary,
					lesson.content,
					lesson.objectiveIds ? JSON.stringify(lesson.objectiveIds) : null,
					lesson.position
				);
			for (const assignment of definition.assignments)
				insertAssignment.run(
					assignment.id,
					courseId,
					assignment.moduleId,
					assignment.title,
					assignment.description,
					assignment.kind,
					assignment.category,
					assignment.points,
					assignment.count,
					assignment.domain,
					assignment.mode,
					assignment.durationMinutes,
					assignment.dueOffsetDays,
					assignment.position
				);
		}
	});
	seed();
}

export function createQuizRepository(
	filename = process.env.QUIZ_DB_PATH ?? DB_PATH
): QuizRepository {
	if (filename !== ':memory:') fs.mkdirSync(path.dirname(filename), { recursive: true });
	const db = new Database(filename);
	const cache = new ScopedReadCache();
	db.pragma('foreign_keys = ON');
	db.pragma('journal_mode = WAL');
	db.pragma('busy_timeout = 5000');

	// Fresh databases are created directly in the v8 shape; the migrate block
	// below upgrades older files in place and no-ops on anything already v8.
	db.exec(`
		CREATE TABLE IF NOT EXISTS quiz_sessions (id TEXT PRIMARY KEY, started_at TEXT NOT NULL, completed_at TEXT, type TEXT NOT NULL, domain INTEGER, total_questions INTEGER NOT NULL DEFAULT 0, correct_answers INTEGER NOT NULL DEFAULT 0, mode TEXT NOT NULL DEFAULT 'practice', status TEXT NOT NULL DEFAULT 'active', points_earned REAL NOT NULL DEFAULT 0, points_possible REAL NOT NULL DEFAULT 0, updated_at TEXT NOT NULL DEFAULT '', assignment_id TEXT, profile_id TEXT NOT NULL DEFAULT 'default', course_id TEXT NOT NULL DEFAULT 'secp-701', elapsed_seconds INTEGER, duration_seconds INTEGER);
		CREATE TABLE IF NOT EXISTS quiz_answers (id INTEGER PRIMARY KEY AUTOINCREMENT, session_id TEXT NOT NULL, question_index INTEGER NOT NULL, prompt TEXT NOT NULL DEFAULT '', domain INTEGER NOT NULL, category TEXT, correct_answer TEXT NOT NULL DEFAULT '', user_answer TEXT NOT NULL DEFAULT '', is_correct INTEGER NOT NULL DEFAULT 0, question_id TEXT, objective TEXT, response_json TEXT, points_earned REAL NOT NULL DEFAULT 0, points_possible REAL NOT NULL DEFAULT 0, profile_id TEXT NOT NULL DEFAULT 'default', course_id TEXT NOT NULL DEFAULT 'secp-701', FOREIGN KEY (session_id) REFERENCES quiz_sessions(id));
		CREATE TABLE IF NOT EXISTS domain_progress (profile_id TEXT NOT NULL, course_id TEXT NOT NULL, domain INTEGER NOT NULL, total_attempted INTEGER NOT NULL DEFAULT 0, total_correct INTEGER NOT NULL DEFAULT 0, points_earned REAL NOT NULL DEFAULT 0, points_possible REAL NOT NULL DEFAULT 0, last_reviewed_at TEXT, PRIMARY KEY (profile_id, course_id, domain));
		CREATE TABLE IF NOT EXISTS quiz_session_state (session_id TEXT PRIMARY KEY, schema_version INTEGER NOT NULL, deadline_at TEXT, current_index INTEGER NOT NULL DEFAULT 0, questions_json TEXT NOT NULL, result_json TEXT, updated_at TEXT NOT NULL, FOREIGN KEY (session_id) REFERENCES quiz_sessions(id));
		CREATE TABLE IF NOT EXISTS quiz_session_responses (session_id TEXT NOT NULL, question_index INTEGER NOT NULL, response_json TEXT, flagged INTEGER NOT NULL DEFAULT 0, retries INTEGER NOT NULL DEFAULT 0, hint_used INTEGER NOT NULL DEFAULT 0, answered_at TEXT, PRIMARY KEY(session_id, question_index), FOREIGN KEY (session_id) REFERENCES quiz_sessions(id));
		CREATE TABLE IF NOT EXISTS review_cards (profile_id TEXT NOT NULL, course_id TEXT NOT NULL, question_id TEXT NOT NULL, interval_days REAL NOT NULL DEFAULT 0, ease REAL NOT NULL DEFAULT 2.5, lapses INTEGER NOT NULL DEFAULT 0, due_at TEXT NOT NULL, last_result TEXT, review_count INTEGER NOT NULL DEFAULT 0, first_seen_at TEXT NOT NULL, PRIMARY KEY (profile_id, course_id, question_id));
		CREATE TABLE IF NOT EXISTS study_log (profile_id TEXT NOT NULL, date_key TEXT NOT NULL, questions INTEGER NOT NULL DEFAULT 0, sessions INTEGER NOT NULL DEFAULT 0, updated_at TEXT NOT NULL, PRIMARY KEY (profile_id, date_key));
		CREATE TABLE IF NOT EXISTS course_meta (profile_id TEXT NOT NULL, course_id TEXT NOT NULL, key TEXT NOT NULL, value TEXT NOT NULL, PRIMARY KEY (profile_id, course_id, key));
		CREATE TABLE IF NOT EXISTS course_modules (id TEXT PRIMARY KEY, course_id TEXT NOT NULL DEFAULT 'secp-701', week INTEGER NOT NULL, title TEXT NOT NULL, description TEXT NOT NULL, position INTEGER NOT NULL);
		CREATE TABLE IF NOT EXISTS course_lessons (id TEXT PRIMARY KEY, course_id TEXT NOT NULL DEFAULT 'secp-701', module_id TEXT NOT NULL, title TEXT NOT NULL, summary TEXT NOT NULL, content TEXT NOT NULL DEFAULT '', objective_ids TEXT, position INTEGER NOT NULL);
		CREATE TABLE IF NOT EXISTS course_assignments (id TEXT PRIMARY KEY, course_id TEXT NOT NULL DEFAULT 'secp-701', module_id TEXT NOT NULL, title TEXT NOT NULL, description TEXT NOT NULL, kind TEXT NOT NULL, category TEXT NOT NULL, points REAL NOT NULL, count INTEGER NOT NULL, domain INTEGER, mode TEXT NOT NULL, duration_minutes INTEGER NOT NULL, due_offset_days INTEGER NOT NULL, position INTEGER NOT NULL);
		CREATE TABLE IF NOT EXISTS course_assignment_submissions (profile_id TEXT NOT NULL, assignment_id TEXT NOT NULL, session_id TEXT NOT NULL, earned REAL NOT NULL, percentage REAL NOT NULL, completed_at TEXT NOT NULL, PRIMARY KEY (profile_id, assignment_id, session_id));
		CREATE TABLE IF NOT EXISTS course_lesson_completions (profile_id TEXT NOT NULL, lesson_id TEXT NOT NULL, completed_at TEXT NOT NULL, PRIMARY KEY (profile_id, lesson_id));
		CREATE TABLE IF NOT EXISTS google_oauth (profile_id TEXT PRIMARY KEY, access_token TEXT NOT NULL, refresh_token TEXT NOT NULL, expires_at INTEGER NOT NULL, email TEXT NOT NULL, calendar_id TEXT, created_at TEXT NOT NULL, updated_at TEXT NOT NULL);
		CREATE TABLE IF NOT EXISTS google_synced_events (profile_id TEXT NOT NULL, source TEXT NOT NULL, event_id TEXT NOT NULL, summary TEXT NOT NULL, due_date TEXT NOT NULL, synced_at TEXT NOT NULL, PRIMARY KEY (profile_id, source));
		CREATE TABLE IF NOT EXISTS profiles (id TEXT PRIMARY KEY, name TEXT NOT NULL, color TEXT NOT NULL DEFAULT '#67B8A8', course_id TEXT NOT NULL DEFAULT 'secp-701', created_at TEXT NOT NULL);
	`);

	const columns = (table: string) =>
		new Set(
			(db.prepare(`PRAGMA table_info(${table})`).all() as { name: string }[]).map(
				(column) => column.name
			)
		);

	// ── v5 → v6 migration ────────────────────────────────────────────────────
	// Runs once per database (guarded by user_version) inside a single
	// transaction. Every step is additionally guarded by a shape check so the
	// block is idempotent and safe on fresh databases. Tables whose primary key
	// changes are rebuilt with the SQLite 12-step pattern; simple column adds
	// use guarded ALTER (existing rows backfill via the column DEFAULT).
	const migrate = db.transaction(() => {
		const has = (table: string, column: string) => columns(table).has(column);

		// A. Simple column adds (v5 additions first, then the v6 scope columns).
		for (const [name, sql] of [
			['mode', "TEXT NOT NULL DEFAULT 'practice'"],
			['status', "TEXT NOT NULL DEFAULT 'active'"],
			['points_earned', 'REAL NOT NULL DEFAULT 0'],
			['points_possible', 'REAL NOT NULL DEFAULT 0'],
			['updated_at', "TEXT NOT NULL DEFAULT ''"],
			['assignment_id', 'TEXT']
		] as const)
			if (!has('quiz_sessions', name))
				db.exec(`ALTER TABLE quiz_sessions ADD COLUMN ${name} ${sql}`);
		for (const [name, sql] of [
			['question_id', 'TEXT'],
			['objective', 'TEXT'],
			['response_json', 'TEXT'],
			['points_earned', 'REAL NOT NULL DEFAULT 0'],
			['points_possible', 'REAL NOT NULL DEFAULT 0']
		] as const)
			if (!has('quiz_answers', name)) db.exec(`ALTER TABLE quiz_answers ADD COLUMN ${name} ${sql}`);
		for (const [name, sql] of [
			['points_earned', 'REAL NOT NULL DEFAULT 0'],
			['points_possible', 'REAL NOT NULL DEFAULT 0']
		] as const)
			if (!has('domain_progress', name))
				db.exec(`ALTER TABLE domain_progress ADD COLUMN ${name} ${sql}`);
		if (!has('quiz_sessions', 'profile_id'))
			db.exec("ALTER TABLE quiz_sessions ADD COLUMN profile_id TEXT NOT NULL DEFAULT 'default'");
		if (!has('quiz_sessions', 'course_id'))
			db.exec("ALTER TABLE quiz_sessions ADD COLUMN course_id TEXT NOT NULL DEFAULT 'secp-701'");
		if (!has('quiz_sessions', 'elapsed_seconds'))
			db.exec('ALTER TABLE quiz_sessions ADD COLUMN elapsed_seconds INTEGER');
		if (!has('quiz_sessions', 'duration_seconds'))
			db.exec('ALTER TABLE quiz_sessions ADD COLUMN duration_seconds INTEGER');
		if (!has('quiz_answers', 'profile_id'))
			db.exec("ALTER TABLE quiz_answers ADD COLUMN profile_id TEXT NOT NULL DEFAULT 'default'");
		if (!has('quiz_answers', 'course_id'))
			db.exec("ALTER TABLE quiz_answers ADD COLUMN course_id TEXT NOT NULL DEFAULT 'secp-701'");
		for (const table of ['course_modules', 'course_lessons', 'course_assignments'] as const)
			if (!has(table, 'course_id'))
				db.exec(`ALTER TABLE ${table} ADD COLUMN course_id TEXT NOT NULL DEFAULT 'secp-701'`);
		// v7: per-profile preferred course — switching profiles restores the
		// course that profile was studying, instead of leaking the last course.
		if (!has('profiles', 'course_id'))
			db.exec("ALTER TABLE profiles ADD COLUMN course_id TEXT NOT NULL DEFAULT 'secp-701'");
		// Guarded post-version repair (no schema-version bump): practice-mode
		// retry/hint counters per question, idempotent on every open.
		if (!has('quiz_session_responses', 'retries'))
			db.exec('ALTER TABLE quiz_session_responses ADD COLUMN retries INTEGER NOT NULL DEFAULT 0');
		if (!has('quiz_session_responses', 'hint_used'))
			db.exec('ALTER TABLE quiz_session_responses ADD COLUMN hint_used INTEGER NOT NULL DEFAULT 0');
		if (!has('course_lessons', 'objective_ids'))
			db.exec('ALTER TABLE course_lessons ADD COLUMN objective_ids TEXT');

		// B. Primary-key rebuilds — SQLite 12-step, backfilling all existing
		// rows to the seeded default profile / Security+ course.
		const rebuild = (table: string, createSql: string, insertSql: string) => {
			db.exec(createSql);
			db.exec(insertSql);
			db.exec(`DROP TABLE ${table}`);
			db.exec(`ALTER TABLE ${table}_new RENAME TO ${table}`);
		};
		if (!has('domain_progress', 'profile_id'))
			rebuild(
				'domain_progress',
				'CREATE TABLE domain_progress_new (profile_id TEXT NOT NULL, course_id TEXT NOT NULL, domain INTEGER NOT NULL, total_attempted INTEGER NOT NULL DEFAULT 0, total_correct INTEGER NOT NULL DEFAULT 0, points_earned REAL NOT NULL DEFAULT 0, points_possible REAL NOT NULL DEFAULT 0, last_reviewed_at TEXT, PRIMARY KEY (profile_id, course_id, domain))',
				"INSERT INTO domain_progress_new (profile_id, course_id, domain, total_attempted, total_correct, points_earned, points_possible, last_reviewed_at) SELECT 'default', 'secp-701', domain, total_attempted, total_correct, points_earned, points_possible, last_reviewed_at FROM domain_progress"
			);
		if (!has('review_cards', 'profile_id'))
			rebuild(
				'review_cards',
				'CREATE TABLE review_cards_new (profile_id TEXT NOT NULL, course_id TEXT NOT NULL, question_id TEXT NOT NULL, interval_days REAL NOT NULL DEFAULT 0, ease REAL NOT NULL DEFAULT 2.5, lapses INTEGER NOT NULL DEFAULT 0, due_at TEXT NOT NULL, last_result TEXT, review_count INTEGER NOT NULL DEFAULT 0, first_seen_at TEXT NOT NULL, PRIMARY KEY (profile_id, course_id, question_id))',
				"INSERT INTO review_cards_new (profile_id, course_id, question_id, interval_days, ease, lapses, due_at, last_result, review_count, first_seen_at) SELECT 'default', 'secp-701', question_id, interval_days, ease, lapses, due_at, last_result, review_count, first_seen_at FROM review_cards"
			);
		if (!has('study_log', 'profile_id'))
			rebuild(
				'study_log',
				'CREATE TABLE study_log_new (profile_id TEXT NOT NULL, date_key TEXT NOT NULL, questions INTEGER NOT NULL DEFAULT 0, sessions INTEGER NOT NULL DEFAULT 0, updated_at TEXT NOT NULL, PRIMARY KEY (profile_id, date_key))',
				"INSERT INTO study_log_new (profile_id, date_key, questions, sessions, updated_at) SELECT 'default', date_key, questions, sessions, updated_at FROM study_log"
			);
		if (!has('course_meta', 'profile_id'))
			rebuild(
				'course_meta',
				'CREATE TABLE course_meta_new (profile_id TEXT NOT NULL, course_id TEXT NOT NULL, key TEXT NOT NULL, value TEXT NOT NULL, PRIMARY KEY (profile_id, course_id, key))',
				"INSERT INTO course_meta_new (profile_id, course_id, key, value) SELECT 'default', 'secp-701', key, value FROM course_meta"
			);
		if (!has('course_assignment_submissions', 'profile_id'))
			rebuild(
				'course_assignment_submissions',
				'CREATE TABLE course_assignment_submissions_new (profile_id TEXT NOT NULL, assignment_id TEXT NOT NULL, session_id TEXT NOT NULL, earned REAL NOT NULL, percentage REAL NOT NULL, completed_at TEXT NOT NULL, PRIMARY KEY (profile_id, assignment_id, session_id))',
				"INSERT INTO course_assignment_submissions_new (profile_id, assignment_id, session_id, earned, percentage, completed_at) SELECT 'default', assignment_id, session_id, earned, percentage, completed_at FROM course_assignment_submissions"
			);
		if (!has('course_lesson_completions', 'profile_id'))
			rebuild(
				'course_lesson_completions',
				'CREATE TABLE course_lesson_completions_new (profile_id TEXT NOT NULL, lesson_id TEXT NOT NULL, completed_at TEXT NOT NULL, PRIMARY KEY (profile_id, lesson_id))',
				"INSERT INTO course_lesson_completions_new (profile_id, lesson_id, completed_at) SELECT 'default', lesson_id, completed_at FROM course_lesson_completions"
			);
		if (!has('google_oauth', 'profile_id'))
			rebuild(
				'google_oauth',
				'CREATE TABLE google_oauth_new (profile_id TEXT PRIMARY KEY, access_token TEXT NOT NULL, refresh_token TEXT NOT NULL, expires_at INTEGER NOT NULL, email TEXT NOT NULL, calendar_id TEXT, created_at TEXT NOT NULL, updated_at TEXT NOT NULL)',
				"INSERT INTO google_oauth_new (profile_id, access_token, refresh_token, expires_at, email, calendar_id, created_at, updated_at) SELECT 'default', access_token, refresh_token, expires_at, email, calendar_id, created_at, updated_at FROM google_oauth"
			);
		if (!has('google_synced_events', 'profile_id'))
			rebuild(
				'google_synced_events',
				'CREATE TABLE google_synced_events_new (profile_id TEXT NOT NULL, source TEXT NOT NULL, event_id TEXT NOT NULL, summary TEXT NOT NULL, due_date TEXT NOT NULL, synced_at TEXT NOT NULL, PRIMARY KEY (profile_id, source))',
				"INSERT INTO google_synced_events_new (profile_id, source, event_id, summary, due_date, synced_at) SELECT 'default', source, event_id, summary, due_date, synced_at FROM google_synced_events"
			);

		// C. Data fixes (idempotent — no-op on already-fixed rows).
		db.prepare(
			"UPDATE quiz_sessions SET mode = COALESCE(NULLIF(mode, ''), 'practice'), status = CASE WHEN completed_at IS NOT NULL THEN 'completed' WHEN id NOT IN (SELECT session_id FROM quiz_session_state) THEN 'abandoned' ELSE 'active' END, points_earned = CASE WHEN completed_at IS NOT NULL THEN correct_answers ELSE points_earned END, points_possible = CASE WHEN completed_at IS NOT NULL THEN total_questions ELSE points_possible END, updated_at = COALESCE(NULLIF(updated_at, ''), started_at)"
		).run();
		db.prepare(
			'UPDATE quiz_answers SET points_earned = is_correct, points_possible = 1 WHERE points_possible = 0'
		).run();
		// A historical bug allowed multiple active sessions in one scope to
		// accumulate across restarts. Keep the newest one resumable and retain
		// older rows as abandoned history before enforcing the invariant.
		db.prepare(
			`UPDATE quiz_sessions AS older
			 SET status = 'abandoned', updated_at = COALESCE(NULLIF(older.updated_at, ''), older.started_at)
			 WHERE older.status = 'active'
			   AND EXISTS (
					SELECT 1 FROM quiz_sessions AS newer
					WHERE newer.status = 'active'
					  AND newer.profile_id = older.profile_id
					  AND newer.course_id = older.course_id
					  AND (newer.started_at > older.started_at OR (newer.started_at = older.started_at AND newer.id > older.id))
				)`
		).run();
		db.exec(
			"CREATE UNIQUE INDEX IF NOT EXISTS quiz_sessions_one_active_scope ON quiz_sessions(profile_id, course_id) WHERE status = 'active'"
		);
		// v8: course_lessons.objective_id -> objective_ids (JSON array). Guarded
		// shape repair covers every historical layout: rename the old column when
		// it is the only one, copy-and-drop when both exist, add when neither does.
		if (has('course_lessons', 'objective_id') && !has('course_lessons', 'objective_ids')) {
			db.exec('ALTER TABLE course_lessons RENAME COLUMN objective_id TO objective_ids');
		} else if (has('course_lessons', 'objective_ids') && has('course_lessons', 'objective_id')) {
			db.exec(
				'UPDATE course_lessons SET objective_ids = objective_id WHERE objective_ids IS NULL AND objective_id IS NOT NULL'
			);
			db.exec('ALTER TABLE course_lessons DROP COLUMN objective_id');
		}
		// Stored scalars become one-element JSON arrays; valid JSON arrays are
		// left untouched (idempotent on re-open).
		const lessonObjectives = db
			.prepare('SELECT id, objective_ids FROM course_lessons WHERE objective_ids IS NOT NULL')
			.all() as { id: string; objective_ids: string }[];
		const toArray = db.prepare('UPDATE course_lessons SET objective_ids = ? WHERE id = ?');
		for (const row of lessonObjectives) {
			let parsed: unknown;
			try {
				parsed = JSON.parse(row.objective_ids);
			} catch {
				parsed = null;
			}
			if (!Array.isArray(parsed)) toArray.run(JSON.stringify([row.objective_ids]), row.id);
		}
		// v8: retire the four acid-lime preset profile colors; every other custom
		// color is preserved byte-for-byte.
		db.prepare(
			"UPDATE profiles SET color = CASE color WHEN '#b7f04c' THEN '#67B8A8' WHEN '#4cc9f0' THEN '#82B5D5' WHEN '#f0b04c' THEN '#E0B66A' WHEN '#f04c8a' THEN '#D894B8' ELSE color END"
		).run();
		db.pragma('user_version = 8');
	});
	const version = db.pragma('user_version', { simple: true });
	const needsPostVersionRepair =
		!columns('quiz_session_responses').has('retries') ||
		!columns('quiz_session_responses').has('hint_used') ||
		!columns('course_lessons').has('objective_ids') ||
		!columns('quiz_sessions').has('elapsed_seconds') ||
		!columns('quiz_sessions').has('duration_seconds');
	const needsActiveSessionIndex =
		(db
			.prepare(
				"SELECT 1 FROM sqlite_master WHERE type = 'index' AND name = 'quiz_sessions_one_active_scope'"
			)
			.get() as { 1: number } | undefined) === undefined;
	if (version !== 8 || needsPostVersionRepair || needsActiveSessionIndex) migrate();
	seedCourse(db);

	const make = (scope: Scope): QuizRepository => {
		const readSession = (id: string): StoredSession | null => {
			cache.bypass();
			const row = db
				.prepare(
					'SELECT s.*, st.deadline_at, st.current_index, st.questions_json, st.result_json FROM quiz_sessions s JOIN quiz_session_state st ON st.session_id = s.id WHERE s.id = ? AND s.profile_id = ? AND s.course_id = ?'
				)
				.get(id, scope.profileId, scope.courseId) as (SessionRow & StateRow) | undefined;
			if (!row) return null;
			return parseStoredSession(
				row,
				db
					.prepare(
						'SELECT question_index, response_json, flagged, retries, hint_used FROM quiz_session_responses WHERE session_id = ?'
					)
					.all(id) as {
					question_index: number;
					response_json: string;
					flagged: number;
					retries: number;
					hint_used: number;
				}[]
			);
		};
		return {
			getProfiles() {
				return db
					.prepare(
						'SELECT id, name, color, course_id AS courseId, created_at AS createdAt FROM profiles ORDER BY created_at'
					)
					.all() as ProfileRow[];
			},
			createProfile(name, color, courseId = DEFAULT_SCOPE.courseId) {
				if (
					(db.prepare('SELECT COUNT(*) AS c FROM profiles').get() as { c: number }).c >=
					MAX_PROFILES
				)
					throw new Error(`Profile cap of ${MAX_PROFILES} reached.`);
				const id = crypto.randomUUID();
				const createdAt = new Date().toISOString();
				db.prepare(
					'INSERT INTO profiles (id, name, color, course_id, created_at) VALUES (?, ?, ?, ?, ?)'
				).run(id, name, color, courseId, createdAt);
				return { id, name, color, createdAt, courseId };
			},
			renameProfile(id, name) {
				db.prepare('UPDATE profiles SET name = ? WHERE id = ?').run(name, id);
			},
			setProfileCourse(id, courseId) {
				db.prepare('UPDATE profiles SET course_id = ? WHERE id = ?').run(courseId, id);
			},
			deleteProfile(id) {
				if (id === DEFAULT_SCOPE.profileId)
					throw new Error('The default profile cannot be deleted.');
				db.transaction(() => {
					db.prepare(
						'DELETE FROM quiz_session_responses WHERE session_id IN (SELECT id FROM quiz_sessions WHERE profile_id = ?)'
					).run(id);
					db.prepare(
						'DELETE FROM quiz_session_state WHERE session_id IN (SELECT id FROM quiz_sessions WHERE profile_id = ?)'
					).run(id);
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
						db.prepare(`DELETE FROM ${table} WHERE profile_id = ?`).run(id);
					db.prepare('DELETE FROM profiles WHERE id = ?').run(id);
				})();
			},
			forScope: make,
			createSession(session) {
				const create = db.transaction(() => {
					db.prepare(
						'INSERT INTO quiz_sessions (id, started_at, type, domain, total_questions, mode, status, updated_at, assignment_id, profile_id, course_id) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)'
					).run(
						session.id,
						session.startedAt,
						session.type,
						session.domain,
						session.questions.length,
						session.mode,
						'active',
						session.startedAt,
						session.assignmentId ?? null,
						scope.profileId,
						scope.courseId
					);
					db.prepare(
						'INSERT INTO quiz_session_state (session_id, schema_version, deadline_at, current_index, questions_json, updated_at) VALUES (?, 1, ?, 0, ?, ?)'
					).run(
						session.id,
						session.deadlineAt,
						JSON.stringify(session.questions),
						session.startedAt
					);
				});
				create();
			},
			getSession: readSession,
			getActiveSession() {
				cache.bypass();
				const row = db
					.prepare(
						"SELECT id FROM quiz_sessions WHERE status = 'active' AND profile_id = ? AND course_id = ? ORDER BY started_at DESC LIMIT 1"
					)
					.get(scope.profileId, scope.courseId) as { id: string } | undefined;
				return row ? readSession(row.id) : null;
			},
			saveResponse(id, index, response, answeredAt, opts = {}) {
				const { incrementRetries = true } = opts;
				const save = db.transaction(() => {
					const owned = db
						.prepare(
							'SELECT 1 FROM quiz_sessions WHERE id = ? AND profile_id = ? AND course_id = ?'
						)
						.get(id, scope.profileId, scope.courseId);
					if (!owned) return;
					db.prepare(
						`INSERT INTO quiz_session_responses (session_id, question_index, response_json, flagged, retries, answered_at) VALUES (?, ?, ?, 0, 0, ?) ON CONFLICT(session_id, question_index) DO UPDATE SET response_json = excluded.response_json, answered_at = excluded.answered_at${incrementRetries ? ', retries = retries + 1' : ''}`
					).run(id, index, JSON.stringify(response), answeredAt);
					db.prepare(
						'UPDATE quiz_sessions SET updated_at = ? WHERE id = ? AND profile_id = ? AND course_id = ?'
					).run(answeredAt, id, scope.profileId, scope.courseId);
				});
				save();
			},
			markHintUsed(id, index, updatedAt) {
				const mark = db.transaction(() => {
					const owned = db
						.prepare(
							'SELECT 1 FROM quiz_sessions WHERE id = ? AND profile_id = ? AND course_id = ?'
						)
						.get(id, scope.profileId, scope.courseId);
					if (!owned) return;
					db.prepare(
						'INSERT INTO quiz_session_responses (session_id, question_index, hint_used) VALUES (?, ?, 1) ON CONFLICT(session_id, question_index) DO UPDATE SET hint_used = 1'
					).run(id, index);
					db.prepare(
						'UPDATE quiz_sessions SET updated_at = ? WHERE id = ? AND profile_id = ? AND course_id = ?'
					).run(updatedAt, id, scope.profileId, scope.courseId);
				});
				mark();
			},
			updateState(id, currentIndex, flag, updatedAt = new Date().toISOString()) {
				const update = db.transaction(() => {
					const owned = db
						.prepare(
							'SELECT 1 FROM quiz_sessions WHERE id = ? AND profile_id = ? AND course_id = ?'
						)
						.get(id, scope.profileId, scope.courseId);
					if (!owned) return;
					if (currentIndex !== undefined)
						db.prepare(
							'UPDATE quiz_session_state SET current_index = ?, updated_at = ? WHERE session_id = ?'
						).run(currentIndex, updatedAt, id);
					if (flag)
						db.prepare(
							'INSERT INTO quiz_session_responses (session_id, question_index, flagged) VALUES (?, ?, ?) ON CONFLICT(session_id, question_index) DO UPDATE SET flagged = excluded.flagged'
						).run(id, flag.questionIndex, flag.value ? 1 : 0);
					db.prepare(
						'UPDATE quiz_sessions SET updated_at = ? WHERE id = ? AND profile_id = ? AND course_id = ?'
					).run(updatedAt, id, scope.profileId, scope.courseId);
				});
				update();
			},
			abandon(id, updatedAt) {
				return (
					db
						.prepare(
							"UPDATE quiz_sessions SET status = 'abandoned', updated_at = ? WHERE id = ? AND status = 'active' AND profile_id = ? AND course_id = ?"
						)
						.run(updatedAt, id, scope.profileId, scope.courseId).changes === 1
				);
			},
			complete(id, result, answers, completedAt) {
				const finalize = db.transaction(() => {
					const owned = db
						.prepare(
							'SELECT 1 FROM quiz_sessions WHERE id = ? AND profile_id = ? AND course_id = ?'
						)
						.get(id, scope.profileId, scope.courseId);
					if (!owned) throw new Error('Session is outside the active scope.');
					const existing = db
						.prepare('SELECT result_json FROM quiz_session_state WHERE session_id = ?')
						.get(id) as { result_json: string | null } | undefined;
					if (existing?.result_json)
						return { result: JSON.parse(existing.result_json) as QuizResult, finalized: false };
					// Answers + domain progress follow the session's own scope.
					const sessionScope = (db
						.prepare('SELECT profile_id, course_id FROM quiz_sessions WHERE id = ?')
						.get(id) as { profile_id: string; course_id: string } | undefined) ?? {
						profile_id: scope.profileId,
						course_id: scope.courseId
					};
					for (const answer of answers)
						db.prepare(
							'INSERT INTO quiz_answers (session_id, question_index, prompt, domain, category, correct_answer, user_answer, is_correct, question_id, objective, response_json, points_earned, points_possible, profile_id, course_id) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)'
						).run(
							id,
							answer.index,
							answer.question.prompt,
							answer.question.domain,
							answer.question.objective,
							'',
							JSON.stringify(answer.response),
							answer.points === 1 ? 1 : 0,
							answer.question.id,
							answer.question.objective,
							JSON.stringify(answer.response),
							answer.points,
							1,
							sessionScope.profile_id,
							sessionScope.course_id
						);
					for (const domain of [1, 2, 3, 4, 5]) {
						const breakdown = result.domainBreakdown[domain as 1 | 2 | 3 | 4 | 5];
						if (breakdown.possiblePoints)
							db.prepare(
								'INSERT INTO domain_progress (profile_id, course_id, domain, total_attempted, total_correct, points_earned, points_possible, last_reviewed_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?) ON CONFLICT(profile_id, course_id, domain) DO UPDATE SET total_attempted = total_attempted + excluded.total_attempted, total_correct = total_correct + excluded.total_correct, points_earned = points_earned + excluded.points_earned, points_possible = points_possible + excluded.points_possible, last_reviewed_at = excluded.last_reviewed_at'
							).run(
								sessionScope.profile_id,
								sessionScope.course_id,
								domain,
								breakdown.totalQuestions,
								breakdown.fullyCorrect,
								breakdown.earnedPoints,
								breakdown.possiblePoints,
								completedAt
							);
					}
					db.prepare(
						"UPDATE quiz_sessions SET status = 'completed', completed_at = ?, points_earned = ?, points_possible = ?, correct_answers = ?, total_questions = ?, elapsed_seconds = ?, duration_seconds = ?, updated_at = ? WHERE id = ? AND status = 'active'"
					).run(
						completedAt,
						result.earnedPoints,
						result.possiblePoints,
						result.fullyCorrect,
						result.totalQuestions,
						result.elapsedSeconds ?? null,
						result.durationSeconds ?? null,
						completedAt,
						id
					);
					db.prepare(
						'UPDATE quiz_session_state SET result_json = ?, updated_at = ? WHERE session_id = ?'
					).run(JSON.stringify(result), completedAt, id);
					return { result, finalized: true };
				});
				return finalize();
			},
			getAllDomainProgress() {
				cache.bypass();
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
				for (const row of db
					.prepare('SELECT * FROM domain_progress WHERE profile_id = ? AND course_id = ?')
					.all(scope.profileId, scope.courseId) as {
					domain: number;
					total_attempted: number;
					total_correct: number;
					points_earned: number;
					points_possible: number;
					last_reviewed_at: string | null;
				}[])
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
			getRecentSessions(limit = 10) {
				cache.bypass();
				return db
					.prepare(
						"SELECT * FROM quiz_sessions WHERE status = 'completed' AND profile_id = ? AND course_id = ? ORDER BY completed_at DESC LIMIT ?"
					)
					.all(scope.profileId, scope.courseId, limit) as SessionRow[];
			},
			getAllCompletedSessions() {
				cache.bypass();
				return db
					.prepare(
						"SELECT * FROM quiz_sessions WHERE status = 'completed' AND profile_id = ? AND course_id = ? ORDER BY completed_at DESC"
					)
					.all(scope.profileId, scope.courseId) as SessionRow[];
			},
			getWeakTopics() {
				cache.bypass();
				return (
					db
						.prepare(
							'SELECT domain, objective, SUM(points_earned) earnedPoints, SUM(points_possible) possiblePoints FROM quiz_answers WHERE objective IS NOT NULL AND profile_id = ? AND course_id = ? GROUP BY domain, objective HAVING SUM(points_possible) >= 3 AND SUM(points_earned) * 1.0 / SUM(points_possible) < .85 ORDER BY earnedPoints * 1.0 / possiblePoints'
						)
						.all(scope.profileId, scope.courseId) as {
						domain: number;
						objective: string;
						earnedPoints: number;
						possiblePoints: number;
					}[]
				).map((row) => ({
					...row,
					percentage: Math.round((row.earnedPoints / row.possiblePoints) * 1000) / 10,
					severity: row.earnedPoints / row.possiblePoints < 0.7 ? 'high' : 'review'
				}));
			},
			getReviewCards() {
				return db
					.prepare(
						'SELECT question_id AS questionId, interval_days AS intervalDays, ease, lapses, due_at AS dueAt, last_result AS lastResult, review_count AS reviewCount, first_seen_at AS firstSeenAt FROM review_cards WHERE profile_id = ? AND course_id = ?'
					)
					.all(scope.profileId, scope.courseId) as unknown as ReviewCardRow[];
			},
			upsertReviewCard(card) {
				db.prepare(
					'INSERT INTO review_cards (profile_id, course_id, question_id, interval_days, ease, lapses, due_at, last_result, review_count, first_seen_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?) ON CONFLICT(profile_id, course_id, question_id) DO UPDATE SET interval_days = excluded.interval_days, ease = excluded.ease, lapses = excluded.lapses, due_at = excluded.due_at, last_result = excluded.last_result, review_count = excluded.review_count'
				).run(
					scope.profileId,
					scope.courseId,
					card.questionId,
					card.intervalDays,
					card.ease,
					card.lapses,
					card.dueAt,
					card.lastResult,
					card.reviewCount,
					card.firstSeenAt
				);
			},
			getStudyLog() {
				return db
					.prepare(
						'SELECT date_key AS dateKey, questions, sessions, updated_at AS updatedAt FROM study_log WHERE profile_id = ? ORDER BY date_key'
					)
					.all(scope.profileId) as unknown as StudyDayRow[];
			},
			recordStudyDay(dateKey, questions, updatedAt) {
				db.prepare(
					'INSERT INTO study_log (profile_id, date_key, questions, sessions, updated_at) VALUES (?, ?, ?, 1, ?) ON CONFLICT(profile_id, date_key) DO UPDATE SET questions = questions + excluded.questions, sessions = sessions + 1, updated_at = excluded.updated_at'
				).run(scope.profileId, dateKey, questions, updatedAt);
			},
			getAnswerHistory() {
				return db
					.prepare(
						"SELECT a.question_id AS questionId, a.is_correct AS isCorrect, s.completed_at AS completedAt FROM quiz_answers a JOIN quiz_sessions s ON s.id = a.session_id WHERE a.question_id IS NOT NULL AND s.status = 'completed' AND a.profile_id = ? AND a.course_id = ?"
					)
					.all(scope.profileId, scope.courseId) as unknown as AnswerHistoryRow[];
			},
			getAnsweredQuestionIds() {
				return (
					db
						.prepare(
							'SELECT DISTINCT question_id FROM quiz_answers WHERE question_id IS NOT NULL AND profile_id = ? AND course_id = ?'
						)
						.all(scope.profileId, scope.courseId) as { question_id: string }[]
				).map((row) => row.question_id);
			},
			getObjectiveProgress() {
				return db
					.prepare(
						'SELECT objective, COUNT(*) AS attempted, SUM(points_earned) AS earnedPoints, SUM(points_possible) AS possiblePoints FROM quiz_answers WHERE objective IS NOT NULL AND profile_id = ? AND course_id = ? GROUP BY objective'
					)
					.all(scope.profileId, scope.courseId) as {
					objective: string;
					attempted: number;
					earnedPoints: number;
					possiblePoints: number;
				}[];
			},
			getExamDate() {
				return (
					(
						db
							.prepare(
								"SELECT value FROM course_meta WHERE profile_id = ? AND course_id = ? AND key = 'exam_date'"
							)
							.get(scope.profileId, scope.courseId) as { value: string } | undefined
					)?.value ?? defaultExamDate()
				);
			},
			setExamDate(examDate) {
				db.prepare(
					"INSERT INTO course_meta (profile_id, course_id, key, value) VALUES (?, ?, 'exam_date', ?) ON CONFLICT(profile_id, course_id, key) DO UPDATE SET value = excluded.value"
				).run(scope.profileId, scope.courseId, examDate);
				cache.invalidateScope(scope);
			},
			getCourseModules() {
				return cache.read(
					cache.key(scope, 'course-modules'),
					() =>
						db
							.prepare(
								'SELECT id, week, title, description, position FROM course_modules WHERE course_id = ? ORDER BY position'
							)
							.all(scope.courseId) as CourseModule[]
				);
			},
			getCourseLessons() {
				return cache.read(
					cache.key(scope, 'course-lessons'),
					() =>
						(
							db
								.prepare(
									'SELECT id, module_id AS moduleId, title, summary, content, objective_ids AS objectiveIds, position FROM course_lessons WHERE course_id = ? ORDER BY position'
								)
								.all(scope.courseId) as unknown as (CourseLesson & { objectiveIds: string | null })[]
						).map((lesson) => ({
							...lesson,
							// Parse the stored JSON explicitly — never cast the string to the array type.
							objectiveIds: lesson.objectiveIds ? (JSON.parse(lesson.objectiveIds) as string[]) : undefined
						}))
				);
			},
			getCourseAssignments() {
				return cache.read(
					cache.key(scope, 'course-assignments'),
					() =>
						db
							.prepare(
								'SELECT id, module_id AS moduleId, title, description, kind, category, points, count, domain, mode, duration_minutes AS durationMinutes, due_offset_days AS dueOffsetDays, position FROM course_assignments WHERE course_id = ? ORDER BY position'
							)
							.all(scope.courseId) as unknown as CourseAssignment[]
				);
			},
			getLessonCompletions() {
				return new Set(
					(
						db
							.prepare('SELECT lesson_id FROM course_lesson_completions WHERE profile_id = ?')
							.all(scope.profileId) as { lesson_id: string }[]
					).map((row) => row.lesson_id)
				);
			},
			setLessonCompleted(lessonId, completed) {
				if (completed)
					db.prepare(
						'INSERT INTO course_lesson_completions (profile_id, lesson_id, completed_at) VALUES (?, ?, ?) ON CONFLICT(profile_id, lesson_id) DO UPDATE SET completed_at = excluded.completed_at'
					).run(scope.profileId, lessonId, new Date().toISOString());
				else
					db.prepare(
						'DELETE FROM course_lesson_completions WHERE profile_id = ? AND lesson_id = ?'
					).run(scope.profileId, lessonId);
				cache.invalidateScope(scope);
			},
			getSubmissions() {
				cache.bypass();
				return db
					.prepare(
						'SELECT assignment_id AS assignmentId, session_id AS sessionId, earned, percentage, completed_at AS completedAt FROM course_assignment_submissions WHERE profile_id = ?'
					)
					.all(scope.profileId) as unknown as SubmissionRecord[];
			},
			recordSubmission(submission) {
				db.prepare(
					'INSERT INTO course_assignment_submissions (profile_id, assignment_id, session_id, earned, percentage, completed_at) VALUES (?, ?, ?, ?, ?, ?) ON CONFLICT(profile_id, assignment_id, session_id) DO UPDATE SET earned = excluded.earned, percentage = excluded.percentage, completed_at = excluded.completed_at'
				).run(
					scope.profileId,
					submission.assignmentId,
					submission.sessionId,
					submission.earned,
					submission.percentage,
					submission.completedAt
				);
				cache.invalidateScope(scope);
			},
			getGoogleOAuth() {
				const row = db
					.prepare(
						'SELECT access_token AS accessToken, refresh_token AS refreshToken, expires_at AS expiresAt, email, calendar_id AS calendarId FROM google_oauth WHERE profile_id = ?'
					)
					.get(scope.profileId) as StoredGoogleOAuth | undefined;
				return row ?? null;
			},
			saveGoogleOAuth(oauth) {
				const now = new Date().toISOString();
				db.prepare(
					'INSERT INTO google_oauth (profile_id, access_token, refresh_token, expires_at, email, calendar_id, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?) ON CONFLICT(profile_id) DO UPDATE SET access_token = excluded.access_token, refresh_token = excluded.refresh_token, expires_at = excluded.expires_at, email = excluded.email, calendar_id = COALESCE(excluded.calendar_id, google_oauth.calendar_id), updated_at = excluded.updated_at'
				).run(
					scope.profileId,
					oauth.accessToken,
					oauth.refreshToken,
					oauth.expiresAt,
					oauth.email,
					oauth.calendarId ?? null,
					now,
					now
				);
			},
			clearGoogleOAuth() {
				db.prepare('DELETE FROM google_oauth WHERE profile_id = ?').run(scope.profileId);
			},
			getSyncedEvents() {
				return db
					.prepare(
						'SELECT source, event_id AS eventId, summary, due_date AS dueDate, synced_at AS syncedAt FROM google_synced_events WHERE profile_id = ? ORDER BY source'
					)
					.all(scope.profileId) as StoredSyncedEvent[];
			},
			recordSyncedEvent(source, eventId, summary, dueDate, syncedAt) {
				db.prepare(
					'INSERT INTO google_synced_events (profile_id, source, event_id, summary, due_date, synced_at) VALUES (?, ?, ?, ?, ?, ?) ON CONFLICT(profile_id, source) DO UPDATE SET event_id = excluded.event_id, summary = excluded.summary, due_date = excluded.due_date, synced_at = excluded.synced_at'
				).run(scope.profileId, source, eventId, summary, dueDate, syncedAt);
			},
			removeSyncedEvent(source) {
				db.prepare('DELETE FROM google_synced_events WHERE profile_id = ? AND source = ?').run(
					scope.profileId,
					source
				);
			},
			getCacheStats() {
				return cache.getStats();
			},
			close() {
				db.close();
			}
		};
	};

	const base = make(DEFAULT_SCOPE);
	return base;
}

/** Binds an existing repository to a different scope (same underlying connection). */
export function createScopedRepo(repo: QuizRepository, scope: Scope): QuizRepository {
	return repo.forScope(scope);
}

export const quizRepository = createQuizRepository(process.env.VITEST ? ':memory:' : undefined);
