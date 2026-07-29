<script lang="ts">
	import { onMount } from 'svelte';

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
			full: 'Practice Exam'
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

	function scoreColor(pct: number): string {
		if (pct >= 85) return 'text-green-400';
		if (pct >= 60) return 'text-yellow-400';
		return 'text-red-400';
	}
</script>

<div class="mx-auto max-w-5xl space-y-8">
	<div>
		<p class="text-sm font-semibold uppercase tracking-[0.16em] text-accent">History</p>
		<h1 class="mt-1 text-2xl font-bold text-text-primary sm:text-3xl">Past sessions</h1>
		<p class="mt-2 text-text-secondary">
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
		<section class="glass grid min-h-80 place-items-center rounded-3xl p-8 text-center">
			<div>
				<div class="mx-auto grid h-14 w-14 place-items-center rounded-2xl bg-accent/10 text-accent">
					<svg viewBox="0 0 24 24" class="h-7 w-7" fill="none" stroke="currentColor" stroke-width="1.8">
						<circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 3"/>
					</svg>
				</div>
				<h2 class="mt-5 text-xl font-bold text-text-primary">No completed sessions yet</h2>
				<p class="mx-auto mt-2 max-w-sm text-text-secondary">
					Complete a quiz or exam to see your results here.
				</p>
				<a
					class="mt-6 inline-flex h-12 items-center rounded-xl bg-gradient-to-r from-accent to-accent-secondary px-6 font-semibold text-white transition hover:brightness-110 active:scale-[0.98]"
					href="/quiz">Start a quiz</a
				>
			</div>
		</section>
	{:else}
		<section class="glass rounded-2xl overflow-hidden">
			<table class="w-full text-left text-sm">
				<thead>
					<tr class="border-b border-border bg-surface-700/60">
						<th class="px-5 py-3 font-semibold text-text-secondary">Date</th>
						<th class="px-5 py-3 font-semibold text-text-secondary">Type</th>
						<th class="px-5 py-3 font-semibold text-text-secondary">Score</th>
						<th class="px-5 py-3 font-semibold text-text-secondary">Percentage</th>
						<th class="px-5 py-3 font-semibold text-text-secondary">Duration</th>
						<th class="px-5 py-3"></th>
					</tr>
				</thead>
				<tbody>
					{#each sessions as session (session.id)}
						<tr class="border-b border-border last:border-0 hover:bg-surface-700/30 transition">
							<td class="px-5 py-4 text-text-primary">{formatDate(session.completedAt)}</td>
							<td class="px-5 py-4">
								<span class="rounded-full bg-surface-700 px-2.5 py-1 text-xs font-medium text-text-secondary">
									{typeLabel(session.type)}
								</span>
							</td>
							<td class="px-5 py-4 text-text-primary">
								{session.earnedPoints.toFixed(1)}/{session.possiblePoints}
							</td>
							<td class="px-5 py-4 font-semibold {scoreColor(session.percentage)}">
								{session.percentage}%
							</td>
							<td class="px-5 py-4 text-text-muted text-sm">
								{formatDuration(session.duration)}
							</td>
							<td class="px-5 py-4 text-right">
								<a
									class="inline-flex h-9 items-center rounded-lg bg-accent px-3 text-sm font-medium text-white transition hover:brightness-110"
									href="/history/{session.id}">Review</a
								>
							</td>
						</tr>
					{/each}
				</tbody>
			</table>
		</section>
	{/if}
</div>
