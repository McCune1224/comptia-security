/**
 * iCalendar (RFC 5545) serialization and parsing — the format every calendar
 * app speaks (Proton, Apple, Thunderbird, Google, Outlook). Pure and
 * dependency-free so both the export and the import path share one
 * implementation, and so it is testable without a database.
 *
 * Scope: the subset this app needs. VEVENTs only, all-day and timed starts,
 * no recurrence expansion (recurring events from an imported file are kept as
 * their first occurrence so they still show up on the grid).
 */

import { addDaysToDateKey, parseDateKey } from '$lib/utils';

const CRLF = '\r\n';
const MAX_FOLD_OCTETS = 75;

/** A calendar event in app-friendly form: local date keys, no timezone database. */
export interface IcsEvent {
	uid: string;
	summary: string;
	description?: string;
	location?: string;
	url?: string;
	/** True for DATE-valued events (all day). */
	allDay: boolean;
	/** `YYYY-MM-DD` when all-day, else `YYYY-MM-DDTHH:MM:SS` (floating) or `…Z` (UTC). */
	start: string;
	/** Exclusive end, same forms as `start`. */
	end?: string;
	/** VALARM triggers as written, e.g. `-P1D` or `-PT1H`. */
	reminders?: string[];
}

export interface SerializeOptions {
	/** `X-WR-CALNAME` — what Proton shows as the imported calendar name. */
	calendarName: string;
	prodId?: string;
	/** Overrides the DTSTAMP of every event (tests). */
	dtstamp?: Date;
}

// ── Text escaping ────────────────────────────────────────────────────────────

/** Escapes TEXT property values: backslash, semicolon, comma, newlines. */
export function escapeIcsText(value: string): string {
	return value
		.replace(/\\/g, '\\\\')
		.replace(/;/g, '\\;')
		.replace(/,/g, '\\,')
		.replace(/\r\n|\r|\n/g, '\\n');
}

/** Inverse of `escapeIcsText`, in a single pass so `\\n` never becomes a newline. */
export function unescapeIcsText(value: string): string {
	return value.replace(/\\([\\;,nN])/g, (_, char: string) =>
		char === 'n' || char === 'N' ? '\n' : char
	);
}

/** Folds a content line at 75 octets with CRLF + space, never splitting a UTF-8 character. */
export function foldIcsLine(line: string): string {
	const bytes = Buffer.from(line, 'utf8');
	if (bytes.length <= MAX_FOLD_OCTETS) return line;
	const chunks: string[] = [];
	let offset = 0;
	let limit = MAX_FOLD_OCTETS;
	while (offset < bytes.length) {
		let end = Math.min(offset + limit, bytes.length);
		while (end < bytes.length && (bytes[end]! & 0xc0) === 0x80) end--;
		chunks.push(bytes.subarray(offset, end).toString('utf8'));
		offset = end;
		limit = MAX_FOLD_OCTETS - 1; // continuation lines carry a leading space
	}
	return chunks.join(`${CRLF} `);
}

// ── Date value conversion ────────────────────────────────────────────────────

/** `YYYY-MM-DD` → `YYYYMMDD`. */
export function compactDateKey(key: string): string {
	return key.replaceAll('-', '');
}

/** `YYYYMMDD` → `YYYY-MM-DD`, or null when it is not a real calendar date. */
export function dateKeyFromCompact(value: string): string | null {
	const match = /^(\d{4})(\d{2})(\d{2})$/.exec(value.trim());
	if (!match) return null;
	// Reuse the app's single date validator: 20261332 is rejected, not rolled over.
	return parseDateKey(`${match[1]}-${match[2]}-${match[3]}`);
}

/** App date string → iCalendar property value. */
function toIcsDateValue(event: Pick<IcsEvent, 'allDay' | 'start'>): string {
	if (event.allDay) return compactDateKey(event.start);
	const match = /^(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2})(?::(\d{2}))?(Z?)$/.exec(event.start);
	if (!match) return compactDateKey(event.start.slice(0, 10));
	return `${match[1]}${match[2]}${match[3]}T${match[4]}${match[5]}${match[6] ?? '00'}${match[7] ?? ''}`;
}

/** UTC timestamp for DTSTAMP. */
function toUtcStamp(date: Date): string {
	return `${date
		.toISOString()
		.replace(/[-:]/g, '')
		.replace(/\.\d{3}/, '')}`;
}

// ── Serialization ────────────────────────────────────────────────────────────

/**
 * Builds a VCALENDAR document. `uid` values are the caller's responsibility and
 * should be stable across exports so re-importing updates instead of duplicating.
 */
export function serializeIcs(events: IcsEvent[], options: SerializeOptions): string {
	const stamp = toUtcStamp(options.dtstamp ?? new Date());
	const lines: string[] = [
		'BEGIN:VCALENDAR',
		'VERSION:2.0',
		`PRODID:${options.prodId ?? '-//CompTIA Study App//Calendar//EN'}`,
		'CALSCALE:GREGORIAN',
		'METHOD:PUBLISH',
		`X-WR-CALNAME:${escapeIcsText(options.calendarName)}`
	];

	for (const event of events) {
		lines.push('BEGIN:VEVENT', `UID:${escapeIcsText(event.uid)}`, `DTSTAMP:${stamp}`);
		if (event.allDay) {
			lines.push(`DTSTART;VALUE=DATE:${toIcsDateValue(event)}`);
			lines.push(
				`DTEND;VALUE=DATE:${compactDateKey(event.end ?? addDaysToDateKey(event.start, 1))}`
			);
		} else {
			lines.push(`DTSTART:${toIcsDateValue(event)}`);
			if (event.end) lines.push(`DTEND:${toIcsDateValue({ ...event, start: event.end })}`);
		}
		lines.push(`SUMMARY:${escapeIcsText(event.summary)}`);
		if (event.description) lines.push(`DESCRIPTION:${escapeIcsText(event.description)}`);
		if (event.location) lines.push(`LOCATION:${escapeIcsText(event.location)}`);
		if (event.url) lines.push(`URL:${event.url}`);
		for (const trigger of event.reminders ?? []) {
			lines.push(
				'BEGIN:VALARM',
				'ACTION:DISPLAY',
				`DESCRIPTION:${escapeIcsText(event.summary)}`,
				`TRIGGER:${trigger}`,
				'END:VALARM'
			);
		}
		lines.push('END:VEVENT');
	}

	lines.push('END:VCALENDAR');
	return lines.map(foldIcsLine).join(CRLF) + CRLF;
}

// ── Parsing ──────────────────────────────────────────────────────────────────

interface IcsProperty {
	name: string;
	params: Record<string, string>;
	value: string;
}

function parseProperty(line: string): IcsProperty | null {
	const colon = line.indexOf(':');
	if (colon <= 0) return null;
	const [name, ...paramParts] = line.slice(0, colon).split(';');
	if (!name) return null;
	const params: Record<string, string> = {};
	for (const part of paramParts) {
		const equals = part.indexOf('=');
		if (equals <= 0) continue;
		params[part.slice(0, equals).toUpperCase()] = part.slice(equals + 1).replace(/^"|"$/g, '');
	}
	return { name: name.trim().toUpperCase(), params, value: line.slice(colon + 1) };
}

/** Joins RFC 5545 folded lines (continuation begins with a space or tab). */
function unfoldIcs(text: string): string[] {
	const physical = text.replace(/\r\n/g, '\n').replace(/\r/g, '\n').split('\n');
	const logical: string[] = [];
	for (const line of physical) {
		if ((line.startsWith(' ') || line.startsWith('\t')) && logical.length > 0)
			logical[logical.length - 1] += line.slice(1);
		else logical.push(line);
	}
	return logical.filter((line) => line.length > 0);
}

function parseDateValue(property: IcsProperty): { allDay: boolean; value: string } | null {
	const raw = property.value.trim();
	if (property.params.VALUE === 'DATE' || /^\d{8}$/.test(raw)) {
		const key = dateKeyFromCompact(raw);
		return key ? { allDay: true, value: key } : null;
	}
	const compact = /^(\d{4})(\d{2})(\d{2})T(\d{2})(\d{2})(\d{2})(Z?)$/.exec(raw);
	if (compact)
		return {
			allDay: false,
			value: `${compact[1]}-${compact[2]}-${compact[3]}T${compact[4]}:${compact[5]}:${compact[6]}${compact[7] ? 'Z' : ''}`
		};
	// Tolerate producers that already emit ISO-ish values.
	const iso = /^(\d{4}-\d{2}-\d{2})(?:T(\d{2}:\d{2}(?::\d{2})?))?(Z?)$/.exec(raw);
	if (!iso) return null;
	if (!iso[2]) return { allDay: true, value: iso[1]! };
	return {
		allDay: false,
		value: `${iso[1]}T${iso[2].length === 5 ? `${iso[2]}:00` : iso[2]}${iso[3] ? 'Z' : ''}`
	};
}

export interface ParseResult {
	events: IcsEvent[];
	/** VEVENTs dropped because they carried no usable DTSTART. */
	skipped: number;
}

/**
 * Parses VEVENTs out of an iCalendar document. External data, so nothing is
 * trusted: malformed properties are dropped rather than thrown, and the event
 * list is capped so a runaway file cannot produce unbounded output.
 */
export function parseIcs(text: string, options: { maxEvents?: number } = {}): ParseResult {
	const maxEvents = options.maxEvents ?? 5000;
	const lines = unfoldIcs(text);
	const events: IcsEvent[] = [];
	let skipped = 0;

	for (let index = 0; index < lines.length; index++) {
		if (lines[index].trim().toUpperCase() !== 'BEGIN:VEVENT') continue;
		const properties: IcsProperty[] = [];
		// Nested components (VALARM) must not leak their properties onto the
		// event — a VALARM DESCRIPTION would otherwise clobber the event's.
		// TRIGGER is the one nested property worth keeping.
		let nested = 0;
		for (index++; index < lines.length; index++) {
			const line = lines[index]!;
			const upper = line.trim().toUpperCase();
			if (upper === 'END:VEVENT') break;
			if (upper.startsWith('BEGIN:')) {
				nested++;
				continue;
			}
			if (upper.startsWith('END:')) {
				nested = Math.max(0, nested - 1);
				continue;
			}
			const property = parseProperty(line);
			if (!property) continue;
			if (nested > 0) {
				if (property.name === 'TRIGGER') properties.push(property);
				continue;
			}
			properties.push(property);
		}
		const event = buildEvent(properties, events.length);
		if (event) events.push(event);
		else skipped++;
		if (events.length >= maxEvents) break;
	}

	return { events, skipped };
}

function buildEvent(properties: IcsProperty[], index: number): IcsEvent | null {
	let start: { allDay: boolean; value: string } | null = null;
	let end: { allDay: boolean; value: string } | null = null;
	let summary = '';
	let description: string | undefined;
	let location: string | undefined;
	let url: string | undefined;
	let uid = '';
	const reminders: string[] = [];

	for (const property of properties) {
		switch (property.name) {
			case 'DTSTART':
				start = parseDateValue(property);
				break;
			case 'DTEND':
				end = parseDateValue(property);
				break;
			case 'SUMMARY':
				summary = unescapeIcsText(property.value).trim();
				break;
			case 'DESCRIPTION':
				description = unescapeIcsText(property.value).trim();
				break;
			case 'LOCATION':
				location = unescapeIcsText(property.value).trim();
				break;
			case 'URL':
				url = property.value.trim();
				break;
			case 'UID':
				uid = unescapeIcsText(property.value).trim();
				break;
			case 'TRIGGER':
				reminders.push(property.value.trim());
				break;
		}
	}

	if (!start) return null;
	return {
		uid: uid || `imported-${index}-${start.value}`,
		summary: summary || '(no title)',
		...(description ? { description } : {}),
		...(location ? { location } : {}),
		...(url ? { url } : {}),
		allDay: start.allDay,
		start: start.value,
		...(end ? { end: end.value } : {}),
		...(reminders.length ? { reminders } : {})
	};
}
