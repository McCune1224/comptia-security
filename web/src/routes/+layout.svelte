<script lang="ts">
	import { page } from '$app/stores';
	import BottomNav from '$lib/components/BottomNav.svelte';
	import MobileMenu from '$lib/components/MobileMenu.svelte';
	import ThemeToggle from '$lib/components/ThemeToggle.svelte';
	import '../app.css';

	let { children } = $props();
	let mobileMenuOpen = $state(false);
	let currentPath = $derived($page.url.pathname);

	function isActive(path: string): boolean {
		return path === '/' ? currentPath === '/' : currentPath.startsWith(path);
	}
</script>

<div class="flex min-h-screen flex-col">
	<nav class="sticky top-0 z-50 border-b border-border bg-surface-900/80 backdrop-blur-xl">
		<div class="mx-auto flex max-w-7xl items-center justify-between px-4 py-3 lg:px-8">
			<a href="/" class="group flex items-center gap-2.5">
				<div
					class="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-accent to-accent-secondary text-sm font-bold text-white shadow-lg shadow-accent/20"
				>
					S+
				</div>
				<span
					class="hidden font-semibold tracking-tight text-text-primary transition group-hover:text-accent min-[360px]:inline"
					>Security+ Course</span
				>
			</a>

			<div class="hidden items-center gap-1 md:flex">
				<a
					href="/"
					class="flex h-10 items-center gap-2 rounded-xl px-3 text-sm font-medium transition {isActive(
						'/'
					)
						? 'bg-accent/10 text-accent'
						: 'text-text-secondary hover:bg-surface-700 hover:text-text-primary'}"
					aria-current={isActive('/') ? 'page' : undefined}
				>
					<svg
						viewBox="0 0 24 24"
						class="h-4 w-4"
						fill="none"
						stroke="currentColor"
						stroke-width="1.8"
						><path d="m3 10 9-7 9 7v10a1 1 0 0 1-1 1h-5v-6H9v6H4a1 1 0 0 1-1-1V10Z" /></svg
					>
					Home
				</a>
				<a
					href="/syllabus"
					class="flex h-10 items-center gap-2 rounded-xl px-3 text-sm font-medium transition {isActive(
						'/syllabus'
					)
						? 'bg-accent/10 text-accent'
						: 'text-text-secondary hover:bg-surface-700 hover:text-text-primary'}"
					aria-current={isActive('/syllabus') ? 'page' : undefined}
				>
					<svg
						viewBox="0 0 24 24"
						class="h-4 w-4"
						fill="none"
						stroke="currentColor"
						stroke-width="1.8"
						><path
							d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20V4a2 2 0 0 0-2-2H6.5A2.5 2.5 0 0 0 4 4.5v15Z"
						/><path d="M4 19.5A2.5 2.5 0 0 0 6.5 22H20v-5" /></svg
					>
					Syllabus
				</a>
				<a
					href="/gradebook"
					class="flex h-10 items-center gap-2 rounded-xl px-3 text-sm font-medium transition {isActive(
						'/gradebook'
					)
						? 'bg-accent/10 text-accent'
						: 'text-text-secondary hover:bg-surface-700 hover:text-text-primary'}"
					aria-current={isActive('/gradebook') ? 'page' : undefined}
				>
					<svg
						viewBox="0 0 24 24"
						class="h-4 w-4"
						fill="none"
						stroke="currentColor"
						stroke-width="1.8"><path d="M4 19V9m5 10V5m5 14v-7m5 7V3" /></svg
					>
					Grades
				</a>
				<a
					href="/calendar"
					class="flex h-10 items-center gap-2 rounded-xl px-3 text-sm font-medium transition {isActive(
						'/calendar'
					)
						? 'bg-accent/10 text-accent'
						: 'text-text-secondary hover:bg-surface-700 hover:text-text-primary'}"
					aria-current={isActive('/calendar') ? 'page' : undefined}
				>
					<svg
						viewBox="0 0 24 24"
						class="h-4 w-4"
						fill="none"
						stroke="currentColor"
						stroke-width="1.8"
						><rect x="3" y="5" width="18" height="16" rx="2" /><path
							d="M8 3v4M16 3v4M3 10h18"
						/></svg
					>
					Calendar
				</a>
				<div class="mx-1 h-5 w-px bg-border"></div>
				<a
					href="/quiz"
					class="flex h-10 items-center gap-2 rounded-xl px-3 text-sm font-medium transition {isActive(
						'/quiz'
					)
						? 'bg-accent/10 text-accent'
						: 'text-text-secondary hover:bg-surface-700 hover:text-text-primary'}"
					aria-current={isActive('/quiz') ? 'page' : undefined}
				>
					<svg
						viewBox="0 0 24 24"
						class="h-4 w-4"
						fill="none"
						stroke="currentColor"
						stroke-width="1.8"
						><rect x="5" y="3" width="14" height="18" rx="2" /><path
							d="M9 3h6v3H9zM9 11h6M9 15h4"
						/></svg
					>
					Quiz
				</a>
				<a
					href="/scenarios"
					class="flex h-10 items-center gap-2 rounded-xl px-3 text-sm font-medium transition {isActive(
						'/scenarios'
					)
						? 'bg-accent/10 text-accent'
						: 'text-text-secondary hover:bg-surface-700 hover:text-text-primary'}"
					aria-current={isActive('/scenarios') ? 'page' : undefined}
				>
					<svg
						viewBox="0 0 24 24"
						class="h-4 w-4"
						fill="none"
						stroke="currentColor"
						stroke-width="1.8"
						><path d="M20 11.5a7.5 7.5 0 0 1-11.6 6.3L4 19l1.2-3.6A7.5 7.5 0 1 1 20 11.5Z" /></svg
					>
					Scenarios
				</a>
				<a
					href="/pbq"
					class="flex h-10 items-center gap-2 rounded-xl px-3 text-sm font-medium transition {isActive(
						'/pbq'
					)
						? 'bg-accent/10 text-accent'
						: 'text-text-secondary hover:bg-surface-700 hover:text-text-primary'}"
					aria-current={isActive('/pbq') ? 'page' : undefined}
				>
					<svg
						viewBox="0 0 24 24"
						class="h-4 w-4"
						fill="none"
						stroke="currentColor"
						stroke-width="1.8"
						><path
							d="M8 5.5 10.5 3l2.5 2.5L15.5 3 18 5.5 15.5 8 18 10.5 15.5 13 18 15.5 15.5 18 13 15.5 10.5 18 8 15.5 5.5 18 3 15.5 5.5 13 3 10.5 5.5 8 3 5.5 5.5 3 8 5.5Z"
						/></svg
					>
					PBQs
				</a>
				<div class="ml-2 border-l border-border pl-3"><ThemeToggle /></div>
			</div>

			<button
				class="grid h-10 w-10 place-items-center rounded-xl text-text-secondary transition hover:bg-surface-700 hover:text-text-primary md:hidden"
				type="button"
				aria-label={mobileMenuOpen ? 'Close navigation menu' : 'Open navigation menu'}
				aria-expanded={mobileMenuOpen}
				onclick={() => (mobileMenuOpen = !mobileMenuOpen)}
			>
				<svg viewBox="0 0 24 24" class="h-5 w-5" fill="none" stroke="currentColor" stroke-width="2"
					><path
						class:opacity-0={mobileMenuOpen}
						class:translate-y-1.5={mobileMenuOpen}
						d="M4 7h16"
					/><path class:opacity-0={mobileMenuOpen} d="M4 12h16" /><path
						class:opacity-0={mobileMenuOpen}
						class:-translate-y-1.5={mobileMenuOpen}
						d="M4 17h16"
					/><path class:opacity-100={mobileMenuOpen} d="m6 6 12 12M18 6 6 18" /></svg
				>
			</button>
		</div>
	</nav>

	<MobileMenu open={mobileMenuOpen} onclose={() => (mobileMenuOpen = false)} />

	<main class="mx-auto w-full max-w-7xl flex-1 px-4 py-6 pb-24 sm:px-6 sm:py-8 md:pb-8 lg:px-8">
		{@render children()}
	</main>

	<footer class="hidden border-t border-border py-6 text-center text-xs text-text-subtle md:block">
		Security+ SY0-701 Course · {new Date().getFullYear()}
	</footer>
	<BottomNav {currentPath} />
</div>
