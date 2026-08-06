<script lang="ts">
	import { onMount } from 'svelte';
	import StatusChip from '$lib/components/StatusChip.svelte';
	import { relativeDue } from '$lib/utils';

	let { params } = $props();

	type LessonView = {
		id: string;
		title: string;
		summary: string;
		content: string;
		completed: boolean;
	};
	type AssignmentView = {
		assignment: {
			id: string;
			title: string;
			kind: string;
			points: number;
			description: string;
			count: number;
			durationMinutes: number;
		};
		dueDateLabel: string;
		daysUntilDue: number;
		status: 'open' | 'due-soon' | 'overdue' | 'in-progress' | 'submitted';
		bestSubmission: { percentage: number } | null;
	};
	type ModuleView = {
		module: { id: string; week: number; title: string; description: string };
		lessons: LessonView[];
		assignments: AssignmentView[];
		lessonsCompleted: number;
		lessonsTotal: number;
	};

	let moduleView = $state<ModuleView | null>(null);
	let error = $state('');
	let openLesson = $state<string | null>(null);

	async function load() {
		const response = await fetch(`/api/course/modules/${params.id}`);
		if (response.ok) moduleView = await response.json();
		else error = 'Module not found.';
	}

	onMount(load);

	async function toggleLesson(lesson: LessonView) {
		const completed = !lesson.completed;
		lesson.completed = completed;
		if (moduleView) {
			moduleView.lessonsCompleted = moduleView.lessons.filter((l) => l.completed).length;
		}
		await fetch(`/api/course/lessons/${lesson.id}`, {
			method: 'POST',
			headers: { 'content-type': 'application/json' },
			body: JSON.stringify({ completed })
		});
	}

	function kindLabel(kind: string): string {
		return kind === 'quiz'
			? 'Quiz'
			: kind === 'scenario'
				? 'Scenario'
				: kind === 'pbq'
					? 'PBQ'
					: 'Full Exam';
	}

	function renderMarkdown(text: string): string {
		// Minimal markdown: bold, headings, bullets.
		return text
			.split('\n')
			.map((line) => {
				const trimmed = line.trim();
				if (trimmed.startsWith('**')) {
					return `<p class="h-display mt-4 text-base text-text-primary">${trimmed.replace(/\*\*(.*?)\*\*/g, '$1')}</p>`;
				}
				if (trimmed.startsWith('- ')) {
					return `<p class="flex gap-2 text-sm leading-6 text-text-secondary"><span class="mt-2 h-1 w-1 shrink-0 rounded-full bg-accent"></span><span>${trimmed
						.slice(2)
						.replace(
							/\*\*(.*?)\*\*/g,
							'<strong class="text-text-primary">$1</strong>'
						)}</span></p>`;
				}
				if (!trimmed) return '';
				return `<p class="text-sm leading-6 text-text-secondary">${trimmed.replace(/\*\*(.*?)\*\*/g, '<strong class="text-text-primary">$1</strong>')}</p>`;
			})
			.join('');
	}
</script>

<div class="mx-auto max-w-4xl space-y-6">
	{#if error}
		<section class="card p-6 text-danger">{error}</section>
	{:else if !moduleView}
		<div class="grid min-h-64 place-items-center">
			<span class="h-10 w-10 animate-spin rounded-full border-4 border-surface-600 border-t-accent"
			></span>
		</div>
	{:else}
		<div>
			<a
				href="/syllabus"
				class="inline-flex min-h-10 items-center text-sm font-bold text-accent hover:underline"
				>← Syllabus</a
			>
			<p class="eyebrow mt-4">Week {moduleView.module.week}</p>
			<h1 class="h-display mt-1 text-3xl text-text-primary sm:text-4xl">
				{moduleView.module.title}
			</h1>
			<p class="mt-3 leading-relaxed text-text-secondary">{moduleView.module.description}</p>
			<div class="mt-5 flex items-center gap-3">
				<div class="h-2 flex-1 overflow-hidden rounded-full bg-surface-600">
					<div
						class="animate-progress h-full rounded-full bg-accent"
						style="width: {moduleView.lessonsTotal
							? (moduleView.lessonsCompleted / moduleView.lessonsTotal) * 100
							: 0}%"
					></div>
				</div>
				<span class="text-sm font-bold text-text-secondary"
					>{moduleView.lessonsCompleted}/{moduleView.lessonsTotal} lessons</span
				>
			</div>
			<div class="mt-5 flex flex-wrap gap-3">
				<a class="btn btn-primary" href="/quiz?start=1&type=quiz&count=10"
					>Drill this module</a
				>
				<a class="btn btn-ghost" href="/pbq">PBQ drills</a>
			</div>
		</div>

		{#if moduleView.lessons.length}
			<section class="card p-5 sm:p-6">
				<h2 class="h-display text-xl text-text-primary">Quick reference</h2>
				<p class="mb-4 mt-1 text-xs text-text-muted">
					Skim-only — the real work happens in the drills and assignments.
				</p>
				<div class="space-y-3">
					{#each moduleView.lessons as lesson (lesson.id)}
						<div class="overflow-hidden rounded-md border border-border bg-surface-800/60">
							<div
								class="flex min-h-16 w-full cursor-pointer items-center gap-3 p-4 text-left"
								role="button"
								tabindex="0"
								onclick={() => (openLesson = openLesson === lesson.id ? null : lesson.id)}
								onkeydown={(event) => {
									if (event.key === 'Enter' || event.key === ' ') {
										event.preventDefault();
										openLesson = openLesson === lesson.id ? null : lesson.id;
									}
								}}
							>
								<button
									class="grid h-8 w-8 shrink-0 cursor-pointer place-items-center rounded text-xs {lesson.completed
										? 'bg-success/15 text-success'
										: 'bg-surface-700 text-text-muted'}"
									type="button"
									role="checkbox"
									aria-checked={lesson.completed}
									aria-label={lesson.completed
										? `Mark ${lesson.title} as not read`
										: `Mark ${lesson.title} as read`}
									onclick={(event) => {
										event.stopPropagation();
										toggleLesson(lesson);
									}}
								>
									{#if lesson.completed}
										<svg
											viewBox="0 0 24 24"
											class="h-4 w-4"
											fill="none"
											stroke="currentColor"
											stroke-width="3"><path d="m5 13 4 4L19 7" /></svg
										>
									{:else}✓{/if}
								</button>
								<span class="flex-1 font-bold text-text-primary">{lesson.title}</span>
								<span class="hidden text-xs text-text-muted sm:block"
									>{lesson.completed ? 'Completed' : 'Mark as read'}</span
								>
								<svg
									viewBox="0 0 24 24"
									class="h-5 w-5 shrink-0 text-text-subtle transition-transform {openLesson ===
									lesson.id
										? 'rotate-180'
										: ''}"
									fill="none"
									stroke="currentColor"
									stroke-width="2"><path d="m6 9 6 6 6-6" /></svg
								>
							</div>
							{#if openLesson === lesson.id}
								<div class="ruled px-4 py-4">
									<p
										class="mb-3 rounded-md bg-surface-700/60 p-3 text-sm leading-relaxed text-text-muted"
									>
										{lesson.summary}
									</p>

									<div class="space-y-1">{@html renderMarkdown(lesson.content)}</div>
								</div>
							{/if}
						</div>
					{/each}
				</div>
			</section>
		{/if}

		{#if moduleView.assignments.length}
			<section class="card p-5 sm:p-6">
				<h2 class="h-display mb-4 text-xl text-text-primary">Assignments</h2>
				<div class="space-y-2.5">
					{#each moduleView.assignments as item (item.assignment.id)}
						<a
							href="/assignments/{item.assignment.id}"
							class="flex items-center justify-between gap-3 rounded-md border border-border bg-surface-800/60 p-4 transition hover:border-border-strong hover:bg-surface-700/60"
						>
							<div class="min-w-0">
								<div class="flex flex-wrap items-center gap-2">
									<span class="chip bg-surface-700 text-text-muted"
										>{kindLabel(item.assignment.kind)}</span
									>
									<p class="truncate font-bold text-text-primary">{item.assignment.title}</p>
								</div>
								<p class="mt-1 text-xs text-text-muted">
									{item.assignment.count} questions · {item.assignment.durationMinutes} min ·
									{item.assignment.points} pts · {item.dueDateLabel}
								</p>
							</div>
							<div class="flex shrink-0 items-center gap-3">
								{#if item.bestSubmission}
									<span
										class="num-display text-sm {item.bestSubmission.percentage >= 85
											? 'text-success'
											: 'text-accent-warm'}">{item.bestSubmission.percentage}%</span
									>
								{:else}
									<span class="hidden text-xs text-text-muted sm:block"
										>{relativeDue(item.daysUntilDue)}</span
									>
									<StatusChip status={item.status} />
								{/if}
							</div>
						</a>
					{/each}
				</div>
			</section>
		{/if}
	{/if}
</div>
