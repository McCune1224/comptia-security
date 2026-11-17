import { describe, expect, it } from 'vitest';
import type { CourseBankSpec, QuestionDefinition } from './question-bank';
import { validateBankQuality } from './bank-quality';

const spec = {
	courseId: 'secp-701',
	mcqTotal: 0,
	pbqTotal: 0,
	mcqIdPattern: /^mcq-/,
	pbqIdPattern: /^pbq-/,
	domains: [1, 2],
	objectivesByDomain: { 1: ['1.1'], 2: ['2.1'] },
	mcqObjectiveTotals: {},
	mcqDomainTotals: { 1: 0, 2: 0 },
	multiTotals: { 1: 0, 2: 0 }
} as unknown as CourseBankSpec;

// Every MCQ stem in the bank now carries its own scenario, so fixtures do too.
const stemPrefix =
	'A security team is reviewing a production service after an audit finding and must decide which option applies to the situation described. ';

const context =
	'A security team is reviewing a production service after an audit finding. The service owner must choose a control that satisfies the stated requirement without adding unrelated scope or breaking availability.';
const hint =
	'Focus on the stated requirement: the control must address the exposure directly rather than shifting it to another team or accepting it.';

function choice(overrides: Record<string, unknown> = {}): QuestionDefinition {
	return {
		id: 'mcq-1-001',
		domain: 1,
		objective: '1.1',
		format: 'standard',
		style: 'recall',
		prompt:
			'A security team is reviewing a production service after an audit finding. The service owner must choose a control that satisfies the stated requirement without adding unrelated scope or breaking availability. Which of the following BEST satisfies the requirement?',
		context: '',
		hint,
		explanation:
			'Alpha prevents the exposure at the boundary. Beta does not apply because it protects data at rest, Gamma does not apply because it records activity after the fact, and Delta does not apply because it changes the network path.',
		sourceRefs: [{ source: 'exam-objectives', section: 'Objective 1.1' }],
		kind: 'single-choice',
		options: [
			{
				id: 'a',
				text: 'Alpha',
				rationale:
					'Alpha prevents the exposure at the boundary before the request reaches the service.'
			},
			{
				id: 'b',
				text: 'Beta',
				rationale: 'Beta protects stored data and does not stop the request at the boundary.'
			},
			{
				id: 'c',
				text: 'Gamma',
				rationale: 'Gamma records activity after it happens instead of preventing the exposure.'
			},
			{
				id: 'd',
				text: 'Delta',
				rationale: 'Delta changes the network path but leaves the underlying exposure in place.'
			}
		],
		correctOptionIds: ['a'],
		selectCount: 1,
		...overrides
	} as QuestionDefinition;
}

function run(questions: QuestionDefinition[]) {
	return () => validateBankQuality({ mcqs: questions, pbqs: [] }, spec);
}

describe('bank quality gates', () => {
	it('accepts a complete, specific item', () => {
		expect(run([choice()])).not.toThrow();
	});

	it('leaves context optional for MCQs but rejects a thin one when present', () => {
		expect(run([choice()])).not.toThrow();
		expect(run([choice({ context: 'Too short.' })])).toThrow(/at least 100 characters/);
	});

	it('rejects a stem that cannot stand alone', () => {
		expect(run([choice({ prompt: `${stemPrefix} Which control is this?` })])).toThrow(
			/cannot be|must be at least|tag question|stem is/i
		);
		const tag = choice({
			prompt:
				'A security team is reviewing a production service after an audit finding and must decide which category of control is in place. Which control is this?',
			context: ''
		});
		expect(run([tag])).toThrow(/tag question/);
	});

	it('rejects missing, short, generic, or duplicate hints', () => {
		expect(run([choice({ hint: '' })])).toThrow(/missing authored hint/);
		expect(run([choice({ hint: 'Try harder.' })])).toThrow(/at least 40 characters/);
		expect(
			run([
				choice({ hint: 'Consider the Security+ objective 1.1 concept that fits this description.' })
			])
		).toThrow(/generic fallback/);
		const second = choice({
			id: 'mcq-1-002',
			prompt: context.replace('production service', 'payment service')
		});
		expect(run([choice(), second])).toThrow(/duplicate hint/);
	});

	it('rejects answer leakage into the visible stem or hint', () => {
		const leaking = choice({
			options: [
				{
					id: 'a',
					text: 'Alpha boundary control',
					rationale:
						'Alpha boundary control prevents the exposure before the request reaches the service.'
				},
				{
					id: 'b',
					text: 'Beta',
					rationale: 'Beta protects stored data and does not stop the request at the boundary.'
				},
				{
					id: 'c',
					text: 'Gamma',
					rationale: 'Gamma records activity after it happens instead of preventing it.'
				},
				{
					id: 'd',
					text: 'Delta',
					rationale: 'Delta changes the network path but leaves the exposure in place.'
				}
			],
			explanation:
				'Alpha boundary control prevents the exposure at the boundary. Beta protects stored data, Gamma records activity, and Delta changes the network path.'
		});
		expect(
			run([
				{
					...leaking,
					prompt: `${stemPrefix} Which control, Alpha boundary control, best satisfies the requirement?`
				}
			])
		).toThrow(/leaks into prompt/);
		expect(run([{ ...leaking, hint: `${hint} Alpha boundary control is the answer.` }])).toThrow(
			/leaks into prompt/
		);
	});

	it('rejects a keyed acronym whose expansion appears in the stem', () => {
		const question = choice({
			prompt: `${stemPrefix} Which control uses Security Information and Event Management?`,
			options: [
				{
					id: 'a',
					text: 'SIEM',
					rationale: 'SIEM centralizes logs and correlates alerts across sources.'
				},
				{
					id: 'b',
					text: 'Beta',
					rationale: 'Beta protects stored data rather than correlating events.'
				},
				{
					id: 'c',
					text: 'Gamma',
					rationale: 'Gamma records activity but does not correlate multiple sources.'
				},
				{
					id: 'd',
					text: 'Delta',
					rationale: 'Delta changes the network path and does not aggregate logs.'
				}
			],
			explanation:
				'SIEM centralizes logs and correlates alerts. Beta protects stored data, Gamma records single-source activity, and Delta changes the network path.'
		});
		expect(run([question])).toThrow(/spells out the keyed acronym expansion/);
	});

	it('rejects an acronym-definition stem that does not present the acronym', () => {
		const question = choice({
			prompt: `${stemPrefix} What does this term stand for?`,
			options: [
				{
					id: 'a',
					text: 'SIEM',
					rationale: 'SIEM centralizes logs and correlates alerts across sources.'
				},
				{
					id: 'b',
					text: 'Beta',
					rationale: 'Beta protects stored data rather than correlating events.'
				},
				{
					id: 'c',
					text: 'Gamma',
					rationale: 'Gamma records activity but does not correlate multiple sources.'
				},
				{
					id: 'd',
					text: 'Delta',
					rationale: 'Delta changes the network path and does not aggregate logs.'
				}
			]
		});
		expect(run([question])).toThrow(/must present the acronym/);
	});

	it('rejects duplicate stems and option sets', () => {
		const second = choice({ id: 'mcq-1-002' });
		expect(run([choice(), second])).toThrow(/duplicate prompt/);
		const third = choice({
			id: 'mcq-1-003',
			prompt: `${stemPrefix} Which control answers the audit finding?`,
			context: `${context} This case concerns the refund workflow.`,
			hint: `${hint} This case concerns the refund workflow specifically.`
		});
		expect(run([choice(), third])).toThrow(/duplicate option set/);
	});

	it('rejects generic explanations and rationales', () => {
		expect(
			run([
				choice({
					explanation: 'Fill each blank with the term that correctly completes the statement.',
					options: [
						{ id: 'a', text: 'Alpha', rationale: 'Alpha prevents the exposure at the boundary.' },
						{
							id: 'b',
							text: 'Beta',
							rationale: 'Beta protects stored data and does not stop the request.'
						},
						{ id: 'c', text: 'Gamma', rationale: 'Gamma records activity after it happens.' },
						{ id: 'd', text: 'Delta', rationale: 'Delta changes the network path.' }
					]
				})
			])
		).toThrow(/generic pattern/);
		expect(
			run([
				choice({
					options: [
						{
							id: 'a',
							text: 'Alpha',
							rationale: 'Alpha prevents the exposure at the boundary before the request.'
						},
						{
							id: 'b',
							text: 'Beta',
							rationale:
								'Incorrect: Beta addresses a different concern than the one the scenario asks about.'
						},
						{
							id: 'c',
							text: 'Gamma',
							rationale: 'Gamma records activity after it happens instead of preventing it.'
						},
						{
							id: 'd',
							text: 'Delta',
							rationale: 'Delta changes the network path but leaves the exposure in place.'
						}
					]
				})
			])
		).toThrow(/generic pattern/);
	});

	it('rejects an explanation that does not address a distractor', () => {
		expect(
			run([
				choice({
					explanation: 'Alpha prevents the exposure at the boundary.'
				})
			])
		).toThrow(/does not address distractor/);
	});

	it('accepts an acronym item that presents the acronym and keys the expansion', () => {
		const question = choice({
			prompt: `${stemPrefix} What does SIEM stand for?`,
			options: [
				{
					id: 'a',
					text: 'Security Information and Event Management',
					rationale:
						'Security Information and Event Management is the expansion of SIEM and names the log-correlation platform category.'
				},
				{
					id: 'b',
					text: 'Simple Internet Email Management',
					rationale:
						'Simple Internet Email Management is a mail-routing phrase, not the SIEM expansion.'
				},
				{
					id: 'c',
					text: 'Secure Incident Event Monitor',
					rationale:
						'Secure Incident Event Monitor describes a single monitoring role, not the full platform category.'
				},
				{
					id: 'd',
					text: 'System Information Event Manager',
					rationale:
						'System Information Event Manager is a plausible-sounding but incorrect expansion.'
				}
			],
			explanation:
				'SIEM stands for Security Information and Event Management; it centralizes logs and correlates events across sources. Simple Internet Email Management is a mail-routing phrase, Secure Incident Event Monitor describes a single role, and System Information Event Manager is a plausible-sounding but incorrect expansion.'
		});
		expect(run([question])).not.toThrow();
	});

	it('rejects a distractor that contains the keyed answer text', () => {
		const keyLeak = choice({
			options: [
				{
					id: 'a',
					text: 'Alpha boundary control',
					rationale:
						'Alpha boundary control prevents the exposure before the request reaches the service.'
				},
				{
					id: 'b',
					text: 'Use Alpha boundary control',
					rationale: 'This repeats the keyed answer inside a distractor.'
				},
				{
					id: 'c',
					text: 'Gamma',
					rationale: 'Gamma records activity after it happens instead of preventing it.'
				},
				{
					id: 'd',
					text: 'Delta',
					rationale: 'Delta changes the network path but leaves the exposure in place.'
				}
			]
		});
		expect(run([keyLeak])).toThrow(/contains the keyed answer text/);
	});

	it('rejects a prompt sentence duplicated in the context', () => {
		const duplicate = choice({
			context: `${context} Which control best satisfies the requirement?`,
			hint: `${hint} This case is independent of the others.`
		});
		expect(run([duplicate])).toThrow(/prompt sentence duplicated in context/);
	});

	it('rejects a cross-domain term filler', () => {
		const domainTwo = choice({
			id: 'mcq-2-001',
			domain: 2,
			objective: '2.1',
			prompt: `${stemPrefix} Which actor is described?`,
			context: context.replace('production service', 'threat-intelligence platform'),
			hint: 'Focus on the actor motivation and capability described in the scenario rather than on the control category.',
			options: [
				{
					id: 'a',
					text: 'Beta',
					rationale: 'Beta describes the actor that matches the stated motivation.'
				},
				{
					id: 'b',
					text: 'Gamma',
					rationale: 'Gamma describes a different actor with a different motivation.'
				},
				{
					id: 'c',
					text: 'Delta',
					rationale: 'Delta describes a different actor with a different capability.'
				},
				{
					id: 'd',
					text: 'Epsilon',
					rationale: 'Epsilon describes a different actor with a different access level.'
				}
			],
			explanation:
				'Beta describes the actor that matches the stated motivation. Gamma describes a different motivation, Delta a different capability, and Epsilon a different access level.'
		});
		const domainOne = choice({
			options: [
				{
					id: 'a',
					text: 'Alpha',
					rationale: 'Alpha prevents the exposure at the boundary before the request.'
				},
				{
					id: 'b',
					text: 'Beta',
					rationale: 'Beta protects stored data and does not stop the request at the boundary.'
				},
				{
					id: 'c',
					text: 'Gamma',
					rationale: 'Gamma records activity after it happens instead of preventing it.'
				},
				{
					id: 'd',
					text: 'Delta',
					rationale: 'Delta changes the network path but leaves the exposure in place.'
				}
			]
		});
		expect(run([domainTwo, domainOne])).toThrow(/not in objective 1.1's term pool/);
	});

	it('rejects a stem template over the recall cap', () => {
		const questions = Array.from({ length: 10 }, (_, index) => {
			const suffix = index + 1;
			const topic = [
				'firewall',
				'database',
				'endpoint',
				'wireless',
				'identity',
				'backup',
				'network',
				'cloud',
				'application',
				'logging'
			][index];
			return choice({
				id: `mcq-1-${String(index + 10).padStart(3, '0')}`,
				prompt: `Which control best satisfies the ${topic} requirement ${suffix}?`,
				context: `${context} Case ${suffix} covers the ${topic} service.`,
				hint: `${hint} Case ${suffix} concerns the ${topic} service specifically.`,
				options: [
					{
						id: 'a',
						text: `Alpha ${suffix}`,
						rationale: `Alpha ${suffix} prevents the exposure before the request reaches the service.`
					},
					{
						id: 'b',
						text: `Beta ${suffix}`,
						rationale: `Beta ${suffix} protects stored data and does not stop the request at the boundary.`
					},
					{
						id: 'c',
						text: `Gamma ${suffix}`,
						rationale: `Gamma ${suffix} records activity after it happens instead of preventing it.`
					},
					{
						id: 'd',
						text: `Delta ${suffix}`,
						rationale: `Delta ${suffix} changes the network path but leaves the exposure in place.`
					}
				],
				explanation: `Alpha ${suffix} prevents the exposure at the boundary. Beta ${suffix} protects stored data, Gamma ${suffix} records activity, and Delta ${suffix} changes the path.`
			});
		});
		expect(run(questions)).toThrow(/stem template/);
	});
});

describe('stem and instruction gates', () => {
	function multiSelect(overrides: Record<string, unknown> = {}): QuestionDefinition {
		return choice({
			kind: 'multiple-choice',
			selectCount: 2,
			correctOptionIds: ['a', 'b'],
			options: [
				{
					id: 'a',
					text: 'Alpha',
					rationale:
						'Alpha prevents the exposure at the boundary before the request reaches the service.'
				},
				{
					id: 'b',
					text: 'Beta',
					rationale: 'Beta validates the request path and rejects callers that skip the front door.'
				},
				{
					id: 'c',
					text: 'Gamma',
					rationale: 'Gamma protects stored data but does not stop the request at the boundary.'
				},
				{
					id: 'd',
					text: 'Delta',
					rationale: 'Delta records activity after it happens instead of preventing the exposure.'
				},
				{
					id: 'e',
					text: 'Epsilon',
					rationale: 'Epsilon changes the network path but leaves the exposure in place.'
				}
			],
			explanation:
				'Alpha prevents the exposure at the boundary and Beta validates the request path. Gamma protects stored data, Delta records activity, and Epsilon changes the network path.',
			...overrides
		});
	}

	const ratOptions = [
		{
			id: 'a',
			text: 'rat',
			rationale: 'rat names the remote access trojan the report describes in this case.'
		},
		{
			id: 'b',
			text: 'Beta',
			rationale: 'Beta protects stored data and does not stop the request at the boundary.'
		},
		{
			id: 'c',
			text: 'Gamma',
			rationale: 'Gamma records activity after it happens instead of preventing the exposure.'
		},
		{
			id: 'd',
			text: 'Delta',
			rationale: 'Delta changes the network path but leaves the underlying exposure in place.'
		}
	];

	const ratExplanation =
		'rat names the remote access trojan the report describes. Beta protects stored data, Gamma records activity after it happens, and Delta changes the network path.';

	it('rejects a keyed answer that appears in the stem', () => {
		expect(run([choice({ prompt: `${stemPrefix} Which control is this when the subject is Alpha?` })])).toThrow(
			/keyed answer .* appears in the stem/i
		);
	});

	it('accepts a stem that does not name the keyed answer', () => {
		expect(
			run([choice({ prompt: `${stemPrefix} Which control is this when the subject is a boundary device?` })])
		).not.toThrow();
	});

	it('rejects a short keyed token that appears in the stem', () => {
		expect(
			run([
				choice({
					prompt: `${stemPrefix} Which control is this when the subject is rat?`,
					options: ratOptions,
					explanation: ratExplanation
				})
			])
		).toThrow(/keyed answer .* appears in the stem/i);
	});

	it('accepts a longer word that merely starts with a short keyed token', () => {
		expect(
			run([
				choice({
					prompt: `${stemPrefix} Which control lowers the error rate for this service?`,
					options: ratOptions,
					explanation: ratExplanation
				})
			])
		).not.toThrow();
	});

	it('rejects a multi-select item that never states how many to select', () => {
		expect(
			run([multiSelect({ prompt: `${stemPrefix} Which controls best satisfy the stated requirement?` })])
		).toThrow(/must state how many/);
	});

	it('rejects a single-select item whose stem states a count of two', () => {
		expect(
			run([choice({ prompt: `${stemPrefix} Which control best satisfies the requirement? (Select TWO.)` })])
		).toThrow(/selectCount/);
	});

	it('accepts a multi-select item whose stem states the matching count', () => {
		expect(
			run([
				multiSelect({ prompt: `${stemPrefix} Which controls best satisfy the stated requirement? (Select two.)` })
			])
		).not.toThrow();
	});

	it('rejects a degenerate option that names the same thing twice', () => {
		expect(
			run([
				choice({
					options: [
						{
							id: 'a',
							text: 'Alpha',
							rationale:
								'Alpha prevents the exposure at the boundary before the request reaches the service.'
						},
						{
							id: 'b',
							text: 'Beta',
							rationale: 'Beta protects stored data and does not stop the request at the boundary.'
						},
						{
							id: 'c',
							text: 'Corrective and Corrective',
							rationale:
								'The duplicate pair names one control category twice instead of two distinct categories.'
						},
						{
							id: 'd',
							text: 'Delta',
							rationale:
								'Delta changes the network path but leaves the underlying exposure in place.'
						}
					],
					explanation:
						'Alpha prevents the exposure at the boundary. Beta protects stored data, Corrective names the remediation category the scenario requires, and Delta changes the network path.'
				})
			])
		).toThrow(/degenerate duplicate option/i);
	});

	it('accepts an option that pairs two distinct categories', () => {
		expect(
			run([
				choice({
					options: [
						{
							id: 'a',
							text: 'Alpha',
							rationale:
								'Alpha prevents the exposure at the boundary before the request reaches the service.'
						},
						{
							id: 'b',
							text: 'Beta',
							rationale: 'Beta protects stored data and does not stop the request at the boundary.'
						},
						{
							id: 'c',
							text: 'Corrective and Preventive',
							rationale:
								'Corrective and Preventive pair two distinct remediation categories the audit separates.'
						},
						{
							id: 'd',
							text: 'Delta',
							rationale:
								'Delta changes the network path but leaves the underlying exposure in place.'
						}
					],
					explanation:
						'Alpha prevents the exposure at the boundary. Beta protects stored data, Corrective and Preventive are two distinct remediation categories, and Delta changes the network path.'
				})
			])
		).not.toThrow();
	});
});

// ---------------------------------------------------------------------------
// PBQ answer-position gates. A PBQ that keys the same option position in every
// field, or whose display order mirrors the answer order, can be scored without
// any subject knowledge — which makes the score meaningless.
// ---------------------------------------------------------------------------

const pbqBase = {
	domain: 1 as const,
	objective: '1.1' as const,
	format: 'pbq' as const,
	prompt: `${stemPrefix} Configure each setting to meet the stated requirement.`,
	context,
	hint,
	explanation:
		'The baseline requires the strongest option in each field, so every field resolves to the modern setting rather than a legacy one.',
	sourceRefs: [{ source: 'exam-objectives', section: 'Objective 1.1' }]
};

function config(options: string[], keyed: number[]): QuestionDefinition {
	return {
		...pbqBase,
		id: 'pbq-1-100',
		kind: 'configuration',
		fields: options.map((_, index) => ({
			id: `f${index + 1}`,
			label: `Setting ${index + 1}`,
			options: options.map((text, optionIndex) => ({
				id: `o${optionIndex + 1}`,
				text: `${text} ${index + 1}`
			}))
		})),
		correctValues: Object.fromEntries(
			keyed.map((position, index) => [`f${index + 1}`, `o${position + 1}`])
		)
	} as QuestionDefinition;
}

function matching(premiseIds: string[], map: Record<string, string>): QuestionDefinition {
	return {
		...pbqBase,
		id: 'pbq-1-101',
		kind: 'matching',
		premises: premiseIds.map((id, index) => ({ id, text: `Premise ${index + 1}` })),
		targets: ['t1', 't2', 't3', 't4', 't5'].map((id, index) => ({
			id,
			text: `Target ${index + 1}`
		})),
		extraTargets: [{ id: 't9', text: 'Unused distractor' }],
		correctMatches: map
	} as QuestionDefinition;
}

describe('PBQ answer-position gates', () => {
	const pbqRun = (question: QuestionDefinition) => () =>
		validateBankQuality({ mcqs: [], pbqs: [question] }, spec);

	it('rejects a configuration PBQ that keys the same position in every field', () => {
		const flat = config(['Alpha', 'Beta', 'Gamma', 'Delta'], [0, 0, 0, 0]);
		expect(pbqRun(flat)).toThrow(/every field keys option position 1/);
	});

	it('accepts a configuration PBQ whose keyed positions vary', () => {
		const varied = config(['Alpha', 'Beta', 'Gamma', 'Delta'], [0, 2, 1, 3]);
		expect(pbqRun(varied)).not.toThrow();
	});

	it('rejects a matching PBQ whose display order mirrors the answer order', () => {
		const identity = matching(
			['p1', 'p2', 'p3', 'p4', 'p5'],
			{ p1: 't1', p2: 't2', p3: 't3', p4: 't4', p5: 't5' }
		);
		expect(pbqRun(identity)).toThrow(/mirrors the answer order/);
	});

	it('rejects a matching PBQ whose mapping is a uniform rotation', () => {
		const rotated = matching(
			['p1', 'p2', 'p3', 'p4', 'p5'],
			{ p1: 't2', p2: 't3', p3: 't4', p4: 't5', p5: 't1' }
		);
		expect(pbqRun(rotated)).toThrow(/uniform shift/);
	});

	it('accepts a matching PBQ with a non-uniform mapping', () => {
		const mixed = matching(
			['p1', 'p2', 'p3', 'p4', 'p5'],
			{ p1: 't3', p2: 't1', p3: 't5', p4: 't2', p5: 't4' }
		);
		expect(pbqRun(mixed)).not.toThrow();
	});
});

describe('evidence artifact gate', () => {
	const evidenceRun = (lines: { id: string; text: string }[]) => () =>
		validateBankQuality(
			{
				mcqs: [],
				pbqs: [
					{
						...pbqBase,
						id: 'pbq-1-102',
						kind: 'evidence',
						artifact: { label: 'Access log', format: 'log', lines },
						selectCount: 2,
						correctLineIds: lines.slice(0, 2).map((line) => line.id)
					} as QuestionDefinition
				]
			},
			spec
		);

	it('rejects an artifact line that labels its own finding', () => {
		expect(
			evidenceRun([
				{ id: 'l1', text: 'GET /a?id=1 OR 1=1 -- SQL injection probe' },
				{ id: 'l2', text: 'GET /a?id=2 200 (1.1 KB)' },
				{ id: 'l3', text: 'GET /a?id=3 200 (1.2 KB)' }
			])
		).toThrow(/labels its own finding/);
		expect(
			evidenceRun([
				{ id: 'l1', text: '10.0.0.5 -> 203.0.113.9:4444 tcp 1 pkt/60s (low-rate beacon)' },
				{ id: 'l2', text: 'GET /a?id=2 200 (1.1 KB)' },
				{ id: 'l3', text: 'GET /a?id=3 200 (1.2 KB)' }
			])
		).toThrow(/labels its own finding/);
	});

	it('accepts raw log lines', () => {
		expect(
			evidenceRun([
				{ id: 'l1', text: 'GET /a?id=1+OR+1%3D1 HTTP/1.1" 200 (4.2 KB)' },
				{ id: 'l2', text: 'GET /../../../../etc/passwd HTTP/1.1" 404 (0.3 KB)' },
				{ id: 'l3', text: 'GET /index.html HTTP/1.1" 200 (0.8 KB)' }
			])
		).not.toThrow();
	});
});

describe('study-guide provenance gate', () => {
	const specWithSections = {
		...spec,
		studyGuideSections: ['Security Control Types', 'Zero Trust']
	} as unknown as CourseBankSpec;
	const provenanceRun = (section: string) => () =>
		validateBankQuality(
			{ mcqs: [choice({ sourceRefs: [{ source: 'study-guide', section }] })], pbqs: [] },
			specWithSections
		);

	it('accepts a citation that names a real study-guide section', () => {
		expect(provenanceRun('Zero Trust')).not.toThrow();
	});

	it('rejects an invented chapter title', () => {
		expect(provenanceRun('Chapter 3: Symmetric Encryption and AES Key Sizes.')).toThrow(
			/not a section of the course study guide/
		);
	});

	it('rejects a whole-domain placeholder', () => {
		expect(provenanceRun('Domain 4 - Security Operations')).toThrow(
			/not a section of the course study guide/
		);
	});
});
