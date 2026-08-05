import { describe, expect, it } from 'vitest';
import type { PublicChoiceQuestion } from '$lib/types';
import { createQuizRepository } from './db';
import { loadQuestionBank } from './question-bank';
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
});
