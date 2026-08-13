<script lang="ts">
	import { onMount } from 'svelte';
	import ThemeToggle from './ThemeToggle.svelte';

	let { open, onclose }: { open: boolean; onclose: () => void } = $props();

	const links = [
		{
			href: '/quiz',
			label: 'Quiz',
			icon: 'quiz',
			hint: 'Free practice & full exams'
		},
		{
			href: '/scenarios',
			label: 'Scenarios',
			icon: 'scenario',
			hint: 'Apply concepts to realistic situations'
		},
		{
			href: '/pbq',
			label: 'PBQs',
			icon: 'pbq',
			hint: 'Hands-on performance tasks'
		},
		{
			href: '/progress',
			label: 'Progress',
			icon: 'progress',
			hint: 'Domain scores & weak topics'
		},
		{
			href: '/history',
			label: 'History',
			icon: 'history',
			hint: 'Past sessions & reviews'
		}
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
		class="absolute inset-x-0 bottom-0 max-h-[85dvh] overflow-y-auto rounded-t-md border-t border-border bg-surface-900 p-5 pb-safe shadow-2xl transition-transform duration-300 ease-out"
		class:translate-y-full={!open}
		class:translate-y-0={open}
		aria-label="More options"
	>
		<div class="mx-auto mb-4 h-1 w-10 rounded-sm bg-surface-600"></div>
		<div class="sticky top-0 z-10 -mx-5 mb-3 flex items-center justify-between bg-surface-900/95 px-5 py-1 backdrop-blur">
			<span class="eyebrow">More</span>
			<button
				class="grid h-11 w-11 place-items-center rounded-md text-text-secondary transition hover:bg-surface-700 hover:text-text-primary"
				type="button"
				aria-label="Close menu"
				onclick={onclose}
			>
				<svg viewBox="0 0 24 24" class="h-5 w-5" fill="none" stroke="currentColor" stroke-width="2"
					><path d="m6 6 12 12M18 6 6 18" /></svg
				>
			</button>
		</div>
		<nav class="space-y-2">
			{#each links as link}
				<a
					class="flex min-h-14 items-center gap-3 rounded-md border border-border bg-surface-800/60 px-4 transition hover:border-border-strong hover:bg-surface-700"
					href={link.href}
					onclick={onclose}
				>
					<span
						class="grid h-9 w-9 shrink-0 place-items-center rounded-md bg-accent/15 text-accent"
					>
						{#if link.icon === 'quiz'}
							<svg
								viewBox="0 0 24 24"
								class="h-5 w-5"
								fill="none"
								stroke="currentColor"
								stroke-width="1.8"
								><rect x="5" y="3" width="14" height="18" rx="2" /><path
									d="M9 3h6v3H9zM9 11h6M9 15h4"
								/></svg
							>
						{:else if link.icon === 'scenario'}
							<svg
								viewBox="0 0 24 24"
								class="h-5 w-5"
								fill="none"
								stroke="currentColor"
								stroke-width="1.8"
								><path
									d="M20 11.5a7.5 7.5 0 0 1-11.6 6.3L4 19l1.2-3.6A7.5 7.5 0 1 1 20 11.5Z"
								/></svg
							>
						{:else if link.icon === 'pbq'}
							<svg
								viewBox="0 0 24 24"
								class="h-5 w-5"
								fill="none"
								stroke="currentColor"
								stroke-width="1.8"
								><path
									d="M8 5.5 10.5 3l2.5 2.5L15.5 3 18 5.5 15.5 8 18 10.5 15.5 13 18 15.5 15.5 18 13 15.5 10.5 18 8 15.5 5.5 18 3 15.5 5.5 13 3 10.5 5.5 8 3 5.5 5.5 3 8 5.5Z"
								/></svg
							>
						{:else if link.icon === 'progress'}
							<svg
								viewBox="0 0 24 24"
								class="h-5 w-5"
								fill="none"
								stroke="currentColor"
								stroke-width="1.8"><path d="M4 19V9m5 10V5m5 14v-7m5 7V3" /></svg
							>
						{:else}
							<svg
								viewBox="0 0 24 24"
								class="h-5 w-5"
								fill="none"
								stroke="currentColor"
								stroke-width="1.8"><circle cx="12" cy="12" r="9" /><path d="M12 7v5l3 3" /></svg
							>
						{/if}
					</span>
					<span class="min-w-0">
						<span class="block font-bold text-text-primary">{link.label}</span>
						<span class="block truncate text-xs text-text-muted">{link.hint}</span>
					</span>
					<svg
						viewBox="0 0 24 24"
						class="ml-auto h-5 w-5 shrink-0 text-text-subtle"
						fill="none"
						stroke="currentColor"
						stroke-width="2"><path d="m9 6 6 6-6 6" /></svg
					>
				</a>
			{/each}
		</nav>
		<div
			class="mt-4 flex items-center justify-between rounded-md border border-border bg-surface-800/60 px-4 py-3"
		>
			<span class="text-sm font-semibold text-text-secondary">Night &amp; day</span>
			<ThemeToggle />
		</div>
	</aside>
</div>
