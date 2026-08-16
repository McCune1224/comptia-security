<script lang="ts">
	import { goto } from '$app/navigation';
	import { onMount } from 'svelte';
	import { DOMAIN_NAMES } from '$lib/utils';

	type ObjectiveCell = {
		objective: string;
		domain: number;
		attempted: number;
		earnedPoints: number;
		possiblePoints: number;
		percentage: number | null;
		availableQuestions: number;
	};
	type DomainRollup = {
		domain: number;
		attempted: number;
		possiblePoints: number;
		earnedPoints: number;
		percentage: number | null;
	};
	type MasteryData = {
		objectives: ObjectiveCell[];
		domains: DomainRollup[];
		totalAttempted: number;
	};

	let data = $state<MasteryData | null>(null);
	let error = $state('');

	onMount(async () => {
		const response = await fetch('/api/mastery');
		if (response.ok) data = await response.json();
		else error = 'Unable to load mastery data.';
	});

	function cellClass(cell: ObjectiveCell): string {
		if (cell.percentage === null) return 'border border-border bg-surface-800/60 text-text-muted';
		if (cell.percentage >= 85) return 'border border-success/40 bg-success/15 text-success';
		if (cell.percentage >= 60) return 'border border-warning/40 bg-warning/15 text-warning';
		return 'border border-danger/40 bg-danger/15 text-danger';
	}

	function domainBarClass(rollup: DomainRollup): string {
		if (rollup.percentage === null) return 'bg-surface-600';
		if (rollup.percentage >= 85) return 'bg-success';
		if (rollup.percentage >= 60) return 'bg-warning';
		return 'bg-danger';
	}
</script>

<div class="mx-auto max-w-3xl space-y-6 py-4 sm:py-8">
	{#if error}
		<section class="card p-6 text-danger">{error}</section>
	{:else if !data}
		<div class="grid min-h-64 place-items-center">
			<div class="text-center">
				<span
					class="mx-auto block h-10 w-10 animate-spin rounded-full border-4 border-surface-600 border-t-accent"
				></span>
				<p class="mt-4 text-text-secondary">Loading mastery…</p>
			</div>
		</div>
	{:else}
		<div>
			<p class="eyebrow">Mastery matrix</p>
			<h1 class="h-display mt-1 text-3xl text-text-primary sm:text-4xl">
				All {data.objectives.length} objectives
			</h1>
			<p class="mt-3 text-text-secondary">
				Accuracy per objective across every session you've completed. Tap any objective to drill
				it with a 5-question practice session — the red ones are free points on exam day.
			</p>
		</div>

		<!-- Legend -->
		<div class="flex flex-wrap items-center gap-x-4 gap-y-2 text-xs text-text-muted">
			<span class="flex items-center gap-1.5"
				><span class="h-3.5 w-3.5 rounded-[2px] border border-border bg-surface-800"></span>
				Never tried</span
			><span class="flex items-center gap-1.5"
				><span class="h-3.5 w-3.5 rounded-[2px] bg-danger/40"></span> &lt;60%</span
			><span class="flex items-center gap-1.5"
				><span class="h-3.5 w-3.5 rounded-[2px] bg-warning/40"></span> 60–84%</span
			><span class="flex items-center gap-1.5"
				><span class="h-3.5 w-3.5 rounded-[2px] bg-success/50"></span> 85%+</span
			>
			{#if data.totalAttempted > 0}
				<span class="font-semibold text-text-secondary"
					>{data.totalAttempted} answers tracked</span
				>
			{/if}
		</div>

		{#if data.totalAttempted === 0}
			<section class="card p-6">
				<p class="text-text-secondary">
					No answers tracked yet — complete a
					<a class="touch-target font-bold text-accent hover:underline" href="/quiz?start=1">quiz</a>,
					<a class="touch-target font-bold text-accent hover:underline" href="/pbq">PBQ set</a>, or
					<a class="touch-target font-bold text-accent hover:underline" href="/quiz?start=1&type=full&mode=exam"
						>full exam</a
					>
					and every objective's accuracy lights up here.
				</p>
			</section>
		{/if}

		{#each data.domains as rollup (rollup.domain)}
			<section class="card p-5 sm:p-6">
				<div class="flex items-center justify-between gap-3">
					<div class="min-w-0">
						<h2 class="h-display text-lg text-text-primary">
							<span class="text-accent">D{rollup.domain}</span> · {DOMAIN_NAMES[rollup.domain]}
						</h2>
						<p class="mt-0.5 text-xs text-text-muted">
							{rollup.attempted} answers
							{#if rollup.percentage !== null} · {rollup.percentage}% accurate{/if}
						</p>
					</div>
					<div class="hidden h-2 w-32 shrink-0 overflow-hidden rounded-full bg-surface-600 sm:block">
						<div
							class="h-full rounded-full {domainBarClass(rollup)}"
							style="width: {rollup.percentage ?? 0}%"
						></div>
					</div>
				</div>
				<div class="mt-4 grid grid-cols-4 gap-2 sm:grid-cols-6">
					{#each data.objectives.filter((cell) => cell.domain === rollup.domain) as cell (cell.objective)}
						<button
							class="flex min-h-14 flex-col items-center justify-center rounded-md px-1 py-2 transition hover:opacity-80 {cellClass(
								cell
							)}"
							title="Objective {cell.objective} — {cell.availableQuestions} questions in the bank"
							type="button"
							onclick={() =>
								goto(
									`/quiz?start=1&count=5&domain=${cell.domain}&objective=${cell.objective}&mode=practice`
								)}
						>
							<span class="text-sm font-bold">{cell.objective}</span>
							<span class="mt-0.5 text-[11px] font-semibold">
								{cell.percentage === null ? '—' : `${cell.percentage}%`}
							</span>
						</button>
					{/each}
				</div>
			</section>
		{/each}
	{/if}
</div>
