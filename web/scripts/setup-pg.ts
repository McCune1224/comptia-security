#!/usr/bin/env node
/**
 * Set up a fresh PostgreSQL database with the app schema.
 *
 * This is the documented way to initialize a database:
 *   npm run db:setup   # create tables + indexes (idempotent)
 *   npm run db:seed    # seed course content + default profiles
 *   npm run db:migrate # optionally import legacy data from data/quiz.db
 *
 * Requires DATABASE_URL in the environment (web/.env is not read here).
 */
import postgres from 'postgres';
import { applyPgSchema } from '../src/lib/server/schema-pg';

async function setup() {
	const connectionString = process.env.DATABASE_URL;
	if (!connectionString) {
		console.error('DATABASE_URL environment variable is required');
		process.exit(1);
	}

	const sql = postgres(connectionString, { max: 1 });
	try {
		console.log('Setting up PostgreSQL database...');
		await applyPgSchema(sql);
		console.log('Database setup complete!');
	} catch (error) {
		console.error('Setup failed:', error);
		process.exit(1);
	} finally {
		await sql.end();
	}
}

setup();
