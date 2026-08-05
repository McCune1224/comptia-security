export interface Card {
	front: string;
	back: string;
	domain: Domain;
	tags: string[];
}

export type Domain = 1 | 2 | 3 | 4 | 5;

export type ObjectiveId =
	| '1.1'
	| '1.2'
	| '1.3'
	| '1.4'
	| '2.1'
	| '2.2'
	| '2.3'
	| '2.4'
	| '2.5'
	| '3.1'
	| '3.2'
	| '3.3'
	| '3.4'
	| '4.1'
	| '4.2'
	| '4.3'
	| '4.4'
	| '4.5'
	| '4.6'
	| '4.7'
	| '4.8'
	| '4.9'
	| '5.1'
	| '5.2'
	| '5.3'
	| '5.4'
	| '5.5'
	| '5.6';

export type SessionType = 'quiz' | 'scenario' | 'pbq' | 'full' | 'review';
export type SessionMode = 'practice' | 'exam';
export type SessionStatus = 'active' | 'completed' | 'abandoned';
export type QuestionFormat = 'standard' | 'scenario' | 'pbq';

export interface SourceRef {
	source: 'exam-objectives' | 'study-guide' | 'nist' | 'owasp' | 'mitre' | 'comptia' | 'cisa';
	section: string;
}

export interface PublicQuestionBase {
	id: string;
	domain: Domain;
	objective: ObjectiveId;
	format: QuestionFormat;
	prompt: string;
	context?: string;
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
	| PublicEvidenceQuestion
	| PublicConfigurationQuestion
	| PublicFillBlankQuestion
	| PublicWordBankQuestion
	| PublicMultiStepPbqQuestion;

export type QuestionResponse =
	| { kind: 'choice'; optionIds: string[] }
	| { kind: 'ordering'; itemIds: string[] }
	| { kind: 'matching'; matches: Record<string, string> }
	| { kind: 'numeric'; value: number }
	| { kind: 'evidence'; lineIds: string[] }
	| { kind: 'configuration'; values: Record<string, string> }
	| { kind: 'fill-blank'; values: Record<string, string> }
	| { kind: 'word-bank'; assignments: Record<string, string> }
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
