import { describe, expect, it } from 'vitest';
import { planDeadlineEvents } from './calendar-events';
import { createTestRepository } from './test-db';
import { assignmentDueDate } from './course';

function toKey(date: Date): string {
	return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
}

describe('planDeadlineEvents', () => {
	it('starts with the exam and includes every assignment, with unique sources', async () => {
		const repo = await createTestRepository();
		const planned = await planDeadlineEvents();
		expect(planned[0]).toMatchObject({ source: 'exam' });
		expect(planned.length).toBe((await repo.getCourseAssignments()).length + 1);
		expect(new Set(planned.map((item) => item.source)).size).toBe(planned.length);
		await repo.close();
	});

	it('matches the course scheduler exactly (exam date + due offsets)', async () => {
		const repo = await createTestRepository();
		const examDate = await repo.getExamDate();
		const planned = await planDeadlineEvents();
		expect(planned.find((item) => item.source === 'exam')?.date).toBe(examDate);
		for (const assignment of await repo.getCourseAssignments()) {
			const item = planned.find((p) => p.source === `assignment:${assignment.id}`);
			expect(item, `missing planned event for ${assignment.id}`).toBeDefined();
			expect(item?.date).toBe(toKey(assignmentDueDate(assignment, examDate)));
		}
		await repo.close();
	});

	it('every planned event has a summary and a YYYY-MM-DD date', async () => {
		for (const item of await planDeadlineEvents()) {
			expect(item.summary.length).toBeGreaterThan(0);
			expect(item.date).toMatch(/^\d{4}-\d{2}-\d{2}$/);
		}
	});
});
