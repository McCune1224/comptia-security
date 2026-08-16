import { describe, expect, it } from 'vitest';
import { loadQuestionBank, toPublicQuestion, validateQuestionBank, type ChoiceDefinition, type CourseBankSpec, type FillBlankDefinition, type HotspotDefinition, type MemoryDefinition, type SliderDefinition, type SortDefinition } from './question-bank';

describe('question bank', () => {
	it('rejects malformed sort definitions but accepts well-formed ones', () => {
		const spec: CourseBankSpec = {
			courseId: 'secp-701',
			mcqTotal: 0,
			pbqTotal: 1,
			mcqIdPattern: /^mcq-none$/,
			pbqIdPattern: /^pbq-/,
			domains: [5],
			objectivesByDomain: { 5: ['5.1'] },
			mcqObjectiveTotals: {},
			mcqDomainTotals: { 5: 0 },
			multiTotals: { 5: 0 },
			scenarioTotals: { 5: 0 }
		};
		const base = {
			id: 'pbq-5-999',
			domain: 5 as const,
			objective: '5.1',
			format: 'pbq' as const,
			prompt: 'Classify each security control by type.',
			explanation: 'Controls map to preventive, detective, or corrective categories.',
			sourceRefs: [{ source: 'exam-objectives' as const, section: '5.1' }]
		};
		const items = [
			{ id: 'i1', text: 'Firewall ruleset' },
			{ id: 'i2', text: 'Log review' },
			{ id: 'i3', text: 'Backup restoration' },
			{ id: 'i4', text: 'Vulnerability scan' }
		];
		// Every bucket used -> no distractor bucket -> invalid.
		const noDistractor: SortDefinition = {
			...base,
			kind: 'sort',
			items,
			buckets: [
				{ id: 'b1', label: 'Preventive' },
				{ id: 'b2', label: 'Detective' }
			],
			correctBuckets: { i1: 'b1', i2: 'b2', i3: 'b1', i4: 'b2' }
		};
		expect(() => validateQuestionBank({ mcqs: [], pbqs: [noDistractor] }, spec)).toThrow(/invalid sort/);
		// Item assigned to a bucket that does not exist -> invalid.
		const badBucket: SortDefinition = {
			...base,
			kind: 'sort',
			items,
			buckets: [
				{ id: 'b1', label: 'Preventive' },
				{ id: 'b2', label: 'Detective' },
				{ id: 'b3', label: 'Neither' }
			],
			correctBuckets: { i1: 'b1', i2: 'b2', i3: 'b1', i4: 'zzz' }
		};
		expect(() => validateQuestionBank({ mcqs: [], pbqs: [badBucket] }, spec)).toThrow(/invalid sort/);
		// Well-formed: 4 items, 3 buckets with one distractor.
		const good: SortDefinition = {
			...base,
			kind: 'sort',
			items,
			buckets: [
				{ id: 'b1', label: 'Preventive' },
				{ id: 'b2', label: 'Detective' },
				{ id: 'b3', label: 'Neither' }
			],
			correctBuckets: { i1: 'b1', i2: 'b2', i3: 'b1', i4: 'b2' }
		};
		expect(() => validateQuestionBank({ mcqs: [], pbqs: [good] }, spec)).not.toThrow();
	});

	it('rejects fill-blank definitions (deprecated kind)', () => {
		const spec: CourseBankSpec = {
			courseId: 'secp-701',
			mcqTotal: 0,
			pbqTotal: 1,
			mcqIdPattern: /^mcq-none$/,
			pbqIdPattern: /^pbq-/,
			domains: [1],
			objectivesByDomain: { 1: ['1.4'] },
			mcqObjectiveTotals: {},
			mcqDomainTotals: { 1: 0 },
			multiTotals: { 1: 0 },
			scenarioTotals: { 1: 0 }
		};
		const legacy: FillBlankDefinition = {
			id: 'pbq-1-995',
			domain: 1,
			objective: '1.4',
			format: 'pbq',
			prompt: 'The symmetric cipher uses ____ keys.',
			explanation: 'Symmetric ciphers share one key.',
			sourceRefs: [{ source: 'exam-objectives', section: '1.4' }],
			kind: 'fill-blank',
			blanks: [{ id: 'b1', label: 'Key type', placeholder: 'term', acceptedAnswers: ['shared', 'same'] }]
		};
		expect(() => validateQuestionBank({ mcqs: [], pbqs: [legacy] }, spec)).toThrow(/deprecated/);
	});

	it('rejects malformed hotspot definitions but accepts well-formed ones', () => {
		const spec: CourseBankSpec = {
			courseId: 'secp-701',
			mcqTotal: 0,
			pbqTotal: 1,
			mcqIdPattern: /^mcq-none$/,
			pbqIdPattern: /^pbq-/,
			domains: [5],
			objectivesByDomain: { 5: ['5.1'] },
			mcqObjectiveTotals: {},
			mcqDomainTotals: { 5: 0 },
			multiTotals: { 5: 0 },
			scenarioTotals: { 5: 0 }
		};
		const bands = [0, 14.3, 28.6, 42.9, 57.2, 71.5, 85.8, 100];
		const region = (i: number, correct: boolean) => ({
			id: `r${i}`,
			label: `Layer ${i}`,
			x1: 0,
			y1: bands[i],
			x2: 100,
			y2: bands[i + 1],
			correct
		});
		const base = {
			id: 'pbq-5-997',
			domain: 5 as const,
			objective: '5.1',
			format: 'pbq' as const,
			prompt: 'Tap the OSI layers that match the description.',
			explanation: 'Layers map to the description in the prompt.',
			sourceRefs: [{ source: 'exam-objectives' as const, section: '5.1' }]
		};
		// No distractor region -> invalid.
		const allCorrect: HotspotDefinition = {
			...base,
			kind: 'hotspot',
			template: 'osi-stack',
			regions: Array.from({ length: 7 }, (_, i) => region(i, true))
		};
		expect(() => validateQuestionBank({ mcqs: [], pbqs: [allCorrect] }, spec)).toThrow(/invalid hotspot/);
		// Overlapping regions -> invalid (region 1 overlaps region 0's band).
		const overlap: HotspotDefinition = {
			...base,
			kind: 'hotspot',
			template: 'osi-stack',
			regions: [
				{ ...region(0, true) },
				{ ...region(1, false), y1: 5, y2: 20 },
				region(2, false),
				region(3, false),
				region(4, false),
				region(5, false),
				region(6, false)
			]
		};
		expect(() => validateQuestionBank({ mcqs: [], pbqs: [overlap] }, spec)).toThrow(/invalid hotspot/);
		// Unknown template -> invalid.
		const badTemplate: HotspotDefinition = {
			...base,
			kind: 'hotspot',
			template: 'not-a-template',
			regions: Array.from({ length: 7 }, (_, i) => region(i, i === 0))
		};
		expect(() => validateQuestionBank({ mcqs: [], pbqs: [badTemplate] }, spec)).toThrow(/invalid hotspot/);
		// Well-formed: 7 non-overlapping bands, one correct + distractors.
		const good: HotspotDefinition = {
			...base,
			kind: 'hotspot',
			template: 'osi-stack',
			regions: Array.from({ length: 7 }, (_, i) => region(i, i === 3))
		};
		expect(() => validateQuestionBank({ mcqs: [], pbqs: [good] }, spec)).not.toThrow();
	});

	it('rejects malformed memory definitions but accepts well-formed ones', () => {
		const spec: CourseBankSpec = {
			courseId: 'secp-701',
			mcqTotal: 0,
			pbqTotal: 1,
			mcqIdPattern: /^mcq-none$/,
			pbqIdPattern: /^pbq-/,
			domains: [5],
			objectivesByDomain: { 5: ['5.1'] },
			mcqObjectiveTotals: {},
			mcqDomainTotals: { 5: 0 },
			multiTotals: { 5: 0 },
			scenarioTotals: { 5: 0 }
		};
		const base = {
			id: 'pbq-5-993',
			domain: 5 as const,
			objective: '5.1',
			format: 'pbq' as const,
			prompt: 'Match each service to its well-known port.',
			explanation: 'Well-known ports map to their services.',
			sourceRefs: [{ source: 'exam-objectives' as const, section: '5.1' }]
		};
		// Fewer than 4 pairs -> invalid.
		const tooFew: MemoryDefinition = {
			...base,
			kind: 'memory',
			pairs: [
				{ id: 'p1', a: 'SSH', b: '22' },
				{ id: 'p2', a: 'DNS', b: '53' },
				{ id: 'p3', a: 'HTTP', b: '80' }
			]
		};
		expect(() => validateQuestionBank({ mcqs: [], pbqs: [tooFew] }, spec)).toThrow(/invalid memory/);
		// Duplicate card text across the board -> invalid.
		const dupText: MemoryDefinition = {
			...base,
			kind: 'memory',
			pairs: [
				{ id: 'p1', a: 'SSH', b: '22' },
				{ id: 'p2', a: 'DNS', b: '53' },
				{ id: 'p3', a: 'HTTP', b: '80' },
				{ id: 'p4', a: 'HTTP', b: '443' }
			]
		};
		expect(() => validateQuestionBank({ mcqs: [], pbqs: [dupText] }, spec)).toThrow(/invalid memory/);
		// Well-formed: 4 unique pairs -> accepts.
		const good: MemoryDefinition = {
			...base,
			kind: 'memory',
			pairs: [
				{ id: 'p1', a: 'SSH', b: '22' },
				{ id: 'p2', a: 'DNS', b: '53' },
				{ id: 'p3', a: 'HTTP', b: '80' },
				{ id: 'p4', a: 'HTTPS', b: '443' }
			]
		};
		expect(() => validateQuestionBank({ mcqs: [], pbqs: [good] }, spec)).not.toThrow();
	});

	it('rejects malformed slider definitions but accepts well-formed ones', () => {
		const spec: CourseBankSpec = {
			courseId: 'secp-701',
			mcqTotal: 0,
			pbqTotal: 1,
			mcqIdPattern: /^mcq-none$/,
			pbqIdPattern: /^pbq-/,
			domains: [5],
			objectivesByDomain: { 5: ['5.1'] },
			mcqObjectiveTotals: {},
			mcqDomainTotals: { 5: 0 },
			multiTotals: { 5: 0 },
			scenarioTotals: { 5: 0 }
		};
		const base = {
			id: 'pbq-5-990',
			domain: 5 as const,
			objective: '5.1',
			format: 'pbq' as const,
			prompt: 'What is the default SSH port?',
			explanation: 'SSH listens on TCP 22.',
			sourceRefs: [{ source: 'exam-objectives' as const, section: '5.1' }]
		};
		// correctValue out of range -> invalid.
		const outOfRange: SliderDefinition = {
			...base,
			kind: 'slider',
			min: 1,
			max: 100,
			step: 1,
			unit: '',
			correctValue: 200,
			tolerance: 1
		};
		expect(() => validateQuestionBank({ mcqs: [], pbqs: [outOfRange] }, spec)).toThrow(/invalid slider/);
		// step <= 0 -> invalid.
		const badStep: SliderDefinition = {
			...base,
			kind: 'slider',
			min: 1,
			max: 100,
			step: 0,
			unit: '',
			correctValue: 50,
			tolerance: 1
		};
		expect(() => validateQuestionBank({ mcqs: [], pbqs: [badStep] }, spec)).toThrow(/invalid slider/);
		// Well-formed -> accepts.
		const good: SliderDefinition = {
			...base,
			kind: 'slider',
			min: 1,
			max: 100,
			step: 1,
			unit: '',
			correctValue: 22,
			tolerance: 1
		};
		expect(() => validateQuestionBank({ mcqs: [], pbqs: [good] }, spec)).not.toThrow();
	});

	it('rejects hints that reveal the correct answer but accepts safe ones', () => {
		const spec: CourseBankSpec = {
			courseId: 'secp-701',
			mcqTotal: 0,
			pbqTotal: 1,
			mcqIdPattern: /^mcq-none$/,
			pbqIdPattern: /^pbq-/,
			domains: [5],
			objectivesByDomain: { 5: ['5.1'] },
			mcqObjectiveTotals: {},
			mcqDomainTotals: { 5: 0 },
			multiTotals: { 5: 0 },
			scenarioTotals: { 5: 0 }
		};
		const base: ChoiceDefinition = {
			id: 'pbq-5-996',
			domain: 5,
			objective: '5.1',
			format: 'pbq',
			prompt: 'Which protocol is used for secure remote administration?',
			explanation: 'SSH provides encrypted remote administration.',
			sourceRefs: [{ source: 'exam-objectives', section: '5.1' }],
			kind: 'single-choice',
			options: [
				{ id: 'a', text: 'SSH', rationale: 'Correct.' },
				{ id: 'b', text: 'DNS', rationale: 'Wrong.' },
				{ id: 'c', text: 'HTTP', rationale: 'Wrong.' },
				{ id: 'd', text: 'SMTP', rationale: 'Wrong.' }
			],
			correctOptionIds: ['a'],
			selectCount: 1
		};
		const leaking = { ...base, hint: 'The answer is Secure Shell (SSH).' };
		expect(() => validateQuestionBank({ mcqs: [], pbqs: [leaking] }, spec)).toThrow(/hint must not reveal/);
		const safe = { ...base, hint: 'Think about remote command-line administration.' };
		expect(() => validateQuestionBank({ mcqs: [], pbqs: [safe] }, spec)).not.toThrow();
	});

	it('has the required authored allocation and redacts public questions', () => {
		const bank = loadQuestionBank();
		expect(bank.mcqs).toHaveLength(332);
		expect(bank.pbqs).toHaveLength(105);
		expect(bank.mcqs.filter((question) => question.format === 'scenario')).toHaveLength(332);
		expect(new Set([...bank.mcqs, ...bank.pbqs].map((question) => question.id)).size).toBe(437);
		const publicQuestion = toPublicQuestion(bank.mcqs[0]);
		expect(JSON.stringify(publicQuestion)).not.toContain('correctOptionIds');
		expect(JSON.stringify(publicQuestion)).not.toContain('rationale');
		expect(JSON.stringify(publicQuestion)).not.toContain('explanation');
	});
});
