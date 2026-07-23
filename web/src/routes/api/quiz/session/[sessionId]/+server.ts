import { json } from '@sveltejs/kit';
import { apiError, readJson } from '$lib/server/api';
import { quizService } from '$lib/server/quiz';

export function GET({ params }: { params: { sessionId: string } }) {
	try {
		const value = quizService.getSession(params.sessionId);
		return json('review' in value ? { status: 'completed', result: value } : { status: 'active', session: value });
	} catch (error) { return apiError(error); }
}

export async function PATCH({ params, request }: { params: { sessionId: string }; request: Request }) {
	try {
		const body = await readJson(request);
		const currentIndex = body.currentIndex;
		const flag = body.flag;
		if (currentIndex === undefined && flag === undefined) return json({ error: { code: 'INVALID_REQUEST', message: 'Provide currentIndex or flag.' } }, { status: 400 });
		if (currentIndex !== undefined && !Number.isInteger(currentIndex)) return json({ error: { code: 'INVALID_REQUEST', message: 'currentIndex must be an integer.' } }, { status: 400 });
		if (flag !== undefined && (!flag || typeof flag !== 'object' || !Number.isInteger((flag as { questionIndex?: unknown }).questionIndex) || typeof (flag as { value?: unknown }).value !== 'boolean')) return json({ error: { code: 'INVALID_REQUEST', message: 'flag must contain questionIndex and value.' } }, { status: 400 });
		return json({ session: quizService.updateSession(params.sessionId, { ...(currentIndex !== undefined ? { currentIndex: currentIndex as number } : {}), ...(flag ? { flag: flag as { questionIndex: number; value: boolean } } : {}) }) });
	} catch (error) { return apiError(error); }
}

export function DELETE({ params }: { params: { sessionId: string } }) {
	try { quizService.abandonSession(params.sessionId); return new Response(null, { status: 204 }); }
	catch (error) { return apiError(error); }
}
