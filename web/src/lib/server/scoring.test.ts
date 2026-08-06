import { describe, expect, it } from 'vitest';
import { loadQuestionBank, type ChoiceDefinition, type FillBlankDefinition, type NumericDefinition, type SortDefinition, type WordBankDefinition } from './question-bank';
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
		expect(scoreQuestion(order, { kind: 'ordering', itemIds: [order.correctOrder[0], ...order.correctOrder.slice(2), order.correctOrder[1]] }).earnedPoints).toBe(1 / 6);
		const numeric = bank.pbqs.find((question): question is NumericDefinition => question.kind === 'numeric' && question.tolerance > 0)!;
		expect(scoreQuestion(numeric, { kind: 'numeric', value: numeric.correctValue + numeric.tolerance }).earnedPoints).toBe(1);
	});

	it('scores fill-blank with case-insensitive normalization and partial credit', () => {
		const fill: FillBlankDefinition = {
			id: 'pbq-1-998',
			domain: 1,
			objective: '1.4',
			format: 'pbq',
			prompt: 'The cipher that uses the same key to encrypt and decrypt is called ____.',
			explanation: 'Symmetric ciphers use one shared key.',
			sourceRefs: [{ source: 'exam-objectives', section: '1.4' }],
			kind: 'fill-blank',
			blanks: [
				{ id: 'b1', label: 'Cipher type', placeholder: 'term', acceptedAnswers: ['symmetric', 'symmetrical'] },
				{ id: 'b2', label: 'Integrity function', placeholder: 'term', acceptedAnswers: ['hash', 'hash function'] }
			]
		};
		const values = Object.fromEntries(fill.blanks.map((blank) => [blank.id, blank.acceptedAnswers[0]]));
		expect(scoreQuestion(fill, { kind: 'fill-blank', values }).earnedPoints).toBe(1);
		// Case + whitespace-insensitive: answer in different case still fully correct
		const upper = Object.fromEntries(fill.blanks.map((blank) => [blank.id, blank.acceptedAnswers[0].toUpperCase()]));
		expect(scoreQuestion(fill, { kind: 'fill-blank', values: upper }).earnedPoints).toBe(1);
		// One wrong blank -> partial credit for the rest
		const partial = { ...values, [fill.blanks[0].id]: 'wrong' };
		expect(scoreQuestion(fill, { kind: 'fill-blank', values: partial }).earnedPoints).toBe((fill.blanks.length - 1) / fill.blanks.length);
		expect(scoreQuestion(fill, { kind: 'fill-blank', values: {} }).earnedPoints).toBe(0);
	});

	it('scores word-bank assignments with partial credit', () => {
		const wordBank = bank.pbqs.find((question): question is WordBankDefinition => question.kind === 'word-bank')!;
		expect(scoreQuestion(wordBank, { kind: 'word-bank', assignments: wordBank.correctAssignments }).earnedPoints).toBe(1);
		const shuffled = { ...wordBank.correctAssignments, [wordBank.blanks[0].id]: wordBank.bank.find((w) => w.id !== wordBank.correctAssignments[wordBank.blanks[0].id])!.id };
		expect(scoreQuestion(wordBank, { kind: 'word-bank', assignments: shuffled }).earnedPoints).toBe((wordBank.blanks.length - 1) / wordBank.blanks.length);
		expect(scoreQuestion(wordBank, { kind: 'word-bank', assignments: {} }).earnedPoints).toBe(0);
	});

	it('scores sort bucket assignments with partial credit', () => {
		const sort: SortDefinition = {
			id: 'pbq-5-999',
			domain: 5,
			objective: '5.1',
			format: 'pbq',
			prompt: 'Classify each security control by type.',
			explanation: 'Controls map to preventive, detective, or corrective categories.',
			sourceRefs: [{ source: 'exam-objectives', section: '5.1' }],
			kind: 'sort',
			items: [
				{ id: 'i1', text: 'Firewall ruleset' },
				{ id: 'i2', text: 'Log review' },
				{ id: 'i3', text: 'Backup restoration' },
				{ id: 'i4', text: 'Vulnerability scan' }
			],
			buckets: [
				{ id: 'b1', label: 'Preventive' },
				{ id: 'b2', label: 'Detective' },
				{ id: 'b3', label: 'Corrective' },
				{ id: 'b4', label: 'Neither' }
			],
			correctBuckets: { i1: 'b1', i2: 'b2', i3: 'b3', i4: 'b2' }
		};
		expect(scoreQuestion(sort, { kind: 'sort', assignments: sort.correctBuckets }).earnedPoints).toBe(1);
		const oneWrong = { ...sort.correctBuckets, i4: 'b1' };
		expect(scoreQuestion(sort, { kind: 'sort', assignments: oneWrong }).earnedPoints).toBe(3 / 4);
		expect(scoreQuestion(sort, { kind: 'sort', assignments: {} }).earnedPoints).toBe(0);
	});
});
