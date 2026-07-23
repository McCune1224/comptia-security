import { describe, expect, it } from 'vitest';
import { loadQuestionBank, type ChoiceDefinition, type NumericDefinition } from './question-bank';
import { scoreQuestion } from './scoring';

const bank = loadQuestionBank();

describe('scoreQuestion', () => {
	it('scores single choice exactly and PBQ selection with a penalty', () => {
		const single = bank.mcqs.find((question) => question.kind === 'single-choice')!;
		expect(scoreQuestion(single, { kind: 'choice', optionIds: single.correctOptionIds }).earnedPoints).toBe(1);
		expect(scoreQuestion(single, { kind: 'choice', optionIds: ['z'] }).earnedPoints).toBe(0);
		const multi = bank.pbqs.find((question): question is ChoiceDefinition => question.kind === 'multiple-choice')!;
		expect(scoreQuestion(multi, { kind: 'choice', optionIds: [multi.correctOptionIds[0], 'c'] }).earnedPoints).toBe(0);
	});

	it('scores partial ordering, matching, configuration, and numeric tolerance', () => {
		const order = bank.pbqs.find((question) => question.kind === 'ordering')!;
		expect(scoreQuestion(order, { kind: 'ordering', itemIds: [order.correctOrder[0], ...order.correctOrder.slice(2), order.correctOrder[1]] }).earnedPoints).toBe(0.25);
		const numeric = bank.pbqs.find((question): question is NumericDefinition => question.kind === 'numeric' && question.tolerance > 0)!;
		expect(scoreQuestion(numeric, { kind: 'numeric', value: numeric.correctValue + numeric.tolerance }).earnedPoints).toBe(1);
	});
});
