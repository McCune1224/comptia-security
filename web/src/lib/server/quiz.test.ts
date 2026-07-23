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
});
