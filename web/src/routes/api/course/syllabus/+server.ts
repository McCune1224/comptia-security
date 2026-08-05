import { json } from '@sveltejs/kit';
import { courseService } from '$lib/server/course-service';

export function GET() {
	return json({
		modules: courseService.getSyllabus(),
		examDate: courseService.getOverview().examDate,
		daysUntilExam: courseService.getOverview().daysUntilExam
	});
}
