import postgres from 'postgres';
import { createPgQuizRepository, testDatabaseUrl } from './db-pg';
import { applyPgSchema, PG_ALL_TABLES } from './schema-pg';
import { seedCourseContent } from './pg-seed';
import { createScopedRepo, type QuizRepository, type Scope } from './db';

export { testDatabaseUrl };

/**
 * Fresh, fully seeded repository against the isolated test database:
 * applies the schema, wipes every table, reseeds content + profiles.
 */
export async function createTestRepository(scope?: Scope): Promise<QuizRepository> {
	const url = testDatabaseUrl();
	const sql = postgres(url, { max: 5 });
	try {
		await applyPgSchema(sql);
		await sql.unsafe(`TRUNCATE ${PG_ALL_TABLES.join(', ')} CASCADE`);
		await seedCourseContent(sql);
	} finally {
		await sql.end({ timeout: 5 });
	}
	const repo = createPgQuizRepository(url);
	return scope ? createScopedRepo(repo, scope) : repo;
}
