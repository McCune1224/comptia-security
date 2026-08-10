import { spawnSync } from 'node:child_process';

const npm = process.platform === 'win32' ? 'npm.cmd' : 'npm';
const checks = [
	['unit tests', npm, ['test']],
	['Svelte/type check', npm, ['run', 'check']],
	['production build', npm, ['run', 'build']],
	['Playwright E2E', npm, ['run', 'test:e2e:only']],
	['whitespace check', 'git', ['diff', '--check']]
];

for (const [label, command, args] of checks) {
	console.log(`\n== ${label} ==`);
	const result = spawnSync(command, args, { stdio: 'inherit', shell: false });
	if (result.error) {
		console.error(`${label} could not start: ${result.error.message}`);
		process.exit(1);
	}
	if (result.status !== 0) {
		console.error(`${label} failed with exit code ${result.status ?? 'unknown'}.`);
		process.exit(result.status ?? 1);
	}
}

console.log('\nAll verification gates passed.');
