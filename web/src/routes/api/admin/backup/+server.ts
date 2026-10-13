import { json, type RequestEvent } from '@sveltejs/kit';
import { apiError, readJson } from '$lib/server/api';
import { ProgressBackupError, parseProgressBackup } from '$lib/server/backup';
import { toDateKey } from '$lib/server/course';
import { resolveScope } from '$lib/server/scope';
import { scopedServices } from '$lib/server/services';

/**
 * Profile+course progress backup, scoped to the ACTIVE profile + course
 * (resolved server-side from the scope cookies).
 *
 * GET downloads the backup as JSON; POST restores one into the active scope
 * (same courseId required, session ids remapped, progress wiped first).
 */
export async function GET(event: RequestEvent) {
	const scope = await resolveScope(event);
	const backup = await scopedServices(scope).repo.exportProgress();
	const stamp = toDateKey(new Date()).replaceAll('-', '');
	return json(backup, {
		headers: {
			'content-disposition': `attachment; filename="course-progress-${scope.profileId}-${scope.courseId}-${stamp}.json"`
		}
	});
}

export async function POST(event: RequestEvent) {
	try {
		const body = await readJson(event.request);
		let backup;
		try {
			backup = parseProgressBackup(body);
		} catch (error) {
			if (error instanceof ProgressBackupError)
				return json({ error: { code: 'INVALID_BACKUP', message: error.message } }, { status: 400 });
			throw error;
		}
		const scope = await resolveScope(event);
		if (backup.courseId !== scope.courseId)
			return json(
				{
					error: {
						code: 'COURSE_MISMATCH',
						message: `This backup is for ${backup.courseId}; switch to that course before importing it.`
					}
				},
				{ status: 400 }
			);
		await scopedServices(scope).repo.importProgress(backup);
		return json({ ok: true, scope, importedAt: new Date().toISOString() });
	} catch (error) {
		return apiError(error);
	}
}
