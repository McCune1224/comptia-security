import type { CourseId, QuizResult, SessionType } from '$lib/types';
import type { QuizRepository } from './db';
import {
	COURSE_DEFINITION,
	COURSES,
	COURSE_META,
	assignmentDueDate,
	assignmentStatus,
	computeGradebook,
	computeReadiness,
	daysUntil,
	effectiveDueDate,
	formatDate,
	parseDateKey,
	previewExamDateShift,
	sessionLaunchFor,
	type AssignmentStatus,
	type CourseAssignment,
	type CourseLesson,
	type CourseModule,
	type DueDateOverrides,
	type ExamDateShift,
	type Gradebook,
	type Readiness,
	type SubmissionRecord
} from './course';
import { QuizServiceError } from './quiz';

export interface CourseOverview {
	course: { id: CourseId; title: string; code: string; examName: string };
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
	/** True when an explicit due-date override sets the due date for this scope. */
	overridden: boolean;
	/** What the schedule would derive without the override (equals dueDateLabel when not overridden). */
	derivedDueDateLabel: string;
	daysUntilDue: number;
	status: AssignmentStatus;
	bestSubmission: SubmissionRecord | null;
	launch: ReturnType<typeof sessionLaunchFor>;
}

export interface CourseService {
	getOverview(): Promise<CourseOverview>;
	getSyllabus(): Promise<ModuleView[]>;
	getModule(moduleId: string): Promise<ModuleView | null>;
	getAssignment(assignmentId: string): Promise<AssignmentView | null>;
	getLesson(lessonId: string): Promise<CourseLesson | null>;
	getGradebook(): Promise<Gradebook>;
	getReadiness(): Promise<Readiness>;
	setExamDate(examDate: string): Promise<void>;
	/** How each due date would move if the exam moved to `toExamDate` (no writes). */
	previewExamDate(toExamDate: string): Promise<ExamDateShift[]>;
	setDueDateOverride(assignmentId: string, dueDate: string | null): Promise<void>;
	setLessonCompleted(lessonId: string, completed: boolean): Promise<void>;
	recordCompletion(assignmentId: string, sessionId: string, result: QuizResult): Promise<void>;
}

function buildAssignmentView(
	assignment: CourseAssignment,
	examDate: string,
	submissions: SubmissionRecord[],
	activeAssignmentId: string | null,
	overrides: DueDateOverrides = {}
): AssignmentView {
	const dueDate = effectiveDueDate(assignment, examDate, overrides);
	const bestSubmission =
		submissions
			.filter((s) => s.assignmentId === assignment.id)
			.sort((a, b) => b.percentage - a.percentage)[0] ?? null;
	return {
		assignment,
		dueDate,
		dueDateLabel: formatDate(dueDate),
		overridden: assignment.id in overrides,
		derivedDueDateLabel: formatDate(assignmentDueDate(assignment, examDate)),
		daysUntilDue: daysUntil(dueDate),
		status: assignmentStatus(assignment, examDate, submissions, activeAssignmentId, overrides),
		bestSubmission,
		launch: sessionLaunchFor(assignment)
	};
}

export function createCourseService({
	repository,
	courseId
}: {
	repository: QuizRepository;
	courseId?: CourseId;
}): CourseService {
	// Per-course parameters: readiness math uses the course's domains + exam
	// weights; the gradebook uses the course's category weights. Defaults to
	// the Security+ definition when the course has no registry entry.
	const meta = courseId ? COURSE_META[courseId] : undefined;
	const definition = courseId ? COURSES[courseId] : undefined;
	const readinessDomains = meta?.domains ?? [1, 2, 3, 4, 5];
	const readinessQuotas = (meta?.domainWeights ?? { 1: 12, 2: 22, 3: 18, 4: 28, 5: 20 }) as Record<
		number,
		number
	>;
	const gradeWeights = definition?.gradeWeights ?? COURSE_DEFINITION.gradeWeights;
	const readinessFor = (
		domainProgress: Record<number, { percentage: number; possiblePoints: number }>,
		completedExams: { percentage: number }[]
	): Readiness =>
		computeReadiness(
			domainProgress,
			completedExams,
			definition?.passingScore ?? COURSE_DEFINITION.passingScore,
			definition?.scaleMax ?? COURSE_DEFINITION.scaleMax,
			readinessDomains,
			readinessQuotas
		);

	return {
		async getOverview() {
			const examDate = await repository.getExamDate();
			const modules = await repository.getCourseModules();
			const lessons = await repository.getCourseLessons();
			const assignments = await repository.getCourseAssignments();
			const completions = await repository.getLessonCompletions();
			const submissions = await repository.getSubmissions();
			const activeSession = await repository.getActiveSession();
			const activeAssignmentId = activeSession?.summary.assignment_id ?? null;
			const overrides = await repository.getDueDateOverrides();
			const gradebook = computeGradebook(
				assignments,
				submissions,
				examDate,
				activeAssignmentId,
				gradeWeights,
				overrides
			);
			const domainProgress = await repository.getAllDomainProgress();
			const completedExams = (await repository.getAllCompletedSessions())
				.filter((s) => s.type === 'full' && s.points_possible > 0)
				.map((s) => ({
					percentage: Math.round((s.points_earned / s.points_possible) * 1000) / 10
				}));
			const readiness = readinessFor(domainProgress, completedExams);

			const moduleViews: ModuleView[] = modules.map((module) => {
				const moduleLessons = lessons.filter((l) => l.moduleId === module.id);
				const moduleAssignments = assignments.filter((a) => a.moduleId === module.id);
				const assignmentViews = moduleAssignments.map((a) =>
					buildAssignmentView(a, examDate, submissions, activeAssignmentId, overrides)
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
				course: {
					id: courseId ?? ('secp-701' as CourseId),
					title: meta?.title ?? COURSE_DEFINITION.title,
					code: meta?.code ?? COURSE_DEFINITION.code,
					examName: meta?.examName ?? COURSE_DEFINITION.examName
				},
				examDate,
				examDateLabel: formatDate(examDate),
				daysUntilExam: daysUntil(new Date(`${examDate}T00:00:00`)),
				readiness,
				gradebook,
				modules: moduleViews,
				toDo,
				recentSessions: (await repository.getRecentSessions(5)).map((s) => ({
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
		async getSyllabus() {
			return (await this.getOverview()).modules;
		},
		async getModule(moduleId) {
			return (await this.getOverview()).modules.find((m) => m.module.id === moduleId) ?? null;
		},
		async getAssignment(assignmentId) {
			const overview = await this.getOverview();
			const view = overview.modules
				.flatMap((m) => m.assignments)
				.find((a) => a.assignment.id === assignmentId);
			return view ?? null;
		},
		async getLesson(lessonId) {
			return (await repository.getCourseLessons()).find((l) => l.id === lessonId) ?? null;
		},
		async getGradebook() {
			const examDate = await repository.getExamDate();
			const assignments = await repository.getCourseAssignments();
			const submissions = await repository.getSubmissions();
			const activeAssignmentId =
				(await repository.getActiveSession())?.summary.assignment_id ?? null;
			const overrides = await repository.getDueDateOverrides();
			return computeGradebook(
				assignments,
				submissions,
				examDate,
				activeAssignmentId,
				gradeWeights,
				overrides
			);
		},
		async getReadiness() {
			const domainProgress = await repository.getAllDomainProgress();
			const completedExams = (await repository.getAllCompletedSessions())
				.filter((s) => s.type === 'full' && s.points_possible > 0)
				.map((s) => ({
					percentage: Math.round((s.points_earned / s.points_possible) * 1000) / 10
				}));
			return readinessFor(domainProgress, completedExams);
		},
		async setExamDate(examDate) {
			await repository.setExamDate(examDate);
		},
		async previewExamDate(toExamDate) {
			const [assignments, overrides] = await Promise.all([
				repository.getCourseAssignments(),
				repository.getDueDateOverrides()
			]);
			return previewExamDateShift(
				assignments,
				await repository.getExamDate(),
				toExamDate,
				overrides
			);
		},
		async setDueDateOverride(assignmentId, dueDate) {
			// `null` clears; otherwise a validated calendar date key. Membership is
			// checked against the active course so overrides can't reference foreign ids.
			if (dueDate !== null && parseDateKey(dueDate) === null)
				throw new QuizServiceError('INVALID_REQUEST', 'dueDate must be a real YYYY-MM-DD date.');
			const assignments = await repository.getCourseAssignments();
			if (!assignments.some((a) => a.id === assignmentId))
				throw new QuizServiceError(
					'INVALID_REQUEST',
					`Unknown assignment for this course: ${assignmentId}`
				);
			await repository.setDueDateOverride(assignmentId, dueDate);
		},
		async setLessonCompleted(lessonId, completed) {
			await repository.setLessonCompleted(lessonId, completed);
		},
		async recordCompletion(assignmentId, sessionId, result) {
			await repository.recordSubmission({
				assignmentId,
				sessionId,
				earned: result.earnedPoints,
				percentage: result.percentage,
				completedAt: result.completedAt
			});
		}
	};
}

export type { SessionType };
export { COURSE_DEFINITION };
