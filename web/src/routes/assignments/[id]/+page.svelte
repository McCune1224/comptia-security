<script lang="ts">
	import { onMount } from 'svelte';
	import { goto } from '$app/navigation';
	import StatusChip from '$lib/components/StatusChip.svelte';
	import ContextRail from '$lib/components/ContextRail.svelte';
	import { relativeDue } from '$lib/utils';

	let { params } = $props();

	type AssignmentView = {
		assignment: {
			id: string;
			moduleId: string;
			title: string;
			description: string;
			kind: string;
			points: number;
			count: number;
			domain: number | null;
			mode: string;
			durationMinutes: number;
		};
		dueDateLabel: string;
		overridden: boolean;
		derivedDueDateLabel: string;
		daysUntilDue: number;
		status: 'open' | 'due-soon' | 'overdue' | 'in-progress' | 'submitted';
		bestSubmission: { percentage: number; completedAt: string; sessionId: string } | null;
		launch: { type: string; mode: string; count: number; domain?: number };
	};

	let view = $state<AssignmentView | null>(null);
	let error = $state('');

	async function load() {
		const response = await fetch(`/api/course/assignments/${params.id}`);
		if (response.ok) view = await response.json();
		else error = 'Assignment not found.';
	}

	onMount(load);

	function launch() {
		if (!view) return;
		const { launch } = view;
		const params = new URLSearchParams({
			start: '1',
			type: launch.type,
			mode: launch.mode,
			count: String(launch.count),
			assignment: view.assignment.id
		});
		if (launch.domain) params.set('domain', String(launch.domain));
		goto(`/quiz?${params}`);
	}

	function kindLabel(kind: string): string {
		return kind === 'quiz'
			? 'Objective Quiz'
			: kind === 'scenario'
				? 'Scenario Set'
				: kind === 'pbq'
					? 'PBQ Set'
					: 'Full Exam';
	}
</script>

{#if error}
	<section class="card p-6 text-danger">{error}</section>
{:else if !view}
	<div class="grid min-h-64 place-items-center">
		<span class="h-10 w-10 animate-spin rounded-full border-4 border-surface-600 border-t-accent"
		></span>
	</div>
{:else}
	<div class="grid gap-6 xl:grid-cols-[minmax(0,1fr)_20rem] xl:gap-8">
		<div class="space-y-5">
			<a
				href="/modules/{view.assignment.moduleId}"
				class="touch-target text-sm font-semibold text-accent hover:underline">← Back to module</a
			>
			<header class="card p-6 sm:p-7">
				<div class="flex flex-wrap items-center gap-3">
					<span class="chip bg-surface-700 text-text-muted">{kindLabel(view.assignment.kind)}</span>
					<StatusChip status={view.status} />
				</div>
				<h1 class="h-display mt-3 text-3xl text-text-primary sm:text-4xl">
					{view.assignment.title}
				</h1>
				<p class="mt-3 text-sm leading-relaxed text-text-secondary sm:text-base">
					{view.assignment.description}
				</p>
			</header>

			<section class="card p-6 sm:p-7">
				<p class="eyebrow">The attempt</p>
				<div class="mt-4 grid gap-4 sm:grid-cols-2">
					<div class="rounded border border-border bg-surface-900/50 p-4">
						<p class="text-xs font-semibold text-text-muted">Format</p>
						<p class="mt-1 font-bold text-text-primary">
							{view.assignment.count} questions · {view.assignment.durationMinutes} min
						</p>
						<p class="mt-1 text-xs text-text-muted">
							{view.assignment.mode === 'exam' ? 'Timed exam conditions' : 'Practice with feedback'}
						</p>
					</div>
					<div class="rounded border border-border bg-surface-900/50 p-4">
						<p class="text-xs font-semibold text-text-muted">Worth</p>
						<p class="mt-1 font-bold text-text-primary">{view.assignment.points} points</p>
						<p class="mt-1 text-xs text-text-muted">
							{view.assignment.domain
								? `Domain ${view.assignment.domain} weighted`
								: 'Mixed domains'}
						</p>
					</div>
				</div>
				<div class="mt-5 flex flex-col gap-3 sm:flex-row">
					<button class="btn btn-primary flex-1" type="button" onclick={launch}>
						{view.status === 'submitted'
							? 'Retake assignment'
							: view.status === 'in-progress'
								? 'Resume attempt'
								: 'Start assignment'}
					</button>
					<a href="/quiz" class="btn btn-ghost">Free practice</a>
				</div>
			</section>
		</div>

		<ContextRail title="This assignment">
			<div class="card p-5">
				<div class="flex items-center justify-between gap-2">
					<p class="text-xs font-semibold uppercase tracking-[0.12em] text-text-muted">Due</p>
					<StatusChip status={view.status} />
				</div>
				<p class="mt-2 font-bold {view.daysUntilDue < 0 ? 'text-danger' : 'text-text-primary'}">
					{view.dueDateLabel}
				</p>
				<p class="text-xs text-text-muted">{relativeDue(view.daysUntilDue)}</p>
				{#if view.overridden}
					<p class="mt-2 text-xs text-text-muted">
						Pinned by a due-date override (schedule would give {view.derivedDueDateLabel}).
					</p>
				{/if}
			</div>

			<div class="card p-5">
				<p class="text-xs font-semibold uppercase tracking-[0.12em] text-text-muted">
					Best submission
				</p>
				{#if view.bestSubmission}
					<div class="mt-3 flex items-center gap-4">
						<div
							class="num-display grid h-16 w-16 shrink-0 place-items-center rounded text-lg {view
								.bestSubmission.percentage >= 85
								? 'bg-success/10 text-success'
								: view.bestSubmission.percentage >= 60
									? 'bg-warning/10 text-warning'
									: 'bg-danger/10 text-danger'}"
						>
							{view.bestSubmission.percentage}%
						</div>
						<div class="min-w-0">
							<p class="text-sm text-text-secondary">
								{new Date(view.bestSubmission.completedAt).toLocaleString('en-US', {
									month: 'short',
									day: 'numeric'
								})}
							</p>
							<a
								href="/history/{view.bestSubmission.sessionId}"
								class="touch-target text-sm font-semibold text-accent hover:underline"
								>Review answers →</a
							>
						</div>
					</div>
				{:else}
					<p class="mt-2 text-sm text-text-muted">
						Nothing submitted yet. Retakes keep your best score.
					</p>
				{/if}
			</div>

			<nav class="card p-5" aria-label="Related">
				<p class="text-xs font-semibold uppercase tracking-[0.12em] text-text-muted">Related</p>
				<div class="mt-3 space-y-1">
					<a
						href="/modules/{view.assignment.moduleId}"
						class="flex min-h-11 items-center rounded px-2 text-sm text-text-secondary transition hover:bg-surface-700 hover:text-text-primary"
						>Module lessons</a
					>
					<a
						href="/progress?tab=mastery"
						class="flex min-h-11 items-center rounded px-2 text-sm text-text-secondary transition hover:bg-surface-700 hover:text-text-primary"
						>Mastery grid</a
					>
					<a
						href="/progress?tab=grades"
						class="flex min-h-11 items-center rounded px-2 text-sm text-text-secondary transition hover:bg-surface-700 hover:text-text-primary"
						>Gradebook</a
					>
				</div>
			</nav>
		</ContextRail>
	</div>
{/if}
