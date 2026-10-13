import type { PublicQuestion, QuestionResponse } from '$lib/types';

/**
 * Pure predicates over a question + draft response pair, shared by ExamFlow's
 * save gate, its silent (navigate-away) persistence, and the question-grid
 * "answered" display. Client-safe by design: they only read `PublicQuestion`
 * and `QuestionResponse` from `$lib/types` — no server imports.
 *
 * - `isDraftComplete` — every part of the question carries an answer. Graded
 *   sessions only ever save complete drafts, because the server locks a graded
 *   response on its first save.
 * - `hasDraftWork` — the draft contains real learner work of any kind. Practice
 *   sessions save any draft with work in it so a half-finished answer is never
 *   discarded on navigation.
 */

function nonEmpty(value: string | undefined): boolean {
	return Boolean(value && value.trim().length > 0);
}

/** True when the response answers the question fully (all blanks, pairs, options…). */
export function isDraftComplete(
	question: PublicQuestion | null | undefined,
	response: QuestionResponse | null | undefined
): boolean {
	if (!question || !response) return false;
	switch (question.kind) {
		case 'single-choice':
		case 'multiple-choice':
			return response.kind === 'choice' && response.optionIds.length === question.selectCount;
		case 'ordering':
			return response.kind === 'ordering' && response.itemIds.length === question.items.length;
		case 'matching':
			return (
				response.kind === 'matching' &&
				question.premises.every((premise) => Boolean(response.matches[premise.id]))
			);
		case 'numeric':
			return response.kind === 'numeric' && Number.isFinite(response.value);
		case 'slider':
			return response.kind === 'slider' && Number.isFinite(response.value);
		case 'evidence':
			return response.kind === 'evidence' && response.lineIds.length === question.selectCount;
		case 'configuration':
			return (
				response.kind === 'configuration' &&
				question.fields.every((field) => nonEmpty(response.values[field.id]))
			);
		case 'fill-blank':
			return (
				response.kind === 'fill-blank' &&
				question.blanks.every((blank) => nonEmpty(response.values[blank.id]))
			);
		case 'word-bank':
			return (
				response.kind === 'word-bank' &&
				question.blanks.every((blank) => Boolean(response.assignments[blank.id]))
			);
		case 'sort':
			return (
				response.kind === 'sort' &&
				question.items.every((item) => Boolean(response.assignments[item.id]))
			);
		case 'hotspot':
			// A hotspot has no "select every region" rule (scoring is per hit/miss), so
			// any region choice is a submittable answer — mirroring the existing gate.
			return response.kind === 'hotspot' && response.regionIds.length > 0;
		case 'memory':
			return response.kind === 'memory' && response.matchedPairIds.length === question.pairs.length;
		case 'multi-step':
			return (
				response.kind === 'multi-step' &&
				question.steps.every((step, i) => isDraftComplete(step, response.stepResponses[i] ?? null))
			);
	}
}

/** True when the response holds any real learner work, complete or not. */
export function hasDraftWork(
	question: PublicQuestion | null | undefined,
	response: QuestionResponse | null | undefined
): boolean {
	if (!question || !response) return false;
	switch (question.kind) {
		case 'single-choice':
		case 'multiple-choice':
			return response.kind === 'choice' && response.optionIds.length > 0;
		case 'ordering':
			return response.kind === 'ordering' && response.itemIds.length > 0;
		case 'matching':
			return response.kind === 'matching' && Object.values(response.matches).some(Boolean);
		case 'numeric':
			return response.kind === 'numeric' && Number.isFinite(response.value);
		case 'slider':
			return response.kind === 'slider' && Number.isFinite(response.value);
		case 'evidence':
			return response.kind === 'evidence' && response.lineIds.length > 0;
		case 'configuration':
			return response.kind === 'configuration' && Object.values(response.values).some(nonEmpty);
		case 'fill-blank':
			return response.kind === 'fill-blank' && Object.values(response.values).some(nonEmpty);
		case 'word-bank':
			return response.kind === 'word-bank' && Object.values(response.assignments).some(Boolean);
		case 'sort':
			return response.kind === 'sort' && Object.values(response.assignments).some(Boolean);
		case 'hotspot':
			return response.kind === 'hotspot' && response.regionIds.length > 0;
		case 'memory':
			return response.kind === 'memory' && response.matchedPairIds.length > 0;
		case 'multi-step':
			// Existing practice rule: a multi-step draft carries work as soon as any
			// step holds a response (each stored step is validated server-side).
			return response.kind === 'multi-step' && response.stepResponses.some((step) => step !== null);
	}
}
