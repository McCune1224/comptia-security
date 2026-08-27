import { describe, expect, it } from 'vitest';
import { execFileSync } from 'node:child_process';
import { rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import Database from 'better-sqlite3';
import { createQuizRepository } from './db';
import { loadQuestionBank, correctResponse } from './question-bank';
import { createQuizService } from './quiz';

describe('reset-runtime script', () => {
	it('wipes FK-linked runtime rows without constraint errors and keeps profiles', () => {
		const dbPath = join(tmpdir(), `reset-runtime-test-${process.pid}-${Date.now()}.db`);
		rmSync(dbPath, { force: true });
		const repository = createQuizRepository(dbPath);
		const bank = loadQuestionBank();
		const service = createQuizService({ repository, bank, rng: () => 0.5 });
		// Seed real runtime rows, including quiz_answers (FK -> quiz_sessions).
		const session = service.startSession({ type: 'quiz', count: 5 });
		// The MCQ bank now mixes choice and non-choice kinds (e.g. word-bank short-form),
		// so respond with each question's correct shape. Sessions expose public questions,
		// so resolve the full definition from the bank to build a valid response.
		const byId = new Map([...bank.mcqs, ...bank.pbqs].map((question) => [question.id, question]));
		for (let i = 0; i < session.questions.length; i++) {
			const def = byId.get(session.questions[i].id);
			if (!def) throw new Error(`missing definition for ${session.questions[i].id}`);
			service.saveResponse(session.sessionId, i, correctResponse(def));
		}
		service.completeSession(session.sessionId);
		repository.close();

		execFileSync('node', ['scripts/reset-runtime.mjs', '--db', dbPath, '--yes'], {
			stdio: 'pipe'
		});

		const db = new Database(dbPath, { readonly: true });
		for (const table of [
			'quiz_sessions',
			'quiz_answers',
			'quiz_session_responses',
			'quiz_session_state',
			'domain_progress',
			'study_log',
			'course_assignment_submissions',
			'course_lesson_completions'
		]) {
			const row = db.prepare(`SELECT COUNT(*) AS count FROM ${table}`).get() as { count: number };
			expect(row.count).toBe(0);
		}
		const profiles = db.prepare('SELECT COUNT(*) AS count FROM profiles').get() as { count: number };
		expect(profiles.count).toBe(2);
		const defaultProfile = db.prepare("SELECT id FROM profiles WHERE id = 'default'").get() as { id: string };
		expect(defaultProfile.id).toBe('default');
		db.close();
		rmSync(dbPath, { force: true });
		rmSync(`${dbPath}-wal`, { force: true });
		rmSync(`${dbPath}-shm`, { force: true });
	});
});
