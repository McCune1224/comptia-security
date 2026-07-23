import { json } from '@sveltejs/kit';
import { syncDashboard, syncWeakTopics, writeMockExamResult } from '$lib/server/sync';
import { quizRepository } from '$lib/server/db';

export async function POST({ request }: { request: Request }) {
	let body: { sessionId?: string };
	try { body = await request.json() as { sessionId?: string }; } catch { return json({ error: { code: 'INVALID_REQUEST', message: 'Malformed JSON request body.' } }, { status: 400 }); }
	const messages = [syncDashboard(), syncWeakTopics()];
	if (body.sessionId) { const stored = quizRepository.getSession(body.sessionId); if (!stored) messages.push('Session was not found.'); else if (stored.summary.status !== 'completed' || !stored.result) messages.push('Active sessions are not synced or completed by sync.'); else messages.push(writeMockExamResult(stored.result)); }
	return json({ success: true, messages });
}
