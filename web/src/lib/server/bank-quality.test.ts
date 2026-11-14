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
		prompt: 'Which control best satisfies the requirement?',
		context,
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

	it('rejects missing or thin context', () => {
		expect(run([choice({ context: '' })])).toThrow(/missing scenario context/);
		expect(run([choice({ context: 'Too short.' })])).toThrow(/at least 100 characters/);
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
			prompt: 'Which control addresses the audit finding?',
			context: context.replace('production service', 'payment service')
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
					prompt: 'Which control, Alpha boundary control, best satisfies the requirement?'
				}
			])
		).toThrow(/leaks into prompt/);
		expect(run([{ ...leaking, hint: `${hint} Alpha boundary control is the answer.` }])).toThrow(
			/leaks into prompt/
		);
	});

	it('rejects a keyed acronym whose expansion appears in the stem', () => {
		const question = choice({
			prompt: 'Which control uses Security Information and Event Management?',
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
			prompt: 'What does this term stand for?',
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
			prompt: 'Which control answers the audit finding?',
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
			prompt: 'What does SIEM stand for?',
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
			prompt: 'Which actor is described?',
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
