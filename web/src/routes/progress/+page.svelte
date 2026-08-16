<script lang="ts">
	import { goto } from '$app/navigation';
	import { onMount } from 'svelte';
	import { DOMAIN_NAMES, getBarColor, getPercentColor } from '$lib/utils';

	type ProgressEntry = { earnedPoints: number; possiblePoints: number; percentage: number };
	type WeakTopic = { domain: number; objective: string; percentage: number };
	type RecentSession = {
		id: string;
		date: string;
		type: string;
		earnedPoints: number;
		possiblePoints: number;
		percentage: number;
	};
	let data = $state<{
		progress: Record<number, ProgressEntry>;
		weakTopics: WeakTopic[];
		recentSessions: RecentSession[];
	} | null>(null);
	const domainColors = [
		'bg-accent',
		'bg-accent-secondary',
		'bg-info',
		'bg-success',
		'bg-warning'
	];

	onMount(async () => {
		const response = await fetch('/api/progress');
		if (response.ok) data = await response.json();
	});

	function severity(topic: WeakTopic) {
		if (topic.percentage < 50) return { label: 'Critical', class: 'bg-danger/10 text-danger' };
		if (topic.percentage < 70)
			return { label: 'Moderate', class: 'bg-warning/10 text-warning' };
		return { label: 'Mild', class: 'bg-warning/10 text-warning' };
	}
</script>

<div class="mx-auto max-w-5xl space-y-8">
	<div>
		<p class="eyebrow">Study analytics</p>
		<h1 class="h-display mt-1 text-3xl text-text-primary sm:text-4xl">Your progress</h1>
		<p class="mt-3 text-text-secondary">
			Track performance by exam domain and prioritize the objectives that need review.
		</p>
	</div>

	{#if data}
		{@const hasProgress = Object.values(data.progress).some((entry) => entry.possiblePoints > 0)}
		{#if hasProgress}
			<section>
				<h2 class="h-display mb-4 text-xl text-text-primary">Domain performance</h2>
				<div class="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
					{#each [1, 2, 3, 4, 5] as domain}
						{@const entry = data.progress[domain]}
						{@const percentage = entry?.percentage ?? 0}
						<div class="card p-4">
							<div class="flex items-start gap-2">
								<span class="mt-1 h-2.5 w-2.5 shrink-0 rounded-full {domainColors[domain - 1]}"
								></span>
								<p class="min-h-10 text-xs font-semibold leading-5 text-text-secondary">
									{DOMAIN_NAMES[domain]}
								</p>
							</div>
							<p class="num-display mt-3 text-3xl text-text-primary">{percentage}%</p>
							<div class="mt-3 h-2 overflow-hidden rounded-full bg-surface-600">
								<div
									class="animate-progress h-full rounded-full {getBarColor(percentage)}"
									style={`width: ${percentage}%`}
								></div>
							</div>
							<p class="mt-2 text-xs text-text-muted">
								{entry?.earnedPoints ?? 0}/{entry?.possiblePoints ?? 0} points
							</p>
						</div>
					{/each}
				</div>
			</section>
		{/if}

		{#if data.recentSessions?.length}
			<section class="card p-5 sm:p-6">
				<div class="flex items-center justify-between">
					<div class="flex items-center gap-3">
						<div class="grid h-10 w-10 place-items-center rounded-md bg-accent/15 text-accent">
							<svg
								viewBox="0 0 24 24"
								class="h-5 w-5"
								fill="none"
								stroke="currentColor"
								stroke-width="2"><circle cx="12" cy="12" r="9" /><path d="M12 7v5l3 3" /></svg
							>
						</div>
						<h2 class="h-display text-xl text-text-primary">Recent sessions</h2>
					</div>
					<a class="touch-target text-sm font-bold text-accent hover:underline" href="/history">View all</a>
				</div>
				<div class="mt-4 space-y-2">
					{#each data.recentSessions.slice(0, 5) as session}
						<a
							href="/history/{session.id}"
							class="flex items-center justify-between rounded-md border border-border bg-surface-800/60 p-3 transition hover:border-border-strong hover:bg-surface-700/60"
						>
							<div class="flex items-center gap-3">
								<span class="chip bg-surface-700 text-text-secondary">
									{session.type === 'quiz'
										? 'Quiz'
										: session.type === 'scenario'
											? 'Scenario'
											: session.type === 'pbq'
												? 'PBQ'
												: 'Full Exam'}
								</span>
								<span class="text-sm text-text-muted">
									{new Date(session.date).toLocaleDateString('en-US', {
										month: 'short',
										day: 'numeric'
									})}
								</span>
							</div>
							<span class="num-display text-sm {getPercentColor(session.percentage)}">
								{session.earnedPoints.toFixed(1)}/{session.possiblePoints} ({session.percentage}%)
							</span>
						</a>
					{/each}
				</div>
			</section>
		{/if}
		{#if hasProgress}
			<section class="card p-5 sm:p-6">
				<div class="flex items-center gap-3">
					<div
						class="grid h-10 w-10 place-items-center rounded-md bg-warning/15 text-warning"
					>
						<svg
							viewBox="0 0 24 24"
							class="h-5 w-5"
							fill="none"
							stroke="currentColor"
							stroke-width="2"
							><path d="M12 3v10M12 18h.01" /><path
								d="M10 4.8 3.8 16a2 2 0 0 0 1.75 3h12.9a2 2 0 0 0 1.75-3L14 4.8a2.3 2.3 0 0 0-4 0Z"
							/></svg
						>
					</div>
					<div>
						<h2 class="h-display text-xl text-text-primary">Objectives to review</h2>
						<p class="text-sm text-text-muted">
							Focus your next session where practice will have the most impact.
						</p>
					</div>
				</div>
				{#if data.weakTopics.length}
					<div class="mt-5 space-y-3">
						{#each data.weakTopics as topic}<div
								class="rounded-md border border-border bg-surface-800/60 p-4"
							>
								<div class="flex flex-wrap items-center justify-between gap-2">
									<div class="flex items-center gap-2">
										<span class="chip bg-surface-700 font-mono text-xs text-text-secondary"
											>{topic.objective}</span
										><span class="text-sm text-text-secondary">{DOMAIN_NAMES[topic.domain]}</span>
									</div>
									<span class="chip {severity(topic).class}">{severity(topic).label}</span>
								</div>
								<div class="mt-3 flex items-center gap-3">
									<div class="h-2 flex-1 overflow-hidden rounded-full bg-surface-600">
										<div
											class="h-full rounded-full {getBarColor(topic.percentage)}"
											style={`width: ${topic.percentage}%`}
										></div>
									</div>
									<span class="num-display w-10 text-right text-sm text-text-primary"
										>{topic.percentage}%</span
									>
								</div>
							</div>{/each}
					</div>
				{:else}
					<p class="mt-5 rounded-md bg-surface-700/60 p-4 text-sm text-text-secondary">
						No weak topics identified yet. Complete more questions to build a reliable assessment.
					</p>
				{/if}
			</section>
		{:else}
			<section class="card grid min-h-80 place-items-center p-8 text-center">
				<div>
					<div
						class="mx-auto grid h-14 w-14 place-items-center rounded-md bg-accent/15 text-accent"
					>
						<svg
							viewBox="0 0 24 24"
							class="h-7 w-7"
							fill="none"
							stroke="currentColor"
							stroke-width="1.8"><path d="M4 19V9m5 10V5m5 14v-7m5 7V3" /></svg
						>
					</div>
					<h2 class="h-display mt-5 text-xl text-text-primary">
						Start a quiz to see your progress
					</h2>
					<p class="mx-auto mt-2 max-w-sm text-text-secondary">
						Your domain scores and recommended review topics will appear after your first completed
						session.
					</p>
					<button class="btn btn-primary mt-6" type="button" onclick={() => goto('/quiz')}
						>Start a quiz</button
					>
				</div>
			</section>
		{/if}
	{:else}
		<div class="grid min-h-64 place-items-center">
			<div class="text-center">
				<span
					class="mx-auto block h-10 w-10 animate-spin rounded-full border-4 border-surface-600 border-t-accent"
				></span>
				<p class="mt-4 text-text-secondary">Loading progress…</p>
			</div>
		</div>
	{/if}
</div>
