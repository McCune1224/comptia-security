import type {
	CourseId,
	Domain,
	ObjectiveId,
	PublicQuestion,
	QuestionFormat,
	QuestionResponse,
	SourceRef
} from '$lib/types';
import rawBank from './data/question-bank.json';
import { hotspotTemplate } from '$lib/hotspot-templates';

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

export interface FillBlankDefinition extends DefinitionBase {
	kind: 'fill-blank';
	/** Blanks in the order they appear in the prompt (mark each with ____ in the prompt text). */
	blanks: { id: string; label: string; placeholder: string; acceptedAnswers: string[] }[];
}

export interface WordBankDefinition extends DefinitionBase {
	kind: 'word-bank';
	/** Blanks in the order they appear in the prompt (mark each with ____ in the prompt text). */
	blanks: { id: string; label: string }[];
	/** Candidate words, including distractors (must contain all correct words + at least one distractor). */
	bank: { id: string; word: string }[];
	/** blankId -> bank word id */
	correctAssignments: Record<string, string>;
}

export interface SortDefinition extends DefinitionBase {
	kind: 'sort';
	/** Items to classify (shown as tappable chips). */
	items: { id: string; text: string }[];
	/** Labeled buckets (must include at least one distractor bucket no item belongs to). */
	buckets: { id: string; label: string }[];
	/** itemId -> bucket id */
	correctBuckets: Record<string, string>;
}

export interface HotspotDefinition extends DefinitionBase {
	kind: 'hotspot';
	/** Shared diagram template id (see lib/hotspot-templates.ts). */
	template: string;
	/** Tap regions in normalized 0–100 coordinates; at least one correct + one distractor. */
	regions: {
		id: string;
		label: string;
		x1: number;
		y1: number;
		x2: number;
		y2: number;
		correct: boolean;
	}[];
}

export interface MemoryDefinition extends DefinitionBase {
	kind: 'memory';
	/** Card pairs; each pair renders as two face-down cards (a-side and b-side). */
	pairs: { id: string; a: string; b: string }[];
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
	| FillBlankDefinition
	| WordBankDefinition
	| SortDefinition
	| HotspotDefinition
	| MemoryDefinition
	| MultiStepPbqDefinition;

export interface QuestionBank {
	mcqs: ChoiceDefinition[];
	pbqs: QuestionDefinition[];
}

export const objectivesByDomain: Record<Domain, ObjectiveId[]> = {
	1: ['1.1', '1.2', '1.3', '1.4'],
	2: ['2.1', '2.2', '2.3', '2.4', '2.5'],
	3: ['3.1', '3.2', '3.3', '3.4'],
	4: ['4.1', '4.2', '4.3', '4.4', '4.5', '4.6', '4.7', '4.8', '4.9'],
	5: ['5.1', '5.2', '5.3', '5.4', '5.5', '5.6']
};

/**
 * Per-course validation constants. Each course bank registers its own spec
 * (locked counts at module load) — see bank-aplus-1201.ts / bank-aplus-1202.ts.
 */
export interface CourseBankSpec {
	courseId: CourseId;
	mcqTotal: number;
	pbqTotal: number;
	mcqIdPattern: RegExp;
	pbqIdPattern: RegExp;
	domains: Domain[];
	objectivesByDomain: Record<number, ObjectiveId[]>;
	mcqObjectiveTotals: Record<ObjectiveId, number>;
	mcqDomainTotals: Record<number, number>;
	/** multiple-choice (multi-select) kind count per domain */
	multiTotals: Record<number, number>;
	/** scenario-format count per domain (all A+ MCQs are scenario) */
	scenarioTotals: Record<number, number>;
	/** optional per-domain PBQ floor (checked when provided) */
	pbqDomainTotals?: Record<number, number>;
}

export const SECP701_BANK_SPEC: CourseBankSpec = {
	courseId: 'secp-701',
	mcqTotal: 300,
	pbqTotal: 98,
	mcqIdPattern: /^mcq-[1-5]-\d{3}$/,
	pbqIdPattern: /^pbq-[1-5]-\d{3}$/,
	domains: [1, 2, 3, 4, 5],
	objectivesByDomain,
	mcqObjectiveTotals: {
		'1.1': 10, '1.2': 12, '1.3': 10, '1.4': 13,
		'2.1': 12, '2.2': 14, '2.3': 12, '2.4': 16, '2.5': 12,
		'3.1': 13, '3.2': 16, '3.3': 13, '3.4': 13,
		'4.1': 8, '4.2': 8, '4.3': 11, '4.4': 8, '4.5': 9, '4.6': 8, '4.7': 8, '4.8': 10, '4.9': 7,
		'5.1': 9, '5.2': 10, '5.3': 9, '5.4': 9, '5.5': 10, '5.6': 10
	},
	mcqDomainTotals: { 1: 45, 2: 66, 3: 55, 4: 77, 5: 57 },
	multiTotals: { 1: 5, 2: 10, 3: 7, 4: 10, 5: 6 },
	scenarioTotals: { 1: 45, 2: 66, 3: 55, 4: 77, 5: 57 }
};

function fail(id: string, message: string): never {
	throw new Error(`Question bank validation failed for ${id}: ${message}`);
}

function hasUniqueIds(items: { id: string }[]): boolean {
	return new Set(items.map((item) => item.id)).size === items.length;
}

function regionsOverlap(
	a: { x1: number; y1: number; x2: number; y2: number },
	b: { x1: number; y1: number; x2: number; y2: number }
): boolean {
	return a.x1 < b.x2 && a.x2 > b.x1 && a.y1 < b.y2 && a.y2 > b.y1;
}

function isValidHotspot(question: HotspotDefinition): boolean {
	const def = hotspotTemplate(question.template);
	if (!def || question.regions.length < def.minRegions || !hasUniqueIds(question.regions)) return false;
	if (def.expectedRegions && question.regions.length !== def.expectedRegions) return false;
	if (question.regions.some((region) =>
		!region.label.trim() ||
		(def.maxLabelLength !== undefined && region.label.length > def.maxLabelLength) ||
		!Number.isFinite(region.x1) || !Number.isFinite(region.y1) || !Number.isFinite(region.x2) || !Number.isFinite(region.y2) ||
		region.x1 < 0 || region.y1 < 0 || region.x2 > 100 || region.y2 > 100 ||
		region.x2 <= region.x1 || region.y2 <= region.y1
	)) return false;
	for (let i = 0; i < question.regions.length; i++) {
		for (let j = i + 1; j < question.regions.length; j++) {
			if (regionsOverlap(question.regions[i], question.regions[j])) return false;
		}
	}
	return question.regions.some((region) => region.correct) && question.regions.some((region) => !region.correct);
}

export function validateQuestionBank(bank: QuestionBank, spec: CourseBankSpec = SECP701_BANK_SPEC): void {
	if (bank.mcqs.length !== spec.mcqTotal) fail('mcqs', `expected ${spec.mcqTotal} items, found ${bank.mcqs.length}`);
	if (bank.pbqs.length !== spec.pbqTotal) fail('pbqs', `expected ${spec.pbqTotal} items, found ${bank.pbqs.length}`);
	const all = [...bank.mcqs, ...bank.pbqs] as QuestionDefinition[];
	if (!hasUniqueIds(all)) fail('bank', 'question IDs must be unique');
	if (new Set(all.map((question) => question.prompt.trim())).size !== all.length) fail('bank', 'prompts must be unique');
	for (const domain of spec.domains) {
		const mcqs = bank.mcqs.filter((question) => question.domain === domain);
		if (mcqs.length !== spec.mcqDomainTotals[domain]) fail(`mcq-${domain}`, `expected ${spec.mcqDomainTotals[domain]} items`);
		if (mcqs.filter((question) => question.kind === 'multiple-choice').length !== spec.multiTotals[domain]) fail(`mcq-${domain}`, 'invalid multiple-choice count');
		if (mcqs.filter((question) => question.format === 'scenario').length !== spec.scenarioTotals[domain]) fail(`mcq-${domain}`, 'invalid scenario count');
	}
	if (spec.pbqDomainTotals) {
		for (const domain of spec.domains) {
			const pbqs = bank.pbqs.filter((question) => question.domain === domain);
			if (pbqs.length !== spec.pbqDomainTotals[domain]) fail(`pbq-${domain}`, `expected ${spec.pbqDomainTotals[domain]} items`);
		}
	}
	for (const [objective, expected] of Object.entries(spec.mcqObjectiveTotals) as [ObjectiveId, number][]) {
		if (bank.mcqs.filter((question) => question.objective === objective).length !== expected) fail(objective, `expected ${expected} MCQs`);
	}
	for (const question of all) {
		if (!spec.objectivesByDomain[question.domain].includes(question.objective)) fail(question.id, 'objective does not belong to domain');
		if (!question.id.match(question.format === 'pbq' ? spec.pbqIdPattern : spec.mcqIdPattern)) fail(question.id, 'invalid ID or format');
		if (!question.prompt.trim() || !question.explanation.trim() || question.sourceRefs.length === 0) fail(question.id, 'missing authored content or source reference');
		if (question.kind === 'fill-blank') fail(question.id, 'fill-blank is deprecated — author word-bank or matching instead');
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
		if (question.kind === 'word-bank' && (question.blanks.length < 2 || !hasUniqueIds(question.blanks) || !hasUniqueIds(question.bank) || question.bank.length < question.blanks.length + 1 || Object.keys(question.correctAssignments).length !== question.blanks.length || question.blanks.some((blank) => !question.correctAssignments[blank.id] || !question.bank.some((word) => word.id === question.correctAssignments[blank.id])) || new Set(Object.values(question.correctAssignments)).size !== question.blanks.length || (question.prompt.match(/____/g)?.length ?? 0) !== question.blanks.length)) fail(question.id, 'invalid word-bank (need ≥2 blanks, bank ≥ blanks+1 with distractors, unique assignments)');
		if (question.kind === 'sort' && (question.items.length < 4 || !hasUniqueIds(question.items) || question.buckets.length < 2 || !hasUniqueIds(question.buckets) || Object.keys(question.correctBuckets).length !== question.items.length || !question.items.every((item) => question.correctBuckets[item.id] && question.buckets.some((bucket) => bucket.id === question.correctBuckets[item.id])) || new Set(Object.values(question.correctBuckets)).size >= question.buckets.length)) fail(question.id, 'invalid sort (need ≥4 items, ≥2 buckets, all items bucketed, at least one distractor bucket)');
		if (question.kind === 'hotspot' && !isValidHotspot(question)) fail(question.id, 'invalid hotspot (need ≥2 non-overlapping regions in 0–100 on a known template, ≥1 correct + ≥1 distractor)');
		if (question.kind === 'memory' && (question.pairs.length < 4 || !hasUniqueIds(question.pairs) || question.pairs.some((pair) => !pair.a.trim() || !pair.b.trim()) || new Set(question.pairs.flatMap((pair) => [pair.a, pair.b])).size !== question.pairs.length * 2)) fail(question.id, 'invalid memory (need ≥4 pairs, unique ids, every card text unique across the board)');
		if (question.kind === 'multi-step') {
			if (!question.steps || question.steps.length < 2 || question.steps.length > 4) fail(question.id, 'multi-step must have 2-4 steps');
			for (const step of question.steps) {
				if (!step.prompt.trim() || !step.explanation.trim() || !step.kind || !step.sourceRefs?.length) fail(step.id || question.id, 'invalid multi-step child definition');
				if (step.kind === 'fill-blank') fail(step.id || question.id, 'fill-blank child steps are deprecated');
				if (step.kind === 'single-choice' && (step.options.length !== 4 || !hasUniqueIds(step.options) || step.options.some((o) => !o.text.trim() || !o.rationale.trim()) || step.correctOptionIds.length !== 1)) fail(step.id || question.id, 'invalid child single-choice');
				if (step.kind === 'multiple-choice' && (![5, 6].includes(step.options.length) || !hasUniqueIds(step.options) || step.options.some((o) => !o.text.trim() || !o.rationale.trim()) || step.correctOptionIds.length !== step.selectCount)) fail(step.id || question.id, 'invalid child multiple-choice');
				if (step.kind === 'ordering' && (step.items.length < 6 || step.correctOrder.length !== step.items.length || new Set(step.correctOrder).size !== step.items.length)) fail(step.id || question.id, 'invalid child ordering (need ≥6)');
				if (step.kind === 'matching' && (step.premises.length < 5 || step.premises.length !== step.targets.length || Object.keys(step.correctMatches).length !== step.premises.length || !step.extraTargets?.length)) fail(step.id || question.id, 'invalid child matching (need ≥5 pairs + extraTargets)');
				if (step.kind === 'configuration' && (step.fields.length < 4 || Object.keys(step.correctValues).length !== step.fields.length || step.fields.some((f) => f.options.length < 4 || !step.correctValues[f.id] || !f.options.some((o) => o.id === step.correctValues[f.id])))) fail(step.id || question.id, 'invalid child configuration (need ≥4 fields, ≥4 options each, valid correctValues)');
				if (step.kind === 'evidence' && (step.correctLineIds.length !== step.selectCount || !step.correctLineIds.every((id) => step.artifact.lines.some((l) => l.id === id)))) fail(step.id || question.id, 'invalid child evidence');
				if (step.kind === 'numeric' && (!Number.isFinite(step.correctValue) || step.tolerance < 0)) fail(step.id || question.id, 'invalid child numeric');
				if (step.kind === 'word-bank' && (step.blanks.length < 2 || !hasUniqueIds(step.blanks) || !hasUniqueIds(step.bank) || step.bank.length < step.blanks.length + 1 || Object.keys(step.correctAssignments).length !== step.blanks.length || new Set(Object.values(step.correctAssignments)).size !== step.blanks.length || (step.prompt.match(/____/g)?.length ?? 0) !== step.blanks.length)) fail(step.id || question.id, 'invalid child word-bank');
				if (step.kind === 'sort' && (step.items.length < 4 || step.buckets.length < 2 || Object.keys(step.correctBuckets).length !== step.items.length || !step.items.every((item) => step.correctBuckets[item.id] && step.buckets.some((bucket) => bucket.id === step.correctBuckets[item.id])) || new Set(Object.values(step.correctBuckets)).size >= step.buckets.length)) fail(step.id || question.id, 'invalid child sort');
				if (step.kind === 'hotspot' && !isValidHotspot(step)) fail(step.id || question.id, 'invalid child hotspot');
				if (step.kind === 'memory' && (step.pairs.length < 4 || !hasUniqueIds(step.pairs) || step.pairs.some((p) => !p.a.trim() || !p.b.trim()) || new Set(step.pairs.flatMap((p) => [p.a, p.b])).size !== step.pairs.length * 2)) fail(step.id || question.id, 'invalid child memory (need ≥4 pairs, unique texts)');
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
		case 'fill-blank': return { ...base, kind: 'fill-blank', blanks: definition.blanks.map(({ id, label, placeholder }) => ({ id, label, placeholder })) };
		case 'word-bank': return { ...base, kind: 'word-bank', blanks: definition.blanks, bank: definition.bank };
		case 'sort': return { ...base, kind: 'sort', items: definition.items, buckets: definition.buckets };
		case 'hotspot': return { ...base, kind: 'hotspot', template: definition.template, regions: definition.regions.map(({ id, label, x1, y1, x2, y2 }) => ({ id, label, x1, y1, x2, y2 })) };
		case 'memory': return { ...base, kind: 'memory', pairs: definition.pairs };
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
		case 'fill-blank': return { kind: 'fill-blank', values: Object.fromEntries(definition.blanks.map((blank) => [blank.id, blank.acceptedAnswers[0]])) };
		case 'word-bank': return { kind: 'word-bank', assignments: definition.correctAssignments };
		case 'sort': return { kind: 'sort', assignments: definition.correctBuckets };
		case 'hotspot': return { kind: 'hotspot', regionIds: definition.regions.filter((region) => region.correct).map((region) => region.id) };
		case 'memory': return { kind: 'memory', matchedPairIds: definition.pairs.map((pair) => pair.id) };
		case 'multi-step': return { kind: 'multi-step', stepResponses: definition.steps.map(correctResponse) };
	}
}
