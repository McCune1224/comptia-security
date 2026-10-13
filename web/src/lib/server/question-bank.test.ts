import { describe, expect, it } from 'vitest';
import { loadQuestionBank, SECP701_BANK_SPEC, toPublicQuestion, validateQuestionBank, type ChoiceDefinition, type CourseBankSpec, type FillBlankDefinition, type HotspotDefinition, type MemoryDefinition, type SliderDefinition, type SortDefinition } from './question-bank';

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
		// 692 MCQs / 105 PBQs are locked at their exact authored counts — the
		// validator rejects any silent addition or loss, and these assertions
		// document the pins (mirroring toHaveLength(105) below).
		expect(bank.mcqs.length).toBe(692);
		expect(bank.pbqs).toHaveLength(105);
		// Per-objective floors are pinned to the exact authored counts too.
		for (const [objective, expected] of Object.entries(SECP701_BANK_SPEC.mcqObjectiveTotals)) {
			expect(bank.mcqs.filter((question) => question.objective === objective).length, objective).toBe(expected);
		}
		// Scenario is no longer 100%; it shares the bank with recall/keyword/short-form.
		const scenario = bank.mcqs.filter((question) => question.style === 'scenario').length;
		expect(scenario).toBeLessThanOrEqual(170);
		expect(bank.mcqs.filter((question) => question.style === 'recall').length).toBeGreaterThanOrEqual(80);
		expect(bank.mcqs.filter((question) => question.style === 'keyword').length).toBeGreaterThanOrEqual(60);
		expect(bank.mcqs.filter((question) => question.style === 'short-form').length).toBeGreaterThanOrEqual(12);
		expect(new Set([...bank.mcqs, ...bank.pbqs].map((question) => question.id)).size).toBe(bank.mcqs.length + bank.pbqs.length);
		const publicQuestion = toPublicQuestion(bank.mcqs[0]);
		expect(JSON.stringify(publicQuestion)).not.toContain('correctOptionIds');
		expect(JSON.stringify(publicQuestion)).not.toContain('rationale');
		expect(JSON.stringify(publicQuestion)).not.toContain('explanation');
	});

	// Regression guards for defects found by the factual audit (see
	// notes/05-Exam-Prep/SY0-701-Coverage-Audit.md). Each assertion pins a
	// question that was ambiguous, mis-keyed, or factually wrong.
	const questionsById = () => {
		const bank = loadQuestionBank();
		const byId = new Map([...bank.mcqs, ...bank.pbqs].map((question) => [question.id, question]));
		const get = (id: string) => {
			const question = byId.get(id);
			if (!question) throw new Error(`expected question ${id} in the bank`);
			return question;
		};
		const keyedOption = (question: ChoiceDefinition) => {
			const option = question.options.find((candidate) => question.correctOptionIds.includes(candidate.id));
			if (!option) throw new Error(`${question.id}: key does not resolve to an option`);
			return option;
		};
		return { byId, get, keyedOption };
	};

	it('keeps audited items unambiguous and factually correct', () => {
		const { get, keyedOption } = questionsById();

		// A select-TWO item cannot key an option whose own rationale calls it false.
		const multi = get('mcq-2-004') as ChoiceDefinition;
		expect(multi.kind).toBe('single-choice');
		expect(multi.correctOptionIds).toHaveLength(1);

		// A detective/compensating tie is not a valid select-TWO key.
		const controls = get('mcq-1-005') as ChoiceDefinition;
		expect(controls.kind).toBe('single-choice');
		expect(controls.correctOptionIds).toHaveLength(1);

		// Stateless and packet-filtering are synonyms, so a keyed pair must not
		// contain both.
		const firewalls = get('mcq-3-011') as ChoiceDefinition;
		expect(firewalls.kind).toBe('multiple-choice');
		const keyedFirewallTexts = firewalls.options
			.filter((option) => firewalls.correctOptionIds.includes(option.id))
			.map((option) => option.text.toLowerCase());
		expect(keyedFirewallTexts.filter((text) => text.includes('stateless'))).toHaveLength(1);
		expect(keyedFirewallTexts.filter((text) => text.includes('packet-filtering'))).toHaveLength(0);

		// PACS/DICOM does not use port 389 (LDAP).
		expect(JSON.stringify(get('mcq-3-006'))).not.toContain('port 389');

		// PII cannot be labeled Internal when the same item calls it Confidential.
		const classification = get('mcq-3-019') as ChoiceDefinition;
		expect(classification.kind).toBe('single-choice');
		expect(keyedOption(classification).text.startsWith('Confidential')).toBe(true);

		// Model inversion must not be labeled model extraction.
		const ai = JSON.stringify(get('pbq-3-008'));
		expect(ai).toContain('Model inversion');
		expect(ai).toContain('Model extraction');
	});

	it('keeps near-duplicate prompts out of the bank', () => {
		const { get } = questionsById();
		const normal = (text: string) => text.trim().toLowerCase().replace(/\s+/g, ' ');
		expect(normal(get('mcq-3-050').prompt)).not.toBe(normal(get('mcq-4-141').prompt));
	});

	// Objective tags drive the mastery matrix and per-objective drills, so a
	// mislabeled item sends study time to the wrong objective. These clusters
	// were realigned to the official SY0-701 objectives.
	it('tags objective clusters to the objectives they actually test', () => {
		const { get } = questionsById();
		const objectiveOf = (id: string) => get(id).objective;

		// Cryptography terms belong to 1.4 (not 1.2 fundamental concepts).
		for (const id of ['mcq-1-065', 'mcq-1-066', 'mcq-1-067', 'mcq-1-068', 'mcq-1-069', 'mcq-1-070', 'mcq-1-078', 'mcq-1-081', 'mcq-1-082']) {
			expect(objectiveOf(id), id).toBe('1.4');
		}
		// Malware-type definitions belong to 2.4 (not 2.1 threat actors).
		for (const id of ['mcq-2-072', 'mcq-2-073', 'mcq-2-074', 'mcq-2-075', 'mcq-2-076', 'mcq-2-077', 'mcq-2-078', 'mcq-2-079', 'mcq-2-080', 'mcq-2-081']) {
			expect(objectiveOf(id), id).toBe('2.4');
		}
		// IR phases belong to 4.8; IAM models to 4.6; backup types to 3.4.
		for (const id of ['mcq-4-093', 'mcq-4-094', 'mcq-4-095', 'mcq-4-096', 'mcq-4-097', 'mcq-4-098', 'mcq-4-100', 'mcq-4-101', 'mcq-4-102']) {
			expect(objectiveOf(id), id).toBe('4.8');
		}
		// Order-of-volatility evidence collection is incident response (4.8),
		// not 4.5 enterprise capabilities.
		expect(objectiveOf('mcq-4-033')).toBe('4.8');
		for (const id of ['mcq-4-108', 'mcq-4-109', 'mcq-4-110', 'mcq-4-111', 'mcq-4-112']) {
			expect(objectiveOf(id), id).toBe('4.6');
		}
		for (const id of ['mcq-3-180', 'mcq-3-181', 'mcq-3-182']) {
			expect(objectiveOf(id), id).toBe('3.4');
		}
		// Risk-management terms belong to 5.2 (not 5.1 governance).
		for (const id of ['mcq-5-060', 'mcq-5-061', 'mcq-5-062', 'mcq-5-063', 'mcq-5-064', 'mcq-5-065', 'mcq-5-066', 'mcq-5-067', 'mcq-5-068']) {
			expect(objectiveOf(id), id).toBe('5.2');
		}
		// Privacy regulation terms belong to 5.4, not 1.4 cryptography.
		for (const id of ['mcq-5-127', 'mcq-5-128', 'mcq-5-129']) {
			expect(objectiveOf(id), id).toBe('5.4');
		}
	});

	// Batch-3 read-through guards: each pins a defect found by inspecting every
	// item, so the same class of error cannot silently return.
	it('keeps batch-3 audited items keyed to the correct answer', () => {
		const { get, keyedOption } = questionsById();

		// A definition item's key must be the term the explanation defines, and
		// the option must exist (a displaced key made Authorization vanish).
		const authorization = get('mcq-1-055') as ChoiceDefinition;
		expect(authorization.options.some((option) => option.text === 'Authorization')).toBe(true);
		expect(authorization.correctOptionIds).toHaveLength(1);
		expect(authorization.explanation.startsWith(keyedOption(authorization).text)).toBe(true);

		// The printed log is documentary evidence, not demonstrative; the keyed
		// option is the terse (1)/(2)/(3) code matching its sibling options.
		const evidence = get('mcq-4-041') as ChoiceDefinition;
		expect(keyedOption(evidence).text).toBe('(1) Documentary — (2) Testimonial — (3) Real');

		// A single-answer item must not ask the reader to choose two.
		expect(get('mcq-3-002').prompt).not.toContain('Choose TWO');
	});

	// Every multi-select must state how many options to pick (mcq-2-009 was the
	// one item of 46 whose stem asked a singular question while keyed for two).
	it('states the select-TWO instruction on every multi-select', () => {
		const multis = loadQuestionBank().mcqs.filter((question) => question.kind === 'multiple-choice');
		expect(multis.length).toBeGreaterThan(0);
		for (const question of multis) {
			expect(question.prompt, question.id).toMatch(/which two|select two|choose two/i);
			expect(question.selectCount, question.id).toBe(2);
		}
	});

	it('keeps the batch-3 objective retags in place', () => {
		const { get } = questionsById();
		const objectiveOf = (id: string) => get(id).objective;
		// RTO/RPO/MTTR/MTBF are resilience metrics.
		for (const id of ['mcq-3-183', 'mcq-3-184', 'mcq-3-185', 'mcq-3-186']) {
			expect(objectiveOf(id), id).toBe('3.4');
		}
		// Immutable backup is resilience.
		expect(objectiveOf('mcq-3-187')).toBe('3.4');
		// NIST CSF framing is governance.
		expect(objectiveOf('mcq-5-130')).toBe('5.1');
		// MITRE ATT&CK is threat intelligence.
		expect(objectiveOf('mcq-2-175')).toBe('2.4');
		// Detection tools belong to monitoring.
		for (const id of ['mcq-4-103', 'mcq-4-104', 'mcq-4-105', 'mcq-4-106', 'mcq-4-107']) {
			expect(objectiveOf(id), id).toBe('4.4');
		}
		// Logon-event analysis is monitoring, not asset management.
		expect(objectiveOf('mcq-4-010')).toBe('4.4');
	});

	it('has no duplicate definition answers in the bank', () => {
		const bank = loadQuestionBank();
		const counts = new Map<string, number>();
		for (const question of bank.mcqs) {
			if (question.kind !== 'single-choice' || !question.prompt.startsWith('Which security term is defined as')) continue;
			const keyed = question.options.find((option) => question.correctOptionIds.includes(option.id));
			if (!keyed) throw new Error(`${question.id}: key does not resolve to an option`);
			counts.set(keyed.text, (counts.get(keyed.text) ?? 0) + 1);
		}
		expect([...counts.entries()].filter(([, n]) => n > 1)).toEqual([]);
	});
});
