import { json } from '@sveltejs/kit';
import { submitAnswer } from '$lib/server/quiz';

export async function POST({ request }) {
	const body = await request.json();
	const { sessionId, questionIndex, answer } = body;

	if (!sessionId || questionIndex === undefined || !answer) {
		return json({ error: 'Missing required fields: sessionId, questionIndex, answer' }, { status: 400 });
	}

	try {
		const result = submitAnswer(sessionId, questionIndex, answer);
		return json(result);
	} catch (e) {
		return json({ error: (e as Error).message }, { status: 400 });
	}
}
