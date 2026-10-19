<script lang="ts">
	import { onMount } from 'svelte';
	import StatusChip from '$lib/components/StatusChip.svelte';
	import ContextRail from '$lib/components/ContextRail.svelte';

	type AssignmentView = {
		assignment: { id: string; title: string; kind: string };
		dueDateLabel: string;
		daysUntilDue: number;
		status: 'open' | 'due-soon' | 'overdue' | 'in-progress' | 'submitted';
	};

	type ExternalEvent = {
		id: string;
		summary: string;
		calendarName: string;
		allDay: boolean;
		start: string;
		startTime?: string;
		end: string;
		htmlLink: string;
		url: string;
	};

	type GcalStatus = {
		configured: boolean;
		connected: boolean;
		email: string | null;
		calendarId: string | null;
		syncedCount: number;
		lastSyncAt: string | null;
	};

	type ImportStatus = {
		imported: boolean;
		sourceName: string | null;
		eventCount: number;
		importedAt: string | null;
	};

	let assignments = $state<AssignmentView[]>([]);
	let error = $state('');
	let loading = $state(true);
	let today = $state(new Date());
	let viewMonth = $state(new Date());
	let selectedDay = $state<Date | null>(null);

	let gcal = $state<GcalStatus | null>(null);
	let gcalEvents = $state<ExternalEvent[]>([]);
	let gcalUpcoming = $state<ExternalEvent[]>([]);
	let showGoogle = $state(true);
	let gcalBusy = $state(false);
	let gcalNotice = $state('');

	// .ics import — the no-API-key path for seeing your real calendar here.
	let importStatus = $state<ImportStatus | null>(null);
	let importedEvents = $state<ExternalEvent[]>([]);
	let showImported = $state(true);
	let fileBusy = $state(false);
	let fileNotice = $state('');
	let fileNoticeOk = $state(false);

	const monthLabel = $derived(
		viewMonth.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })
	);

	const daysInMonth = $derived(
		new Date(viewMonth.getFullYear(), viewMonth.getMonth() + 1, 0).getDate()
	);
	const firstWeekday = $derived(
		new Date(viewMonth.getFullYear(), viewMonth.getMonth(), 1).getDay()
	);

	const byDay = $derived(
		assignments.reduce<Record<string, AssignmentView[]>>((map, item) => {
			const key = item.dueDateLabel;
			(map[key] ??= []).push(item);
			return map;
		}, {})
	);

	// Both external sources (Google, an imported .ics) render identically, so
	// merge them once and let the grid and the day panel read one list.
	const externalEvents = $derived([
		...(gcal?.connected && showGoogle ? gcalEvents : []),
		...(importStatus?.imported && showImported ? importedEvents : [])
	]);

	const externalByDay = $derived(
		externalEvents.reduce<Record<string, ExternalEvent[]>>((map, event) => {
			const key = dayKeyForEvent(event);
			if (key) (map[key] ??= []).push(event);
			return map;
		}, {})
	);

	const hasExternal = $derived(Boolean(gcal?.connected) || Boolean(importStatus?.imported));

	const nextUp = $derived.by(() => {
		type Row = { key: string; ms: number; assignment?: AssignmentView; event?: ExternalEvent };
		const rows: Row[] = [];
		const today0 = new Date(today.getFullYear(), today.getMonth(), today.getDate()).getTime();
		for (const item of assignments.filter((a) => a.status !== 'submitted')) {
			rows.push({
				key: `a:${item.assignment.id}`,
				ms: today0 + item.daysUntilDue * 86_400_000,
				assignment: item
			});
		}
		const horizon = today0 + 45 * 86_400_000;
		const upcoming = [
			...gcalUpcoming,
			...(importStatus?.imported && showImported ? importedEvents : [])
		];
		for (const event of upcoming) {
			const ms = startMs(event);
			if (ms >= today0 && ms <= horizon) rows.push({ key: `g:${event.id}`, ms, event });
		}
		return rows.sort((a, b) => a.ms - b.ms).slice(0, 8);
	});

	onMount(async () => {
		try {
			const response = await fetch('/api/course/syllabus');
			if (response.ok) {
				const data = await response.json();
				assignments = data.modules.flatMap((m: { assignments: AssignmentView[] }) => m.assignments);
			} else error = 'Unable to load the calendar.';
		} finally {
			loading = false;
		}

		await loadStatus();
		await loadImport();

		const params = new URLSearchParams(window.location.search);
		if (params.get('connected') === '1' && gcal?.connected) {
			await syncDeadlines(true);
		} else if (params.get('error')) {
			gcalNotice =
				params.get('error') === 'state'
					? 'Google sign-in did not complete — please try again.'
					: 'Google sign-in was cancelled or failed.';
		}
		if (params.get('connected') || params.get('error'))
			window.history.replaceState({}, '', '/calendar');

		if (gcal?.connected) {
			void loadUpcomingEvents();
			if (showGoogle) void loadMonthEvents(viewMonth);
		}
	});

	$effect(() => {
		if (gcal?.connected && showGoogle) {
			const month = viewMonth;
			void loadMonthEvents(month);
		}
	});

	function keyFor(date: Date): string {
		return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
	}

	function toKey(date: Date): string {
		return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
	}

	function isToday(date: Date): boolean {
		return keyFor(date) === keyFor(today);
	}

	function inPast(date: Date): boolean {
		return (
			date.getTime() < new Date(today.getFullYear(), today.getMonth(), today.getDate()).getTime()
		);
	}

	function statusTone(status: string): string {
		if (status === 'submitted') return 'bg-success/15 text-success';
		if (status === 'overdue') return 'bg-danger/15 text-danger';
		if (status === 'due-soon') return 'bg-warning/15 text-warning';
		if (status === 'in-progress') return 'bg-info/15 text-info';
		return 'bg-surface-700 text-text-secondary';
	}

	function shiftMonth(delta: number) {
		viewMonth = new Date(viewMonth.getFullYear(), viewMonth.getMonth() + delta, 1);
		selectedDay = null;
	}

	// ── Calendar files (.ics) ──────────────────────────────────────────────────

	async function loadImport() {
		try {
			const response = await fetch('/api/calendar/import');
			if (!response.ok) return;
			const data = (await response.json()) as ImportStatus & { events: ExternalEvent[] };
			importStatus = data;
			importedEvents = data.events.map((event) => ({ ...event, id: `import:${event.id}` }));
		} catch {
			// no import yet, or the server is unreachable — deadlines still render
		}
	}

	async function importFile(file: File) {
		fileBusy = true;
		fileNotice = '';
		try {
			const response = await fetch(`/api/calendar/import?name=${encodeURIComponent(file.name)}`, {
				method: 'POST',
				headers: { 'content-type': 'text/calendar' },
				body: await file.text()
			});
			const payload = (await response.json().catch(() => null)) as {
				eventCount?: number;
				skipped?: number;
				error?: { message?: string };
			} | null;
			fileNoticeOk = response.ok;
			if (response.ok) {
				fileNotice = `Imported ${payload?.eventCount ?? 0} event${payload?.eventCount === 1 ? '' : 's'} from ${file.name}${payload?.skipped ? ` (${payload.skipped} skipped)` : ''}.`;
				await loadImport();
			} else fileNotice = payload?.error?.message ?? 'Could not import that file.';
		} catch {
			fileNoticeOk = false;
			fileNotice = 'Could not reach the server.';
		} finally {
			fileBusy = false;
		}
	}

	async function clearImport() {
		if (!confirm('Remove the imported calendar from this view? Your own calendar is untouched.'))
			return;
		fileBusy = true;
		try {
			await fetch('/api/calendar/import', { method: 'DELETE' });
			importStatus = null;
			importedEvents = [];
			fileNoticeOk = true;
			fileNotice = 'Imported calendar removed.';
		} finally {
			fileBusy = false;
		}
	}

	// ── Google Calendar helpers ────────────────────────────────────────────────

	async function loadStatus() {
		try {
			const statusResponse = await fetch('/api/calendar/google/status');
			if (statusResponse.ok) gcal = await statusResponse.json();
		} catch {
			// server unreachable — assignments still render; gcal stays null
		}
	}

	async function connect() {
		gcalBusy = true;
		gcalNotice = '';
		try {
			const response = await fetch('/api/calendar/google/auth-url');
			const data = await response.json();
			if (response.ok && data.authUrl) window.location.href = data.authUrl;
			else gcalNotice = data.error?.message ?? 'Could not start Google sign-in.';
		} catch {
			gcalNotice = 'Could not reach the server.';
		} finally {
			gcalBusy = false;
		}
	}

	async function syncDeadlines(quiet = false) {
		if (!gcal?.connected || gcalBusy) return;
		gcalBusy = true;
		if (!quiet) gcalNotice = '';
		try {
			const response = await fetch('/api/calendar/google/sync', { method: 'POST' });
			const data = await response.json();
			if (response.ok) {
				gcalNotice = `Pushed ${data.created} new deadline${data.created === 1 ? '' : 's'}${data.updated ? `, updated ${data.updated}` : ''}${data.deleted ? `, removed ${data.deleted}` : ''} to “${data.calendarName}”.`;
				await loadStatus();
			} else gcalNotice = data.error?.message ?? 'Sync failed.';
		} catch {
			gcalNotice = 'Sync failed — is the server reachable?';
		} finally {
			gcalBusy = false;
		}
	}

	async function disconnect() {
		if (!confirm('Disconnect Google Calendar? Events already pushed to your calendar stay put.'))
			return;
		gcalBusy = true;
		try {
			await fetch('/api/calendar/google/disconnect', { method: 'POST' });
			if (gcal)
				gcal = {
					...gcal,
					connected: false,
					email: null,
					calendarId: null,
					syncedCount: 0,
					lastSyncAt: null
				};
			gcalEvents = [];
			gcalUpcoming = [];
			gcalNotice = 'Disconnected from Google Calendar.';
		} finally {
			gcalBusy = false;
		}
	}

	async function loadMonthEvents(month: Date) {
		const endDate = new Date(month.getFullYear(), month.getMonth() + 1, 0);
		try {
			const response = await fetch(
				`/api/calendar/google/events?start=${toKey(month)}&end=${toKey(endDate)}`
			);
			if (response.ok) {
				const data = await response.json();
				gcalEvents = data.events;
			}
		} catch {
			// keep whatever we had; course deadlines still render
		}
	}

	async function loadUpcomingEvents() {
		const today0 = new Date(today.getFullYear(), today.getMonth(), today.getDate());
		const horizon = new Date(today0.getTime() + 45 * 86_400_000);
		try {
			const response = await fetch(
				`/api/calendar/google/events?start=${toKey(today0)}&end=${toKey(horizon)}`
			);
			if (response.ok) {
				const data = await response.json();
				gcalUpcoming = data.events;
			}
		} catch {
			// ignore — next-up falls back to assignments only
		}
	}

	function dayKeyForEvent(event: ExternalEvent): string | null {
		if (event.allDay) {
			const m = /^(\d{4})-(\d{2})-(\d{2})/.exec(event.start);
			if (!m) return null;
			return keyFor(new Date(Number(m[1]), Number(m[2]) - 1, Number(m[3])));
		}
		const d = new Date(event.start);
		return Number.isNaN(d.getTime()) ? null : keyFor(d);
	}

	function startMs(event: ExternalEvent): number {
		if (event.allDay) {
			const m = /^(\d{4})-(\d{2})-(\d{2})/.exec(event.start);
			if (!m) return Infinity;
			return new Date(Number(m[1]), Number(m[2]) - 1, Number(m[3])).getTime();
		}
		const t = Date.parse(event.start);
		return Number.isNaN(t) ? Infinity : t;
	}

	function whenLabel(event: ExternalEvent): string {
		const ms = startMs(event);
		const today0 = new Date(today.getFullYear(), today.getMonth(), today.getDate()).getTime();
		const dayDiff = Math.round((ms - today0) / 86_400_000);
		const prefix =
			dayDiff === 0
				? 'Today · '
				: dayDiff === 1
					? 'Tomorrow · '
					: dayDiff === -1
						? 'Yesterday · '
						: '';
		if (event.allDay) {
			const m = /^(\d{4})-(\d{2})-(\d{2})/.exec(event.start);
			const dateLabel = m
				? new Date(Number(m[1]), Number(m[2]) - 1, Number(m[3])).toLocaleDateString('en-US', {
						month: 'short',
						day: 'numeric'
					})
				: event.start;
			return `${prefix}${dateLabel} · all day`;
		}
		const d = new Date(event.start);
		if (Number.isNaN(d.getTime())) return event.start;
		const time = d.toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' });
		const dateLabel = d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
		return `${prefix}${dateLabel} · ${time}`;
	}
</script>

{#snippet nextUpCard()}
	<div class="card p-5">
		<h2 class="h-display text-xl text-text-primary">Next up</h2>
		{#if nextUp.length === 0}
			<p class="mt-4 rounded bg-success/10 p-4 text-sm text-success">Nothing on the horizon.</p>
		{:else}
			<div class="mt-4 space-y-2">
				{#each nextUp as item (item.key)}
					{#if item.assignment}
						<a
							href="/assignments/{item.assignment.assignment.id}"
							class="block rounded border border-border bg-surface-900/50 p-3 transition hover:border-border-strong hover:bg-surface-700/50"
						>
							<div class="flex items-center justify-between gap-2">
								<p class="min-w-0 flex-1 truncate text-sm font-bold text-text-primary">
									{item.assignment.assignment.title}
								</p>
								<span class={`chip shrink-0 ${statusTone(item.assignment.status)}`}>
									{item.assignment.status === 'submitted'
										? 'Done'
										: item.assignment.status === 'overdue'
											? 'Overdue'
											: item.assignment.status === 'due-soon'
												? 'Soon'
												: item.assignment.status === 'in-progress'
													? 'In progress'
													: 'Open'}
								</span>
							</div>
							<p
								class="mt-1 text-xs {item.assignment.daysUntilDue < 0
									? 'text-danger'
									: item.assignment.daysUntilDue <= 2
										? 'text-warning'
										: 'text-text-muted'}"
							>
								{item.assignment.dueDateLabel}
								{#if item.assignment.daysUntilDue < 0}· {item.assignment.daysUntilDue === -1
										? 'yesterday'
										: `${-item.assignment.daysUntilDue} days ago`}{:else if item.assignment.daysUntilDue === 0}·
									today{:else if item.assignment.daysUntilDue === 1}· tomorrow{:else}· {item
										.assignment.daysUntilDue} days{/if}
							</p>
						</a>
					{:else if item.event}
						<a
							href={item.event.url || '#'}
							target="_blank"
							rel="noreferrer"
							class="block rounded border border-border bg-surface-900/50 p-3 transition hover:border-border-strong hover:bg-surface-700/50"
						>
							<p class="truncate text-sm font-bold text-text-primary">{item.event.summary}</p>
							<p class="mt-1 text-xs text-text-muted">
								{whenLabel(item.event)} · {item.event.calendarName}
							</p>
						</a>
					{/if}
				{/each}
			</div>
		{/if}
	</div>
{/snippet}

<header class="card p-6 sm:p-8">
	<p class="eyebrow">Deadlines</p>
	<h1 class="h-display mt-2 text-3xl text-text-primary sm:text-4xl">
		Course <span class="serif-italic text-accent">calendar</span>
	</h1>
	<p class="mt-3 max-w-xl text-sm leading-relaxed text-text-secondary sm:text-base">
		Every assignment due date, anchored to your exam date. Export it to any calendar app, or bring
		your own calendar in.
	</p>
</header>

{#if error}
	<section class="card p-6 text-danger">{error}</section>
{:else if loading}
	<div class="grid min-h-64 place-items-center">
		<div class="text-center">
			<span
				class="mx-auto block h-10 w-10 animate-spin rounded-full border-4 border-surface-600 border-t-accent"
			></span>
			<p class="serif-italic mt-4 text-text-secondary">Loading the calendar…</p>
		</div>
	</div>
{:else}
	<div class="grid gap-6 xl:grid-cols-[minmax(0,1fr)_20rem] xl:gap-8">
		<div class="space-y-6 sm:space-y-8">
			<!-- Calendar files: the no-setup path (Proton, Apple, Thunderbird, Outlook). -->
			<section class="card p-5 sm:p-6" id="calendar-files">
				<div class="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
					<div>
						<p class="eyebrow">No setup needed</p>
						<h2 class="h-display mt-1 text-xl text-text-primary">Calendar files (.ics)</h2>
						<p class="mt-1 max-w-lg text-sm leading-relaxed text-text-secondary">
							Download your deadlines as an <code
								class="rounded bg-surface-700 px-1.5 py-0.5 text-xs text-text-primary">.ics</code
							>
							file and import it into Proton Calendar, Apple Calendar, Thunderbird, or Outlook. In Proton:
							<span class="text-text-primary"
								>Settings → All settings → Import/export → Import from ICS</span
							>. Re-importing updates the same events instead of duplicating them.
						</p>
					</div>
					<a class="btn btn-primary shrink-0" href="/api/calendar/export.ics" download
						>Download .ics</a
					>
				</div>

				<div class="mt-5 border-t border-border pt-4">
					<p class="text-sm leading-relaxed text-text-secondary">
						Or bring your own calendar in. Export a <code
							class="rounded bg-surface-700 px-1.5 py-0.5 text-xs text-text-primary">.ics</code
						>
						from Proton (or anywhere) and import it here to see those events beside your deadlines.
					</p>
					<div class="mt-3 flex flex-wrap items-center gap-3">
						<label class="btn btn-ghost cursor-pointer">
							{fileBusy ? 'Working…' : 'Import .ics'}
							<input
								type="file"
								accept="text/calendar,.ics"
								class="hidden"
								disabled={fileBusy}
								onchange={(event) => {
									const file = event.currentTarget.files?.[0];
									if (file) void importFile(file);
									event.currentTarget.value = '';
								}}
							/>
						</label>
						{#if importStatus?.imported}
							<button
								class="btn btn-ghost h-11 px-3 text-xs"
								type="button"
								aria-pressed={showImported}
								onclick={() => (showImported = !showImported)}
							>
								{#if showImported}
									<svg
										viewBox="0 0 24 24"
										class="mr-1.5 inline h-4 w-4 align-[-2px]"
										fill="none"
										stroke="currentColor"
										stroke-width="3"><path d="m5 13 4 4L19 7" /></svg
									>
								{/if}
								Show imported events
							</button>
							<button
								class="touch-target text-sm font-semibold text-danger transition hover:text-danger/70 disabled:opacity-50"
								type="button"
								onclick={clearImport}
								disabled={fileBusy}
							>
								Remove import
							</button>
						{/if}
					</div>
					{#if importStatus?.imported}
						<p class="mt-3 text-xs text-text-muted">
							{importStatus.sourceName} · {importStatus.eventCount} event{importStatus.eventCount ===
							1
								? ''
								: 's'}
							{#if importStatus.importedAt}
								· imported {new Date(importStatus.importedAt).toLocaleDateString('en-US', {
									month: 'short',
									day: 'numeric'
								})}
							{/if}
						</p>
					{/if}
					{#if fileNotice}
						<p
							class="mt-3 rounded-xl border px-3 py-2 text-sm {fileNoticeOk
								? 'border-success/20 bg-success/10 text-success'
								: 'border-danger/20 bg-danger/10 text-danger'}"
							role="status"
							aria-live="polite"
						>
							{fileNotice}
						</p>
					{/if}
				</div>
			</section>

			{#if gcal}
				<section class="card p-5 sm:p-6">
					{#if !gcal.configured}
						<div>
							<h2 class="h-display text-xl text-text-primary">Google Calendar</h2>
							<p class="mt-1 text-sm leading-relaxed text-text-secondary">
								Set <code class="rounded bg-surface-700 px-1.5 py-0.5 text-xs text-text-primary"
									>GOOGLE_CLIENT_ID</code
								>
								and
								<code class="rounded bg-surface-700 px-1.5 py-0.5 text-xs text-text-primary"
									>GOOGLE_CLIENT_SECRET</code
								>
								in
								<code class="rounded bg-surface-700 px-1.5 py-0.5 text-xs text-text-primary"
									>web/.env</code
								>
								to connect (see
								<code class="rounded bg-surface-700 px-1.5 py-0.5 text-xs text-text-primary"
									>web/GOOGLE-CALENDAR.md</code
								>).
							</p>
						</div>
					{:else if !gcal.connected}
						<div class="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
							<div>
								<h2 class="h-display text-xl text-text-primary">Google Calendar</h2>
								<p class="mt-1 text-sm leading-relaxed text-text-secondary">
									See your real events next to course deadlines, and push deadlines to your phone
									for reminders.
								</p>
							</div>
							<button
								class="btn btn-primary shrink-0"
								type="button"
								onclick={connect}
								disabled={gcalBusy}
							>
								{gcalBusy ? 'Connecting…' : 'Connect Google Calendar'}
							</button>
						</div>
					{:else}
						<div class="flex flex-col gap-4">
							<div class="flex flex-wrap items-center justify-between gap-3">
								<div class="flex items-center gap-3">
									<span
										class="grid h-11 w-11 shrink-0 place-items-center rounded bg-accent-secondary/10 text-accent-secondary"
										><svg
											viewBox="0 0 24 24"
											class="h-5 w-5"
											fill="none"
											stroke="currentColor"
											stroke-width="1.8"
											><rect x="3" y="4" width="18" height="18" rx="2" /><path
												d="M16 2v4M8 2v4M3 10h18"
											/></svg
										></span
									>
									<div>
										<h2 class="h-display text-xl text-text-primary">Google Calendar</h2>
										<p class="text-sm text-text-secondary">Connected as {gcal.email}</p>
									</div>
								</div>
								<button
									class="touch-target text-sm font-semibold text-danger transition hover:text-danger/70 disabled:opacity-50"
									type="button"
									onclick={disconnect}
									disabled={gcalBusy}
								>
									Disconnect
								</button>
							</div>
							<div class="flex flex-wrap items-center gap-3 border-t border-border pt-4">
								<button
									class="btn btn-ghost h-11 px-3 text-xs"
									type="button"
									aria-pressed={showGoogle}
									onclick={() => (showGoogle = !showGoogle)}
								>
									{#if showGoogle}
										<svg
											viewBox="0 0 24 24"
											class="mr-1.5 inline h-4 w-4 align-[-2px]"
											fill="none"
											stroke="currentColor"
											stroke-width="3"><path d="m5 13 4 4L19 7" /></svg
										>
									{/if}
									Show Google events
								</button>
								<div class="flex flex-wrap items-center gap-3 text-sm text-text-secondary">
									<span>
										{gcal.syncedCount} deadline{gcal.syncedCount === 1 ? '' : 's'} pushed
										{#if gcal.lastSyncAt}
											· synced {new Date(gcal.lastSyncAt).toLocaleDateString('en-US', {
												month: 'short',
												day: 'numeric'
											})}
										{/if}
									</span>
									<button
										class="btn btn-primary h-11 px-4 text-xs"
										type="button"
										onclick={() => syncDeadlines()}
										disabled={gcalBusy}
									>
										{gcalBusy ? 'Syncing…' : 'Sync now'}
									</button>
								</div>
							</div>
						</div>
					{/if}
					{#if gcalNotice}
						<p
							class="mt-4 rounded-xl border border-info/20 bg-info/10 px-3 py-2 text-sm text-info"
							role="status"
							aria-live="polite"
						>
							{gcalNotice}
						</p>
					{/if}
				</section>
			{/if}

			<div class="grid gap-6">
				<section class="card p-3 sm:p-6">
					<div class="mb-4 flex items-center justify-between">
						<h2 class="h-display text-xl text-text-primary">{monthLabel}</h2>
						<div class="flex gap-2">
							<button
								class="grid h-11 w-11 place-items-center rounded border border-border text-text-secondary transition hover:border-border-strong hover:bg-surface-700 hover:text-text-primary"
								type="button"
								aria-label="Previous month"
								onclick={() => shiftMonth(-1)}
							>
								<svg
									viewBox="0 0 24 24"
									class="h-4 w-4"
									fill="none"
									stroke="currentColor"
									stroke-width="2"><path d="m15 18-6-6 6-6" /></svg
								>
							</button>
							<button
								class="grid h-11 w-11 place-items-center rounded border border-border text-text-secondary transition hover:border-border-strong hover:bg-surface-700 hover:text-text-primary"
								type="button"
								aria-label="Next month"
								onclick={() => shiftMonth(1)}
							>
								<svg
									viewBox="0 0 24 24"
									class="h-4 w-4"
									fill="none"
									stroke="currentColor"
									stroke-width="2"><path d="m9 6 6 6-6 6" /></svg
								>
							</button>
						</div>
					</div>
					<div class="overflow-x-auto">
						<div class="min-w-[22rem]">
							<div
								class="grid grid-cols-7 gap-1 text-center text-[11px] font-semibold uppercase tracking-[0.12em] text-text-muted"
							>
								{#each ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'] as day (day)}<div
										class="py-2"
									>
										{day}
									</div>{/each}
							</div>
							<div class="grid grid-cols-7 gap-1">
								{#each Array(firstWeekday) as _}<div></div>{/each}
								{#each Array(daysInMonth) as _, index (index)}
									{@const day = new Date(viewMonth.getFullYear(), viewMonth.getMonth(), index + 1)}
									{@const items = byDay[keyFor(day)] ?? []}
									{@const gitems = externalByDay[keyFor(day)] ?? []}
									<button
										class="flex min-h-14 flex-col items-start rounded-lg border p-1.5 text-left transition sm:min-h-16 {isToday(
											day
										)
											? 'border-accent/70 bg-accent/10 ring-2 ring-accent/30'
											: 'border-border bg-surface-900/50 hover:border-border-strong hover:bg-surface-700/50'}"
										type="button"
										onclick={() =>
											(selectedDay =
												selectedDay && keyFor(selectedDay) === keyFor(day) ? null : day)}
									>
										<span
											class="text-xs font-bold {isToday(day)
												? 'text-accent'
												: inPast(day)
													? 'text-text-subtle'
													: 'text-text-secondary'}">{index + 1}</span
										>
										{#if items.length || gitems.length}
											<span class="mt-auto flex flex-wrap items-center gap-0.5">
												{#each items as item (item.assignment.id)}
													<span
														class="block h-1.5 w-1.5 rounded-full {item.status === 'submitted'
															? 'bg-success'
															: item.status === 'overdue'
																? 'bg-danger'
																: item.status === 'due-soon'
																	? 'bg-warning'
																	: item.status === 'in-progress'
																		? 'bg-info'
																		: 'bg-surface-600'}"
														title={item.assignment.title}
													></span>
												{/each}
												{#each gitems.slice(0, 3) as event (event.id)}
													<span
														class="block h-1.5 w-1.5 rounded-full bg-accent-secondary"
														title={`${event.summary} (${event.calendarName})`}
													></span>
												{/each}
												{#if gitems.length > 3}
													<span class="text-[9px] font-semibold leading-3 text-text-muted"
														>+{gitems.length - 3}</span
													>
												{/if}
											</span>
										{/if}
									</button>
								{/each}
							</div>
						</div>
					</div>
					<div class="mt-3 flex flex-wrap items-center gap-4 text-xs text-text-muted">
						<span class="flex items-center gap-1.5"
							><span class="h-2 w-2 rounded-full bg-accent"></span> course deadline</span
						>
						{#if hasExternal}
							<span class="flex items-center gap-1.5"
								><span class="h-2 w-2 rounded-full bg-accent-secondary"></span> your calendar</span
							>
						{/if}
					</div>
					{#if selectedDay}
						{@const items = byDay[keyFor(selectedDay)] ?? []}
						{@const gitems = externalByDay[keyFor(selectedDay)] ?? []}
						<div class="mt-4 rounded-xl border border-border bg-surface-900/50 p-4">
							<p class="mb-3 text-sm font-bold text-text-primary">
								{keyFor(selectedDay)}
								{#if isToday(selectedDay)}<span class="ml-2 text-xs font-semibold text-accent"
										>Today</span
									>{/if}
							</p>
							{#if items.length === 0 && gitems.length === 0}
								<p class="text-sm text-text-muted">No assignments or events this day.</p>
							{:else}
								{#if items.length}
									<p class="mb-2 text-xs font-bold uppercase tracking-wide text-text-muted">
										Course deadlines
									</p>
									<div class="space-y-2">
										{#each items as item (item.assignment.id)}
											<a
												href="/assignments/{item.assignment.id}"
												class="flex items-center justify-between gap-3 rounded-lg bg-surface-800 p-3 transition hover:bg-surface-700"
											>
												<span class="text-sm font-bold text-text-primary"
													>{item.assignment.title}</span
												>
												<StatusChip status={item.status} />
											</a>
										{/each}
									</div>
								{/if}
								{#if gitems.length}
									<p class="mb-2 mt-4 text-xs font-bold uppercase tracking-wide text-text-muted">
										Your calendar
									</p>
									<div class="space-y-2">
										{#each gitems as event (event.id)}
											<a
												href={event.url || '#'}
												target="_blank"
												rel="noreferrer"
												class="flex items-center justify-between gap-3 rounded-lg bg-surface-800 p-3 transition hover:bg-surface-700"
											>
												<div class="min-w-0">
													<p class="truncate text-sm font-bold text-text-primary">
														{event.summary}
													</p>
													<p class="mt-0.5 text-xs text-text-muted">
														{event.allDay ? 'All day' : event.startTime} · {event.calendarName}
													</p>
												</div>
												<svg
													viewBox="0 0 24 24"
													class="h-4 w-4 shrink-0 text-text-muted"
													fill="none"
													stroke="currentColor"
													stroke-width="2"><path d="M7 17 17 7M7 7h10v10" /></svg
												>
											</a>
										{/each}
									</div>
								{/if}
							{/if}
						</div>
					{/if}
				</section>
			</div>
		</div>

		<ContextRail title="Coming up">
			{@render nextUpCard()}

			<nav class="card p-5" aria-label="Related">
				<p class="text-xs font-semibold uppercase tracking-[0.12em] text-text-muted">Related</p>
				<div class="mt-3 space-y-1">
					<a
						href="/syllabus"
						class="flex min-h-11 items-center rounded px-2 text-sm text-text-secondary transition hover:bg-surface-700 hover:text-text-primary"
						>Full schedule</a
					>
					<a
						href="/admin"
						class="flex min-h-11 items-center rounded px-2 text-sm text-text-secondary transition hover:bg-surface-700 hover:text-text-primary"
						>Exam date &amp; overrides</a
					>
				</div>
			</nav>
		</ContextRail>
	</div>
{/if}
