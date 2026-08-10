import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { defineConfig, devices } from '@playwright/test';

const port = 4173;
const databasePath = path.join(os.tmpdir(), `comptia-security-e2e-${process.pid}.db`);

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
			PORT: String(port)
		},
		reuseExistingServer: false,
		timeout: 120_000
	},
	globalTeardown: path.resolve('e2e/global-teardown.ts')
});

export function removeE2eDatabase(): void {
	for (const suffix of ['', '-wal', '-shm']) fs.rmSync(`${databasePath}${suffix}`, { force: true });
}
