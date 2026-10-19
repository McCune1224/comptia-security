#!/usr/bin/env node
// Wipes per-user runtime data from the PostgreSQL database, preserving profiles
// and seeded course content (modules, lessons, assignments).
//
// Usage: node scripts/reset-runtime.mjs [--database-url <url>] --yes
// Falls back to DATABASE_URL when --database-url is omitted.

import { resolve } from 'node:path';
import { pathToFileURL } from 'node:url';
import postgres from 'postgres';

// Children of quiz_sessions first (foreign keys are enforced during the wipe).
// This list must stay identical to PG_RUNTIME_TABLES in
// src/lib/server/schema-pg.ts — reset-runtime.test.ts asserts that it does, so
// adding a table there without adding it here fails the suite instead of
// silently leaving user data behind after a reset.
export const runtimeTables = [
	'quiz_answers',
	'quiz_session_responses',
	'quiz_session_state',
	'quiz_sessions',
	'domain_progress',
	'review_cards',
	'study_log',
	'course_meta',
	'course_assignment_submissions',
	'course_assignment_overrides',
	'course_lesson_completions',
	'google_oauth',
	'google_synced_events',
	'calendar_imports'
];

const isCli =
	Boolean(process.argv[1]) && import.meta.url === pathToFileURL(resolve(process.argv[1])).href;

if (isCli) {
	const args = process.argv.slice(2);
	const urlFlag = args.indexOf('--database-url');
	const databaseUrl = urlFlag >= 0 ? args[urlFlag + 1] : process.env.DATABASE_URL;
	const confirmed = args.includes('--yes');

	if (!databaseUrl || !confirmed) {
		console.error('Usage: node scripts/reset-runtime.mjs [--database-url <url>] --yes');
		console.error('Refusing to reset without a database URL and --yes.');
		process.exit(2);
	}

	const sql = postgres(databaseUrl, { max: 1 });

	try {
		await sql.begin(async (tx) => {
			for (const table of runtimeTables) await tx.unsafe(`DELETE FROM "${table}"`);
		});

		console.log(`Reset ${runtimeTables.length} runtime tables`);
		for (const table of runtimeTables) {
			const rows = await sql.unsafe(`SELECT COUNT(*)::int AS count FROM "${table}"`);
			console.log(`${table}: ${rows[0].count}`);
		}

		console.log('Profiles preserved:');
		const profiles =
			await sql`SELECT id, name, course_id AS "courseId" FROM profiles ORDER BY created_at`;
		for (const profile of profiles)
			console.log(`${profile.id}: ${profile.name} -> ${profile.courseId}`);
	} finally {
		await sql.end();
	}
}
