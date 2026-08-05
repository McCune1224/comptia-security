<script lang="ts">
	import { onMount } from 'svelte';
	import StatusChip from '$lib/components/StatusChip.svelte';

	type AssignmentView = {
		assignment: { id: string; title: string; kind: string };
		dueDateLabel: string;
		daysUntilDue: number;
		status: 'open' | 'due-soon' | 'overdue' | 'in-progress' | 'submitted';
	};

	let assignments = $state<AssignmentView[]>([]);
	let error = $state('');
	let today = $state(new Date());
	let viewMonth = $state(new Date());
	let selectedDay = $state<Date | null>(null);

	const monthLabel = $derived(
		viewMonth.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })
	);

	const daysInMonth = $derived(
		new Date(viewMonth.getFullYear(), viewMonth.getMonth() + 1, 0).getDate()
	);
	const firstWeekday = $derived(
		new Date(viewMonth.getFullYear(), viewMonth.getMonth(), 1).getDay()
	);

	const byDay = $derived(
		assignments.reduce<Record<string, AssignmentView[]>>((map, item) => {
			const key = item.dueDateLabel;
			(map[key] ??= []).push(item);
			return map;
		}, {})
	);

	onMount(async () => {
		const response = await fetch('/api/course/syllabus');
		if (response.ok) {
			const data = await response.json();
			assignments = data.modules.flatMap((m: { assignments: AssignmentView[] }) => m.assignments);
		} else error = 'Unable to load the calendar.';
	});

	function keyFor(date: Date): string {
		return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
	}

	function isToday(date: Date): boolean {
		return keyFor(date) === keyFor(today);
	}

	function inPast(date: Date): boolean {
		return (
			date.getTime() < new Date(today.getFullYear(), today.getMonth(), today.getDate()).getTime()
		);
	}

	function statusTone(status: string): string {
		if (status === 'submitted') return 'bg-success/15 text-success';
		if (status === 'overdue') return 'bg-danger/15 text-danger';
		if (status === 'due-soon') return 'bg-accent-warm/15 text-accent-warm';
		if (status === 'in-progress') return 'bg-info/15 text-info';
		return 'bg-surface-700 text-text-secondary';
	}

	function shiftMonth(delta: number) {
		viewMonth = new Date(viewMonth.getFullYear(), viewMonth.getMonth() + delta, 1);
		selectedDay = null;
	}

	const upcoming = $derived(
		assignments
			.filter((a) => a.status !== 'submitted')
			.sort((a, b) => a.daysUntilDue - b.daysUntilDue)
	);
</script>

<div class="mx-auto max-w-5xl space-y-8">
	<div>
		<p class="text-sm font-semibold uppercase tracking-[0.16em] text-accent">Deadlines</p>
		<h1 class="mt-1 text-2xl font-bold text-text-primary sm:text-3xl">Course calendar</h1>
		<p class="mt-2 text-text-secondary">Every assignment due date, anchored to your exam date.</p>
	</div>

	{#if error}
		<section class="glass rounded-2xl p-6 text-danger">{error}</section>
	{:else}
		<div class="grid gap-6 lg:grid-cols-3">
			<section class="glass rounded-2xl p-5 sm:p-6 lg:col-span-2">
				<div class="mb-4 flex items-center justify-between">
					<h2 class="text-lg font-bold text-text-primary">{monthLabel}</h2>
					<div class="flex gap-2">
						<button
							class="grid h-9 w-9 place-items-center rounded-xl border border-border text-text-secondary transition hover:border-border-strong hover:text-text-primary"
							type="button"
							aria-label="Previous month"
							onclick={() => shiftMonth(-1)}
						>
							<svg
								viewBox="0 0 24 24"
								class="h-4 w-4"
								fill="none"
								stroke="currentColor"
								stroke-width="2"><path d="m15 18-6-6 6-6" /></svg
							>
						</button>
						<button
							class="grid h-9 w-9 place-items-center rounded-xl border border-border text-text-secondary transition hover:border-border-strong hover:text-text-primary"
							type="button"
							aria-label="Next month"
							onclick={() => shiftMonth(1)}
						>
							<svg
								viewBox="0 0 24 24"
								class="h-4 w-4"
								fill="none"
								stroke="currentColor"
								stroke-width="2"><path d="m9 6 6 6-6 6" /></svg
							>
						</button>
					</div>
				</div>
				<div
					class="grid grid-cols-7 gap-1 text-center text-xs font-semibold uppercase tracking-wide text-text-muted"
				>
					{#each ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'] as day (day)}<div class="py-2">
							{day}
						</div>{/each}
				</div>
				<div class="grid grid-cols-7 gap-1">
					{#each Array(firstWeekday) as _}<div></div>{/each}
					{#each Array(daysInMonth) as _, index (index)}
						{@const day = new Date(viewMonth.getFullYear(), viewMonth.getMonth(), index + 1)}
						{@const items = byDay[keyFor(day)] ?? []}
						<button
							class="min-h-16 rounded-xl border p-1.5 text-left transition {isToday(day)
								? 'border-accent/60 bg-accent/10'
								: 'border-border bg-surface-800/40 hover:bg-surface-700/60'}"
							type="button"
							onclick={() =>
								(selectedDay = selectedDay && keyFor(selectedDay) === keyFor(day) ? null : day)}
						>
							<span
								class="text-xs font-semibold {isToday(day)
									? 'text-accent'
									: inPast(day)
										? 'text-text-subtle'
										: 'text-text-secondary'}">{index + 1}</span
							>
							{#if items.length}
								<span class="mt-1 flex flex-wrap gap-0.5">
									{#each items as item (item.assignment.id)}
										<span
											class="block h-1.5 w-1.5 rounded-full {item.status === 'submitted'
												? 'bg-success'
												: item.status === 'overdue'
													? 'bg-danger'
													: item.status === 'due-soon'
														? 'bg-accent-warm'
														: item.status === 'in-progress'
															? 'bg-info'
															: 'bg-surface-600'}"
											title={item.assignment.title}
										></span>
									{/each}
								</span>
							{/if}
						</button>
					{/each}
				</div>
				{#if selectedDay}
					{@const items = byDay[keyFor(selectedDay)] ?? []}
					<div class="mt-4 rounded-xl border border-border bg-surface-800/60 p-4">
						<p class="mb-3 text-sm font-bold text-text-primary">
							{keyFor(selectedDay)}
							{#if isToday(selectedDay)}<span class="ml-2 text-xs font-medium text-accent"
									>Today</span
								>{/if}
						</p>
						{#if items.length === 0}
							<p class="text-sm text-text-muted">No assignments due this day.</p>
						{:else}
							<div class="space-y-2">
								{#each items as item (item.assignment.id)}
									<a
										href="/assignments/{item.assignment.id}"
										class="flex items-center justify-between gap-3 rounded-lg bg-surface-700/50 p-2.5 transition hover:bg-surface-700/80"
									>
										<span class="text-sm font-medium text-text-primary"
											>{item.assignment.title}</span
										>
										<StatusChip status={item.status} />
									</a>
								{/each}
							</div>
						{/if}
					</div>
				{/if}
			</section>

			<section class="glass h-fit rounded-2xl p-5 sm:p-6">
				<h2 class="text-lg font-bold text-text-primary">Up next</h2>
				{#if upcoming.length === 0}
					<p class="mt-4 rounded-xl bg-success/10 p-4 text-sm text-success">
						All assignments submitted. 🎉
					</p>
				{:else}
					<div class="mt-4 space-y-2">
						{#each upcoming.slice(0, 8) as item (item.assignment.id)}
							<a
								href="/assignments/{item.assignment.id}"
								class="flex items-center justify-between gap-2 rounded-xl bg-surface-700/50 p-3 transition hover:bg-surface-700/80"
							>
								<div class="min-w-0">
									<p class="truncate text-sm font-medium text-text-primary">
										{item.assignment.title}
									</p>
									<p
										class="mt-0.5 text-xs {item.daysUntilDue < 0
											? 'text-danger'
											: item.daysUntilDue <= 2
												? 'text-accent-warm'
												: 'text-text-muted'}"
									>
										{item.dueDateLabel}
										{#if item.daysUntilDue < 0}· {item.daysUntilDue === -1
												? 'yesterday'
												: `${-item.daysUntilDue} days ago`}{:else if item.daysUntilDue === 0}· today{:else if item.daysUntilDue === 1}·
											tomorrow{:else}· {item.daysUntilDue} days{/if}
									</p>
								</div>
								<span
									class={`shrink-0 rounded-full px-2 py-0.5 text-[10px] font-semibold ${statusTone(item.status)}`}
								>
									{item.status === 'submitted'
										? 'Done'
										: item.status === 'overdue'
											? 'Overdue'
											: item.status === 'due-soon'
												? 'Soon'
												: item.status === 'in-progress'
													? 'In progress'
													: 'Open'}
								</span>
							</a>
						{/each}
					</div>
				{/if}
			</section>
		</div>
	{/if}
</div>
