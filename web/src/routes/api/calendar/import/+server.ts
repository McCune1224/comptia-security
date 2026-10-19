import { json, type RequestEvent } from '@sveltejs/kit';
import {
	CalendarFileError,
	MAX_IMPORT_BYTES,
	clearCalendarImport,
	getCalendarImport,
	importCalendarIcs
} from '$lib/server/calendar-files';
import { resolveScope } from '$lib/server/scope';

/**
 * The scope's imported .ics calendar (the no-API-key way to see your real
 * events next to course deadlines).
 *
 * GET    → import status + every event in the stored file
 * POST   → replace the import with the uploaded file as a raw `text/calendar`
 *          body (`?name=` labels it). Not a form content type, so SvelteKit's
 *          CSRF guard does not apply, and the body is the file byte for byte.
 * DELETE → remove the import
 *
 * Note: adapter-node rejects request bodies over `BODY_SIZE_LIMIT` (512 KB by
 * default) before this route runs — see CALENDAR-FILES.md.
 */
export async function GET(event: RequestEvent) {
	const scope = await resolveScope(event);
	return json(await getCalendarImport(scope));
}

export async function POST(event: RequestEvent) {
	const scope = await resolveScope(event);

	// Reject a declared-oversized upload before buffering it.
	const declared = Number(event.request.headers.get('content-length') ?? '');
	if (Number.isFinite(declared) && declared > MAX_IMPORT_BYTES)
		return json(
			{
				error: {
					code: 'FILE_TOO_LARGE',
					message: `That file is larger than ${MAX_IMPORT_BYTES / 1024 / 1024} MB.`
				}
			},
			{ status: 413 }
		);

	let text: string;
	try {
		text = await event.request.text();
	} catch {
		// The adapter aborts the stream once the body passes BODY_SIZE_LIMIT.
		return json(
			{
				error: {
					code: 'FILE_TOO_LARGE',
					message: 'That file is too large for the server to accept.'
				}
			},
			{ status: 413 }
		);
	}
	if (!text.trim())
		return json(
			{ error: { code: 'INVALID_REQUEST', message: 'The uploaded file is empty.' } },
			{ status: 400 }
		);

	const name = event.url.searchParams.get('name') ?? 'Imported calendar';
	try {
		return json({ ok: true, ...(await importCalendarIcs(scope, name, text)) });
	} catch (error) {
		if (error instanceof CalendarFileError)
			return json(
				{ error: { code: error.code, message: error.message } },
				{ status: error.code === 'FILE_TOO_LARGE' ? 413 : 400 }
			);
		throw error;
	}
}

export async function DELETE(event: RequestEvent) {
	const scope = await resolveScope(event);
	await clearCalendarImport(scope);
	return json({ ok: true });
}
