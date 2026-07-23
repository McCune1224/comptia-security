import { json } from '@sveltejs/kit';
import { apiError, readJson } from '$lib/server/api';
import { quizService } from '$lib/server/quiz';

export async function POST({ request }: { request: Request }) {
	try {
		const body = await readJson(request);
		if (typeof body.sessionId !== 'string') return json({ error: { code: 'INVALID_REQUEST', message: 'sessionId is required.' } }, { status: 400 });
		return json(quizService.completeSession(body.sessionId));
	} catch (error) { return apiError(error); }
}
