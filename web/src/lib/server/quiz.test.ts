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
		const bank = loadQuestionBank();
		const service = createQuizService({ repository, bank, rng: () => 0.5, now: () => new Date('2026-07-22T12:00:00.000Z') });
		const session = service.startSession({ type: 'pbq', count: 30 });
		const fillIndex = session.questions.findIndex((q) => q.kind === 'fill-blank');
		expect(fillIndex).toBeGreaterThanOrEqual(0);
		const fillPublic = session.questions[fillIndex] as { id: string; kind: 'fill-blank'; blanks: { id: string }[] };
		const fillDef = bank.pbqs.find((q) => q.id === fillPublic.id && q.kind === 'fill-blank');
		expect(fillDef?.kind).toBe('fill-blank');
		if (fillDef?.kind !== 'fill-blank') throw new Error('missing fill-blank definition');
		const fillValues = Object.fromEntries(
			fillDef.blanks.map((blank, i) => [
				blank.id,
				i === 0 ? `  ${blank.acceptedAnswers[0].toUpperCase()}  ` : blank.acceptedAnswers[0]
			])
		);
		service.saveResponse(session.sessionId, fillIndex, { kind: 'fill-blank', values: fillValues } as never);
		const wbIndex = session.questions.findIndex((q) => q.kind === 'word-bank');
		expect(wbIndex).toBeGreaterThanOrEqual(0);
		const wbPublic = session.questions[wbIndex] as { id: string; kind: 'word-bank'; blanks: { id: string }[]; bank: { id: string; word: string }[] };
		const wbDef = bank.pbqs.find((q) => q.id === wbPublic.id && q.kind === 'word-bank');
		expect(wbDef?.kind).toBe('word-bank');
		if (wbDef?.kind !== 'word-bank') throw new Error('missing word-bank definition');
		service.saveResponse(session.sessionId, wbIndex, { kind: 'word-bank', assignments: wbDef.correctAssignments } as never);
		const result = service.completeSession(session.sessionId);
		// Case- and whitespace-insensitive normalization: uppercase padded answer is fully correct
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
