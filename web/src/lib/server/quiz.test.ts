import { describe, expect, it } from 'vitest';
import type { ObjectiveId, PublicChoiceQuestion } from '$lib/types';
import { createQuizRepository } from './db';
import { loadQuestionBank, type QuestionDefinition } from './question-bank';
import { createQuizService } from './quiz';

describe('QuizService', () => {
	it('assembles a stable 90-question full exam and persists response replacement', () => {
		const repository = createQuizRepository(':memory:');
		let seed = 7;
		const service = createQuizService({ repository, bank: loadQuestionBank(), rng: () => ((seed = seed * 16807 % 2147483647) - 1) / 2147483646, now: () => new Date('2026-07-22T12:00:00.000Z') });
		const session = service.startSession({ type: 'full' });
		expect(session.totalQuestions).toBe(90);
		expect(session.questions.filter((question) => question.format === 'pbq')).toHaveLength(5);
		expect(session.questions.filter((question) => question.domain === 1)).toHaveLength(11);
		const choiceIndex = session.questions.findIndex((question) => question.kind === 'single-choice');
		const choice = session.questions[choiceIndex] as PublicChoiceQuestion;
		service.saveResponse(session.sessionId, choiceIndex, { kind: 'choice', optionIds: [choice.options[0].id] });
		service.saveResponse(session.sessionId, choiceIndex, { kind: 'choice', optionIds: [choice.options[1].id] });
		const resumed = service.getSession(session.sessionId) as typeof session;
		expect(resumed.responses[choiceIndex].kind).toBe('choice');
		expect((resumed.responses[choiceIndex] as { optionIds: string[] }).optionIds).toEqual([choice.options[1].id]);
		expect(() => service.startSession({ type: 'pbq', count: 5 })).toThrow('Resume or abandon the active session first.');
		expect(service.getActiveSession()).toMatchObject({ sessionId: session.sessionId, type: 'full', totalQuestions: 90 });
		service.abandonSession(session.sessionId);
		expect(service.startSession({ type: 'pbq', count: 5 }).questions).toHaveLength(5);
		repository.close();
	});

	it('allows two practice retries with point decay and locks the third', () => {
		const repository = createQuizRepository(':memory:');
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
		const session = service.startSession({ type: 'pbq', count: 1 });
		// Attempt 1: wrong -> 0 points, retry unlocked.
		const first = service.saveResponse(session.sessionId, 0, { kind: 'choice', optionIds: ['b'] });
		expect(first.feedback?.earnedPoints).toBe(0);
		expect((service.getSession(session.sessionId) as typeof session).retries[0]).toBe(0);
		// Retry 1: correct -> 60%.
		const second = service.saveResponse(session.sessionId, 0, { kind: 'choice', optionIds: ['a'] });
		expect(second.feedback?.earnedPoints).toBeCloseTo(0.6);
		// Retry 2 (third attempt): correct -> 30%.
		const third = service.saveResponse(session.sessionId, 0, { kind: 'choice', optionIds: ['a'] });
		expect(third.feedback?.earnedPoints).toBeCloseTo(0.3);
		// Fourth attempt is locked.
		expect(() => service.saveResponse(session.sessionId, 0, { kind: 'choice', optionIds: ['a'] })).toThrow('Practice responses are locked after feedback.');
		// Completion applies the final attempt's factor; full correctness is preserved.
		const result = service.completeSession(session.sessionId);
		expect(result.review[0].feedback.earnedPoints).toBeCloseTo(0.3);
		expect(result.review[0].feedback.fullyCorrect).toBe(true);
		repository.close();
	});

	it('round-trips hotspot responses through a PBQ session with an injected bank', () => {
		const repository = createQuizRepository(':memory:');
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
		const session = service.startSession({ type: 'pbq', count: 1 });
		expect(session.questions[0].kind).toBe('hotspot');
		// Public view must not leak the correct flag.
		const pub = session.questions[0];
		expect(pub.kind === 'hotspot' && 'correct' in pub.regions[0]).toBe(false);
		// Correct response -> full credit.
		service.saveResponse(session.sessionId, 0, { kind: 'hotspot', regionIds: ['r5'] });
		const result = service.completeSession(session.sessionId);
		expect(result.review[0].feedback.earnedPoints).toBe(1);
		// Wrong + a penalty tap -> 0.
		const wrong = service.startSession({ type: 'pbq', count: 1 });
		service.saveResponse(wrong.sessionId, 0, { kind: 'hotspot', regionIds: ['r5', 'r1'] });
		const wrongResult = service.completeSession(wrong.sessionId);
		expect(wrongResult.review[0].feedback.earnedPoints).toBe(0);
		// Unknown region id -> INVALID_REQUEST.
		const invalid = service.startSession({ type: 'pbq', count: 1 });
		expect(() =>
			service.saveResponse(invalid.sessionId, 0, { kind: 'hotspot', regionIds: ['zzz'] })
		).toThrow('Response does not match the question interaction.');
		repository.close();
	});

	it('round-trips memory responses through a PBQ session with an injected bank', () => {
		const repository = createQuizRepository(':memory:');
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
		const session = service.startSession({ type: 'pbq', count: 1 });
		expect(session.questions[0].kind).toBe('memory');
		// Correct response -> full credit.
		service.saveResponse(session.sessionId, 0, { kind: 'memory', matchedPairIds: ['p1', 'p2', 'p3', 'p4'] });
		const result = service.completeSession(session.sessionId);
		expect(result.review[0].feedback.earnedPoints).toBe(1);
		// Partial -> 0.5.
		const partial = service.startSession({ type: 'pbq', count: 1 });
		service.saveResponse(partial.sessionId, 0, { kind: 'memory', matchedPairIds: ['p1', 'p2'] });
		const partialResult = service.completeSession(partial.sessionId);
		expect(partialResult.review[0].feedback.earnedPoints).toBe(0.5);
		// Unknown pair id -> INVALID_REQUEST.
		const invalid = service.startSession({ type: 'pbq', count: 1 });
		expect(() =>
			service.saveResponse(invalid.sessionId, 0, { kind: 'memory', matchedPairIds: ['zzz'] })
		).toThrow('Response does not match the question interaction.');
		repository.close();
	});

	it('round-trips sort responses through a PBQ session with an injected bank', () => {
		const repository = createQuizRepository(':memory:');
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
		const session = service.startSession({ type: 'pbq', count: 1 });
		expect(session.questions[0].kind).toBe('sort');
		service.saveResponse(session.sessionId, 0, { kind: 'sort', assignments: sortPbq.correctBuckets });
		const result = service.completeSession(session.sessionId);
		expect(result.review[0].feedback.earnedPoints).toBe(1);
		const wrong = service.startSession({ type: 'pbq', count: 1 });
		service.saveResponse(wrong.sessionId, 0, {
			kind: 'sort',
			assignments: { i1: 'b2', i2: 'b1', i3: 'b3', i4: 'b1' }
		});
		const wrongResult = service.completeSession(wrong.sessionId);
		expect(wrongResult.review[0].feedback.earnedPoints).toBe(1 / 4);
		repository.close();
	});

	it('round-trips fill-blank and word-bank responses through a PBQ session', () => {
		const repository = createQuizRepository(':memory:');
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
				{ id: 'b1', label: 'Cipher type', placeholder: 'term', acceptedAnswers: ['symmetric', 'symmetrical'] },
				{ id: 'b2', label: 'Password randomness', placeholder: 'term', acceptedAnswers: ['salt', 'salting'] }
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
		const session = service.startSession({ type: 'pbq', count: 2 });
		const fillIndex = session.questions.findIndex((q) => q.kind === 'fill-blank');
		const wbIndex = session.questions.findIndex((q) => q.kind === 'word-bank');
		expect(fillIndex).toBeGreaterThanOrEqual(0);
		expect(wbIndex).toBeGreaterThanOrEqual(0);
		// Case- and whitespace-insensitive normalization: padded uppercase is fully correct.
		service.saveResponse(session.sessionId, fillIndex, { kind: 'fill-blank', values: { b1: '  SYMMETRIC  ', b2: 'salt' } });
		service.saveResponse(session.sessionId, wbIndex, { kind: 'word-bank', assignments: wbPbq.correctAssignments });
		const result = service.completeSession(session.sessionId);
		expect(result.review[fillIndex].feedback.earnedPoints).toBe(1);
		expect(result.review[wbIndex].feedback.earnedPoints).toBe(1);
		repository.close();
	});

	it('filters quiz sessions by objective and rejects misuse', () => {
		const repository = createQuizRepository(':memory:');
		const bank = loadQuestionBank();
		const service = createQuizService({ repository, bank, rng: () => 0.5, now: () => new Date('2026-07-22T12:00:00.000Z') });
		// Objective outside the valid set is rejected up front (no active session yet).
		expect(() => service.startSession({ type: 'quiz', objective: '9.9' as ObjectiveId, count: 5 })).toThrow('Invalid session type, mode, or domain.');
		// Objective is only valid for quiz sessions.
		expect(() => service.startSession({ type: 'pbq', objective: '1.1', count: 5 })).toThrow('Invalid session type, mode, or domain.');
		const session = service.startSession({ type: 'quiz', objective: '1.1', count: 5 });
		expect(session.questions).toHaveLength(5);
		expect(session.questions.every((q) => q.objective === '1.1')).toBe(true);
		// A real objective with too few questions reports availability.
		service.abandonSession(session.sessionId);
		expect(() => service.startSession({ type: 'quiz', objective: '1.1', count: 50 })).toThrow('Requested count is unavailable.');
		repository.close();
	});
});
