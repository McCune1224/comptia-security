import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { defineConfig, devices } from '@playwright/test';

const port = 4173;
const databasePath = path.join(os.tmpdir(), `comptia-security-e2e-${process.pid}.db`);

/**
 * The app is PostgreSQL-only. The e2e server needs a DATABASE_URL; prefer the
 * dedicated test database so runs never touch real progress. Load web/.env so
 * `npm run test:e2e` works without exporting variables by hand.
 */
function loadDotEnv(): Record<string, string> {
	const envPath = path.resolve('.env');
	if (!fs.existsSync(envPath)) return {};
	const entries: Record<string, string> = {};
	for (const line of fs.readFileSync(envPath, 'utf8').split('\n')) {
		const match = /^\s*([A-Z0-9_]+)\s*=\s*(.*)\s*$/.exec(line);
		if (match) entries[match[1]] = match[2].replace(/^["']|["']$/g, '');
	}
	return entries;
}

const fileEnv = loadDotEnv();
const databaseUrl =
	process.env.TEST_DATABASE_URL ??
	fileEnv.TEST_DATABASE_URL ??
	process.env.DATABASE_URL ??
	fileEnv.DATABASE_URL;

export default defineConfig({
	testDir: './e2e',
	fullyParallel: false,
	forbidOnly: Boolean(process.env.CI),
	retries: process.env.CI ? 2 : 0,
	workers: 1,
	reporter: process.env.CI ? 'line' : 'list',
	use: {
		baseURL: `http://127.0.0.1:${port}`,
		trace: 'retain-on-failure',
		screenshot: 'only-on-failure',
		video: 'retain-on-failure'
	},
	projects: [{ name: 'chromium', use: { ...devices['Desktop Chrome'] } }],
	webServer: {
		command: 'node build/index.js',
		port,
		env: {
			QUIZ_DB_PATH: databasePath,
			PORT: String(port),
			...(databaseUrl ? { DATABASE_URL: databaseUrl } : {})
		},
		reuseExistingServer: false,
		timeout: 120_000
	},
	globalTeardown: path.resolve('e2e/global-teardown.ts')
});

export function removeE2eDatabase(): void {
	for (const suffix of ['', '-wal', '-shm']) fs.rmSync(`${databasePath}${suffix}`, { force: true });
}
