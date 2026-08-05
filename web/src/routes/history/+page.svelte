<script lang="ts">
	import { onMount } from 'svelte';
	import { getPercentColor } from '$lib/utils';

	type SessionSummary = {
		id: string;
		completedAt: string;
		startedAt: string;
		type: string;
		earnedPoints: number;
		possiblePoints: number;
		percentage: number;
		duration: number | null;
	};

	let sessions = $state<SessionSummary[] | null>(null);

	onMount(async () => {
		const response = await fetch('/api/history');
		if (response.ok) {
			const data = await response.json();
			sessions = data.sessions ?? [];
		}
	});

	function typeLabel(type: string): string {
		const labels: Record<string, string> = {
			quiz: 'Objective Quiz',
			scenario: 'Scenario Quiz',
			pbq: 'PBQ Practice',
			full: 'Practice Exam',
			review: 'Daily Review'
		};
		return labels[type] ?? type;
	}

	function formatDate(iso: string): string {
		return new Date(iso).toLocaleDateString('en-US', {
			year: 'numeric',
			month: 'short',
			day: 'numeric',
			hour: '2-digit',
			minute: '2-digit'
		});
	}

	function formatDuration(minutes: number | null): string {
		if (minutes === null) return '—';
		if (minutes < 60) return `${minutes}m`;
		const h = Math.floor(minutes / 60);
		const m = minutes % 60;
		return `${h}h ${m}m`;
	}
</script>

<div class="mx-auto max-w-5xl space-y-8">
	<div>
		<p class="eyebrow">History</p>
		<h1 class="h-display mt-1 text-3xl text-text-primary sm:text-4xl">Past sessions</h1>
		<p class="mt-3 text-text-secondary">
			Review your completed quiz sessions and performance breakdowns.
		</p>
	</div>

	{#if sessions === null}
		<div class="grid min-h-64 place-items-center">
			<div class="text-center">
				<span
					class="mx-auto block h-10 w-10 animate-spin rounded-full border-4 border-surface-600 border-t-accent"
				></span>
				<p class="mt-4 text-text-secondary">Loading history…</p>
			</div>
		</div>
	{:else if sessions.length === 0}
		<section class="card grid min-h-80 place-items-center p-8 text-center">
			<div>
				<div class="mx-auto grid h-14 w-14 place-items-center rounded-md bg-accent/15 text-accent">
					<svg
						viewBox="0 0 24 24"
						class="h-7 w-7"
						fill="none"
						stroke="currentColor"
						stroke-width="1.8"
					>
						<circle cx="12" cy="12" r="9" /><path d="M12 7v5l3 3" />
					</svg>
				</div>
				<h2 class="h-display mt-5 text-xl text-text-primary">No completed sessions yet</h2>
				<p class="mx-auto mt-2 max-w-sm text-text-secondary">
					Complete a quiz or exam to see your results here.
				</p>
				<a class="btn btn-primary mt-6" href="/quiz">Start a quiz</a>
			</div>
		</section>
	{:else}
		<!-- Mobile: stacked cards -->
		<section class="space-y-2.5 md:hidden">
			{#each sessions as session (session.id)}
				<a href="/history/{session.id}" class="card block p-4 transition hover:border-accent/50">
					<div class="flex items-center justify-between gap-3">
						<span class="chip bg-surface-700 text-text-secondary">{typeLabel(session.type)}</span>
						<span class="num-display text-lg font-bold {getPercentColor(session.percentage)}">
							{session.percentage}%
						</span>
					</div>
					<p class="mt-2 text-sm text-text-muted">{formatDate(session.completedAt)}</p>
					<p class="mt-1 text-xs text-text-muted">
						{session.earnedPoints.toFixed(1)}/{session.possiblePoints} pts · {formatDuration(
							session.duration
						)}
					</p>
				</a>
			{/each}
		</section>

		<!-- Desktop: table -->
		<section class="card hidden overflow-hidden md:block">
			<table class="w-full text-left text-sm">
				<thead>
					<tr class="border-b border-border bg-surface-900/60">
						<th class="px-5 py-3 font-bold text-text-secondary">Date</th>
						<th class="px-5 py-3 font-bold text-text-secondary">Type</th>
						<th class="px-5 py-3 font-bold text-text-secondary">Score</th>
						<th class="px-5 py-3 font-bold text-text-secondary">Percentage</th>
						<th class="px-5 py-3 font-bold text-text-secondary">Duration</th>
						<th class="px-5 py-3"></th>
					</tr>
				</thead>
				<tbody>
					{#each sessions as session (session.id)}
						<tr class="border-b border-border transition last:border-0 hover:bg-surface-700/30">
							<td class="px-5 py-4 text-text-primary">{formatDate(session.completedAt)}</td>
							<td class="px-5 py-4">
								<span class="chip bg-surface-700 text-text-secondary">
									{typeLabel(session.type)}
								</span>
							</td>
							<td class="px-5 py-4 text-text-primary">
								{session.earnedPoints.toFixed(1)}/{session.possiblePoints}
							</td>
							<td class="num-display px-5 py-4 font-bold {getPercentColor(session.percentage)}">
								{session.percentage}%
							</td>
							<td class="px-5 py-4 text-sm text-text-muted">
								{formatDuration(session.duration)}
							</td>
							<td class="px-5 py-4 text-right">
								<a class="btn btn-primary h-10 px-4 text-xs" href="/history/{session.id}">Review</a>
							</td>
						</tr>
					{/each}
				</tbody>
			</table>
		</section>
	{/if}
</div>
