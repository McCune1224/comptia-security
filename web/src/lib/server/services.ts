import type { CourseId, Domain } from '$lib/types';
import { COURSE_META } from './course';
import { createScopedRepo, quizRepository, type QuizRepository, type Scope } from './db';
import { loadQuestionBank, type QuestionBank } from './question-bank';
import { createQuizService, DEFAULT_EXAM_CONFIG, type ExamConfig, type QuizService } from './quiz';
import { createReviewService, type ReviewService } from './review';
import { createCourseService, type CourseService } from './course-service';
import { computeMastery, type MasteryMatrix } from './mastery';

let bank: QuestionBank | null = null;

/** Question bank is course-independent content — load once, share everywhere. */
export function getQuestionBank(): QuestionBank {
	return (bank ??= loadQuestionBank());
}

/**
 * Full-exam assembly config for a course, derived from its exam weights:
 * one PBQ per domain + a per-domain MCQ quota (incl. the PBQ) summing to 90.
 * For SY0-701 this reproduces the canonical 11/20/16/25/18 mix exactly.
 */
export function examConfigFor(courseId: CourseId): ExamConfig {
	const meta = COURSE_META[courseId];
	if (!meta) return DEFAULT_EXAM_CONFIG;
	const totalWeight = meta.domains.reduce((sum, domain) => sum + (meta.domainWeights[domain] ?? 0), 0);
	const quotas: Record<number, number> = {};
	let remaining = 90;
	meta.domains.forEach((domain, index) => {
		const quota =
			index === meta.domains.length - 1
				? remaining
				: Math.round((90 * (meta.domainWeights[domain] ?? 0)) / totalWeight);
		quotas[domain] = quota;
		remaining -= quota;
	});
	// SY0-701 weights PBQs at ~20–30% of the score; A+ courses keep the prior
	// 1-point-per-question model until their PBQ weighting is validated.
	const pbqPoints = courseId === 'secp-701' ? 6 : 1;
	return { domains: [...meta.domains] as Domain[], quotas, pbqPoints };
}

export interface ScopedServices {
	scope: Scope;
	repo: QuizRepository;
	quiz: QuizService;
	review: ReviewService;
	course: CourseService;
	mastery(): MasteryMatrix;
}

/** Services bound to one profile + course, sharing the module singleton connection. */
export function scopedServices(scope: Scope): ScopedServices {
	const repo = createScopedRepo(quizRepository, scope);
	const bank = getQuestionBank();
	const review = createReviewService({ repository: repo, bank });
	const course = createCourseService({ repository: repo, courseId: scope.courseId });
	const quiz = createQuizService({
		repository: repo,
		bank,
		reviewSvc: review,
		courseSvc: course,
		examConfig: examConfigFor(scope.courseId)
	});
	return {
		scope,
		repo,
		quiz,
		review,
		course,
		mastery: () => computeMastery(repo, bank, COURSE_META[scope.courseId]?.objectives)
	};
}
