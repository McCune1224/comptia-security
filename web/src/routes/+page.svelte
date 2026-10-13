<script lang="ts">
	import { onMount } from 'svelte';
	import ProgressRing from '$lib/components/ProgressRing.svelte';
	import StatusChip from '$lib/components/StatusChip.svelte';
	import { formatDate, relativeDue } from '$lib/utils';

	type AssignmentView = {
		assignment: { id: string; title: string; kind: string; points: number; description: string };
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
		course: { id: string; title: string; code: string; examName: string };
		examDate: string;
		examDateLabel: string;
		daysUntilExam: number;
		readiness: {
			score: number;
			label: string;
			domainMastery: number | null;
			examAverage: number | null;
			examCount: number;
			practiceTargetPercent: number;
			officialPassingScore: number;
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
	let review = $state<{ streak: number; dueCount: number; wallCount: number } | null>(null);

	onMount(async () => {
		const response = await fetch('/api/course/overview');
		if (response.ok) overview = await response.json();
		else error = 'Unable to load course overview.';
		const reviewResponse = await fetch('/api/review');
		if (reviewResponse.ok) {
			const data = await reviewResponse.json();
			review = data.summary;
		}
	});

	function kindLabel(kind: string): string {
		return kind === 'quiz'
			? 'Quiz'
			: kind === 'scenario'
				? 'Scenario'
				: kind === 'pbq'
					? 'PBQ'
					: kind === 'review'
						? 'Review'
						: 'Full Exam';
	}

	const examLine = $derived.by(() => {
		if (!overview) return '';
		const days = overview.daysUntilExam;
		if (days < 0) return `The exam passed ${-days} ${days === -1 ? 'day' : 'days'} ago`;
		if (days === 0) return 'Exam day';
		return `${days} ${days === 1 ? 'day' : 'days'} out`;
	});

	const drills = [
		{ href: '/pbq', label: 'PBQs', hint: 'Sort, connect, configure' },
		{ href: '/scenarios', label: 'Scenarios', hint: 'Applied judgment' },
		{ href: '/progress?tab=mastery', label: 'Mastery', hint: 'Objective grid' },
		{ href: '/review', label: 'Review', hint: 'Spaced cards' }
	];
</script>

<div>
	{#if error}
		<section class="card p-6 text-danger">{error}</section>
	{:else if !overview}
		<div class="grid min-h-64 place-items-center">
			<div class="text-center">
				<span
					class="mx-auto block h-10 w-10 animate-spin rounded-full border-4 border-surface-600 border-t-accent"
				></span>
				<p class="serif-italic mt-4 text-text-secondary">Opening the book…</p>
			</div>
		</div>
	{:else}
		<div class="grid grid-cols-1 gap-4 sm:gap-5 lg:grid-cols-2 xl:grid-cols-4">
			<!-- Hero: readiness + countdown -->
			<section class="card p-6 sm:p-7 lg:col-span-2 xl:row-span-2">
				<p class="eyebrow">{overview.course.code} · ends {overview.examDateLabel}</p>
				<h1 class="h-display mt-2 text-3xl text-text-primary sm:text-4xl">
					{#if overview.course.title.includes(' (')}
						{overview.course.title.split(' (')[0]}
						<span class="serif-italic text-accent">({overview.course.title.split(' (')[1]}</span>
					{:else}
						{overview.course.title}
					{/if}
				</h1>
				<p class="mt-2.5 text-sm leading-relaxed text-text-secondary">
					{examLine} ·
					<span
						class="font-semibold {overview.readiness.ready ? 'text-success' : 'text-text-primary'}"
					>
						{overview.readiness.ready ? 'above' : 'working toward'} the
						{overview.readiness.officialPassingScore}/900 pass mark
					</span>
				</p>

				<div class="mt-6 flex flex-wrap items-center gap-6">
					<ProgressRing value={overview.readiness.score} size={104} stroke={10} label="Readiness" />
					<div class="min-w-[8rem]">
						<p class="h-display text-5xl leading-none text-text-primary">
							{overview.gradebook.letterGrade}
						</p>
						<p class="mt-1.5 text-xs text-text-muted">Course grade</p>
						<p class="text-sm font-semibold text-text-secondary">
							{overview.gradebook.submittedAssignments}/{overview.gradebook.totalAssignments} in
						</p>
					</div>
					<div class="flex-1 space-y-3">
						<div>
							<div class="flex justify-between text-xs">
								<span class="text-text-muted">Domain mastery</span>
								<span class="font-bold text-text-secondary"
									>{overview.readiness.domainMastery ?? '—'}%</span
								>
							</div>
							<div class="mt-1 h-1.5 overflow-hidden rounded bg-surface-600">
								<div
									class="h-full rounded bg-accent-secondary"
									style="width: {overview.readiness.domainMastery ?? 0}%"
								></div>
							</div>
						</div>
						<div>
							<div class="flex justify-between text-xs">
								<span class="text-text-muted">Full-exam average</span>
								<span class="font-bold text-text-secondary"
									>{overview.readiness.examAverage ?? '—'}%</span
								>
							</div>
							<div class="mt-1 h-1.5 overflow-hidden rounded bg-surface-600">
								<div
									class="h-full rounded bg-accent"
									style="width: {overview.readiness.examAverage ?? 0}%"
								></div>
							</div>
						</div>
					</div>
				</div>

				<div class="mt-6 flex flex-wrap gap-2.5">
					<a href="/syllabus" class="btn btn-primary">Open the syllabus</a>
					<a href="/quiz?start=1&type=full&mode=exam" class="btn btn-ghost">Take a full exam</a>
				</div>
			</section>

			<!-- Today -->
			<section class="card flex flex-col p-6 xl:row-span-2">
				<p class="eyebrow">Today</p>
				{#if review}
					<p class="h-display mt-3 text-4xl leading-none text-text-primary">
						{review.streak}
						<span class="serif-italic text-lg text-text-secondary">day streak</span>
					</p>
					<p class="mt-3 text-sm leading-relaxed text-text-secondary">
						{#if review.dueCount > 0}
							<span class="font-bold text-accent">{review.dueCount} cards</span> are due. Ten minutes
							keeps the forgetting curve honest.
						{:else}
							Nothing due. The wall still holds <span class="font-semibold">{review.wallCount}</span
							>.
						{/if}
					</p>
					<div class="mt-5 flex flex-col gap-2">
						<a href="/quiz?review=daily" class="btn btn-primary w-full">Start today's review</a>
						<a href="/review" class="btn btn-ghost w-full">Review queue</a>
					</div>
				{:else}
					<div class="mt-4 h-24 animate-pulse-slow rounded-xl bg-surface-700"></div>
				{/if}
			</section>

			<!-- What's due -->
			<section class="card flex flex-col p-6 xl:row-span-2">
				<div class="flex items-baseline justify-between">
					<p class="eyebrow">What's due</p>
					<a class="touch-target text-xs font-semibold text-accent hover:underline" href="/calendar"
						>Calendar →</a
					>
				</div>
				{#if overview.toDo.length === 0}
					<p class="mt-4 rounded-xl bg-success/10 p-4 text-sm text-success">
						Everything is submitted. Keep the momentum with a practice session.
					</p>
				{:else}
					<div class="mt-3 space-y-2">
						{#each overview.toDo as item (item.assignment.id)}
							<a
								href="/assignments/{item.assignment.id}"
								class="block rounded-xl border border-border bg-surface-900/50 p-3.5 transition hover:border-border-strong hover:bg-surface-700/50"
							>
								<div class="flex items-start justify-between gap-2">
									<p class="text-sm font-semibold text-text-primary">{item.assignment.title}</p>
									<StatusChip status={item.status} />
								</div>
								<p
									class="mt-1.5 text-xs {item.daysUntilDue < 0
										? 'font-bold text-danger'
										: item.daysUntilDue <= 2
											? 'font-bold text-accent'
											: 'text-text-muted'}"
								>
									{kindLabel(item.assignment.kind)} · {relativeDue(item.daysUntilDue)} · {item
										.assignment.points} pts
								</p>
							</a>
						{/each}
					</div>
				{/if}
			</section>

			<!-- Modules -->
			<section class="card p-6 lg:col-span-2">
				<div class="flex items-baseline justify-between">
					<p class="eyebrow">Course path</p>
					<a class="touch-target text-xs font-semibold text-accent hover:underline" href="/syllabus"
						>Syllabus →</a
					>
				</div>
				<div class="mt-3 grid gap-2.5 sm:grid-cols-2">
					{#each overview.modules as module (module.module.id)}
						<a
							href="/modules/{module.module.id}"
							class="group rounded-xl border border-border bg-surface-900/50 p-3.5 transition hover:border-border-strong hover:bg-surface-700/50"
						>
							<div class="flex items-center gap-3">
								<span
									class="serif-italic grid h-9 w-9 shrink-0 place-items-center rounded bg-accent/10 text-xs text-accent"
									>W{module.module.week}</span
								>
								<p
									class="min-w-0 flex-1 truncate text-sm font-semibold text-text-primary group-hover:text-accent"
								>
									{module.module.title}
								</p>
								<span class="text-xs text-text-muted"
									>{module.assignmentsSubmitted}/{module.assignmentsTotal}</span
								>
							</div>
							<div class="mt-3 h-1.5 overflow-hidden rounded bg-surface-600">
								<div
									class="animate-progress h-full rounded bg-accent"
									style="width: {module.assignmentsTotal
										? (module.assignmentsSubmitted / module.assignmentsTotal) * 100
										: 0}%"
								></div>
							</div>
						</a>
					{/each}
				</div>
			</section>

			<!-- Drills -->
			<section class="card p-6">
				<p class="eyebrow">Drills</p>
				<div class="mt-3 grid grid-cols-2 gap-2">
					{#each drills as drill (drill.href)}
						<a
							href={drill.href}
							class="rounded-xl border border-border bg-surface-900/50 p-3 transition hover:border-border-strong hover:bg-surface-700/50"
						>
							<p class="text-sm font-semibold text-text-primary">{drill.label}</p>
							<p class="mt-0.5 text-[11px] leading-snug text-text-muted">{drill.hint}</p>
						</a>
					{/each}
				</div>
				<a
					class="touch-target mt-3 text-xs font-semibold text-accent hover:underline"
					href="/practice">All practice →</a
				>
			</section>

			<!-- Recent -->
			<section class="card p-6">
				<div class="flex items-baseline justify-between">
					<p class="eyebrow">Recent</p>
					<a
						class="touch-target text-xs font-semibold text-accent hover:underline"
						href="/progress?tab=sessions">History →</a
					>
				</div>
				{#if overview.recentSessions.length}
					<div class="mt-3 space-y-2">
						{#each overview.recentSessions.slice(0, 3) as session (session.id)}
							<a
								href="/history/{session.id}"
								class="flex items-center justify-between gap-2 rounded-xl border border-border bg-surface-900/50 px-3 py-2.5 transition hover:border-border-strong hover:bg-surface-700/50"
							>
								<span class="text-xs text-text-secondary"
									>{kindLabel(session.type)} · {formatDate(session.date)}</span
								>
								<span
									class="num-display text-sm {session.percentage >= 85
										? 'text-success'
										: session.percentage >= 60
											? 'text-accent'
											: 'text-danger'}">{session.percentage}%</span
								>
							</a>
						{/each}
					</div>
				{:else}
					<p class="mt-3 text-sm text-text-muted">No sessions yet.</p>
				{/if}
			</section>
		</div>
	{/if}
</div>
