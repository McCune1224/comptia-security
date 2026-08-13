import { describe, expect, it } from 'vitest';
import { execFileSync } from 'node:child_process';
import { rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import Database from 'better-sqlite3';
import { createQuizRepository } from './db';
import { loadQuestionBank } from './question-bank';
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
		for (let i = 0; i < session.questions.length; i++) {
			const question = session.questions[i];
			const optionIds =
				question.kind === 'single-choice' || question.kind === 'multiple-choice'
					? question.options.slice(0, question.kind === 'multiple-choice' ? question.selectCount : 1).map((option) => option.id)
					: [];
			service.saveResponse(session.sessionId, i, { kind: 'choice', optionIds });
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
