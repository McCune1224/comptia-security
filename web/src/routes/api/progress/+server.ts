import { json, type RequestEvent } from '@sveltejs/kit';
import { resolveScope } from '$lib/server/scope';
import { scopedServices } from '$lib/server/services';

export async function GET(event: RequestEvent) {
	const services = scopedServices(await resolveScope(event));
	return json({
		progress: await services.repo.getAllDomainProgress(),
		recentSessions: (await services.repo.getRecentSessions(5)).map((session) => ({
			id: session.id,
			date: session.completed_at,
			type: session.type,
			earnedPoints: session.points_earned,
			possiblePoints: session.points_possible,
			percentage: session.points_possible
				? Math.round((session.points_earned / session.points_possible) * 1000) / 10
				: 0
		})),
		weakTopics: await services.repo.getWeakTopics(),
		activeSession: await services.quiz.getActiveSession()
	});
}
