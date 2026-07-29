import { describe, expect, it } from 'vitest';
import { loadQuestionBank, toPublicQuestion } from './question-bank';

describe('question bank', () => {
	it('has the required authored allocation and redacts public questions', () => {
		const bank = loadQuestionBank();
		expect(bank.mcqs).toHaveLength(200);
		expect(bank.pbqs).toHaveLength(30);
		expect(bank.mcqs.filter((question) => question.format === 'scenario')).toHaveLength(200);
		expect(new Set([...bank.mcqs, ...bank.pbqs].map((question) => question.id)).size).toBe(230);
		const publicQuestion = toPublicQuestion(bank.mcqs[0]);
		expect(JSON.stringify(publicQuestion)).not.toContain('correctOptionIds');
		expect(JSON.stringify(publicQuestion)).not.toContain('rationale');
		expect(JSON.stringify(publicQuestion)).not.toContain('explanation');
	});
});
