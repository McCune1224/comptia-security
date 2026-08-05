import { json } from '@sveltejs/kit';
import { clearOAuth } from '$lib/server/google-calendar';
import { quizRepository } from '$lib/server/db';

export async function POST() {
	await clearOAuth();
	quizRepository.getSyncedEvents().forEach((row) => quizRepository.removeSyncedEvent(row.source));
	return json({ ok: true });
}
