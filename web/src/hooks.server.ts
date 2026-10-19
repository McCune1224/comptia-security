import type { ServerInit } from '@sveltejs/kit';
import { ensureSchema } from '$lib/server/db-pg';

/**
 * Runs once when the server starts, before it answers its first request.
 *
 * `schema-pg.ts` is DDL that nothing else runs at runtime, so without this a
 * release that adds a table 500s until someone remembers to run
 * `npm run db:setup` against the deployed database (Railway, the Pi, anywhere).
 * Applying it here makes a deploy self-heal. `applyPgSchema` is
 * `CREATE ... IF NOT EXISTS` throughout, so an up-to-date database pays only a
 * handful of no-op statements.
 *
 * Seeding is deliberately NOT done here — `npm run db:seed` still owns course
 * content and default profiles, because that writes rows rather than creating
 * the shape they live in.
 */
export const init: ServerInit = async () => {
	try {
		await ensureSchema();
	} catch (error) {
		// Never block startup on the database: a transient outage should not put
		// the service into a boot loop. Requests surface the real error, and this
		// line is what shows up in the deploy logs.
		console.error('[startup] could not apply the database schema:', error);
	}
};
