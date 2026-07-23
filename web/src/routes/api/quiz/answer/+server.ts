import { json } from '@sveltejs/kit';
import type { QuestionResponse } from '$lib/types';
import { apiError, readJson } from '$lib/server/api';
import { quizService } from '$lib/server/quiz';

export async function PUT({ request }: { request: Request }) {
	try {
		const body = await readJson(request);
		if (typeof body.sessionId !== 'string' || !Number.isInteger(body.questionIndex) || !body.response || typeof body.response !== 'object') return json({ error: { code: 'INVALID_REQUEST', message: 'sessionId, questionIndex, and response are required.' } }, { status: 400 });
		return json(quizService.saveResponse(body.sessionId, body.questionIndex as number, body.response as QuestionResponse));
	} catch (error) { return apiError(error); }
}
