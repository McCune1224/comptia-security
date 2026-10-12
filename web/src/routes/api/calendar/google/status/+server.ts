import { json, type RequestEvent } from '@sveltejs/kit';
import { getOAuth, googleConfigured } from '$lib/server/google-calendar';
import { resolveScope } from '$lib/server/scope';
import { scopedServices } from '$lib/server/services';

export async function GET(event: RequestEvent) {
	const scope = await resolveScope(event);
	const oauth = await getOAuth(scope);
	const synced = await scopedServices(scope).repo.getSyncedEvents();
	const lastSyncAt = synced.length
		? (synced
				.map((row) => row.syncedAt)
				.sort()
				.at(-1) ?? null)
		: null;
	return json({
		configured: googleConfigured(),
		connected: Boolean(oauth),
		email: oauth?.email ?? null,
		calendarId: oauth?.calendarId ?? null,
		syncedCount: synced.length,
		lastSyncAt
	});
}
