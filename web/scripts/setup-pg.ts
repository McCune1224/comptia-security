#!/usr/bin/env node
/**
 * Setup PostgreSQL database with schema.
 * Usage: npx tsx scripts/setup-pg.ts
 * Requires DATABASE_URL environment variable.
 */
import postgres from 'postgres';
import fs from 'node:fs';
import path from 'node:path';

async function setup() {
    const connectionString = process.env.DATABASE_URL;
    if (!connectionString) {
        console.error('DATABASE_URL environment variable is required');
        process.exit(1);
    }

    const sql = postgres(connectionString, { max: 10 });

    try {
        console.log('Setting up PostgreSQL database...');

        // Read and execute schema
        const schemaPath = path.join(process.cwd(), 'src/lib/server/schema-pg.sql');
        const schema = fs.readFileSync(schemaPath, 'utf-8');

        // Split by semicolons and execute each statement
        const statements = schema
            .split(';')
            .map(s => s.trim())
            .filter(s => s.length > 0);

        for (const statement of statements) {
            try {
                await sql.unsafe(statement);
            } catch (error: any) {
                // Ignore "already exists" errors
                if (!error.message?.includes('already exists')) {
                    console.error('Error executing statement:', statement.substring(0, 100));
                    throw error;
                }
            }
        }

        console.log('Database setup complete!');
    } catch (error) {
        console.error('Setup failed:', error);
        process.exit(1);
    } finally {
        await sql.end();
    }
}

setup();
