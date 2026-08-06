import type { Domain, ObjectiveId } from '$lib/types';
import { OBJECTIVES_BY_DOMAIN } from '$lib/utils';
import type { QuestionBank } from './question-bank';
import { loadQuestionBank } from './question-bank';
import { quizRepository, type QuizRepository } from './db';

export interface ObjectiveMastery {
	objective: ObjectiveId;
	domain: Domain;
	attempted: number;
	earnedPoints: number;
	possiblePoints: number;
	/** Accuracy percentage, or null when the objective has never been attempted. */
	percentage: number | null;
	/** How many bank MCQs exist for this objective (practice pool size). */
	availableQuestions: number;
}

export interface MasteryMatrix {
	objectives: ObjectiveMastery[];
	/** Per-domain rollups in canonical order. */
	domains: {
		domain: Domain;
		attempted: number;
		possiblePoints: number;
		earnedPoints: number;
		percentage: number | null;
	}[];
	totalAttempted: number;
}

export function computeMastery(
	repository: QuizRepository,
	bank: QuestionBank,
	objectives: Record<number, ObjectiveId[]> = OBJECTIVES_BY_DOMAIN
): MasteryMatrix {
	const progress = new Map(
		repository.getObjectiveProgress().map((row) => [row.objective, row] as const)
	);
	const available = new Map<string, number>();
	for (const question of bank.mcqs) {
		available.set(question.objective, (available.get(question.objective) ?? 0) + 1);
	}

	const allObjectives: ObjectiveId[] = (Object.keys(objectives).map(Number) as Domain[]).flatMap(
		(domain) => objectives[domain] as ObjectiveId[]
	);

	const objectiveItems: ObjectiveMastery[] = allObjectives.map((objective) => {
		const row = progress.get(objective);
		const attempted = row?.attempted ?? 0;
		const earnedPoints = row?.earnedPoints ?? 0;
		const possiblePoints = row?.possiblePoints ?? 0;
		return {
			objective,
			domain: Number(objective.split('.')[0]) as Domain,
			attempted,
			earnedPoints,
			possiblePoints,
			percentage: possiblePoints ? Math.round((earnedPoints / possiblePoints) * 1000) / 10 : null,
			availableQuestions: available.get(objective) ?? 0
		};
	});

	const domains = (Object.keys(objectives).map(Number) as Domain[]).map((domain) => {
		const items = objectiveItems.filter((item) => item.domain === domain);
		const attempted = items.reduce((sum, item) => sum + item.attempted, 0);
		const possiblePoints = items.reduce((sum, item) => sum + item.possiblePoints, 0);
		const earnedPoints = items.reduce((sum, item) => sum + item.earnedPoints, 0);
		return {
			domain,
			attempted,
			possiblePoints,
			earnedPoints,
			percentage: possiblePoints ? Math.round((earnedPoints / possiblePoints) * 1000) / 10 : null
		};
	});

	return {
		objectives: objectiveItems,
		domains,
		totalAttempted: objectiveItems.reduce((sum, item) => sum + item.attempted, 0)
	};
}

export function getMasteryMatrix(): MasteryMatrix {
	return computeMastery(quizRepository, loadQuestionBank());
}
