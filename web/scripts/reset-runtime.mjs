import Database from 'better-sqlite3';

const args = process.argv.slice(2);
const dbFlag = args.indexOf('--db');
const dbPath = dbFlag >= 0 ? args[dbFlag + 1] : undefined;
const confirmed = args.includes('--yes');

if (!dbPath || dbPath.startsWith(':') || !confirmed) {
	console.error('Usage: node scripts/reset-runtime.mjs --db /absolute/path/to/quiz.db --yes');
	console.error('Refusing to reset without an explicit database path and --yes.');
	process.exit(2);
}

const runtimeTables = [
	'quiz_session_responses',
	'quiz_session_state',
	'quiz_sessions',
	'quiz_answers',
	'domain_progress',
	'review_cards',
	'study_log',
	'course_meta',
	'course_assignment_submissions',
	'course_lesson_completions',
	'google_oauth',
	'google_synced_events'
];

const db = new Database(dbPath);
db.pragma('foreign_keys = ON');

try {
	const existingTables = new Set(
		db
			.prepare("SELECT name FROM sqlite_master WHERE type = 'table'")
			.all()
			.map(({ name }) => name)
	);
	const tables = runtimeTables.filter((table) => existingTables.has(table));

	const reset = db.transaction(() => {
		for (const table of tables) db.prepare(`DELETE FROM "${table}"`).run();
	});
	reset();

	console.log(`Reset ${tables.length} runtime tables in ${dbPath}`);
	for (const table of tables) {
		const { count } = db.prepare(`SELECT COUNT(*) AS count FROM "${table}"`).get();
		console.log(`${table}: ${count}`);
	}

	console.log('Profiles preserved:');
	for (const profile of db
		.prepare('SELECT id, name, course_id AS courseId FROM profiles ORDER BY created_at')
		.all()) {
		console.log(`${profile.id}: ${profile.name} -> ${profile.courseId}`);
	}
} finally {
	db.close();
}
