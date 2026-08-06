import { json, type RequestEvent } from '@sveltejs/kit';
import { clearOAuth } from '$lib/server/google-calendar';
import { resolveScope } from '$lib/server/scope';
import { scopedServices } from '$lib/server/services';

export async function POST(event: RequestEvent) {
	const scope = resolveScope(event);
	await clearOAuth(scope);
	scopedServices(scope).repo.getSyncedEvents().forEach((row) => scopedServices(scope).repo.removeSyncedEvent(row.source));
	return json({ ok: true });
}
