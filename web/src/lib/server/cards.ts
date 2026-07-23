import fs from 'node:fs';
import path from 'node:path';
import { parse } from 'csv-parse/sync';
import type { Card, Domain } from '$lib/types';

const VAULT_ROOT = path.resolve(import.meta.dirname, '../../../../');
const CSV_DIR = path.join(VAULT_ROOT, 'anki', 'AI Security+', 'V3');
const DOMAIN_FILES = [
	'1_Definitions_Domain_1_General_Security_Concepts.csv',
	'2_Definitions_Domain_2_Threats_Vulnerabilities_Mitigations.csv',
	'3_Definitions_Domain_3_Security_Architecture.csv',
	'4_Definitions_Domain_4_Security_Operations.csv',
	'5_Definitions_Domain_5_Security_Program_Management_Oversight.csv'
];

function readDefinitionCsv(file: string): Card[] {
	const fullPath = path.join(CSV_DIR, file);
	if (!fs.existsSync(fullPath)) throw new Error(`Definition CSV not found: ${fullPath}`);
	let records: Record<string, string>[];
	try { records = parse(fs.readFileSync(fullPath, 'utf-8'), { columns: true, skip_empty_lines: true, trim: true, relax_column_count: false }) as Record<string, string>[]; }
	catch (error) { throw new Error(`Unable to parse definition CSV ${fullPath}: ${error instanceof Error ? error.message : String(error)}`); }
	return records.map((record, index) => {
		if (Object.keys(record).length !== 3 || !('Front' in record) || !('Back' in record) || !('Tags' in record)) throw new Error(`Invalid definition CSV record ${index + 2} in ${fullPath}: expected Front, Back, Tags`);
		const match = record.Tags.match(/^([1-5])::/);
		if (!match) throw new Error(`Invalid definition CSV tag at ${fullPath}:${index + 2}`);
		if (!record.Front.trim() || !record.Back.trim()) throw new Error(`Empty definition CSV field at ${fullPath}:${index + 2}`);
		return { front: record.Front.trim(), back: record.Back.trim(), domain: Number(match[1]) as Domain, tags: record.Tags.split('::') };
	});
}

let definitionCards: Card[] | null = null;

export function loadDefinitionCards(): Card[] {
	if (!definitionCards) definitionCards = DOMAIN_FILES.flatMap(readDefinitionCsv);
	return definitionCards;
}

export function getCardsByDomain(domain: Domain): Card[] {
	return loadDefinitionCards().filter((card) => card.domain === domain);
}
