-- PostgreSQL schema for CompTIA Security+ Course
-- This replaces the SQLite schema for production deployment on Railway

-- Profiles table
CREATE TABLE IF NOT EXISTS profiles (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    color TEXT NOT NULL DEFAULT '#67B8A8',
    course_id TEXT NOT NULL DEFAULT 'secp-701',
    created_at TEXT NOT NULL
);

-- Quiz sessions
CREATE TABLE IF NOT EXISTS quiz_sessions (
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
);

-- Quiz answers
CREATE TABLE IF NOT EXISTS quiz_answers (
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
);

-- Domain progress
CREATE TABLE IF NOT EXISTS domain_progress (
    profile_id TEXT NOT NULL,
    course_id TEXT NOT NULL,
    domain INTEGER NOT NULL,
    total_attempted INTEGER NOT NULL DEFAULT 0,
    total_correct INTEGER NOT NULL DEFAULT 0,
    points_earned REAL NOT NULL DEFAULT 0,
    points_possible REAL NOT NULL DEFAULT 0,
    last_reviewed_at TEXT,
    PRIMARY KEY (profile_id, course_id, domain)
);

-- Quiz session state
CREATE TABLE IF NOT EXISTS quiz_session_state (
    session_id TEXT PRIMARY KEY,
    schema_version INTEGER NOT NULL,
    deadline_at TEXT,
    current_index INTEGER NOT NULL DEFAULT 0,
    questions_json TEXT NOT NULL,
    result_json TEXT,
    updated_at TEXT NOT NULL,
    FOREIGN KEY (session_id) REFERENCES quiz_sessions(id)
);

-- Quiz session responses
CREATE TABLE IF NOT EXISTS quiz_session_responses (
    session_id TEXT NOT NULL,
    question_index INTEGER NOT NULL,
    response_json TEXT,
    flagged INTEGER NOT NULL DEFAULT 0,
    retries INTEGER NOT NULL DEFAULT 0,
    hint_used INTEGER NOT NULL DEFAULT 0,
    answered_at TEXT,
    PRIMARY KEY(session_id, question_index),
    FOREIGN KEY (session_id) REFERENCES quiz_sessions(id)
);

-- Review cards (spaced repetition)
CREATE TABLE IF NOT EXISTS review_cards (
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
);

-- Study log
CREATE TABLE IF NOT EXISTS study_log (
    profile_id TEXT NOT NULL,
    date_key TEXT NOT NULL,
    questions INTEGER NOT NULL DEFAULT 0,
    sessions INTEGER NOT NULL DEFAULT 0,
    updated_at TEXT NOT NULL,
    PRIMARY KEY (profile_id, date_key)
);

-- Course metadata
CREATE TABLE IF NOT EXISTS course_meta (
    profile_id TEXT NOT NULL,
    course_id TEXT NOT NULL,
    key TEXT NOT NULL,
    value TEXT NOT NULL,
    PRIMARY KEY (profile_id, course_id, key)
);

-- Course modules
CREATE TABLE IF NOT EXISTS course_modules (
    id TEXT PRIMARY KEY,
    course_id TEXT NOT NULL DEFAULT 'secp-701',
    week INTEGER NOT NULL,
    title TEXT NOT NULL,
    description TEXT NOT NULL,
    position INTEGER NOT NULL
);

-- Course lessons
CREATE TABLE IF NOT EXISTS course_lessons (
    id TEXT PRIMARY KEY,
    course_id TEXT NOT NULL DEFAULT 'secp-701',
    module_id TEXT NOT NULL,
    title TEXT NOT NULL,
    summary TEXT NOT NULL,
    content TEXT NOT NULL DEFAULT '',
    objective_ids TEXT,
    position INTEGER NOT NULL
);

-- Course assignments
CREATE TABLE IF NOT EXISTS course_assignments (
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
);

-- Course assignment submissions
CREATE TABLE IF NOT EXISTS course_assignment_submissions (
    profile_id TEXT NOT NULL,
    assignment_id TEXT NOT NULL,
    session_id TEXT NOT NULL,
    earned REAL NOT NULL,
    percentage REAL NOT NULL,
    completed_at TEXT NOT NULL,
    PRIMARY KEY (profile_id, assignment_id, session_id)
);

-- Course lesson completions
CREATE TABLE IF NOT EXISTS course_lesson_completions (
    profile_id TEXT NOT NULL,
    lesson_id TEXT NOT NULL,
    completed_at TEXT NOT NULL,
    PRIMARY KEY (profile_id, lesson_id)
);

-- Google OAuth
CREATE TABLE IF NOT EXISTS google_oauth (
    profile_id TEXT PRIMARY KEY,
    access_token TEXT NOT NULL,
    refresh_token TEXT NOT NULL,
    expires_at INTEGER NOT NULL,
    email TEXT NOT NULL,
    calendar_id TEXT,
    created_at TEXT NOT NULL,
    updated_at TEXT NOT NULL
);

-- Google synced events
CREATE TABLE IF NOT EXISTS google_synced_events (
    profile_id TEXT NOT NULL,
    source TEXT NOT NULL,
    event_id TEXT NOT NULL,
    summary TEXT NOT NULL,
    due_date TEXT NOT NULL,
    synced_at TEXT NOT NULL,
    PRIMARY KEY (profile_id, source)
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_quiz_sessions_status ON quiz_sessions(status);
CREATE INDEX IF NOT EXISTS idx_quiz_sessions_profile_course ON quiz_sessions(profile_id, course_id);
CREATE INDEX IF NOT EXISTS idx_quiz_answers_session ON quiz_answers(session_id);
CREATE INDEX IF NOT EXISTS idx_quiz_answers_profile_course ON quiz_answers(profile_id, course_id);
CREATE INDEX IF NOT EXISTS idx_domain_progress_profile_course ON domain_progress(profile_id, course_id);
CREATE INDEX IF NOT EXISTS idx_review_cards_due ON review_cards(profile_id, course_id, due_at);
CREATE INDEX IF NOT EXISTS idx_study_log_profile ON study_log(profile_id);
CREATE INDEX IF NOT EXISTS idx_course_modules_course ON course_modules(course_id);
CREATE INDEX IF NOT EXISTS idx_course_lessons_course ON course_lessons(course_id);
CREATE INDEX IF NOT EXISTS idx_course_assignments_course ON course_assignments(course_id);

-- Unique index for active sessions (one per scope)
CREATE UNIQUE INDEX IF NOT EXISTS quiz_sessions_one_active_scope
    ON quiz_sessions(profile_id, course_id)
    WHERE status = 'active';
