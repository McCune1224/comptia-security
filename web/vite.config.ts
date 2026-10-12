import tailwindcss from '@tailwindcss/vite';
import { sveltekit } from '@sveltejs/kit/vite';
import { defineConfig, defaultExclude } from 'vitest/config';
import { loadEnv } from 'vite';

export default defineConfig({
	plugins: [tailwindcss(), sveltekit()],
	test: {
		// The suite shares one isolated PostgreSQL database (TEST_DATABASE_URL),
		// so test files must not run concurrently.
		fileParallelism: false,
		// TEST_DATABASE_URL may be a remote instance (e.g. a Railway proxy with
		// ~200ms round trips). Resetting schema + seed per test takes dozens of
		// round trips, so the per-test budget is generous on purpose.
		testTimeout: 30_000,
		hookTimeout: 30_000,
		// Load web/.env so TEST_DATABASE_URL reaches the test workers.
		env: loadEnv('test', process.cwd(), ''),
		// Linked worktrees live INSIDE this tree (web/.worktrees/*) and carry
		// their own branch-head copies of test files; the default include glob
		// would sweep them into the primary run and execute them against
		// frankenstein module resolution (worktree relative imports + primary
		// $lib aliases). Never run nested-worktree tests from the primary tree.
		exclude: [...defaultExclude, '**/.worktrees/**', '**/e2e/**']
	}
});
