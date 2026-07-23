import type { QuestionFeedback, QuestionResponse } from '$lib/types';
import { correctResponse, type QuestionDefinition } from './question-bank';

function selectedScore(correctIds: string[], selectedIds: string[]): number {
	const correct = new Set(correctIds);
	const selected = new Set(selectedIds);
	const hits = [...selected].filter((id) => correct.has(id)).length;
	const misses = [...selected].filter((id) => !correct.has(id)).length;
	return Math.min(1, Math.max(0, (hits - misses) / correctIds.length));
}

export function scoreQuestion(
	question: QuestionDefinition,
	response: QuestionResponse | null
): QuestionFeedback {
	const correct = correctResponse(question);
	let earnedPoints = 0;
	if (response) {
		switch (question.kind) {
			case 'single-choice':
			case 'multiple-choice':
				if (response.kind === 'choice') {
					const expected = new Set(question.correctOptionIds);
					if (question.format === 'pbq' && question.kind === 'multiple-choice') {
						earnedPoints = selectedScore(question.correctOptionIds, response.optionIds);
					} else if (response.optionIds.length === expected.size && response.optionIds.every((id) => expected.has(id))) earnedPoints = 1;
				}
				break;
			case 'ordering':
				if (response.kind === 'ordering') earnedPoints = response.itemIds.filter((id, index) => id === question.correctOrder[index]).length / question.correctOrder.length;
				break;
			case 'matching':
				if (response.kind === 'matching') earnedPoints = question.premises.filter((premise) => response.matches[premise.id] === question.correctMatches[premise.id]).length / question.premises.length;
				break;
			case 'numeric':
				if (response.kind === 'numeric' && Math.abs(response.value - question.correctValue) <= question.tolerance) earnedPoints = 1;
				break;
			case 'evidence':
				if (response.kind === 'evidence') earnedPoints = selectedScore(question.correctLineIds, response.lineIds);
				break;
			case 'configuration':
				if (response.kind === 'configuration') earnedPoints = question.fields.filter((field) => response.values[field.id] === question.correctValues[field.id]).length / question.fields.length;
				break;
		}
	}
	return {
		earnedPoints,
		possiblePoints: 1,
		fullyCorrect: earnedPoints === 1,
		correctResponse: correct,
		explanation: question.explanation,
		sourceRefs: question.sourceRefs,
		...(question.kind === 'single-choice' || question.kind === 'multiple-choice'
			? { optionRationales: Object.fromEntries(question.options.map((option) => [option.id, option.rationale])) }
			: {})
	};
}
