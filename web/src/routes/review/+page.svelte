<script lang="ts">
	import { goto } from '$app/navigation';
	import { onMount } from 'svelte';
	import ContextRail from '$lib/components/ContextRail.svelte';
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
		domainFilter === null
			? (data?.wall ?? [])
			: (data?.wall ?? []).filter((item) => item.domain === domainFilter)
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

	const SMALL_WORDS = [
		'zero',
		'one',
		'two',
		'three',
		'four',
		'five',
		'six',
		'seven',
		'eight',
		'nine',
		'ten',
		'eleven',
		'twelve',
		'thirteen',
		'fourteen',
		'fifteen',
		'sixteen',
		'seventeen',
		'eighteen',
		'nineteen'
	];
	const TENS_WORDS = [
		'',
		'',
		'twenty',
		'thirty',
		'forty',
		'fifty',
		'sixty',
		'seventy',
		'eighty',
		'ninety'
	];

	function numberToWords(n: number): string {
		if (n < 20) return SMALL_WORDS[n];
		if (n < 100) {
			const tens = TENS_WORDS[Math.floor(n / 10)];
			const rest = n % 10;
			return rest ? `${tens}-${SMALL_WORDS[rest]}` : tens;
		}
		if (n < 1000) {
			const hundreds = `${SMALL_WORDS[Math.floor(n / 100)]} hundred`;
			const rest = n % 100;
			return rest ? `${hundreds} ${numberToWords(rest)}` : hundreds;
		}
		return String(n);
	}

	// The editorial flourish: "Twelve days alive" rather than a bare numeral.
	function streakHeadline(streak: number): string {
		const words = numberToWords(streak);
		return `${words.charAt(0).toUpperCase()}${words.slice(1)} days alive`;
	}
</script>

{#if error}
	<section class="card p-6 text-danger">{error}</section>
{:else if !data}
	<div class="grid min-h-64 place-items-center">
		<div class="text-center">
			<span
				class="mx-auto block h-10 w-10 animate-spin rounded-full border-4 border-surface-600 border-t-accent"
			></span>
			<p class="serif-italic mt-4 text-text-secondary">Loading review…</p>
		</div>
	</div>
{:else}
	<div class="grid gap-6 xl:grid-cols-[minmax(0,1fr)_20rem] xl:gap-8">
		<div class="space-y-5">
			<section class="card p-6 sm:p-7">
				<p class="eyebrow">Daily review · spaced repetition</p>
				<h1 class="h-display mt-2 text-3xl text-text-primary sm:text-4xl">
					{#if data.summary.streak > 0}
						<span class="serif-italic text-accent">{streakHeadline(data.summary.streak)}</span>
					{:else}
						Stay sharp
					{/if}
				</h1>
				<p class="mt-3 max-w-xl text-sm leading-relaxed text-text-secondary sm:text-base">
					A short mix of <span class="font-semibold text-text-primary">due-for-review</span>,
					<span class="font-semibold text-text-primary">weakest objectives</span>, and
					<span class="font-semibold text-text-primary">new questions</span> — built fresh every day.
					Ten minutes keeps the forgetting curve honest.
				</p>
				<div class="mt-6 flex flex-wrap items-center gap-3">
					<button class="btn btn-primary" type="button" onclick={() => goto('/quiz?review=daily')}>
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
			</section>

			<section class="card p-5 sm:p-6">
				<div class="flex items-center justify-between gap-3">
					<div>
						<p class="eyebrow">Recall debt</p>
						<h2 class="h-display mt-1 text-xl text-text-primary">Wall of Shame</h2>
						<p class="mt-1 text-xs text-text-muted">
							Questions you've missed. Nail each one twice in a row and it falls off the wall.
						</p>
					</div>
					<button
						class="btn btn-ghost shrink-0"
						type="button"
						onclick={() => goto('/quiz?review=wall')}
					>
						Drill the wall
					</button>
				</div>
				{#if data.summary.wallCount === 0}
					<p class="mt-5 rounded bg-success/10 p-4 text-sm text-success">
						Wall cleared — nothing you've missed is still unmastered.
					</p>
				{:else}
					<div class="mt-4 flex flex-wrap gap-2">
						<button
							class="chip {domainFilter === null
								? 'bg-accent text-on-accent'
								: 'bg-surface-700 text-text-muted'}"
							type="button"
							onclick={() => (domainFilter = null)}>All ({data.summary.wallCount})</button
						>
						{#each [1, 2, 3, 4, 5] as domain (domain)}
							<button
								class="chip {domainFilter === domain
									? 'bg-accent text-on-accent'
									: 'bg-surface-700 text-text-muted'}"
								title={DOMAIN_NAMES[domain]}
								type="button"
								onclick={() => (domainFilter = domainFilter === domain ? null : domain)}
								>D{domain} ({data.summary.wallByDomain[domain] ?? 0})</button
							>
						{/each}
					</div>
					<ul class="mt-4 space-y-2.5">
						{#each wallFiltered as item (item.questionId)}
							<li class="rounded border border-border bg-surface-900/50 p-4">
								<div class="flex flex-wrap items-center gap-2">
									<span class="chip bg-surface-700 text-text-secondary">{kindLabel(item.kind)}</span
									>
									<span class="chip bg-surface-700 text-text-muted">Objective {item.objective}</span
									>
									<span
										class="chip {item.wrongCount >= 3
											? 'bg-danger/15 text-danger'
											: 'bg-warning/15 text-warning'}">×{item.wrongCount} missed</span
									>
								</div>
								<p class="mt-2 line-clamp-2 text-sm leading-5 text-text-primary">{item.prompt}</p>
							</li>
						{/each}
					</ul>
					<p class="mt-3 text-xs text-text-muted">
						Drill sessions pull up to 10 wall questions in random order, with instant feedback.
					</p>
				{/if}
			</section>
		</div>

		<ContextRail title="Recall">
			<div class="card p-5">
				<div class="flex items-center gap-3">
					<span class="grid h-10 w-10 shrink-0 place-items-center rounded bg-accent/10">
						<svg viewBox="0 0 24 24" class="h-5 w-5 text-accent" fill="currentColor"
							><path
								d="M12 2c.5 4.5-2 6.5-3 9-.6 1.5 0 3 1.5 3.5.9.3 1.8 0 2.3-.7.3 1.2.3 2.5-.3 3.7 2.8-1 4.5-3.8 4.1-6.7 2 1.2 3.3 3.4 3.3 5.7 0 3.9-3.4 7-7.4 6.9C6.6 23.5 3 20.4 3 16.5c0-4.3 3.2-7.8 7.5-9.5C11 5.5 11.6 3.7 12 2Z"
							/></svg
						>
					</span>
					<div>
						<p class="num-display text-3xl leading-none text-text-primary">{data.summary.streak}</p>
						<p class="text-xs text-text-muted">day streak{data.summary.streak === 1 ? '' : 's'}</p>
					</div>
				</div>
				<div class="mt-4 grid grid-cols-2 gap-3">
					<div class="rounded border border-border bg-surface-900/50 p-3">
						<p class="num-display text-xl text-text-primary">{data.summary.todayQuestions}</p>
						<p class="text-[11px] text-text-muted">today</p>
					</div>
					<div class="rounded border border-border bg-surface-900/50 p-3">
						<p class="num-display text-xl text-text-primary">{data.summary.wallCount}</p>
						<p class="text-[11px] text-text-muted">on the wall</p>
					</div>
				</div>
				<button
					class="btn btn-primary mt-4 w-full"
					type="button"
					onclick={() => goto('/quiz?review=daily')}
				>
					Today's 10
				</button>
			</div>

			<div class="card p-5">
				<p class="text-xs font-semibold uppercase tracking-[0.12em] text-text-muted">
					Last 12 weeks
				</p>
				<div class="mt-3 overflow-x-auto pb-1">
					<div class="grid w-max grid-flow-col grid-rows-7 gap-1">
						{#each data.summary.heatmap as day (day.date)}
							<span class="h-3 w-3 rounded-[2px] {heatColor(day.questions)}" title={heatTitle(day)}
							></span>
						{/each}
					</div>
				</div>
				<p class="mt-3 text-[11px] leading-relaxed text-text-muted">
					Every completed session counts — quizzes, PBQs, full exams, and daily review.
				</p>
			</div>
		</ContextRail>
	</div>
{/if}
