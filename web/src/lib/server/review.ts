import type { Domain, ObjectiveId } from '$lib/types';
import type { QuestionDefinition, QuestionBank } from './question-bank';
import { loadQuestionBank } from './question-bank';
import { quizRepository, type QuizRepository, type ReviewCardRow } from './db';

export type ReviewSource = 'daily' | 'wall';

export interface ReviewHeatmapDay {
	date: string;
	questions: number;
}

export interface WallItem {
	questionId: string;
	domain: Domain;
	objective: ObjectiveId;
	kind: QuestionDefinition['kind'];
	prompt: string;
	wrongCount: number;
	lastWrongAt: string | null;
}

export interface ReviewSummary {
	streak: number;
	todayQuestions: number;
	dueCount: number;
	wallCount: number;
	wallByDomain: Record<Domain, number>;
	heatmap: ReviewHeatmapDay[];
	lastStudyAt: string | null;
}

export interface ReviewService {
	summary(now?: Date): ReviewSummary;
	composeQueue(input: { source: ReviewSource; count?: number }, now?: Date): QuestionDefinition[];
	recordCompletion(
		answers: { questionId: string; points: number }[],
		completedAt: string,
		sessionType: string
	): void;
	wallItems(now?: Date): WallItem[];
}

/** Local-calendar date key (YYYY-MM-DD) — never UTC, so date-only logic can't shift days. */
export function localDateKey(date: Date): string {
	return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(
		date.getDate()
	).padStart(2, '0')}`;
}

export function keyToDate(key: string): Date {
	const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(key);
	return match ? new Date(Number(match[1]), Number(match[2]) - 1, Number(match[3])) : new Date(key);
}

export function addDaysKey(key: string, days: number): string {
	const date = keyToDate(key);
	date.setDate(date.getDate() + days);
	return localDateKey(date);
}

/** SM-2-lite: correct grows the interval by the ease factor; wrong resets to 1 day and lapses. */
export function scheduleReview(
	card: ReviewCardRow | undefined,
	fullyCorrect: boolean,
	todayKey: string
): ReviewCardRow {
	const reviewCount = (card?.reviewCount ?? 0) + 1;
	const firstSeenAt = card?.firstSeenAt ?? new Date().toISOString();
	if (fullyCorrect) {
		const ease = Math.min((card?.ease ?? 2.5) + 0.1, 3);
		const intervalDays = card ? Math.max(1, Math.round((card.intervalDays ?? 0) * ease)) : 1;
		return {
			questionId: card?.questionId ?? '',
			intervalDays,
			ease,
			lapses: card?.lapses ?? 0,
			dueAt: addDaysKey(todayKey, intervalDays),
			lastResult: 'correct',
			reviewCount,
			firstSeenAt
		};
	}
	return {
		questionId: card?.questionId ?? '',
		intervalDays: 1,
		ease: Math.max((card?.ease ?? 2.5) - 0.2, 1.3),
		lapses: (card?.lapses ?? 0) + 1,
		dueAt: addDaysKey(todayKey, 1),
		lastResult: 'wrong',
		reviewCount,
		firstSeenAt
	};
}

/** Consecutive days of study ending today (or yesterday if today is not logged yet). */
export function computeStreak(days: { dateKey: string }[], todayKey: string): number {
	const logged = new Set(days.map((day) => day.dateKey));
	let cursor = logged.has(todayKey) ? todayKey : addDaysKey(todayKey, -1);
	let streak = 0;
	while (logged.has(cursor)) {
		streak++;
		cursor = addDaysKey(cursor, -1);
	}
	return streak;
}

function shuffle<T>(items: T[], rng: () => number): T[] {
	const result = [...items];
	for (let index = result.length - 1; index > 0; index--) {
		const selected = Math.floor(rng() * (index + 1));
		[result[index], result[selected]] = [result[selected], result[index]];
	}
	return result;
}

const WALL_MASTERY_INTERVAL = 3;

export function createReviewService({
	repository,
	bank,
	now = () => new Date(),
	rng = Math.random
}: {
	repository: QuizRepository;
	bank: QuestionBank;
	now?: () => Date;
	rng?: () => number;
}): ReviewService {
	const allQuestions = (): QuestionDefinition[] => [...bank.mcqs, ...bank.pbqs];

	const cardMap = () => new Map(repository.getReviewCards().map((card) => [card.questionId, card]));

	/** Questions answered wrong at least once and not yet proven mastered by review cards. */
	function wallItems(date = now()): WallItem[] {
		const cards = cardMap();
		const missed = new Map<string, { wrongCount: number; lastWrongAt: string | null }>();
		for (const row of repository.getAnswerHistory()) {
			if (row.isCorrect) continue;
			const existing = missed.get(row.questionId) ?? { wrongCount: 0, lastWrongAt: null };
			existing.wrongCount++;
			if (!existing.lastWrongAt || row.completedAt > existing.lastWrongAt)
				existing.lastWrongAt = row.completedAt;
			missed.set(row.questionId, existing);
		}
		const mastered = (questionId: string): boolean => {
			const card = cards.get(questionId);
			// interval >= 3 means at least two consecutive corrects (a wrong resets it to 1).
			return !!card && card.lastResult === 'correct' && card.intervalDays >= WALL_MASTERY_INTERVAL;
		};
		return allQuestions()
			.filter((question) => {
				const record = missed.get(question.id);
				return !!record && record.wrongCount >= 1 && !mastered(question.id);
			})
			.map((question) => ({
				questionId: question.id,
				domain: question.domain,
				objective: question.objective,
				kind: question.kind,
				prompt:
					question.prompt.length > 150 ? `${question.prompt.slice(0, 150)}…` : question.prompt,
				wrongCount: missed.get(question.id)!.wrongCount,
				lastWrongAt: missed.get(question.id)!.lastWrongAt
			}))
			.sort((a, b) => (b.lastWrongAt ?? '').localeCompare(a.lastWrongAt ?? ''));
	}

	function composeQueue(input: { source: ReviewSource; count?: number }, date = now()): QuestionDefinition[] {
		const count = input.count ?? 10;
		const todayKey = localDateKey(date);
		const all = allQuestions();
		const byId = new Map(all.map((question) => [question.id, question]));
		const cards = cardMap();
		const answered = new Set(repository.getAnsweredQuestionIds());
		const selected: QuestionDefinition[] = [];
		const add = (question: QuestionDefinition | undefined) => {
			if (question && !selected.some((item) => item.id === question.id)) selected.push(question);
		};

		if (input.source === 'wall') {
			const wallIds = new Set(wallItems(date).map((item) => item.questionId));
			for (const question of shuffle(all, rng)) if (wallIds.has(question.id)) add(question);
			return selected.slice(0, count);
		}

		// 1. Due review cards first — most-lapsed, then longest-overdue. Cap at half the queue.
		const due = [...cards.values()]
			.filter((card) => card.dueAt <= todayKey)
			.sort((a, b) => b.lapses - a.lapses || a.dueAt.localeCompare(b.dueAt));
		for (const card of due.slice(0, Math.max(1, Math.floor(count / 2)))) add(byId.get(card.questionId));

		// 2. Weak objectives next (from quiz_answers history, threshold <85% on >=3 attempts).
		const weakObjectives = new Set(repository.getWeakTopics().map((topic) => topic.objective));
		for (const question of shuffle(all, rng)) {
			if (!weakObjectives.has(question.objective)) continue;
			add(question);
			if (selected.length >= count) break;
		}

		// 3. Brand-new questions (never answered anywhere, never introduced to review).
		const fresh = shuffle(
			all.filter((question) => !answered.has(question.id) && !cards.has(question.id)),
			rng
		);
		for (const question of fresh) {
			add(question);
			if (selected.length >= count) break;
		}

		// 4. Safety net: never return an empty queue — fall back to random unseen practice.
		if (selected.length === 0) return shuffle(all, rng).slice(0, count);
		return selected.slice(0, count);
	}

	function recordCompletion(
		answers: { questionId: string; points: number }[],
		completedAt: string,
		sessionType: string
	): void {
		const todayKey = localDateKey(new Date(completedAt));
		repository.recordStudyDay(todayKey, answers.length, completedAt);
		if (sessionType !== 'review') return;
		const cards = cardMap();
		for (const answer of answers) {
			const next = scheduleReview(cards.get(answer.questionId), answer.points >= 1, todayKey);
			repository.upsertReviewCard({ ...next, questionId: answer.questionId });
		}
	}

	function summary(date = now()): ReviewSummary {
		const todayKey = localDateKey(date);
		const cards = cardMap();
		const log = repository.getStudyLog();
		const byDay = new Map(log.map((day) => [day.dateKey, day]));
		const today = byDay.get(todayKey);
		const wall = wallItems(date);
		const wallByDomain: Record<Domain, number> = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };
		for (const item of wall) wallByDomain[item.domain]++;
		// Last 12 weeks (84 days) ending today.
		const heatmap: ReviewHeatmapDay[] = [];
		for (let offset = 83; offset >= 0; offset--) {
			const key = addDaysKey(todayKey, -offset);
			heatmap.push({ date: key, questions: byDay.get(key)?.questions ?? 0 });
		}
		return {
			streak: computeStreak(log, todayKey),
			todayQuestions: today?.questions ?? 0,
			dueCount: [...cards.values()].filter((card) => card.dueAt <= todayKey).length,
			wallCount: wall.length,
			wallByDomain,
			heatmap,
			lastStudyAt:
				log.length > 0 ? log[log.length - 1].updatedAt : null
		};
	}

	return { summary, composeQueue, recordCompletion, wallItems };
}

export const reviewService = createReviewService({
	repository: quizRepository,
	bank: loadQuestionBank()
});
