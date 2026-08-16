<script lang="ts">
	import { onMount } from 'svelte';
	import ThemeToggle from './ThemeToggle.svelte';

	let open = $state(false);
	let wrapper = $state<HTMLDivElement | null>(null);

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
		class="grid h-11 w-11 place-items-center rounded-md text-text-secondary transition hover:bg-surface-700 hover:text-text-primary xl:hidden"
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
			class="absolute right-0 top-[calc(100%+0.5rem)] z-50 max-h-[calc(100dvh-5rem)] w-[min(20rem,calc(100vw-1rem))] overflow-y-auto rounded-md border border-border bg-surface-900 p-2 shadow-2xl"
			role="menu"
			aria-label="More options"
		>
			<nav class="space-y-1">
				{#each links as link}
					<a
						class="flex min-h-12 items-center gap-3 rounded-md border border-border bg-surface-800/60 px-3 transition hover:border-border-strong hover:bg-surface-700"
						href={link.href}
						role="menuitem"
						onclick={close}
					>
						<span class="grid h-9 w-9 shrink-0 place-items-center rounded-md bg-accent/15 text-accent">
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
									stroke-width="1.8"><circle cx="12" cy="12" r="9" /><path
										d="M12 7v5l3 3"
									/></svg
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
				class="mt-2 flex items-center justify-between rounded-md border border-border bg-surface-800/60 px-3 py-2.5"
			>
				<span class="text-sm font-semibold text-text-secondary">Night &amp; day</span>
				<ThemeToggle />
			</div>
		</div>
	{/if}
</div>
