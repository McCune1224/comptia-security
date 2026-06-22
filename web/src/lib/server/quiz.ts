import crypto from 'node:crypto';
import type { Card, Question, PbqQuestion, QuizAnswer, QuizResult } from '$lib/types';
import { loadDefinitionCards, loadScenarioCards, loadPbqCards, getCardsByDomain } from './cards';
import { pickDistractors } from './distractor';
import { createSession, insertAnswer, completeSession, getSessionResult } from './db';
import { detectSelectCount, toScaledScore } from '$lib/utils';

/** Parse PBQ card back into ordered steps */
function parsePbqSteps(back: string): string[] {
	// Format: "1. Step name - 2. Step name - 3. Step name"
	const parts = back.split('-').map(s => s.trim());
	return parts.map(p => p.replace(/^\d+\.\s*/, '').trim());
}

/** Generate multiple-choice options: correct answer + token-matched distractors */
function generateOptions(card: Card, pool: Card[]): string[] {
	const distractors = pickDistractors(card, pool, 3);
	const options = [card.back, ...distractors];
	// Shuffle
	for (let i = options.length - 1; i > 0; i--) {
		const j = Math.floor(Math.random() * (i + 1));
		[options[i], options[j]] = [options[j], options[i]];
	}
	return options;
}

/** Convert a definition card to a Question */
function cardToQuestion(card: Card, pool: Card[]): Question {
	const hasPipes = card.back.includes('|');
	const sc = hasPipes ? (detectSelectCount(card.front) || card.back.split('|').filter(Boolean).length) : undefined;
	return {
		prompt: card.front,
		correctAnswer: card.back,
		options: generateOptions(card, pool),
		domain: card.domain,
		category: card.tags[1] || 'general',
		type: 'definition',
		selectCount: sc,
	};
}

/** Convert a scenario card to a Question */
function scenarioToQuestion(card: Card, scenarioPool: Card[]): Question {
	const hasPipes = card.back.includes('|');
	const sc = hasPipes ? (detectSelectCount(card.front) || card.back.split('|').filter(Boolean).length) : undefined;
	return {
		prompt: card.front,
		correctAnswer: card.back,
		options: generateOptions(card, scenarioPool),
		domain: card.domain,
		category: card.tags[1] || 'scenario',
		type: 'scenario',
		selectCount: sc,
	};
}

/** Convert a PBQ card to a PbqQuestion */
function pbqToPbqQuestion(card: Card): PbqQuestion {
	const steps = parsePbqSteps(card.back);
	// First step often includes the count — split if numbered
	return {
		prompt: card.front,
		correctSteps: steps,
		domain: card.domain,
		category: card.tags[1] || 'pbq',
	};
}

// ─── Session Management ───

const activeSessions = new Map<string, {
	questions: Question[];
	answers: QuizAnswer[];
	type: string;
	domain: number | null;
	pbqQuestions?: PbqQuestion[];
	pbqAnswers?: { questionIndex: number; steps: string[]; correct: boolean }[];
}>();

export function startDefinitionQuiz(
	count: number,
	domain?: number
): { sessionId: string; questions: Question[] } {
	const pool = domain ? getCardsByDomain(domain) : loadDefinitionCards();
	if (pool.length === 0) throw new Error('No cards available for selected domain');

	// Pick random cards from the pool
	const shuffled = [...pool].sort(() => Math.random() - 0.5);
	const selected = shuffled.slice(0, Math.min(count, shuffled.length));

	// Generate questions with distractors from the same pool
	const questions = selected.map(c => cardToQuestion(c, pool));

	const sessionId = crypto.randomUUID();
	activeSessions.set(sessionId, {
		questions,
		answers: [],
		type: 'quiz',
		domain: domain ?? null,
	});

	createSession(sessionId, 'quiz', domain ?? null);

	return { sessionId, questions };
}

export function startScenarioQuiz(count: number): { sessionId: string; questions: Question[] } {
	const pool = loadScenarioCards();
	const shuffled = [...pool].sort(() => Math.random() - 0.5);
	const selected = shuffled.slice(0, Math.min(count, shuffled.length));

	const questions = selected.map(c => scenarioToQuestion(c, pool));

	const sessionId = crypto.randomUUID();
	activeSessions.set(sessionId, {
		questions,
		answers: [],
		type: 'scenario',
		domain: null,
	});

	createSession(sessionId, 'scenario', null);

	return { sessionId, questions };
}

export function startPbqSession(count: number): { sessionId: string; questions: PbqQuestion[] } {
	const pool = loadPbqCards();
	const shuffled = [...pool].sort(() => Math.random() - 0.5);
	const selected = shuffled.slice(0, Math.min(count, shuffled.length));

	const questions = selected.map(c => pbqToPbqQuestion(c));

	const sessionId = crypto.randomUUID();
	activeSessions.set(sessionId, {
		questions: [],
		answers: [],
		type: 'pbq',
		domain: null,
		pbqQuestions: questions,
		pbqAnswers: [],
	});

	createSession(sessionId, 'pbq', null);

	return { sessionId, questions };
}

export function startFullPracticeExam(): { sessionId: string; questions: Question[] } {
	// 90 max questions in real exam, mix of domains proportional to weights
	const domainWeights: [number, number][] = [
		[1, 12], [2, 22], [3, 18], [4, 28], [5, 20],
	];

	const targetTotal = 90;
	const allCards = loadDefinitionCards();
	const questions: Question[] = [];

	for (const [domain, weight] of domainWeights) {
		const domainCards = allCards.filter(c => c.domain === domain);
		const domainCount = Math.round((weight / 100) * targetTotal);
		const shuffled = [...domainCards].sort(() => Math.random() - 0.5);
		const selected = shuffled.slice(0, Math.min(domainCount, shuffled.length));

		for (const card of selected) {
			questions.push(cardToQuestion(card, allCards));
		}
	}

	// Shuffle all questions
	const shuffledQs = questions.sort(() => Math.random() - 0.5);

	const sessionId = crypto.randomUUID();
	activeSessions.set(sessionId, {
		questions: shuffledQs,
		answers: [],
		type: 'full',
		domain: null,
	});

	createSession(sessionId, 'full', null);

	return { sessionId, questions: shuffledQs };
}

export function submitAnswer(
	sessionId: string,
	questionIndex: number,
	answer: string
): { correct: boolean; correctAnswer: string; isComplete: boolean } {
	const session = activeSessions.get(sessionId);
	if (!session) throw new Error('Session not found');
	if (questionIndex >= session.questions.length) throw new Error('Question index out of range');

	const question = session.questions[questionIndex];
	let correct: boolean;
	if (question.selectCount && question.selectCount > 1) {
		// Multi-select: compare as sets (order-independent)
		const selectedSet = new Set(answer.split(',').map(s => s.trim()).filter(Boolean));
		const correctSet = new Set(question.correctAnswer.split('|').map(s => s.trim()).filter(Boolean));
		correct = selectedSet.size === correctSet.size && [...selectedSet].every(s => correctSet.has(s));
	} else {
		correct = answer === question.correctAnswer;
	}

	const qa: QuizAnswer = {
		questionIndex,
		selected: answer,
		correct,
		domain: question.domain,
	};
	session.answers.push(qa);

	insertAnswer(
		sessionId,
		questionIndex,
		question.prompt,
		question.domain,
		question.category,
		question.correctAnswer,
		answer,
		correct
	);

	const isComplete = session.answers.length >= session.questions.length;

	if (isComplete) {
		const correctCount = session.answers.filter(a => a.correct).length;
		completeSession(sessionId, correctCount, session.questions.length);
	}

	return { correct, correctAnswer: question.correctAnswer, isComplete };
}

export function submitPbqAnswer(
	sessionId: string,
	questionIndex: number,
	steps: string[]
): { correct: boolean; correctSteps: string[]; isComplete: boolean } {
	const session = activeSessions.get(sessionId);
	if (!session) throw new Error('Session not found');
	if (!session.pbqQuestions) throw new Error('Not a PBQ session');
	if (questionIndex >= session.pbqQuestions.length) throw new Error('Question index out of range');

	const question = session.pbqQuestions[questionIndex];
	const correct = steps.length === question.correctSteps.length &&
		steps.every((s, i) => s === question.correctSteps[i]);

	session.pbqAnswers = session.pbqAnswers || [];
	session.pbqAnswers.push({ questionIndex, steps, correct });

	// Persist to DB — serialize steps as JSON
	insertAnswer(
		sessionId,
		questionIndex,
		question.prompt,
		question.domain,
		question.category,
		question.correctSteps.join(' → '),
		steps.join(' → '),
		correct
	);

	const isComplete = session.pbqAnswers.length >= session.pbqQuestions.length;

	if (isComplete) {
		const correctCount = session.pbqAnswers.filter(a => a.correct).length;
		completeSession(sessionId, correctCount, session.pbqQuestions.length);
	}

	return { correct, correctSteps: question.correctSteps, isComplete };
}

export function completePbqSession(sessionId: string): QuizResult | null {
	const session = activeSessions.get(sessionId);
	if (!session || !session.pbqQuestions) {
		const dbResult = getSessionResult(sessionId);
		if (!dbResult) return null;
		const pct = dbResult.total > 0 ? Math.round((dbResult.correct / dbResult.total) * 100) : 0;
		return {
			sessionId,
			score: dbResult.correct,
			total: dbResult.total,
			percentage: pct,
			scaledScore: toScaledScore(pct),
			domainBreakdown: dbResult.domainBreakdown,
			type: dbResult.type,
			completedAt: dbResult.completedAt || new Date().toISOString(),
		};
	}

	const correctCount = (session.pbqAnswers || []).filter(a => a.correct).length;
	const total = session.pbqQuestions.length;
	completeSession(sessionId, correctCount, total);
	activeSessions.delete(sessionId);

	const domainBreakdown: Record<number, { correct: number; total: number }> = {};
	for (const q of session.pbqQuestions) {
		if (!domainBreakdown[q.domain]) domainBreakdown[q.domain] = { correct: 0, total: 0 };
		domainBreakdown[q.domain].total++;
	}
	for (const a of (session.pbqAnswers || [])) {
		const q = session.pbqQuestions[a.questionIndex];
		if (q && a.correct) domainBreakdown[q.domain].correct++;
	}

	const pbqPct = total > 0 ? Math.round((correctCount / total) * 100) : 0;
	return {
		sessionId,
		score: correctCount,
		total,
		percentage: pbqPct,
		scaledScore: toScaledScore(pbqPct),
		domainBreakdown,
		type: 'pbq',
		completedAt: new Date().toISOString(),
	};
}

export function completeQuizSession(sessionId: string): QuizResult | null {
	const session = activeSessions.get(sessionId);
	if (!session) {
		// Session may have been auto-completed already — check DB
		const dbResult = getSessionResult(sessionId);
		if (!dbResult) return null;

		const qPct = dbResult.total > 0 ? Math.round((dbResult.correct / dbResult.total) * 100) : 0;
		return {
			sessionId,
			score: dbResult.correct,
			total: dbResult.total,
			percentage: qPct,
			scaledScore: toScaledScore(qPct),
			domainBreakdown: dbResult.domainBreakdown,
			type: dbResult.type,
			completedAt: dbResult.completedAt || new Date().toISOString(),
		};
	}

	const correctCount = session.answers.filter(a => a.correct).length;
	completeSession(sessionId, correctCount, session.questions.length);
	activeSessions.delete(sessionId);

	const quizPct = session.questions.length > 0
		? Math.round((correctCount / session.questions.length) * 100)
		: 0;
	return {
		sessionId,
		score: correctCount,
		total: session.questions.length,
		percentage: quizPct,
		scaledScore: toScaledScore(quizPct),
		domainBreakdown: calculateDomainBreakdown(session.answers, session.questions),
		type: session.type,
		completedAt: new Date().toISOString(),
	};
}

function calculateDomainBreakdown(
	answers: QuizAnswer[],
	questions: Question[]
): Record<number, { correct: number; total: number }> {
	const breakdown: Record<number, { correct: number; total: number }> = {};
	for (const q of questions) {
		if (!breakdown[q.domain]) breakdown[q.domain] = { correct: 0, total: 0 };
		breakdown[q.domain].total++;
	}
	for (const a of answers) {
		if (breakdown[a.domain] && a.correct) {
			breakdown[a.domain].correct++;
		}
	}
	return breakdown;
}
