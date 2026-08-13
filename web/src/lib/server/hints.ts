import { AUTO_HINTABLE_KINDS } from '$lib/types';
import type { QuestionDefinition } from './question-bank';

function truncate(text: string, max = 60): string {
	return text.length > max ? `${text.slice(0, max - 1)}…` : text;
}

/**
 * Deterministic practice-mode hint for questions without an authored hint.
 * Choice kinds only ever name WRONG options (answer-neutral by construction);
 * other kinds reveal at most one element of the correct response.
 */
export function autoHint(definition: QuestionDefinition): string | undefined {
	if (!(AUTO_HINTABLE_KINDS as readonly string[]).includes(definition.kind)) return undefined;
	switch (definition.kind) {
		case 'single-choice': {
			const wrong = definition.options.filter((option) => !definition.correctOptionIds.includes(option.id));
			return wrong.length >= 2
				? `Two of the options are incorrect: "${truncate(wrong[0].text, 48)}" and "${truncate(wrong[1].text, 48)}".`
				: undefined;
		}
		case 'multiple-choice': {
			const wrong = definition.options.find((option) => !definition.correctOptionIds.includes(option.id));
			return wrong ? `One of the options is incorrect: "${truncate(wrong.text, 48)}".` : undefined;
		}
		case 'ordering': {
			const first = definition.items.find((item) => item.id === definition.correctOrder[0]);
			return first ? `The first item in the correct order is "${truncate(first.text, 48)}".` : undefined;
		}
		case 'matching': {
			const premise = definition.premises[0];
			const targetId = premise ? definition.correctMatches[premise.id] : undefined;
			const target = targetId
				? [...definition.targets, ...(definition.extraTargets ?? [])].find((item) => item.id === targetId)
				: undefined;
			return premise && target
				? `One correct pairing: "${truncate(premise.text, 40)}" → "${truncate(target.text, 40)}".`
				: undefined;
		}
		case 'configuration': {
			const field = definition.fields[0];
			const valueId = field ? definition.correctValues[field.id] : undefined;
			const value = valueId ? field?.options.find((option) => option.id === valueId) : undefined;
			return field && value
				? `For "${truncate(field.label, 40)}", the correct setting is "${truncate(value.text, 40)}".`
				: undefined;
		}
		case 'word-bank': {
			const blank = definition.blanks[0];
			const wordId = blank ? definition.correctAssignments[blank.id] : undefined;
			const word = wordId ? definition.bank.find((item) => item.id === wordId) : undefined;
			return blank && word
				? `The blank "${truncate(blank.label, 40)}" should be filled with "${truncate(word.word, 40)}".`
				: undefined;
		}
		case 'sort': {
			const item = definition.items[0];
			const bucketId = item ? definition.correctBuckets[item.id] : undefined;
			const bucket = bucketId ? definition.buckets.find((entry) => entry.id === bucketId) : undefined;
			return item && bucket
				? `The item "${truncate(item.text, 40)}" belongs in the "${truncate(bucket.label, 40)}" bucket.`
				: undefined;
		}
		case 'hotspot': {
			const region = definition.regions.find((entry) => entry.correct);
			return region ? `One of the correct regions is "${truncate(region.label, 48)}".` : undefined;
		}
		case 'memory': {
			const pair = definition.pairs[0];
			return pair ? `One matching pair: "${truncate(pair.a, 40)}" — "${truncate(pair.b, 40)}".` : undefined;
		}
		case 'evidence': {
			const line = definition.correctLineIds
				.map((id) => definition.artifact.lines.find((entry) => entry.id === id))
				.find(Boolean);
			return line ? `One of the lines to select is: "${truncate(line.text, 56)}".` : undefined;
		}
		case 'slider': {
			const span = Math.max(definition.tolerance * 4, (definition.max - definition.min) * 0.1);
			const low = Math.max(
				definition.min,
				Math.round((definition.correctValue - span - definition.min) / definition.step) * definition.step + definition.min
			);
			const high = Math.min(
				definition.max,
				Math.round((definition.correctValue + span - definition.min) / definition.step) * definition.step + definition.min
			);
			const unit = definition.unit ? ` ${definition.unit}` : '';
			return `The correct value is between ${low} and ${high}${unit}.`;
		}
		default:
			return undefined;
	}
}
