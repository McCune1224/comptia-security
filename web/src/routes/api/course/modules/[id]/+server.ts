import { json, type RequestEvent } from '@sveltejs/kit';
import { resolveScope } from '$lib/server/scope';
import { scopedServices } from '$lib/server/services';

export function GET(event: RequestEvent<{ id: string }>) {
	const module = scopedServices(resolveScope(event)).course.getModule(event.params.id);
	if (!module)
		return json({ error: { code: 'NOT_FOUND', message: 'Module not found.' } }, { status: 404 });
	return json(module);
}
