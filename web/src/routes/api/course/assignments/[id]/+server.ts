import { json, type RequestEvent } from '@sveltejs/kit';
import { resolveScope } from '$lib/server/scope';
import { scopedServices } from '$lib/server/services';

export function GET(event: RequestEvent<{ id: string }>) {
	const assignment = scopedServices(resolveScope(event)).course.getAssignment(event.params.id);
	if (!assignment)
		return json({ error: { code: 'NOT_FOUND', message: 'Assignment not found.' } }, { status: 404 });
	return json(assignment);
}
