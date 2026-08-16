<script lang="ts">
	import { goto } from '$app/navigation';
	import { onMount } from 'svelte';
	import { DOMAIN_NAMES, formatDate } from '$lib/utils';

	type HeatmapDay = { date: string; questions: number };
	type WallItem = {
		questionId: string;
		domain: number;
		objective: string;
		kind: string;
		prompt: string;
		wrongCount: number;
		lastWrongAt: string | null;
	};
	type ReviewData = {
		summary: {
			streak: number;
			todayQuestions: number;
			dueCount: number;
			wallCount: number;
			wallByDomain: Record<number, number>;
			heatmap: HeatmapDay[];
			lastStudyAt: string | null;
		};
		wall: WallItem[];
	};

	let data = $state<ReviewData | null>(null);
	let error = $state('');
	let domainFilter = $state<number | null>(null);

	onMount(async () => {
		const response = await fetch('/api/review');
		if (response.ok) data = await response.json();
		else error = 'Unable to load review data.';
	});

	const wallFiltered = $derived(
		domainFilter === null ? (data?.wall ?? []) : (data?.wall ?? []).filter((item) => item.domain === domainFilter)
	);

	function kindLabel(kind: string): string {
		const labels: Record<string, string> = {
			'single-choice': 'MCQ',
			'multiple-choice': 'Multi',
			ordering: 'Order',
			matching: 'Match',
			numeric: 'Numeric',
			evidence: 'Evidence',
			configuration: 'Config',
			'fill-blank': 'Fill-in',
			'word-bank': 'Word bank',
			'multi-step': 'Multi-step'
		};
		return labels[kind] ?? kind;
	}

	function heatColor(questions: number): string {
		if (questions === 0) return 'bg-surface-700/40';
		if (questions < 5) return 'bg-accent/25';
		if (questions < 10) return 'bg-accent/45';
		if (questions < 20) return 'bg-accent/70';
		return 'bg-accent';
	}

	function heatTitle(day: HeatmapDay): string {
		return day.questions === 0
			? `${formatDate(day.date)} — no study`
			: `${formatDate(day.date)} — ${day.questions} question${day.questions === 1 ? '' : 's'}`;
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
				<p class="mt-4 text-text-secondary">Loading review…</p>
			</div>
		</div>
	{:else}
		<!-- Hero -->
		<section
			class="relative overflow-hidden rounded-md border border-border-strong bg-surface-900 p-6 sm:p-8"
		>
			<div class="relative flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
				<div>
					<p class="eyebrow">Daily review · spaced repetition</p>
					<h1 class="h-display mt-2 text-3xl text-text-primary sm:text-4xl">Stay sharp</h1>
					<p class="mt-3 max-w-xl text-sm leading-relaxed text-text-secondary sm:text-base">
						A short mix of <span class="font-semibold text-text-primary">due-for-review</span>,
						<span class="font-semibold text-text-primary">weakest objectives</span>, and
						<span class="font-semibold text-text-primary">new questions</span> — built fresh every
						day. Ten minutes keeps the forgetting curve honest.
					</p>
					<div class="mt-6 flex flex-wrap items-center gap-3">
						<button
							class="btn btn-primary"
							type="button"
							onclick={() => goto('/quiz?review=daily')}
						>
							{#if data.summary.dueCount > 0}
								Start today's review ({data.summary.dueCount} due)
							{:else if data.summary.wallCount > 0}
								Nothing due — drill the wall instead
							{:else}
								Start today's review
							{/if}
						</button>
						<a class="btn btn-ghost" href="/quiz?review=wall">Drill the wall</a>
						<a class="btn btn-ghost" href="/history">Past sessions</a>
					</div>
				</div>
				<div class="flex items-center justify-around gap-6 lg:justify-end">
					<div class="text-center">
						<div class="flex items-center justify-center gap-2">
							<svg
								viewBox="0 0 24 24"
								class="h-8 w-8 text-warning"
								fill="currentColor"
								><path
									d="M12 2c.5 4.5-2 6.5-3 9-.6 1.5 0 3 1.5 3.5.9.3 1.8 0 2.3-.7.3 1.2.3 2.5-.3 3.7 2.8-1 4.5-3.8 4.1-6.7 2 1.2 3.3 3.4 3.3 5.7 0 3.9-3.4 7-7.4 6.9C6.6 23.5 3 20.4 3 16.5c0-4.3 3.2-7.8 7.5-9.5C11 5.5 11.6 3.7 12 2Z"
								/></svg
							>
							<p class="num-display text-5xl text-text-primary">{data.summary.streak}</p>
						</div>
						<p class="mt-1 text-sm font-bold text-text-secondary">
							day streak{data.summary.streak === 1 ? '' : 's'}
						</p>
					</div>
					<div class="hidden h-24 w-px bg-border sm:block"></div>
					<div class="text-center">
						<p class="num-display text-4xl text-text-primary">{data.summary.todayQuestions}</p>
						<p class="mt-1 text-xs text-text-muted">questions today</p>
						<p class="mt-2 text-sm font-semibold text-text-secondary">
							{data.summary.wallCount} on the wall
						</p>
					</div>
				</div>
			</div>
		</section>

		<!-- Heatmap -->
		<section class="card p-5 sm:p-6">
			<div class="flex items-center justify-between">
				<h2 class="h-display text-xl text-text-primary">Last 12 weeks</h2>
				<div class="flex items-center gap-1.5 text-[11px] text-text-muted">
					<span>Less</span>
					<span class="h-3 w-3 rounded-[2px] bg-surface-700/40"></span>
					<span class="h-3 w-3 rounded-[2px] bg-accent/25"></span>
					<span class="h-3 w-3 rounded-[2px] bg-accent/45"></span>
					<span class="h-3 w-3 rounded-[2px] bg-accent/70"></span>
					<span class="h-3 w-3 rounded-[2px] bg-accent"></span>
					<span>More</span>
				</div>
			</div>
			<div class="mt-5 overflow-x-auto pb-2">
				<div class="grid w-max grid-flow-col grid-rows-7 gap-1.5">
					{#each data.summary.heatmap as day (day.date)}
						<span
							class="h-3.5 w-3.5 rounded-[2px] {heatColor(day.questions)}"
							title={heatTitle(day)}
						></span>
					{/each}
				</div>
			</div>
			<p class="mt-3 text-xs text-text-muted">
				Every completed session counts — quizzes, PBQs, full exams, and daily review.
			</p>
		</section>

		<!-- Wall of Shame -->
		<section class="card p-5 sm:p-6">
			<div class="flex items-center justify-between gap-3">
				<div>
					<h2 class="h-display text-xl text-text-primary">Wall of Shame</h2>
					<p class="mt-1 text-xs text-text-muted">
						Questions you've missed. Nail each one twice in a row and it falls off the wall.
					</p>
				</div>
				<button class="btn btn-ghost shrink-0" type="button" onclick={() => goto('/quiz?review=wall')}>
					Drill the wall
				</button>
			</div>
			{#if data.summary.wallCount === 0}
				<p class="mt-5 rounded-md bg-success/10 p-4 text-sm text-success">
					🎉 Wall cleared — nothing you've missed is still unmastered.
				</p>
			{:else}
				<div class="mt-4 flex flex-wrap gap-2">
					<button
						class="chip {domainFilter === null ? 'bg-accent text-on-accent' : 'bg-surface-700 text-text-muted'}"
						type="button"
						onclick={() => (domainFilter = null)}
						>All ({data.summary.wallCount})</button
					>
					{#each [1, 2, 3, 4, 5] as domain (domain)}
						<button
							class="chip {domainFilter === domain ? 'bg-accent text-on-accent' : 'bg-surface-700 text-text-muted'}"
							title={DOMAIN_NAMES[domain]}
							type="button"
							onclick={() => (domainFilter = domainFilter === domain ? null : domain)}
							>D{domain} ({data.summary.wallByDomain[domain] ?? 0})</button
						>
					{/each}
				</div>
				<ul class="mt-4 space-y-2.5">
					{#each wallFiltered as item (item.questionId)}
						<li
							class="flex items-center justify-between gap-3 rounded-md border border-border bg-surface-800/60 p-4"
						>
							<div class="min-w-0">
								<div class="flex flex-wrap items-center gap-2">
									<span class="chip bg-surface-700 text-text-secondary"
										>{kindLabel(item.kind)}</span
									>
									<span class="chip bg-surface-700 text-text-muted"
										>Objective {item.objective}</span
									>
									<span
										class="chip {item.wrongCount >= 3 ? 'bg-danger/15 text-danger' : 'bg-warning/15 text-warning'}"
										>×{item.wrongCount} missed</span
									>
								</div>
								<p class="mt-2 line-clamp-2 text-sm leading-5 text-text-primary">
									{item.prompt}
								</p>
							</div>
							<span class="shrink-0 text-text-subtle">→</span>
						</li>
					{/each}
				</ul>
				<p class="mt-3 text-xs text-text-muted">
					Drill sessions pull up to 10 wall questions in random order, with instant feedback.
				</p>
			{/if}
		</section>
	{/if}
</div>
