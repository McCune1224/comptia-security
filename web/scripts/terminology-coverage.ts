import { writeFileSync } from 'node:fs';
import { resolve } from 'node:path';
import {
	OBJECTIVE_ACRONYMS,
	TERMINOLOGY_BANK,
	TERMINOLOGY_FLOORS
} from '../src/lib/terminology-data.ts';

const categories = ['protocol', 'acronym', 'port', 'term'] as const;
const domains = [1, 2, 3, 4, 5] as const;

const countBy = <T extends string | number>(values: readonly T[]) =>
	values.reduce<Record<string, number>>((counts, value) => {
		counts[String(value)] = (counts[String(value)] ?? 0) + 1;
		return counts;
	}, {});

const categoryCounts = countBy(TERMINOLOGY_BANK.map((entry) => entry.category));
const domainCounts = countBy(TERMINOLOGY_BANK.map((entry) => entry.domain));
const sectionCounts = countBy(TERMINOLOGY_BANK.map((entry) => entry.section));
const terms = new Set(TERMINOLOGY_BANK.map((entry) => entry.term.toLowerCase()));
const missingAcronyms = OBJECTIVE_ACRONYMS.filter((acronym) => !terms.has(acronym.toLowerCase()));

const checks: { label: string; floor: string; actual: string; pass: boolean }[] = [
	{
		label: 'Bank size',
		floor: `${TERMINOLOGY_FLOORS.totalMin}–${TERMINOLOGY_FLOORS.totalMax}`,
		actual: String(TERMINOLOGY_BANK.length),
		pass:
			TERMINOLOGY_BANK.length >= TERMINOLOGY_FLOORS.totalMin &&
			TERMINOLOGY_BANK.length <= TERMINOLOGY_FLOORS.totalMax
	},
	{
		label: 'Protocols',
		floor: `≥ ${TERMINOLOGY_FLOORS.protocol}`,
		actual: String(categoryCounts.protocol ?? 0),
		pass: (categoryCounts.protocol ?? 0) >= TERMINOLOGY_FLOORS.protocol
	},
	{
		label: 'Acronyms',
		floor: `≥ ${TERMINOLOGY_FLOORS.acronym}`,
		actual: String(categoryCounts.acronym ?? 0),
		pass: (categoryCounts.acronym ?? 0) >= TERMINOLOGY_FLOORS.acronym
	},
	{
		label: 'Ports',
		floor: `≥ ${TERMINOLOGY_FLOORS.port}`,
		actual: String(categoryCounts.port ?? 0),
		pass: (categoryCounts.port ?? 0) >= TERMINOLOGY_FLOORS.port
	},
	{
		label: 'Named concepts',
		floor: `≥ ${TERMINOLOGY_FLOORS.term}`,
		actual: String(categoryCounts.term ?? 0),
		pass: (categoryCounts.term ?? 0) >= TERMINOLOGY_FLOORS.term
	},
	...domains.map((domain) => ({
		label: `Domain ${domain}`,
		floor: `≥ ${TERMINOLOGY_FLOORS.domain}`,
		actual: String(domainCounts[domain] ?? 0),
		pass: (domainCounts[domain] ?? 0) >= TERMINOLOGY_FLOORS.domain
	})),
	{
		label: 'Objective acronyms',
		floor: '0 missing',
		actual: `${OBJECTIVE_ACRONYMS.length - missingAcronyms.length}/${OBJECTIVE_ACRONYMS.length}`,
		pass: missingAcronyms.length === 0
	}
];

const passed = checks.every((check) => check.pass);
const mark = (value: boolean) => (value ? '✅ PASS' : '❌ FAIL');

const lines = [
	'# SY0-701 terminology coverage',
	'',
	`Generated from \`src/lib/terminology-data.ts\`: **${TERMINOLOGY_BANK.length} entries**.`,
	'',
	`Overall: **${mark(passed)}**`,
	'',
	'## Floors',
	'',
	'| Check | Floor | Actual | Result |',
	'| --- | --- | --- | --- |',
	...checks.map(
		(check) => `| ${check.label} | ${check.floor} | ${check.actual} | ${mark(check.pass)} |`
	),
	'',
	'## Entries by category',
	'',
	'| Category | Count |',
	'| --- | --- |',
	...categories.map((category) => `| ${category} | ${categoryCounts[category] ?? 0} |`),
	'',
	'## Entries by domain',
	'',
	'| Domain | Count | Protocols | Terminology |',
	'| --- | --- | --- | --- |',
	...domains.map((domain) => {
		const inDomain = TERMINOLOGY_BANK.filter((entry) => entry.domain === domain);
		const protocols = inDomain.filter((entry) => entry.category === 'protocol').length;
		return `| ${domain} | ${inDomain.length} | ${protocols} | ${inDomain.length - protocols} |`;
	}),
	'',
	'## Entries by section',
	'',
	'| Section | Count |',
	'| --- | --- |',
	`| Protocols | ${sectionCounts.protocols ?? 0} |`,
	`| Acronyms & Terminology | ${sectionCounts.terminology ?? 0} |`,
	'',
	'## Objective acronym coverage',
	'',
	`${OBJECTIVE_ACRONYMS.length - missingAcronyms.length} of ${OBJECTIVE_ACRONYMS.length} acronyms named in the SY0-701 objectives are drillable.`,
	'',
	missingAcronyms.length
		? `Missing: ${missingAcronyms.join(', ')}`
		: 'Every objective acronym has a matching bank entry.',
	''
];

const output = resolve(process.cwd(), 'TERMINOLOGY-COVERAGE.md');
writeFileSync(output, lines.join('\n'));
console.log(lines.join('\n'));
console.log(`\nWrote ${output}`);
if (!passed) process.exitCode = 1;
