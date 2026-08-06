import { json, type RequestEvent } from '@sveltejs/kit';
import { apiError, readJson } from '$lib/server/api';
import { resolveScope } from '$lib/server/scope';
import { scopedServices } from '$lib/server/services';

export async function POST(event: RequestEvent) {
	try {
		const body = await readJson(event.request);
		if (typeof body.sessionId !== 'string') return json({ error: { code: 'INVALID_REQUEST', message: 'sessionId is required.' } }, { status: 400 });
		return json(scopedServices(resolveScope(event)).quiz.completeSession(body.sessionId));
	} catch (error) { return apiError(error); }
}
