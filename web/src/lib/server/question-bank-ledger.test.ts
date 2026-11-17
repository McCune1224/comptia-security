import { readFileSync } from 'node:fs';
import path from 'node:path';
import { describe, expect, it } from 'vitest';
import { loadQuestionBank, SECP701_BANK_SPEC } from './question-bank';

interface LedgerItem {
	id: string;
	verdict: 'rewritten' | 'certified';
	changes: string[];
	sources: string[];
	contextQuality: string;
	hintQuality: string;
	unresolved: boolean;
}

interface Ledger {
	summary: { total: number; rewritten: number; certified: number; unresolved: number };
	items: LedgerItem[];
}

const ledger = JSON.parse(
	readFileSync(path.resolve('question-bank-ledger.json'), 'utf8')
) as Ledger;

describe('question bank audit ledger', () => {
	it('covers every bank item exactly once and leaves nothing unresolved', () => {
		const bank = loadQuestionBank();
		const bankIds = new Set([...bank.mcqs, ...bank.pbqs].map((question) => question.id));
		const ledgerIds = new Set(ledger.items.map((item) => item.id));
		expect(ledger.items).toHaveLength(SECP701_BANK_SPEC.mcqTotal + SECP701_BANK_SPEC.pbqTotal);
		expect(ledgerIds.size).toBe(ledger.items.length);
		expect([...bankIds].filter((id) => !ledgerIds.has(id))).toEqual([]);
		expect([...ledgerIds].filter((id) => !bankIds.has(id))).toEqual([]);
		expect(ledger.items.filter((item) => item.unresolved)).toEqual([]);
	});

	it('records a verdict, sources, and context/hint quality for every row', () => {
		for (const item of ledger.items) {
			expect(['rewritten', 'certified'], item.id).toContain(item.verdict);
			expect(item.sources.length, item.id).toBeGreaterThan(0);
			expect(item.contextQuality, item.id).toMatch(/unique authored scenario/);
			expect(item.hintQuality, item.id).toMatch(/answer-neutral/);
			expect(Array.isArray(item.changes), item.id).toBe(true);
		}
	});

	it('matches the bank totals', () => {
		expect(ledger.summary.total).toBe(SECP701_BANK_SPEC.mcqTotal + SECP701_BANK_SPEC.pbqTotal);
		expect(ledger.summary.rewritten + ledger.summary.certified).toBe(
			SECP701_BANK_SPEC.mcqTotal + SECP701_BANK_SPEC.pbqTotal
		);
		expect(ledger.summary.unresolved).toBe(0);
	});
});
