<script lang="ts">
	import { parseDateKey } from '$lib/utils';

	type Shift = {
		assignmentId: string;
		title: string;
		overridden: boolean;
		from: string;
		to: string;
	};

	let {
		examDate,
		onsaved
	}: {
		examDate: string;
		onsaved: (examDate: string) => void | Promise<void>;
	} = $props();

	// Deliberate: the input seeds from the saved date at mount and is then user-owned.
	// svelte-ignore state_referenced_locally
	let input = $state(examDate);
	let shifts = $state<Shift[] | null>(null);
	let previewError = $state('');
	let saving = $state(false);
	let saved = $state(false);
	let saveError = $state('');

	const parsed = $derived(parseDateKey(input));
	const changed = $derived(parsed !== null && parsed !== examDate);

	// Live dry-run of the recalculated schedule — debounced, aborted on change.
	$effect(() => {
		const target = input;
		if (!changed) {
			shifts = null;
			previewError = '';
			return;
		}
		const controller = new AbortController();
		const timer = setTimeout(async () => {
			try {
				const response = await fetch('/api/course/exam-date/preview', {
					method: 'POST',
					headers: { 'content-type': 'application/json' },
					body: JSON.stringify({ examDate: target }),
					signal: controller.signal
				});
				if (!response.ok) throw new Error('preview failed');
				const payload = (await response.json()) as { shifts: Shift[] };
				shifts = payload.shifts;
				previewError = '';
			} catch {
				if (!controller.signal.aborted) {
					shifts = null;
					previewError = 'Could not load the schedule preview.';
				}
			}
		}, 250);
		return () => {
			clearTimeout(timer);
			controller.abort();
		};
	});

	async function save() {
		if (!parsed || !changed) return;
		saving = true;
		saved = false;
		saveError = '';
		const response = await fetch('/api/course/exam-date', {
			method: 'POST',
			headers: { 'content-type': 'application/json' },
			body: JSON.stringify({ examDate: parsed })
		});
		saving = false;
		if (response.ok) {
			saved = true;
			shifts = null;
			await onsaved(parsed);
		} else {
			const payload = (await response.json().catch(() => null)) as {
				error?: { message?: string };
			} | null;
			saveError = payload?.error?.message ?? 'Could not save the exam date.';
		}
	}

	function formatDateKey(key: string): string {
		const [year, month, day] = key.split('-').map(Number);
		return new Date(year, month - 1, day).toLocaleDateString('en-US', {
			month: 'short',
			day: 'numeric',
			year: 'numeric'
		});
	}
</script>

<div class="space-y-3">
	<div class="flex flex-wrap items-center gap-2">
		<label class="text-sm font-semibold text-text-muted" for="exam-date-input">Exam date</label>
		<input
			id="exam-date-input"
			type="date"
			class="h-11 rounded-md border border-border-strong bg-surface-800 px-3 text-sm text-text-primary"
			bind:value={input}
		/>
		<button
			class="btn btn-primary h-11 px-4 text-xs"
			type="button"
			disabled={!changed || saving}
			onclick={save}
		>
			{saving ? 'Saving…' : 'Save exam date'}
		</button>
		{#if changed}
			<span class="text-xs text-text-subtle">Unsaved — preview below</span>
		{:else if saved}
			<span class="text-xs font-semibold text-success"
				>Schedule updated — all due dates recalculated.</span
			>
		{/if}
	</div>

	{#if input !== '' && parsed === null}
		<p class="text-xs font-semibold text-warning">
			Enter a real calendar date in YYYY-MM-DD format.
		</p>
	{/if}
	{#if saveError}
		<p class="text-xs font-semibold text-danger">{saveError}</p>
	{/if}
	{#if previewError}
		<p class="text-xs font-semibold text-warning">{previewError}</p>
	{/if}

	{#if shifts}
		{@const moving = shifts.filter((shift) => !shift.overridden && shift.from !== shift.to)}
		{@const pinned = shifts.filter((shift) => shift.overridden)}
		<div class="rounded-md border border-border bg-surface-800/60 p-4">
			<p class="eyebrow">Schedule preview</p>
			<p class="mt-1 text-sm text-text-secondary">
				{moving.length} assignment{moving.length === 1 ? '' : 's'} would move
				{#if pinned.length}
					<span class="text-text-muted">· {pinned.length} pinned by a due-date override</span>
				{/if}
			</p>
			<ul class="mt-3 max-h-56 space-y-1.5 overflow-y-auto pr-1">
				{#each shifts as shift (shift.assignmentId)}
					<li class="flex items-center justify-between gap-3 text-xs">
						<span class="min-w-0 flex-1 truncate text-text-secondary">{shift.title}</span>
						{#if shift.overridden}
							<span class="chip shrink-0 bg-accent/15 text-accent">pinned</span>
						{:else if shift.from !== shift.to}
							<span class="shrink-0 font-semibold text-text-muted">
								{formatDateKey(shift.from)} <span class="text-text-subtle">→</span>
								{formatDateKey(shift.to)}
							</span>
						{:else}
							<span class="shrink-0 text-text-subtle">{formatDateKey(shift.from)}</span>
						{/if}
					</li>
				{/each}
			</ul>
		</div>
	{/if}
</div>
