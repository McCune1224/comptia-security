import { describe, expect, it } from 'vitest';
import { loadAplus1202Bank } from './bank-aplus-1202';
import { toPublicQuestion } from './question-bank';

describe('A+ Core 2 (220-1202) question bank', () => {
	it('has the required authored allocation and redacts public questions', () => {
		const bank = loadAplus1202Bank();
		expect(bank.mcqs).toHaveLength(150);
		expect(bank.pbqs).toHaveLength(28);
		expect(bank.mcqs.filter((question) => question.format === 'scenario')).toHaveLength(150);
		expect(bank.mcqs.filter((question) => question.kind === 'multiple-choice')).toHaveLength(22);
		expect(new Set([...bank.mcqs, ...bank.pbqs].map((question) => question.id)).size).toBe(178);
		// Core 2 has FOUR domains — ids use a2-<domain>-<nnn> with domain 1-4
		expect(bank.mcqs.every((question) => /^a2-[1-4]-\d{3}$/.test(question.id))).toBe(true);
		expect(bank.pbqs.every((question) => /^a2-pbq-[1-4]-\d{3}$/.test(question.id))).toBe(true);
		const publicQuestion = toPublicQuestion(bank.mcqs[0]);
		expect(JSON.stringify(publicQuestion)).not.toContain('correctOptionIds');
		expect(JSON.stringify(publicQuestion)).not.toContain('rationale');
		expect(JSON.stringify(publicQuestion)).not.toContain('explanation');
	});
});
