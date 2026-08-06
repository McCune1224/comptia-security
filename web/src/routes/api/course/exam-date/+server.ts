import { json, type RequestEvent } from '@sveltejs/kit';
import { apiError, readJson } from '$lib/server/api';
import { resolveScope } from '$lib/server/scope';
import { scopedServices } from '$lib/server/services';

export async function POST(event: RequestEvent) {
	try {
		const body = await readJson(event.request);
		if (typeof body.examDate !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(body.examDate))
			return json(
				{ error: { code: 'INVALID_REQUEST', message: 'examDate must be YYYY-MM-DD.' } },
				{ status: 400 }
			);
		scopedServices(resolveScope(event)).course.setExamDate(body.examDate);
		return json({ ok: true, examDate: body.examDate });
	} catch (error) {
		return apiError(error);
	}
}
