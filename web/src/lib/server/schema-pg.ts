import type postgres from 'postgres';

/**
 * PostgreSQL schema for the course app — the single source of truth for the
 * runtime shape. `npm run db:setup` applies it to a fresh database; the test
 * helper applies it to `TEST_DATABASE_URL`. Statement order matters only for
 * the foreign-key references, which the array preserves.
 */
export const PG_SCHEMA_STATEMENTS: string[] = [
	`CREATE TABLE IF NOT EXISTS profiles (
		id TEXT PRIMARY KEY,
		name TEXT NOT NULL,
		color TEXT NOT NULL DEFAULT '#67B8A8',
		course_id TEXT NOT NULL DEFAULT 'secp-701',
		created_at TEXT NOT NULL
	)`,
	`CREATE TABLE IF NOT EXISTS quiz_sessions (
		id TEXT PRIMARY KEY,
		started_at TEXT NOT NULL,
		completed_at TEXT,
		type TEXT NOT NULL,
		domain INTEGER,
		total_questions INTEGER NOT NULL DEFAULT 0,
		correct_answers INTEGER NOT NULL DEFAULT 0,
		mode TEXT NOT NULL DEFAULT 'practice',
		status TEXT NOT NULL DEFAULT 'active',
		points_earned REAL NOT NULL DEFAULT 0,
		points_possible REAL NOT NULL DEFAULT 0,
		updated_at TEXT NOT NULL DEFAULT '',
		assignment_id TEXT,
		profile_id TEXT NOT NULL DEFAULT 'default',
		course_id TEXT NOT NULL DEFAULT 'secp-701',
		elapsed_seconds INTEGER,
		duration_seconds INTEGER
	)`,
	`CREATE TABLE IF NOT EXISTS quiz_answers (
		id SERIAL PRIMARY KEY,
		session_id TEXT NOT NULL,
		question_index INTEGER NOT NULL,
		prompt TEXT NOT NULL DEFAULT '',
		domain INTEGER NOT NULL,
		category TEXT,
		correct_answer TEXT NOT NULL DEFAULT '',
		user_answer TEXT NOT NULL DEFAULT '',
		is_correct INTEGER NOT NULL DEFAULT 0,
		question_id TEXT,
		objective TEXT,
		response_json TEXT,
		points_earned REAL NOT NULL DEFAULT 0,
		points_possible REAL NOT NULL DEFAULT 0,
		profile_id TEXT NOT NULL DEFAULT 'default',
		course_id TEXT NOT NULL DEFAULT 'secp-701',
		FOREIGN KEY (session_id) REFERENCES quiz_sessions(id)
	)`,
	`CREATE TABLE IF NOT EXISTS domain_progress (
		profile_id TEXT NOT NULL,
		course_id TEXT NOT NULL,
		domain INTEGER NOT NULL,
		total_attempted INTEGER NOT NULL DEFAULT 0,
		total_correct INTEGER NOT NULL DEFAULT 0,
		points_earned REAL NOT NULL DEFAULT 0,
		points_possible REAL NOT NULL DEFAULT 0,
		last_reviewed_at TEXT,
		PRIMARY KEY (profile_id, course_id, domain)
	)`,
	`CREATE TABLE IF NOT EXISTS quiz_session_state (
		session_id TEXT PRIMARY KEY,
		schema_version INTEGER NOT NULL,
		deadline_at TEXT,
		current_index INTEGER NOT NULL DEFAULT 0,
		questions_json TEXT NOT NULL,
		result_json TEXT,
		updated_at TEXT NOT NULL,
		FOREIGN KEY (session_id) REFERENCES quiz_sessions(id)
	)`,
	`CREATE TABLE IF NOT EXISTS quiz_session_responses (
		session_id TEXT NOT NULL,
		question_index INTEGER NOT NULL,
		response_json TEXT,
		flagged INTEGER NOT NULL DEFAULT 0,
		retries INTEGER NOT NULL DEFAULT 0,
		hint_used INTEGER NOT NULL DEFAULT 0,
		answered_at TEXT,
		PRIMARY KEY(session_id, question_index),
		FOREIGN KEY (session_id) REFERENCES quiz_sessions(id)
	)`,
	`CREATE TABLE IF NOT EXISTS review_cards (
		profile_id TEXT NOT NULL,
		course_id TEXT NOT NULL,
		question_id TEXT NOT NULL,
		interval_days REAL NOT NULL DEFAULT 0,
		ease REAL NOT NULL DEFAULT 2.5,
		lapses INTEGER NOT NULL DEFAULT 0,
		due_at TEXT NOT NULL,
		last_result TEXT,
		review_count INTEGER NOT NULL DEFAULT 0,
		first_seen_at TEXT NOT NULL,
		PRIMARY KEY (profile_id, course_id, question_id)
	)`,
	`CREATE TABLE IF NOT EXISTS study_log (
		profile_id TEXT NOT NULL,
		date_key TEXT NOT NULL,
		questions INTEGER NOT NULL DEFAULT 0,
		sessions INTEGER NOT NULL DEFAULT 0,
		updated_at TEXT NOT NULL,
		PRIMARY KEY (profile_id, date_key)
	)`,
	`CREATE TABLE IF NOT EXISTS course_meta (
		profile_id TEXT NOT NULL,
		course_id TEXT NOT NULL,
		key TEXT NOT NULL,
		value TEXT NOT NULL,
		PRIMARY KEY (profile_id, course_id, key)
	)`,
	`CREATE TABLE IF NOT EXISTS course_modules (
		id TEXT PRIMARY KEY,
		course_id TEXT NOT NULL DEFAULT 'secp-701',
		week INTEGER NOT NULL,
		title TEXT NOT NULL,
		description TEXT NOT NULL,
		position INTEGER NOT NULL
	)`,
	`CREATE TABLE IF NOT EXISTS course_lessons (
		id TEXT PRIMARY KEY,
		course_id TEXT NOT NULL DEFAULT 'secp-701',
		module_id TEXT NOT NULL,
		title TEXT NOT NULL,
		summary TEXT NOT NULL,
		content TEXT NOT NULL DEFAULT '',
		objective_ids TEXT,
		position INTEGER NOT NULL
	)`,
	`CREATE TABLE IF NOT EXISTS course_assignments (
		id TEXT PRIMARY KEY,
		course_id TEXT NOT NULL DEFAULT 'secp-701',
		module_id TEXT NOT NULL,
		title TEXT NOT NULL,
		description TEXT NOT NULL,
		kind TEXT NOT NULL,
		category TEXT NOT NULL,
		points REAL NOT NULL,
		count INTEGER NOT NULL,
		domain INTEGER,
		mode TEXT NOT NULL,
		duration_minutes INTEGER NOT NULL,
		due_offset_days INTEGER NOT NULL,
		position INTEGER NOT NULL
	)`,
	`CREATE TABLE IF NOT EXISTS course_assignment_submissions (
		profile_id TEXT NOT NULL,
		assignment_id TEXT NOT NULL,
		session_id TEXT NOT NULL,
		earned REAL NOT NULL,
		percentage REAL NOT NULL,
		completed_at TEXT NOT NULL,
		PRIMARY KEY (profile_id, assignment_id, session_id)
	)`,
	`CREATE TABLE IF NOT EXISTS course_assignment_overrides (
		profile_id TEXT NOT NULL,
		course_id TEXT NOT NULL,
		assignment_id TEXT NOT NULL,
		due_date TEXT NOT NULL,
		updated_at TEXT NOT NULL,
		PRIMARY KEY (profile_id, course_id, assignment_id)
	)`,
	`CREATE TABLE IF NOT EXISTS course_lesson_completions (
		profile_id TEXT NOT NULL,
		lesson_id TEXT NOT NULL,
		completed_at TEXT NOT NULL,
		PRIMARY KEY (profile_id, lesson_id)
	)`,
	`CREATE TABLE IF NOT EXISTS google_oauth (
		profile_id TEXT PRIMARY KEY,
		access_token TEXT NOT NULL,
		refresh_token TEXT NOT NULL,
		expires_at INTEGER NOT NULL,
		email TEXT NOT NULL,
		calendar_id TEXT,
		created_at TEXT NOT NULL,
		updated_at TEXT NOT NULL
	)`,
	`CREATE TABLE IF NOT EXISTS google_synced_events (
		profile_id TEXT NOT NULL,
		source TEXT NOT NULL,
		event_id TEXT NOT NULL,
		summary TEXT NOT NULL,
		due_date TEXT NOT NULL,
		synced_at TEXT NOT NULL,
		PRIMARY KEY (profile_id, source)
	)`,
	// An .ics file the user uploaded to overlay their real calendar on the course
	// grid — one import per profile+course, replaced wholesale on re-import.
	`CREATE TABLE IF NOT EXISTS calendar_imports (
		profile_id TEXT NOT NULL,
		course_id TEXT NOT NULL,
		source_name TEXT NOT NULL,
		events_json TEXT NOT NULL,
		imported_at TEXT NOT NULL,
		PRIMARY KEY (profile_id, course_id)
	)`,
	`CREATE INDEX IF NOT EXISTS idx_quiz_sessions_status ON quiz_sessions(status)`,
	`CREATE INDEX IF NOT EXISTS idx_quiz_sessions_profile_course ON quiz_sessions(profile_id, course_id)`,
	`CREATE INDEX IF NOT EXISTS idx_quiz_answers_session ON quiz_answers(session_id)`,
	`CREATE INDEX IF NOT EXISTS idx_quiz_answers_profile_course ON quiz_answers(profile_id, course_id)`,
	`CREATE INDEX IF NOT EXISTS idx_domain_progress_profile_course ON domain_progress(profile_id, course_id)`,
	`CREATE INDEX IF NOT EXISTS idx_review_cards_due ON review_cards(profile_id, course_id, due_at)`,
	`CREATE INDEX IF NOT EXISTS idx_study_log_profile ON study_log(profile_id)`,
	`CREATE INDEX IF NOT EXISTS idx_course_modules_course ON course_modules(course_id)`,
	`CREATE INDEX IF NOT EXISTS idx_course_lessons_course ON course_lessons(course_id)`,
	`CREATE INDEX IF NOT EXISTS idx_course_assignments_course ON course_assignments(course_id)`,
	// One active session per scope — enforced in the database, mirrored by the
	// service layer's ACTIVE_SESSION_EXISTS guard.
	`CREATE UNIQUE INDEX IF NOT EXISTS quiz_sessions_one_active_scope
		ON quiz_sessions(profile_id, course_id)
		WHERE status = 'active'`
];

/** Tables holding per-user runtime data; content tables are re-seedable. */
export const PG_RUNTIME_TABLES: string[] = [
	// Children of quiz_sessions first (foreign keys are enforced during the wipe).
	'quiz_answers',
	'quiz_session_responses',
	'quiz_session_state',
	'quiz_sessions',
	'domain_progress',
	'review_cards',
	'study_log',
	'course_meta',
	'course_assignment_submissions',
	'course_assignment_overrides',
	'course_lesson_completions',
	'google_oauth',
	'google_synced_events',
	'calendar_imports'
];

/** Every table in the runtime shape, in safe truncate order. */
export const PG_ALL_TABLES: string[] = [...PG_RUNTIME_TABLES, 'profiles'];

/** Applies the schema idempotently (CREATE ... IF NOT EXISTS throughout). */
export async function applyPgSchema(sql: postgres.Sql): Promise<void> {
	for (const statement of PG_SCHEMA_STATEMENTS) await sql.unsafe(statement);
}
