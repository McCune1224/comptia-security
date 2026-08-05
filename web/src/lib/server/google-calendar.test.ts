import { describe, expect, it } from 'vitest';
import { planSyncEvents } from './google-calendar';
import { quizRepository } from './db';
import { assignmentDueDate } from './course';

function toKey(date: Date): string {
	return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
}

describe('planSyncEvents', () => {
	it('starts with the exam and includes every assignment, with unique sources', () => {
		const planned = planSyncEvents();
		expect(planned[0]).toMatchObject({ source: 'exam' });
		expect(planned.length).toBe(quizRepository.getCourseAssignments().length + 1);
		expect(new Set(planned.map((item) => item.source)).size).toBe(planned.length);
	});

	it('matches the course scheduler exactly (exam date + due offsets)', () => {
		const examDate = quizRepository.getExamDate();
		const planned = planSyncEvents();
		expect(planned.find((item) => item.source === 'exam')?.date).toBe(examDate);
		for (const assignment of quizRepository.getCourseAssignments()) {
			const item = planned.find((p) => p.source === `assignment:${assignment.id}`);
			expect(item, `missing planned event for ${assignment.id}`).toBeDefined();
			expect(item?.date).toBe(toKey(assignmentDueDate(assignment, examDate)));
		}
	});

	it('every planned event has a summary and a YYYY-MM-DD date', () => {
		for (const item of planSyncEvents()) {
			expect(item.summary.length).toBeGreaterThan(0);
			expect(item.date).toMatch(/^\d{4}-\d{2}-\d{2}$/);
		}
	});
});

describe('google oauth storage', () => {
	it('round-trips and clears the single oauth row', () => {
		expect(quizRepository.getGoogleOAuth()).toBeNull();
		quizRepository.saveGoogleOAuth({ accessToken: 'a', refreshToken: 'r', expiresAt: 123, email: 'me@example.com' });
		expect(quizRepository.getGoogleOAuth()).toMatchObject({
			accessToken: 'a',
			refreshToken: 'r',
			expiresAt: 123,
			email: 'me@example.com',
			calendarId: null
		});
		quizRepository.clearGoogleOAuth();
		expect(quizRepository.getGoogleOAuth()).toBeNull();
	});

	it('keeps calendarId when saving a refresh (calendarId omitted)', () => {
		quizRepository.saveGoogleOAuth({ accessToken: 'a', refreshToken: 'r', expiresAt: 1, email: 'e', calendarId: 'cal-9' });
		quizRepository.saveGoogleOAuth({ accessToken: 'b', refreshToken: 'r', expiresAt: 2, email: 'e' });
		expect(quizRepository.getGoogleOAuth()?.calendarId).toBe('cal-9');
		quizRepository.clearGoogleOAuth();
	});

	it('tracks, updates and removes synced events by source', () => {
		quizRepository.recordSyncedEvent('exam', 'evt-1', '🎓 Exam', '2026-08-31', '2026-08-05T00:00:00Z');
		quizRepository.recordSyncedEvent('assignment:week-1-checkpoint', 'evt-2', '📝 Checkpoint', '2026-08-29', '2026-08-05T00:00:00Z');
		quizRepository.recordSyncedEvent('exam', 'evt-1b', '🎓 Exam', '2026-08-31', '2026-08-06T00:00:00Z');
		expect(quizRepository.getSyncedEvents()).toHaveLength(2);
		expect(quizRepository.getSyncedEvents().find((row) => row.source === 'exam')?.eventId).toBe('evt-1b');
		quizRepository.removeSyncedEvent('exam');
		expect(quizRepository.getSyncedEvents().map((row) => row.source)).toEqual(['assignment:week-1-checkpoint']);
		for (const row of quizRepository.getSyncedEvents()) quizRepository.removeSyncedEvent(row.source);
		expect(quizRepository.getSyncedEvents()).toHaveLength(0);
	});
});
