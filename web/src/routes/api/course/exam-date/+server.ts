import { json, type RequestEvent } from '@sveltejs/kit';
import { apiError, readJson } from '$lib/server/api';
import { parseDateKey } from '$lib/server/course';
import { resolveScope } from '$lib/server/scope';
import { scopedServices } from '$lib/server/services';

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
		await scopedServices(await resolveScope(event)).course.setExamDate(examDate);
		return json({ ok: true, examDate });
	} catch (error) {
		return apiError(error);
	}
}
