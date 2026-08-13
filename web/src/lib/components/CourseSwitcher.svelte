<script lang="ts">
	import { onMount } from 'svelte';

	type Course = { id: string; title: string; shortTitle: string };

	let { courses, activeCourseId, onswitch }: {
		courses: Course[];
		activeCourseId: string;
		onswitch: (id: string) => void;
	} = $props();

	let open = $state(false);
	const activeCourse = $derived(courses.find((c) => c.id === activeCourseId) ?? courses[0]);

	function handleKeydown(event: KeyboardEvent) {
		if (event.key === 'Escape' && open) open = false;
	}
	onMount(() => {
		window.addEventListener('keydown', handleKeydown);
		return () => window.removeEventListener('keydown', handleKeydown);
	});
</script>

<button
	class="flex h-11 items-center gap-1.5 rounded-md border border-border bg-surface-800 px-2.5 transition hover:border-border-strong hover:bg-surface-700 md:h-10"
	type="button"
	aria-haspopup="dialog"
	aria-expanded={open}
	aria-label="Switch course"
	onclick={() => (open = true)}
>
	<svg
		viewBox="0 0 24 24"
		class="h-4 w-4 shrink-0 text-accent"
		fill="none"
		stroke="currentColor"
		stroke-width="2"
		><path d="m12 3 9 5-9 5-9-5 9-5Z" /><path d="m3 13 9 5 9-5" /></svg
	>
	<span
		class="hidden sm:inline max-w-28 truncate text-sm font-semibold text-text-primary"
		>{activeCourse?.shortTitle ?? 'Course'}</span
	>
	<svg
		viewBox="0 0 24 24"
		class="h-4 w-4 shrink-0 text-text-subtle"
		fill="none"
		stroke="currentColor"
		stroke-width="2"
		><path d="m6 9 6 6 6-6" /></svg
	>
</button>

<div
	class="fixed inset-0 z-[60] flex items-end justify-center bg-black/50 transition-opacity duration-200"
	class:pointer-events-none={!open}
	class:opacity-0={!open}
	class:opacity-100={open}
	role="presentation"
	aria-hidden={!open}
	inert={!open}
	onclick={(event) => {
		if (event.currentTarget === event.target) open = false;
	}}
>
	<aside
		class="w-full max-h-full overflow-y-auto rounded-t-md border-t border-border bg-surface-900 p-5 pb-safe shadow-2xl transition-transform duration-300 ease-out"
		class:translate-y-full={!open}
		class:translate-y-0={open}
		aria-label="Course switcher"
	>
		<div class="mx-auto mb-4 h-1 w-10 rounded-sm bg-surface-600"></div>
		<div class="sticky top-0 z-10 -mx-5 mb-3 flex items-center justify-between bg-surface-900/95 px-5 py-1 backdrop-blur">
			<span class="eyebrow">Course</span>
			<button
				class="grid h-11 w-11 place-items-center rounded-md text-text-secondary transition hover:bg-surface-700 hover:text-text-primary"
				type="button"
				aria-label="Close course menu"
				onclick={() => (open = false)}
			>
				<svg viewBox="0 0 24 24" class="h-5 w-5" fill="none" stroke="currentColor" stroke-width="2"
					><path d="m6 6 12 12M18 6 6 18" /></svg
				>
			</button>
		</div>

		<div class="space-y-2">
			{#each courses as course (course.id)}
				<button
					class="flex min-h-14 w-full items-center gap-3 rounded-md border border-border bg-surface-800/60 px-4 text-left transition hover:border-border-strong hover:bg-surface-700"
					type="button"
					onclick={() => {
						open = false;
						onswitch(course.id);
					}}
				>
					<span class="min-w-0 flex-1">
						<span class="block font-bold text-text-primary">{course.shortTitle}</span>
						<span class="block truncate text-xs text-text-muted">{course.title}</span>
					</span>
					{#if course.id === activeCourseId}
						<svg
							viewBox="0 0 24 24"
							class="h-5 w-5 shrink-0 text-accent"
							fill="none"
							stroke="currentColor"
							stroke-width="2.5"
							><path d="m4 12.5 5 5L20 6.5" /></svg
						>
					{/if}
				</button>
			{/each}
		</div>

		<p class="mt-4 text-center text-xs text-text-muted">
			Exam date, syllabus, grades and review queue are per course.
		</p>
	</aside>
</div>
