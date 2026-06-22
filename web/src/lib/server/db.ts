import Database from 'better-sqlite3';
import path from 'node:path';

const DB_PATH = path.resolve(import.meta.dirname, '../../../data/quiz.db');

let _db: Database.Database | null = null;

function getDb(): Database.Database {
	if (!_db) {
		_db = new Database(DB_PATH);
		_db.pragma('journal_mode = WAL');
		initSchema();
	}
	return _db;
}

function initSchema(): void {
	const db = _db!;

	db.exec(`
		CREATE TABLE IF NOT EXISTS quiz_sessions (
			id TEXT PRIMARY KEY,
			started_at TEXT NOT NULL,
			completed_at TEXT,
			type TEXT NOT NULL,
			domain INTEGER,
			total_questions INTEGER NOT NULL DEFAULT 0,
			correct_answers INTEGER NOT NULL DEFAULT 0
		);

		CREATE TABLE IF NOT EXISTS quiz_answers (
			id INTEGER PRIMARY KEY AUTOINCREMENT,
			session_id TEXT NOT NULL,
			question_index INTEGER NOT NULL,
			prompt TEXT NOT NULL,
			domain INTEGER NOT NULL,
			category TEXT,
			correct_answer TEXT NOT NULL,
			user_answer TEXT NOT NULL,
			is_correct INTEGER NOT NULL DEFAULT 0,
			FOREIGN KEY (session_id) REFERENCES quiz_sessions(id)
		);

		CREATE TABLE IF NOT EXISTS domain_progress (
			domain INTEGER PRIMARY KEY,
			total_attempted INTEGER NOT NULL DEFAULT 0,
			total_correct INTEGER NOT NULL DEFAULT 0,
			last_reviewed_at TEXT
		);
	`);
}

// ─── Session CRUD ───

export function createSession(
	id: string,
	type: string,
	domain: number | null
): void {
	const db = getDb();
	db.prepare(`
		INSERT INTO quiz_sessions (id, started_at, type, domain)
		VALUES (?, ?, ?, ?)
	`).run(id, new Date().toISOString(), type, domain);
}

export function completeSession(id: string, correct: number, total: number): void {
	const db = getDb();
	db.prepare(`
		UPDATE quiz_sessions
		SET completed_at = ?, correct_answers = ?, total_questions = ?
		WHERE id = ?
	`).run(new Date().toISOString(), correct, total, id);
}

export function insertAnswer(
	sessionId: string,
	questionIndex: number,
	prompt: string,
	domain: number,
	category: string | null,
	correctAnswer: string,
	userAnswer: string,
	isCorrect: boolean
): void {
	const db = getDb();
	db.prepare(`
		INSERT INTO quiz_answers (session_id, question_index, prompt, domain, category, correct_answer, user_answer, is_correct)
		VALUES (?, ?, ?, ?, ?, ?, ?, ?)
	`).run(sessionId, questionIndex, prompt, domain, category, correctAnswer, userAnswer, isCorrect ? 1 : 0);

	// Update domain progress
	db.prepare(`
		INSERT INTO domain_progress (domain, total_attempted, total_correct, last_reviewed_at)
		VALUES (?, 1, ?, ?)
		ON CONFLICT(domain) DO UPDATE SET
			total_attempted = total_attempted + 1,
			total_correct = total_correct + ?,
			last_reviewed_at = ?
	`).run(domain, isCorrect ? 1 : 0, new Date().toISOString(), isCorrect ? 1 : 0, new Date().toISOString());
}

// ─── Queries ───

export function getSessionResult(sessionId: string): {
	correct: number;
	total: number;
	domainBreakdown: Record<number, { correct: number; total: number }>;
	type: string;
	completedAt: string | null;
} | null {
	const db = getDb();
	const session = db.prepare(`
		SELECT * FROM quiz_sessions WHERE id = ?
	`).get(sessionId) as any;
	if (!session) return null;

	const answers = db.prepare(`
		SELECT * FROM quiz_answers WHERE session_id = ?
	`).all(sessionId) as any[];

	const domainBreakdown: Record<number, { correct: number; total: number }> = {};
	for (const a of answers) {
		if (!domainBreakdown[a.domain]) {
			domainBreakdown[a.domain] = { correct: 0, total: 0 };
		}
		domainBreakdown[a.domain].total++;
		if (a.is_correct) domainBreakdown[a.domain].correct++;
	}

	return {
		correct: session.correct_answers,
		total: session.total_questions,
		domainBreakdown,
		type: session.type,
		completedAt: session.completed_at,
	};
}

export function getAllDomainProgress(): Record<number, { attempted: number; correct: number; percentage: number; lastReviewed: string | null }> {
	const db = getDb();
	const rows = db.prepare('SELECT * FROM domain_progress').all() as any[];
	const result: Record<number, any> = {};
	for (const r of rows) {
		result[r.domain] = {
			attempted: r.total_attempted,
			correct: r.total_correct,
			percentage: r.total_attempted > 0 ? Math.round((r.total_correct / r.total_attempted) * 100) : 0,
			lastReviewed: r.last_reviewed_at,
		};
	}
	return result;
}

export function getRecentSessions(limit = 10): any[] {
	const db = getDb();
	return db.prepare(`
		SELECT * FROM quiz_sessions
		WHERE completed_at IS NOT NULL
		ORDER BY completed_at DESC
		LIMIT ?
	`).all(limit);
}

export function getWeakTopics(minAttempts = 3): { domain: number; category: string; correct: number; total: number; percentage: number }[] {
	const db = getDb();
	const rows = db.prepare(`
		SELECT domain, category,
			SUM(is_correct) as correct,
			COUNT(*) as total
		FROM quiz_answers
		GROUP BY domain, category
		HAVING total >= ? AND (CAST(SUM(is_correct) AS REAL) / COUNT(*)) < 0.7
		ORDER BY (CAST(SUM(is_correct) AS REAL) / COUNT(*)) ASC
	`).all(minAttempts) as any[];

	return rows.map(r => ({
		domain: r.domain,
		category: r.category || 'general',
		correct: r.correct,
		total: r.total,
		percentage: Math.round((r.correct / r.total) * 100),
	}));
}
