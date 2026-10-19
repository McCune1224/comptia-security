import { describe, expect, it } from 'vitest';
import { execFileSync } from 'node:child_process';
import postgres from 'postgres';
import { createTestRepository, testDatabaseUrl } from './test-db';
import { loadQuestionBank, correctResponse } from './question-bank';
import { createQuizService } from './quiz';
import { PG_RUNTIME_TABLES } from './schema-pg';
import { runtimeTables } from '../../../scripts/reset-runtime.mjs';

describe('reset-runtime script', () => {
	it('wipes exactly the tables the schema marks as runtime data', () => {
		// The script cannot import PG_RUNTIME_TABLES (it runs under plain node),
		// so the list is duplicated there on purpose and guarded here.
		expect(runtimeTables).toEqual(PG_RUNTIME_TABLES);
	});

	it('wipes FK-linked runtime rows without constraint errors and keeps profiles', async () => {
		const repository = await createTestRepository();
		const bank = loadQuestionBank();
		const service = createQuizService({ repository, bank, rng: () => 0.5 });
		// Seed real runtime rows, including quiz_answers (FK -> quiz_sessions).
		const session = await service.startSession({ type: 'quiz', count: 5 });
		// The MCQ bank mixes choice and non-choice kinds (e.g. word-bank short-form),
		// so respond with each question's correct shape. Sessions expose public questions,
		// so resolve the full definition from the bank to build a valid response.
		const byId = new Map([...bank.mcqs, ...bank.pbqs].map((question) => [question.id, question]));
		for (let i = 0; i < session.questions.length; i++) {
			const def = byId.get(session.questions[i].id);
			if (!def) throw new Error(`missing definition for ${session.questions[i].id}`);
			await service.saveResponse(session.sessionId, i, correctResponse(def));
		}
		await service.completeSession(session.sessionId);
		await repository.close();

		execFileSync(
			'node',
			['scripts/reset-runtime.mjs', '--database-url', testDatabaseUrl(), '--yes'],
			{ stdio: 'pipe' }
		);

		const sql = postgres(testDatabaseUrl(), { max: 1 });
		try {
			for (const table of PG_RUNTIME_TABLES) {
				const rows = await sql.unsafe(`SELECT COUNT(*)::int AS count FROM "${table}"`);
				expect(rows[0].count).toBe(0);
			}
			const profiles = await sql`SELECT id FROM profiles ORDER BY created_at`;
			expect(profiles.map((row) => row.id)).toEqual(['default', 'ash']);
		} finally {
			await sql.end({ timeout: 5 });
		}
	});
});
