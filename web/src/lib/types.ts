export interface Card {
	front: string;
	back: string;
	domain: Domain;
	tags: string[];
}

export type Domain = 1 | 2 | 3 | 4 | 5;

/** Courses in the app. The A+ worktree registers 'aplus-1201' and 'aplus-1202'. */
export type CourseId = 'secp-701' | 'aplus-1201' | 'aplus-1202';

/**
 * Per-course objective ids. Validity is enforced per course by the bank validator
 * (each course owns its objectives map), not by the TS union.
 */
export type ObjectiveId = string;

/** Per-course metadata — drives mastery grids, readiness math, and UI labels. */
export interface CourseMeta {
	id: CourseId;
	title: string;
	code: string;
	examName: string;
	passingScore: number; // scaled passing score (750 sec+, 675 / 700 A+)
	scaleMax: number; // 900
	domainWeights: Record<number, number>; // domain -> % of exam
	domains: number[]; // domain ids present (A+ Core 2 has only 4)
	objectives: Record<number, ObjectiveId[]>; // domain -> objective ids
}

export type SessionType = 'quiz' | 'scenario' | 'pbq' | 'full' | 'review';
export type SessionMode = 'practice' | 'exam';
export type SessionStatus = 'active' | 'completed' | 'abandoned';
export type QuestionFormat = 'standard' | 'scenario' | 'pbq';

export interface SourceRef {
	source: 'exam-objectives' | 'study-guide' | 'nist' | 'owasp' | 'mitre' | 'comptia' | 'cisa' | 'professor-messer';
	section: string;
}

export interface PublicQuestionBase {
	id: string;
	domain: Domain;
	objective: ObjectiveId;
	format: QuestionFormat;
	prompt: string;
	context?: string;
	/** Optional practice-mode hint; costs 25% of the question's points when revealed. */
	hint?: string;
}

export interface PublicChoiceQuestion extends PublicQuestionBase {
	kind: 'single-choice' | 'multiple-choice';
	options: { id: string; text: string }[];
	selectCount: 1 | 2 | 3;
}

export interface PublicOrderingQuestion extends PublicQuestionBase {
	kind: 'ordering';
	items: { id: string; text: string }[];
}

export interface PublicMatchingQuestion extends PublicQuestionBase {
	kind: 'matching';
	premises: { id: string; text: string }[];
	targets: { id: string; text: string }[];
	extraTargets?: { id: string; text: string }[];
}

export interface PublicNumericQuestion extends PublicQuestionBase {
	kind: 'numeric';
	unit: string;
}

export interface PublicSliderQuestion extends PublicQuestionBase {
	kind: 'slider';
	min: number;
	max: number;
	step: number;
	unit: string;
	/** Acceptance band: |value − correctValue| ≤ tolerance (correctValue stays secret server-side). */
	tolerance: number;
}

export interface PublicEvidenceQuestion extends PublicQuestionBase {
	kind: 'evidence';
	artifact: {
		label: string;
		format: 'log' | 'acl' | 'command-output';
		lines: { id: string; text: string }[];
	};
	selectCount: number;
}

export interface PublicConfigurationQuestion extends PublicQuestionBase {
	kind: 'configuration';
	fields: { id: string; label: string; options: { id: string; text: string }[] }[];
}

export interface PublicFillBlankQuestion extends PublicQuestionBase {
	kind: 'fill-blank';
	/** Blanks in the order they appear in the prompt; each accepts a set of normalized answers. */
	blanks: { id: string; label: string; placeholder: string }[];
}

export interface PublicWordBankQuestion extends PublicQuestionBase {
	kind: 'word-bank';
	/** Blanks in the order they appear in the prompt. */
	blanks: { id: string; label: string }[];
	/** Available words (includes distractors). */
	bank: { id: string; word: string }[];
}

export interface PublicSortQuestion extends PublicQuestionBase {
	kind: 'sort';
	/** Items to classify (shown as tappable chips). */
	items: { id: string; text: string }[];
	/** Labeled buckets to drop items into. */
	buckets: { id: string; label: string }[];
}

export interface PublicHotspotQuestion extends PublicQuestionBase {
	kind: 'hotspot';
	/** Shared diagram template id (see lib/hotspot-templates.ts). */
	template: string;
	/** Tap regions in normalized 0–100 coordinates (no `correct` flag — answer is secret). */
	regions: { id: string; label: string; x1: number; y1: number; x2: number; y2: number }[];
}

export interface PublicMemoryQuestion extends PublicQuestionBase {
	kind: 'memory';
	/** Card pairs; each pair renders as two face-down cards (a-side and b-side). */
	pairs: { id: string; a: string; b: string }[];
}

export interface PublicMultiStepPbqQuestion extends PublicQuestionBase {
	kind: 'multi-step';
	context: string;
	steps: PublicQuestion[];
}

export type PublicQuestion =
	| PublicChoiceQuestion
	| PublicOrderingQuestion
	| PublicMatchingQuestion
	| PublicNumericQuestion
	| PublicSliderQuestion
	| PublicEvidenceQuestion
	| PublicConfigurationQuestion
	| PublicFillBlankQuestion
	| PublicWordBankQuestion
	| PublicSortQuestion
	| PublicHotspotQuestion
	| PublicMemoryQuestion
	| PublicMultiStepPbqQuestion;

export type QuestionResponse =
	| { kind: 'choice'; optionIds: string[] }
	| { kind: 'ordering'; itemIds: string[] }
	| { kind: 'matching'; matches: Record<string, string> }
	| { kind: 'numeric'; value: number }
	| { kind: 'slider'; value: number }
	| { kind: 'evidence'; lineIds: string[] }
	| { kind: 'configuration'; values: Record<string, string> }
	| { kind: 'fill-blank'; values: Record<string, string> }
	| { kind: 'word-bank'; assignments: Record<string, string> }
	| { kind: 'sort'; assignments: Record<string, string> }
	| { kind: 'hotspot'; regionIds: string[] }
	| { kind: 'memory'; matchedPairIds: string[] }
	| { kind: 'multi-step'; stepResponses: QuestionResponse[] };

export interface QuestionFeedback {
	earnedPoints: number;
	possiblePoints: number;
	fullyCorrect: boolean;
	correctResponse: QuestionResponse;
	explanation: string;
	sourceRefs: SourceRef[];
	optionRationales?: Record<string, string>;
	stepFeedback?: QuestionFeedback[];
}

export interface QuestionReview {
	question: PublicQuestion;
	response: QuestionResponse | null;
	feedback: QuestionFeedback;
}

export interface ScoreBreakdown {
	earnedPoints: number;
	possiblePoints: number;
	fullyCorrect: number;
	totalQuestions: number;
}

export interface ActiveSessionSummary {
	sessionId: string;
	type: SessionType;
	mode: SessionMode;
	startedAt: string;
	deadlineAt?: string;
	answeredCount: number;
	totalQuestions: number;
	currentIndex: number;
}

export interface SessionView extends ActiveSessionSummary {
	status: SessionStatus;
	questions: PublicQuestion[];
	responses: Record<number, QuestionResponse>;
	/** Practice-mode retry count per question index (0 = first attempt). */
	retries: Record<number, number>;
	flaggedQuestionIndexes: number[];
}

export interface QuizResult {
	sessionId: string;
	type: SessionType;
	mode: SessionMode;
	earnedPoints: number;
	possiblePoints: number;
	percentage: number;
	fullyCorrect: number;
	totalQuestions: number;
	flaggedQuestionIndexes: number[];
	domainBreakdown: Record<Domain, ScoreBreakdown>;
	objectiveBreakdown: Partial<Record<ObjectiveId, ScoreBreakdown>>;
	completedAt: string;
	review: QuestionReview[];
}
