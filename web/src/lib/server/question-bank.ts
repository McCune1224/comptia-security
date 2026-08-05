import type {
	Domain,
	ObjectiveId,
	PublicQuestion,
	QuestionFormat,
	QuestionResponse,
	SourceRef
} from '$lib/types';
import rawBank from './data/question-bank.json';

export interface DefinitionBase {
	id: string;
	domain: Domain;
	objective: ObjectiveId;
	format: QuestionFormat;
	prompt: string;
	context?: string;
	explanation: string;
	sourceRefs: SourceRef[];
}

export interface ChoiceDefinition extends DefinitionBase {
	kind: 'single-choice' | 'multiple-choice';
	options: { id: string; text: string; rationale: string }[];
	correctOptionIds: string[];
	selectCount: 1 | 2 | 3;
}

export interface OrderingDefinition extends DefinitionBase {
	kind: 'ordering';
	items: { id: string; text: string }[];
	correctOrder: string[];
}

export interface MatchingDefinition extends DefinitionBase {
	kind: 'matching';
	premises: { id: string; text: string }[];
	targets: { id: string; text: string }[];
	extraTargets?: { id: string; text: string }[];
	correctMatches: Record<string, string>;
}

export interface NumericDefinition extends DefinitionBase {
	kind: 'numeric';
	unit: string;
	correctValue: number;
	tolerance: number;
}

export interface EvidenceDefinition extends DefinitionBase {
	kind: 'evidence';
	artifact: { label: string; format: 'log' | 'acl' | 'command-output'; lines: { id: string; text: string }[] };
	selectCount: number;
	correctLineIds: string[];
}

export interface ConfigurationDefinition extends DefinitionBase {
	kind: 'configuration';
	fields: { id: string; label: string; options: { id: string; text: string }[] }[];
	correctValues: Record<string, string>;
}

export interface MultiStepPbqDefinition extends DefinitionBase {
	kind: 'multi-step';
	context: string;
	steps: QuestionDefinition[];
}

export type QuestionDefinition =
	| ChoiceDefinition
	| OrderingDefinition
	| MatchingDefinition
	| NumericDefinition
	| EvidenceDefinition
	| ConfigurationDefinition
	| MultiStepPbqDefinition;

export interface QuestionBank {
	mcqs: ChoiceDefinition[];
	pbqs: QuestionDefinition[];
}

const objectivesByDomain: Record<Domain, ObjectiveId[]> = {
	1: ['1.1', '1.2', '1.3', '1.4'],
	2: ['2.1', '2.2', '2.3', '2.4', '2.5'],
	3: ['3.1', '3.2', '3.3', '3.4'],
	4: ['4.1', '4.2', '4.3', '4.4', '4.5', '4.6', '4.7', '4.8', '4.9'],
	5: ['5.1', '5.2', '5.3', '5.4', '5.5', '5.6']
};

const mcqObjectiveTotals: Record<ObjectiveId, number> = {
	'1.1': 10, '1.2': 10, '1.3': 10, '1.4': 10,
	'2.1': 12, '2.2': 12, '2.3': 12, '2.4': 12, '2.5': 12,
	'3.1': 13, '3.2': 13, '3.3': 13, '3.4': 13,
	'4.1': 8, '4.2': 8, '4.3': 8, '4.4': 8, '4.5': 9, '4.6': 8, '4.7': 8, '4.8': 8, '4.9': 7,
	'5.1': 9, '5.2': 9, '5.3': 9, '5.4': 9, '5.5': 10, '5.6': 10
};

function fail(id: string, message: string): never {
	throw new Error(`Question bank validation failed for ${id}: ${message}`);
}

function hasUniqueIds(items: { id: string }[]): boolean {
	return new Set(items.map((item) => item.id)).size === items.length;
}

export function validateQuestionBank(bank: QuestionBank): void {
	if (bank.mcqs.length !== 280) fail('mcqs', `expected 280 items, found ${bank.mcqs.length}`);
	if (bank.pbqs.length !== 50) fail('pbqs', `expected 50 items, found ${bank.pbqs.length}`);
	const all = [...bank.mcqs, ...bank.pbqs] as QuestionDefinition[];
	if (!hasUniqueIds(all)) fail('bank', 'question IDs must be unique');
	if (new Set(all.map((question) => question.prompt.trim())).size !== all.length) fail('bank', 'prompts must be unique');
	const mcqDomainTotals: Record<Domain, number> = { 1: 40, 2: 60, 3: 52, 4: 72, 5: 56 };
	const multiTotals: Record<Domain, number> = { 1: 4, 2: 9, 3: 6, 4: 9, 5: 6 };
	const scenarioTotals: Record<Domain, number> = { 1: 40, 2: 60, 3: 52, 4: 72, 5: 56 };
	for (const domain of [1, 2, 3, 4, 5] as Domain[]) {
		const mcqs = bank.mcqs.filter((question) => question.domain === domain);
		if (mcqs.length !== mcqDomainTotals[domain]) fail(`mcq-${domain}`, `expected ${mcqDomainTotals[domain]} items`);
		if (mcqs.filter((question) => question.kind === 'multiple-choice').length !== multiTotals[domain]) fail(`mcq-${domain}`, 'invalid multiple-choice count');
		if (mcqs.filter((question) => question.format === 'scenario').length !== scenarioTotals[domain]) fail(`mcq-${domain}`, 'invalid scenario count');
	}
	for (const [objective, expected] of Object.entries(mcqObjectiveTotals) as [ObjectiveId, number][]) {
		if (bank.mcqs.filter((question) => question.objective === objective).length !== expected) fail(objective, `expected ${expected} MCQs`);
	}
	for (const question of all) {
		if (!objectivesByDomain[question.domain].includes(question.objective)) fail(question.id, 'objective does not belong to domain');
		if (!question.id.match(question.format === 'pbq' ? /^pbq-[1-5]-\d{3}$/ : /^mcq-[1-5]-\d{3}$/)) fail(question.id, 'invalid ID or format');
		if (!question.prompt.trim() || !question.explanation.trim() || question.sourceRefs.length === 0) fail(question.id, 'missing authored content or source reference');
		if (question.kind === 'single-choice' || question.kind === 'multiple-choice') {
			if (question.options.length !== (question.kind === 'single-choice' ? 4 : question.options.length) || (question.kind === 'multiple-choice' && ![5, 6].includes(question.options.length))) fail(question.id, 'invalid option count');
			if (!hasUniqueIds(question.options) || question.options.some((option) => !option.text.trim() || !option.rationale.trim())) fail(question.id, 'invalid options');
			if (question.correctOptionIds.length !== question.selectCount || !question.correctOptionIds.every((id) => question.options.some((option) => option.id === id))) fail(question.id, 'invalid correct choice IDs');
		}
		if (question.kind === 'ordering' && (question.items.length < 6 || !hasUniqueIds(question.items) || question.correctOrder.length !== question.items.length || new Set(question.correctOrder).size !== question.items.length || !question.correctOrder.every((id) => question.items.some((item) => item.id === id)))) fail(question.id, 'invalid ordering (need ≥6 items)');
		if (question.kind === 'matching' && (question.premises.length < 5 || !hasUniqueIds(question.premises) || !hasUniqueIds(question.targets) || question.premises.length !== question.targets.length || Object.keys(question.correctMatches).length !== question.premises.length || new Set(Object.values(question.correctMatches)).size !== question.targets.length || !question.extraTargets?.length)) fail(question.id, 'invalid matching (need ≥5 pairs + extraTargets)');
		if (question.kind === 'numeric' && (!Number.isFinite(question.correctValue) || question.tolerance < 0)) fail(question.id, 'invalid numeric response key');
		if (question.kind === 'evidence' && (question.correctLineIds.length !== question.selectCount || new Set(question.correctLineIds).size !== question.selectCount || !question.correctLineIds.every((id) => question.artifact.lines.some((line) => line.id === id)))) fail(question.id, 'invalid evidence response key');
		if (question.kind === 'configuration' && (question.fields.length < 4 || Object.keys(question.correctValues).length !== question.fields.length || question.fields.some((field) => field.options.length < 4 || !question.correctValues[field.id] || !field.options.some((option) => option.id === question.correctValues[field.id])))) fail(question.id, 'invalid configuration (need ≥4 fields, ≥4 options each)');
		if (question.kind === 'multi-step') {
			if (!question.steps || question.steps.length < 2 || question.steps.length > 4) fail(question.id, 'multi-step must have 2-4 steps');
			for (const step of question.steps) {
				if (!step.prompt.trim() || !step.explanation.trim() || !step.kind || !step.sourceRefs?.length) fail(step.id || question.id, 'invalid multi-step child definition');
				if (step.kind === 'single-choice' && (step.options.length !== 4 || !hasUniqueIds(step.options) || step.options.some((o) => !o.text.trim() || !o.rationale.trim()) || step.correctOptionIds.length !== 1)) fail(step.id || question.id, 'invalid child single-choice');
				if (step.kind === 'multiple-choice' && (![5, 6].includes(step.options.length) || !hasUniqueIds(step.options) || step.options.some((o) => !o.text.trim() || !o.rationale.trim()) || step.correctOptionIds.length !== step.selectCount)) fail(step.id || question.id, 'invalid child multiple-choice');
				if (step.kind === 'ordering' && (step.items.length < 6 || step.correctOrder.length !== step.items.length || new Set(step.correctOrder).size !== step.items.length)) fail(step.id || question.id, 'invalid child ordering (need ≥6)');
				if (step.kind === 'matching' && (step.premises.length < 5 || step.premises.length !== step.targets.length || Object.keys(step.correctMatches).length !== step.premises.length || !step.extraTargets?.length)) fail(step.id || question.id, 'invalid child matching (need ≥5 pairs + extraTargets)');
				if (step.kind === 'configuration' && (step.fields.length < 4 || Object.keys(step.correctValues).length !== step.fields.length || step.fields.some((f) => f.options.length < 4 || !step.correctValues[f.id] || !f.options.some((o) => o.id === step.correctValues[f.id])))) fail(step.id || question.id, 'invalid child configuration (need ≥4 fields, ≥4 options each, valid correctValues)');
				if (step.kind === 'evidence' && (step.correctLineIds.length !== step.selectCount || !step.correctLineIds.every((id) => step.artifact.lines.some((l) => l.id === id)))) fail(step.id || question.id, 'invalid child evidence');
				if (step.kind === 'numeric' && (!Number.isFinite(step.correctValue) || step.tolerance < 0)) fail(step.id || question.id, 'invalid child numeric');
			}
		}
	}
}

export function loadQuestionBank(): QuestionBank {
	const bank = rawBank as QuestionBank;
	validateQuestionBank(bank);
	return bank;
}

export function toPublicQuestion(definition: QuestionDefinition): PublicQuestion {
	const base = { id: definition.id, domain: definition.domain, objective: definition.objective, format: definition.format, prompt: definition.prompt, ...(definition.context ? { context: definition.context } : {}) };
	switch (definition.kind) {
		case 'single-choice':
		case 'multiple-choice': return { ...base, kind: definition.kind, options: definition.options.map(({ id, text }) => ({ id, text })), selectCount: definition.selectCount };
		case 'ordering': return { ...base, kind: 'ordering', items: definition.items };
		case 'matching': return { ...base, kind: 'matching', premises: definition.premises, targets: definition.targets, ...(definition.extraTargets ? { extraTargets: definition.extraTargets } : {}) };
		case 'numeric': return { ...base, kind: 'numeric', unit: definition.unit };
		case 'evidence': return { ...base, kind: 'evidence', artifact: definition.artifact, selectCount: definition.selectCount };
		case 'configuration': return { ...base, kind: 'configuration', fields: definition.fields };
		case 'multi-step': return { ...base, kind: 'multi-step', context: definition.context, steps: definition.steps.map(toPublicQuestion) };
	}
}

export function correctResponse(definition: QuestionDefinition): QuestionResponse {
	switch (definition.kind) {
		case 'single-choice': case 'multiple-choice': return { kind: 'choice', optionIds: definition.correctOptionIds };
		case 'ordering': return { kind: 'ordering', itemIds: definition.correctOrder };
		case 'matching': return { kind: 'matching', matches: definition.correctMatches };
		case 'numeric': return { kind: 'numeric', value: definition.correctValue };
		case 'evidence': return { kind: 'evidence', lineIds: definition.correctLineIds };
		case 'configuration': return { kind: 'configuration', values: definition.correctValues };
		case 'multi-step': return { kind: 'multi-step', stepResponses: definition.steps.map(correctResponse) };
	}
}
