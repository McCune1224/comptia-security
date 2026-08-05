<script lang="ts">
	import { goto } from '$app/navigation';
	import { onMount } from 'svelte';
	import ProgressRing from '$lib/components/ProgressRing.svelte';
	import StatusChip from '$lib/components/StatusChip.svelte';
	import { formatDate, relativeDue } from '$lib/utils';

	type AssignmentView = {
		assignment: {
			id: string;
			title: string;
			kind: string;
			points: number;
			description: string;
		};
		dueDateLabel: string;
		daysUntilDue: number;
		status: 'open' | 'due-soon' | 'overdue' | 'in-progress' | 'submitted';
		bestSubmission: { percentage: number } | null;
	};
	type ModuleView = {
		module: { id: string; week: number; title: string; description: string };
		lessonsCompleted: number;
		lessonsTotal: number;
		assignmentsSubmitted: number;
		assignmentsTotal: number;
	};
	type Overview = {
		examDate: string;
		examDateLabel: string;
		daysUntilExam: number;
		readiness: {
			score: number;
			label: string;
			domainMastery: number | null;
			examAverage: number | null;
			examCount: number;
			passingScale: number;
			ready: boolean;
		};
		gradebook: {
			weightedPercentage: number | null;
			letterGrade: string;
			submittedAssignments: number;
			totalAssignments: number;
		};
		modules: ModuleView[];
		toDo: AssignmentView[];
		recentSessions: { id: string; date: string; type: string; percentage: number }[];
		activeSessionId: string | null;
	};

	let overview = $state<Overview | null>(null);
	let error = $state('');

	onMount(async () => {
		const response = await fetch('/api/course/overview');
		if (response.ok) overview = await response.json();
		else error = 'Unable to load course overview.';
	});

	function kindLabel(kind: string): string {
		return kind === 'quiz'
			? 'Quiz'
			: kind === 'scenario'
				? 'Scenario'
				: kind === 'pbq'
					? 'PBQ'
					: 'Full Exam';
	}

	const domainColors = [
		'bg-accent',
		'bg-accent-secondary',
		'bg-info',
		'bg-success',
		'bg-accent-warm'
	];
</script>

<div class="space-y-6 sm:space-y-8">
	{#if error}
		<section class="card p-6 text-danger">{error}</section>
	{:else if !overview}
		<div class="grid min-h-64 place-items-center">
			<div class="text-center">
				<span
					class="mx-auto block h-10 w-10 animate-spin rounded-full border-4 border-surface-600 border-t-accent"
				></span>
				<p class="mt-4 text-text-secondary">Loading course…</p>
			</div>
		</div>
	{:else}
		<!-- Course banner -->
		<section
			class="relative overflow-hidden rounded-md border border-border-strong bg-surface-900 p-6 sm:p-8"
		>
			<div class="relative flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
				<div>
					<p class="eyebrow">SEC+ 701 · Course home</p>
					<h1 class="h-display mt-2 text-3xl text-text-primary sm:text-4xl">
						CompTIA Security+ <span class="text-accent">(SY0-701)</span>
					</h1>
					<p class="mt-3 max-w-xl text-sm leading-relaxed text-text-secondary sm:text-base">
						Exam: <span class="font-semibold text-text-primary">{overview.examDateLabel}</span>
						<span class="mx-2 text-text-subtle">·</span>
						<span
							class="font-bold {overview.daysUntilExam < 7
								? 'text-accent-warm'
								: 'text-text-primary'}"
						>
							{overview.daysUntilExam < 0
								? `Exam passed ${-overview.daysUntilExam} days ago`
								: overview.daysUntilExam === 0
									? 'Exam is today'
									: `${overview.daysUntilExam} days until the exam`}
						</span>
					</p>
					<div class="mt-6 flex flex-wrap gap-3">
						<a href="/syllabus" class="btn btn-primary">
							<svg
								viewBox="0 0 24 24"
								class="h-4 w-4"
								fill="none"
								stroke="currentColor"
								stroke-width="2"
								><path
									d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20V4a2 2 0 0 0-2-2H6.5A2.5 2.5 0 0 0 4 4.5v15Z"
								/><path d="M4 19.5A2.5 2.5 0 0 0 6.5 22H20v-5" /></svg
							>
							View syllabus
						</a>
						<a href="/gradebook" class="btn btn-ghost">
							<svg
								viewBox="0 0 24 24"
								class="h-4 w-4"
								fill="none"
								stroke="currentColor"
								stroke-width="2"><path d="M4 19V9m5 10V5m5 14v-7m5 7V3" /></svg
							>
							Gradebook
						</a>
					</div>
				</div>
				<div class="flex items-center justify-around gap-6 lg:justify-end">
					<div class="text-center">
						<ProgressRing
							value={overview.readiness.score}
							size={120}
							stroke={12}
							label="Readiness"
						/>
						<p
							class="mt-2 text-sm font-bold {overview.readiness.ready
								? 'text-success'
								: 'text-accent-warm'}"
						>
							{overview.readiness.label}
						</p>
						<p class="mt-1 text-xs text-text-muted">
							Projected scaled score: {overview.readiness.passingScale}/900
						</p>
					</div>
					<div class="hidden h-24 w-px bg-border sm:block"></div>
					<div class="text-center">
						<p class="num-display text-4xl text-text-primary">
							{overview.gradebook.letterGrade}
						</p>
						<p class="mt-1 text-xs text-text-muted">Course grade</p>
						<p class="mt-2 text-sm font-semibold text-text-secondary">
							{overview.gradebook.submittedAssignments}/{overview.gradebook.totalAssignments} assignments
						</p>
					</div>
				</div>
			</div>
		</section>

		<!-- To-do + readiness panel -->
		<div class="grid gap-6 lg:grid-cols-3">
			<section class="card p-5 sm:p-6 lg:col-span-2">
				<div class="flex items-center justify-between">
					<h2 class="h-display flex items-center gap-2 text-xl text-text-primary">
						<svg
							viewBox="0 0 24 24"
							class="h-5 w-5 text-accent"
							fill="none"
							stroke="currentColor"
							stroke-width="2"><circle cx="12" cy="12" r="9" /><path d="M12 7v5l3 3" /></svg
						>
						What's due
					</h2>
					<a class="text-sm font-bold text-accent hover:underline" href="/calendar">Calendar →</a>
				</div>
				{#if overview.toDo.length === 0}
					<p class="mt-5 rounded-md bg-success/10 p-4 text-sm text-success">
						🎉 Everything is submitted. Great work — keep the momentum with a practice session.
					</p>
				{:else}
					<div class="mt-4 space-y-2.5">
						{#each overview.toDo as item (item.assignment.id)}
							<a
								href="/assignments/{item.assignment.id}"
								class="flex items-center justify-between gap-3 rounded-md border border-border bg-surface-800/60 p-4 transition hover:border-border-strong hover:bg-surface-700/60"
							>
								<div class="flex min-w-0 items-center gap-3">
									<span class="chip shrink-0 bg-surface-700 text-text-muted"
										>{kindLabel(item.assignment.kind)}</span
									>
									<div class="min-w-0">
										<p class="truncate text-sm font-bold text-text-primary">
											{item.assignment.title}
										</p>
										<p
											class="mt-0.5 text-xs {item.daysUntilDue < 0
												? 'text-danger'
												: item.daysUntilDue <= 2
													? 'text-accent-warm'
													: 'text-text-muted'}"
										>
											{relativeDue(item.daysUntilDue)} · {item.assignment.points} pts
										</p>
									</div>
								</div>
								<StatusChip status={item.status} />
							</a>
						{/each}
					</div>
				{/if}
			</section>

			<section class="card p-5 sm:p-6">
				<h2 class="h-display text-xl text-text-primary">Exam readiness</h2>
				<div class="mt-4 space-y-4">
					<div>
						<div class="flex justify-between text-sm">
							<span class="text-text-muted">Domain mastery</span>
							<span class="font-bold text-text-secondary"
								>{overview.readiness.domainMastery ?? '—'}%</span
							>
						</div>
						<div class="mt-1.5 h-2 overflow-hidden rounded-full bg-surface-600">
							<div
								class="h-full rounded-full bg-info"
								style="width: {overview.readiness.domainMastery ?? 0}%"
							></div>
						</div>
					</div>
					<div>
						<div class="flex justify-between text-sm">
							<span class="text-text-muted">Full-exam average</span>
							<span class="font-bold text-text-secondary"
								>{overview.readiness.examAverage ?? '—'}%</span
							>
						</div>
						<div class="mt-1.5 h-2 overflow-hidden rounded-full bg-surface-600">
							<div
								class="h-full rounded-full bg-accent-secondary"
								style="width: {overview.readiness.examAverage ?? 0}%"
							></div>
						</div>
					</div>
					{#if overview.readiness.examCount === 0}
						<p class="rounded-md bg-surface-700/60 p-3 text-xs leading-relaxed text-text-muted">
							No full-length exams yet. Take one to unlock a reliable readiness estimate — target
							85%+.
						</p>
					{:else if !overview.readiness.ready}
						<p class="rounded-md bg-surface-700/60 p-3 text-xs leading-relaxed text-text-muted">
							Keep pushing — you need <strong class="text-text-secondary">83.3%</strong> (750/900) to
							pass. Focus on your weak objectives and retake a full exam.
						</p>
					{:else}
						<p class="rounded-md bg-success/10 p-3 text-xs leading-relaxed text-success">
							You're scoring above the passing threshold. Keep the streak and book that exam!
						</p>
					{/if}
					<a href="/quiz?start=1&type=full&mode=exam" class="btn btn-primary w-full"
						>Take a full exam now</a
					>
				</div>
			</section>
		</div>

		<!-- Modules -->
		<section>
			<div class="mb-4 flex items-center justify-between">
				<h2 class="h-display text-xl text-text-primary">Course modules</h2>
				<a class="text-sm font-bold text-accent hover:underline" href="/syllabus">Full syllabus</a>
			</div>
			<div class="grid gap-4 md:grid-cols-2">
				{#each overview.modules as module (module.module.id)}
					<a
						href="/modules/{module.module.id}"
						class="card group p-5 transition-all duration-200 hover:border-accent/50"
					>
						<div class="flex items-start justify-between gap-3">
							<div class="flex items-center gap-3">
								<span
									class="num-display grid h-11 w-11 shrink-0 place-items-center rounded-md bg-accent/15 text-sm text-accent"
									>W{module.module.week}</span
								>
								<div>
									<h3 class="h-display text-lg text-text-primary group-hover:text-accent">
										{module.module.title}
									</h3>
									<p class="mt-0.5 text-xs text-text-muted">
										{module.lessonsCompleted}/{module.lessonsTotal} lessons · {module.assignmentsSubmitted}/{module.assignmentsTotal}
										assignments
									</p>
								</div>
							</div>
							<span class="text-text-subtle transition group-hover:text-accent">→</span>
						</div>
						<p class="mt-3 line-clamp-2 text-xs leading-5 text-text-secondary">
							{module.module.description}
						</p>
						<div class="mt-4 h-2 overflow-hidden rounded-full bg-surface-600">
							<div
								class="animate-progress h-full rounded-full bg-accent"
								style="width: {module.assignmentsTotal
									? (module.assignmentsSubmitted / module.assignmentsTotal) * 100
									: 0}%"
							></div>
						</div>
					</a>
				{/each}
			</div>
		</section>

		<!-- Recent sessions -->
		{#if overview.recentSessions.length}
			<section class="card p-5 sm:p-6">
				<div class="flex items-center justify-between">
					<h2 class="h-display text-xl text-text-primary">Recent sessions</h2>
					<a class="text-sm font-bold text-accent hover:underline" href="/history">View all</a>
				</div>
				<div class="mt-4 grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
					{#each overview.recentSessions as session (session.id)}
						<a
							href="/history/{session.id}"
							class="flex items-center justify-between gap-2 rounded-md border border-border bg-surface-800/60 p-3 transition hover:border-border-strong hover:bg-surface-700/60"
						>
							<div class="flex items-center gap-3">
								<span class="chip bg-surface-700 text-text-secondary"
									>{kindLabel(session.type)}</span
								>
								<span class="text-sm text-text-muted">{formatDate(session.date)}</span>
							</div>
							<span
								class="num-display text-sm {session.percentage >= 85
									? 'text-success'
									: session.percentage >= 60
										? 'text-accent-warm'
										: 'text-danger'}">{session.percentage}%</span
							>
						</a>
					{/each}
				</div>
			</section>
		{/if}
	{/if}
</div>
