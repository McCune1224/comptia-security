import { afterAll, describe, expect, it } from 'vitest';
import fs from 'node:fs';
import { createQuizRepository, type QuizRepository } from './db';
import { createQuizService } from './quiz';
import { createReviewService } from './review';
import { loadAplus1201Bank } from './bank-aplus-1201';
import { loadAplus1202Bank } from './bank-aplus-1202';
import { APLUS_1201_EXAM_CONFIG, APLUS_1202_EXAM_CONFIG } from './aplus-courses';
import { correctResponse, type QuestionBank } from './question-bank';
import type { PublicQuestion, QuestionResponse } from '$lib/types';

const SMOKE_DB = '/tmp/smoke-aplus.db';

function makeService(course: '1201' | '1202') {
	const repository = createQuizRepository(SMOKE_DB);
	const bank: QuestionBank = course === '1201' ? loadAplus1201Bank() : loadAplus1202Bank();
	const reviewSvc = createReviewService({ repository, bank });
	const service = createQuizService({
		repository,
		bank,
		reviewSvc,
		examConfig: course === '1201' ? APLUS_1201_EXAM_CONFIG : APLUS_1202_EXAM_CONFIG
	});
	return { repository, bank, service };
}

function correctAnswer(bank: QuestionBank, question: PublicQuestion): QuestionResponse {
	const definition = [...bank.mcqs, ...bank.pbqs].find((q) => q.id === question.id);
	if (!definition) throw new Error(`question ${question.id} not found in bank`);
	return correctResponse(definition);
}

describe('A+ full-exam smoke (throwaway DB)', () => {
	it('starts, answers, and completes a 90-Q full exam for Core 1 (220-1201)', () => {
		const { repository, bank, service } = makeService('1201');
		const session = service.startSession({ type: 'full' });
		expect(session.totalQuestions).toBe(90);
		expect(session.questions.filter((q) => q.format === 'pbq').length).toBe(5);
		for (let i = 0; i < session.questions.length; i++) {
			service.saveResponse(session.sessionId, i, correctAnswer(bank, session.questions[i]));
		}
		const result = service.completeSession(session.sessionId);
		expect(result.totalQuestions).toBe(90);
		expect(result.fullyCorrect).toBe(90);
		expect(result.percentage).toBe(100);
		repository.close();
	});

	it('starts, answers, and completes a 90-Q full exam for Core 2 (220-1202)', () => {
		const { repository, bank, service } = makeService('1202');
		const session = service.startSession({ type: 'full' });
		expect(session.totalQuestions).toBe(90);
		expect(session.questions.filter((q) => q.format === 'pbq').length).toBe(4);
		for (let i = 0; i < session.questions.length; i++) {
			service.saveResponse(session.sessionId, i, correctAnswer(bank, session.questions[i]));
		}
		const result = service.completeSession(session.sessionId);
		expect(result.totalQuestions).toBe(90);
		expect(result.fullyCorrect).toBe(90);
		expect(result.percentage).toBe(100);
		repository.close();
	});

	afterAll(() => {
		for (const suffix of ['', '-wal', '-shm']) {
			const file = SMOKE_DB + suffix;
			if (fs.existsSync(file)) fs.unlinkSync(file);
		}
	});
});
