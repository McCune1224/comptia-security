import { env } from '$env/dynamic/private';
import crypto from 'node:crypto';
import { createScopedRepo, DEFAULT_SCOPE, quizRepository, type Scope, type StoredGoogleOAuth as GoogleOAuth, type StoredSyncedEvent as SyncedEvent } from './db';
import { assignmentDueDate, COURSE_META } from './course';

// ─────────────────────────────────────────────────────────────────────────────
// Google Calendar integration — OAuth2 (PKCE) + Calendar v3 API client.
//
// Single-user personal app: the OAuth token lives in SQLite (`google_oauth`),
// and pushed deadlines are tracked in `google_synced_events` so re-syncing
// updates/deletes instead of duplicating.
//
// Credentials come from GOOGLE_CLIENT_ID / GOOGLE_CLIENT_SECRET (`.env` in dev,
// process env on the Pi). The redirect URI is derived from the request origin
// so the same code works on localhost:5173 and the Tailscale hostname.
// ─────────────────────────────────────────────────────────────────────────────

export const CALENDAR_SCOPE = 'https://www.googleapis.com/auth/calendar';

const AUTH_ENDPOINT = 'https://accounts.google.com/o/oauth2/v2/auth';
const TOKEN_ENDPOINT = 'https://oauth2.googleapis.com/token';
const API_BASE = 'https://www.googleapis.com/calendar/v3';

const PREP_CALENDAR_NAME = (courseId: string): string => `${COURSE_META[courseId as keyof typeof COURSE_META]?.title ?? 'Security+'} Prep`;

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

export interface PlannedEvent {
	source: string;
	summary: string;
	description: string;
	date: string; // YYYY-MM-DD
}

export function googleConfigured(): boolean {
	return Boolean(env.GOOGLE_CLIENT_ID && env.GOOGLE_CLIENT_SECRET);
}

function credentials(): { clientId: string; clientSecret: string } {
	const clientId = env.GOOGLE_CLIENT_ID;
	const clientSecret = env.GOOGLE_CLIENT_SECRET;
	if (!clientId || !clientSecret)
		throw new Error('GOOGLE_CLIENT_ID and GOOGLE_CLIENT_SECRET must be set (see web/.env.example).');
	return { clientId, clientSecret };
}

/** Exact redirect URI: request origin + callback path, unless overridden. */
export function redirectUri(requestUrl: string | URL): string {
	const origin = new URL(requestUrl).origin;
	return env.GOOGLE_REDIRECT_URI ?? `${origin}/api/calendar/google/callback`;
}

// ── OAuth flow ───────────────────────────────────────────────────────────────

export function buildAuthUrl(requestUrl: string | URL): { url: string; state: string; verifier: string } {
	const { clientId } = credentials();
	const state = crypto.randomUUID();
	const verifier = base64Url(crypto.randomBytes(32));
	const challenge = base64Url(crypto.createHash('sha256').update(verifier).digest());
	const params = new URLSearchParams({
		client_id: clientId,
		redirect_uri: redirectUri(requestUrl),
		response_type: 'code',
		scope: CALENDAR_SCOPE,
		access_type: 'offline',
		prompt: 'consent',
		state,
		code_challenge: challenge,
		code_challenge_method: 'S256'
	});
	return { url: `${AUTH_ENDPOINT}?${params.toString()}`, state, verifier };
}

export async function exchangeCode(
	code: string,
	verifier: string,
	requestUrl: string | URL
): Promise<{ accessToken: string; refreshToken: string; expiresAt: number }> {
	const { clientId, clientSecret } = credentials();
	const body = new URLSearchParams({
		code,
		client_id: clientId,
		client_secret: clientSecret,
		redirect_uri: redirectUri(requestUrl),
		grant_type: 'authorization_code',
		code_verifier: verifier
	});
	const response = await fetch(TOKEN_ENDPOINT, { method: 'POST', headers: { 'Content-Type': 'application/x-www-form-urlencoded' }, body });
	const data = (await response.json()) as {
		access_token?: string;
		refresh_token?: string;
		expires_in?: number;
		error?: string;
		error_description?: string;
	};
	if (!response.ok || !data.access_token)
		throw new Error(`Google token exchange failed: ${data.error ?? response.status} ${data.error_description ?? ''}`.trim());
	if (!data.refresh_token) throw new Error('Google did not return a refresh token — revoke access and reconnect.');
	return {
		accessToken: data.access_token,
		refreshToken: data.refresh_token,
		expiresAt: Date.now() + (data.expires_in ?? 3600) * 1000 - 60_000
	};
}

// ── Token management ─────────────────────────────────────────────────────────

export async function getOAuth(scope: Scope = DEFAULT_SCOPE): Promise<GoogleOAuth | null> {
	return createScopedRepo(quizRepository, scope).getGoogleOAuth();
}

export async function saveOAuth(token: Omit<GoogleOAuth, 'calendarId'> & { calendarId?: string | null }, scope: Scope = DEFAULT_SCOPE): Promise<void> {
	createScopedRepo(quizRepository, scope).saveGoogleOAuth(token);
}

export async function clearOAuth(scope: Scope = DEFAULT_SCOPE): Promise<void> {
	createScopedRepo(quizRepository, scope).clearGoogleOAuth();
}

async function refreshAccessToken(oauth: GoogleOAuth, scope: Scope): Promise<string> {
	const { clientId, clientSecret } = credentials();
	const body = new URLSearchParams({
		client_id: clientId,
		client_secret: clientSecret,
		refresh_token: oauth.refreshToken,
		grant_type: 'refresh_token'
	});
	const response = await fetch(TOKEN_ENDPOINT, { method: 'POST', headers: { 'Content-Type': 'application/x-www-form-urlencoded' }, body });
	const data = (await response.json()) as { access_token?: string; expires_in?: number; error?: string };
	if (!response.ok || !data.access_token)
		throw new Error(`Google token refresh failed: ${data.error ?? response.status} — reconnect from the calendar page.`);
	createScopedRepo(quizRepository, scope).saveGoogleOAuth({
		...oauth,
		accessToken: data.access_token,
		expiresAt: Date.now() + (data.expires_in ?? 3600) * 1000 - 60_000
	});
	return data.access_token;
}

/** Calls fn with a valid access token; refreshes once on expiry, retries once on 401. */
async function withToken<T>(fn: (token: string) => Promise<T>, scope: Scope): Promise<T> {
	const oauth = await getOAuth(scope);
	if (!oauth) throw new GoogleCalendarError('NOT_CONNECTED', 'Connect a Google account first.');
	let token = oauth.accessToken;
	if (Date.now() >= oauth.expiresAt) token = await refreshAccessToken(oauth, scope);
	try {
		return await fn(token);
	} catch (error) {
		if (error instanceof GoogleApiError && error.status === 401) return await fn(await refreshAccessToken(oauth, scope));
		throw error;
	}
}

// ── Calendar API ─────────────────────────────────────────────────────────────

class GoogleApiError extends Error {
	status: number;
	constructor(status: number, message: string) {
		super(message);
		this.status = status;
	}
}

class GoogleCalendarError extends Error {
	code: string;
	constructor(code: string, message: string) {
		super(message);
		this.code = code;
	}
}

async function api<T>(token: string, path: string, init: RequestInit = {}): Promise<T> {
	const response = await fetch(`${API_BASE}${path}`, {
		...init,
		headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json', ...(init.headers ?? {}) }
	});
	if (!response.ok) {
		const detail = (await response.json().catch(() => null)) as { error?: { message?: string } } | null;
		throw new GoogleApiError(response.status, detail?.error?.message ?? `Calendar API ${response.status}`);
	}
	return (await response.json()) as T;
}

interface CalendarListEntry {
	id: string;
	summary: string;
	primary?: boolean;
	selected?: boolean;
	accessRole?: string;
}

interface CalendarEvent {
	id: string;
	summary?: string;
	htmlLink?: string;
	start?: { date?: string; dateTime?: string; timeZone?: string };
	end?: { date?: string; dateTime?: string; timeZone?: string };
}

/** The user's email: the id of their primary calendar. */
export async function fetchPrimaryEmail(token: string): Promise<string> {
	const data = await api<{ items: CalendarListEntry[] }>(token, '/users/me/calendarList?minAccessRole=reader&maxResults=50');
	const primary = data.items.find((entry) => entry.primary);
	if (!primary?.id) throw new GoogleCalendarError('GOOGLE_ERROR', 'Could not find your primary Google Calendar.');
	return primary.id;
}

/** Events across all visible calendars in [startDate, endDate], deduped by id. */
export async function fetchCalendarEvents(startDate: string, endDate: string, scope: Scope = DEFAULT_SCOPE): Promise<CalendarEventView[]> {
	return withToken(async (token) => {
		const list = await api<{ items: CalendarListEntry[] }>(token, '/users/me/calendarList?maxResults=50');
		const calendars = list.items.filter((entry) => entry.selected !== false && entry.accessRole !== 'freeBusyReader').slice(0, 8);
		const timeMin = `${startDate}T00:00:00Z`;
		const timeMax = `${endDate}T23:59:59Z`;
		const results = await Promise.all(
			calendars.map(async (calendar) => {
				const params = new URLSearchParams({ timeMin, timeMax, singleEvents: 'true', orderBy: 'startTime', maxResults: '250' });
				try {
					const data = await api<{ items: CalendarEvent[] }>(token, `/calendars/${encodeURIComponent(calendar.id)}/events?${params}`);
					return data.items.map((event) => toEventView(event, calendar.summary));
				} catch (error) {
					if (error instanceof GoogleApiError && error.status === 404) return []; // calendar deleted since listing
					throw error;
				}
			})
		);
		const seen = new Set<string>();
		return results.flat().filter((event) => (seen.has(event.id) ? false : (seen.add(event.id), true))).sort((a, b) => a.start.localeCompare(b.start));
	}, scope);
}

function toEventView(event: CalendarEvent, calendarName: string): CalendarEventView {
	const allDay = Boolean(event.start?.date);
	const start = allDay ? (event.start?.date ?? '') : (event.start?.dateTime ?? '');
	const end = allDay ? (event.end?.date ?? start) : (event.end?.dateTime ?? start);
	const startTime = allDay
		? undefined
		: new Date(start).toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' });
	return {
		id: event.id,
		summary: event.summary ?? '(no title)',
		calendarName,
		allDay,
		start,
		startTime,
		end,
		htmlLink: event.htmlLink ?? '',
		url: event.htmlLink ?? ''
	};
}

// ── Deadline sync (push course deadlines into a dedicated calendar) ─────────

export function planSyncEvents(scope: Scope = DEFAULT_SCOPE): PlannedEvent[] {
	const repo = createScopedRepo(quizRepository, scope);
	const examDate = repo.getExamDate();
	const examName = COURSE_META[scope.courseId]?.examName ?? 'Certification Exam';
	const planned: PlannedEvent[] = [
		{
			source: 'exam',
			summary: `🎓 ${examName}`,
			description: 'CompTIA exam day. You\'ve got this!',
			date: examDate
		}
	];
	for (const assignment of repo.getCourseAssignments()) {
		const due = assignmentDueDate(assignment, examDate);
		planned.push({
			source: `assignment:${assignment.id}`,
			summary: `📝 ${assignment.title}`,
			description: `Due before the ${examName.split(' ')[0] ?? 'exam'} (${examDate}). From the ${COURSE_META[scope.courseId]?.title ?? 'Security+'} course app.`,
			date: toDateKey(due)
		});
	}
	return planned;
}

function toDateKey(date: Date): string {
	const year = date.getFullYear();
	const month = String(date.getMonth() + 1).padStart(2, '0');
	const day = String(date.getDate()).padStart(2, '0');
	return `${year}-${month}-${day}`;
}

function nextDayKey(dateKey: string): string {
	const [year, month, day] = dateKey.split('-').map(Number);
	const next = new Date(year, month - 1, day + 1);
	return toDateKey(next);
}

function allDayEvent(planned: PlannedEvent): Record<string, unknown> {
	return {
		summary: planned.summary,
		description: planned.description,
		start: { date: planned.date },
		end: { date: nextDayKey(planned.date) },
		reminders: { useDefault: false, overrides: [{ method: 'popup', minutes: 1440 }, { method: 'popup', minutes: 60 }] }
	};
}

export interface SyncResult {
	created: number;
	updated: number;
	deleted: number;
	calendarId: string;
	calendarName: string;
	syncedAt: string;
}

/** Pushes exam + assignment deadlines into a dedicated per-course "… Prep" calendar. */
export async function syncDeadlinesToGoogle(scope: Scope = DEFAULT_SCOPE): Promise<SyncResult> {
	return withToken(async (token) => {
		const repo = createScopedRepo(quizRepository, scope);
		const oauth = await getOAuth(scope);
		if (!oauth) throw new GoogleCalendarError('NOT_CONNECTED', 'Connect a Google account first.');

		const calendarName = PREP_CALENDAR_NAME(scope.courseId);
		let calendarId = oauth.calendarId;
		if (!calendarId) {
			const created = await api<{ id: string }>(token, '/calendars', {
				method: 'POST',
				body: JSON.stringify({ summary: calendarName, description: 'Course deadlines pushed by the study app.' })
			});
			calendarId = created.id;
			repo.saveGoogleOAuth({ ...oauth, calendarId });
		}

		const planned = planSyncEvents(scope);
		const existing = new Map(repo.getSyncedEvents().map((row) => [row.source, row]));
		let created = 0;
		let updated = 0;
		const syncedAt = new Date().toISOString();

		for (const item of planned) {
			const row = existing.get(item.source);
			const body = JSON.stringify(allDayEvent(item));
			if (row && row.dueDate === item.date && row.summary === item.summary) continue; // nothing changed
			if (row) {
				await api(token, `/calendars/${encodeURIComponent(calendarId)}/events/${encodeURIComponent(row.eventId)}`, { method: 'PUT', body });
				updated++;
			} else {
				const event = await api<{ id: string }>(token, `/calendars/${encodeURIComponent(calendarId)}/events`, { method: 'POST', body });
				repo.recordSyncedEvent(item.source, event.id, item.summary, item.date, syncedAt);
				created++;
			}
		}

		// Delete events whose source no longer exists (e.g. exam date moved off a stale assignment).
		const plannedSources = new Set(planned.map((item) => item.source));
		let deleted = 0;
		for (const row of existing.values()) {
			if (plannedSources.has(row.source)) continue;
			try {
				await api(token, `/calendars/${encodeURIComponent(calendarId)}/events/${encodeURIComponent(row.eventId)}`, { method: 'DELETE' });
			} catch (error) {
				if (!(error instanceof GoogleApiError && error.status === 404)) throw error; // already gone is fine
			}
			repo.removeSyncedEvent(row.source);
			deleted++;
		}

		return { created, updated, deleted, calendarId, calendarName, syncedAt };
	}, scope);
}

// ── Helpers ──────────────────────────────────────────────────────────────────

function base64Url(buffer: Buffer): string {
	return buffer.toString('base64').replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}
