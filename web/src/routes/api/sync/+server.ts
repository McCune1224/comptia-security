import { json } from '@sveltejs/kit';
import { syncDashboard, syncWeakTopics } from '$lib/server/sync';
import { getSessionResult } from '$lib/server/db';
import { writeMockExamResult } from '$lib/server/sync';
import { completeQuizSession } from '$lib/server/quiz';

export async function POST({ request }) {
	const body = await request.json();
	const { sessionId } = body;

	const messages: string[] = [];

	try {
		// First, finalize the session if it hasn't been already
		if (sessionId) {
			try {
				const result = completeQuizSession(sessionId);
				if (result) {
					writeMockExamResult(result);
					messages.push(`Mock exam result written for ${result.percentage}% score`);
				}
			} catch {
				messages.push('Session already completed');
			}
		}

		const dashMsg = syncDashboard();
		messages.push(dashMsg);

		const weakMsg = syncWeakTopics();
		messages.push(weakMsg);

		return json({ success: true, messages });
	} catch (e) {
		return json({ error: (e as Error).message, messages }, { status: 500 });
	}
}
