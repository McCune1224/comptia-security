import { json, type RequestEvent } from '@sveltejs/kit';
import { resolveScope } from '$lib/server/scope';
import { scopedServices } from '$lib/server/services';

export function GET(event: RequestEvent) {
	const overview = scopedServices(resolveScope(event)).course.getOverview();
	return json({
		modules: overview.modules,
		examDate: overview.examDate,
		daysUntilExam: overview.daysUntilExam
	});
}
