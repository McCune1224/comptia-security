import { json, type RequestEvent } from '@sveltejs/kit';
import { apiError, readJson } from '$lib/server/api';
import { QuizServiceError } from '$lib/server/quiz';
import { parseDateKey } from '$lib/server/course';
import { resolveScope } from '$lib/server/scope';
import { scopedServices } from '$lib/server/services';

/**
 * Explicit due-date override for one assignment in the active scope.
 * `{ dueDate: 'YYYY-MM-DD' }` sets it; `{ dueDate: null }` clears it so the
 * exam-anchored schedule derives the date again.
 */
export async function POST(event: RequestEvent) {
	try {
		const body = await readJson(event.request);
		if (typeof body.assignmentId !== 'string' || body.assignmentId.length === 0)
			return json(
				{ error: { code: 'INVALID_REQUEST', message: 'assignmentId is required.' } },
				{ status: 400 }
			);
		if (body.dueDate !== null && body.dueDate !== undefined && typeof body.dueDate !== 'string')
			return json(
				{ error: { code: 'INVALID_REQUEST', message: 'dueDate must be a string or null.' } },
				{ status: 400 }
			);
		const dueDate = body.dueDate == null ? null : parseDateKey(body.dueDate);
		if (body.dueDate != null && dueDate === null)
			return json(
				{ error: { code: 'INVALID_REQUEST', message: 'dueDate must be a real YYYY-MM-DD date.' } },
				{ status: 400 }
			);
		const scope = await resolveScope(event);
		await scopedServices(scope).course.setDueDateOverride(body.assignmentId, dueDate);
		return json({ ok: true, assignmentId: body.assignmentId, dueDate });
	} catch (error) {
		if (error instanceof QuizServiceError)
			return json({ error: { code: error.code, message: error.message } }, { status: 400 });
		return apiError(error);
	}
}
