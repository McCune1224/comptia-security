import { describe, expect, it } from 'vitest';
import type { ReviewCardRow } from './db';
import { createTestRepository } from './test-db';
import { loadQuestionBank } from './question-bank';
import { createQuizService } from './quiz';
import {
	addDaysKey,
	computeStreak,
	createReviewService,
	localDateKey,
	scheduleReview
} from './review';

const NOW = new Date('2026-08-05T10:30:00');

async function makeService() {
	const repository = await createTestRepository();
	const bank = loadQuestionBank();
	const service = createReviewService({ repository, bank, now: () => NOW, rng: () => 0.42 });
	return { repository, bank, service };
}

function card(overrides: Partial<ReviewCardRow> = {}): ReviewCardRow {
	return {
		questionId: 'mcq-1-001',
		intervalDays: 0,
		ease: 2.5,
		lapses: 0,
		dueAt: addDaysKey(localDateKey(NOW), 1),
		lastResult: null,
		reviewCount: 0,
		firstSeenAt: NOW.toISOString(),
		...overrides
	};
}

describe('local calendar dates', () => {
	it('keys and shifts dates without UTC drift', () => {
		const key = localDateKey(NOW);
		expect(key).toBe('2026-08-05');
		expect(addDaysKey(key, 1)).toBe('2026-08-06');
		expect(addDaysKey(key, -1)).toBe('2026-08-04');
		expect(addDaysKey('2026-03-01', -1)).toBe('2026-02-28');
	});
});

describe('scheduleReview (SM-2-lite)', () => {
	it('a brand-new question answered correctly is due tomorrow', () => {
		const next = scheduleReview(undefined, true, localDateKey(NOW));
		expect(next.intervalDays).toBe(1);
		expect(next.dueAt).toBe('2026-08-06');
		expect(next.lastResult).toBe('correct');
		expect(next.lapses).toBe(0);
		expect(next.reviewCount).toBe(1);
	});

	it('a brand-new question answered wrong is due tomorrow with a lapse', () => {
		const next = scheduleReview(undefined, false, localDateKey(NOW));
		expect(next.intervalDays).toBe(1);
		expect(next.lastResult).toBe('wrong');
		expect(next.lapses).toBe(1);
	});

	it('correct answers escalate the interval by the ease factor', () => {
		let current = scheduleReview(undefined, true, localDateKey(NOW));
		expect(current.ease).toBeCloseTo(2.6);
		current = scheduleReview(current, true, current.dueAt);
		expect(current.intervalDays).toBe(3);
		expect(current.ease).toBeCloseTo(2.7);
		current = scheduleReview(current, true, current.dueAt);
		expect(current.intervalDays).toBe(8);
	});

	it('a wrong answer resets the interval, increments lapses, and drops ease', () => {
		let current = scheduleReview(
			card({ intervalDays: 8, ease: 2.7, lapses: 0, lastResult: 'correct' }),
			true,
			localDateKey(NOW)
		);
		expect(current.ease).toBeCloseTo(2.8);
		current = scheduleReview(current, false, current.dueAt);
		expect(current.intervalDays).toBe(1);
		expect(current.lapses).toBe(1);
		expect(current.ease).toBeCloseTo(2.6);
		expect(current.lastResult).toBe('wrong');
	});

	it('ease factor is capped at 3.0 and floored at 1.3', () => {
		let current = scheduleReview(card({ intervalDays: 30, ease: 3 }), true, localDateKey(NOW));
		expect(current.ease).toBe(3);
		for (let i = 0; i < 30; i++) current = scheduleReview(current, false, current.dueAt);
		expect(current.ease).toBe(1.3);
	});
});

describe('computeStreak', () => {
	it('counts consecutive days ending today', () => {
		const today = localDateKey(NOW);
		const days = [today, addDaysKey(today, -1), addDaysKey(today, -2)].map((dateKey) => ({
			dateKey
		}));
		expect(computeStreak(days, today)).toBe(3);
	});

	it('counts up to yesterday when today is not logged yet', () => {
		const today = localDateKey(NOW);
		const days = [addDaysKey(today, -1), addDaysKey(today, -2)].map((dateKey) => ({ dateKey }));
		expect(computeStreak(days, today)).toBe(2);
	});

	it('breaks on a gap', () => {
		const today = localDateKey(NOW);
		const days = [{ dateKey: addDaysKey(today, -3) }, { dateKey: addDaysKey(today, -4) }];
		expect(computeStreak(days, today)).toBe(0);
	});
});

describe('recordCompletion', () => {
	it('logs a study day for every session type but only writes cards for review', async () => {
		const { repository, service } = await makeService();
		await service.recordCompletion(
			[{ questionId: 'mcq-1-001', points: 1 }],
			NOW.toISOString(),
			'quiz'
		);
		expect(await repository.getStudyLog()).toHaveLength(1);
		expect(await repository.getReviewCards()).toHaveLength(0);

		await service.recordCompletion(
			[
				{ questionId: 'mcq-1-001', points: 1 },
				{ questionId: 'mcq-1-002', points: 0 }
			],
			NOW.toISOString(),
			'review'
		);
		const cards = await repository.getReviewCards();
		expect(cards).toHaveLength(2);
		const correct = cards.find((item) => item.questionId === 'mcq-1-001');
		expect(correct?.lastResult).toBe('correct');
		const wrong = cards.find((item) => item.questionId === 'mcq-1-002');
		expect(wrong?.lapses).toBe(1);
		await repository.close();
	});

	it('upserts the same day instead of duplicating rows', async () => {
		const { repository, service } = await makeService();
		await service.recordCompletion(
			[{ questionId: 'mcq-1-001', points: 1 }],
			NOW.toISOString(),
			'review'
		);
		await service.recordCompletion(
			[{ questionId: 'mcq-1-002', points: 1 }],
			NOW.toISOString(),
			'review'
		);
		const days = await repository.getStudyLog();
		expect(days).toHaveLength(1);
		expect(days[0].questions).toBe(2);
		expect(days[0].sessions).toBe(2);
		await repository.close();
	});
});

describe('composeQueue', () => {
	it('returns fresh unseen questions when nothing is due or weak', async () => {
		const { repository, service } = await makeService();
		const queue = await service.composeQueue({ source: 'daily', count: 10 });
		expect(queue).toHaveLength(10);
		expect(new Set(queue.map((q) => q.id)).size).toBe(10);
		const answered = new Set(await repository.getAnsweredQuestionIds());
		expect(queue.every((q) => !answered.has(q.id))).toBe(true);
		await repository.close();
	});

	it('prioritizes due review cards, lapses first', async () => {
		const { repository, service } = await makeService();
		const today = localDateKey(NOW);
		await repository.upsertReviewCard(
			card({ questionId: 'mcq-1-001', dueAt: addDaysKey(today, -2), lapses: 1 })
		);
		await repository.upsertReviewCard(
			card({ questionId: 'mcq-1-002', dueAt: addDaysKey(today, -5), lapses: 0 })
		);
		const queue = await service.composeQueue({ source: 'daily', count: 10 });
		expect(queue[0].id).toBe('mcq-1-001');
		expect(queue[1].id).toBe('mcq-1-002');
		await repository.close();
	});

	it('pulls questions from weak objectives answered wrong in real sessions', async () => {
		const { repository, bank, service } = await makeService();
		const weakQuestions = bank.mcqs.filter((q) => q.objective === '2.4').slice(0, 5);
		const quizService = createQuizService({
			repository,
			bank,
			rng: () => 0.5,
			now: () => NOW,
			reviewSvc: service
		});
		await repository.createSession({
			id: 'seed-session',
			type: 'quiz',
			mode: 'practice',
			domain: null,
			startedAt: NOW.toISOString(),
			deadlineAt: null,
			questions: weakQuestions
		});
		for (const [index, question] of weakQuestions.entries()) {
			if (question.kind !== 'single-choice' && question.kind !== 'multiple-choice') continue;
			const wrong = question.options.find(
				(option) => !question.correctOptionIds.includes(option.id)
			)!;
			await quizService.saveResponse('seed-session', index, {
				kind: 'choice',
				optionIds: [wrong.id]
			});
		}
		await quizService.completeSession('seed-session');
		expect((await repository.getWeakTopics()).some((topic) => topic.objective === '2.4')).toBe(
			true
		);

		const queue = await service.composeQueue({ source: 'daily', count: 10 });
		// No due cards → the first picks come from the weak-objective pool.
		expect(queue.slice(0, 3).every((q) => q.objective === '2.4')).toBe(true);
		await repository.close();
	});

	it('wall source returns only wall-of-shame questions', async () => {
		const { repository, bank, service } = await makeService();
		const picked = bank.mcqs.filter((q) => q.kind === 'single-choice').slice(0, 4);
		const quizService = createQuizService({
			repository,
			bank,
			rng: () => 0.5,
			now: () => NOW,
			reviewSvc: service
		});
		await repository.createSession({
			id: 'seed-wall',
			type: 'quiz',
			mode: 'practice',
			domain: null,
			startedAt: NOW.toISOString(),
			deadlineAt: null,
			questions: picked
		});
		for (const [index, question] of picked.entries()) {
			const wrong = question.options.find(
				(option) => !question.correctOptionIds.includes(option.id)
			)!;
			await quizService.saveResponse('seed-wall', index, { kind: 'choice', optionIds: [wrong.id] });
		}
		await quizService.completeSession('seed-wall');

		const queue = await service.composeQueue({ source: 'wall', count: 10 });
		expect(queue).toHaveLength(4);
		expect(new Set(queue.map((q) => q.id))).toEqual(new Set(picked.map((q) => q.id)));
		await repository.close();
	});

	it('never returns an empty queue', async () => {
		const { repository, bank, service } = await makeService();
		// Every question answered correctly and every card mastered → all pools empty.
		const all = [...bank.mcqs, ...bank.pbqs].slice(0, 40);
		const quizService = createQuizService({
			repository,
			bank,
			rng: () => 0.5,
			now: () => NOW,
			reviewSvc: service
		});
		await repository.createSession({
			id: 'seed-correct',
			type: 'quiz',
			mode: 'practice',
			domain: null,
			startedAt: NOW.toISOString(),
			deadlineAt: null,
			questions: all.filter((q) => q.kind === 'single-choice').slice(0, 5)
		});
		expect((await service.composeQueue({ source: 'daily', count: 10 })).length).toBeGreaterThan(0);
		await repository.close();
	});
});

describe('wallItems and summary', () => {
	it('shows missed questions and drops them once mastered by review', async () => {
		const { repository, bank, service } = await makeService();
		const picked = bank.mcqs.filter((q) => q.kind === 'single-choice').slice(0, 2);
		const quizService = createQuizService({
			repository,
			bank,
			rng: () => 0.5,
			now: () => NOW,
			reviewSvc: service
		});
		await repository.createSession({
			id: 'seed-wall-2',
			type: 'quiz',
			mode: 'practice',
			domain: null,
			startedAt: NOW.toISOString(),
			deadlineAt: null,
			questions: picked
		});
		for (const [index, question] of picked.entries()) {
			const wrong = question.options.find(
				(option) => !question.correctOptionIds.includes(option.id)
			)!;
			await quizService.saveResponse('seed-wall-2', index, {
				kind: 'choice',
				optionIds: [wrong.id]
			});
		}
		await quizService.completeSession('seed-wall-2');

		const wall = await service.wallItems();
		expect(wall).toHaveLength(2);
		expect(wall[0].wrongCount).toBe(1);

		// Master: two consecutive corrects in review reach interval >= 3.
		await repository.upsertReviewCard(
			card({ questionId: picked[0].id, intervalDays: 3, lastResult: 'correct', reviewCount: 2 })
		);
		const remaining = await service.wallItems();
		expect(remaining.map((item) => item.questionId)).toEqual([picked[1].id]);
		await repository.close();
	});

	it('summarizes streak, due count, wall, and a full 84-day heatmap', async () => {
		const { repository, service } = await makeService();
		const today = localDateKey(NOW);
		await repository.recordStudyDay(addDaysKey(today, -1), 10, NOW.toISOString());
		await repository.recordStudyDay(addDaysKey(today, -2), 7, NOW.toISOString());
		await repository.upsertReviewCard(
			card({ questionId: 'mcq-1-001', dueAt: addDaysKey(today, -1) })
		);
		await repository.upsertReviewCard(
			card({ questionId: 'mcq-1-002', dueAt: addDaysKey(today, 2) })
		);

		const summary = await service.summary();
		expect(summary.streak).toBe(2);
		expect(summary.todayQuestions).toBe(0);
		expect(summary.dueCount).toBe(1);
		expect(summary.heatmap).toHaveLength(84);
		expect(summary.heatmap[83]).toEqual({ date: today, questions: 0 });
		expect(summary.heatmap[82]).toEqual({ date: addDaysKey(today, -1), questions: 10 });
		await repository.close();
	});
});
