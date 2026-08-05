import { json } from '@sveltejs/kit';
import { apiError, readJson } from '$lib/server/api';
import { courseService } from '$lib/server/course-service';

export async function POST({ params, request }: { params: { id: string }; request: Request }) {
	try {
		const body = await readJson(request);
		if (typeof body.completed !== 'boolean')
			return json(
				{ error: { code: 'INVALID_REQUEST', message: 'completed must be a boolean.' } },
				{ status: 400 }
			);
		if (!courseService.getLesson(params.id))
			return json({ error: { code: 'NOT_FOUND', message: 'Lesson not found.' } }, { status: 404 });
		courseService.setLessonCompleted(params.id, body.completed);
		return json({ ok: true, lessonId: params.id, completed: body.completed });
	} catch (error) {
		return apiError(error);
	}
}
