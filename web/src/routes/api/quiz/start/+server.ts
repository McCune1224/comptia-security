import { json } from '@sveltejs/kit';
import type { Domain, SessionMode, SessionType } from '$lib/types';
import { apiError, readJson } from '$lib/server/api';
import { quizService } from '$lib/server/quiz';

export async function POST({ request }: { request: Request }) {
	try {
		const body = await readJson(request);
		const type = body.type;
		const mode = body.mode;
		const count = body.count;
		const domain = body.domain;
		const assignmentId = body.assignmentId;
		if (
			typeof type !== 'string' ||
			!['quiz', 'scenario', 'pbq', 'full'].includes(type) ||
			(mode !== undefined && (typeof mode !== 'string' || !['practice', 'exam'].includes(mode))) ||
			(count !== undefined &&
				(typeof count !== 'number' || !Number.isInteger(count) || count < 1)) ||
			(domain !== undefined &&
				(typeof domain !== 'number' || !Number.isInteger(domain) || domain < 1 || domain > 5)) ||
			(assignmentId !== undefined && typeof assignmentId !== 'string')
		)
			return json(
				{ error: { code: 'INVALID_REQUEST', message: 'Invalid start-session fields.' } },
				{ status: 400 }
			);
		return json({
			session: quizService.startSession({
				type: type as SessionType,
				...(mode ? { mode: mode as SessionMode } : {}),
				...(count ? { count } : {}),
				...(domain ? { domain: domain as Domain } : {}),
				...(assignmentId ? { assignmentId: assignmentId as string } : {})
			})
		});
	} catch (error) {
		return apiError(error);
	}
}
