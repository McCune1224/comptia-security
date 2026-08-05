import { json } from '@sveltejs/kit';
import { getOAuth, syncDeadlinesToGoogle } from '$lib/server/google-calendar';

export async function POST() {
	if (!(await getOAuth()))
		return json({ error: { code: 'NOT_CONNECTED', message: 'Connect a Google account first.' } }, { status: 409 });
	try {
		const result = await syncDeadlinesToGoogle();
		return json({ ok: true, ...result });
	} catch (error) {
		const message = error instanceof Error ? error.message : 'Failed to sync deadlines to Google Calendar.';
		return json({ error: { code: 'GOOGLE_ERROR', message } }, { status: 502 });
	}
}
