import { json, type RequestEvent } from '@sveltejs/kit';
import type { CourseId } from '$lib/types';
import { ACTIVE_COURSES, COURSE_META } from '$lib/server/course';
import { quizRepository } from '$lib/server/db';
import { resolveScope } from '$lib/server/scope';

const SCOPE_COOKIE = {
	path: '/',
	maxAge: 60 * 60 * 24 * 365, // 1 year
	sameSite: 'lax' as const
};

/** Current scope + available profiles and courses (drives both switchers). */
export function GET(event: RequestEvent) {
	const scope = resolveScope(event);
	return json({
		scope,
		profiles: quizRepository.getProfiles(),
		courses: ACTIVE_COURSES.map((id) => ({
			id,
			title: COURSE_META[id]?.title ?? id,
			shortTitle: COURSE_META[id]?.title.split(' (')[0] ?? id
		}))
	});
}

export async function POST(event: RequestEvent) {
	const body = (await event.request.json().catch(() => null)) as Record<string, unknown> | null;
	if (!body || typeof body.action !== 'string')
		return json({ error: { code: 'INVALID_REQUEST', message: 'action is required.' } }, { status: 400 });

	// Switch the active profile and/or course (cookies only — no auth).
	if (body.action === 'switch') {
		const scope = resolveScope(event);
		const profileId =
			typeof body.profileId === 'string' &&
			quizRepository.getProfiles().some((profile) => profile.id === body.profileId)
				? body.profileId
				: scope.profileId;
		const courseId =
			typeof body.courseId === 'string' && (ACTIVE_COURSES as string[]).includes(body.courseId)
				? (body.courseId as CourseId)
				: scope.courseId;
		event.cookies.set('profile_id', profileId, SCOPE_COOKIE);
		event.cookies.set('course_id', courseId, SCOPE_COOKIE);
		return json({ ok: true, scope: { profileId, courseId } });
	}

	// Create a profile (hard cap of MAX_PROFILES enforced in the repo).
	if (body.action === 'create') {
		if (typeof body.name !== 'string' || body.name.trim().length === 0)
			return json({ error: { code: 'INVALID_REQUEST', message: 'name is required.' } }, { status: 400 });
		const color = typeof body.color === 'string' ? body.color : '#b7f04c';
		try {
			const profile = quizRepository.createProfile(body.name.trim().slice(0, 24), color);
			return json({ ok: true, profile });
		} catch (error) {
			return json({ error: { code: 'PROFILE_CAP', message: (error as Error).message } }, { status: 400 });
		}
	}

	// Rename a profile.
	if (body.action === 'rename') {
		if (typeof body.profileId !== 'string' || typeof body.name !== 'string' || body.name.trim().length === 0)
			return json({ error: { code: 'INVALID_REQUEST', message: 'profileId and name are required.' } }, { status: 400 });
		quizRepository.renameProfile(body.profileId, body.name.trim().slice(0, 24));
		return json({ ok: true });
	}

	return json({ error: { code: 'INVALID_REQUEST', message: `Unknown scope action: ${body.action}` } }, { status: 400 });
}

export function DELETE(event: RequestEvent) {
	const profileId = event.url.searchParams.get('profileId');
	if (!profileId)
		return json({ error: { code: 'INVALID_REQUEST', message: 'profileId is required.' } }, { status: 400 });
	if (profileId === resolveScope(event).profileId)
		return json(
			{ error: { code: 'ACTIVE_PROFILE', message: 'Switch away from the profile before deleting it.' } },
			{ status: 400 }
		);
	try {
		quizRepository.deleteProfile(profileId);
		return json({ ok: true });
	} catch (error) {
		return json({ error: { code: 'INVALID_REQUEST', message: (error as Error).message } }, { status: 400 });
	}
}
