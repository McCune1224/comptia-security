export interface Card {
	front: string;
	back: string;
	domain: number;
	tags: string[];
}

export interface Question {
	/** The question text (Card.front) */
	prompt: string;
	/** The correct answer (Card.back). For multi-select, pipe-separated: "Answer1|Answer2" */
	correctAnswer: string;
	/** Shuffled options for multiple-choice */
	options: string[];
	/** Domain number 1-5 */
	domain: number;
	/** Category within the domain */
	category: string;
	/** Question type: definition (Q&A), scenario (situational), pbq (ordering) */
	type: 'definition' | 'scenario' | 'pbq';
	/** If set, this is a multi-select question — user must pick exactly this many answers */
	selectCount?: number;
}

export interface PbqQuestion {
	prompt: string;
	/** The steps in correct order */
	correctSteps: string[];
	/** Optional explanation per step */
	explanations?: string[];
	domain: number;
	category: string;
}

export interface QuizSession {
	id: string;
	startedAt: string;
	type: 'quiz' | 'pbq' | 'scenario' | 'full';
	domain: number | null;
	questions: Question[];
	answers: QuizAnswer[];
	completed: boolean;
}

export interface QuizAnswer {
	questionIndex: number;
	/** Comma-joined selections for multi-select, single string for MC */
	selected: string;
	correct: boolean;
	domain: number;
	/** User flagged this question for review */
	flagged?: boolean;
}

export interface QuizResult {
	sessionId: string;
	score: number;
	total: number;
	percentage: number;
	/** Scaled 100-900 score (CompTIA scale, 750 = pass) */
	scaledScore: number;
	domainBreakdown: Record<number, { correct: number; total: number }>;
	type: string;
	completedAt: string;
}
