import { createScopedRepo, DEFAULT_SCOPE, type Scope } from './db';
import { quizRepository } from './db-pg';
import { COURSE_META, effectiveDueDate, toDateKey } from './course';

// ─────────────────────────────────────────────────────────────────────────────
// Course deadline planning + the shared calendar event shape.
//
// This is the neutral half of the calendar feature: it knows the course
// schedule and nothing about any provider. The Google sync and the .ics
// export/import both build on it, so a deadline looks the same everywhere.
// ─────────────────────────────────────────────────────────────────────────────

/** One course deadline as it appears on a calendar. */
export interface PlannedEvent {
	source: string;
	summary: string;
	description: string;
	date: string; // YYYY-MM-DD
}

/** The shape every external calendar event is normalized to for the UI. */
export interface CalendarEventView {
	id: string;
	summary: string;
	calendarName: string;
	allDay: boolean;
	start: string; // YYYY-MM-DD (all-day) or ISO datetime (timed)
	startTime?: string; // human time label for timed events
	end: string;
	htmlLink: string;
	url: string;
}

/**
 * The exam date plus every assignment deadline for a scope, honoring per-scope
 * due-date overrides. Single source of truth for both the Google push and the
 * .ics export — if a deadline moves in the app it moves in both.
 */
export async function planDeadlineEvents(scope: Scope = DEFAULT_SCOPE): Promise<PlannedEvent[]> {
	const repo = createScopedRepo(quizRepository(), scope);
	const examDate = await repo.getExamDate();
	const dueOverrides = await repo.getDueDateOverrides();
	const examName = COURSE_META[scope.courseId]?.examName ?? 'Certification Exam';
	const planned: PlannedEvent[] = [
		{
			source: 'exam',
			summary: examName,
			description: "CompTIA exam day. You've got this!",
			date: examDate
		}
	];
	for (const assignment of await repo.getCourseAssignments()) {
		const due = effectiveDueDate(assignment, examDate, dueOverrides);
		planned.push({
			source: `assignment:${assignment.id}`,
			summary: assignment.title,
			description: `Due before the ${examName.split(' ')[0] ?? 'exam'} (${examDate}). From the ${COURSE_META[scope.courseId]?.title ?? 'Security+'} course app.`,
			date: toDateKey(due)
		});
	}
	return planned;
}
