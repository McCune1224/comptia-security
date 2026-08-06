import type { Domain, ObjectiveId } from '$lib/types';
import rawBank from './data/aplus-1202-bank.json';
import { validateQuestionBank, type CourseBankSpec, type QuestionBank } from './question-bank';
import { APLUS_1202_OBJECTIVES } from './aplus-meta';

/**
 * CompTIA A+ Core 2 (220-1202) bank — 150 MCQs + 20 PBQs (baseline v1).
 * MCQ quotas proportional to exam weights (28/28/23/21%): D1 42, D2 42,
 * D3 34, D4 32. Core 2 has FOUR domains; objective ids reach two digits
 * (1.10, 2.11 …). All MCQs are scenario-format.
 */
export const APLUS_1202_BANK_SPEC: CourseBankSpec = {
	courseId: 'aplus-1202',
	mcqTotal: 150,
	pbqTotal: 28,
	mcqIdPattern: /^a2-[1-4]-\d{3}$/,
	pbqIdPattern: /^a2-pbq-[1-4]-\d{3}$/,
	domains: [1, 2, 3, 4],
	objectivesByDomain: APLUS_1202_OBJECTIVES,
	mcqObjectiveTotals: {
		'1.1': 4, '1.2': 4, '1.3': 4, '1.4': 4, '1.5': 4, '1.6': 4, '1.7': 4, '1.8': 4, '1.9': 4, '1.10': 3, '1.11': 3,
		'2.1': 4, '2.2': 4, '2.3': 4, '2.4': 4, '2.5': 4, '2.6': 4, '2.7': 4, '2.8': 4, '2.9': 4, '2.10': 3, '2.11': 3,
		'3.1': 9, '3.2': 8, '3.3': 8, '3.4': 9,
		'4.1': 3, '4.2': 3, '4.3': 3, '4.4': 3, '4.5': 3, '4.6': 4, '4.7': 3, '4.8': 4, '4.9': 3, '4.10': 3
	},
	mcqDomainTotals: { 1: 42, 2: 42, 3: 34, 4: 32 },
	multiTotals: { 1: 6, 2: 6, 3: 5, 4: 5 },
	scenarioTotals: { 1: 42, 2: 42, 3: 34, 4: 32 },
	pbqDomainTotals: { 1: 7, 2: 9, 3: 6, 4: 6 }
};

export function loadAplus1202Bank(): QuestionBank {
	const bank = rawBank as QuestionBank;
	validateQuestionBank(bank, APLUS_1202_BANK_SPEC);
	return bank;
}
