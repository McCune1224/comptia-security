<script lang="ts">
	import { onMount } from 'svelte';

	type Profile = { id: string; name: string; color: string };

	let {
		profiles,
		activeProfileId,
		onswitch,
		onrename,
		oncreate,
		ondelete
	}: {
		profiles: Profile[];
		activeProfileId: string;
		onswitch: (id: string) => void;
		onrename: (id: string, name: string) => Promise<boolean>;
		oncreate: (name: string, color: string) => Promise<{ ok: boolean; message?: string }>;
		ondelete: (id: string) => Promise<boolean>;
	} = $props();

	const PROFILE_COLORS = ['#67B8A8', '#82B5D5', '#E0B66A', '#D894B8'];

	let open = $state(false);
	let adding = $state(false);
	let newName = $state('');
	let newColor = $state(PROFILE_COLORS[0]);
	let renamingId = $state<string | null>(null);
	let renameValue = $state('');
	let armingDeleteId = $state<string | null>(null);
	let busy = $state(false);
	let error = $state('');

	let wrapper = $state<HTMLDivElement | null>(null);

	const activeProfile = $derived(profiles.find((p) => p.id === activeProfileId));

	let armTimer: ReturnType<typeof setTimeout> | undefined;
	function armDelete(id: string) {
		if (armingDeleteId === id) {
			armingDeleteId = null;
			clearTimeout(armTimer);
			ondelete(id);
		} else {
			armingDeleteId = id;
			clearTimeout(armTimer);
			armTimer = setTimeout(() => (armingDeleteId = null), 3000);
		}
	}

	function toggleRename(id: string, name: string) {
		renamingId = renamingId === id ? null : id;
		renameValue = name;
	}

	async function submitRename(event: SubmitEvent) {
		event.preventDefault();
		if (renamingId && renameValue.trim().length > 0) {
			const ok = await onrename(renamingId, renameValue.trim());
			if (ok) renamingId = null;
		}
	}

	async function submitCreate(event: SubmitEvent) {
		event.preventDefault();
		busy = true;
		error = '';
		const result = await oncreate(newName.trim(), newColor);
		busy = false;
		if (!result.ok) error = result.message ?? 'Could not create the profile.';
	}

	function close() {
		open = false;
		adding = false;
		renamingId = null;
		armingDeleteId = null;
		error = '';
	}

	function handleWindowPointerDown(event: PointerEvent) {
		if (open && wrapper && !wrapper.contains(event.target as Node)) close();
	}

	function handleKeydown(event: KeyboardEvent) {
		if (event.key === 'Escape' && open) close();
	}
	onMount(() => {
		window.addEventListener('keydown', handleKeydown);
		return () => {
			window.removeEventListener('keydown', handleKeydown);
			clearTimeout(armTimer);
		};
	});
</script>

<svelte:window onpointerdown={handleWindowPointerDown} />

<div class="relative" bind:this={wrapper}>
	<button
		class="flex h-11 items-center gap-2 rounded-md border border-border bg-surface-800 px-2.5 transition hover:border-border-strong hover:bg-surface-700"
		type="button"
		aria-haspopup="menu"
		aria-expanded={open}
		aria-label="Switch profile"
		onclick={() => (open = !open)}
	>
		<span
			class="h-3 w-3 shrink-0 rounded-full"
			style="background:{activeProfile?.color ?? '#67B8A8'}"
		></span>
		<span
			class="hidden min-[420px]:inline max-w-24 truncate text-sm font-semibold text-text-primary"
			>{activeProfile?.name ?? 'Profile'}</span
		>
		<svg
			viewBox="0 0 24 24"
			class="h-4 w-4 shrink-0 text-text-subtle transition-transform duration-200 {open
				? 'rotate-180'
				: ''}"
			fill="none"
			stroke="currentColor"
			stroke-width="2"
			><path d="m6 9 6 6 6-6" /></svg
		>
	</button>

	{#if open}
		<div
			class="absolute right-0 top-[calc(100%+0.5rem)] z-50 max-h-[calc(100dvh-5rem)] w-[min(18rem,calc(100vw-1rem))] overflow-y-auto rounded-md border border-border bg-surface-900 p-2 shadow-2xl"
			role="menu"
			aria-label="Profile"
		>
			<div class="px-2 py-1.5">
				<span class="eyebrow">Profile</span>
			</div>

			<div class="space-y-1">
				{#each profiles as profile (profile.id)}
					<div class="rounded-md border border-border bg-surface-800/60">
						<div class="flex items-center gap-2.5 px-2.5">
							<span
								class="h-3.5 w-3.5 shrink-0 rounded-full"
								style="background:{profile.color}"
							></span>
							<button
								class="min-w-0 flex-1 py-2.5 text-left"
								type="button"
								role="menuitem"
								onclick={() => {
									close();
									onswitch(profile.id);
								}}
							>
								<span class="block truncate font-bold text-text-primary">{profile.name}</span>
								{#if profile.id === activeProfileId}
									<span class="block text-xs font-normal text-accent">Active profile</span>
								{:else}
									<span class="block text-xs text-text-muted">Switch here</span>
								{/if}
							</button>
							{#if profile.id !== 'default'}
								<button
									class="grid h-11 w-11 shrink-0 place-items-center rounded-md text-text-subtle transition hover:bg-surface-700 hover:text-text-primary"
									type="button"
									aria-label="Rename {profile.name}"
									role="menuitem"
									onclick={() => toggleRename(profile.id, profile.name)}
								>
									<svg
										viewBox="0 0 24 24"
										class="h-4 w-4"
										fill="none"
										stroke="currentColor"
										stroke-width="2"
										><path d="M17 3a2.8 2.8 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5Z" /></svg
									>
								</button>
								<button
									class="grid h-11 w-11 shrink-0 place-items-center rounded-md text-danger transition hover:bg-danger/15"
									type="button"
									class:opacity-40={profile.id === activeProfileId}
									class:pointer-events-none={profile.id === activeProfileId}
									disabled={profile.id === activeProfileId}
									title={profile.id === activeProfileId
										? 'Switch away from this profile before deleting it'
										: armingDeleteId === profile.id
											? 'Confirm delete'
											: 'Delete profile'}
									aria-label="Delete {profile.name}"
									role="menuitem"
									onclick={() => armDelete(profile.id)}
								>
									{#if armingDeleteId === profile.id}
										<span class="text-[11px] font-bold">Sure?</span>
									{:else}
										<svg
											viewBox="0 0 24 24"
											class="h-4 w-4"
											fill="none"
											stroke="currentColor"
											stroke-width="2"
											><path
												d="M3 6h18M8 6V4a1 1 0 0 1 1-1h6a1 1 0 0 1 1 1v2m3 0v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6"
											/></svg
										>
									{/if}
								</button>
							{/if}
						</div>
						{#if renamingId === profile.id}
							<form class="flex gap-2 border-t border-border px-2.5 py-2.5" onsubmit={submitRename}>
								<input
									class="min-h-11 flex-1 rounded-md border border-border bg-surface-800 px-3 text-sm text-text-primary outline-none focus:border-accent"
									bind:value={renameValue}
									placeholder="Profile name"
									maxlength="24"
									aria-label="Rename profile"
								/>
								<button class="btn btn-primary min-h-11" type="submit">Save</button>
							</form>
						{/if}
					</div>
				{/each}
			</div>

			{#if adding}
				<form class="mt-2 rounded-md border border-border bg-surface-800/60 p-3" onsubmit={submitCreate}>
					<label class="eyebrow" for="new-profile-name">Add profile</label>
					<input
						id="new-profile-name"
						class="mt-2 min-h-11 w-full rounded-md border border-border bg-surface-800 px-3 text-sm text-text-primary outline-none focus:border-accent"
						bind:value={newName}
						placeholder="Name (e.g. Alex)"
						maxlength="24"
					/>
					<div class="mt-3 flex items-center gap-2" role="radiogroup" aria-label="Profile color">
						{#each PROFILE_COLORS as color (color)}
							<button
								class="h-11 w-11 rounded-md border transition {newColor === color
									? 'border-accent ring-2 ring-accent/40'
									: 'border-border hover:border-border-strong'}"
								type="button"
								style="background:{color}"
								aria-label="Color {color}"
								role="radio"
								aria-checked={newColor === color}
								onclick={() => (newColor = color)}
							></button>
						{/each}
					</div>
					{#if error}<p class="mt-2 text-xs text-danger">{error}</p>{/if}
					<button
						class="btn btn-primary mt-3 w-full"
						type="submit"
						disabled={busy || newName.trim().length === 0}
						>Add profile</button
					>
				</form>
			{:else if profiles.length < 2}
				<button
					class="mt-1 flex min-h-11 w-full items-center gap-3 rounded-md border border-dashed border-border px-3 text-text-secondary transition hover:border-accent/50 hover:text-accent"
					type="button"
					role="menuitem"
					onclick={() => {
						adding = true;
						newName = '';
						error = '';
					}}
				>
					<svg viewBox="0 0 24 24" class="h-5 w-5" fill="none" stroke="currentColor" stroke-width="2"
						><path d="M12 5v14M5 12h14" /></svg
					>
					<span class="text-sm font-semibold">Add profile</span>
				</button>
			{:else}
				<p class="mt-2 px-2 text-center text-xs text-text-muted">
					2 of 2 profiles — delete one to add another.
				</p>
			{/if}
		</div>
	{/if}
</div>
