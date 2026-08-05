import { json } from '@sveltejs/kit';
import { apiError, readJson } from '$lib/server/api';
import { courseService } from '$lib/server/course-service';

export async function POST({ request }: { request: Request }) {
	try {
		const body = await readJson(request);
		if (typeof body.examDate !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(body.examDate))
			return json(
				{ error: { code: 'INVALID_REQUEST', message: 'examDate must be YYYY-MM-DD.' } },
				{ status: 400 }
			);
		courseService.setExamDate(body.examDate);
		return json({ ok: true, examDate: body.examDate });
	} catch (error) {
		return apiError(error);
	}
}
