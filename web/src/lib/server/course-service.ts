import type { QuizResult, SessionType } from '$lib/types';
import { quizRepository, type QuizRepository } from './db';
import {
	COURSE_DEFINITION,
	assignmentDueDate,
	assignmentStatus,
	computeGradebook,
	computeReadiness,
	daysUntil,
	formatDate,
	sessionLaunchFor,
	type AssignmentStatus,
	type CourseAssignment,
	type CourseLesson,
	type CourseModule,
	type Gradebook,
	type Readiness,
	type SubmissionRecord
} from './course';

export interface CourseOverview {
	examDate: string;
	examDateLabel: string;
	daysUntilExam: number;
	readiness: Readiness;
	gradebook: Gradebook;
	modules: ModuleView[];
	toDo: AssignmentView[];
	recentSessions: { id: string; date: string; type: string; percentage: number }[];
	activeSessionId: string | null;
}

export interface ModuleView {
	module: CourseModule;
	lessons: (CourseLesson & { completed: boolean })[];
	assignments: AssignmentView[];
	lessonsCompleted: number;
	lessonsTotal: number;
	assignmentsSubmitted: number;
	assignmentsTotal: number;
}

export interface AssignmentView {
	assignment: CourseAssignment;
	dueDate: Date;
	dueDateLabel: string;
	daysUntilDue: number;
	status: AssignmentStatus;
	bestSubmission: SubmissionRecord | null;
	launch: ReturnType<typeof sessionLaunchFor>;
}

export interface CourseService {
	getOverview(): CourseOverview;
	getSyllabus(): ModuleView[];
	getModule(moduleId: string): ModuleView | null;
	getAssignment(assignmentId: string): AssignmentView | null;
	getLesson(lessonId: string): CourseLesson | null;
	getGradebook(): Gradebook;
	getReadiness(): Readiness;
	setExamDate(examDate: string): void;
	setLessonCompleted(lessonId: string, completed: boolean): void;
	recordCompletion(assignmentId: string, sessionId: string, result: QuizResult): void;
}

function buildAssignmentView(
	assignment: CourseAssignment,
	examDate: string,
	submissions: SubmissionRecord[],
	activeAssignmentId: string | null
): AssignmentView {
	const dueDate = assignmentDueDate(assignment, examDate);
	const bestSubmission =
		submissions
			.filter((s) => s.assignmentId === assignment.id)
			.sort((a, b) => b.percentage - a.percentage)[0] ?? null;
	return {
		assignment,
		dueDate,
		dueDateLabel: formatDate(dueDate),
		daysUntilDue: daysUntil(dueDate),
		status: assignmentStatus(assignment, examDate, submissions, activeAssignmentId),
		bestSubmission,
		launch: sessionLaunchFor(assignment)
	};
}

export function createCourseService({ repository }: { repository: QuizRepository }): CourseService {
	return {
		getOverview() {
			const examDate = repository.getExamDate();
			const modules = repository.getCourseModules();
			const lessons = repository.getCourseLessons();
			const assignments = repository.getCourseAssignments();
			const completions = repository.getLessonCompletions();
			const submissions = repository.getSubmissions();
			const activeSession = repository.getActiveSession();
			const activeAssignmentId = activeSession?.summary.assignment_id ?? null;
			const gradebook = computeGradebook(assignments, submissions, examDate, activeAssignmentId);
			const domainProgress = repository.getAllDomainProgress();
			const completedExams = repository
				.getAllCompletedSessions()
				.filter((s) => s.type === 'full' && s.points_possible > 0)
				.map((s) => ({
					percentage: Math.round((s.points_earned / s.points_possible) * 1000) / 10
				}));
			const readiness = computeReadiness(domainProgress, completedExams);

			const moduleViews: ModuleView[] = modules.map((module) => {
				const moduleLessons = lessons.filter((l) => l.moduleId === module.id);
				const moduleAssignments = assignments.filter((a) => a.moduleId === module.id);
				const assignmentViews = moduleAssignments.map((a) =>
					buildAssignmentView(a, examDate, submissions, activeAssignmentId)
				);
				return {
					module,
					lessons: moduleLessons.map((l) => ({ ...l, completed: completions.has(l.id) })),
					assignments: assignmentViews,
					lessonsCompleted: moduleLessons.filter((l) => completions.has(l.id)).length,
					lessonsTotal: moduleLessons.length,
					assignmentsSubmitted: assignmentViews.filter((a) => a.status === 'submitted').length,
					assignmentsTotal: moduleAssignments.length
				};
			});

			const allAssignmentViews = moduleViews.flatMap((m) => m.assignments);
			const toDo = allAssignmentViews
				.filter((a) => a.status !== 'submitted')
				.sort((a, b) => a.dueDate.getTime() - b.dueDate.getTime())
				.slice(0, 5);

			return {
				examDate,
				examDateLabel: formatDate(examDate),
				daysUntilExam: daysUntil(new Date(`${examDate}T00:00:00`)),
				readiness,
				gradebook,
				modules: moduleViews,
				toDo,
				recentSessions: repository.getRecentSessions(5).map((s) => ({
					id: s.id,
					date: s.completed_at ?? s.started_at,
					type: s.type,
					percentage: s.points_possible
						? Math.round((s.points_earned / s.points_possible) * 1000) / 10
						: 0
				})),
				activeSessionId: activeSession?.summary.id ?? null
			};
		},
		getSyllabus() {
			return this.getOverview().modules;
		},
		getModule(moduleId) {
			return this.getOverview().modules.find((m) => m.module.id === moduleId) ?? null;
		},
		getAssignment(assignmentId) {
			const overview = this.getOverview();
			const view = overview.modules
				.flatMap((m) => m.assignments)
				.find((a) => a.assignment.id === assignmentId);
			return view ?? null;
		},
		getLesson(lessonId) {
			return repository.getCourseLessons().find((l) => l.id === lessonId) ?? null;
		},
		getGradebook() {
			const examDate = repository.getExamDate();
			const assignments = repository.getCourseAssignments();
			const submissions = repository.getSubmissions();
			const activeAssignmentId = repository.getActiveSession()?.summary.assignment_id ?? null;
			return computeGradebook(assignments, submissions, examDate, activeAssignmentId);
		},
		getReadiness() {
			const domainProgress = repository.getAllDomainProgress();
			const completedExams = repository
				.getAllCompletedSessions()
				.filter((s) => s.type === 'full' && s.points_possible > 0)
				.map((s) => ({
					percentage: Math.round((s.points_earned / s.points_possible) * 1000) / 10
				}));
			return computeReadiness(domainProgress, completedExams);
		},
		setExamDate(examDate) {
			repository.setExamDate(examDate);
		},
		setLessonCompleted(lessonId, completed) {
			repository.setLessonCompleted(lessonId, completed);
		},
		recordCompletion(assignmentId, sessionId, result) {
			repository.recordSubmission({
				assignmentId,
				sessionId,
				earned: result.earnedPoints,
				percentage: result.percentage,
				completedAt: result.completedAt
			});
		}
	};
}

export const courseService = createCourseService({ repository: quizRepository });

export type { SessionType };
export { COURSE_DEFINITION };
