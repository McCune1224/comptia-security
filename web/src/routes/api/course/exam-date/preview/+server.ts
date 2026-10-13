import { json, type RequestEvent } from '@sveltejs/kit';
import { apiError, readJson } from '$lib/server/api';
import { parseDateKey, toDateKey } from '$lib/server/course';
import { resolveScope } from '$lib/server/scope';
import { scopedServices } from '$lib/server/services';

/**
 * Dry-run for the exam-date editor: reports how every due date would move if
 * the exam moved to `examDate` — without saving anything. Overridden
 * assignments are flagged `overridden: true` and hold still.
 */
export async function POST(event: RequestEvent) {
	try {
		const body = await readJson(event.request);
		const examDate = parseDateKey(body.examDate);
		if (examDate === null)
			return json(
				{
					error: {
						code: 'INVALID_REQUEST',
						message: 'examDate must be a real calendar date in YYYY-MM-DD format.'
					}
				},
				{ status: 400 }
			);
		const shifts = await scopedServices(await resolveScope(event)).course.previewExamDate(examDate);
		return json({
			ok: true,
			examDate,
			shifts: shifts.map((shift) => ({
				assignmentId: shift.assignmentId,
				title: shift.title,
				overridden: shift.overridden,
				from: toDateKey(shift.from),
				to: toDateKey(shift.to)
			}))
		});
	} catch (error) {
		return apiError(error);
	}
}
