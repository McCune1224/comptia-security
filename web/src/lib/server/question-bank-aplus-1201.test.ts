import { describe, expect, it } from 'vitest';
import { loadAplus1201Bank } from './bank-aplus-1201';
import { toPublicQuestion } from './question-bank';

describe('A+ Core 1 (220-1201) question bank', () => {
	it('has the required authored allocation and redacts public questions', () => {
		const bank = loadAplus1201Bank();
		expect(bank.mcqs).toHaveLength(150);
		expect(bank.pbqs).toHaveLength(28);
		expect(bank.mcqs.filter((question) => question.format === 'scenario')).toHaveLength(150);
		expect(bank.mcqs.filter((question) => question.kind === 'multiple-choice')).toHaveLength(21);
		expect(new Set([...bank.mcqs, ...bank.pbqs].map((question) => question.id)).size).toBe(178);
		// every MCQ id uses the a1-<domain>-<nnn> scheme; PBQs use a1-pbq-<domain>-<nnn>
		expect(bank.mcqs.every((question) => /^a1-[1-5]-\d{3}$/.test(question.id))).toBe(true);
		expect(bank.pbqs.every((question) => /^a1-pbq-[1-5]-\d{3}$/.test(question.id))).toBe(true);
		const publicQuestion = toPublicQuestion(bank.mcqs[0]);
		expect(JSON.stringify(publicQuestion)).not.toContain('correctOptionIds');
		expect(JSON.stringify(publicQuestion)).not.toContain('rationale');
		expect(JSON.stringify(publicQuestion)).not.toContain('explanation');
	});
});
