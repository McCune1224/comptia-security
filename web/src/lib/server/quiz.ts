import crypto from 'node:crypto';
import type { ActiveSessionSummary, Domain, ObjectiveId, PublicQuestion, QuestionResponse, QuizResult, SessionMode, SessionType, SessionView } from '$lib/types';
import { quizRepository, type QuizRepository, type StoredSession } from './db';
import { loadQuestionBank, toPublicQuestion, type QuestionBank, type QuestionDefinition } from './question-bank';
import { scoreQuestion } from './scoring';
import { createCourseService, type CourseService } from './course-service';
import { createReviewService, type ReviewService, type ReviewSource } from './review';

export class QuizServiceError extends Error {
	constructor(public code: 'INVALID_REQUEST' | 'SESSION_NOT_FOUND' | 'ACTIVE_SESSION_EXISTS' | 'SESSION_CLOSED' | 'RESPONSE_LOCKED', message: string, public details?: Record<string, unknown>) { super(message); }
}

export interface QuizService {
	startSession(input: { type: SessionType; mode?: SessionMode; count?: number; domain?: Domain; objective?: ObjectiveId; assignmentId?: string; reviewSource?: ReviewSource }): SessionView;
	getSession(sessionId: string): SessionView | QuizResult;
	getActiveSession(): ActiveSessionSummary | null;
	saveResponse(sessionId: string, questionIndex: number, response: QuestionResponse): { saved: true; feedback?: ReturnType<typeof scoreQuestion> };
	updateSession(sessionId: string, update: { currentIndex?: number; flag?: { questionIndex: number; value: boolean } }): SessionView;
	abandonSession(sessionId: string): void;
	completeSession(sessionId: string): QuizResult;
}

/**
 * Per-course full-exam assembly: one PBQ per domain (distinct kinds) plus a
 * per-domain MCQ quota (incl. the PBQ) summing to 90. Defaults mirror SY0-701.
 */
export interface ExamConfig {
	domains: Domain[];
	quotas: Record<number, number>;
}

export const DEFAULT_EXAM_CONFIG: ExamConfig = {
	domains: [1, 2, 3, 4, 5],
	quotas: { 1: 11, 2: 20, 3: 16, 4: 25, 5: 18 }
};

function shuffle<T>(items: T[], rng: () => number): T[] {
	const result = [...items];
	for (let index = result.length - 1; index > 0; index--) { const selected = Math.floor(rng() * (index + 1)); [result[index], result[selected]] = [result[selected], result[index]]; }
	return result;
}

function presentation(question: QuestionDefinition, rng: () => number): QuestionDefinition {
	const cloned = structuredClone(question) as QuestionDefinition;
	if (cloned.kind === 'single-choice' || cloned.kind === 'multiple-choice') cloned.options = shuffle(cloned.options, rng);
	if (cloned.kind === 'ordering') cloned.items = shuffle(cloned.items, rng);
	if (cloned.kind === 'matching') cloned.targets = shuffle(cloned.targets, rng);
	if (cloned.kind === 'word-bank') cloned.bank = shuffle(cloned.bank, rng);
	if (cloned.kind === 'sort') cloned.items = shuffle(cloned.items, rng);
	if (cloned.kind === 'multi-step') cloned.steps = cloned.steps.map((step) => presentation(step, rng)) as typeof cloned.steps;
	return cloned;
}

function asView(stored: StoredSession): SessionView {
	const questions = stored.questions.map(toPublicQuestion);
	return { sessionId: stored.summary.id, type: stored.summary.type, mode: stored.summary.mode, startedAt: stored.summary.started_at, ...(stored.deadlineAt ? { deadlineAt: stored.deadlineAt } : {}), answeredCount: Object.keys(stored.responses).length, totalQuestions: questions.length, currentIndex: stored.currentIndex, status: stored.summary.status, questions, responses: stored.responses, flaggedQuestionIndexes: stored.flags };
}

function summary(stored: StoredSession): ActiveSessionSummary {
	const view = asView(stored);
	const { status: _status, questions: _questions, responses: _responses, flaggedQuestionIndexes: _flags, ...active } = view;
	return active;
}

function validateResponse(question: QuestionDefinition, response: QuestionResponse): void {
	const distinct = (ids: string[]) => ids.length === new Set(ids).size;
	if ((question.kind === 'single-choice' || question.kind === 'multiple-choice') && response.kind === 'choice') {
		if (response.optionIds.length !== question.selectCount || !distinct(response.optionIds) || !response.optionIds.every((id) => question.options.some((option) => option.id === id))) throw new QuizServiceError('INVALID_REQUEST', 'Choice response does not match the question.');
		return;
	}
	if (question.kind === 'ordering' && response.kind === 'ordering' && response.itemIds.length === question.items.length && distinct(response.itemIds) && response.itemIds.every((id) => question.items.some((item) => item.id === id))) return;
	if (question.kind === 'matching' && response.kind === 'matching' && Object.keys(response.matches).length === question.premises.length && question.premises.every((premise) => { const matchId = response.matches[premise.id]; return question.targets.some((target) => target.id === matchId) || (question.extraTargets?.some((extra) => extra.id === matchId) ?? false); }) && distinct(Object.values(response.matches))) return;
	if (question.kind === 'numeric' && response.kind === 'numeric' && Number.isFinite(response.value)) return;
	if (question.kind === 'evidence' && response.kind === 'evidence' && response.lineIds.length === question.selectCount && distinct(response.lineIds) && response.lineIds.every((id) => question.artifact.lines.some((line) => line.id === id))) return;
	if (question.kind === 'configuration' && response.kind === 'configuration' && Object.keys(response.values).length === question.fields.length && question.fields.every((field) => field.options.some((option) => option.id === response.values[field.id]))) return;
	if (question.kind === 'fill-blank' && response.kind === 'fill-blank' && Object.keys(response.values).length === question.blanks.length && question.blanks.every((blank) => typeof response.values[blank.id] === 'string')) return;
	if (question.kind === 'word-bank' && response.kind === 'word-bank' && Object.keys(response.assignments).length === question.blanks.length && question.blanks.every((blank) => question.bank.some((word) => word.id === response.assignments[blank.id])) && new Set(Object.values(response.assignments)).size === question.blanks.length) return;
	if (question.kind === 'sort' && response.kind === 'sort' && Object.keys(response.assignments).length === question.items.length && question.items.every((item) => question.buckets.some((bucket) => bucket.id === response.assignments[item.id]))) return;
	if (question.kind === 'multi-step' && response.kind === 'multi-step' && response.stepResponses.length === question.steps.length) {
		for (let i = 0; i < question.steps.length; i++) { validateResponse(question.steps[i], response.stepResponses[i]); }
		return;
	}
	throw new QuizServiceError('INVALID_REQUEST', 'Response does not match the question interaction.');
}

/**
 * Picks one PBQ per domain with pairwise-distinct kinds (the real exam's
 * "five distinct PBQ interactions"), searching in domain order — equivalent to
 * the original nested-loop product for the 5-domain default.
 */
function assemblePbqSet(bank: QuestionBank, domains: Domain[]): QuestionDefinition[] | undefined {
	const pool = domains.map((domain) => bank.pbqs.filter((question) => question.domain === domain));
	if (pool.some((questions) => questions.length === 0)) return undefined;
	const chosen: QuestionDefinition[] = [];
	const usedKinds = new Set<string>();
	const search = (level: number): boolean => {
		if (level === domains.length) return true;
		for (const pbq of pool[level]) {
			if (usedKinds.has(pbq.kind)) continue;
			usedKinds.add(pbq.kind);
			chosen.push(pbq);
			if (search(level + 1)) return true;
			chosen.pop();
			usedKinds.delete(pbq.kind);
		}
		return false;
	};
	return search(0) ? [...chosen] : undefined;
}

export function createQuizService({ repository, bank, rng = Math.random, now = () => new Date(), reviewSvc = createReviewService({ repository, bank }), examConfig = DEFAULT_EXAM_CONFIG, courseSvc = createCourseService({ repository }) }: { repository: QuizRepository; bank: QuestionBank; rng?: () => number; now?: () => Date; reviewSvc?: ReviewService; examConfig?: ExamConfig; courseSvc?: CourseService }): QuizService {
	const expire = (stored: StoredSession): StoredSession => {
		if (stored.summary.status === 'active' && stored.deadlineAt && new Date(stored.deadlineAt) <= now()) { complete(stored); return repository.getSession(stored.summary.id)!; }
		return stored;
	};
	const requireStored = (id: string) => { const stored = repository.getSession(id); if (!stored) throw new QuizServiceError('SESSION_NOT_FOUND', 'Session was not found.'); return expire(stored); };
	const complete = (stored: StoredSession): QuizResult => {
		if (stored.summary.status === 'completed' && stored.result) return stored.result;
		if (stored.summary.status !== 'active') throw new QuizServiceError('SESSION_CLOSED', 'Session is not active.');
		const domainBreakdown = { 1: { earnedPoints: 0, possiblePoints: 0, fullyCorrect: 0, totalQuestions: 0 }, 2: { earnedPoints: 0, possiblePoints: 0, fullyCorrect: 0, totalQuestions: 0 }, 3: { earnedPoints: 0, possiblePoints: 0, fullyCorrect: 0, totalQuestions: 0 }, 4: { earnedPoints: 0, possiblePoints: 0, fullyCorrect: 0, totalQuestions: 0 }, 5: { earnedPoints: 0, possiblePoints: 0, fullyCorrect: 0, totalQuestions: 0 } } as QuizResult['domainBreakdown'];
		const objectiveBreakdown: QuizResult['objectiveBreakdown'] = {};
		const review = stored.questions.map((question, index) => {
			const response = stored.responses[index] ?? null;
			const feedback = scoreQuestion(question, response);
			const domain = domainBreakdown[question.domain]; domain.earnedPoints += feedback.earnedPoints; domain.possiblePoints++; domain.totalQuestions++; if (feedback.fullyCorrect) domain.fullyCorrect++;
			const objective = objectiveBreakdown[question.objective] ?? { earnedPoints: 0, possiblePoints: 0, fullyCorrect: 0, totalQuestions: 0 }; objective.earnedPoints += feedback.earnedPoints; objective.possiblePoints++; objective.totalQuestions++; if (feedback.fullyCorrect) objective.fullyCorrect++; objectiveBreakdown[question.objective] = objective;
			return { question: toPublicQuestion(question), response, feedback };
		});
		const earnedPoints = review.reduce((total, item) => total + item.feedback.earnedPoints, 0);
		const result: QuizResult = { sessionId: stored.summary.id, type: stored.summary.type, mode: stored.summary.mode, earnedPoints, possiblePoints: stored.questions.length, percentage: Math.round(earnedPoints / stored.questions.length * 1000) / 10, fullyCorrect: review.filter((item) => item.feedback.fullyCorrect).length, totalQuestions: stored.questions.length, flaggedQuestionIndexes: stored.flags, domainBreakdown, objectiveBreakdown, completedAt: now().toISOString(), review };
		const finalized = repository.complete(stored.summary.id, result, review.map((item, index) => ({ index, question: stored.questions[index], response: item.response, points: item.feedback.earnedPoints })), result.completedAt);
		if (stored.summary.assignment_id) courseSvc.recordCompletion(stored.summary.assignment_id, stored.summary.id, finalized);
		reviewSvc.recordCompletion(
			stored.questions.map((question, index) => ({ questionId: question.id, points: review[index].feedback.earnedPoints })),
			result.completedAt,
			stored.summary.type
		);
		return finalized;
	};
	return {
		startSession(input) {
			const active = repository.getActiveSession();
			if (active) {
				const current = expire(active);
				if (current.summary.status === 'active') throw new QuizServiceError('ACTIVE_SESSION_EXISTS', 'Resume or abandon the active session first.', { session: summary(current) });
			}
			const mode: SessionMode = input.type === 'full' ? 'exam' : input.mode ?? 'practice';
			if (!['quiz', 'scenario', 'pbq', 'full', 'review'].includes(input.type) || !['practice', 'exam'].includes(mode) || (input.type !== 'quiz' && input.domain !== undefined) || (input.objective !== undefined && (input.type !== 'quiz' || !/^[1-5]\.[1-9]\d?$/.test(input.objective))) || (input.type === 'review' && input.reviewSource !== 'daily' && input.reviewSource !== 'wall')) throw new QuizServiceError('INVALID_REQUEST', 'Invalid session type, mode, or domain.');
			const source = input.type === 'pbq' ? bank.pbqs : input.type === 'scenario' ? bank.mcqs.filter((question) => question.format === 'scenario') : bank.mcqs;
			const count = input.type === 'full' ? 90 : input.count ?? (input.type === 'quiz' ? 20 : input.type === 'scenario' ? 10 : input.type === 'review' ? 10 : 5);
			let selected: QuestionDefinition[];
			if (input.type === 'review') {
				if (count < 1 || count > 20) throw new QuizServiceError('INVALID_REQUEST', 'Review count must be between 1 and 20.');
				selected = reviewSvc.composeQueue({ source: input.reviewSource!, count }, now());
			} else if (input.type === 'full') {
				const pbqs = assemblePbqSet(bank, examConfig.domains);
				if (!pbqs) throw new QuizServiceError('INVALID_REQUEST', `Bank cannot assemble ${examConfig.domains.length} distinct PBQ interactions.`);
				selected = [...pbqs];
				for (const domain of examConfig.domains) selected.push(...shuffle(bank.mcqs.filter((question) => question.domain === domain), rng).slice(0, examConfig.quotas[domain] - 1));
			} else {
				const filtered = source.filter((question) => (!input.domain || question.domain === input.domain) && (!input.objective || question.objective === input.objective));
				const valid = input.type === 'quiz' ? count >= 5 && count <= 50 : input.type === 'scenario' ? count >= 5 && count <= 30 : count >= 1 && (count <= 10 || count === 30);
				if (!valid || count > filtered.length) throw new QuizServiceError('INVALID_REQUEST', 'Requested count is unavailable.', { available: filtered.length });
				selected = shuffle(filtered, rng).slice(0, count);
			}
			selected = shuffle(selected, rng).map((question) => presentation(question, rng));
			const startedAt = now().toISOString(); const deadlineAt = mode === 'exam' ? new Date(now().getTime() + (input.type === 'full' ? 90 : selected.length) * 60_000).toISOString() : null;
			repository.createSession({ id: crypto.randomUUID(), type: input.type, mode, domain: input.domain ?? null, startedAt, deadlineAt, questions: selected, assignmentId: input.assignmentId ?? null });
			return asView(repository.getActiveSession()!);
		},
		getSession(id) { const stored = requireStored(id); return stored.summary.status === 'completed' && stored.result ? stored.result : asView(stored); },
		getActiveSession() { const stored = repository.getActiveSession(); return stored ? summary(expire(stored)) : null; },
		saveResponse(id, questionIndex, response) { const stored = requireStored(id); if (stored.summary.status !== 'active') throw new QuizServiceError('SESSION_CLOSED', 'Session is closed.'); if (!Number.isInteger(questionIndex) || questionIndex < 0 || questionIndex >= stored.questions.length) throw new QuizServiceError('INVALID_REQUEST', 'Question index is out of range.'); if (stored.summary.mode === 'practice' && stored.responses[questionIndex]) throw new QuizServiceError('RESPONSE_LOCKED', 'Practice responses are locked after feedback.'); const question = stored.questions[questionIndex]; validateResponse(question, response); repository.saveResponse(id, questionIndex, response, now().toISOString()); return { saved: true as const, ...(stored.summary.mode === 'practice' ? { feedback: scoreQuestion(question, response) } : {}) }; },
		updateSession(id, update) { const stored = requireStored(id); if (stored.summary.status !== 'active') throw new QuizServiceError('SESSION_CLOSED', 'Session is closed.'); if (update.currentIndex !== undefined && (!Number.isInteger(update.currentIndex) || update.currentIndex < 0 || update.currentIndex >= stored.questions.length)) throw new QuizServiceError('INVALID_REQUEST', 'Question index is out of range.'); if (update.flag && (!Number.isInteger(update.flag.questionIndex) || update.flag.questionIndex < 0 || update.flag.questionIndex >= stored.questions.length)) throw new QuizServiceError('INVALID_REQUEST', 'Question index is out of range.'); repository.updateState(id, update.currentIndex, update.flag, now().toISOString()); return asView(requireStored(id)); },
		abandonSession(id) { const stored = requireStored(id); if (!repository.abandon(id, now().toISOString())) throw new QuizServiceError('SESSION_CLOSED', 'Session is closed.'); },
		completeSession(id) { return complete(requireStored(id)); }
	};
}

export const quizService = createQuizService({ repository: quizRepository, bank: loadQuestionBank() });
