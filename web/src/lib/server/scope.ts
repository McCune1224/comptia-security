import type { RequestEvent } from '@sveltejs/kit';
import type { CourseId } from '$lib/types';
import { ACTIVE_COURSES } from './course';
import { DEFAULT_SCOPE, quizRepository, type Scope } from './db';

/**
 * Resolves the active profile + course from cookies, falling back to the
 * seeded default scope on unknown/missing values. No auth — local study app.
 */
export function resolveScope(event: RequestEvent): Scope {
	const cookieProfile = event.cookies.get('profile_id');
	const profiles = quizRepository.getProfiles();
	const selectedProfile = profiles.find((profile) => profile.id === cookieProfile);
	const profileId = selectedProfile?.id ?? DEFAULT_SCOPE.profileId;
	const cookieCourse = event.cookies.get('course_id');
	const courseId =
		cookieCourse && (ACTIVE_COURSES as string[]).includes(cookieCourse)
			? (cookieCourse as CourseId)
			: (selectedProfile?.courseId as CourseId | undefined) ?? DEFAULT_SCOPE.courseId;
	return { profileId, courseId };
}
