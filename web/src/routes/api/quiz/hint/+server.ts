import { json, type RequestEvent } from '@sveltejs/kit';
import { apiError, readJson } from '$lib/server/api';
import { resolveScope } from '$lib/server/scope';
import { scopedServices } from '$lib/server/services';

export async function POST(event: RequestEvent) {
	try {
		const body = await readJson(event.request);
		if (typeof body.sessionId !== 'string' || !Number.isInteger(body.questionIndex)) return json({ error: { code: 'INVALID_REQUEST', message: 'sessionId and questionIndex are required.' } }, { status: 400 });
		return json(scopedServices(resolveScope(event)).quiz.revealHint(body.sessionId, body.questionIndex as number));
	} catch (error) { return apiError(error); }
}
