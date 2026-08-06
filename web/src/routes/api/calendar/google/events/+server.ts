import { json, type RequestEvent } from '@sveltejs/kit';
import { fetchCalendarEvents, getOAuth } from '$lib/server/google-calendar';
import { resolveScope } from '$lib/server/scope';

const DATE_RE = /^\d{4}-\d{2}-\d{2}$/;

export async function GET(event: RequestEvent) {
	const scope = resolveScope(event);
	if (!(await getOAuth(scope)))
		return json({ error: { code: 'NOT_CONNECTED', message: 'Connect a Google account first.' } }, { status: 409 });
	const start = event.url.searchParams.get('start') ?? '';
	const end = event.url.searchParams.get('end') ?? '';
	if (!DATE_RE.test(start) || !DATE_RE.test(end))
		return json({ error: { code: 'INVALID_REQUEST', message: 'start and end must be YYYY-MM-DD.' } }, { status: 400 });
	try {
		const events = await fetchCalendarEvents(start, end, scope);
		return json({ events });
	} catch (error) {
		const message = error instanceof Error ? error.message : 'Failed to fetch Google Calendar events.';
		return json({ error: { code: 'GOOGLE_ERROR', message } }, { status: 502 });
	}
}
