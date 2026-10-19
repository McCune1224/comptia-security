import { describe, expect, it } from 'vitest';
import { createTestRepository } from './test-db';

describe('google oauth storage', () => {
	it('round-trips and clears the single oauth row', async () => {
		const repo = await createTestRepository();
		expect(await repo.getGoogleOAuth()).toBeNull();
		await repo.saveGoogleOAuth({
			accessToken: 'a',
			refreshToken: 'r',
			expiresAt: 123,
			email: 'me@example.com'
		});
		expect(await repo.getGoogleOAuth()).toMatchObject({
			accessToken: 'a',
			refreshToken: 'r',
			expiresAt: 123,
			email: 'me@example.com',
			calendarId: null
		});
		await repo.clearGoogleOAuth();
		expect(await repo.getGoogleOAuth()).toBeNull();
		await repo.close();
	});

	it('keeps calendarId when saving a refresh (calendarId omitted)', async () => {
		const repo = await createTestRepository();
		await repo.saveGoogleOAuth({
			accessToken: 'a',
			refreshToken: 'r',
			expiresAt: 1,
			email: 'e',
			calendarId: 'cal-9'
		});
		await repo.saveGoogleOAuth({
			accessToken: 'b',
			refreshToken: 'r',
			expiresAt: 2,
			email: 'e'
		});
		expect((await repo.getGoogleOAuth())?.calendarId).toBe('cal-9');
		await repo.clearGoogleOAuth();
		await repo.close();
	});

	it('tracks, updates and removes synced events by source', async () => {
		const repo = await createTestRepository();
		await repo.recordSyncedEvent('exam', 'evt-1', 'Exam', '2026-08-31', '2026-08-05T00:00:00Z');
		await repo.recordSyncedEvent(
			'assignment:week-1-checkpoint',
			'evt-2',
			'Checkpoint',
			'2026-08-29',
			'2026-08-05T00:00:00Z'
		);
		await repo.recordSyncedEvent('exam', 'evt-1b', 'Exam', '2026-08-31', '2026-08-06T00:00:00Z');
		expect(await repo.getSyncedEvents()).toHaveLength(2);
		expect((await repo.getSyncedEvents()).find((row) => row.source === 'exam')?.eventId).toBe(
			'evt-1b'
		);
		await repo.removeSyncedEvent('exam');
		expect((await repo.getSyncedEvents()).map((row) => row.source)).toEqual([
			'assignment:week-1-checkpoint'
		]);
		for (const row of await repo.getSyncedEvents()) await repo.removeSyncedEvent(row.source);
		expect(await repo.getSyncedEvents()).toHaveLength(0);
		await repo.close();
	});
});
