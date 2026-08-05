<script lang="ts">
	import type { AssignmentStatus } from '$lib/server/course';

	let { status }: { status: AssignmentStatus } = $props();

	const config: Record<AssignmentStatus, { label: string; classes: string }> = {
		open: { label: 'Open', classes: 'bg-surface-700 text-text-secondary' },
		'due-soon': { label: 'Due soon', classes: 'bg-accent-warm/15 text-accent-warm' },
		overdue: { label: 'Overdue', classes: 'bg-danger/15 text-danger' },
		'in-progress': { label: 'In progress', classes: 'bg-info/15 text-info' },
		submitted: { label: 'Submitted', classes: 'bg-success/15 text-success' }
	};
	const { label, classes } = $derived(config[status]);
</script>

<span class="chip {classes}">
	<span class="h-1.5 w-1.5 rounded-full bg-current"></span>
	{label}
</span>
