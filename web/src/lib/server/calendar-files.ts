import { createScopedRepo, type Scope } from './db';
import { quizRepository } from './db-pg';
import { COURSE_META, toDateKey } from './course';
import { planDeadlineEvents, type CalendarEventView } from './calendar-events';
import { parseIcs, serializeIcs, type IcsEvent } from './ics';

// ─────────────────────────────────────────────────────────────────────────────
// Calendar files: .ics export (hand your deadlines to any calendar app) and
// .ics import (overlay an exported calendar on the course grid).
//
// This is the no-setup path. Google's API needs a Cloud project, a client id
// and a consent screen; an .ics file needs nothing, and Proton Calendar,
// Apple, Thunderbird, Outlook and Google all import one.
// ─────────────────────────────────────────────────────────────────────────────

const UID_DOMAIN = 'study-app.local';

/** Kept well under Proton Calendar's 10 MB import cap. */
export const MAX_IMPORT_BYTES = 4 * 1024 * 1024;

export class CalendarFileError extends Error {
	code: string;
	constructor(code: string, message: string) {
		super(message);
		this.code = code;
	}
}

function slugify(value: string): string {
	return value
		.toLowerCase()
		.replace(/[^a-z0-9]+/g, '-')
		.replace(/^-+|-+$/g, '');
}

function courseTitle(scope: Scope): string {
	return COURSE_META[scope.courseId]?.title ?? 'Course';
}

export function exportFilename(scope: Scope, date = new Date()): string {
	return `${slugify(courseTitle(scope))}-deadlines-${toDateKey(date).replaceAll('-', '')}.ics`;
}

/**
 * A UID that is stable for a given profile + course + deadline, so importing
 * the file again into Proton updates the events instead of duplicating them.
 */
function eventUid(scope: Scope, source: string): string {
	return `${source.replaceAll(':', '-')}@${scope.profileId}.${scope.courseId}.${UID_DOMAIN}`;
}

export interface CalendarExport {
	filename: string;
	ics: string;
}

/** The exam date and every assignment deadline as an all-day .ics calendar. */
export async function exportDeadlinesIcs(scope: Scope, baseUrl?: string): Promise<CalendarExport> {
	const planned = await planDeadlineEvents(scope);
	const events: IcsEvent[] = planned.map((item) => {
		const assignmentId = item.source.startsWith('assignment:')
			? item.source.slice('assignment:'.length)
			: null;
		return {
			uid: eventUid(scope, item.source),
			summary: item.summary,
			description: item.description,
			...(baseUrl && assignmentId ? { url: `${baseUrl}/assignments/${assignmentId}` } : {}),
			allDay: true,
			start: item.date,
			reminders: ['-P1D', '-PT1H']
		};
	});
	return {
		filename: exportFilename(scope),
		ics: serializeIcs(events, { calendarName: `${courseTitle(scope)} Deadlines` })
	};
}

// ── Import ───────────────────────────────────────────────────────────────────

export interface ImportSummary {
	sourceName: string;
	eventCount: number;
	/** VEVENTs dropped because they carried no usable start date. */
	skipped: number;
	importedAt: string;
}

export interface CalendarImportStatus {
	imported: boolean;
	sourceName: string | null;
	eventCount: number;
	importedAt: string | null;
	events: CalendarEventView[];
}

function timeLabel(start: string): string {
	const match = /T(\d{2}):(\d{2})/.exec(start);
	if (!match) return '';
	return new Date(2000, 0, 1, Number(match[1]), Number(match[2])).toLocaleTimeString([], {
		hour: 'numeric',
		minute: '2-digit'
	});
}

function toView(event: IcsEvent, calendarName: string): CalendarEventView {
	return {
		id: event.uid,
		summary: event.summary,
		calendarName,
		allDay: event.allDay,
		start: event.start,
		...(event.allDay ? {} : { startTime: timeLabel(event.start) }),
		end: event.end ?? event.start,
		htmlLink: event.url ?? '',
		url: event.url ?? ''
	};
}

/**
 * Parses and stores an uploaded .ics for a scope, replacing any previous
 * import. Parsing happens here, at the boundary, so nothing downstream has to
 * trust the file.
 */
export async function importCalendarIcs(
	scope: Scope,
	sourceName: string,
	text: string
): Promise<ImportSummary> {
	if (Buffer.byteLength(text, 'utf8') > MAX_IMPORT_BYTES)
		throw new CalendarFileError(
			'FILE_TOO_LARGE',
			`That file is larger than ${Math.round(MAX_IMPORT_BYTES / 1024 / 1024)} MB.`
		);
	if (!/BEGIN:VCALENDAR/i.test(text))
		throw new CalendarFileError(
			'NOT_AN_ICS_FILE',
			'That is not an iCalendar file — export a .ics from your calendar app first.'
		);

	const { events, skipped } = parseIcs(text);
	// Duplicate UIDs would collide as UI keys; the first occurrence wins.
	const unique = [...new Map(events.map((event) => [event.uid, event])).values()];
	if (unique.length === 0)
		throw new CalendarFileError('NO_EVENTS', 'That file has no events with a start date.');

	const importedAt = new Date().toISOString();
	const cleanName = sourceName.trim().slice(0, 120) || 'Imported calendar';
	await createScopedRepo(quizRepository(), scope).saveCalendarImport({
		sourceName: cleanName,
		events: unique,
		importedAt
	});
	return { sourceName: cleanName, eventCount: unique.length, skipped, importedAt };
}

/** The stored import for a scope, already normalized into calendar event views. */
export async function getCalendarImport(scope: Scope): Promise<CalendarImportStatus> {
	const stored = await createScopedRepo(quizRepository(), scope).getCalendarImport();
	if (!stored)
		return {
			imported: false,
			sourceName: null,
			eventCount: 0,
			importedAt: null,
			events: []
		};
	return {
		imported: true,
		sourceName: stored.sourceName,
		eventCount: stored.events.length,
		importedAt: stored.importedAt,
		events: stored.events.map((event) => toView(event, stored.sourceName))
	};
}

export async function clearCalendarImport(scope: Scope): Promise<void> {
	await createScopedRepo(quizRepository(), scope).clearCalendarImport();
}
