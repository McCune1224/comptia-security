import { json } from '@sveltejs/kit';
import { getMasteryMatrix } from '$lib/server/mastery';

export async function GET() {
	return json(getMasteryMatrix());
}
