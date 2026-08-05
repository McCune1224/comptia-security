import { json } from '@sveltejs/kit';
import { courseService } from '$lib/server/course-service';

export function GET() {
	return json({ gradebook: courseService.getGradebook(), readiness: courseService.getReadiness() });
}
