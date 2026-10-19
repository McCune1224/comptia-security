import { describe, expect, it } from 'vitest';
import { createScopedRepo, DEFAULT_SCOPE } from './db';
import { createTestRepository } from './test-db';
import {
	CalendarFileError,
	clearCalendarImport,
	exportDeadlinesIcs,
	getCalendarImport,
	importCalendarIcs
} from './calendar-files';
import { parseIcs } from './ics';

const ICS_HEADER = 'BEGIN:VCALENDAR\r\nVERSION:2.0\r\n';

function eventBlock(uid: string, date: string, summary: string): string {
	return [
		'BEGIN:VEVENT',
		`UID:${uid}`,
		`DTSTART;VALUE=DATE:${date}`,
		`SUMMARY:${summary}`,
		'END:VEVENT'
	].join('\r\n');
}

describe('exportDeadlinesIcs', () => {
	it('exports the exam plus every assignment as parseable all-day events', async () => {
		const repo = await createTestRepository();
		const { ics, filename } = await exportDeadlinesIcs(DEFAULT_SCOPE, 'http://localhost:5173');

		expect(filename).toMatch(/^comptia-security-sy0-701-deadlines-\d{8}\.ics$/);
		const { events, skipped } = parseIcs(ics);
		expect(skipped).toBe(0);
		expect(events).toHaveLength((await repo.getCourseAssignments()).length + 1);
		expect(events.every((event) => event.allDay)).toBe(true);

		const examDate = await repo.getExamDate();
		expect(events.find((event) => event.uid.startsWith('exam@'))?.start).toBe(examDate);
		await repo.close();
	});

	it('gives every event a unique, stable uid and an assignment link', async () => {
		const repo = await createTestRepository();
		const first = await exportDeadlinesIcs(DEFAULT_SCOPE, 'http://localhost:5173');
		const second = await exportDeadlinesIcs(DEFAULT_SCOPE, 'http://localhost:5173');

		const events = parseIcs(first.ics).events;
		expect(new Set(events.map((event) => event.uid)).size).toBe(events.length);
		// Stable uids are what makes a re-import update instead of duplicate.
		expect(parseIcs(second.ics).events.map((event) => event.uid)).toEqual(
			events.map((event) => event.uid)
		);
		expect(events.some((event) => event.url?.includes('/assignments/'))).toBe(true);
		await repo.close();
	});

	it('reflects per-scope due-date overrides', async () => {
		const repo = await createTestRepository();
		const assignment = (await repo.getCourseAssignments())[0];
		const scoped = createScopedRepo(repo, DEFAULT_SCOPE);
		await scoped.setDueDateOverride(assignment.id, '2026-12-24');

		const { ics } = await exportDeadlinesIcs(DEFAULT_SCOPE);
		const event = parseIcs(ics).events.find((item) =>
			item.uid.startsWith(`assignment-${assignment.id}@`)
		);
		expect(event?.start).toBe('2026-12-24');
		await repo.close();
	});
});

describe('importCalendarIcs', () => {
	it('parses, stores and lists an uploaded calendar', async () => {
		const repo = await createTestRepository();
		const ics = `${ICS_HEADER}${eventBlock('a', '20261130', 'Dentist')}\r\n${eventBlock('b', '20261201', 'Class')}\r\nEND:VCALENDAR\r\n`;

		const summary = await importCalendarIcs(DEFAULT_SCOPE, 'proton.ics', ics);
		expect(summary).toMatchObject({ sourceName: 'proton.ics', eventCount: 2, skipped: 0 });

		const status = await getCalendarImport(DEFAULT_SCOPE);
		expect(status).toMatchObject({ imported: true, sourceName: 'proton.ics', eventCount: 2 });
		expect(status.events.map((event) => event.summary)).toEqual(['Dentist', 'Class']);
		expect(status.events[0]).toMatchObject({
			allDay: true,
			start: '2026-11-30',
			calendarName: 'proton.ics'
		});
		await repo.close();
	});

	it('replaces the previous import and drops duplicate uids', async () => {
		const repo = await createTestRepository();
		await importCalendarIcs(
			DEFAULT_SCOPE,
			'first.ics',
			`${ICS_HEADER}${eventBlock('dup', '20261130', 'One')}\r\nEND:VCALENDAR\r\n`
		);
		await importCalendarIcs(
			DEFAULT_SCOPE,
			'second.ics',
			`${ICS_HEADER}${eventBlock('dup', '20261130', 'One')}\r\n${eventBlock('dup', '20261201', 'Two')}\r\nEND:VCALENDAR\r\n`
		);

		const status = await getCalendarImport(DEFAULT_SCOPE);
		expect(status.sourceName).toBe('second.ics');
		expect(status.eventCount).toBe(1);
		await repo.close();
	});

	it('rejects files that are not iCalendar, are empty of events, or are oversized', async () => {
		const repo = await createTestRepository();
		await expect(importCalendarIcs(DEFAULT_SCOPE, 'notes.txt', 'just some text')).rejects.toThrow(
			CalendarFileError
		);
		await expect(
			importCalendarIcs(DEFAULT_SCOPE, 'empty.ics', `${ICS_HEADER}END:VCALENDAR\r\n`)
		).rejects.toThrow(CalendarFileError);
		await expect(
			importCalendarIcs(DEFAULT_SCOPE, 'big.ics', `${ICS_HEADER}${'x'.repeat(5 * 1024 * 1024)}`)
		).rejects.toThrow(CalendarFileError);
		expect(await getCalendarImport(DEFAULT_SCOPE)).toMatchObject({ imported: false, events: [] });
		await repo.close();
	});

	it('clears the import', async () => {
		const repo = await createTestRepository();
		await importCalendarIcs(
			DEFAULT_SCOPE,
			'proton.ics',
			`${ICS_HEADER}${eventBlock('a', '20261130', 'Dentist')}\r\nEND:VCALENDAR\r\n`
		);
		await clearCalendarImport(DEFAULT_SCOPE);
		expect(await getCalendarImport(DEFAULT_SCOPE)).toMatchObject({
			imported: false,
			eventCount: 0
		});
		await repo.close();
	});

	it('keeps imports isolated per profile and course', async () => {
		const repo = await createTestRepository();
		const ash = { profileId: 'ash', courseId: 'aplus-1201' } as const;
		await importCalendarIcs(
			DEFAULT_SCOPE,
			'alex.ics',
			`${ICS_HEADER}${eventBlock('a', '20261130', 'Alex event')}\r\nEND:VCALENDAR\r\n`
		);

		expect(await getCalendarImport(ash)).toMatchObject({ imported: false });
		await importCalendarIcs(
			ash,
			'ash.ics',
			`${ICS_HEADER}${eventBlock('b', '20261205', 'Ash event')}\r\nEND:VCALENDAR\r\n`
		);

		expect((await getCalendarImport(DEFAULT_SCOPE)).sourceName).toBe('alex.ics');
		expect((await getCalendarImport(ash)).sourceName).toBe('ash.ics');
		await repo.close();
	});
});
