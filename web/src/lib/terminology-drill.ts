import type { TerminologyCategory, TerminologyEntry, TerminologySection } from './terminology-data';

export type DrillFormat = 'matching' | 'fill' | 'mixed';
export type DomainFilter = 'all' | 1 | 2 | 3 | 4 | 5;

export interface DrillConfig {
	section: TerminologySection;
	domain: DomainFilter;
	/** Ports filter inside the terminology section. */
	portOnly: boolean;
	format: DrillFormat;
	/** Number of bank entries in the session (a matching board packs up to 3). */
	count: number;
}

export interface SessionItem {
	id: string;
	kind: 'matching' | 'fill';
	entries: TerminologyEntry[];
}

export interface SessionPlan {
	items: SessionItem[];
	totalEntries: number;
}

export interface EntryResult {
	entry: TerminologyEntry;
	correct: boolean;
}

export interface FillCheck {
	correct: boolean;
	expected: string;
}

const MATCHING_BOARD_SIZE = 3;

/**
 * Case-, space-, and hyphen-insensitive answer normalization. It deliberately
 * stops there: no Levenshtein distance, stemming, punctuation stripping, or
 * other fuzzy match, and aliases must be declared on the entry.
 */
export function normalizeTerminologyAnswer(value: string): string {
	return value
		.normalize('NFC')
		.toLocaleLowerCase('en-US')
		.replace(/[\s\u00a0\u2007\u202f\u2010-\u2015-]+/g, '');
}

export function acceptedAnswers(entry: TerminologyEntry): string[] {
	return [entry.term, ...(entry.aliases ?? [])];
}

export function checkFill(entry: TerminologyEntry, input: string): FillCheck {
	const normalized = normalizeTerminologyAnswer(input);
	const correct = acceptedAnswers(entry).some(
		(answer) => normalizeTerminologyAnswer(answer) === normalized
	);
	return { correct, expected: entry.term };
}

export function filterEntries(
	bank: readonly TerminologyEntry[],
	config: Pick<DrillConfig, 'section' | 'domain' | 'portOnly'>
): TerminologyEntry[] {
	return bank.filter((entry) => {
		if (config.section === 'protocols') {
			if (entry.category !== 'protocol') return false;
		} else {
			if (entry.category === 'protocol') return false;
			if (config.portOnly && entry.category !== 'port') return false;
		}
		return config.domain === 'all' || entry.domain === config.domain;
	});
}

export function categoryForSection(
	section: TerminologySection,
	portOnly: boolean
): TerminologyCategory[] {
	if (section === 'protocols') return ['protocol'];
	return portOnly ? ['port'] : ['acronym', 'term', 'port'];
}

/** Fisher-Yates shuffle over a copy; injectable for deterministic tests. */
export function shuffle<T>(values: readonly T[], random: () => number = Math.random): T[] {
	const copy = [...values];
	for (let index = copy.length - 1; index > 0; index -= 1) {
		const swap = Math.floor(random() * (index + 1));
		[copy[index], copy[swap]] = [copy[swap], copy[index]];
	}
	return copy;
}

function itemsFromEntries(
	entries: readonly TerminologyEntry[],
	format: DrillFormat
): SessionItem[] {
	if (format === 'fill') {
		return entries.map((entry, index) => ({
			id: `fill-${index}-${entry.id}`,
			kind: 'fill',
			entries: [entry]
		}));
	}

	if (format === 'matching') {
		const items: SessionItem[] = [];
		for (let index = 0; index < entries.length; index += MATCHING_BOARD_SIZE) {
			items.push({
				id: `match-${index / MATCHING_BOARD_SIZE}`,
				kind: 'matching',
				entries: entries.slice(index, index + MATCHING_BOARD_SIZE)
			});
		}
		return items;
	}

	// Mixed: guarantee both formats when the pool has at least two entries.
	if (entries.length === 1) {
		return [{ id: `fill-0-${entries[0].id}`, kind: 'fill', entries: [entries[0]] }];
	}
	if (entries.length < 4) {
		const fillEntry = entries[0];
		const matchingEntries = entries.slice(1);
		return [
			{ id: `fill-0-${fillEntry.id}`, kind: 'fill', entries: [fillEntry] },
			{ id: 'match-0', kind: 'matching', entries: matchingEntries }
		];
	}

	// Alternate a small matching board with a short run of fill items so
	// both formats appear without duplicating any entry.
	const items: SessionItem[] = [];
	let index = 0;
	let board = 0;
	let fillIndex = 0;
	while (index < entries.length) {
		if (board % 2 === 0) {
			const chunk = entries.slice(index, index + MATCHING_BOARD_SIZE);
			items.push({ id: `match-${board}`, kind: 'matching', entries: chunk });
			index += chunk.length;
		} else {
			const chunk = entries.slice(index, index + MATCHING_BOARD_SIZE);
			for (const entry of chunk) {
				items.push({ id: `fill-${fillIndex}-${entry.id}`, kind: 'fill', entries: [entry] });
				fillIndex += 1;
			}
			index += chunk.length;
		}
		board += 1;
	}
	return items;
}

/**
 * Build a session plan from a filtered, shuffled bank slice. Matching items pack
 * up to three pairs; fill items carry one entry. The returned order is what the
 * learner sees, one item at a time.
 */
export function planSession(
	bank: readonly TerminologyEntry[],
	config: DrillConfig,
	random: () => number = Math.random
): SessionPlan {
	const pool = filterEntries(bank, config);
	const count = Math.max(1, Math.min(config.count, pool.length));
	const chosen = shuffle(pool, random).slice(0, count);
	const items = itemsFromEntries(chosen, config.format);
	return {
		items,
		totalEntries: items.reduce((sum, item) => sum + item.entries.length, 0)
	};
}

/** Rebuild a session containing only the entries missed in the previous run. */
export function planRetry(
	missed: readonly TerminologyEntry[],
	format: DrillFormat,
	random: () => number = Math.random
): SessionPlan {
	const chosen = shuffle(missed, random);
	const items = itemsFromEntries(chosen, format);
	return {
		items,
		totalEntries: items.reduce((sum, item) => sum + item.entries.length, 0)
	};
}

/** Grade one matching board. Every entry is a pair; unmatched pairs score wrong. */
export function gradeMatching(item: SessionItem, matches: Record<string, string>): EntryResult[] {
	return item.entries.map((entry) => ({
		entry,
		correct: matches[entry.id] === entry.id
	}));
}

export function gradeFill(entry: TerminologyEntry, input: string): EntryResult {
	return { entry, correct: checkFill(entry, input).correct };
}

export function scoreResults(results: readonly EntryResult[]): {
	correct: number;
	total: number;
	percent: number;
} {
	const total = results.length;
	const correct = results.filter((result) => result.correct).length;
	return { correct, total, percent: total === 0 ? 0 : Math.round((correct / total) * 100) };
}

export function missedEntries(results: readonly EntryResult[]): TerminologyEntry[] {
	return results.filter((result) => !result.correct).map((result) => result.entry);
}
