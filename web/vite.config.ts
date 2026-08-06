import tailwindcss from '@tailwindcss/vite';
import { sveltekit } from '@sveltejs/kit/vite';
import { defineConfig, defaultExclude } from 'vitest/config';

export default defineConfig({
	plugins: [
		tailwindcss(),
		sveltekit()
	],
	test: {
		// Linked worktrees live INSIDE this tree (web/.worktrees/*) and carry
		// their own branch-head copies of test files; the default include glob
		// would sweep them into the primary run and execute them against
		// frankenstein module resolution (worktree relative imports + primary
		// $lib aliases). Never run nested-worktree tests from the primary tree.
		exclude: [...defaultExclude, '**/.worktrees/**']
	}
});
