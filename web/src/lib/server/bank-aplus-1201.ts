import type { Domain, ObjectiveId } from '$lib/types';
import rawBank from './data/aplus-1201-bank.json';
import { validateQuestionBank, type CourseBankSpec, type QuestionBank } from './question-bank';
import { APLUS_1201_OBJECTIVES } from './aplus-meta';

/**
 * CompTIA A+ Core 1 (220-1201) bank — 150 MCQs + 20 PBQs (baseline v1).
 * MCQ quotas proportional to exam weights (13/23/25/11/28%): D1 20, D2 34,
 * D3 38, D4 16, D5 42. All MCQs are scenario-format (real-exam style).
 */
export const APLUS_1201_BANK_SPEC: CourseBankSpec = {
	courseId: 'aplus-1201',
	mcqTotal: 150,
	pbqTotal: 20,
	mcqIdPattern: /^a1-[1-5]-\d{3}$/,
	pbqIdPattern: /^a1-pbq-[1-5]-\d{3}$/,
	domains: [1, 2, 3, 4, 5],
	objectivesByDomain: APLUS_1201_OBJECTIVES,
	mcqObjectiveTotals: {
		'1.1': 7, '1.2': 6, '1.3': 7,
		'2.1': 5, '2.2': 4, '2.3': 4, '2.4': 5, '2.5': 4, '2.6': 4, '2.7': 4, '2.8': 4,
		'3.1': 5, '3.2': 5, '3.3': 5, '3.4': 5, '3.5': 5, '3.6': 4, '3.7': 5, '3.8': 4,
		'4.1': 8, '4.2': 8,
		'5.1': 7, '5.2': 7, '5.3': 7, '5.4': 7, '5.5': 7, '5.6': 7
	},
	mcqDomainTotals: { 1: 20, 2: 34, 3: 38, 4: 16, 5: 42 },
	multiTotals: { 1: 3, 2: 5, 3: 5, 4: 2, 5: 6 },
	scenarioTotals: { 1: 20, 2: 34, 3: 38, 4: 16, 5: 42 },
	pbqDomainTotals: { 1: 3, 2: 5, 3: 4, 4: 2, 5: 6 }
};

export function loadAplus1201Bank(): QuestionBank {
	const bank = rawBank as QuestionBank;
	validateQuestionBank(bank, APLUS_1201_BANK_SPEC);
	return bank;
}
