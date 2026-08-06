import { describe, expect, it } from 'vitest';
import { loadQuestionBank, toPublicQuestion, validateQuestionBank, type CourseBankSpec, type SortDefinition } from './question-bank';

describe('question bank', () => {
	it('rejects malformed sort definitions but accepts well-formed ones', () => {
		const spec: CourseBankSpec = {
			courseId: 'secp-701',
			mcqTotal: 0,
			pbqTotal: 1,
			mcqIdPattern: /^mcq-none$/,
			pbqIdPattern: /^pbq-/,
			domains: [5],
			objectivesByDomain: { 5: ['5.1'] },
			mcqObjectiveTotals: {},
			mcqDomainTotals: { 5: 0 },
			multiTotals: { 5: 0 },
			scenarioTotals: { 5: 0 }
		};
		const base = {
			id: 'pbq-5-999',
			domain: 5 as const,
			objective: '5.1',
			format: 'pbq' as const,
			prompt: 'Classify each security control by type.',
			explanation: 'Controls map to preventive, detective, or corrective categories.',
			sourceRefs: [{ source: 'exam-objectives' as const, section: '5.1' }]
		};
		const items = [
			{ id: 'i1', text: 'Firewall ruleset' },
			{ id: 'i2', text: 'Log review' },
			{ id: 'i3', text: 'Backup restoration' },
			{ id: 'i4', text: 'Vulnerability scan' }
		];
		// Every bucket used -> no distractor bucket -> invalid.
		const noDistractor: SortDefinition = {
			...base,
			kind: 'sort',
			items,
			buckets: [
				{ id: 'b1', label: 'Preventive' },
				{ id: 'b2', label: 'Detective' }
			],
			correctBuckets: { i1: 'b1', i2: 'b2', i3: 'b1', i4: 'b2' }
		};
		expect(() => validateQuestionBank({ mcqs: [], pbqs: [noDistractor] }, spec)).toThrow(/invalid sort/);
		// Item assigned to a bucket that does not exist -> invalid.
		const badBucket: SortDefinition = {
			...base,
			kind: 'sort',
			items,
			buckets: [
				{ id: 'b1', label: 'Preventive' },
				{ id: 'b2', label: 'Detective' },
				{ id: 'b3', label: 'Neither' }
			],
			correctBuckets: { i1: 'b1', i2: 'b2', i3: 'b1', i4: 'zzz' }
		};
		expect(() => validateQuestionBank({ mcqs: [], pbqs: [badBucket] }, spec)).toThrow(/invalid sort/);
		// Well-formed: 4 items, 3 buckets with one distractor.
		const good: SortDefinition = {
			...base,
			kind: 'sort',
			items,
			buckets: [
				{ id: 'b1', label: 'Preventive' },
				{ id: 'b2', label: 'Detective' },
				{ id: 'b3', label: 'Neither' }
			],
			correctBuckets: { i1: 'b1', i2: 'b2', i3: 'b1', i4: 'b2' }
		};
		expect(() => validateQuestionBank({ mcqs: [], pbqs: [good] }, spec)).not.toThrow();
	});

	it('has the required authored allocation and redacts public questions', () => {
		const bank = loadQuestionBank();
		expect(bank.mcqs).toHaveLength(300);
		expect(bank.pbqs).toHaveLength(98);
		expect(bank.mcqs.filter((question) => question.format === 'scenario')).toHaveLength(300);
		expect(new Set([...bank.mcqs, ...bank.pbqs].map((question) => question.id)).size).toBe(398);
		const publicQuestion = toPublicQuestion(bank.mcqs[0]);
		expect(JSON.stringify(publicQuestion)).not.toContain('correctOptionIds');
		expect(JSON.stringify(publicQuestion)).not.toContain('rationale');
		expect(JSON.stringify(publicQuestion)).not.toContain('explanation');
	});
});
