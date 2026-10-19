import { describe, expect, it } from 'vitest';
import {
	compactDateKey,
	dateKeyFromCompact,
	escapeIcsText,
	foldIcsLine,
	parseIcs,
	serializeIcs,
	unescapeIcsText,
	type IcsEvent
} from './ics';

const exam: IcsEvent = {
	uid: 'exam@default.secp-701.study-app.local',
	summary: 'SY0-701 Certification Exam',
	description: "CompTIA exam day. You've got this!",
	allDay: true,
	start: '2026-11-30',
	reminders: ['-P1D', '-PT1H']
};

describe('ics text handling', () => {
	it('escapes and unescapes the RFC 5545 special characters', () => {
		const raw = 'Line one; with, commas\\and\nnewlines';
		const escaped = escapeIcsText(raw);
		expect(escaped).toBe('Line one\\; with\\, commas\\\\and\\nnewlines');
		expect(unescapeIcsText(escaped)).toBe(raw);
	});

	it('does not turn an escaped backslash into a newline', () => {
		expect(unescapeIcsText('a\\\\nb')).toBe('a\\nb');
	});

	it('folds long lines at 75 octets with a leading space on continuations', () => {
		const folded = foldIcsLine(`SUMMARY:${'x'.repeat(200)}`);
		const parts = folded.split('\r\n');
		expect(parts.length).toBeGreaterThan(2);
		expect(parts[0]).toHaveLength(75);
		expect(parts.slice(1).every((part) => part.startsWith(' '))).toBe(true);
	});

	it('never splits a multi-byte character while folding', () => {
		const folded = foldIcsLine(`SUMMARY:${'é'.repeat(80)}`);
		for (const part of folded.split('\r\n')) expect(part).not.toContain('\ufffd');
	});

	it('converts between compact and dashed date keys', () => {
		expect(compactDateKey('2026-11-30')).toBe('20261130');
		expect(dateKeyFromCompact('20261130')).toBe('2026-11-30');
		expect(dateKeyFromCompact('nonsense')).toBeNull();
	});

	it('rejects compact values that are not real calendar dates', () => {
		expect(dateKeyFromCompact('20261332')).toBeNull();
		expect(dateKeyFromCompact('20260230')).toBeNull();
	});
});

describe('serializeIcs', () => {
	const ics = serializeIcs([exam], {
		calendarName: 'CompTIA Security+ Deadlines',
		dtstamp: new Date('2026-10-19T12:00:00Z')
	});

	it('wraps events in a VCALENDAR with the calendar name', () => {
		expect(ics.startsWith('BEGIN:VCALENDAR\r\n')).toBe(true);
		expect(ics.trimEnd().endsWith('END:VCALENDAR')).toBe(true);
		expect(ics).toContain('X-WR-CALNAME:CompTIA Security+ Deadlines');
		expect(ics).toContain('VERSION:2.0');
	});

	it('writes all-day events with an exclusive next-day end', () => {
		expect(ics).toContain('DTSTART;VALUE=DATE:20261130');
		expect(ics).toContain('DTEND;VALUE=DATE:20261201');
	});

	it('writes one VALARM per reminder', () => {
		expect(ics).toContain('TRIGGER:-P1D');
		expect(ics).toContain('TRIGGER:-PT1H');
		expect(ics.match(/BEGIN:VALARM/g)).toHaveLength(2);
	});

	it('uses CRLF line endings throughout', () => {
		expect(ics.replace(/\r\n/g, '')).not.toContain('\n');
	});

	it('escapes special characters in text values', () => {
		const withCommas = serializeIcs([{ ...exam, summary: 'Quiz: a, b; c' }], {
			calendarName: 'x',
			dtstamp: new Date(0)
		});
		expect(withCommas).toContain('SUMMARY:Quiz: a\\, b\\; c');
	});
});

describe('parseIcs', () => {
	it('round-trips what serializeIcs writes', () => {
		const ics = serializeIcs([exam], {
			calendarName: 'Round Trip',
			dtstamp: new Date('2026-10-19T12:00:00Z')
		});
		const { events, skipped } = parseIcs(ics);
		expect(skipped).toBe(0);
		expect(events).toHaveLength(1);
		expect(events[0]).toMatchObject({
			uid: exam.uid,
			summary: exam.summary,
			allDay: true,
			start: '2026-11-30',
			end: '2026-12-01'
		});
	});

	it('parses timed events, UTC and floating', () => {
		const ics = [
			'BEGIN:VCALENDAR',
			'BEGIN:VEVENT',
			'UID:utc-1',
			'DTSTART:20261130T143000Z',
			'DTEND:20261130T153000Z',
			'SUMMARY:Standup',
			'END:VEVENT',
			'BEGIN:VEVENT',
			'UID:local-1',
			'DTSTART;TZID=America/New_York:20261201T090000',
			'SUMMARY:Class',
			'END:VEVENT',
			'END:VCALENDAR'
		].join('\r\n');
		const { events } = parseIcs(ics);
		expect(events[0]).toMatchObject({ allDay: false, start: '2026-11-30T14:30:00Z' });
		expect(events[1]).toMatchObject({ allDay: false, start: '2026-12-01T09:00:00' });
	});

	it('unfolds continuation lines before parsing', () => {
		const ics = [
			'BEGIN:VCALENDAR',
			'BEGIN:VEVENT',
			'UID:fold-1',
			'DTSTART;VALUE=DATE:20261130',
			'SUMMARY:A very long title that was folded across ',
			' two physical lines',
			'END:VEVENT',
			'END:VCALENDAR'
		].join('\r\n');
		const { events } = parseIcs(ics);
		expect(events[0]?.summary).toBe('A very long title that was folded across two physical lines');
	});

	it('skips VEVENTs without a usable start and counts them', () => {
		const ics = [
			'BEGIN:VCALENDAR',
			'BEGIN:VEVENT',
			'UID:no-date',
			'SUMMARY:Undated',
			'END:VEVENT',
			'BEGIN:VEVENT',
			'UID:dated',
			'DTSTART;VALUE=DATE:20261130',
			'END:VEVENT',
			'END:VCALENDAR'
		].join('\r\n');
		const { events, skipped } = parseIcs(ics);
		expect(events).toHaveLength(1);
		expect(events[0]?.uid).toBe('dated');
		expect(skipped).toBe(1);
	});

	it('keeps nested VALARM properties off the event, except TRIGGER', () => {
		const ics = [
			'BEGIN:VCALENDAR',
			'BEGIN:VEVENT',
			'UID:alarm-1',
			'DTSTART;VALUE=DATE:20261130',
			'SUMMARY:Quiz',
			'DESCRIPTION:Event description',
			'BEGIN:VALARM',
			'ACTION:DISPLAY',
			'DESCRIPTION:Alarm description',
			'TRIGGER:-P1D',
			'END:VALARM',
			'END:VEVENT',
			'END:VCALENDAR'
		].join('\r\n');
		const { events } = parseIcs(ics);
		expect(events[0]?.description).toBe('Event description');
		expect(events[0]?.reminders).toEqual(['-P1D']);
	});

	it('skips an event whose DTSTART is not a real date', () => {
		const ics = [
			'BEGIN:VCALENDAR',
			'BEGIN:VEVENT',
			'UID:bad-date',
			'DTSTART;VALUE=DATE:20261332',
			'SUMMARY:Nonsense date',
			'END:VEVENT',
			'END:VCALENDAR'
		].join('\r\n');
		const { events, skipped } = parseIcs(ics);
		expect(events).toHaveLength(0);
		expect(skipped).toBe(1);
	});

	it('caps the number of parsed events', () => {
		const blocks = Array.from({ length: 10 }, (_, index) =>
			['BEGIN:VEVENT', `UID:e-${index}`, 'DTSTART;VALUE=DATE:20261130', 'END:VEVENT'].join('\r\n')
		);
		const ics = ['BEGIN:VCALENDAR', ...blocks, 'END:VCALENDAR'].join('\r\n');
		expect(parseIcs(ics, { maxEvents: 3 }).events).toHaveLength(3);
	});

	it('returns nothing for input that is not a calendar', () => {
		expect(parseIcs('hello, this is not a calendar').events).toHaveLength(0);
	});
});
