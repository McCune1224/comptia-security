import { json, type RequestEvent } from '@sveltejs/kit';
import { resolveScope } from '$lib/server/scope';
import { scopedServices } from '$lib/server/services';

export async function GET(event: RequestEvent) {
	const review = scopedServices(await resolveScope(event)).review;
	return json({ summary: await review.summary(), wall: await review.wallItems() });
}
