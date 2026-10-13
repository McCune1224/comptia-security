<script lang="ts">
	import { onMount } from 'svelte';
	import ThemeToggle from './ThemeToggle.svelte';

	let open = $state(false);
	let wrapper = $state<HTMLDivElement | null>(null);

	const links = [
		{
			href: '/calendar',
			label: 'Calendar',
			icon: 'calendar',
			hint: 'Deadlines & Google sync'
		},
		{
			href: '/quiz',
			label: 'Quiz',
			icon: 'quiz',
			hint: 'MCQ drills & full exams'
		},
		{
			href: '/scenarios',
			label: 'Scenarios',
			icon: 'scenario',
			hint: 'Applied judgment practice'
		},
		{
			href: '/pbq',
			label: 'PBQs',
			icon: 'pbq',
			hint: 'Hands-on performance tasks'
		},
		{
			href: '/admin',
			label: 'Admin',
			icon: 'admin',
			hint: 'Exam date, due dates, reset, backup'
		}
	];

	function close() {
		open = false;
	}

	function handleWindowPointerDown(event: PointerEvent) {
		if (open && wrapper && !wrapper.contains(event.target as Node)) close();
	}

	function handleKeydown(event: KeyboardEvent) {
		if (event.key === 'Escape' && open) close();
	}

	onMount(() => {
		window.addEventListener('keydown', handleKeydown);
		return () => window.removeEventListener('keydown', handleKeydown);
	});
</script>

<svelte:window onpointerdown={handleWindowPointerDown} />

<div class="relative" bind:this={wrapper}>
	<button
		class="grid h-11 w-11 place-items-center rounded text-text-secondary transition hover:bg-surface-700 hover:text-text-primary xl:hidden"
		type="button"
		aria-label={open ? 'Close menu' : 'Open menu'}
		aria-haspopup="menu"
		aria-expanded={open}
		onclick={() => (open = !open)}
	>
		<svg viewBox="0 0 24 24" class="h-6 w-6" fill="none" stroke="currentColor" stroke-width="2">
			<path class:opacity-0={open} class:translate-y-1.5={open} d="M4 7h16" />
			<path class:opacity-0={open} d="M4 12h16" />
			<path class:opacity-0={open} class:-translate-y-1.5={open} d="M4 17h16" />
			<path class:opacity-100={open} d="m6 6 12 12M18 6 6 18" />
		</svg>
	</button>

	{#if open}
		<div
			class="absolute right-0 top-[calc(100%+0.5rem)] z-50 max-h-[calc(100dvh-5rem)] w-[min(20rem,calc(100vw-1rem))] overflow-y-auto rounded-2xl border border-border bg-surface-800 p-2 shadow-[var(--shadow-lift)]"
			role="menu"
			aria-label="More options"
		>
			<nav class="space-y-1">
				{#each links as link (link.href)}
					<a
						class="flex min-h-12 items-center gap-3 rounded-xl border border-transparent px-3 transition hover:border-border hover:bg-surface-700"
						href={link.href}
						role="menuitem"
						onclick={close}
					>
						<span
							class="grid h-9 w-9 shrink-0 place-items-center rounded bg-accent/10 text-accent"
						>
							{#if link.icon === 'calendar'}
								<svg
									viewBox="0 0 24 24"
									class="h-5 w-5"
									fill="none"
									stroke="currentColor"
									stroke-width="1.8"
									><rect x="3" y="5" width="18" height="16" rx="2" /><path
										d="M8 3v4M16 3v4M3 10h18"
									/></svg
								>
							{:else if link.icon === 'quiz'}
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
							{:else}
								<svg
									viewBox="0 0 24 24"
									class="h-5 w-5"
									fill="none"
									stroke="currentColor"
									stroke-width="1.8"
									><circle cx="12" cy="12" r="3" /><path
										d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 1 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 1 1-4 0v-.09a1.65 1.65 0 0 0-1-1.51 1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 1 1-2.83-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 1 1 0-4h.09a1.65 1.65 0 0 0 1.51-1 1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 1 1 2.83-2.83l.06.06a1.65 1.65 0 0 0 1.82.33h.09a1.65 1.65 0 0 0 1-1.51V3a2 2 0 1 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 1 1 2.83 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82v.09a1.65 1.65 0 0 0 1.51 1H21a2 2 0 1 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1Z"
									/></svg
								>
							{/if}
						</span>
						<span class="min-w-0">
							<span class="block font-semibold text-text-primary">{link.label}</span>
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
				class="mt-2 flex items-center justify-between rounded-xl border border-border bg-surface-700/60 px-3 py-2.5"
			>
				<span class="text-sm font-semibold text-text-secondary">Paper &amp; ink</span>
				<ThemeToggle />
			</div>
		</div>
	{/if}
</div>
