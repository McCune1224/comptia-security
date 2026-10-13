import { describe, expect, it } from 'vitest';
import type { ObjectiveId, PublicChoiceQuestion } from '$lib/types';
import { createTestRepository } from './test-db';
import { loadQuestionBank, type QuestionDefinition } from './question-bank';
import { createQuizService } from './quiz';

describe('QuizService', () => {
	it('adds an answer-neutral practice summary and omits it for exam mode', async () => {
		const repository = await createTestRepository();
		const question: QuestionDefinition = {
			id: 'pbq-1-summary',
			domain: 1,
			objective: '1.1',
			format: 'pbq',
			context: 'A security team is reviewing an access-control decision.',
			prompt: 'Which control is most appropriate?',
			explanation: 'MFA is correct.',
			sourceRefs: [{ source: 'exam-objectives', section: '1.1' }],
			kind: 'single-choice',
			options: [
				{ id: 'a', text: 'MFA', rationale: 'Correct.' },
				{ id: 'b', text: 'Backups', rationale: 'Wrong.' },
				{ id: 'c', text: 'Patching', rationale: 'Wrong.' },
				{ id: 'd', text: 'Hashing', rationale: 'Wrong.' }
			],
			correctOptionIds: ['a'],
			selectCount: 1
		};
		const service = createQuizService({
			repository,
			bank: { mcqs: [], pbqs: [question] },
			rng: () => 0.5
		});
		const practice = await service.startSession({ type: 'pbq', count: 1 });
		expect(practice.questions[0].practiceSummary?.text).toContain('security team');
		expect(JSON.stringify(practice.questions[0].practiceSummary)).not.toContain('MFA');
		await service.abandonSession(practice.sessionId);
		const exam = await service.startSession({ type: 'pbq', mode: 'exam', count: 1 });
		expect(exam.questions[0].practiceSummary).toBeUndefined();
		await repository.close();
	});

	it('fails closed when question context contains an answer-bearing value', async () => {
		const repository = await createTestRepository();
		const question: QuestionDefinition = {
			id: 'pbq-1-summary-leak',
			domain: 1,
			objective: '1.1',
			format: 'pbq',
			context: 'The correct answer is MFA.',
			prompt: 'Choose the control.',
			explanation: 'MFA is correct.',
			sourceRefs: [{ source: 'exam-objectives', section: '1.1' }],
			kind: 'single-choice',
			options: [
				{ id: 'a', text: 'MFA', rationale: 'Correct.' },
				{ id: 'b', text: 'Backups', rationale: 'Wrong.' },
				{ id: 'c', text: 'Patching', rationale: 'Wrong.' },
				{ id: 'd', text: 'Hashing', rationale: 'Wrong.' }
			],
			correctOptionIds: ['a'],
			selectCount: 1
		};
		const service = createQuizService({
			repository,
			bank: { mcqs: [], pbqs: [question] },
			rng: () => 0.5
		});
		expect(
			(await service.startSession({ type: 'pbq', count: 1 })).questions[0].practiceSummary
		).toBeUndefined();
		await repository.close();
	});

	it('fails closed for multi-step contexts that contain a child-step answer', async () => {
		const repository = await createTestRepository();
		const step: QuestionDefinition = {
			id: 'pbq-1-ms-step',
			domain: 1,
			objective: '1.1',
			format: 'pbq',
			prompt: 'Which control blocks credential reuse?',
			explanation: 'MFA resists credential reuse.',
			sourceRefs: [{ source: 'exam-objectives', section: '1.1' }],
			kind: 'single-choice',
			options: [
				{ id: 'a', text: 'MFA', rationale: 'Correct.' },
				{ id: 'b', text: 'Backups', rationale: 'Wrong.' },
				{ id: 'c', text: 'Patching', rationale: 'Wrong.' },
				{ id: 'd', text: 'Hashing', rationale: 'Wrong.' }
			],
			correctOptionIds: ['a'],
			selectCount: 1
		};
		const question: QuestionDefinition = {
			id: 'pbq-1-ms-leak',
			domain: 1,
			objective: '1.1',
			format: 'pbq',
			context: 'The incident response team decides MFA should be mandatory for admin accounts.',
			prompt: 'Respond to the incident.',
			explanation: 'Parent-level explanation.',
			sourceRefs: [{ source: 'exam-objectives', section: '1.1' }],
			kind: 'multi-step',
			steps: [step]
		};
		const service = createQuizService({
			repository,
			bank: { mcqs: [], pbqs: [question] },
			rng: () => 0.5
		});
		expect(
			(await service.startSession({ type: 'pbq', count: 1 })).questions[0].practiceSummary
		).toBeUndefined();
		await repository.close();
	});

	it('accepts a partially answered multi-step response and scores only the answered step', async () => {
		// The UI stores unreached steps as null and saves on navigate-away so practice work
		// is never lost, so the server must accept a partial response instead of throwing.
		const repository = await createTestRepository();
		const orderingStep: QuestionDefinition = {
			id: 'pbq-3-ms-order',
			domain: 1,
			objective: '1.4',
			format: 'pbq',
			prompt: 'Order the certificate lifecycle.',
			explanation: 'Generation, CSR, issuance, deployment, renewal, revocation.',
			sourceRefs: [{ source: 'exam-objectives', section: '1.4' }],
			kind: 'ordering',
			items: [
				{ id: 'i1', text: 'Generate the key pair' },
				{ id: 'i2', text: 'Submit a CSR to the CA' }
			],
			correctOrder: ['i1', 'i2']
		};
		const choiceStep: QuestionDefinition = {
			id: 'pbq-3-ms-choice',
			domain: 1,
			objective: '1.4',
			format: 'pbq',
			prompt: 'Which control blocks credential reuse?',
			explanation: 'MFA resists credential reuse.',
			sourceRefs: [{ source: 'exam-objectives', section: '1.4' }],
			kind: 'single-choice',
			options: [
				{ id: 'a', text: 'MFA', rationale: 'Correct.' },
				{ id: 'b', text: 'Backups', rationale: 'Wrong.' }
			],
			correctOptionIds: ['a'],
			selectCount: 1
		};
		const question: QuestionDefinition = {
			id: 'pbq-3-ms-partial',
			domain: 1,
			objective: '1.4',
			format: 'pbq',
			context: 'An analyst is working through a certificate incident.',
			prompt: 'Respond to the incident.',
			explanation: 'Parent-level explanation.',
			sourceRefs: [{ source: 'exam-objectives', section: '1.4' }],
			kind: 'multi-step',
			steps: [orderingStep, choiceStep]
		};
		const service = createQuizService({
			repository,
			bank: { mcqs: [], pbqs: [question] },
			rng: () => 0.5
		});
		const session = await service.startSession({ type: 'pbq', count: 1 });

		const partial = {
			kind: 'multi-step' as const,
			stepResponses: [{ kind: 'ordering' as const, itemIds: ['i1', 'i2'] }, null]
		};
		const saved = await service.saveResponse(session.sessionId, 0, partial);
		// One of two steps carries credit and the untouched step contributes nothing:
		// half credit on the first attempt, with no retry decay yet.
		expect(saved.feedback?.earnedPoints).toBeCloseTo(0.5);

		const stored = (await service.getSession(session.sessionId)) as typeof session;
		expect(stored.responses[0]).toEqual(partial);

		const result = await service.completeSession(session.sessionId);
		// The completion review scores the same stored response the same way.
		const completed = result.review[0].feedback.earnedPoints;
		expect(completed).toBeCloseTo(saved.feedback?.earnedPoints ?? -1);
		expect(completed).toBeCloseTo(0.5);

		// A response whose step count does not match the question is still rejected.
		const next = await service.startSession({ type: 'pbq', count: 1 });
		await expect(
			service.saveResponse(next.sessionId, 0, { kind: 'multi-step', stepResponses: [null] })
		).rejects.toThrow('Response does not match the question interaction.');

		await repository.close();
	});

	it('reports elapsed practice time on resume and persists completion duration', async () => {
		const repository = await createTestRepository();
		let current = new Date('2026-07-22T12:00:00.000Z');
		const question = loadQuestionBank().pbqs[0];
		const service = createQuizService({
			repository,
			bank: { mcqs: [], pbqs: [question] },
			rng: () => 0.5,
			now: () => current
		});
		const session = await service.startSession({ type: 'pbq', count: 1 });
		current = new Date('2026-07-22T12:01:05.000Z');
		expect(((await service.getSession(session.sessionId)) as typeof session).elapsedSeconds).toBe(
			65
		);
		const result = await service.completeSession(session.sessionId);
		expect(result.elapsedSeconds).toBe(65);
		expect(result.durationSeconds).toBe(65);
		expect((await repository.getAllCompletedSessions())[0].duration_seconds).toBe(65);
		await repository.close();
	});

	it('assembles a stable 90-question full exam and persists response replacement', async () => {
		const repository = await createTestRepository();
		let seed = 7;
		const service = createQuizService({
			repository,
			bank: loadQuestionBank(),
			rng: () => ((seed = (seed * 16807) % 2147483647) - 1) / 2147483646,
			now: () => new Date('2026-07-22T12:00:00.000Z')
		});
		const session = await service.startSession({ type: 'full' });
		expect(session.totalQuestions).toBe(90);
		expect(session.questions.filter((question) => question.format === 'pbq')).toHaveLength(5);
		expect(session.questions.filter((question) => question.domain === 1)).toHaveLength(11);
		const choiceIndex = session.questions.findIndex(
			(question) => question.kind === 'single-choice'
		);
		const choice = session.questions[choiceIndex] as PublicChoiceQuestion;
		await service.saveResponse(session.sessionId, choiceIndex, {
			kind: 'choice',
			optionIds: [choice.options[0].id]
		});
		await service.saveResponse(session.sessionId, choiceIndex, {
			kind: 'choice',
			optionIds: [choice.options[1].id]
		});
		const resumed = (await service.getSession(session.sessionId)) as typeof session;
		expect(resumed.responses[choiceIndex].kind).toBe('choice');
		expect((resumed.responses[choiceIndex] as { optionIds: string[] }).optionIds).toEqual([
			choice.options[1].id
		]);
		await expect(service.startSession({ type: 'pbq', count: 5 })).rejects.toThrow(
			'Resume or abandon the active session first.'
		);
		expect(await service.getActiveSession()).toMatchObject({
			sessionId: session.sessionId,
			type: 'full',
			totalQuestions: 90
		});
		await service.abandonSession(session.sessionId);
		expect((await service.startSession({ type: 'pbq', count: 5 })).questions).toHaveLength(5);
		await repository.close();
	});

	it('opens the full exam with PBQs and weights them at ~26% of the score', async () => {
		const repository = await createTestRepository();
		let seed = 7;
		const service = createQuizService({
			repository,
			bank: loadQuestionBank(),
			rng: () => ((seed = (seed * 16807) % 2147483647) - 1) / 2147483646,
			now: () => new Date('2026-07-22T12:00:00.000Z')
		});
		const session = await service.startSession({ type: 'full' });
		// Real exam opens with PBQs; MCQs follow and are interleaved across domains.
		expect(session.questions.slice(0, 5).every((q) => q.format === 'pbq')).toBe(true);
		expect(session.questions.slice(5).every((q) => q.format !== 'pbq')).toBe(true);
		const result = await service.completeSession(session.sessionId);
		expect(result.totalQuestions).toBe(90);
		// 85 MCQs (1 pt) + 5 PBQs (6 pts each) = 115 possible points -> PBQs ≈ 26%.
		expect(result.possiblePoints).toBe(85 + 5 * 6);
		const pbqPoints = result.review
			.filter((r) => r.question.format === 'pbq')
			.reduce((sum) => sum + 6, 0);
		expect(pbqPoints / result.possiblePoints).toBeCloseTo((5 * 6) / 115, 5);
		await repository.close();
	});

	it('allows two practice retries with point decay and locks the third', async () => {
		const repository = await createTestRepository();
		const choicePbq: QuestionDefinition = {
			id: 'pbq-1-999',
			domain: 1,
			objective: '1.1',
			format: 'pbq',
			prompt: 'Which control BEST prevents credential replay?',
			explanation: 'MFA stops replayed stolen credentials.',
			sourceRefs: [{ source: 'exam-objectives', section: '1.1' }],
			kind: 'single-choice',
			options: [
				{ id: 'a', text: 'MFA', rationale: 'Correct.' },
				{ id: 'b', text: 'Patching', rationale: 'No.' },
				{ id: 'c', text: 'Backups', rationale: 'No.' },
				{ id: 'd', text: 'Ping sweep', rationale: 'No.' }
			],
			correctOptionIds: ['a'],
			selectCount: 1
		};
		const service = createQuizService({
			repository,
			bank: { mcqs: [], pbqs: [choicePbq] },
			rng: () => 0.5,
			now: () => new Date('2026-07-22T12:00:00.000Z')
		});
		const session = await service.startSession({ type: 'pbq', count: 1 });
		// Attempt 1: wrong -> 0 points, retry unlocked.
		const first = await service.saveResponse(session.sessionId, 0, {
			kind: 'choice',
			optionIds: ['b']
		});
		expect(first.feedback?.earnedPoints).toBe(0);
		expect(((await service.getSession(session.sessionId)) as typeof session).retries[0]).toBe(0);
		// Retry 1: correct -> 60%.
		const second = await service.saveResponse(session.sessionId, 0, {
			kind: 'choice',
			optionIds: ['a']
		});
		expect(second.feedback?.earnedPoints).toBeCloseTo(0.6);
		// Retry 2 (third attempt): correct -> 30%.
		const third = await service.saveResponse(session.sessionId, 0, {
			kind: 'choice',
			optionIds: ['a']
		});
		expect(third.feedback?.earnedPoints).toBeCloseTo(0.3);
		// Fourth attempt is locked.
		await expect(
			service.saveResponse(session.sessionId, 0, { kind: 'choice', optionIds: ['a'] })
		).rejects.toThrow('Practice responses are locked after feedback.');
		// Completion applies the final attempt's factor; full correctness is preserved.
		const result = await service.completeSession(session.sessionId);
		expect(result.review[0].feedback.earnedPoints).toBeCloseTo(0.3);
		expect(result.review[0].feedback.fullyCorrect).toBe(true);
		expect(result.review[0].retryCount).toBe(2);
		expect(await repository.complete(session.sessionId, result, [], result.completedAt)).toEqual({
			result,
			finalized: false
		});
		await repository.close();
	});

	it('scores a first practice attempt at full credit before decaying retries', async () => {
		const repository = await createTestRepository();
		const choicePbq: QuestionDefinition = {
			id: 'pbq-1-998',
			domain: 1,
			objective: '1.1',
			format: 'pbq',
			prompt: 'Which control BEST prevents credential replay?',
			explanation: 'MFA stops replayed stolen credentials.',
			sourceRefs: [{ source: 'exam-objectives', section: '1.1' }],
			kind: 'single-choice',
			options: [
				{ id: 'a', text: 'MFA', rationale: 'Correct.' },
				{ id: 'b', text: 'Patching', rationale: 'No.' },
				{ id: 'c', text: 'Backups', rationale: 'No.' },
				{ id: 'd', text: 'Ping sweep', rationale: 'No.' }
			],
			correctOptionIds: ['a'],
			selectCount: 1
		};
		const service = createQuizService({
			repository,
			bank: { mcqs: [], pbqs: [choicePbq] },
			rng: () => 0.5,
			now: () => new Date('2026-07-22T12:00:00.000Z')
		});
		const session = await service.startSession({ type: 'pbq', count: 1 });
		// Attempt 1: fully correct -> full credit, never the 60% retry factor.
		const first = await service.saveResponse(session.sessionId, 0, {
			kind: 'choice',
			optionIds: ['a']
		});
		expect(first.feedback?.earnedPoints).toBe(1);
		expect(((await service.getSession(session.sessionId)) as typeof session).retries[0]).toBe(0);
		// Retry 1 (second attempt): correct -> 60%.
		const second = await service.saveResponse(session.sessionId, 0, {
			kind: 'choice',
			optionIds: ['a']
		});
		expect(second.feedback?.earnedPoints).toBeCloseTo(0.6);
		// Retry 2 (third attempt): correct -> 30%.
		const third = await service.saveResponse(session.sessionId, 0, {
			kind: 'choice',
			optionIds: ['a']
		});
		expect(third.feedback?.earnedPoints).toBeCloseTo(0.3);
		// Fourth attempt is locked.
		await expect(
			service.saveResponse(session.sessionId, 0, { kind: 'choice', optionIds: ['a'] })
		).rejects.toThrow('Practice responses are locked after feedback.');
		// Completion reviews the final attempt and must agree with its save-time score.
		const result = await service.completeSession(session.sessionId);
		expect(result.review[0].feedback.earnedPoints).toBeCloseTo(third.feedback?.earnedPoints ?? -1);
		expect(result.review[0].feedback.earnedPoints).toBeCloseTo(0.3);
		expect(result.review[0].feedback.fullyCorrect).toBe(true);
		expect(result.review[0].retryCount).toBe(2);
		await repository.close();
	});

	it('round-trips hotspot responses through a PBQ session with an injected bank', async () => {
		const repository = await createTestRepository();
		const hotspotPbq: QuestionDefinition = {
			id: 'pbq-5-995',
			domain: 5,
			objective: '5.1',
			format: 'pbq',
			prompt: 'Tap the layer responsible for routing packets between networks.',
			explanation: 'The Network layer (L3) routes packets.',
			sourceRefs: [{ source: 'exam-objectives', section: '5.1' }],
			kind: 'hotspot',
			template: 'osi-stack',
			regions: [
				{ id: 'r1', label: 'Application', x1: 0, y1: 0, x2: 100, y2: 14.3, correct: false },
				{ id: 'r2', label: 'Presentation', x1: 0, y1: 14.3, x2: 100, y2: 28.6, correct: false },
				{ id: 'r3', label: 'Session', x1: 0, y1: 28.6, x2: 100, y2: 42.9, correct: false },
				{ id: 'r4', label: 'Transport', x1: 0, y1: 42.9, x2: 100, y2: 57.2, correct: false },
				{ id: 'r5', label: 'Network', x1: 0, y1: 57.2, x2: 100, y2: 71.5, correct: true },
				{ id: 'r6', label: 'Data Link', x1: 0, y1: 71.5, x2: 100, y2: 85.8, correct: false },
				{ id: 'r7', label: 'Physical', x1: 0, y1: 85.8, x2: 100, y2: 100, correct: false }
			]
		};
		const service = createQuizService({
			repository,
			bank: { mcqs: [], pbqs: [hotspotPbq] },
			rng: () => 0.5,
			now: () => new Date('2026-07-22T12:00:00.000Z')
		});
		const session = await service.startSession({ type: 'pbq', count: 1 });
		expect(session.questions[0].kind).toBe('hotspot');
		// Public view must not leak the correct flag.
		const pub = session.questions[0];
		expect(pub.kind === 'hotspot' && 'correct' in pub.regions[0]).toBe(false);
		// Correct response -> full credit.
		await service.saveResponse(session.sessionId, 0, { kind: 'hotspot', regionIds: ['r5'] });
		const result = await service.completeSession(session.sessionId);
		expect(result.review[0].feedback.earnedPoints).toBe(1);
		// Wrong + a penalty tap -> 0.
		const wrong = await service.startSession({ type: 'pbq', count: 1 });
		await service.saveResponse(wrong.sessionId, 0, { kind: 'hotspot', regionIds: ['r5', 'r1'] });
		const wrongResult = await service.completeSession(wrong.sessionId);
		expect(wrongResult.review[0].feedback.earnedPoints).toBe(0);
		// Unknown region id -> INVALID_REQUEST.
		const invalid = await service.startSession({ type: 'pbq', count: 1 });
		await expect(
			service.saveResponse(invalid.sessionId, 0, { kind: 'hotspot', regionIds: ['zzz'] })
		).rejects.toThrow('Response does not match the question interaction.');
		await repository.close();
	});

	it('round-trips memory responses through a PBQ session with an injected bank', async () => {
		const repository = await createTestRepository();
		const memoryPbq: QuestionDefinition = {
			id: 'pbq-5-994',
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
		const service = createQuizService({
			repository,
			bank: { mcqs: [], pbqs: [memoryPbq] },
			rng: () => 0.5,
			now: () => new Date('2026-07-22T12:00:00.000Z')
		});
		const session = await service.startSession({ type: 'pbq', count: 1 });
		expect(session.questions[0].kind).toBe('memory');
		// Correct response -> full credit.
		await service.saveResponse(session.sessionId, 0, {
			kind: 'memory',
			matchedPairIds: ['p1', 'p2', 'p3', 'p4']
		});
		const result = await service.completeSession(session.sessionId);
		expect(result.review[0].feedback.earnedPoints).toBe(1);
		// Partial -> 0.5.
		const partial = await service.startSession({ type: 'pbq', count: 1 });
		await service.saveResponse(partial.sessionId, 0, {
			kind: 'memory',
			matchedPairIds: ['p1', 'p2']
		});
		const partialResult = await service.completeSession(partial.sessionId);
		expect(partialResult.review[0].feedback.earnedPoints).toBe(0.5);
		// Unknown pair id -> INVALID_REQUEST.
		const invalid = await service.startSession({ type: 'pbq', count: 1 });
		await expect(
			service.saveResponse(invalid.sessionId, 0, { kind: 'memory', matchedPairIds: ['zzz'] })
		).rejects.toThrow('Response does not match the question interaction.');
		await repository.close();
	});

	it('applies the practice-mode hint point cost server-side', async () => {
		const repository = await createTestRepository();
		const choicePbq: QuestionDefinition = {
			id: 'pbq-5-988',
			domain: 5,
			objective: '5.2',
			format: 'pbq',
			prompt: 'Synthetic choice item for the hint flow.',
			explanation: 'Synthetic.',
			hint: 'The service listens on TCP 22.',
			sourceRefs: [{ source: 'exam-objectives', section: '5.2' }],
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
		const service = createQuizService({
			repository,
			bank: { mcqs: [], pbqs: [choicePbq] },
			rng: () => 0.5,
			now: () => new Date('2026-07-22T12:00:00.000Z')
		});
		// Public view exposes the authored hint but the correct answer stays secret.
		const plain = await service.startSession({ type: 'pbq', count: 1, mode: 'practice' });
		expect(plain.questions[0].kind === 'single-choice' && plain.questions[0].hint).toBe(
			'The service listens on TCP 22.'
		);
		// First attempt, no hint -> full points.
		await service.saveResponse(plain.sessionId, 0, { kind: 'choice', optionIds: ['a'] });
		const plainResult = await service.completeSession(plain.sessionId);
		expect(plainResult.review[0].feedback.earnedPoints).toBe(1);
		// Reveal the hint server-side, then retry -> 0.6 (retry) × 0.75 (hint) = 0.45.
		const hinted = await service.startSession({ type: 'pbq', count: 1, mode: 'practice' });
		await service.saveResponse(hinted.sessionId, 0, { kind: 'choice', optionIds: ['b'] });
		const revealed = await service.revealHint(hinted.sessionId, 0);
		expect(revealed.hint.text).toBe('The service listens on TCP 22.');
		const retry = await service.saveResponse(hinted.sessionId, 0, {
			kind: 'choice',
			optionIds: ['a']
		});
		expect(retry.feedback?.earnedPoints).toBeCloseTo(0.6 * 0.75);
		const hintedResult = await service.completeSession(hinted.sessionId);
		expect(hintedResult.review[0].feedback.earnedPoints).toBeCloseTo(0.6 * 0.75);
		// Exam mode strips the hint entirely.
		const exam = await service.startSession({ type: 'pbq', count: 1, mode: 'exam' });
		expect(exam.questions[0].kind === 'single-choice' && exam.questions[0].hint).toBeUndefined();
		await repository.close();
	});

	it('generates answer-safe auto-hints and rejects hint reveals outside practice', async () => {
		const repository = await createTestRepository();
		const choicePbq: QuestionDefinition = {
			id: 'pbq-5-987',
			domain: 5,
			objective: '5.2',
			format: 'pbq',
			prompt: 'Synthetic choice item without an authored hint.',
			explanation: 'Synthetic.',
			sourceRefs: [{ source: 'exam-objectives', section: '5.2' }],
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
		const service = createQuizService({
			repository,
			bank: { mcqs: [], pbqs: [choicePbq] },
			rng: () => 0.5,
			now: () => new Date('2026-07-22T12:00:00.000Z')
		});
		const session = await service.startSession({ type: 'pbq', count: 1, mode: 'practice' });
		await service.saveResponse(session.sessionId, 0, { kind: 'choice', optionIds: ['a'] });
		const hint = await service.revealHint(session.sessionId, 0);
		expect(hint.hint.text).toMatch(/incorrect/);
		expect(hint.hint.text.toLowerCase()).not.toContain('ssh');
		expect((await service.revealHint(session.sessionId, 0)).hint.text).toBe(hint.hint.text);
		await service.completeSession(session.sessionId);
		// Graded sessions refuse hints.
		const graded = await service.startSession({
			type: 'pbq',
			count: 1,
			mode: 'practice',
			assignmentId: 'assign-1'
		});
		await expect(service.revealHint(graded.sessionId, 0)).rejects.toThrow(/graded/);
		// Exam sessions refuse hints.
		await service.abandonSession(graded.sessionId);
		const exam = await service.startSession({ type: 'pbq', count: 1, mode: 'exam' });
		await expect(service.revealHint(exam.sessionId, 0)).rejects.toThrow(/practice mode/);
		await repository.close();
	});

	it('withholds feedback and locks responses for graded assignment sessions', async () => {
		const repository = await createTestRepository();
		const question: QuestionDefinition = {
			id: 'pbq-1-graded',
			domain: 1,
			objective: '1.1',
			format: 'pbq',
			prompt: 'Which control is most appropriate?',
			explanation: 'MFA is correct.',
			sourceRefs: [{ source: 'exam-objectives', section: '1.1' }],
			kind: 'single-choice',
			options: [
				{ id: 'a', text: 'MFA', rationale: 'Correct.' },
				{ id: 'b', text: 'Backups', rationale: 'Wrong.' },
				{ id: 'c', text: 'Patching', rationale: 'Wrong.' },
				{ id: 'd', text: 'Hashing', rationale: 'Wrong.' }
			],
			correctOptionIds: ['a'],
			selectCount: 1
		};
		const service = createQuizService({
			repository,
			bank: { mcqs: [], pbqs: [question] },
			rng: () => 0.5,
			now: () => new Date('2026-07-22T12:00:00.000Z')
		});
		const session = await service.startSession({
			type: 'pbq',
			count: 1,
			mode: 'practice',
			assignmentId: 'assign-week-1'
		});
		expect(session.assignmentId).toBe('assign-week-1');
		const saved = await service.saveResponse(session.sessionId, 0, {
			kind: 'choice',
			optionIds: ['a']
		});
		expect(saved).toEqual({ saved: true });
		await expect(
			service.saveResponse(session.sessionId, 0, { kind: 'choice', optionIds: ['b'] })
		).rejects.toThrow(/locked/);
		const result = await service.completeSession(session.sessionId);
		expect(result.review[0].feedback.earnedPoints).toBe(1);
		expect(await repository.getSubmissions()).toHaveLength(1);
		await repository.close();
	});

	it('persists partial practice drafts without counting them as answered', async () => {
		const repository = await createTestRepository();
		const wbPbq: QuestionDefinition = {
			id: 'pbq-1-partial-draft',
			domain: 1,
			objective: '1.4',
			format: 'pbq',
			prompt: 'Fill both blanks.',
			explanation: 'Symmetric ciphers share one key; salts randomize password hashes.',
			sourceRefs: [{ source: 'exam-objectives', section: '1.4' }],
			kind: 'word-bank',
			blanks: [
				{ id: 'b1', label: 'Cipher type' },
				{ id: 'b2', label: 'Password randomness' }
			],
			bank: [
				{ id: 'w1', word: 'key' },
				{ id: 'w2', word: 'salt' },
				{ id: 'd1', word: 'nonce' }
			],
			correctAssignments: { b1: 'w1', b2: 'w2' }
		};
		const service = createQuizService({
			repository,
			bank: { mcqs: [], pbqs: [wbPbq] },
			rng: () => 0.5
		});
		const partial = { kind: 'word-bank' as const, assignments: { b1: 'w1' } };

		// A silent practice draft (check: false) carries half the answer and must persist
		// so navigating away never discards it — but it is not "answered" yet.
		const session = await service.startSession({ type: 'pbq', count: 1 });
		expect(await service.saveResponse(session.sessionId, 0, partial, { check: false })).toEqual({
			saved: true
		});
		const resumed = (await service.getSession(session.sessionId)) as typeof session;
		expect(resumed.responses[0]).toEqual(partial);
		expect(resumed.answeredCount).toBe(0);
		// Completion scores the stored draft: filled blank earns credit, missing one does not.
		const practice = await service.completeSession(session.sessionId);
		expect(practice.review[0].feedback.earnedPoints).toBeCloseTo(0.5);

		// Scored practice saves stay strict — an incomplete answer is still rejected.
		const scored = await service.startSession({ type: 'pbq', count: 1 });
		await expect(
			service.saveResponse(scored.sessionId, 0, partial, { check: true })
		).rejects.toThrow('Response does not match the question interaction.');
		await service.abandonSession(scored.sessionId);

		// Exam drafts may be partial and persist for flag-and-return.
		const exam = await service.startSession({ type: 'pbq', count: 1, mode: 'exam' });
		expect(await service.saveResponse(exam.sessionId, 0, partial, { check: false })).toEqual({
			saved: true
		});
		await service.abandonSession(exam.sessionId);

		// Graded assignments stay strict even for a silent draft: their first stored
		// response locks the question, so a partial must never land.
		const graded = await service.startSession({
			type: 'pbq',
			count: 1,
			mode: 'practice',
			assignmentId: 'assign-week-1'
		});
		await expect(
			service.saveResponse(graded.sessionId, 0, partial, { check: false })
		).rejects.toThrow('Response does not match the question interaction.');
		await repository.close();
	});

	it('never charges the first scored attempt for an unscored row (draft, flag, hint)', async () => {
		const repository = await createTestRepository();
		const wordBank: QuestionDefinition = {
			id: 'pbq-1-unscored-wb',
			domain: 1,
			objective: '1.4',
			format: 'pbq',
			prompt: 'Fill both blanks.',
			explanation: 'Key and salt.',
			sourceRefs: [{ source: 'exam-objectives', section: '1.4' }],
			kind: 'word-bank',
			blanks: [
				{ id: 'b1', label: 'Cipher type' },
				{ id: 'b2', label: 'Password randomness' }
			],
			bank: [
				{ id: 'w1', word: 'key' },
				{ id: 'w2', word: 'salt' }
			],
			correctAssignments: { b1: 'w1', b2: 'w2' }
		};
		const flagChoice: QuestionDefinition = {
			id: 'pbq-1-unscored-flag',
			domain: 1,
			objective: '1.1',
			format: 'pbq',
			prompt: 'Flag target: which control prevents tailgating?',
			explanation: 'Mantrap.',
			sourceRefs: [{ source: 'exam-objectives', section: '1.1' }],
			kind: 'single-choice',
			options: [
				{ id: 'a', text: 'Mantrap', rationale: 'Correct.' },
				{ id: 'b', text: 'Bollards', rationale: 'Wrong.' }
			],
			correctOptionIds: ['a'],
			selectCount: 1
		};
		const hintChoice: QuestionDefinition = {
			id: 'pbq-1-unscored-hint',
			domain: 1,
			objective: '1.1',
			format: 'pbq',
			prompt: 'Hint target: which port is SSH?',
			explanation: 'TCP 22.',
			sourceRefs: [{ source: 'exam-objectives', section: '1.1' }],
			kind: 'single-choice',
			hint: 'SSH uses a well-known port below 1024.',
			options: [
				{ id: 'a', text: 'TCP 22', rationale: 'Correct.' },
				{ id: 'b', text: 'TCP 443', rationale: 'Wrong.' }
			],
			correctOptionIds: ['a'],
			selectCount: 1
		};
		const service = createQuizService({
			repository,
			bank: { mcqs: [], pbqs: [wordBank, flagChoice, hintChoice] },
			rng: () => 0.5
		});
		const session = await service.startSession({ type: 'pbq', count: 3, mode: 'practice' });
		const questions = session.questions;
		const draftIndex = questions.findIndex((q) => q.kind === 'word-bank');
		const flagIndex = questions.findIndex((q) => q.prompt.startsWith('Flag target'));
		const hintIndex = questions.findIndex((q) => q.prompt.startsWith('Hint target'));
		expect(draftIndex).toBeGreaterThanOrEqual(0);
		expect(flagIndex).toBeGreaterThanOrEqual(0);
		expect(hintIndex).toBeGreaterThanOrEqual(0);

		// Each of the three row creators runs BEFORE any scored attempt…
		await service.saveResponse(
			session.sessionId,
			draftIndex,
			{ kind: 'word-bank', assignments: { b1: 'w1' } },
			{ check: false }
		);
		await service.updateSession(session.sessionId, {
			flag: { questionIndex: flagIndex, value: true }
		});
		await service.revealHint(session.sessionId, hintIndex);

		// …and none of them may cost the first real attempt full credit.
		const draftSave = await service.saveResponse(
			session.sessionId,
			draftIndex,
			{ kind: 'word-bank', assignments: { b1: 'w1', b2: 'w2' } },
			{ check: true }
		);
		expect(draftSave.feedback?.earnedPoints).toBe(1);
		const flagSave = await service.saveResponse(
			session.sessionId,
			flagIndex,
			{ kind: 'choice', optionIds: ['a'] },
			{ check: true }
		);
		expect(flagSave.feedback?.earnedPoints).toBe(1);
		const hintSave = await service.saveResponse(
			session.sessionId,
			hintIndex,
			{ kind: 'choice', optionIds: ['a'] },
			{ check: true }
		);
		// First attempt with a hint: full credit minus the 25% hint cost — never a
		// retry decay on top (1 × 0.75, not 0.6 × 0.75).
		expect(hintSave.feedback?.earnedPoints).toBeCloseTo(0.75);

		// All three rows still read as "no prior scored attempts".
		const stored = (await service.getSession(session.sessionId)) as typeof session;
		expect(stored.retries[draftIndex]).toBe(0);
		expect(stored.retries[flagIndex]).toBe(0);
		expect(stored.retries[hintIndex]).toBe(0);

		// The completion review agrees with the save-time scores.
		const result = await service.completeSession(session.sessionId);
		expect(result.review[draftIndex].feedback.earnedPoints).toBe(1);
		expect(result.review[flagIndex].feedback.earnedPoints).toBe(1);
		expect(result.review[hintIndex].feedback.earnedPoints).toBeCloseTo(0.75);
		await repository.close();
	});

	it('starts a retake session from the missed questions of a completed session', async () => {
		const repository = await createTestRepository();
		const good: QuestionDefinition = {
			id: 'pbq-1-retake-good',
			domain: 1,
			objective: '1.1',
			format: 'pbq',
			prompt: 'Easy question.',
			explanation: 'MFA is correct.',
			sourceRefs: [{ source: 'exam-objectives', section: '1.1' }],
			kind: 'single-choice',
			options: [
				{ id: 'a', text: 'MFA', rationale: 'Correct.' },
				{ id: 'b', text: 'Backups', rationale: 'Wrong.' },
				{ id: 'c', text: 'Patching', rationale: 'Wrong.' },
				{ id: 'd', text: 'Hashing', rationale: 'Wrong.' }
			],
			correctOptionIds: ['a'],
			selectCount: 1
		};
		const missed: QuestionDefinition = {
			id: 'pbq-1-retake-missed',
			domain: 1,
			objective: '1.2',
			format: 'pbq',
			prompt: 'Hard question.',
			explanation: 'Backups are correct.',
			sourceRefs: [{ source: 'exam-objectives', section: '1.2' }],
			kind: 'single-choice',
			options: [
				{ id: 'a', text: 'MFA', rationale: 'Wrong.' },
				{ id: 'b', text: 'Backups', rationale: 'Correct.' },
				{ id: 'c', text: 'Patching', rationale: 'Wrong.' },
				{ id: 'd', text: 'Hashing', rationale: 'Wrong.' }
			],
			correctOptionIds: ['b'],
			selectCount: 1
		};
		const service = createQuizService({
			repository,
			bank: { mcqs: [], pbqs: [good, missed] },
			rng: () => 0.5,
			now: () => new Date('2026-07-22T12:00:00.000Z')
		});
		const session = await service.startSession({ type: 'pbq', count: 2 });
		const goodIndex = session.questions.findIndex((q) => q.id === 'pbq-1-retake-good');
		const missedIndex = session.questions.findIndex((q) => q.id === 'pbq-1-retake-missed');
		await service.saveResponse(session.sessionId, goodIndex, { kind: 'choice', optionIds: ['a'] });
		await service.saveResponse(session.sessionId, missedIndex, {
			kind: 'choice',
			optionIds: ['a']
		});
		const result = await service.completeSession(session.sessionId);
		expect(result.review.filter((item) => !item.feedback.fullyCorrect)).toHaveLength(1);
		const retake = await service.retakeSession(session.sessionId);
		expect(retake.mode).toBe('practice');
		expect(retake.questions.map((q) => q.id)).toEqual(['pbq-1-retake-missed']);
		// Retaking a session with no missed questions fails.
		await service.abandonSession(retake.sessionId);
		const perfect = await service.startSession({ type: 'pbq', count: 1 });
		await service.saveResponse(perfect.sessionId, 0, {
			kind: 'choice',
			optionIds:
				perfect.questions[0].kind === 'single-choice' ||
				perfect.questions[0].kind === 'multiple-choice'
					? ['a']
					: []
		});
		const perfectResult = await service.completeSession(perfect.sessionId);
		if (perfectResult.review.every((item) => item.feedback.fullyCorrect))
			await expect(service.retakeSession(perfect.sessionId)).rejects.toThrow(/No missed/);
		await repository.close();
	});

	it('round-trips slider responses through a PBQ session with an injected bank', async () => {
		const repository = await createTestRepository();
		const sliderPbq: QuestionDefinition = {
			id: 'pbq-5-991',
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
		const service = createQuizService({
			repository,
			bank: { mcqs: [], pbqs: [sliderPbq] },
			rng: () => 0.5,
			now: () => new Date('2026-07-22T12:00:00.000Z')
		});
		const session = await service.startSession({ type: 'pbq', count: 1 });
		expect(session.questions[0].kind).toBe('slider');
		// Public view must not leak the correct value.
		const pub = session.questions[0];
		expect(pub.kind === 'slider' && 'correctValue' in pub).toBe(false);
		// Within tolerance -> full credit.
		await service.saveResponse(session.sessionId, 0, { kind: 'slider', value: 22 });
		const result = await service.completeSession(session.sessionId);
		expect(result.review[0].feedback.earnedPoints).toBe(1);
		// Out-of-range value -> INVALID_REQUEST.
		const invalid = await service.startSession({ type: 'pbq', count: 1 });
		await expect(
			service.saveResponse(invalid.sessionId, 0, { kind: 'slider', value: 99999 })
		).rejects.toThrow('Response does not match the question interaction.');
		await repository.close();
	});

	it('round-trips sort responses through a PBQ session with an injected bank', async () => {
		const repository = await createTestRepository();
		const sortPbq: QuestionDefinition = {
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
		const service = createQuizService({
			repository,
			bank: { mcqs: [], pbqs: [sortPbq] },
			rng: () => 0.5,
			now: () => new Date('2026-07-22T12:00:00.000Z')
		});
		const session = await service.startSession({ type: 'pbq', count: 1 });
		expect(session.questions[0].kind).toBe('sort');
		await service.saveResponse(session.sessionId, 0, {
			kind: 'sort',
			assignments: sortPbq.correctBuckets
		});
		const result = await service.completeSession(session.sessionId);
		expect(result.review[0].feedback.earnedPoints).toBe(1);
		const wrong = await service.startSession({ type: 'pbq', count: 1 });
		await service.saveResponse(wrong.sessionId, 0, {
			kind: 'sort',
			assignments: { i1: 'b2', i2: 'b1', i3: 'b3', i4: 'b1' }
		});
		const wrongResult = await service.completeSession(wrong.sessionId);
		expect(wrongResult.review[0].feedback.earnedPoints).toBe(1 / 4);
		await repository.close();
	});

	it('round-trips fill-blank and word-bank responses through a PBQ session', async () => {
		const repository = await createTestRepository();
		const fillPbq: QuestionDefinition = {
			id: 'pbq-1-997',
			domain: 1,
			objective: '1.4',
			format: 'pbq',
			prompt:
				'The cipher that uses the same key to encrypt and decrypt is called ____, and the value added to passwords before hashing is a ____.',
			explanation: 'Symmetric ciphers share one key; salts randomize password hashes.',
			sourceRefs: [{ source: 'exam-objectives', section: '1.4' }],
			kind: 'fill-blank',
			blanks: [
				{
					id: 'b1',
					label: 'Cipher type',
					placeholder: 'term',
					acceptedAnswers: ['symmetric', 'symmetrical']
				},
				{
					id: 'b2',
					label: 'Password randomness',
					placeholder: 'term',
					acceptedAnswers: ['salt', 'salting']
				}
			]
		};
		const wbPbq: QuestionDefinition = {
			id: 'pbq-1-996',
			domain: 1,
			objective: '1.4',
			format: 'pbq',
			prompt:
				'Complete each statement: symmetric ciphers use one ____; password hashes are randomized with a ____.',
			explanation: 'Symmetric ciphers share one key; salts randomize password hashes.',
			sourceRefs: [{ source: 'exam-objectives', section: '1.4' }],
			kind: 'word-bank',
			blanks: [
				{ id: 'b1', label: 'Cipher type' },
				{ id: 'b2', label: 'Password randomness' }
			],
			bank: [
				{ id: 'w1', word: 'key' },
				{ id: 'w2', word: 'salt' },
				{ id: 'd1', word: 'nonce' }
			],
			correctAssignments: { b1: 'w1', b2: 'w2' }
		};
		const service = createQuizService({
			repository,
			bank: { mcqs: [], pbqs: [fillPbq, wbPbq] },
			rng: () => 0.5,
			now: () => new Date('2026-07-22T12:00:00.000Z')
		});
		const session = await service.startSession({ type: 'pbq', count: 2 });
		const fillIndex = session.questions.findIndex((q) => q.kind === 'fill-blank');
		const wbIndex = session.questions.findIndex((q) => q.kind === 'word-bank');
		expect(fillIndex).toBeGreaterThanOrEqual(0);
		expect(wbIndex).toBeGreaterThanOrEqual(0);
		// Case- and whitespace-insensitive normalization: padded uppercase is fully correct.
		await service.saveResponse(session.sessionId, fillIndex, {
			kind: 'fill-blank',
			values: { b1: '  SYMMETRIC  ', b2: 'salt' }
		});
		await service.saveResponse(session.sessionId, wbIndex, {
			kind: 'word-bank',
			assignments: wbPbq.correctAssignments
		});
		const result = await service.completeSession(session.sessionId);
		expect(result.review[fillIndex].feedback.earnedPoints).toBe(1);
		expect(result.review[wbIndex].feedback.earnedPoints).toBe(1);
		await repository.close();
	});

	it('filters quiz sessions by objective and rejects misuse', async () => {
		const repository = await createTestRepository();
		const bank = loadQuestionBank();
		const service = createQuizService({
			repository,
			bank,
			rng: () => 0.5,
			now: () => new Date('2026-07-22T12:00:00.000Z')
		});
		// Objective outside the valid set is rejected up front (no active session yet).
		await expect(
			service.startSession({ type: 'quiz', objective: '9.9' as ObjectiveId, count: 5 })
		).rejects.toThrow('Invalid session type, mode, or domain.');
		// Objective is only valid for quiz sessions.
		await expect(service.startSession({ type: 'pbq', objective: '1.1', count: 5 })).rejects.toThrow(
			'Invalid session type, mode, or domain.'
		);
		const session = await service.startSession({ type: 'quiz', objective: '1.1', count: 5 });
		expect(session.questions).toHaveLength(5);
		expect(session.questions.every((q) => q.objective === '1.1')).toBe(true);
		// A real objective with too few questions reports availability.
		await service.abandonSession(session.sessionId);
		await expect(
			service.startSession({ type: 'quiz', objective: '1.1', count: 50 })
		).rejects.toThrow('Requested count is unavailable.');
		await repository.close();
	});
});
