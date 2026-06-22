import { json } from '@sveltejs/kit';
import { completeQuizSession, completePbqSession } from '$lib/server/quiz';

export async function POST({ request }) {
	const body = await request.json();
	const { sessionId } = body;

	if (!sessionId) {
		return json({ error: 'Missing sessionId' }, { status: 400 });
	}

	try {
		// Try both session types
		const result = completeQuizSession(sessionId) || completePbqSession(sessionId);
		if (!result) {
			return json({ error: 'Session not found' }, { status: 404 });
		}
		return json(result);
	} catch (e) {
		return json({ error: (e as Error).message }, { status: 400 });
	}
}
