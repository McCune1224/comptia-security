import { json } from '@sveltejs/kit';
import { getOAuth, googleConfigured } from '$lib/server/google-calendar';
import { quizRepository } from '$lib/server/db';

export async function GET() {
	const oauth = await getOAuth();
	const synced = quizRepository.getSyncedEvents();
	const lastSyncAt = synced.length ? synced.map((row) => row.syncedAt).sort().at(-1) ?? null : null;
	return json({
		configured: googleConfigured(),
		connected: Boolean(oauth),
		email: oauth?.email ?? null,
		calendarId: oauth?.calendarId ?? null,
		syncedCount: synced.length,
		lastSyncAt
	});
}
