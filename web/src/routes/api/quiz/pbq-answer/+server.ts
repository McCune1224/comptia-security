import { json } from '@sveltejs/kit';
import { submitPbqAnswer } from '$lib/server/quiz';

export async function POST({ request }) {
	const body = await request.json();
	const { sessionId, questionIndex, steps } = body;

	if (!sessionId || questionIndex === undefined || !Array.isArray(steps)) {
		return json({ error: 'Missing required fields: sessionId, questionIndex, steps (array)' }, { status: 400 });
	}

	try {
		const result = submitPbqAnswer(sessionId, questionIndex, steps);
		return json(result);
	} catch (e) {
		return json({ error: (e as Error).message }, { status: 400 });
	}
}
