import { json, type RequestEvent } from '@sveltejs/kit';
import { syncDashboard, syncWeakTopics, writeMockExamResult } from '$lib/server/sync';
import { resolveScope } from '$lib/server/scope';
import { scopedServices } from '$lib/server/services';

export async function POST(event: RequestEvent) {
	let body: { sessionId?: string };
	try { body = await event.request.json() as { sessionId?: string }; } catch { return json({ error: { code: 'INVALID_REQUEST', message: 'Malformed JSON request body.' } }, { status: 400 }); }
	const scope = resolveScope(event);
	const messages = [syncDashboard(scope), syncWeakTopics(scope)];
	if (body.sessionId) { const stored = scopedServices(scope).repo.getSession(body.sessionId); if (!stored) messages.push('Session was not found.'); else if (stored.summary.status !== 'completed' || !stored.result) messages.push('Active sessions are not synced or completed by sync.'); else messages.push(writeMockExamResult(stored.result)); }
	return json({ success: true, messages });
}
