<script lang="ts">
	import { page } from '$app/stores';
	import { onMount } from 'svelte';
	import BottomNav from '$lib/components/BottomNav.svelte';
	import MobileMenu from '$lib/components/MobileMenu.svelte';
	import ThemeToggle from '$lib/components/ThemeToggle.svelte';
	import ProfileSwitcher from '$lib/components/ProfileSwitcher.svelte';
	import CourseSwitcher from '$lib/components/CourseSwitcher.svelte';
	import AppRail from '$lib/components/AppRail.svelte';
	import CommandPalette from '$lib/components/CommandPalette.svelte';
	import '../app.css';

	type Profile = { id: string; name: string; color: string };
	type Course = { id: string; title: string; shortTitle: string };
	type ScopeInfo = {
		scope: { profileId: string; courseId: string };
		profiles: Profile[];
		courses: Course[];
	};

	let { children } = $props();
	let currentPath = $derived($page.url.pathname);
	let pinned = $state(false);
	let paletteOpen = $state(false);

	const sectionTitle = $derived.by(() => {
		const path = currentPath;
		if (path === '/') return 'Home';
		if (
			path.startsWith('/syllabus') ||
			path.startsWith('/modules') ||
			path.startsWith('/assignments')
		)
			return 'Course';
		if (
			path.startsWith('/practice') ||
			path.startsWith('/quiz') ||
			path.startsWith('/scenarios') ||
			path.startsWith('/pbq')
		)
			return 'Practice';
		if (path.startsWith('/review')) return 'Review';
		if (
			path.startsWith('/progress') ||
			path.startsWith('/gradebook') ||
			path.startsWith('/mastery') ||
			path.startsWith('/history')
		)
			return 'Progress';
		if (path.startsWith('/calendar')) return 'Calendar';
		if (path.startsWith('/admin')) return 'Admin';
		return '';
	});

	let scopeInfo = $state<ScopeInfo | null>(null);
	const activeCourse = $derived.by(() => {
		const info = scopeInfo;
		return info ? (info.courses.find((c) => c.id === info.scope.courseId) ?? null) : null;
	});

	async function loadScope() {
		try {
			const response = await fetch('/api/scope');
			if (response.ok) scopeInfo = await response.json();
		} catch {
			// Chips fall back to placeholder styling; pages still fetch their own data.
		}
	}
	onMount(loadScope);

	async function switchProfile(profileId: string) {
		const response = await fetch('/api/scope', {
			method: 'POST',
			headers: { 'Content-Type': 'application/json' },
			body: JSON.stringify({ action: 'switch', profileId })
		});
		if (response.ok) window.location.reload();
	}

	async function switchCourse(courseId: string) {
		const response = await fetch('/api/scope', {
			method: 'POST',
			headers: { 'Content-Type': 'application/json' },
			body: JSON.stringify({ action: 'switch', courseId })
		});
		if (response.ok) window.location.reload();
	}

	async function createProfile(
		name: string,
		color: string
	): Promise<{ ok: boolean; message?: string }> {
		const response = await fetch('/api/scope', {
			method: 'POST',
			headers: { 'Content-Type': 'application/json' },
			body: JSON.stringify({ action: 'create', name, color })
		});
		const body = (await response.json().catch(() => ({}))) as {
			profile?: Profile;
			error?: { message?: string };
		};
		if (!response.ok || !body.profile)
			return { ok: false, message: body.error?.message ?? 'Could not create the profile.' };
		const switched = await fetch('/api/scope', {
			method: 'POST',
			headers: { 'Content-Type': 'application/json' },
			body: JSON.stringify({ action: 'switch', profileId: body.profile.id })
		});
		if (switched.ok) window.location.reload();
		return { ok: true };
	}

	async function renameProfile(profileId: string, name: string): Promise<boolean> {
		const response = await fetch('/api/scope', {
			method: 'POST',
			headers: { 'Content-Type': 'application/json' },
			body: JSON.stringify({ action: 'rename', profileId, name })
		});
		if (response.ok) await loadScope();
		return response.ok;
	}

	async function deleteProfile(profileId: string): Promise<boolean> {
		const response = await fetch(`/api/scope?profileId=${encodeURIComponent(profileId)}`, {
			method: 'DELETE'
		});
		if (response.ok) await loadScope();
		return response.ok;
	}
</script>

<AppRail {currentPath} bind:pinned onopenpalette={() => (paletteOpen = true)} />
<CommandPalette bind:open={paletteOpen} />

<!-- The rail floats above the content: hovering it never reflows the page. Only pinning
     (deliberate, persisted) offsets the content, so a stray pointer cannot shift a target. -->
<div
	class="flex min-h-screen flex-col transition-[padding] duration-200 ease-out {pinned
		? 'lg:pl-[14.5rem]'
		: 'lg:pl-16'}"
>
	<div class="sticky top-0 z-50 border-b border-border">
		<div
			class="pointer-events-none absolute inset-0 bg-surface-800/85 backdrop-blur-xl"
			aria-hidden="true"
		></div>
		<header
			class="relative mx-auto flex h-16 w-full max-w-7xl items-center gap-3 px-4 sm:px-6 lg:px-8"
		>
			<a href="/" class="flex min-h-11 items-center gap-2.5 lg:hidden" aria-label="Course home">
				<span class="grid h-8 w-8 shrink-0 place-items-center rounded-lg bg-accent text-on-accent">
					<svg
						viewBox="0 0 24 24"
						class="h-5 w-5"
						fill="none"
						stroke="currentColor"
						stroke-width="2"
					>
						<path d="M12 3 4 6.5v4.6c0 4.6 3.2 7.6 8 9.4 4.8-1.8 8-4.8 8-9.4V6.5L12 3Z" />
					</svg>
				</span>
				<span class="h-display hidden text-base text-text-primary min-[380px]:inline">CompTIA</span>
			</a>

			<div class="hidden min-w-0 lg:block">
				<p class="eyebrow">{activeCourse?.shortTitle ?? 'Security+'}</p>
				<p class="h-display truncate text-lg leading-tight text-text-primary">{sectionTitle}</p>
			</div>

			<div class="ml-auto flex items-center gap-1.5 md:gap-2">
				<button
					type="button"
					class="hidden min-h-11 items-center gap-2 rounded border border-border bg-surface-800 px-3 text-sm font-semibold text-text-secondary transition hover:border-border-strong hover:text-text-primary lg:flex"
					onclick={() => (paletteOpen = true)}
					aria-label="Search and jump"
				>
					<svg
						viewBox="0 0 24 24"
						class="h-4 w-4"
						fill="none"
						stroke="currentColor"
						stroke-width="1.8"><circle cx="11" cy="11" r="7" /><path d="m20 20-3.2-3.2" /></svg
					>
					<span class="text-text-subtle">Search</span>
					<kbd
						class="rounded border border-border px-1.5 py-0.5 text-[10px] font-semibold text-text-subtle"
						>⌘K</kbd
					>
				</button>
				{#if scopeInfo}
					<CourseSwitcher
						courses={scopeInfo.courses}
						activeCourseId={scopeInfo.scope.courseId}
						onswitch={switchCourse}
					/>
					<ProfileSwitcher
						profiles={scopeInfo.profiles}
						activeProfileId={scopeInfo.scope.profileId}
						onswitch={switchProfile}
						onrename={renameProfile}
						oncreate={createProfile}
						ondelete={deleteProfile}
					/>
				{:else}
					<div class="h-11 w-14 rounded border border-border bg-surface-800"></div>
					<div class="h-11 w-14 rounded border border-border bg-surface-800"></div>
				{/if}
				<div class="hidden lg:block">
					<ThemeToggle />
				</div>
				<MobileMenu />
			</div>
		</header>
	</div>

	<main class="mx-auto w-full max-w-7xl flex-1 px-4 pb-28 pt-5 sm:px-6 sm:pt-7 lg:px-8 xl:pb-14">
		{@render children()}
	</main>

	<footer class="hidden border-t border-border py-6 text-center text-xs text-text-subtle lg:block">
		<p class="serif-italic">CompTIA · {new Date().getFullYear()}</p>
	</footer>
	<BottomNav {currentPath} />
</div>
