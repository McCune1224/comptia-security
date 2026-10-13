<script lang="ts">
	import { onMount } from 'svelte';
	import ExamDateEditor from '$lib/components/ExamDateEditor.svelte';
	import { parseDateKey } from '$lib/utils';
	import ContextRail from '$lib/components/ContextRail.svelte';

	type Profile = { id: string; name: string; color: string; courseId: string };
	type Course = { id: string; title: string; shortTitle: string };
	type ScopeInfo = {
		scope: { profileId: string; courseId: string };
		profiles: Profile[];
		courses: Course[];
	};
	type Assignment = {
		assignment: { id: string; title: string; kind: string };
		dueDateLabel: string;
		overridden: boolean;
		derivedDueDateLabel: string;
		status: string;
	};
	type Syllabus = {
		modules: { module: { title: string }; assignments: Assignment[] }[];
		examDate: string;
	};

	const PROFILE_COLORS = ['#67B8A8', '#82B5D5', '#E0B66A', '#D894B8'];

	let scopeInfo = $state<ScopeInfo | null>(null);
	let syllabus = $state<Syllabus | null>(null);
	let loadError = $state('');

	let edits = $state<Record<string, string>>({});
	let busyAssignment = $state<string | null>(null);
	let dueDateMessage = $state('');

	// Reset gate — two explicit steps: reveal panel, then type RESET.
	let resetOpen = $state(false);
	let resetPhrase = $state('');
	let resetting = $state(false);
	let resetMessage = $state('');

	let importing = $state(false);
	let backupMessage = $state('');
	let backupOk = $state(false);

	// Profile management state.
	let newName = $state('');
	let newColor = $state(PROFILE_COLORS[0]);
	let renamingId = $state<string | null>(null);
	let renameValue = $state('');
	let profileMessage = $state('');

	const assignments = $derived(syllabus ? syllabus.modules.flatMap((m) => m.assignments) : []);
	const overrideCount = $derived(assignments.filter((a) => a.overridden).length);
	const activeCourse = $derived.by(() => {
		const info = scopeInfo;
		if (!info) return null;
		return info.courses.find((course) => course.id === info.scope.courseId) ?? null;
	});
	const activeProfile = $derived.by(() => {
		const info = scopeInfo;
		if (!info) return null;
		return info.profiles.find((profile) => profile.id === info.scope.profileId) ?? null;
	});

	async function load() {
		try {
			const [scopeResponse, syllabusResponse] = await Promise.all([
				fetch('/api/scope'),
				fetch('/api/course/syllabus')
			]);
			if (scopeResponse.ok) scopeInfo = await scopeResponse.json();
			if (syllabusResponse.ok) {
				syllabus = await syllabusResponse.json();
				edits = {};
			} else loadError = 'Unable to load assignments.';
		} catch {
			loadError = 'Unable to reach the API.';
		}
	}
	onMount(load);

	async function saveDueDate(assignment: Assignment) {
		const value = edits[assignment.assignment.id];
		const dueDate = value === '' || value === undefined ? null : parseDateKey(value);
		if (value !== undefined && value !== '' && dueDate === null) {
			dueDateMessage = 'Use a real calendar date in YYYY-MM-DD format.';
			return;
		}
		busyAssignment = assignment.assignment.id;
		dueDateMessage = '';
		const response = await fetch('/api/course/due-date', {
			method: 'POST',
			headers: { 'content-type': 'application/json' },
			body: JSON.stringify({ assignmentId: assignment.assignment.id, dueDate })
		});
		busyAssignment = null;
		if (response.ok) {
			dueDateMessage =
				dueDate === null
					? `Override cleared — ${assignment.assignment.title} follows the schedule again.`
					: `Due date pinned for ${assignment.assignment.title}.`;
			await load();
		} else {
			const payload = (await response.json().catch(() => null)) as {
				error?: { message?: string };
			} | null;
			dueDateMessage = payload?.error?.message ?? 'Could not save the override.';
		}
	}

	async function resetProgress() {
		resetting = true;
		resetMessage = '';
		const response = await fetch('/api/admin/reset', {
			method: 'POST',
			headers: { 'content-type': 'application/json' },
			body: JSON.stringify({ confirm: true })
		});
		resetting = false;
		if (response.ok) {
			resetOpen = false;
			resetPhrase = '';
			resetMessage = 'Progress wiped for this profile and course.';
			await load();
		} else {
			const payload = (await response.json().catch(() => null)) as {
				error?: { message?: string };
			} | null;
			resetMessage = payload?.error?.message ?? 'Reset failed.';
		}
	}

	async function importBackup(file: File) {
		importing = true;
		backupMessage = '';
		try {
			const parsed: unknown = JSON.parse(await file.text());
			const response = await fetch('/api/admin/backup', {
				method: 'POST',
				headers: { 'content-type': 'application/json' },
				body: JSON.stringify(parsed)
			});
			const payload = (await response.json().catch(() => null)) as {
				error?: { message?: string };
			} | null;
			backupOk = response.ok;
			backupMessage = response.ok
				? 'Backup restored — progress for this profile and course was replaced.'
				: (payload?.error?.message ?? 'Import failed.');
			if (response.ok) await load();
		} catch {
			backupOk = false;
			backupMessage = 'That file is not valid JSON.';
		} finally {
			importing = false;
		}
	}

	async function switchScope(action: 'profile' | 'course', id: string) {
		const response = await fetch('/api/scope', {
			method: 'POST',
			headers: { 'content-type': 'application/json' },
			body: JSON.stringify({
				action: 'switch',
				[action === 'profile' ? 'profileId' : 'courseId']: id
			})
		});
		if (response.ok) window.location.reload();
	}

	async function createProfile() {
		if (!newName.trim()) return;
		profileMessage = '';
		const response = await fetch('/api/scope', {
			method: 'POST',
			headers: { 'content-type': 'application/json' },
			body: JSON.stringify({ action: 'create', name: newName.trim(), color: newColor })
		});
		const payload = (await response.json().catch(() => null)) as {
			profile?: Profile;
			error?: { message?: string };
		} | null;
		if (response.ok && payload?.profile) {
			newName = '';
			await switchScope('profile', payload.profile.id);
		} else profileMessage = payload?.error?.message ?? 'Could not create the profile.';
	}

	async function renameProfile(profileId: string) {
		if (!renameValue.trim()) return;
		profileMessage = '';
		const response = await fetch('/api/scope', {
			method: 'POST',
			headers: { 'content-type': 'application/json' },
			body: JSON.stringify({ action: 'rename', profileId, name: renameValue.trim() })
		});
		if (response.ok) {
			renamingId = null;
			await load();
		} else profileMessage = 'Could not rename the profile.';
	}

	async function deleteProfile(profile: Profile) {
		if (
			!confirm(`Delete profile "${profile.name}" and ALL of its progress? This cannot be undone.`)
		)
			return;
		profileMessage = '';
		const response = await fetch(`/api/scope?profileId=${encodeURIComponent(profile.id)}`, {
			method: 'DELETE'
		});
		const payload = (await response.json().catch(() => null)) as {
			error?: { message?: string };
		} | null;
		if (response.ok) await load();
		else profileMessage = payload?.error?.message ?? 'Could not delete the profile.';
	}

	function kindLabel(kind: string): string {
		return kind === 'quiz'
			? 'Quiz'
			: kind === 'scenario'
				? 'Scenario'
				: kind === 'pbq'
					? 'PBQ'
					: 'Full Exam';
	}
</script>

<header class="card p-6 sm:p-8">
	<p class="eyebrow">Self-service administration</p>
	<h1 class="h-display mt-2 text-3xl text-text-primary sm:text-4xl">
		The <span class="serif-italic text-accent">back office</span>
	</h1>
	{#if scopeInfo}
		<p class="mt-3 max-w-2xl text-sm leading-relaxed text-text-secondary">
			Acting as
			<span class="font-bold text-text-primary"
				>{activeProfile?.name ?? scopeInfo.scope.profileId}</span
			>
			in
			<span class="font-bold text-text-primary"
				>{activeCourse?.title ?? scopeInfo.scope.courseId}</span
			>
			— scope comes from your active profile &amp; course cookies, not from this page.
		</p>
	{/if}
</header>

{#if loadError}
	<section class="card p-6 text-danger">{loadError}</section>
{:else}
	<div class="grid gap-6 xl:grid-cols-[minmax(0,1fr)_20rem] xl:gap-8">
		<div class="space-y-6">
			<!-- Exam date -->
			<section class="card space-y-3 p-5 sm:p-6" id="exam-date">
				<div>
					<h2 class="h-display text-xl text-text-primary">Exam date</h2>
					<p class="mt-1 text-sm text-text-muted">
						Moving the exam reschedules every assignment that has no due-date override.
					</p>
				</div>
				{#if syllabus}
					<ExamDateEditor
						examDate={syllabus.examDate}
						onsaved={async () => {
							await load();
						}}
					/>
				{/if}
			</section>

			<!-- Per-assignment due dates -->
			<section class="card space-y-3 p-5 sm:p-6" id="due-dates">
				<div>
					<h2 class="h-display text-xl text-text-primary">Assignment due dates</h2>
					<p class="mt-1 text-sm text-text-muted">
						Pin an explicit due date to override the schedule ({overrideCount} pinned). Clear the override
						to follow the exam-anchored schedule again.
					</p>
				</div>
				{#if dueDateMessage}
					<p class="text-xs font-semibold text-accent">{dueDateMessage}</p>
				{/if}
				<ul class="space-y-2.5">
					{#each assignments as item (item.assignment.id)}
						<li
							class="flex flex-wrap items-center gap-3 rounded-xl border border-border bg-surface-900/50 p-4"
						>
							<span class="chip w-20 shrink-0 justify-center bg-surface-700 text-text-muted"
								>{kindLabel(item.assignment.kind)}</span
							>
							<span class="min-w-0 flex-1">
								<span class="block truncate text-sm font-bold text-text-primary"
									>{item.assignment.title}</span
								>
								<span class="block text-xs text-text-muted">
									{item.dueDateLabel}
									{#if item.overridden}
										<span class="text-accent">· pinned (schedule: {item.derivedDueDateLabel})</span>
									{/if}
								</span>
							</span>
							<input
								type="date"
								class="h-11 rounded-lg border border-border-strong bg-surface-800 px-3 text-sm text-text-primary"
								aria-label="New due date for {item.assignment.title}"
								bind:value={edits[item.assignment.id]}
							/>
							<button
								class="btn btn-primary"
								type="button"
								disabled={busyAssignment === item.assignment.id ||
									(!edits[item.assignment.id] && !item.overridden)}
								onclick={() => saveDueDate(item)}
							>
								{#if edits[item.assignment.id]}
									Pin
								{:else}
									Clear
								{/if}
							</button>
						</li>
					{/each}
				</ul>
			</section>

			<!-- Backup & restore -->
			<section class="card space-y-3 p-5 sm:p-6" id="backup">
				<div>
					<h2 class="h-display text-xl text-text-primary">Backup &amp; restore</h2>
					<p class="mt-1 text-sm text-text-muted">
						Export all progress for this profile + course (sessions, answers, domain progress,
						review cards, study log, submissions, lesson completions, exam date, pinned due dates)
						as JSON. Importing replaces this scope's progress with the file's — the file must belong
						to the same course.
					</p>
				</div>
				<div class="flex flex-wrap items-center gap-3">
					<a class="btn btn-ghost" href="/api/admin/backup" download> Export backup </a>
					<label class="btn btn-ghost cursor-pointer">
						{importing ? 'Importing…' : 'Import backup'}
						<input
							type="file"
							accept="application/json,.json"
							class="hidden"
							disabled={importing}
							onchange={(event) => {
								const file = event.currentTarget.files?.[0];
								if (file) void importBackup(file);
								event.currentTarget.value = '';
							}}
						/>
					</label>
				</div>
				{#if backupMessage}
					<p class="text-xs font-semibold {backupOk ? 'text-success' : 'text-danger'}">
						{backupMessage}
					</p>
				{/if}
			</section>

			<!-- Danger zone -->
			<section class="card space-y-3 border-danger/50 p-5 sm:p-6" id="danger">
				<div>
					<h2 class="h-display text-xl text-danger">Danger zone</h2>
					<p class="mt-1 text-sm text-text-muted">
						Reset erases, for the active profile and course only: quiz sessions &amp; answers,
						domain progress, review cards, the study log (streaks and heatmap are per-profile),
						assignment submissions, and lesson completions. Profiles, course content, the exam date,
						and pinned due dates survive.
					</p>
				</div>
				{#if !resetOpen}
					<button class="btn btn-danger" type="button" onclick={() => (resetOpen = true)}>
						Reset all progress…
					</button>
				{:else}
					<div class="space-y-3 rounded-xl border border-danger/40 bg-danger/5 p-4">
						<p class="text-sm text-text-secondary">
							This cannot be undone. Type <span class="font-bold text-danger">RESET</span> to confirm.
						</p>
						<input
							class="h-11 w-48 rounded-lg border border-border-strong bg-surface-900 px-3 text-sm text-text-primary"
							type="text"
							bind:value={resetPhrase}
							aria-label="Type RESET to confirm"
						/>
						<div class="flex gap-2">
							<button
								class="btn btn-danger"
								type="button"
								disabled={resetPhrase !== 'RESET' || resetting}
								onclick={resetProgress}
							>
								{resetting ? 'Wiping…' : 'Wipe progress'}
							</button>
							<button
								class="btn btn-ghost"
								type="button"
								onclick={() => {
									resetOpen = false;
									resetPhrase = '';
								}}
							>
								Cancel
							</button>
						</div>
					</div>
				{/if}
				{#if resetMessage}
					<p class="text-xs font-semibold text-accent">{resetMessage}</p>
				{/if}
			</section>

			<!-- Profiles -->
			<section class="card space-y-3 p-5 sm:p-6" id="profiles">
				<div>
					<h2 class="h-display text-xl text-text-primary">Profiles</h2>
					<p class="mt-1 text-sm text-text-muted">
						Local profiles (max 2). The default profile cannot be deleted, and the active profile
						must be switched away from first.
					</p>
				</div>
				{#if scopeInfo}
					<ul class="space-y-2.5">
						{#each scopeInfo.profiles as profile (profile.id)}
							<li
								class="flex flex-wrap items-center gap-3 rounded-xl border border-border bg-surface-900/50 p-4"
							>
								<span
									class="h-4 w-4 shrink-0 rounded"
									style="background:{profile.color}"
									aria-hidden="true"
								></span>
								<span class="min-w-0 flex-1">
									<span class="block truncate text-sm font-bold text-text-primary">
										{profile.name}
										{#if profile.id === scopeInfo.scope.profileId}
											<span class="chip ml-1 bg-accent/10 text-accent">active</span>
										{/if}
									</span>
									<span class="block text-xs text-text-muted">
										{scopeInfo.courses.find((course) => course.id === profile.courseId)
											?.shortTitle ?? profile.courseId}
									</span>
								</span>
								{#if profile.id === renamingId}
									<input
										class="h-11 rounded-lg border border-border-strong bg-surface-800 px-3 text-sm text-text-primary"
										type="text"
										bind:value={renameValue}
										aria-label="New name"
									/>
									<button
										class="btn btn-primary"
										type="button"
										onclick={() => renameProfile(profile.id)}
									>
										Save
									</button>
								{:else}
									{#if profile.id !== scopeInfo.scope.profileId}
										<button
											class="btn btn-ghost"
											type="button"
											onclick={() => switchScope('profile', profile.id)}
										>
											Switch to
										</button>
									{/if}
									<button
										class="btn btn-ghost"
										type="button"
										onclick={() => {
											renamingId = profile.id;
											renameValue = profile.name;
										}}
									>
										Rename
									</button>
									<button
										class="btn btn-danger"
										type="button"
										disabled={profile.id === 'default' || profile.id === scopeInfo.scope.profileId}
										onclick={() => deleteProfile(profile)}
									>
										Delete
									</button>
								{/if}
							</li>
						{/each}
					</ul>

					<div class="flex flex-wrap items-center gap-3 border-t border-border pt-5">
						<input
							class="h-11 w-44 rounded-lg border border-border-strong bg-surface-800 px-3 text-sm text-text-primary"
							type="text"
							placeholder="New profile name"
							maxlength="24"
							bind:value={newName}
						/>
						<div class="flex gap-1.5" role="radiogroup" aria-label="Profile color">
							{#each PROFILE_COLORS as color (color)}
								<button
									type="button"
									class="h-11 w-11 rounded border-2 transition {newColor === color
										? 'border-accent'
										: 'border-transparent'}"
									style="background:{color}"
									aria-label="Color {color}"
									aria-checked={newColor === color}
									role="radio"
									onclick={() => (newColor = color)}
								></button>
							{/each}
						</div>
						<button class="btn btn-primary" type="button" onclick={createProfile}>
							Create profile
						</button>
					</div>
					{#if profileMessage}
						<p class="text-xs font-semibold text-warning">{profileMessage}</p>
					{/if}
				{/if}
			</section>
		</div>

		<ContextRail title="On this page">
			<nav class="card p-5" aria-label="Jump to section">
				<div class="space-y-1">
					<a
						href="#exam-date"
						class="flex min-h-11 items-center rounded px-2 text-sm text-text-secondary transition hover:bg-surface-700 hover:text-text-primary"
						>Exam date</a
					>
					<a
						href="#due-dates"
						class="flex min-h-11 items-center rounded px-2 text-sm text-text-secondary transition hover:bg-surface-700 hover:text-text-primary"
						>Assignment due dates</a
					>
					<a
						href="#backup"
						class="flex min-h-11 items-center rounded px-2 text-sm text-text-secondary transition hover:bg-surface-700 hover:text-text-primary"
						>Backup &amp; restore</a
					>
					<a
						href="#danger"
						class="flex min-h-11 items-center rounded px-2 text-sm text-text-secondary transition hover:bg-surface-700 hover:text-text-primary"
						>Danger zone</a
					>
					<a
						href="#profiles"
						class="flex min-h-11 items-center rounded px-2 text-sm text-text-secondary transition hover:bg-surface-700 hover:text-text-primary"
						>Profiles</a
					>
				</div>
			</nav>
			{#if scopeInfo}
				<div class="card p-5">
					<p class="text-xs font-semibold uppercase tracking-[0.12em] text-text-muted">
						Active scope
					</p>
					<p class="mt-2 text-sm font-semibold text-text-primary">
						{activeProfile?.name ?? scopeInfo.scope.profileId}
					</p>
					<p class="text-xs text-text-muted">{activeCourse?.title ?? scopeInfo.scope.courseId}</p>
				</div>
			{/if}
		</ContextRail>
	</div>
{/if}
