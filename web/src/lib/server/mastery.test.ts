import { describe, expect, it } from 'vitest';
import { createQuizRepository } from './db';
import { loadQuestionBank } from './question-bank';
import { createQuizService } from './quiz';
import { computeMastery } from './mastery';

describe('computeMastery', () => {
	it('reports all 28 objectives as unattempted on a fresh repo', () => {
		const repository = createQuizRepository(':memory:');
		const bank = loadQuestionBank();
		const matrix = computeMastery(repository, bank);
		expect(matrix.objectives).toHaveLength(28);
		expect(matrix.totalAttempted).toBe(0);
		expect(matrix.objectives.every((item) => item.percentage === null)).toBe(true);
		const oneOne = matrix.objectives.find((item) => item.objective === '1.1');
		expect(oneOne?.availableQuestions).toBe(bank.mcqs.filter((q) => q.objective === '1.1').length);
		repository.close();
	});

	it('computes per-objective and per-domain accuracy from real answers', () => {
		const repository = createQuizRepository(':memory:');
		const bank = loadQuestionBank();
		const service = createQuizService({ repository, bank, rng: () => 0.5, now: () => new Date('2026-08-05T12:00:00.000Z') });

		const seed = (id: string, objective: string, correctCount: number, total: number) => {
			const questions = bank.mcqs
				.filter((q) => q.objective === objective && q.kind === 'single-choice')
				.slice(0, total);
			repository.createSession({
				id,
				type: 'quiz',
				mode: 'practice',
				domain: null,
				startedAt: '2026-08-05T12:00:00.000Z',
				deadlineAt: null,
				questions
			});
			for (const [index, question] of questions.entries()) {
				const correct = index < correctCount;
				const optionIds = correct
					? question.correctOptionIds
					: [question.options.find((option) => !question.correctOptionIds.includes(option.id))!.id];
				service.saveResponse(id, index, { kind: 'choice', optionIds });
			}
			service.completeSession(id);
		};

		seed('seed-1', '1.1', 4, 5);
		seed('seed-2', '2.4', 2, 5);

		const matrix = computeMastery(repository, bank);
		const oneOne = matrix.objectives.find((item) => item.objective === '1.1')!;
		const twoFour = matrix.objectives.find((item) => item.objective === '2.4')!;
		expect(oneOne.attempted).toBe(5);
		expect(oneOne.percentage).toBe(80);
		expect(twoFour.attempted).toBe(5);
		expect(twoFour.percentage).toBe(40);
		expect(matrix.totalAttempted).toBe(10);

		const domain1 = matrix.domains.find((item) => item.domain === 1)!;
		const domain2 = matrix.domains.find((item) => item.domain === 2)!;
		expect(domain1.percentage).toBe(80);
		expect(domain2.percentage).toBe(40);
		// Objectives in other domains stay untouched.
		expect(matrix.objectives.find((item) => item.objective === '3.1')?.percentage).toBeNull();
		repository.close();
	});
});
