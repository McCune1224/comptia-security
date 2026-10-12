import { json, type RequestEvent } from '@sveltejs/kit';
import { resolveScope } from '$lib/server/scope';
import { scopedServices } from '$lib/server/services';

export async function GET(event: RequestEvent) {
	const services = scopedServices(await resolveScope(event));
	return json({
		gradebook: await services.course.getGradebook(),
		readiness: await services.course.getReadiness()
	});
}
