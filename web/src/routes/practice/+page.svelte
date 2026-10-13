<script lang="ts">
	import { onMount } from 'svelte';

	let review = $state<{
		streak: number;
		dueCount: number;
		todayCount: number;
		wallCount: number;
	} | null>(null);

	onMount(async () => {
		const response = await fetch('/api/review');
		if (response.ok) {
			const data = await response.json();
			review = data.summary;
		}
	});
</script>

<div class="space-y-6 sm:space-y-8">
	<section class="card p-6 sm:p-8">
		<p class="eyebrow">Practice</p>
		<h1 class="h-display mt-2 text-3xl text-text-primary sm:text-4xl">
			The <span class="serif-italic text-accent">drill room</span>
		</h1>
		<p class="mt-3 max-w-xl text-sm leading-relaxed text-text-secondary sm:text-base">
			Ungraded practice that still counts: every answer feeds your mastery grid, review cards, and
			readiness estimate.
		</p>
	</section>

	<div class="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
		<a
			href="/quiz"
			class="card group p-5 transition hover:-translate-y-0.5 hover:shadow-[var(--shadow-lift)]"
		>
			<div class="flex items-start justify-between">
				<span class="grid h-11 w-11 place-items-center rounded-xl bg-accent/10 text-accent">
					<svg
						viewBox="0 0 24 24"
						class="h-5 w-5"
						fill="none"
						stroke="currentColor"
						stroke-width="1.8"
					>
						<rect x="5" y="3" width="14" height="18" rx="2" /><path d="M9 3h6v3H9zM9 11h6M9 15h4" />
					</svg>
				</span>
				<span class="text-text-subtle transition group-hover:text-accent">→</span>
			</div>
			<h2 class="h-display mt-4 text-xl text-text-primary group-hover:text-accent">Quiz</h2>
			<p class="mt-1.5 text-sm leading-relaxed text-text-muted">
				Multiple-choice drills by domain or objective, with hints and instant feedback.
			</p>
		</a>

		<a
			href="/scenarios"
			class="card group p-5 transition hover:-translate-y-0.5 hover:shadow-[var(--shadow-lift)]"
		>
			<div class="flex items-start justify-between">
				<span
					class="grid h-11 w-11 place-items-center rounded-xl bg-accent-secondary/10 text-accent-secondary"
				>
					<svg
						viewBox="0 0 24 24"
						class="h-5 w-5"
						fill="none"
						stroke="currentColor"
						stroke-width="1.8"
					>
						<path d="M20 11.5a7.5 7.5 0 0 1-11.6 6.3L4 19l1.2-3.6A7.5 7.5 0 1 1 20 11.5Z" />
					</svg>
				</span>
				<span class="text-text-subtle transition group-hover:text-accent">→</span>
			</div>
			<h2 class="h-display mt-4 text-xl text-text-primary group-hover:text-accent">Scenarios</h2>
			<p class="mt-1.5 text-sm leading-relaxed text-text-muted">
				Applied judgment: realistic situations that ask what you'd actually do first.
			</p>
		</a>

		<a
			href="/pbq"
			class="card group p-5 transition hover:-translate-y-0.5 hover:shadow-[var(--shadow-lift)]"
		>
			<div class="flex items-start justify-between">
				<span class="grid h-11 w-11 place-items-center rounded-xl bg-info/10 text-info">
					<svg
						viewBox="0 0 24 24"
						class="h-5 w-5"
						fill="none"
						stroke="currentColor"
						stroke-width="1.8"
					>
						<path
							d="M8 5.5 10.5 3l2.5 2.5L15.5 3 18 5.5 15.5 8 18 10.5 15.5 13 18 15.5 15.5 18 13 15.5 10.5 18 8 15.5 5.5 18 3 15.5 5.5 13 3 10.5 5.5 8 3 5.5 5.5 3 8 5.5Z"
						/>
					</svg>
				</span>
				<span class="text-text-subtle transition group-hover:text-accent">→</span>
			</div>
			<h2 class="h-display mt-4 text-xl text-text-primary group-hover:text-accent">
				Performance tasks
			</h2>
			<p class="mt-1.5 text-sm leading-relaxed text-text-muted">
				Matching, ordering, configuration, hotspots — the hands-on half of the real exam.
			</p>
		</a>

		<a
			href="/quiz?start=1&type=full&mode=exam"
			class="card group p-5 transition hover:-translate-y-0.5 hover:shadow-[var(--shadow-lift)]"
		>
			<div class="flex items-start justify-between">
				<span class="grid h-11 w-11 place-items-center rounded-xl bg-warning/10 text-warning">
					<svg
						viewBox="0 0 24 24"
						class="h-5 w-5"
						fill="none"
						stroke="currentColor"
						stroke-width="1.8"
					>
						<circle cx="12" cy="12" r="9" /><path d="M12 7v5l3 3" />
					</svg>
				</span>
				<span class="text-text-subtle transition group-hover:text-accent">→</span>
			</div>
			<h2 class="h-display mt-4 text-xl text-text-primary group-hover:text-accent">Full exam</h2>
			<p class="mt-1.5 text-sm leading-relaxed text-text-muted">
				90 questions, 90 minutes, exam weighting — the dress rehearsal. Ungraded here, but it feeds
				readiness.
			</p>
		</a>

		<a
			href="/quiz?review=daily"
			class="card group p-5 transition hover:-translate-y-0.5 hover:shadow-[var(--shadow-lift)]"
		>
			<div class="flex items-start justify-between">
				<span class="grid h-11 w-11 place-items-center rounded-xl bg-success/10 text-success">
					<svg
						viewBox="0 0 24 24"
						class="h-5 w-5"
						fill="none"
						stroke="currentColor"
						stroke-width="1.8"
					>
						<path
							d="M12 2c.5 4.5-2 6.5-3 9-.6 1.5 0 3 1.5 3.5 2.8-1 4.5-3.8 4.1-6.7 2 1.2 3.3 3.4 3.3 5.7A7.4 7.4 0 0 1 3 16.5c0-4.3 3.2-7.8 7.5-9.5C11 5.5 11.6 3.7 12 2Z"
						/>
					</svg>
				</span>
				<span class="text-text-subtle transition group-hover:text-accent">→</span>
			</div>
			<h2 class="h-display mt-4 text-xl text-text-primary group-hover:text-accent">Today's 10</h2>
			<p class="mt-1.5 text-sm leading-relaxed text-text-muted">
				{#if review}
					{review.dueCount} cards due · {review.streak}-day streak alive
				{:else}
					Spaced-repetition queue from your weakest questions.
				{/if}
			</p>
		</a>

		<a
			href="/quiz?review=wall"
			class="card group p-5 transition hover:-translate-y-0.5 hover:shadow-[var(--shadow-lift)]"
		>
			<div class="flex items-start justify-between">
				<span class="grid h-11 w-11 place-items-center rounded-xl bg-danger/10 text-danger">
					<svg
						viewBox="0 0 24 24"
						class="h-5 w-5"
						fill="none"
						stroke="currentColor"
						stroke-width="1.8"
					>
						<rect x="4" y="4" width="16" height="16" rx="2" /><path d="M9 9h6v6H9z" />
					</svg>
				</span>
				<span class="text-text-subtle transition group-hover:text-accent">→</span>
			</div>
			<h2 class="h-display mt-4 text-xl text-text-primary group-hover:text-accent">
				Wall of shame
			</h2>
			<p class="mt-1.5 text-sm leading-relaxed text-text-muted">
				{#if review}
					{review.wallCount} questions you've missed — cleared only by proven mastery.
				{:else}
					Everything you've ever missed, held until you own it.
				{/if}
			</p>
		</a>
	</div>

	<section class="card p-5 sm:p-6">
		<h2 class="h-display text-xl text-text-primary">Where to focus</h2>
		<p class="mt-2 text-sm leading-relaxed text-text-secondary">
			The mastery grid shows accuracy for all 28 exam objectives — tap any weak cell to drill
			exactly that.
		</p>
		<a href="/mastery" class="btn btn-ghost mt-4">Open the mastery grid</a>
	</section>
</div>
