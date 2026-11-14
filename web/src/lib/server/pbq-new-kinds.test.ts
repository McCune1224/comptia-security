import { describe, expect, it } from 'vitest';
import { createTestRepository } from './test-db';
import {
	correctResponse,
	loadQuestionBank,
	toPublicQuestion,
	type CliDefinition,
	type RuleTableDefinition
} from './question-bank';
import { scoreQuestion } from './scoring';
import { hasDraftWork, isDraftComplete } from '$lib/draft-state';
import { createQuizService } from './quiz';

const bank = loadQuestionBank();
const ruleTable = bank.pbqs.find(
	(question): question is RuleTableDefinition => question.kind === 'rule-table'
)!;
const cli = bank.pbqs.find((question): question is CliDefinition => question.kind === 'cli')!;

describe('PBQ format matrix coverage', () => {
	it('keeps every in-scope interaction format drillable', () => {
		const counts = new Map<string, number>();
		for (const question of bank.pbqs)
			counts.set(question.kind, (counts.get(question.kind) ?? 0) + 1);
		// Common formats: at least five drillable items each.
		for (const kind of [
			'matching',
			'ordering',
			'configuration',
			'word-bank',
			'multi-step',
			'evidence',
			'rule-table',
			'cli'
		])
			expect(counts.get(kind) ?? 0, kind).toBeGreaterThanOrEqual(5);
		// Rare formats: at least three drillable items each.
		for (const kind of ['memory', 'hotspot', 'sort', 'slider', 'single-choice', 'multiple-choice'])
			expect(counts.get(kind) ?? 0, kind).toBeGreaterThanOrEqual(3);
		expect(counts.get('memory')).toBe(3);
		expect(counts.get('rule-table')).toBe(5);
		expect(counts.get('cli')).toBe(5);
	});
});

describe('rule-table scoring', () => {
	it('awards full credit for the correct cells and order', () => {
		expect(scoreQuestion(ruleTable, correctResponse(ruleTable)).earnedPoints).toBe(1);
	});

	it('awards partial credit for correct cells with a wrong row order', () => {
		const response = correctResponse(ruleTable);
		if (response.kind !== 'rule-table') throw new Error('expected rule-table response');
		const reversed = { ...response, rowOrder: [...response.rowOrder].reverse() };
		const feedback = scoreQuestion(ruleTable, reversed);
		expect(feedback.earnedPoints).toBeGreaterThan(0);
		expect(feedback.earnedPoints).toBeLessThan(1);
		expect(feedback.fullyCorrect).toBe(false);
	});

	it('awards partial credit for a wrong cell', () => {
		const response = correctResponse(ruleTable);
		if (response.kind !== 'rule-table') throw new Error('expected rule-table response');
		const rowId = ruleTable.rows[0].id;
		const column = ruleTable.columns[0];
		const other = column.options.find(
			(option) => option.id !== ruleTable.correctValues[rowId][column.id]
		)!;
		const wrong = {
			...response,
			values: { ...response.values, [rowId]: { ...response.values[rowId], [column.id]: other.id } }
		};
		const feedback = scoreQuestion(ruleTable, wrong);
		expect(feedback.earnedPoints).toBeGreaterThan(0);
		expect(feedback.earnedPoints).toBeLessThan(1);
	});
});

describe('cli scoring and draft predicates', () => {
	it('normalizes case, spacing, and quote style for typed commands', () => {
		const response = correctResponse(cli);
		if (response.kind !== 'cli') throw new Error('expected cli response');
		const task = cli.tasks[0];
		const spaced = {
			kind: 'cli' as const,
			values: { ...response.values, [task.id]: `  ${task.accepted[0].toUpperCase()}  ` }
		};
		expect(scoreQuestion(cli, spaced).earnedPoints).toBe(1);
	});

	it('scores each typed task independently', () => {
		const response = correctResponse(cli);
		if (response.kind !== 'cli') throw new Error('expected cli response');
		const wrong = {
			kind: 'cli' as const,
			values: { ...response.values, [cli.tasks[0].id]: 'not-a-command' }
		};
		expect(scoreQuestion(cli, wrong).earnedPoints).toBe(
			(cli.tasks.length - 1) / cli.tasks.length
		);
	});

	it('tracks partial rule-table and cli drafts as work but not complete', () => {
		const rulePublic = toPublicQuestion(ruleTable);
		const rulePartial = {
			kind: 'rule-table' as const,
			values: { [ruleTable.rows[0].id]: { [ruleTable.columns[0].id]: 'x' } },
			rowOrder: ruleTable.rows.map((row) => row.id)
		};
		expect(hasDraftWork(rulePublic, rulePartial)).toBe(true);
		expect(isDraftComplete(rulePublic, rulePartial)).toBe(false);

		const cliPublic = toPublicQuestion(cli);
		const cliPartial = { kind: 'cli' as const, values: { [cli.tasks[0].id]: 'draft' } };
		expect(hasDraftWork(cliPublic, cliPartial)).toBe(true);
		expect(isDraftComplete(cliPublic, cliPartial)).toBe(false);
	});
});

describe('low-drain quick rounds', () => {
	it('builds a short practice round with interleaved PBQs and no deadline', async () => {
		const repository = await createTestRepository();
		const service = createQuizService({ repository, bank, rng: () => 0.42 });
		const session = await service.startSession({ type: 'quick', count: 8 });
		expect(session.mode).toBe('practice');
		expect(session.totalQuestions).toBe(8);
		expect(session.deadlineAt).toBeUndefined();
		const pbqs = session.questions.filter((question) => question.format === 'pbq');
		expect(pbqs.length).toBe(3);
		// Interleaved: a PBQ appears before the last third of the round.
		expect(session.questions.findIndex((question) => question.format === 'pbq')).toBeLessThan(3);
		await service.abandonSession(session.sessionId);

		await expect(service.startSession({ type: 'quick', count: 2 })).rejects.toThrow(
			'Low-drain rounds must be between 3 and 15 questions.'
		);
		await expect(service.startSession({ type: 'quick', count: 16 })).rejects.toThrow(
			'Low-drain rounds must be between 3 and 15 questions.'
		);
		await repository.close();
	});
});
