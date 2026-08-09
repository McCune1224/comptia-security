import { describe, expect, it } from 'vitest';
import { loadQuestionBank, type ChoiceDefinition, type FillBlankDefinition, type HotspotDefinition, type MemoryDefinition, type NumericDefinition, type SliderDefinition, type SortDefinition, type WordBankDefinition } from './question-bank';
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
		const numeric: NumericDefinition = {
			id: 'pbq-5-997',
			domain: 5,
			objective: '5.2',
			format: 'pbq',
			prompt: 'Synthetic numeric item for tolerance scoring.',
			explanation: 'Synthetic — legacy kind, engine-side scoring only.',
			sourceRefs: [{ source: 'exam-objectives', section: '5.2' }],
			kind: 'numeric',
			unit: 'USD',
			correctValue: 100,
			tolerance: 5
		};
		expect(scoreQuestion(numeric, { kind: 'numeric', value: numeric.correctValue + numeric.tolerance }).earnedPoints).toBe(1);
		expect(scoreQuestion(numeric, { kind: 'numeric', value: numeric.correctValue + numeric.tolerance + 1 }).earnedPoints).toBe(0);
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

	it('scores hotspot taps with a wrong-tap penalty and partial credit', () => {
		const hotspot: HotspotDefinition = {
			id: 'pbq-5-998',
			domain: 5,
			objective: '5.1',
			format: 'pbq',
			prompt: 'Tap the OSI layers that are connection-oriented.',
			explanation: 'Transport (TCP) and Session maintain state; the others are not.',
			sourceRefs: [{ source: 'exam-objectives', section: '5.1' }],
			kind: 'hotspot',
			template: 'osi-stack',
			regions: [
				{ id: 'r1', label: 'Application', x1: 0, y1: 0, x2: 100, y2: 14.3, correct: false },
				{ id: 'r2', label: 'Presentation', x1: 0, y1: 14.3, x2: 100, y2: 28.6, correct: false },
				{ id: 'r3', label: 'Session', x1: 0, y1: 28.6, x2: 100, y2: 42.9, correct: true },
				{ id: 'r4', label: 'Transport', x1: 0, y1: 42.9, x2: 100, y2: 57.2, correct: true },
				{ id: 'r5', label: 'Network', x1: 0, y1: 57.2, x2: 100, y2: 71.5, correct: false },
				{ id: 'r6', label: 'Data Link', x1: 0, y1: 71.5, x2: 100, y2: 85.8, correct: false },
				{ id: 'r7', label: 'Physical', x1: 0, y1: 85.8, x2: 100, y2: 100, correct: false }
			]
		};
		// Both correct taps -> full credit.
		expect(scoreQuestion(hotspot, { kind: 'hotspot', regionIds: ['r3', 'r4'] }).earnedPoints).toBe(1);
		// One correct, one wrong -> 0 (hit - miss = 0 over 2).
		expect(scoreQuestion(hotspot, { kind: 'hotspot', regionIds: ['r3', 'r1'] }).earnedPoints).toBe(0);
		// One of two correct -> partial 0.5.
		expect(scoreQuestion(hotspot, { kind: 'hotspot', regionIds: ['r3'] }).earnedPoints).toBe(0.5);
		// Only wrong taps -> 0.
		expect(scoreQuestion(hotspot, { kind: 'hotspot', regionIds: ['r1'] }).earnedPoints).toBe(0);
		// Empty -> 0.
		expect(scoreQuestion(hotspot, { kind: 'hotspot', regionIds: [] }).earnedPoints).toBe(0);
	});

	it('scores memory pair matches without a guessing penalty', () => {
		const memory: MemoryDefinition = {
			id: 'pbq-5-996',
			domain: 5,
			objective: '5.1',
			format: 'pbq',
			prompt: 'Match each service to its well-known port.',
			explanation: 'Well-known ports map to their services.',
			sourceRefs: [{ source: 'exam-objectives', section: '5.1' }],
			kind: 'memory',
			pairs: [
				{ id: 'p1', a: 'SSH', b: '22' },
				{ id: 'p2', a: 'DNS', b: '53' },
				{ id: 'p3', a: 'HTTP', b: '80' },
				{ id: 'p4', a: 'HTTPS', b: '443' }
			]
		};
		// All pairs matched -> full credit.
		expect(scoreQuestion(memory, { kind: 'memory', matchedPairIds: ['p1', 'p2', 'p3', 'p4'] }).earnedPoints).toBe(1);
		// Half matched -> 0.5 (no penalty for attempts).
		expect(scoreQuestion(memory, { kind: 'memory', matchedPairIds: ['p1', 'p2'] }).earnedPoints).toBe(0.5);
		// Unknown ids are simply not counted (validateResponse blocks them upstream).
		expect(scoreQuestion(memory, { kind: 'memory', matchedPairIds: ['p1', 'zzz'] }).earnedPoints).toBe(0.25);
		// Empty -> 0.
		expect(scoreQuestion(memory, { kind: 'memory', matchedPairIds: [] }).earnedPoints).toBe(0);
	});

	it('scores slider values with a tolerance band', () => {
		const slider: SliderDefinition = {
			id: 'pbq-5-992',
			domain: 5,
			objective: '5.1',
			format: 'pbq',
			prompt: 'What is the default SSH port?',
			explanation: 'SSH listens on TCP 22.',
			sourceRefs: [{ source: 'exam-objectives', section: '5.1' }],
			kind: 'slider',
			min: 1,
			max: 65535,
			step: 1,
			unit: '',
			correctValue: 22,
			tolerance: 1
		};
		// Exact -> full credit.
		expect(scoreQuestion(slider, { kind: 'slider', value: 22 }).earnedPoints).toBe(1);
		// Within tolerance -> full credit.
		expect(scoreQuestion(slider, { kind: 'slider', value: 23 }).earnedPoints).toBe(1);
		// Out of tolerance -> 0.
		expect(scoreQuestion(slider, { kind: 'slider', value: 30 }).earnedPoints).toBe(0);
		// No response -> 0.
		expect(scoreQuestion(slider, null).earnedPoints).toBe(0);
	});

	it('applies the hint point cost without flipping fullyCorrect', () => {
		const choice: ChoiceDefinition = {
			id: 'pbq-5-989',
			domain: 5,
			objective: '5.2',
			format: 'pbq',
			prompt: 'Synthetic choice item for hint scoring.',
			explanation: 'Synthetic.',
			sourceRefs: [{ source: 'exam-objectives', section: '5.2' }],
			kind: 'single-choice',
			options: [
				{ id: 'a', text: 'Correct', rationale: 'Correct.' },
				{ id: 'b', text: 'Wrong', rationale: 'Wrong.' },
				{ id: 'c', text: 'Wrong', rationale: 'Wrong.' },
				{ id: 'd', text: 'Wrong', rationale: 'Wrong.' }
			],
			correctOptionIds: ['a'],
			selectCount: 1
		};
		// No hint -> full credit and fullyCorrect.
		const plain = scoreQuestion(choice, { kind: 'choice', optionIds: ['a'] });
		expect(plain.earnedPoints).toBe(1);
		expect(plain.fullyCorrect).toBe(true);
		// Hint used -> 0.75 but still fullyCorrect (raw correctness is unscaled).
		const hinted = scoreQuestion(choice, { kind: 'choice', optionIds: ['a'] }, { hintUsed: true });
		expect(hinted.earnedPoints).toBe(0.75);
		expect(hinted.fullyCorrect).toBe(true);
		// Wrong answer stays 0 even with a hint.
		expect(scoreQuestion(choice, { kind: 'choice', optionIds: ['b'] }, { hintUsed: true }).earnedPoints).toBe(0);
	});
});
