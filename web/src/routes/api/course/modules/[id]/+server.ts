import { json } from '@sveltejs/kit';
import { courseService } from '$lib/server/course-service';

export function GET({ params }: { params: { id: string } }) {
	const module = courseService.getModule(params.id);
	if (!module)
		return json({ error: { code: 'NOT_FOUND', message: 'Module not found.' } }, { status: 404 });
	return json(module);
}
