import { json, type RequestEvent } from '@sveltejs/kit';
import { getOAuth, syncDeadlinesToGoogle } from '$lib/server/google-calendar';
import { resolveScope } from '$lib/server/scope';

export async function POST(event: RequestEvent) {
	const scope = resolveScope(event);
	if (!(await getOAuth(scope)))
		return json({ error: { code: 'NOT_CONNECTED', message: 'Connect a Google account first.' } }, { status: 409 });
	try {
		const result = await syncDeadlinesToGoogle(scope);
		return json({ ok: true, ...result });
	} catch (error) {
		const message = error instanceof Error ? error.message : 'Failed to sync deadlines to Google Calendar.';
		return json({ error: { code: 'GOOGLE_ERROR', message } }, { status: 502 });
	}
}
