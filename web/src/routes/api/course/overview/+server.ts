import { json } from '@sveltejs/kit';
import { courseService } from '$lib/server/course-service';

export function GET() {
	return json(courseService.getOverview());
}
