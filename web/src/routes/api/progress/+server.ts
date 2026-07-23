import { json } from '@sveltejs/kit';
import { quizRepository } from '$lib/server/db';
import { quizService } from '$lib/server/quiz';

export function GET() {
	return json({ progress: quizRepository.getAllDomainProgress(), recentSessions: quizRepository.getRecentSessions(5).map((session) => ({ id: session.id, date: session.completed_at, type: session.type, earnedPoints: session.points_earned, possiblePoints: session.points_possible, percentage: session.points_possible ? Math.round(session.points_earned / session.points_possible * 1000) / 10 : 0 })), weakTopics: quizRepository.getWeakTopics(), activeSession: quizService.getActiveSession() });
}
