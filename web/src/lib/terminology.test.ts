import { describe, expect, it } from 'vitest';
import { OBJECTIVE_ACRONYMS, TERMINOLOGY_BANK, TERMINOLOGY_FLOORS } from './terminology-data';
import type { TerminologyEntry } from './terminology-data';
import {
	acceptedAnswers,
	checkFill,
	filterEntries,
	gradeMatching,
	missedEntries,
	normalizeTerminologyAnswer,
	planRetry,
	planSession,
	scoreResults
} from './terminology-drill';
import type { DrillConfig } from './terminology-drill';
import { OBJECTIVES_BY_DOMAIN } from './utils';

const config = (overrides: Partial<DrillConfig> = {}): DrillConfig => ({
	section: 'terminology',
	domain: 'all',
	portOnly: false,
	format: 'fill',
	count: 9,
	...overrides
});

const categories = TERMINOLOGY_BANK.reduce<Record<string, number>>((counts, entry) => {
	counts[entry.category] = (counts[entry.category] ?? 0) + 1;
	return counts;
}, {});

const domainCounts = TERMINOLOGY_BANK.reduce<Record<number, number>>((counts, entry) => {
	counts[entry.domain] = (counts[entry.domain] ?? 0) + 1;
	return counts;
}, {});

describe('SY0-701 terminology bank', () => {
	it('holds 150–200 entries with unique ids and unique drillable terms', () => {
		expect(TERMINOLOGY_BANK.length).toBeGreaterThanOrEqual(TERMINOLOGY_FLOORS.totalMin);
		expect(TERMINOLOGY_BANK.length).toBeLessThanOrEqual(TERMINOLOGY_FLOORS.totalMax);
		expect(new Set(TERMINOLOGY_BANK.map((entry) => entry.id)).size).toBe(TERMINOLOGY_BANK.length);
		expect(new Set(TERMINOLOGY_BANK.map((entry) => entry.term)).size).toBe(TERMINOLOGY_BANK.length);
	});

	it('meets the category floors: 40 protocols, 100 acronyms, 20 ports, 10 concepts', () => {
		expect(categories.protocol).toBeGreaterThanOrEqual(TERMINOLOGY_FLOORS.protocol);
		expect(categories.acronym).toBeGreaterThanOrEqual(TERMINOLOGY_FLOORS.acronym);
		expect(categories.port).toBeGreaterThanOrEqual(TERMINOLOGY_FLOORS.port);
		expect(categories.term).toBeGreaterThanOrEqual(TERMINOLOGY_FLOORS.term);
	});

	it('meets the per-domain floor across all five domains', () => {
		for (const domain of [1, 2, 3, 4, 5]) {
			expect(domainCounts[domain], `domain ${domain}`).toBeGreaterThanOrEqual(
				TERMINOLOGY_FLOORS.domain
			);
		}
	});

	it('keeps protocols in the Protocols section and everything else in terminology', () => {
		for (const entry of TERMINOLOGY_BANK) {
			if (entry.section === 'protocols') expect(entry.category).toBe('protocol');
			else expect(entry.category).not.toBe('protocol');
		}
	});

	it('tags every entry with a valid domain and matching objective', () => {
		for (const entry of TERMINOLOGY_BANK) {
			expect([1, 2, 3, 4, 5]).toContain(entry.domain);
			if (entry.objective) {
				expect(OBJECTIVES_BY_DOMAIN[entry.domain], entry.id).toContain(entry.objective);
				expect(entry.objective.startsWith(`${entry.domain}.`), entry.id).toBe(true);
			}
			expect(entry.definition.trim().length, entry.id).toBeGreaterThan(18);
			expect(entry.term.trim().length, entry.id).toBeGreaterThan(0);
		}
	});

	it('gives every port a numeric port and a unique number', () => {
		const ports = TERMINOLOGY_BANK.filter((entry) => entry.category === 'port');
		expect(new Set(ports.map((entry) => entry.port)).size).toBe(ports.length);
		for (const entry of ports) {
			expect(entry.port, entry.id).toBeTypeOf('number');
			expect(entry.term).toBe(String(entry.port));
			expect(entry.aliases).toContain(`port ${entry.port}`);
		}
	});

	it('covers every acronym named in the SY0-701 objectives', () => {
		const terms = new Set(TERMINOLOGY_BANK.map((entry) => entry.term.toLowerCase()));
		const missing = OBJECTIVE_ACRONYMS.filter((acronym) => !terms.has(acronym.toLowerCase()));
		expect(missing, `missing objective acronyms: ${missing.join(', ')}`).toEqual([]);
	});

	it('offers a drillable protocol, terminology, and port set for every domain', () => {
		for (const domain of [1, 2, 3, 4, 5] as const) {
			expect(
				filterEntries(TERMINOLOGY_BANK, { section: 'protocols', domain, portOnly: false }).length,
				`protocols domain ${domain}`
			).toBeGreaterThan(0);
			expect(
				filterEntries(TERMINOLOGY_BANK, { section: 'terminology', domain, portOnly: false }).length,
				`terminology domain ${domain}`
			).toBeGreaterThan(0);
			expect(
				filterEntries(TERMINOLOGY_BANK, { section: 'terminology', domain, portOnly: true }).length,
				`ports domain ${domain}`
			).toBeGreaterThan(0);
		}
	});

	it('exposes ports only as a filter inside the terminology section', () => {
		const ports = filterEntries(TERMINOLOGY_BANK, {
			section: 'terminology',
			domain: 'all',
			portOnly: true
		});
		expect(ports.length).toBeGreaterThanOrEqual(TERMINOLOGY_FLOORS.port);
		expect(ports.every((entry) => entry.category === 'port')).toBe(true);
		expect(
			filterEntries(TERMINOLOGY_BANK, {
				section: 'protocols',
				domain: 'all',
				portOnly: true
			}).every((entry) => entry.category === 'protocol')
		).toBe(true);
	});
});

describe('fill-in-the-blank grading', () => {
	const ipsec = TERMINOLOGY_BANK.find((entry) => entry.term === 'IPsec')!;
	const tacacs = TERMINOLOGY_BANK.find((entry) => entry.term === 'TACACS+')!;
	const dmz = TERMINOLOGY_BANK.find((entry) => entry.term === 'Screened subnet')!;

	it('normalizes case, spaces, and hyphens', () => {
		for (const input of ['IPsec', 'ipsec', ' IP SEC ', 'ip-sec', 'IP—SEC', 'Ip Sec']) {
			expect(checkFill(ipsec, input).correct, input).toBe(true);
		}
		expect(normalizeTerminologyAnswer('  IP-Sec  ')).toBe('ipsec');
	});

	it('accepts explicit aliases', () => {
		expect(checkFill(tacacs, 'tacacs plus').correct).toBe(true);
		expect(checkFill(tacacs, 'TACACS+').correct).toBe(true);
		expect(checkFill(dmz, 'dmz').correct).toBe(true);
		expect(checkFill(dmz, 'demilitarized-zone').correct).toBe(true);
	});

	it('does not fuzzy-match typos', () => {
		expect(checkFill(ipsec, 'ipsecc').correct).toBe(false);
		expect(checkFill(ipsec, 'ips').correct).toBe(false);
		expect(checkFill(tacacs, 'tacacs plus plus').correct).toBe(false);
		expect(checkFill(dmz, 'dmzz').correct).toBe(false);
	});

	it('reports the displayed answer for feedback', () => {
		expect(checkFill(ipsec, 'nope')).toEqual({ correct: false, expected: 'IPsec' });
		expect(acceptedAnswers(dmz)).toContain('DMZ');
	});
});

describe('session planning', () => {
	const random = () => 0.42;

	it('builds fill-only items with one entry apiece', () => {
		const plan = planSession(TERMINOLOGY_BANK, config({ count: 12 }), random);
		expect(plan.items).toHaveLength(12);
		expect(plan.totalEntries).toBe(12);
		expect(plan.items.every((item) => item.kind === 'fill' && item.entries.length === 1)).toBe(
			true
		);
	});

	it('builds matching boards of up to three pairs', () => {
		const plan = planSession(TERMINOLOGY_BANK, config({ format: 'matching', count: 7 }), random);
		expect(plan.items.every((item) => item.kind === 'matching')).toBe(true);
		expect(plan.items.map((item) => item.entries.length)).toEqual([3, 3, 1]);
		expect(plan.totalEntries).toBe(7);
	});

	it('mixes both formats without duplicating an entry', () => {
		const plan = planSession(TERMINOLOGY_BANK, config({ format: 'mixed', count: 12 }), random);
		const kinds = new Set(plan.items.map((item) => item.kind));
		expect(kinds).toEqual(new Set(['matching', 'fill']));
		const entries = plan.items.flatMap((item) => item.entries.map((entry) => entry.id));
		expect(new Set(entries).size).toBe(entries.length);
		expect(entries).toHaveLength(12);
	});

	it('mixes both formats even for a two-entry pool', () => {
		const plan = planSession(
			TERMINOLOGY_BANK,
			config({ section: 'protocols', domain: 5, format: 'mixed', count: 6 }),
			random
		);
		expect(plan.totalEntries).toBe(2);
		expect(plan.items.map((item) => item.kind).sort()).toEqual(['fill', 'matching']);
	});

	it('plans a non-empty session for every UI combination', () => {
		const sections = [
			{ section: 'protocols' as const, portFilters: [false] },
			{ section: 'terminology' as const, portFilters: [false, true] }
		];
		for (const { section, portFilters } of sections) {
			for (const portOnly of portFilters) {
				for (const domain of ['all', 1, 2, 3, 4, 5] as const) {
					for (const format of ['matching', 'fill', 'mixed'] as const) {
						const plan = planSession(
							TERMINOLOGY_BANK,
							config({ section, domain, portOnly, format, count: 6 }),
							random
						);
						expect(
							plan.totalEntries,
							`${section}/${domain}/ports=${portOnly}/${format}`
						).toBeGreaterThan(0);
						if (format === 'matching') {
							expect(plan.items.every((item) => item.kind === 'matching')).toBe(true);
						}
						if (format === 'fill') {
							expect(plan.items.every((item) => item.kind === 'fill')).toBe(true);
						}
						if (format === 'mixed') {
							expect(new Set(plan.items.map((item) => item.kind))).toEqual(
								new Set(['matching', 'fill'])
							);
						}
					}
				}
			}
		}
	});

	it('applies domain and port filters before planning', () => {
		const domainFivePorts = planSession(
			TERMINOLOGY_BANK,
			config({ domain: 5, portOnly: true, count: 100 }),
			random
		);
		expect(domainFivePorts.totalEntries).toBe(
			filterEntries(TERMINOLOGY_BANK, {
				section: 'terminology',
				domain: 5,
				portOnly: true
			}).length
		);
		for (const item of domainFivePorts.items) {
			for (const entry of item.entries) {
				expect(entry.category).toBe('port');
				expect(entry.domain).toBe(5);
			}
		}

		const ports = planSession(
			TERMINOLOGY_BANK,
			config({ domain: 'all', portOnly: true, count: 100 }),
			random
		);
		expect(ports.totalEntries).toBe(categories.port);
		for (const item of ports.items) {
			for (const entry of item.entries) expect(entry.category).toBe('port');
		}
	});

	it('caps a session at the filtered pool size', () => {
		const plan = planSession(TERMINOLOGY_BANK, config({ domain: 2, count: 500 }), random);
		expect(plan.totalEntries).toBe(
			filterEntries(TERMINOLOGY_BANK, { section: 'terminology', domain: 2, portOnly: false }).length
		);
	});
});

describe('scoring and missed-item retry', () => {
	const entries = TERMINOLOGY_BANK.slice(0, 4);
	const item = { id: 'match-test', kind: 'matching' as const, entries };

	it('grades matching pairs individually', () => {
		const results = gradeMatching(item, {
			[entries[0].id]: entries[0].id,
			[entries[1].id]: entries[2].id
		});
		expect(results.map((result) => result.correct)).toEqual([true, false, false, false]);
		expect(scoreResults(results)).toEqual({ correct: 1, total: 4, percent: 25 });
	});

	it('returns only missed entries for the retry', () => {
		const results = gradeMatching(item, {
			[entries[0].id]: entries[0].id,
			[entries[1].id]: entries[2].id
		});
		expect(missedEntries(results).map((entry) => entry.id)).toEqual([
			entries[1].id,
			entries[2].id,
			entries[3].id
		]);
	});

	it('retry plans contain exactly the missed entries', () => {
		const missed: TerminologyEntry[] = [entries[1], entries[3]];
		const plan = planRetry(missed, 'fill', () => 0.2);
		expect(
			plan.items
				.flatMap((planItem) => planItem.entries)
				.map((entry) => entry.id)
				.sort()
		).toEqual([entries[1].id, entries[3].id].sort());
	});

	it('scores an empty run safely', () => {
		expect(scoreResults([])).toEqual({ correct: 0, total: 0, percent: 0 });
	});
});
