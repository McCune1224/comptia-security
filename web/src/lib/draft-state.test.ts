import { describe, it, expect } from 'vitest';
import { hasDraftWork, isDraftComplete } from '$lib/draft-state';
import type { PublicQuestion, QuestionResponse } from '$lib/types';

const base = {
	id: 'q1',
	domain: 1,
	objective: '1.1',
	format: 'standard',
	prompt: 'Prompt'
} as const;

const wordBank: PublicQuestion = {
	...base,
	kind: 'word-bank',
	blanks: [
		{ id: 'b1', label: 'Blank 1' },
		{ id: 'b2', label: 'Blank 2' }
	],
	bank: [
		{ id: 'w1', word: 'TLS' },
		{ id: 'w2', word: 'SSH' }
	]
};

const matching: PublicQuestion = {
	...base,
	kind: 'matching',
	premises: [
		{ id: 'p1', text: 'Premise 1' },
		{ id: 'p2', text: 'Premise 2' }
	],
	targets: [
		{ id: 't1', text: 'Target 1' },
		{ id: 't2', text: 'Target 2' }
	]
};

const sort: PublicQuestion = {
	...base,
	kind: 'sort',
	items: [
		{ id: 'i1', text: 'Item 1' },
		{ id: 'i2', text: 'Item 2' }
	],
	buckets: [
		{ id: 'k1', label: 'Bucket 1' },
		{ id: 'k2', label: 'Bucket 2' }
	]
};

const singleChoice: PublicQuestion = {
	...base,
	kind: 'single-choice',
	options: [
		{ id: 'o1', text: 'Option 1' },
		{ id: 'o2', text: 'Option 2' }
	],
	selectCount: 1
};

const multiChoice: PublicQuestion = {
	...base,
	kind: 'multiple-choice',
	options: [
		{ id: 'o1', text: 'Option 1' },
		{ id: 'o2', text: 'Option 2' },
		{ id: 'o3', text: 'Option 3' }
	],
	selectCount: 2
};

const ordering: PublicQuestion = {
	...base,
	kind: 'ordering',
	items: [
		{ id: 'i1', text: 'Item 1' },
		{ id: 'i2', text: 'Item 2' },
		{ id: 'i3', text: 'Item 3' }
	]
};

const wordBankStep: PublicQuestion = {
	...base,
	id: 'step-1',
	kind: 'word-bank',
	blanks: [{ id: 'b1', label: 'Blank 1' }],
	bank: [{ id: 'w1', word: 'TLS' }]
};

const choiceStep: PublicQuestion = {
	...base,
	id: 'step-2',
	kind: 'single-choice',
	options: [
		{ id: 'o1', text: 'Option 1' },
		{ id: 'o2', text: 'Option 2' }
	],
	selectCount: 1
};

const multiStep: PublicQuestion = {
	...base,
	kind: 'multi-step',
	context: 'Context',
	steps: [wordBankStep, choiceStep]
};

const filledWordBankStep: QuestionResponse = { kind: 'word-bank', assignments: { b1: 'w1' } };
const chosenStep: QuestionResponse = { kind: 'choice', optionIds: ['o1'] };

describe('hasDraftWork (practice drafts worth persisting)', () => {
	it('word-bank: one filled blank counts as work', () => {
		expect(hasDraftWork(wordBank, { kind: 'word-bank', assignments: { b1: 'w1' } })).toBe(true);
		expect(hasDraftWork(wordBank, { kind: 'word-bank', assignments: {} })).toBe(false);
	});

	it('matching: one chosen pair counts as work', () => {
		expect(hasDraftWork(matching, { kind: 'matching', matches: { p1: 't1' } })).toBe(true);
		expect(hasDraftWork(matching, { kind: 'matching', matches: {} })).toBe(false);
	});

	it('sort: one bucketed item counts as work', () => {
		expect(hasDraftWork(sort, { kind: 'sort', assignments: { i1: 'k1' } })).toBe(true);
		expect(hasDraftWork(sort, { kind: 'sort', assignments: {} })).toBe(false);
	});

	it('choice: one selected option counts as work', () => {
		expect(hasDraftWork(multiChoice, { kind: 'choice', optionIds: ['o1'] })).toBe(true);
		expect(hasDraftWork(singleChoice, { kind: 'choice', optionIds: [] })).toBe(false);
	});

	it('ordering: a reordered list counts as work, an empty one does not', () => {
		expect(hasDraftWork(ordering, { kind: 'ordering', itemIds: ['i2', 'i1', 'i3'] })).toBe(true);
		expect(hasDraftWork(ordering, { kind: 'ordering', itemIds: [] })).toBe(false);
	});

	it('multi-step: any non-null step counts as work (existing practice rule)', () => {
		expect(hasDraftWork(multiStep, { kind: 'multi-step', stepResponses: [null, chosenStep] })).toBe(
			true
		);
		expect(
			hasDraftWork(multiStep, { kind: 'multi-step', stepResponses: [filledWordBankStep, null] })
		).toBe(true);
		expect(hasDraftWork(multiStep, { kind: 'multi-step', stepResponses: [null, null] })).toBe(
			false
		);
	});

	it('memory and hotspot: at least one match / region counts as work', () => {
		const memory: PublicQuestion = {
			...base,
			kind: 'memory',
			pairs: [
				{ id: 'm1', a: 'A', b: 'B' },
				{ id: 'm2', a: 'C', b: 'D' }
			]
		};
		const hotspot: PublicQuestion = {
			...base,
			kind: 'hotspot',
			template: 'osi-stack',
			regions: [{ id: 'r1', label: 'R', x1: 0, y1: 0, x2: 10, y2: 10 }]
		};
		expect(hasDraftWork(memory, { kind: 'memory', matchedPairIds: ['m1'] })).toBe(true);
		expect(hasDraftWork(memory, { kind: 'memory', matchedPairIds: [] })).toBe(false);
		expect(hasDraftWork(hotspot, { kind: 'hotspot', regionIds: ['r1'] })).toBe(true);
		expect(hasDraftWork(hotspot, { kind: 'hotspot', regionIds: [] })).toBe(false);
	});

	it('no response, or a response of the wrong kind, is not work', () => {
		expect(hasDraftWork(wordBank, null)).toBe(false);
		expect(hasDraftWork(wordBank, undefined)).toBe(false);
		expect(hasDraftWork(undefined, { kind: 'word-bank', assignments: { b1: 'w1' } })).toBe(false);
		expect(hasDraftWork(wordBank, { kind: 'sort', assignments: { i1: 'k1' } })).toBe(false);
	});
});

describe('isDraftComplete (graded saves + answered display)', () => {
	it('word-bank: complete only when every blank is filled', () => {
		expect(isDraftComplete(wordBank, { kind: 'word-bank', assignments: { b1: 'w1' } })).toBe(false);
		expect(
			isDraftComplete(wordBank, { kind: 'word-bank', assignments: { b1: 'w1', b2: 'w2' } })
		).toBe(true);
	});

	it('matching: complete only when every premise is matched', () => {
		expect(isDraftComplete(matching, { kind: 'matching', matches: { p1: 't1' } })).toBe(false);
		expect(isDraftComplete(matching, { kind: 'matching', matches: { p1: 't1', p2: 't2' } })).toBe(
			true
		);
	});

	it('sort: complete only when every item is bucketed', () => {
		expect(isDraftComplete(sort, { kind: 'sort', assignments: { i1: 'k1' } })).toBe(false);
		expect(isDraftComplete(sort, { kind: 'sort', assignments: { i1: 'k1', i2: 'k2' } })).toBe(true);
	});

	it('choice: complete when exactly selectCount options are selected', () => {
		expect(isDraftComplete(singleChoice, { kind: 'choice', optionIds: ['o1'] })).toBe(true);
		expect(isDraftComplete(multiChoice, { kind: 'choice', optionIds: ['o1'] })).toBe(false);
		expect(isDraftComplete(multiChoice, { kind: 'choice', optionIds: ['o1', 'o2'] })).toBe(true);
		expect(isDraftComplete(singleChoice, { kind: 'choice', optionIds: [] })).toBe(false);
	});

	it('ordering: complete when the full list is present', () => {
		expect(isDraftComplete(ordering, { kind: 'ordering', itemIds: ['i3', 'i2', 'i1'] })).toBe(true);
		expect(isDraftComplete(ordering, { kind: 'ordering', itemIds: ['i3', 'i1'] })).toBe(false);
	});

	it('multi-step: complete only when every step is answered', () => {
		expect(
			isDraftComplete(multiStep, {
				kind: 'multi-step',
				stepResponses: [filledWordBankStep, chosenStep]
			})
		).toBe(true);
		expect(
			isDraftComplete(multiStep, { kind: 'multi-step', stepResponses: [filledWordBankStep, null] })
		).toBe(false);
		expect(
			isDraftComplete(multiStep, {
				kind: 'multi-step',
				stepResponses: [{ kind: 'word-bank', assignments: {} }, chosenStep]
			})
		).toBe(false);
		expect(isDraftComplete(multiStep, { kind: 'multi-step', stepResponses: [null, null] })).toBe(
			false
		);
	});

	it('fill-blank and configuration: complete only when every field has a value', () => {
		const fillBlank: PublicQuestion = {
			...base,
			kind: 'fill-blank',
			blanks: [
				{ id: 'b1', label: 'Blank 1', placeholder: '____' },
				{ id: 'b2', label: 'Blank 2', placeholder: '____' }
			]
		};
		const configuration: PublicQuestion = {
			...base,
			kind: 'configuration',
			fields: [
				{ id: 'f1', label: 'Field 1', options: [{ id: 'v1', text: 'Value 1' }] },
				{ id: 'f2', label: 'Field 2', options: [{ id: 'v2', text: 'Value 2' }] }
			]
		};
		expect(isDraftComplete(fillBlank, { kind: 'fill-blank', values: { b1: 'one', b2: '' } })).toBe(
			false
		);
		expect(
			isDraftComplete(fillBlank, { kind: 'fill-blank', values: { b1: 'one', b2: 'two' } })
		).toBe(true);
		expect(
			isDraftComplete(configuration, { kind: 'configuration', values: { f1: 'v1', f2: '' } })
		).toBe(false);
		expect(
			isDraftComplete(configuration, { kind: 'configuration', values: { f1: 'v1', f2: 'v2' } })
		).toBe(true);
	});

	it('no response, or a response of the wrong kind, is not complete', () => {
		expect(isDraftComplete(wordBank, null)).toBe(false);
		expect(isDraftComplete(wordBank, undefined)).toBe(false);
		expect(isDraftComplete(undefined, { kind: 'word-bank', assignments: { b1: 'w1' } })).toBe(
			false
		);
		expect(isDraftComplete(wordBank, { kind: 'sort', assignments: { i1: 'k1', i2: 'k2' } })).toBe(
			false
		);
	});
});
