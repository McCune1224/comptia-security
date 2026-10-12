import { describe, expect, it } from 'vitest';
import { planSyncEvents } from './google-calendar';
import { createTestRepository } from './test-db';
import { assignmentDueDate } from './course';

function toKey(date: Date): string {
	return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
}

describe('planSyncEvents', () => {
	it('starts with the exam and includes every assignment, with unique sources', async () => {
		const repo = await createTestRepository();
		const planned = await planSyncEvents();
		expect(planned[0]).toMatchObject({ source: 'exam' });
		expect(planned.length).toBe((await repo.getCourseAssignments()).length + 1);
		expect(new Set(planned.map((item) => item.source)).size).toBe(planned.length);
		await repo.close();
	});

	it('matches the course scheduler exactly (exam date + due offsets)', async () => {
		const repo = await createTestRepository();
		const examDate = await repo.getExamDate();
		const planned = await planSyncEvents();
		expect(planned.find((item) => item.source === 'exam')?.date).toBe(examDate);
		for (const assignment of await repo.getCourseAssignments()) {
			const item = planned.find((p) => p.source === `assignment:${assignment.id}`);
			expect(item, `missing planned event for ${assignment.id}`).toBeDefined();
			expect(item?.date).toBe(toKey(assignmentDueDate(assignment, examDate)));
		}
		await repo.close();
	});

	it('every planned event has a summary and a YYYY-MM-DD date', async () => {
		for (const item of await planSyncEvents()) {
			expect(item.summary.length).toBeGreaterThan(0);
			expect(item.date).toMatch(/^\d{4}-\d{2}-\d{2}$/);
		}
	});
});

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
