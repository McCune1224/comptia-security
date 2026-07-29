<script lang="ts">
	import { goto } from '$app/navigation';
	import { onMount } from 'svelte';
	import { DOMAIN_NAMES, getBarColor } from '$lib/utils';

	type ProgressEntry = { earnedPoints: number; possiblePoints: number; percentage: number };
	type WeakTopic = { domain: number; objective: string; percentage: number };
	type RecentSession = { id: string; date: string; type: string; earnedPoints: number; possiblePoints: number; percentage: number };
	let data = $state<{ progress: Record<number, ProgressEntry>; weakTopics: WeakTopic[]; recentSessions: RecentSession[] } | null>(
		null
	);
	const domainColors = [
		'bg-accent',
		'bg-accent-secondary',
		'bg-info',
		'bg-success',
		'bg-accent-warm'
	];

	onMount(async () => {
		const response = await fetch('/api/progress');
		if (response.ok) data = await response.json();
	});

	function severity(topic: WeakTopic) {
		if (topic.percentage < 50) return { label: 'Critical', class: 'bg-danger/10 text-danger' };
		if (topic.percentage < 70)
			return { label: 'Moderate', class: 'bg-accent-warm/10 text-accent-warm' };
		return { label: 'Mild', class: 'bg-yellow-400/10 text-yellow-500' };
	}
</script>

<div class="mx-auto max-w-5xl space-y-8">
	<div>
		<p class="text-sm font-semibold uppercase tracking-[0.16em] text-accent">Study analytics</p>
		<h1 class="mt-1 text-2xl font-bold text-text-primary sm:text-3xl">Your progress</h1>
		<p class="mt-2 text-text-secondary">
			Track performance by exam domain and prioritize the objectives that need review.
		</p>
	</div>

	{#if data}
		{@const hasProgress = Object.values(data.progress).some((entry) => entry.possiblePoints > 0)}
		{#if hasProgress}
			<section>
				<h2 class="mb-4 text-xl font-bold text-text-primary">Domain performance</h2>
				<div class="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
					{#each [1, 2, 3, 4, 5] as domain}
						{@const entry = data.progress[domain]}
						{@const percentage = entry?.percentage ?? 0}
						<div class="glass rounded-2xl p-4">
							<div class="flex items-start gap-2">
								<span class="mt-1 h-2.5 w-2.5 shrink-0 rounded-full {domainColors[domain - 1]}"
								></span>
								<p class="min-h-10 text-xs font-medium leading-5 text-text-secondary">
									{DOMAIN_NAMES[domain]}
								</p>
							</div>
							<p class="mt-3 text-3xl font-bold text-text-primary">{percentage}%</p>
							<div class="mt-3 h-1.5 overflow-hidden rounded-full bg-surface-600">
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
			<section class="glass rounded-2xl p-5 sm:p-6">
				<div class="flex items-center justify-between">
					<div class="flex items-center gap-3">
						<div class="grid h-10 w-10 place-items-center rounded-xl bg-accent/10 text-accent">
							<svg viewBox="0 0 24 24" class="h-5 w-5" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 3"/></svg>
						</div>
						<div>
							<h2 class="font-bold text-text-primary">Recent sessions</h2>
						</div>
					</div>
					<a class="text-sm font-medium text-accent hover:underline" href="/history">View all</a>
				</div>
				<div class="mt-4 space-y-2">
					{#each data.recentSessions.slice(0, 5) as session}
						<a
							href="/history/{session.id}"
							class="flex items-center justify-between rounded-xl bg-surface-700/50 p-3 transition hover:bg-surface-700/80"
						>
							<div class="flex items-center gap-3">
								<span class="rounded-full bg-surface-800 px-2.5 py-1 text-xs font-medium text-text-secondary">
									{session.type === 'quiz' ? 'Quiz' : session.type === 'scenario' ? 'Scenario' : session.type === 'pbq' ? 'PBQ' : 'Full Exam'}
								</span>
								<span class="text-sm text-text-muted">
									{new Date(session.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
								</span>
							</div>
							<span class="text-sm font-semibold {session.percentage >= 85 ? 'text-green-400' : session.percentage >= 60 ? 'text-yellow-400' : 'text-red-400'}">
								{session.earnedPoints.toFixed(1)}/{session.possiblePoints} ({session.percentage}%)
							</span>
						</a>
					{/each}
				</div>
			</section>
		{/if}
		{#if hasProgress}
			<section class="glass rounded-2xl p-5 sm:p-6">
				<div class="flex items-center gap-3">
					<div
						class="grid h-10 w-10 place-items-center rounded-xl bg-accent-warm/10 text-accent-warm"
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
						<h2 class="font-bold text-text-primary">Objectives to review</h2>
						<p class="text-sm text-text-muted">
							Focus your next session where practice will have the most impact.
						</p>
					</div>
				</div>
				{#if data.weakTopics.length}
					<div class="mt-5 space-y-3">
						{#each data.weakTopics as topic}<div
								class="rounded-xl border border-border bg-surface-700/50 p-4"
							>
								<div class="flex flex-wrap items-center justify-between gap-2">
									<div class="flex items-center gap-2">
										<span
											class="rounded-md bg-surface-800 px-2 py-1 font-mono text-xs font-semibold text-text-secondary"
											>{topic.objective}</span
										><span class="text-sm text-text-secondary">{DOMAIN_NAMES[topic.domain]}</span>
									</div>
									<span
										class="rounded-full px-2.5 py-1 text-xs font-semibold {severity(topic).class}"
										>{severity(topic).label}</span
									>
								</div>
								<div class="mt-3 flex items-center gap-3">
									<div class="h-1.5 flex-1 overflow-hidden rounded-full bg-surface-600">
										<div
											class="h-full rounded-full {getBarColor(topic.percentage)}"
											style={`width: ${topic.percentage}%`}
										></div>
									</div>
									<span class="w-10 text-right text-sm font-semibold text-text-primary"
										>{topic.percentage}%</span
									>
								</div>
							</div>{/each}
					</div>
				{:else}
					<p class="mt-5 rounded-xl bg-surface-700/60 p-4 text-sm text-text-secondary">
						No weak topics identified yet. Complete more questions to build a reliable assessment.
					</p>
				{/if}
			</section>
		{:else}
			<section class="glass grid min-h-80 place-items-center rounded-3xl p-8 text-center">
				<div>
					<div
						class="mx-auto grid h-14 w-14 place-items-center rounded-2xl bg-accent/10 text-accent"
					>
						<svg
							viewBox="0 0 24 24"
							class="h-7 w-7"
							fill="none"
							stroke="currentColor"
							stroke-width="1.8"><path d="M4 19V9m5 10V5m5 14v-7m5 7V3" /></svg
						>
					</div>
					<h2 class="mt-5 text-xl font-bold text-text-primary">
						Start a quiz to see your progress
					</h2>
					<p class="mx-auto mt-2 max-w-sm text-text-secondary">
						Your domain scores and recommended review topics will appear after your first completed
						session.
					</p>
					<button
						class="mt-6 h-12 rounded-xl bg-gradient-to-r from-accent to-accent-secondary px-6 font-semibold text-white transition hover:brightness-110 active:scale-[0.98]"
						type="button"
						onclick={() => goto('/quiz')}>Start a quiz</button
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
