import { json, type RequestEvent } from '@sveltejs/kit';
import { apiError, readJson } from '$lib/server/api';
import { resolveScope } from '$lib/server/scope';
import { scopedServices } from '$lib/server/services';

export async function POST(event: RequestEvent<{ id: string }>) {
	try {
		const body = await readJson(event.request);
		if (typeof body.completed !== 'boolean')
			return json(
				{ error: { code: 'INVALID_REQUEST', message: 'completed must be a boolean.' } },
				{ status: 400 }
			);
		const services = scopedServices(resolveScope(event));
		if (!services.course.getLesson(event.params.id))
			return json({ error: { code: 'NOT_FOUND', message: 'Lesson not found.' } }, { status: 404 });
		services.course.setLessonCompleted(event.params.id, body.completed);
		return json({ ok: true, lessonId: event.params.id, completed: body.completed });
	} catch (error) {
		return apiError(error);
	}
}
