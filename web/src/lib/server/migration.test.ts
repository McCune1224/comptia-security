import { afterEach, describe, expect, it } from 'vitest';
import Database from 'better-sqlite3';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { createQuizRepository, createScopedRepo, MAX_PROFILES } from './db';

const tempFiles: string[] = [];
function tempDb(): string {
	const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'quiz-migrate-'));
	const file = path.join(dir, 'test.db');
	tempFiles.push(dir);
	return file;
}

afterEach(() => {
	for (const dir of tempFiles.splice(0)) fs.rmSync(dir, { recursive: true, force: true });
});

/** The exact v5 schema the real quiz.db has (all v5 migrations applied, user_version = 5). */
function createV5Fixture(file: string): void {
	const db = new Database(file);
	db.exec(`
		CREATE TABLE quiz_sessions (id TEXT PRIMARY KEY, started_at TEXT NOT NULL, completed_at TEXT, type TEXT NOT NULL, domain INTEGER, total_questions INTEGER NOT NULL DEFAULT 0, correct_answers INTEGER NOT NULL DEFAULT 0, mode TEXT NOT NULL DEFAULT 'practice', status TEXT NOT NULL DEFAULT 'active', points_earned REAL NOT NULL DEFAULT 0, points_possible REAL NOT NULL DEFAULT 0, updated_at TEXT NOT NULL DEFAULT '', assignment_id TEXT);
		CREATE TABLE quiz_answers (id INTEGER PRIMARY KEY AUTOINCREMENT, session_id TEXT NOT NULL, question_index INTEGER NOT NULL, prompt TEXT NOT NULL DEFAULT '', domain INTEGER NOT NULL, category TEXT, correct_answer TEXT NOT NULL DEFAULT '', user_answer TEXT NOT NULL DEFAULT '', is_correct INTEGER NOT NULL DEFAULT 0, question_id TEXT, objective TEXT, response_json TEXT, points_earned REAL NOT NULL DEFAULT 0, points_possible REAL NOT NULL DEFAULT 0);
		CREATE TABLE domain_progress (domain INTEGER PRIMARY KEY, total_attempted INTEGER NOT NULL DEFAULT 0, total_correct INTEGER NOT NULL DEFAULT 0, points_earned REAL NOT NULL DEFAULT 0, points_possible REAL NOT NULL DEFAULT 0, last_reviewed_at TEXT);
		CREATE TABLE quiz_session_state (session_id TEXT PRIMARY KEY, schema_version INTEGER NOT NULL, deadline_at TEXT, current_index INTEGER NOT NULL DEFAULT 0, questions_json TEXT NOT NULL, result_json TEXT, updated_at TEXT NOT NULL);
		CREATE TABLE quiz_session_responses (session_id TEXT NOT NULL, question_index INTEGER NOT NULL, response_json TEXT, flagged INTEGER NOT NULL DEFAULT 0, answered_at TEXT, PRIMARY KEY(session_id, question_index));
		CREATE TABLE review_cards (question_id TEXT PRIMARY KEY, interval_days REAL NOT NULL DEFAULT 0, ease REAL NOT NULL DEFAULT 2.5, lapses INTEGER NOT NULL DEFAULT 0, due_at TEXT NOT NULL, last_result TEXT, review_count INTEGER NOT NULL DEFAULT 0, first_seen_at TEXT NOT NULL);
		CREATE TABLE study_log (date_key TEXT PRIMARY KEY, questions INTEGER NOT NULL DEFAULT 0, sessions INTEGER NOT NULL DEFAULT 0, updated_at TEXT NOT NULL);
		CREATE TABLE course_meta (key TEXT PRIMARY KEY, value TEXT NOT NULL);
		CREATE TABLE course_modules (id TEXT PRIMARY KEY, week INTEGER NOT NULL, title TEXT NOT NULL, description TEXT NOT NULL, position INTEGER NOT NULL);
		CREATE TABLE course_lessons (id TEXT PRIMARY KEY, module_id TEXT NOT NULL, title TEXT NOT NULL, summary TEXT NOT NULL, content TEXT NOT NULL DEFAULT '', position INTEGER NOT NULL);
		CREATE TABLE course_assignments (id TEXT PRIMARY KEY, module_id TEXT NOT NULL, title TEXT NOT NULL, description TEXT NOT NULL, kind TEXT NOT NULL, category TEXT NOT NULL, points REAL NOT NULL, count INTEGER NOT NULL, domain INTEGER, mode TEXT NOT NULL, duration_minutes INTEGER NOT NULL, due_offset_days INTEGER NOT NULL, position INTEGER NOT NULL);
		CREATE TABLE course_assignment_submissions (assignment_id TEXT NOT NULL, session_id TEXT NOT NULL, earned REAL NOT NULL, percentage REAL NOT NULL, completed_at TEXT NOT NULL, PRIMARY KEY (assignment_id, session_id));
		CREATE TABLE course_lesson_completions (lesson_id TEXT PRIMARY KEY, completed_at TEXT NOT NULL);
		CREATE TABLE google_oauth (id INTEGER PRIMARY KEY CHECK (id = 1), access_token TEXT NOT NULL, refresh_token TEXT NOT NULL, expires_at INTEGER NOT NULL, email TEXT NOT NULL, calendar_id TEXT, created_at TEXT NOT NULL, updated_at TEXT NOT NULL);
		CREATE TABLE google_synced_events (source TEXT PRIMARY KEY, event_id TEXT NOT NULL, summary TEXT NOT NULL, due_date TEXT NOT NULL, synced_at TEXT NOT NULL);
	`);
	db.prepare("INSERT INTO quiz_sessions (id, started_at, completed_at, type, domain, total_questions, correct_answers, mode, status, points_earned, points_possible, updated_at, assignment_id) VALUES ('sess-1', '2026-08-01T10:00:00.000Z', '2026-08-01T10:30:00.000Z', 'quiz', 1, 20, 18, 'practice', 'completed', 18, 20, '2026-08-01T10:30:00.000Z', 'a1-1')").run();
	db.prepare("INSERT INTO quiz_session_state (session_id, schema_version, deadline_at, current_index, questions_json, result_json, updated_at) VALUES ('sess-1', 1, NULL, 0, '[]', '{}', '2026-08-01T10:30:00.000Z')").run();
	db.prepare("INSERT INTO quiz_answers (session_id, question_index, prompt, domain, category, correct_answer, user_answer, is_correct, question_id, objective, response_json, points_earned, points_possible) VALUES ('sess-1', 0, 'q', 1, 'x', '', '{}', 1, 'q-1-1', '1.1', '{}', 1, 1), ('sess-1', 1, 'q', 1, 'x', '', '{}', 0, 'q-1-2', '1.2', '{}', 0, 1)").run();
	db.prepare('INSERT INTO domain_progress (domain, total_attempted, total_correct, points_earned, points_possible, last_reviewed_at) VALUES (1, 10, 8, 8, 10, NULL)').run();
	db.prepare("INSERT INTO review_cards (question_id, interval_days, ease, lapses, due_at, last_result, review_count, first_seen_at) VALUES ('q-1-1', 3, 2.6, 0, '2026-08-05', 'correct', 3, '2026-08-01T00:00:00.000Z')").run();
	db.prepare("INSERT INTO study_log (date_key, questions, sessions, updated_at) VALUES ('2026-08-01', 20, 1, '2026-08-01T10:30:00.000Z')").run();
	db.prepare("INSERT INTO course_meta (key, value) VALUES ('exam_date', '2026-09-30')").run();
	db.prepare("INSERT INTO course_assignment_submissions (assignment_id, session_id, earned, percentage, completed_at) VALUES ('a1-1', 'sess-1', 18, 90, '2026-08-01T10:30:00.000Z')").run();
	db.prepare("INSERT INTO course_lesson_completions (lesson_id, completed_at) VALUES ('lesson-1-1', '2026-08-01T09:00:00.000Z')").run();
	db.prepare("INSERT INTO google_oauth (id, access_token, refresh_token, expires_at, email, calendar_id, created_at, updated_at) VALUES (1, 'tok', 'ref', 123, 'me@example.com', 'cal-1', '2026-08-01T00:00:00.000Z', '2026-08-01T00:00:00.000Z')").run();
	db.prepare("INSERT INTO google_synced_events (source, event_id, summary, due_date, synced_at) VALUES ('exam', 'evt-1', '🎓 Exam', '2026-09-30', '2026-08-01T00:00:00.000Z')").run();
	db.pragma('user_version = 5');
	db.close();
}

const pkColumns = (db: Database.Database, table: string): string =>
	(db.prepare(`SELECT group_concat(name, ',') AS cols FROM pragma_table_info('${table}') WHERE pk > 0`).get() as { cols: string }).cols;

describe('v5 → v7 migration', () => {
	it('upgrades a v5 database in place, preserving and backfilling all progress', () => {
		const file = tempDb();
		createV5Fixture(file);
		expect(new Database(file, { readonly: true }).pragma('user_version', { simple: true })).toBe(5);

		const repo = createQuizRepository(file);
		repo.close();

		const db = new Database(file, { readonly: true });
		expect(db.pragma('user_version', { simple: true })).toBe(7);

		// Row counts preserved.
		expect((db.prepare('SELECT COUNT(*) c FROM quiz_sessions').get() as { c: number }).c).toBe(1);
		expect((db.prepare('SELECT COUNT(*) c FROM quiz_answers').get() as { c: number }).c).toBe(2);
		expect((db.prepare('SELECT COUNT(*) c FROM review_cards').get() as { c: number }).c).toBe(1);
		expect((db.prepare('SELECT COUNT(*) c FROM course_assignment_submissions').get() as { c: number }).c).toBe(1);
		expect((db.prepare('SELECT COUNT(*) c FROM google_synced_events').get() as { c: number }).c).toBe(1);

		// Sessions + answers backfilled to ('default','secp-701').
		const session = db.prepare("SELECT profile_id, course_id FROM quiz_sessions WHERE id = 'sess-1'").get() as { profile_id: string; course_id: string };
		expect(session).toEqual({ profile_id: 'default', course_id: 'secp-701' });
		expect((db.prepare("SELECT COUNT(*) c FROM quiz_answers WHERE profile_id = 'default' AND course_id = 'secp-701'").get() as { c: number }).c).toBe(2);

		// Primary keys rebuilt on all 8 tables.
		expect(pkColumns(db, 'domain_progress')).toBe('profile_id,course_id,domain');
		expect(pkColumns(db, 'review_cards')).toBe('profile_id,course_id,question_id');
		expect(pkColumns(db, 'study_log')).toBe('profile_id,date_key');
		expect(pkColumns(db, 'course_meta')).toBe('profile_id,course_id,key');
		expect(pkColumns(db, 'course_assignment_submissions')).toBe('profile_id,assignment_id,session_id');
		expect(pkColumns(db, 'course_lesson_completions')).toBe('profile_id,lesson_id');
		expect(pkColumns(db, 'google_oauth')).toBe('profile_id');
		expect(pkColumns(db, 'google_synced_events')).toBe('profile_id,source');

		// Scoped rows backfilled.
		expect((db.prepare("SELECT COUNT(*) c FROM domain_progress WHERE profile_id = 'default' AND course_id = 'secp-701'").get() as { c: number }).c).toBe(1);
		expect((db.prepare("SELECT COUNT(*) c FROM review_cards WHERE profile_id = 'default'").get() as { c: number }).c).toBe(1);
		expect((db.prepare("SELECT COUNT(*) c FROM study_log WHERE profile_id = 'default'").get() as { c: number }).c).toBe(1);
		expect((db.prepare("SELECT COUNT(*) c FROM course_assignment_submissions WHERE profile_id = 'default'").get() as { c: number }).c).toBe(1);
		expect((db.prepare("SELECT COUNT(*) c FROM course_lesson_completions WHERE profile_id = 'default'").get() as { c: number }).c).toBe(1);
		expect((db.prepare("SELECT COUNT(*) c FROM google_oauth WHERE profile_id = 'default'").get() as { c: number }).c).toBe(1);
		expect((db.prepare("SELECT COUNT(*) c FROM google_synced_events WHERE profile_id = 'default'").get() as { c: number }).c).toBe(1);

		// The user's exam date survives, now scoped (one row per active course
		// after seeding — this asserts the migrated secp-701 row).
		const exam = db.prepare("SELECT value FROM course_meta WHERE profile_id = 'default' AND course_id = 'secp-701' AND key = 'exam_date'").get() as { value: string };
		expect(exam.value).toBe('2026-09-30');
		expect((db.prepare("SELECT COUNT(*) c FROM course_meta WHERE profile_id = 'default' AND course_id = 'secp-701' AND key = 'exam_date'").get() as { c: number }).c).toBe(1);

		// Profiles seeded; content tables carry course_id.
		expect(db.prepare("SELECT name FROM profiles WHERE id = 'default'").get()).toMatchObject({ name: 'Alex' });
		expect(db.prepare("SELECT name FROM profiles WHERE id = 'ash'").get()).toMatchObject({ name: 'Ash' });
		expect((db.prepare("SELECT COUNT(*) c FROM course_modules WHERE course_id = 'secp-701'").get() as { c: number }).c).toBe(4);
		expect((db.prepare("SELECT COUNT(*) c FROM course_lessons WHERE course_id = 'secp-701'").get() as { c: number }).c).toBe(7);
		db.close();
	});

	it('is idempotent — reopening a v7 database is a no-op', () => {
		const file = tempDb();
		createV5Fixture(file);
		createQuizRepository(file).close();
		createQuizRepository(file).close();
		const db = new Database(file, { readonly: true });
		expect(db.pragma('user_version', { simple: true })).toBe(7);
		expect((db.prepare('SELECT COUNT(*) c FROM quiz_sessions').get() as { c: number }).c).toBe(1);
		expect((db.prepare('SELECT COUNT(*) c FROM review_cards').get() as { c: number }).c).toBe(1);
		expect((db.prepare("SELECT value FROM course_meta WHERE profile_id = 'default' AND course_id = 'secp-701' AND key = 'exam_date'").get() as { value: string }).value).toBe('2026-09-30');
		db.close();
	});
});

describe('fresh databases', () => {
	it('reaches the v6 shape directly with both profiles and exam dates seeded', () => {
		const repo = createQuizRepository(':memory:');
		expect(repo.getProfiles()).toHaveLength(2);
		expect(repo.getProfiles().map((p) => p.id)).toEqual(['default', 'ash']);
		expect(repo.getProfiles().find((p) => p.id === 'default')).toMatchObject({ id: 'default', name: 'Alex', courseId: 'secp-701' });
		expect(repo.getProfiles().find((p) => p.id === 'ash')).toMatchObject({ id: 'ash', name: 'Ash', courseId: 'aplus-1201' });
		expect(repo.getExamDate()).toMatch(/^\d{4}-\d{2}-\d{2}$/);
		expect(repo.getCourseModules()).toHaveLength(4);
		expect(repo.getCourseLessons()).toHaveLength(7);
		expect(repo.getCourseAssignments()).toHaveLength(12);
		// No cross-profile leakage possible on a fresh DB: default scope only.
		expect(repo.getActiveSession()).toBeNull();
		expect(repo.getReviewCards()).toHaveLength(0);
		repo.close();
	});
});

describe('scope isolation', () => {
	it('keeps two profiles completely isolated (sessions, review cards, exam dates, submissions, study log)', () => {
		const repo = createQuizRepository(':memory:');
		const alice = createScopedRepo(repo, { profileId: 'alice', courseId: 'secp-701' });
		const bob = createScopedRepo(repo, { profileId: 'bob', courseId: 'secp-701' });

		alice.createSession({ id: 'a-sess', type: 'quiz', mode: 'practice', domain: 1, startedAt: '2026-08-05T10:00:00.000Z', deadlineAt: null, questions: [] });
		expect(alice.getActiveSession()?.summary.id).toBe('a-sess');
		expect(bob.getActiveSession()).toBeNull();
		expect(bob.getSession('a-sess')).toBeNull(); // cross-scope session lookup is a miss

		alice.upsertReviewCard({ questionId: 'q-1', intervalDays: 2, ease: 2.5, lapses: 0, dueAt: '2026-08-07', lastResult: 'correct', reviewCount: 1, firstSeenAt: '2026-08-05T00:00:00.000Z' });
		expect(alice.getReviewCards()).toHaveLength(1);
		expect(bob.getReviewCards()).toHaveLength(0);

		alice.setExamDate('2026-10-15');
		expect(alice.getExamDate()).toBe('2026-10-15');
		expect(bob.getExamDate()).not.toBe('2026-10-15');

		alice.recordStudyDay('2026-08-05', 20, '2026-08-05T10:00:00.000Z');
		expect(alice.getStudyLog()).toHaveLength(1);
		expect(bob.getStudyLog()).toHaveLength(0);

		alice.recordSubmission({ assignmentId: 'a1-1', sessionId: 'a-sess', earned: 18, percentage: 90, completedAt: '2026-08-05T10:00:00.000Z' });
		expect(alice.getSubmissions()).toHaveLength(1);
		expect(bob.getSubmissions()).toHaveLength(0);

		alice.saveGoogleOAuth({ accessToken: 'a', refreshToken: 'r', expiresAt: 1, email: 'a@example.com' });
		expect(alice.getGoogleOAuth()?.email).toBe('a@example.com');
		expect(bob.getGoogleOAuth()).toBeNull();

		alice.recordSyncedEvent('exam', 'evt-1', '🎓 Exam', '2026-10-15', '2026-08-05T00:00:00.000Z');
		expect(alice.getSyncedEvents()).toHaveLength(1);
		expect(bob.getSyncedEvents()).toHaveLength(0);

		// Abandoning in one scope never touches the other scope's session.
		expect(bob.abandon('a-sess', '2026-08-05T10:05:00.000Z')).toBe(false);
		expect(alice.getActiveSession()).not.toBeNull();
		expect(alice.abandon('a-sess', '2026-08-05T10:05:00.000Z')).toBe(true);
		repo.close();
	});

	it('isolates a completed session across scopes end-to-end (answers + domain progress)', () => {
		const repo = createQuizRepository(':memory:');
		const alice = createScopedRepo(repo, { profileId: 'alice', courseId: 'secp-701' });
		const bob = createScopedRepo(repo, { profileId: 'bob', courseId: 'secp-701' });

		alice.createSession({ id: 's1', type: 'quiz', mode: 'practice', domain: 1, startedAt: '2026-08-05T10:00:00.000Z', deadlineAt: null, questions: [] });
		const result = {
			sessionId: 's1', type: 'quiz' as const, mode: 'practice' as const, earnedPoints: 0, possiblePoints: 0,
			percentage: 0, fullyCorrect: 0, totalQuestions: 0, flaggedQuestionIndexes: [], objectiveBreakdown: {},
			domainBreakdown: { 1: { earnedPoints: 0, possiblePoints: 0, fullyCorrect: 0, totalQuestions: 0 }, 2: { earnedPoints: 0, possiblePoints: 0, fullyCorrect: 0, totalQuestions: 0 }, 3: { earnedPoints: 0, possiblePoints: 0, fullyCorrect: 0, totalQuestions: 0 }, 4: { earnedPoints: 0, possiblePoints: 0, fullyCorrect: 0, totalQuestions: 0 }, 5: { earnedPoints: 0, possiblePoints: 0, fullyCorrect: 0, totalQuestions: 0 } },
			completedAt: '2026-08-05T10:30:00.000Z', review: []
		};
		alice.complete('s1', result, [], '2026-08-05T10:30:00.000Z');
		expect(alice.getAllCompletedSessions()).toHaveLength(1);
		expect(bob.getAllCompletedSessions()).toHaveLength(0);
		expect(bob.getSession('s1')).toBeNull();
		repo.close();
	});
});

describe('profile management', () => {
	it('enforces the hard cap of two profiles (Alex + Ash seeded)', () => {
		const repo = createQuizRepository(':memory:');
		expect(repo.getProfiles()).toHaveLength(2);
		expect(() => repo.createProfile('Third', '#f0b04c')).toThrow(`cap of ${MAX_PROFILES}`);
		repo.renameProfile('ash', 'Ash B');
		expect(repo.getProfiles().find((p) => p.id === 'ash')?.name).toBe('Ash B');
		repo.close();
	});

	it('remembers each profile\'s course (profile→course coupling)', () => {
		const repo = createQuizRepository(':memory:');
		expect(repo.getProfiles().find((p) => p.id === 'default')?.courseId).toBe('secp-701');
		expect(repo.getProfiles().find((p) => p.id === 'ash')?.courseId).toBe('aplus-1201');

		// Switching courses updates the active profile's preference.
		repo.setProfileCourse('ash', 'aplus-1202');
		expect(repo.getProfiles().find((p) => p.id === 'ash')?.courseId).toBe('aplus-1202');

		// New profiles inherit the caller-provided course.
		repo.deleteProfile('ash');
		const created = repo.createProfile('New', '#f0b04c', 'aplus-1201');
		expect(created.courseId).toBe('aplus-1201');
		repo.close();
	});

	it('deleting a profile removes its data and frees the cap; default is protected', () => {
		const repo = createQuizRepository(':memory:');
		const scope = createScopedRepo(repo, { profileId: 'ash', courseId: 'secp-701' });
		scope.setExamDate('2026-11-01');
		scope.recordStudyDay('2026-08-05', 5, '2026-08-05T00:00:00.000Z');
		scope.createSession({ id: 'ash-sess', type: 'quiz', mode: 'practice', domain: null, startedAt: '2026-08-05T10:00:00.000Z', deadlineAt: null, questions: [] });

		expect(() => repo.deleteProfile('default')).toThrow('default profile cannot be deleted');
		repo.deleteProfile('ash');
		expect(repo.getProfiles().map((p) => p.id)).toEqual(['default']);
		expect(repo.getProfiles()).toHaveLength(1);
		// Data for the deleted profile is gone.
		expect(createScopedRepo(repo, { profileId: 'ash', courseId: 'secp-701' }).getStudyLog()).toHaveLength(0);
		expect(createScopedRepo(repo, { profileId: 'ash', courseId: 'secp-701' }).getActiveSession()).toBeNull();
		// Cap freed.
		repo.createProfile('New', '#b7f04c');
		expect(repo.getProfiles()).toHaveLength(2);
		repo.close();
	});
});

describe('seed upsert healing', () => {
	it('re-stamps course_ids on rows backfilled with the default scope during the v5→v6 window', () => {
		const file = tempDb();
		const repo = createQuizRepository(file);
		repo.close();
		// Simulate the hot-reload accident that produced the empty A+ syllabus:
		// A+ module/assignment rows were seeded into the v5 schema (no scope
		// columns), then the v6 ALTER backfilled them with the 'secp-701'
		// DEFAULT. INSERT OR IGNORE could never repair that; the seed upsert can.
		const db = new Database(file);
		db.prepare("UPDATE course_modules SET course_id = 'secp-701' WHERE id LIKE 'ap1-%' OR id LIKE 'ap2-%'").run();
		db.prepare("UPDATE course_assignments SET course_id = 'secp-701' WHERE id LIKE 'ap1-%' OR id LIKE 'ap2-%'").run();
		db.close();

		// Reopen: seeding must upsert the correct course_id back, not ignore.
		createQuizRepository(file).close();

		const healed = new Database(file, { readonly: true });
		expect(healed.prepare('SELECT course_id, COUNT(*) c FROM course_modules GROUP BY course_id ORDER BY course_id').all()).toEqual([
			{ course_id: 'aplus-1201', c: 4 },
			{ course_id: 'aplus-1202', c: 4 },
			{ course_id: 'secp-701', c: 4 }
		]);
		expect(healed.prepare('SELECT course_id, COUNT(*) c FROM course_assignments GROUP BY course_id ORDER BY course_id').all()).toEqual([
			{ course_id: 'aplus-1201', c: 12 },
			{ course_id: 'aplus-1202', c: 12 },
			{ course_id: 'secp-701', c: 12 }
		]);
		healed.close();
	});
});
