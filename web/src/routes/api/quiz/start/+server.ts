import { json, type RequestEvent } from '@sveltejs/kit';
import type { Domain, QuestionStyle, SessionMode, SessionType } from '$lib/types';
import { apiError, readJson } from '$lib/server/api';
import { resolveScope } from '$lib/server/scope';
import { scopedServices } from '$lib/server/services';

export async function POST(event: RequestEvent) {
	try {
		const body = await readJson(event.request);
		const type = body.type;
		const mode = body.mode;
		const count = body.count;
		const domain = body.domain;
		const objective = body.objective;
		const assignmentId = body.assignmentId;
		const reviewSource = body.reviewSource;
		const style = body.style;
		if (
			typeof type !== 'string' ||
			!['quiz', 'scenario', 'pbq', 'full', 'review'].includes(type) ||
			(mode !== undefined && (typeof mode !== 'string' || !['practice', 'exam'].includes(mode))) ||
			(count !== undefined &&
				(typeof count !== 'number' || !Number.isInteger(count) || count < 1)) ||
			(domain !== undefined &&
				(typeof domain !== 'number' || !Number.isInteger(domain) || domain < 1 || domain > 5)) ||
			(objective !== undefined &&
				(typeof objective !== 'string' || !/^[1-5]\.[1-9]$/.test(objective))) ||
			(assignmentId !== undefined && typeof assignmentId !== 'string') ||
			(reviewSource !== undefined && reviewSource !== 'daily' && reviewSource !== 'wall') ||
			(style !== undefined &&
				(typeof style !== 'string' ||
					!['recall', 'scenario', 'keyword', 'short-form', 'mixed'].includes(style)))
		)
			return json(
				{ error: { code: 'INVALID_REQUEST', message: 'Invalid start-session fields.' } },
				{ status: 400 }
			);
		return json({
			session: scopedServices(resolveScope(event)).quiz.startSession({
				type: type as SessionType,
				...(mode ? { mode: mode as SessionMode } : {}),
				...(count ? { count } : {}),
				...(domain ? { domain: domain as Domain } : {}),
				...(objective ? { objective: objective as `1.1` } : {}),
				...(assignmentId ? { assignmentId: assignmentId as string } : {}),
				...(reviewSource ? { reviewSource: reviewSource as 'daily' | 'wall' } : {}),
				...(style ? { style: style as QuestionStyle } : {})
			})
		});
	} catch (error) {
		return apiError(error);
	}
}
