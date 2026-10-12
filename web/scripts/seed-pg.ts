#!/usr/bin/env node
/**
 * Seed a PostgreSQL database with course content + default profiles.
 *
 * Run `npm run db:setup` first. Idempotent: profiles keep user edits
 * (ON CONFLICT DO NOTHING), course content upserts so content updates
 * reach existing databases.
 *
 * Requires DATABASE_URL in the environment (web/.env is not read here).
 */
import postgres from 'postgres';
import { seedCourseContent } from '../src/lib/server/pg-seed';

async function seed() {
	const connectionString = process.env.DATABASE_URL;
	if (!connectionString) {
		console.error('DATABASE_URL environment variable is required');
		process.exit(1);
	}

	const sql = postgres(connectionString, { max: 1 });
	try {
		console.log('Seeding PostgreSQL database...');
		await seedCourseContent(sql);
		console.log('Database seed complete!');
	} catch (error) {
		console.error('Seed failed:', error);
		process.exit(1);
	} finally {
		await sql.end();
	}
}

seed();
