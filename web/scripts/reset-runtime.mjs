#!/usr/bin/env node
// Wipes per-user runtime data from the PostgreSQL database, preserving profiles
// and seeded course content (modules, lessons, assignments).
//
// Usage: node scripts/reset-runtime.mjs [--database-url <url>] --yes
// Falls back to DATABASE_URL when --database-url is omitted.

import postgres from 'postgres';

const args = process.argv.slice(2);
const urlFlag = args.indexOf('--database-url');
const databaseUrl = urlFlag >= 0 ? args[urlFlag + 1] : process.env.DATABASE_URL;
const confirmed = args.includes('--yes');

if (!databaseUrl || !confirmed) {
	console.error('Usage: node scripts/reset-runtime.mjs [--database-url <url>] --yes');
	console.error('Refusing to reset without a database URL and --yes.');
	process.exit(2);
}

// Children of quiz_sessions first (foreign keys are enforced during the wipe).
const runtimeTables = [
	'quiz_answers',
	'quiz_session_responses',
	'quiz_session_state',
	'quiz_sessions',
	'domain_progress',
	'review_cards',
	'study_log',
	'course_meta',
	'course_assignment_submissions',
	'course_lesson_completions',
	'google_oauth',
	'google_synced_events'
];

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
