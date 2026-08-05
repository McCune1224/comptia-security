import { json } from '@sveltejs/kit';
import { buildAuthUrl, googleConfigured } from '$lib/server/google-calendar';

export async function GET({ request, cookies }) {
	if (!googleConfigured())
		return json({ error: { code: 'NOT_CONFIGURED', message: 'GOOGLE_CLIENT_ID and GOOGLE_CLIENT_SECRET must be set (see web/GOOGLE-CALENDAR.md).' } }, { status: 500 });
	const { url, state, verifier } = buildAuthUrl(request.url);
	cookies.set('gcal_oauth_state', JSON.stringify({ state, verifier }), {
		httpOnly: true,
		sameSite: 'lax',
		path: '/',
		maxAge: 600
	});
	return json({ authUrl: url });
}
