<script lang="ts">
	import { goto } from '$app/navigation';
	import { page } from '$app/state';
	import { onMount } from 'svelte';
	import ProgressRing from '$lib/components/ProgressRing.svelte';
	import StatusChip from '$lib/components/StatusChip.svelte';
	import ContextRail from '$lib/components/ContextRail.svelte';
	import { DOMAIN_NAMES, formatDate, getPercentColor } from '$lib/utils';

	const VALID_TABS = ['grades', 'mastery', 'sessions'] as const;
	type Tab = (typeof VALID_TABS)[number];
	const TABS: { id: Tab; label: string }[] = [
		{ id: 'grades', label: 'Grades' },
		{ id: 'mastery', label: 'Mastery' },
		{ id: 'sessions', label: 'Sessions' }
	];

	type CategoryGrade = {
		category: string;
		label: string;
		weight: number;
		earned: number;
		possible: number;
		percentage: number | null;
		submittedCount: number;
		totalCount: number;
	};
	type AssignmentGrade = {
		assignment: { id: string; title: string; kind: string; points: number };
		percentage: number;
		dueDate: string;
		overridden: boolean;
		derivedDueDateLabel?: string;
		status: 'open' | 'due-soon' | 'overdue' | 'in-progress' | 'submitted';
	};
	type Gradebook = {
		weightedPercentage: number | null;
		letterGrade: string;
		categories: CategoryGrade[];
		assignments: AssignmentGrade[];
		submittedAssignments: number;
		totalAssignments: number;
	};
	type Readiness = {
		score: number;
		label: string;
		practiceTargetPercent: number;
		officialPassingScore: number;
		ready: boolean;
	};
	type ObjectiveCell = {
		objective: string;
		domain: number;
		attempted: number;
		earnedPoints: number;
		possiblePoints: number;
		percentage: number | null;
		availableQuestions: number;
	};
	type DomainRollup = {
		domain: number;
		attempted: number;
		possiblePoints: number;
		earnedPoints: number;
		percentage: number | null;
	};
	type MasteryData = {
		objectives: ObjectiveCell[];
		domains: DomainRollup[];
		totalAttempted: number;
	};
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

	let gradeData = $state<{ gradebook: Gradebook; readiness: Readiness } | null>(null);
	let gradeError = $state('');
	let masteryData = $state<MasteryData | null>(null);
	let masteryError = $state('');
	let sessions = $state<SessionSummary[] | null>(null);

	let activeTab = $derived.by<Tab>(() => {
		const requested = page.url.searchParams.get('tab');
		return VALID_TABS.find((tab) => tab === requested) ?? 'grades';
	});

	onMount(async () => {
		const [gradeResponse, masteryResponse, historyResponse] = await Promise.all([
			fetch('/api/gradebook'),
			fetch('/api/mastery'),
			fetch('/api/history')
		]);
		if (gradeResponse.ok) gradeData = await gradeResponse.json();
		else gradeError = 'Unable to load the gradebook.';
		if (masteryResponse.ok) masteryData = await masteryResponse.json();
		else masteryError = 'Unable to load mastery data.';
		if (historyResponse.ok) {
			const data = await historyResponse.json();
			sessions = data.sessions ?? [];
		}
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

	function pctClass(pct: number | null): string {
		if (pct === null) return 'text-text-muted';
		if (pct >= 85) return 'text-success';
		if (pct >= 60) return 'text-warning';
		return 'text-danger';
	}

	function cellClass(cell: ObjectiveCell): string {
		if (cell.percentage === null) return 'border border-border bg-surface-900/50 text-text-muted';
		if (cell.percentage >= 85) return 'border border-success/40 bg-success/15 text-success';
		if (cell.percentage >= 60) return 'border border-warning/40 bg-warning/15 text-warning';
		return 'border border-danger/40 bg-danger/15 text-danger';
	}

	function domainBarClass(rollup: DomainRollup): string {
		if (rollup.percentage === null) return 'bg-surface-600';
		if (rollup.percentage >= 85) return 'bg-success';
		if (rollup.percentage >= 60) return 'bg-warning';
		return 'bg-danger';
	}

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

	function formatDateTime(iso: string): string {
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

{#snippet loading(label: string)}
	<div class="grid min-h-64 place-items-center">
		<div class="text-center">
			<span
				class="mx-auto block h-10 w-10 animate-spin rounded-full border-4 border-surface-600 border-t-accent"
			></span>
			<p class="mt-4 text-text-secondary">{label}</p>
		</div>
	</div>
{/snippet}

<div class="grid gap-6 xl:grid-cols-[minmax(0,1fr)_20rem] xl:gap-8">
	<div class="space-y-6 sm:space-y-8">
		<header class="card p-6 sm:p-8">
			<p class="eyebrow">Evaluation</p>
			<h1 class="h-display mt-2 text-3xl text-text-primary sm:text-4xl">
				The <span class="serif-italic text-accent">ledger</span>
			</h1>
			<p class="mt-3 max-w-xl text-sm leading-relaxed text-text-secondary sm:text-base">
				Weighted grades, objective mastery, and every completed session — the full account of where
				you stand.
			</p>
		</header>

		<nav aria-label="Ledger sections" class="flex flex-wrap gap-2">
			{#each TABS as tab (tab.id)}
				<a
					href="/progress?tab={tab.id}"
					aria-current={activeTab === tab.id ? 'page' : undefined}
					class="inline-flex min-h-11 items-center rounded px-5 text-sm font-semibold transition {activeTab ===
					tab.id
						? 'bg-accent/12 text-accent'
						: 'text-text-secondary hover:bg-surface-700/60 hover:text-text-primary'}"
				>
					{tab.label}
				</a>
			{/each}
		</nav>

		{#if activeTab === 'grades'}
			{#if gradeError}
				<section class="card p-6 text-danger">{gradeError}</section>
			{:else if !gradeData}
				{@render loading('Loading grades…')}
			{:else}
				{@const { gradebook, readiness } = gradeData}
				<div class="space-y-6">
					<section class="card grid gap-6 p-6 sm:grid-cols-3 sm:p-8">
						<div class="flex flex-col items-center justify-center text-center">
							<ProgressRing
								value={gradebook.weightedPercentage ?? 0}
								size={120}
								stroke={12}
								label="Course grade"
							/>
							<p class="mt-3 text-sm text-text-muted">
								{gradebook.submittedAssignments}/{gradebook.totalAssignments} assignments graded
							</p>
						</div>
						<div class="flex flex-col items-center justify-center text-center">
							<p class="num-display text-6xl text-text-primary">{gradebook.letterGrade}</p>
							<p class="mt-2 text-sm text-text-muted">
								{gradebook.weightedPercentage === null
									? 'No grades yet'
									: `${gradebook.weightedPercentage}% weighted`}
							</p>
						</div>
						<div class="flex flex-col items-center justify-center text-center">
							<ProgressRing value={readiness.score} size={120} stroke={12} label="Readiness" />
							<p class="mt-3 text-sm font-bold {readiness.ready ? 'text-success' : 'text-warning'}">
								{readiness.label}
							</p>
							<p class="text-xs text-text-muted">
								App practice target: {readiness.practiceTargetPercent}% · official pass:
								{readiness.officialPassingScore}/900
							</p>
						</div>
					</section>

					{#if gradebook.categories.some((c) => c.percentage !== null)}
						<section class="card p-5 sm:p-6">
							<h2 class="h-display mb-4 text-xl text-text-primary">Category breakdown</h2>
							<div class="space-y-4">
								{#each gradebook.categories as category (category.category)}
									<div>
										<div class="flex items-center justify-between text-sm">
											<span class="font-bold text-text-primary">
												{category.label}
												<span class="ml-2 text-xs font-semibold text-text-muted"
													>{Math.round(category.weight * 100)}% weight</span
												>
											</span>
											<span class="font-bold {pctClass(category.percentage)}">
												{category.percentage === null ? 'Not attempted' : `${category.percentage}%`}
												<span class="ml-1 text-xs font-normal text-text-muted"
													>({category.earned.toFixed(1)}/{category.possible} pts)</span
												>
											</span>
										</div>
										<div class="mt-1.5 h-2 overflow-hidden rounded bg-surface-600">
											<div
												class="h-full rounded {category.percentage === null
													? 'bg-surface-600'
													: category.percentage >= 85
														? 'bg-success'
														: category.percentage >= 60
															? 'bg-warning'
															: 'bg-danger'}"
												style="width: {category.percentage ?? 0}%"
											></div>
										</div>
										<p class="mt-1 text-xs text-text-muted">
											{category.submittedCount}/{category.totalCount} assignments submitted
										</p>
									</div>
								{/each}
							</div>
						</section>
					{/if}

					<section class="card p-5 sm:p-6">
						<h2 class="h-display mb-4 text-xl text-text-primary">All assignments</h2>

						<!-- Mobile: stacked cards -->
						<div class="space-y-2.5 md:hidden">
							{#each gradebook.assignments as item (item.assignment.id)}
								<a
									href="/assignments/{item.assignment.id}"
									class="block rounded-xl border border-border bg-surface-900/50 p-4 transition hover:border-border-strong hover:bg-surface-700/50"
								>
									<div class="flex items-start justify-between gap-3">
										<div class="min-w-0">
											<p class="truncate text-sm font-semibold text-text-primary">
												{item.assignment.title}
											</p>
											<p class="mt-1 text-xs text-text-muted">
												{kindLabel(item.assignment.kind)} · due {formatDate(item.dueDate)} · {item
													.assignment.points} pts
											</p>
										</div>
										<span
											class="num-display shrink-0 text-lg {pctClass(
												item.status === 'submitted' ? item.percentage : null
											)}"
										>
											{item.status === 'submitted' ? `${item.percentage}%` : '—'}
										</span>
									</div>
									<div class="mt-3"><StatusChip status={item.status} /></div>
								</a>
							{/each}
						</div>

						<!-- Desktop: table -->
						<div class="hidden overflow-x-auto md:block">
							<table class="w-full min-w-[560px] text-sm">
								<thead>
									<tr
										class="border-b border-border text-left text-xs uppercase tracking-wide text-text-muted"
									>
										<th class="pb-3 pr-4 font-bold">Assignment</th>
										<th class="pb-3 pr-4 font-bold">Due</th>
										<th class="pb-3 pr-4 font-bold">Points</th>
										<th class="pb-3 pr-4 font-bold">Score</th>
										<th class="pb-3 font-bold">Status</th>
									</tr>
								</thead>
								<tbody class="divide-y divide-border">
									{#each gradebook.assignments as item (item.assignment.id)}
										<tr class="transition hover:bg-surface-700/30">
											<td class="py-3 pr-4">
												<a
													href="/assignments/{item.assignment.id}"
													class="font-semibold text-text-primary hover:text-accent"
												>
													<span class="chip mr-2 bg-surface-700 text-text-muted"
														>{kindLabel(item.assignment.kind)}</span
													>
													{item.assignment.title}
												</a>
											</td>
											<td class="py-3 pr-4 text-text-muted">
												{formatDate(item.dueDate)}
												{#if item.overridden}
													<span
														class="chip ml-1 bg-accent/10 text-accent"
														title="Pinned by a due-date override">pinned</span
													>
												{/if}
											</td>
											<td class="py-3 pr-4 text-text-muted">{item.assignment.points}</td>
											<td
												class="num-display py-3 pr-4 {pctClass(
													item.status === 'submitted' ? item.percentage : null
												)}"
											>
												{item.status === 'submitted' ? `${item.percentage}%` : '—'}
											</td>
											<td class="py-3"><StatusChip status={item.status} /></td>
										</tr>
									{/each}
								</tbody>
							</table>
						</div>
					</section>
				</div>
			{/if}
		{:else if activeTab === 'mastery'}
			{#if masteryError}
				<section class="card p-6 text-danger">{masteryError}</section>
			{:else if !masteryData}
				{@render loading('Loading mastery…')}
			{:else}
				<div class="space-y-5">
					<div>
						<h2 class="h-display text-xl text-text-primary">
							All {masteryData.objectives.length} objectives
						</h2>
						<p class="mt-1 text-sm leading-relaxed text-text-secondary">
							Accuracy per objective across every session you've completed. Tap any objective to
							drill it with a 5-question practice session — the red ones are free points on exam
							day.
						</p>
					</div>

					<!-- Legend -->
					<div class="flex flex-wrap items-center gap-x-4 gap-y-2 text-xs text-text-muted">
						<span class="flex items-center gap-1.5"
							><span class="h-3.5 w-3.5 rounded-[4px] border border-border bg-surface-800"></span>
							Never tried</span
						><span class="flex items-center gap-1.5"
							><span class="h-3.5 w-3.5 rounded-[4px] bg-danger/40"></span> &lt;60%</span
						><span class="flex items-center gap-1.5"
							><span class="h-3.5 w-3.5 rounded-[4px] bg-warning/40"></span> 60–84%</span
						><span class="flex items-center gap-1.5"
							><span class="h-3.5 w-3.5 rounded-[4px] bg-success/50"></span> 85%+</span
						>
						{#if masteryData.totalAttempted > 0}
							<span class="font-semibold text-text-secondary"
								>{masteryData.totalAttempted} answers tracked</span
							>
						{/if}
					</div>

					{#if masteryData.totalAttempted === 0}
						<section class="card p-6">
							<p class="text-text-secondary">
								No answers tracked yet — complete a
								<a
									class="touch-target font-semibold text-accent hover:underline"
									href="/quiz?start=1">quiz</a
								>,
								<a class="touch-target font-semibold text-accent hover:underline" href="/pbq"
									>PBQ set</a
								>, or
								<a
									class="touch-target font-semibold text-accent hover:underline"
									href="/quiz?start=1&type=full&mode=exam">full exam</a
								>
								and every objective's accuracy lights up here.
							</p>
						</section>
					{/if}

					{#each masteryData.domains as rollup (rollup.domain)}
						<section class="card p-5 sm:p-6">
							<div class="flex items-center justify-between gap-3">
								<div class="min-w-0">
									<h3 class="h-display text-lg text-text-primary">
										<span class="text-accent">D{rollup.domain}</span> · {DOMAIN_NAMES[
											rollup.domain
										]}
									</h3>
									<p class="mt-0.5 text-xs text-text-muted">
										{rollup.attempted} answers
										{#if rollup.percentage !== null}
											· {rollup.percentage}% accurate{/if}
									</p>
								</div>
								<div
									class="hidden h-2 w-32 shrink-0 overflow-hidden rounded bg-surface-600 sm:block"
								>
									<div
										class="h-full rounded {domainBarClass(rollup)}"
										style="width: {rollup.percentage ?? 0}%"
									></div>
								</div>
							</div>
							<div class="mt-4 grid grid-cols-4 gap-2 sm:grid-cols-6">
								{#each masteryData.objectives.filter((cell) => cell.domain === rollup.domain) as cell (cell.objective)}
									<button
										class="flex min-h-14 flex-col items-center justify-center rounded-md px-1 py-2 transition hover:opacity-80 {cellClass(
											cell
										)}"
										title="Objective {cell.objective} — {cell.availableQuestions} questions in the bank"
										type="button"
										onclick={() =>
											goto(
												`/quiz?start=1&count=5&domain=${cell.domain}&objective=${cell.objective}&mode=practice`
											)}
									>
										<span class="text-sm font-bold">{cell.objective}</span>
										<span class="mt-0.5 text-[11px] font-semibold">
											{cell.percentage === null ? '—' : `${cell.percentage}%`}
										</span>
									</button>
								{/each}
							</div>
						</section>
					{/each}
				</div>
			{/if}
		{:else}
			{#if sessions === null}
				{@render loading('Loading sessions…')}
			{:else if sessions.length === 0}
				<section class="card grid min-h-80 place-items-center p-8 text-center">
					<div>
						<div class="mx-auto grid h-14 w-14 place-items-center rounded bg-accent/10 text-accent">
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
						<a
							href="/history/{session.id}"
							class="card block p-4 transition hover:-translate-y-0.5 hover:shadow-[var(--shadow-lift)]"
						>
							<div class="flex items-center justify-between gap-3">
								<span class="chip bg-surface-700 text-text-secondary"
									>{typeLabel(session.type)}</span
								>
								<span class="num-display text-lg font-bold {getPercentColor(session.percentage)}">
									{session.percentage}%
								</span>
							</div>
							<p class="mt-2 text-sm text-text-muted">{formatDateTime(session.completedAt)}</p>
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
								<th class="px-5 py-3 text-xs font-bold uppercase tracking-wide text-text-muted"
									>Date</th
								>
								<th class="px-5 py-3 text-xs font-bold uppercase tracking-wide text-text-muted"
									>Type</th
								>
								<th class="px-5 py-3 text-xs font-bold uppercase tracking-wide text-text-muted"
									>Score</th
								>
								<th class="px-5 py-3 text-xs font-bold uppercase tracking-wide text-text-muted">
									Percentage
								</th>
								<th class="px-5 py-3 text-xs font-bold uppercase tracking-wide text-text-muted">
									Duration
								</th>
								<th class="px-5 py-3"></th>
							</tr>
						</thead>
						<tbody>
							{#each sessions as session (session.id)}
								<tr class="border-b border-border transition last:border-0 hover:bg-surface-700/30">
									<td class="px-5 py-4 text-text-primary">{formatDateTime(session.completedAt)}</td>
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
										<a class="btn btn-ghost h-11 px-4 text-xs" href="/history/{session.id}"
											>Review</a
										>
									</td>
								</tr>
							{/each}
						</tbody>
					</table>
				</section>
			{/if}
		{/if}
	</div>

	<ContextRail title="Standing">
		{#if gradeData}
			{@const { gradebook, readiness } = gradeData}
			<div class="card p-5">
				<div class="flex items-baseline justify-between">
					<p class="text-xs font-semibold uppercase tracking-[0.12em] text-text-muted">
						Course grade
					</p>
					<p class="num-display text-2xl text-text-primary">{gradebook.letterGrade}</p>
				</div>
				<p class="mt-1 text-xs text-text-muted">
					{gradebook.weightedPercentage === null
						? 'No grades yet'
						: `${gradebook.weightedPercentage}% weighted`}
				</p>
				<div class="mt-4">
					<div class="flex justify-between text-xs">
						<span class="text-text-muted">Readiness</span>
						<span class="font-bold text-text-secondary">{readiness.score}</span>
					</div>
					<div class="mt-1 h-1.5 overflow-hidden rounded-sm bg-surface-600">
						<div
							class="h-full rounded-sm {readiness.ready ? 'bg-success' : 'bg-accent'}"
							style="width: {Math.min(100, readiness.score)}%"
						></div>
					</div>
					<p class="mt-1.5 text-[11px] text-text-muted">{readiness.label}</p>
				</div>
			</div>
			<div class="card p-5">
				<p class="text-xs font-semibold uppercase tracking-[0.12em] text-text-muted">Categories</p>
				<div class="mt-3 space-y-3">
					{#each gradebook.categories as category (category.category)}
						<div>
							<div class="flex justify-between text-xs">
								<span class="text-text-muted">{category.label} · {category.weight}%</span>
								<span class="font-bold text-text-secondary">{category.percentage ?? '—'}%</span>
							</div>
							<div class="mt-1 h-1.5 overflow-hidden rounded-sm bg-surface-600">
								<div
									class="h-full rounded-sm bg-accent-secondary"
									style="width: {category.percentage ?? 0}%"
								></div>
							</div>
						</div>
					{/each}
				</div>
			</div>
		{:else}
			<div class="card p-5">
				<div class="h-16 animate-pulse-slow rounded bg-surface-700"></div>
			</div>
		{/if}

		<nav class="card p-5" aria-label="Related">
			<p class="text-xs font-semibold uppercase tracking-[0.12em] text-text-muted">Keep going</p>
			<div class="mt-3 space-y-1">
				<a
					href="/practice"
					class="flex min-h-11 items-center rounded px-2 text-sm text-text-secondary transition hover:bg-surface-700 hover:text-text-primary"
					>Practice drills</a
				>
				<a
					href="/review"
					class="flex min-h-11 items-center rounded px-2 text-sm text-text-secondary transition hover:bg-surface-700 hover:text-text-primary"
					>Daily review</a
				>
				<a
					href="/syllabus"
					class="flex min-h-11 items-center rounded px-2 text-sm text-text-secondary transition hover:bg-surface-700 hover:text-text-primary"
					>Syllabus</a
				>
			</div>
		</nav>
	</ContextRail>
</div>
