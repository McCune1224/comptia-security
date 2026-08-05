import { json } from '@sveltejs/kit';
import { reviewService } from '$lib/server/review';

export async function GET() {
	const summary = reviewService.summary();
	return json({ summary, wall: reviewService.wallItems() });
}
