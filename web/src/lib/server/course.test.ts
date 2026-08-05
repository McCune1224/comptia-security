import { describe, expect, it } from 'vitest';
import {
	COURSE_DEFINITION,
	assignmentDueDate,
	assignmentStatus,
	computeGradebook,
	computeReadiness,
	defaultExamDate,
	letterForPercentage,
	sessionLaunchFor
} from './course';
import { createCourseService } from './course-service';
import { createQuizRepository } from './db';

describe('CourseDefinition', () => {
	it('has 4 modules, 7 lessons, and 12 assignments covering all categories', () => {
		expect(COURSE_DEFINITION.modules).toHaveLength(4);
		expect(COURSE_DEFINITION.lessons).toHaveLength(7);
		expect(COURSE_DEFINITION.assignments).toHaveLength(12);
		expect(new Set(COURSE_DEFINITION.assignments.map((a) => a.category))).toEqual(
			new Set(['quiz', 'scenario-pbq', 'full'])
		);
		expect(COURSE_DEFINITION.assignments.filter((a) => a.kind === 'full')).toHaveLength(3);
	});

	it('anchors due dates to the exam date via offsets', () => {
		const due = assignmentDueDate(COURSE_DEFINITION.assignments[0], '2026-09-01');
		const local = `${due.getFullYear()}-${String(due.getMonth() + 1).padStart(2, '0')}-${String(due.getDate()).padStart(2, '0')}`;
		expect(local).toBe('2026-08-08'); // -24 days
	});

	it('launches the right session configuration per assignment kind', () => {
		const full = COURSE_DEFINITION.assignments.find((a) => a.kind === 'full')!;
		expect(sessionLaunchFor(full)).toMatchObject({ type: 'full', mode: 'exam', count: 90 });
		const pbq = COURSE_DEFINITION.assignments.find((a) => a.kind === 'pbq')!;
		expect(sessionLaunchFor(pbq).type).toBe('pbq');
		const domainQuiz = COURSE_DEFINITION.assignments.find((a) => a.id === 'a1-1')!;
		expect(sessionLaunchFor(domainQuiz)).toMatchObject({ type: 'quiz', domain: 1, count: 20 });
	});
});

describe('AssignmentStatus', () => {
	// daysUntil() compares against the real current date, so anchor the exam
	// date relative to "today" to keep assertions deterministic.
	function todayISO(): string {
		const now = new Date();
		return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
	}
	function addDays(iso: string, days: number): string {
		const date = new Date(`${iso}T00:00:00`);
		date.setDate(date.getDate() + days);
		return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
	}

	function statusFor(
		id: string,
		examDate: string,
		submissions: { assignmentId: string }[] = [],
		active = null
	) {
		const assignment = COURSE_DEFINITION.assignments.find((a) => a.id === id)!;
		return assignmentStatus(assignment, examDate, submissions as never, active);
	}

	it('marks submitted assignments as submitted', () => {
		expect(statusFor('a1-1', todayISO(), [{ assignmentId: 'a1-1' }])).toBe('submitted');
	});

	it('marks past-due unsubmitted assignments as overdue', () => {
		// Exam 40 days ago → every assignment is due in the past.
		expect(statusFor('a1-1', addDays(todayISO(), -40))).toBe('overdue');
	});

	it('marks assignments due within two days as due-soon and others as open', () => {
		// a4-2 has offset -2; exam in 2 days → due today → due-soon.
		expect(statusFor('a4-2', addDays(todayISO(), 2))).toBe('due-soon');
		// a1-1 has offset -24; exam in 40 days → due 16 days out → open.
		expect(statusFor('a1-1', addDays(todayISO(), 40))).toBe('open');
	});
});

describe('Gradebook', () => {
	it('computes weighted percentage from category weights using best submission per assignment', () => {
		const examDate = '2026-09-01';
		const assignments = COURSE_DEFINITION.assignments;
		// Submit one quiz (20 pts, 100%), one scenario (10 pts, 80%), one full exam (90 pts, 90%).
		const submissions = [
			{
				assignmentId: 'a1-1',
				sessionId: 's1',
				earned: 20,
				percentage: 100,
				completedAt: '2026-08-01'
			},
			{
				assignmentId: 'a3-2',
				sessionId: 's2',
				earned: 8,
				percentage: 80,
				completedAt: '2026-08-02'
			},
			{
				assignmentId: 'a2-4',
				sessionId: 's3',
				earned: 81,
				percentage: 90,
				completedAt: '2026-08-03'
			}
		];
		const gradebook = computeGradebook(assignments, submissions, examDate, null);
		// quiz: 100% (weight .3), scenario-pbq: 80% (weight .2), full: 90% (weight .5)
		expect(gradebook.weightedPercentage).toBe(91);
		expect(gradebook.letterGrade).toBe('A');
		expect(gradebook.categories.find((c) => c.category === 'full')?.percentage).toBe(90);
		expect(gradebook.submittedAssignments).toBe(3);
		expect(gradebook.totalAssignments).toBe(12);
	});

	it('uses the best score when an assignment is retaken', () => {
		const gradebook = computeGradebook(
			COURSE_DEFINITION.assignments,
			[
				{
					assignmentId: 'a1-1',
					sessionId: 's1',
					earned: 10,
					percentage: 50,
					completedAt: '2026-08-01'
				},
				{
					assignmentId: 'a1-1',
					sessionId: 's2',
					earned: 18,
					percentage: 90,
					completedAt: '2026-08-02'
				}
			],
			'2026-09-01',
			null
		);
		const row = gradebook.assignments.find((a) => a.assignment.id === 'a1-1')!;
		expect(row.percentage).toBe(90);
		expect(row.status).toBe('submitted');
	});

	it('returns null weighted percentage before any submissions', () => {
		const gradebook = computeGradebook(COURSE_DEFINITION.assignments, [], '2026-09-01', null);
		expect(gradebook.weightedPercentage).toBeNull();
		expect(gradebook.letterGrade).toBe('—');
	});
});

describe('Readiness', () => {
	it('blends domain mastery and recent full-exam average', () => {
		const readiness = computeReadiness(
			{
				1: { percentage: 80, possiblePoints: 20 },
				2: { percentage: 90, possiblePoints: 20 }
			},
			[{ percentage: 85 }, { percentage: 95 }]
		);
		// domain mastery (weighted by quotas 11/20) ≈ 86.4; exam avg 90 → score ≈ 88
		expect(readiness.score).toBeGreaterThanOrEqual(85);
		expect(readiness.ready).toBe(true);
		expect(readiness.examCount).toBe(2);
	});

	it('projects a scaled score on the 100–900 band', () => {
		const readiness = computeReadiness({ 1: { percentage: 100, possiblePoints: 10 } }, [
			{ percentage: 100 }
		]);
		expect(readiness.passingScale).toBe(900);
		expect(computeReadiness({}, []).passingScale).toBe(100);
	});

	it('labels low scores as not started', () => {
		const readiness = computeReadiness({}, []);
		expect(readiness.score).toBe(0);
		expect(readiness.label).toBe('Not started');
	});
});

describe('LetterGrade', () => {
	it('maps percentages to letters', () => {
		expect(letterForPercentage(95)).toBe('A');
		expect(letterForPercentage(84)).toBe('B');
		expect(letterForPercentage(73)).toBe('C');
		expect(letterForPercentage(62)).toBe('D');
		expect(letterForPercentage(40)).toBe('F');
	});
});

describe('CourseService', () => {
	it('seeds the course and reports an overview with deadlines', () => {
		const repository = createQuizRepository(':memory:');
		const service = createCourseService({ repository });
		const overview = service.getOverview();
		expect(overview.modules).toHaveLength(4);
		expect(overview.toDo.length).toBeGreaterThan(0);
		expect(overview.examDate).toMatch(/^\d{4}-\d{2}-\d{2}$/);
		expect(overview.gradebook.totalAssignments).toBe(12);
		// Default exam date is the end of the current month.
		expect(overview.daysUntilExam).toBeGreaterThanOrEqual(0);
		expect(overview.daysUntilExam).toBeLessThanOrEqual(31);
		repository.close();
	});

	it('reschedules everything when the exam date changes', () => {
		const repository = createQuizRepository(':memory:');
		const service = createCourseService({ repository });
		service.setExamDate('2026-10-15');
		const overview = service.getOverview();
		expect(overview.examDate).toBe('2026-10-15');
		const firstDue = overview.modules[0].assignments[0];
		expect(firstDue.assignment.id).toBe('a1-1');
		expect(firstDue.dueDateLabel).toBe('Sep 21, 2026'); // -24 days
		repository.close();
	});

	it('records submissions and reflects them in the gradebook', () => {
		const repository = createQuizRepository(':memory:');
		const service = createCourseService({ repository });
		const emptyBreakdown = {
			earnedPoints: 0,
			possiblePoints: 0,
			fullyCorrect: 0,
			totalQuestions: 0
		};
		const result = {
			sessionId: 'sess-1',
			type: 'quiz' as const,
			mode: 'practice' as const,
			earnedPoints: 18,
			possiblePoints: 20,
			percentage: 90,
			fullyCorrect: 18,
			totalQuestions: 20,
			flaggedQuestionIndexes: [],
			domainBreakdown: {
				1: emptyBreakdown,
				2: emptyBreakdown,
				3: emptyBreakdown,
				4: emptyBreakdown,
				5: emptyBreakdown
			},
			objectiveBreakdown: {},
			completedAt: '2026-08-01T00:00:00.000Z',
			review: []
		};
		service.recordCompletion('a1-1', 'sess-1', result);
		const gradebook = service.getGradebook();
		expect(gradebook.submittedAssignments).toBe(1);
		const row = gradebook.assignments.find((a) => a.assignment.id === 'a1-1')!;
		expect(row.status).toBe('submitted');
		expect(row.percentage).toBe(90);
		repository.close();
	});

	it('tracks lesson completions', () => {
		const repository = createQuizRepository(':memory:');
		const service = createCourseService({ repository });
		service.setLessonCompleted('lesson-1-1', true);
		const module = service.getModule('week-1');
		expect(module?.lessons.find((l) => l.id === 'lesson-1-1')?.completed).toBe(true);
		expect(module?.lessonsCompleted).toBe(1);
		repository.close();
	});

	it('defaults the exam date to the end of the current month', () => {
		const date = defaultExamDate(new Date('2026-08-01T12:00:00.000Z'));
		expect(date).toBe('2026-08-31');
		expect(defaultExamDate(new Date('2026-12-15T12:00:00.000Z'))).toBe('2026-12-31');
		expect(defaultExamDate(new Date('2027-02-10T12:00:00.000Z'))).toBe('2027-02-28');
	});
});
