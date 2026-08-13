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

	const PROFILE_COLORS = ['#b7f04c', '#4cc9f0', '#f0b04c', '#f04c8a'];

	let open = $state(false);
	let adding = $state(false);
	let newName = $state('');
	let newColor = $state(PROFILE_COLORS[0]);
	let renamingId = $state<string | null>(null);
	let renameValue = $state('');
	let armingDeleteId = $state<string | null>(null);
	let busy = $state(false);
	let error = $state('');

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

	function handleKeydown(event: KeyboardEvent) {
		if (event.key === 'Escape' && open) open = false;
	}
	onMount(() => {
		window.addEventListener('keydown', handleKeydown);
		return () => {
			window.removeEventListener('keydown', handleKeydown);
			clearTimeout(armTimer);
		};
	});
</script>

<button
	class="flex h-11 items-center gap-2 rounded-md border border-border bg-surface-800 px-2.5 transition hover:border-border-strong hover:bg-surface-700 md:h-10"
	type="button"
	aria-haspopup="dialog"
	aria-expanded={open}
	aria-label="Switch profile"
	onclick={() => (open = true)}
>
	<span
		class="h-3 w-3 shrink-0 rounded-full"
		style="background:{activeProfile?.color ?? '#b7f04c'}"
	></span>
	<span
		class="hidden min-[420px]:inline max-w-24 truncate text-sm font-semibold text-text-primary"
		>{activeProfile?.name ?? 'Profile'}</span
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
	class="fixed inset-0 z-[60] bg-black/50 transition-opacity duration-200"
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
		class="absolute inset-x-0 bottom-0 max-h-[85dvh] overflow-y-auto rounded-t-md border-t border-border bg-surface-900 p-5 pb-safe shadow-2xl transition-transform duration-300 ease-out"
		class:translate-y-full={!open}
		class:translate-y-0={open}
		aria-label="Profile switcher"
	>
		<div class="mx-auto mb-4 h-1 w-10 rounded-sm bg-surface-600"></div>
		<div class="sticky top-0 z-10 -mx-5 mb-3 flex items-center justify-between bg-surface-900/95 px-5 py-1 backdrop-blur">
			<span class="eyebrow">Profile</span>
			<button
				class="grid h-11 w-11 place-items-center rounded-md text-text-secondary transition hover:bg-surface-700 hover:text-text-primary"
				type="button"
				aria-label="Close profile menu"
				onclick={() => (open = false)}
			>
				<svg viewBox="0 0 24 24" class="h-5 w-5" fill="none" stroke="currentColor" stroke-width="2"
					><path d="m6 6 12 12M18 6 6 18" /></svg
				>
			</button>
		</div>

		<div class="space-y-2">
			{#each profiles as profile (profile.id)}
				<div class="rounded-md border border-border bg-surface-800/60">
					<div class="flex items-center gap-3 px-4">
						<span
							class="h-3.5 w-3.5 shrink-0 rounded-full"
							style="background:{profile.color}"
						></span>
						<button
							class="min-w-0 flex-1 py-3 text-left"
							type="button"
							onclick={() => {
								open = false;
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
										><path d="M3 6h18M8 6V4a1 1 0 0 1 1-1h6a1 1 0 0 1 1 1v2m3 0v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6" /></svg
									>
								{/if}
							</button>
						{/if}
					</div>
					{#if renamingId === profile.id}
						<form class="flex gap-2 border-t border-border px-4 py-3" onsubmit={submitRename}>
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
			<form class="mt-3 rounded-md border border-border bg-surface-800/60 p-4" onsubmit={submitCreate}>
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
							class="h-9 w-9 rounded-md border transition {newColor === color
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
					class="btn btn-primary mt-4 w-full"
					type="submit"
					disabled={busy || newName.trim().length === 0}
					>Add profile</button
				>
			</form>
		{:else if profiles.length < 2}
			<button
				class="mt-3 flex min-h-14 w-full items-center gap-3 rounded-md border border-dashed border-border px-4 text-text-secondary transition hover:border-accent/50 hover:text-accent"
				type="button"
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
			<p class="mt-3 text-center text-xs text-text-muted">
				2 of 2 profiles — delete one to add another.
			</p>
		{/if}
	</aside>
</div>
