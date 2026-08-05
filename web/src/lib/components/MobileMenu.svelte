<script lang="ts">
	import { onMount } from 'svelte';
	import ThemeToggle from './ThemeToggle.svelte';

	let { open, onclose }: { open: boolean; onclose: () => void } = $props();

	const links = [
		{ href: '/', label: 'Home' },
		{ href: '/syllabus', label: 'Syllabus' },
		{ href: '/gradebook', label: 'Grades' },
		{ href: '/calendar', label: 'Calendar' },
		{ href: '/quiz', label: 'Quiz' },
		{ href: '/scenarios', label: 'Scenarios' },
		{ href: '/pbq', label: 'PBQs' },
		{ href: '/progress', label: 'Progress' },
		{ href: '/history', label: 'History' }
	];

	function handleKeydown(event: KeyboardEvent) {
		if (event.key === 'Escape' && open) onclose();
	}

	onMount(() => {
		window.addEventListener('keydown', handleKeydown);
		return () => window.removeEventListener('keydown', handleKeydown);
	});
</script>

<div
	class="fixed inset-0 z-[60] bg-black/50 transition-opacity duration-200"
	class:pointer-events-none={!open}
	class:opacity-0={!open}
	class:opacity-100={open}
	role="presentation"
	aria-hidden={!open}
	inert={!open}
	onclick={(event) => {
		if (event.currentTarget === event.target) onclose();
	}}
>
	<aside
		class="absolute right-0 top-0 flex h-full w-[280px] flex-col border-l border-border bg-surface-900 p-6 shadow-2xl transition-transform duration-300 ease-out"
		class:translate-x-full={!open}
		class:translate-x-0={open}
		aria-label="Mobile navigation"
	>
		<div class="mb-8 flex items-center justify-between">
			<span class="text-sm font-semibold uppercase tracking-[0.18em] text-text-muted"
				>Navigation</span
			>
			<button
				class="grid h-10 w-10 place-items-center rounded-xl text-text-secondary hover:bg-surface-700 hover:text-text-primary"
				type="button"
				aria-label="Close menu"
				onclick={onclose}
			>
				<svg viewBox="0 0 24 24" class="h-5 w-5" fill="none" stroke="currentColor" stroke-width="2"
					><path d="m6 6 12 12M18 6 6 18" /></svg
				>
			</button>
		</div>
		<nav class="space-y-1">
			{#each links as link}
				<a
					class="flex min-h-12 items-center rounded-xl px-4 font-medium text-text-secondary transition hover:bg-surface-700 hover:text-text-primary"
					href={link.href}
					onclick={onclose}>{link.label}</a
				>
			{/each}
		</nav>
		<div class="mt-auto flex items-center justify-between border-t border-border pt-5">
			<span class="text-sm text-text-secondary">Appearance</span>
			<ThemeToggle />
		</div>
	</aside>
</div>
