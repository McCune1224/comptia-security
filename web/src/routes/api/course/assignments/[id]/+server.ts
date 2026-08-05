import { json } from '@sveltejs/kit';
import { courseService } from '$lib/server/course-service';

export function GET({ params }: { params: { id: string } }) {
	const assignment = courseService.getAssignment(params.id);
	if (!assignment)
		return json(
			{ error: { code: 'NOT_FOUND', message: 'Assignment not found.' } },
			{ status: 404 }
		);
	return json(assignment);
}
