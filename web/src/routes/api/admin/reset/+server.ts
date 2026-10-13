import { json, type RequestEvent } from '@sveltejs/kit';
import { apiError, readJson } from '$lib/server/api';
import { resolveScope } from '$lib/server/scope';
import { scopedServices } from '$lib/server/services';

/**
 * Full progress reset for the ACTIVE profile + course (resolved server-side
 * from the scope cookies). Requires the explicit `{ confirm: true }` gate —
 * quiz sessions/answers, domain progress, review cards, study log, assignment
 * submissions and lesson completions are irreversibly deleted; profiles,
 * course content, the exam date and due-date overrides survive.
 */
export async function POST(event: RequestEvent) {
	try {
		const body = await readJson(event.request);
		if (body.confirm !== true)
			return json(
				{
					error: {
						code: 'CONFIRMATION_REQUIRED',
						message: 'Send { confirm: true } to reset progress for this profile and course.'
					}
				},
				{ status: 400 }
			);
		const scope = await resolveScope(event);
		await scopedServices(scope).repo.resetProgress();
		return json({ ok: true, scope });
	} catch (error) {
		return apiError(error);
	}
}
