import type { RequestEvent } from '@sveltejs/kit';
import { exportDeadlinesIcs } from '$lib/server/calendar-files';
import { resolveScope } from '$lib/server/scope';

/**
 * Downloads the course deadlines as an .ics file for any calendar app.
 * `text/calendar` + a filename means the browser saves it as `…-deadlines-….ics`,
 * ready to import into Proton Calendar (Settings → Import/export → Import from ICS).
 */
export async function GET(event: RequestEvent) {
	const scope = await resolveScope(event);
	const { filename, ics } = await exportDeadlinesIcs(scope, event.url.origin);
	return new Response(ics, {
		headers: {
			'content-type': 'text/calendar; charset=utf-8',
			'content-disposition': `attachment; filename="${filename}"`,
			'cache-control': 'no-store'
		}
	});
}
