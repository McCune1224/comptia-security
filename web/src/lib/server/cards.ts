import fs from 'node:fs';
import path from 'node:path';
import type { Card } from '$lib/types';

const VAULT_ROOT = path.resolve(import.meta.dirname, '../../../../');
const CSV_DIR = path.join(VAULT_ROOT, 'anki', 'AI Security+', 'V3');

const DOMAIN_FILES = [
	'1_Definitions_Domain_1_General_Security_Concepts.csv',
	'2_Definitions_Domain_2_Threats_Vulnerabilities_Mitigations.csv',
	'3_Definitions_Domain_3_Security_Architecture.csv',
	'4_Definitions_Domain_4_Security_Operations.csv',
	'5_Definitions_Domain_5_Security_Program_Management_Oversight.csv',
];

const SCENARIO_FILE = '7_Scenario_Practice.csv';
const PBQ_FILE = '8_PBQ_Practice.csv';

/** Parse a CSV line handling quoted fields */
function parseCSVLine(line: string): string[] {
	const fields: string[] = [];
	let current = '';
	let inQuotes = false;

	for (let i = 0; i < line.length; i++) {
		const ch = line[i];
		if (ch === '"') {
			inQuotes = !inQuotes;
		} else if (ch === ',' && !inQuotes) {
			fields.push(current.trim());
			current = '';
		} else {
			current += ch;
		}
	}
	fields.push(current.trim());
	return fields;
}

function parseTagDomain(tags: string): number {
	// Tags look like "1::Definitions" or "PBQ::Networking" or "2::Scenario"
	const match = tags.match(/^(\d+)/);
	return match ? parseInt(match[1], 10) : 0;
}

/** Read and parse a CSV file into Card objects */
function readCSV(filePath: string): Card[] {
	const fullPath = path.join(CSV_DIR, filePath);
	if (!fs.existsSync(fullPath)) {
		console.warn(`[cards] File not found: ${fullPath}`);
		return [];
	}

	const content = fs.readFileSync(fullPath, 'utf-8');
	const lines = content.split('\n').filter(l => l.trim());

	// Skip header row
	const dataLines = lines.slice(1);

	return dataLines.map(line => {
		const [front, back, tags] = parseCSVLine(line);
		return {
			front: (front || '').trim(),
			back: (back || '').trim(),
			domain: parseTagDomain(tags || ''),
			tags: (tags || '').split('::'),
		};
	}).filter(c => c.front && c.back);
}

let _definitionCards: Card[] | null = null;
let _scenarioCards: Card[] | null = null;
let _pbqCards: Card[] | null = null;

export function loadDefinitionCards(): Card[] {
	if (!_definitionCards) {
		_definitionCards = DOMAIN_FILES.flatMap(f => readCSV(f));
		console.log(`[cards] Loaded ${_definitionCards.length} definition cards`);
	}
	return _definitionCards;
}

export function loadScenarioCards(): Card[] {
	if (!_scenarioCards) {
		_scenarioCards = readCSV(SCENARIO_FILE);
		console.log(`[cards] Loaded ${_scenarioCards.length} scenario cards`);
	}
	return _scenarioCards;
}

export function loadPbqCards(): Card[] {
	if (!_pbqCards) {
		_pbqCards = readCSV(PBQ_FILE);
		console.log(`[cards] Loaded ${_pbqCards.length} PBQ cards`);
	}
	return _pbqCards;
}

export function getCardsByDomain(domain: number): Card[] {
	return loadDefinitionCards().filter(c => c.domain === domain);
}

export function getAllCards(): Card[] {
	return [...loadDefinitionCards(), ...loadScenarioCards()];
}
