import { json } from '@sveltejs/kit';
import { getAllDomainProgress, getRecentSessions, getWeakTopics } from '$lib/server/db';

export function GET() {
	const progress = getAllDomainProgress();
	const recentSessions = getRecentSessions(5);
	const weakTopics = getWeakTopics();

	return json({
		progress,
		recentSessions: recentSessions.map(s => ({
			id: s.id,
			date: s.completed_at,
			type: s.type,
			score: `${s.correct_answers}/${s.total_questions}`,
			percentage: s.total_questions > 0
				? Math.round((s.correct_answers / s.total_questions) * 100)
				: 0,
		})),
		weakTopics,
	});
}
