import { json, type RequestEvent } from '@sveltejs/kit';
import { resolveScope } from '$lib/server/scope';
import { scopedServices } from '$lib/server/services';

export function GET(event: RequestEvent) {
	const sessions = scopedServices(resolveScope(event)).repo.getAllCompletedSessions().map((session) => ({
		id: session.id,
		type: session.type,
		startedAt: session.started_at,
		completedAt: session.completed_at,
		earnedPoints: session.points_earned,
		possiblePoints: session.points_possible,
		percentage: session.points_possible > 0 ? Math.round((session.points_earned / session.points_possible) * 1000) / 10 : 0,
		duration: session.completed_at && session.started_at
			? Math.round((new Date(session.completed_at).getTime() - new Date(session.started_at).getTime()) / 60000)
			: null
	}));
	return json({ sessions });
}
