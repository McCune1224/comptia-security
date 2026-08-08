<script lang="ts">
	import { onMount } from 'svelte';

	let isLight = $state(false);

	function applyTheme(theme: 'light' | 'dark') {
		isLight = theme === 'light';
		document.documentElement.dataset.theme = theme;
		localStorage.setItem('theme', theme);
	}

	function toggleTheme() {
		applyTheme(isLight ? 'dark' : 'light');
	}

	onMount(() => {
		isLight = document.documentElement.dataset.theme === 'light';
	});
</script>

<button
	class="relative inline-flex h-11 w-16 items-center rounded-full border border-border-strong bg-surface-800 p-1 transition-colors duration-200"
	type="button"
	role="switch"
	aria-checked={isLight}
	aria-label="Toggle light and dark theme"
	onclick={toggleTheme}
>
	<span
		class="absolute left-2 text-accent-warm transition-opacity duration-200"
		class:opacity-0={isLight}
		class:opacity-100={!isLight}
		aria-hidden="true"
	>
		<svg viewBox="0 0 24 24" class="h-4 w-4" fill="currentColor"
			><path d="M20.7 15.3A8.7 8.7 0 0 1 8.7 3.3 9 9 0 1 0 20.7 15.3Z" /></svg
		>
	</span>
	<span
		class="absolute right-2 text-accent-warm transition-opacity duration-200"
		class:opacity-0={!isLight}
		class:opacity-100={isLight}
		aria-hidden="true"
	>
		<svg viewBox="0 0 24 24" class="h-4 w-4" fill="none" stroke="currentColor" stroke-width="2"
			><circle cx="12" cy="12" r="4" /><path
				d="M12 2v2M12 20v2M4.93 4.93l1.41 1.41M17.66 17.66l1.41 1.41M2 12h2M20 12h2M4.93 19.07l1.41-1.41M17.66 6.34l1.41-1.41"
			/></svg
		>
	</span>
	<span
		class="relative z-10 h-7 w-7 rounded-full bg-accent transition-transform duration-250 ease-out"
		class:translate-x-7={isLight}
	></span>
</button>
