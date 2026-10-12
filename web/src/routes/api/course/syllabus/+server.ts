import { json, type RequestEvent } from '@sveltejs/kit';
import { resolveScope } from '$lib/server/scope';
import { scopedServices } from '$lib/server/services';

export async function GET(event: RequestEvent) {
	const overview = await scopedServices(await resolveScope(event)).course.getOverview();
	return json({
		modules: overview.modules,
		examDate: overview.examDate,
		daysUntilExam: overview.daysUntilExam
	});
}
