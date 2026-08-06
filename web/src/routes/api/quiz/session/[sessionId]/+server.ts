import { json, type RequestEvent } from '@sveltejs/kit';
import { apiError, readJson } from '$lib/server/api';
import { resolveScope } from '$lib/server/scope';
import { scopedServices } from '$lib/server/services';

export function GET(event: RequestEvent<{ sessionId: string }>) {
	try {
		const value = scopedServices(resolveScope(event)).quiz.getSession(event.params.sessionId);
		return json('review' in value ? { status: 'completed', result: value } : { status: 'active', session: value });
	} catch (error) { return apiError(error); }
}

export async function PATCH(event: RequestEvent<{ sessionId: string }>) {
	try {
		const body = await readJson(event.request);
		const currentIndex = body.currentIndex;
		const flag = body.flag;
		if (currentIndex === undefined && flag === undefined) return json({ error: { code: 'INVALID_REQUEST', message: 'Provide currentIndex or flag.' } }, { status: 400 });
		if (currentIndex !== undefined && !Number.isInteger(currentIndex)) return json({ error: { code: 'INVALID_REQUEST', message: 'currentIndex must be an integer.' } }, { status: 400 });
		if (flag !== undefined && (!flag || typeof flag !== 'object' || !Number.isInteger((flag as { questionIndex?: unknown }).questionIndex) || typeof (flag as { value?: unknown }).value !== 'boolean')) return json({ error: { code: 'INVALID_REQUEST', message: 'flag must contain questionIndex and value.' } }, { status: 400 });
		return json({ session: scopedServices(resolveScope(event)).quiz.updateSession(event.params.sessionId, { ...(currentIndex !== undefined ? { currentIndex: currentIndex as number } : {}), ...(flag ? { flag: flag as { questionIndex: number; value: boolean } } : {}) }) });
	} catch (error) { return apiError(error); }
}

export function DELETE(event: RequestEvent<{ sessionId: string }>) {
	try { scopedServices(resolveScope(event)).quiz.abandonSession(event.params.sessionId); return new Response(null, { status: 204 }); }
	catch (error) { return apiError(error); }
}
