import { redirect, type RequestEvent } from '@sveltejs/kit';
import { exchangeCode, fetchPrimaryEmail, saveOAuth } from '$lib/server/google-calendar';
import { resolveScope } from '$lib/server/scope';

export async function GET(event: RequestEvent) {
	const { url, cookies, request } = event;
	const code = url.searchParams.get('code');
	const state = url.searchParams.get('state');
	const pending = cookies.get('gcal_oauth_state');
	cookies.delete('gcal_oauth_state', { path: '/' });

	if (!code || !state || !pending) redirect(302, '/calendar?error=state');
	const pendingState = JSON.parse(pending) as { state: string; verifier: string };
	if (pendingState.state !== state) redirect(302, '/calendar?error=state');

	try {
		const token = await exchangeCode(code, pendingState.verifier, request.url);
		const email = await fetchPrimaryEmail(token.accessToken);
		await saveOAuth({ ...token, email }, resolveScope(event));
	} catch (error) {
		console.error('Google OAuth callback failed:', error);
		redirect(302, '/calendar?error=auth');
	}
	redirect(302, '/calendar?connected=1');
}
