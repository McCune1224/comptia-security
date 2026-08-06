import { json, type RequestEvent } from '@sveltejs/kit';
import { resolveScope } from '$lib/server/scope';
import { scopedServices } from '$lib/server/services';

export function GET(event: RequestEvent) {
	const services = scopedServices(resolveScope(event));
	return json({ gradebook: services.course.getGradebook(), readiness: services.course.getReadiness() });
}
