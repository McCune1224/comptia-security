<script lang="ts">
	import { onMount } from 'svelte';
	import StatusChip from '$lib/components/StatusChip.svelte';

	type AssignmentView = {
		assignment: { id: string; title: string; kind: string };
		dueDateLabel: string;
		daysUntilDue: number;
		status: 'open' | 'due-soon' | 'overdue' | 'in-progress' | 'submitted';
	};

	type GoogleEvent = {
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

	let assignments = $state<AssignmentView[]>([]);
	let error = $state('');
	let today = $state(new Date());
	let viewMonth = $state(new Date());
	let selectedDay = $state<Date | null>(null);

	let gcal = $state<GcalStatus | null>(null);
	let gcalEvents = $state<GoogleEvent[]>([]);
	let gcalUpcoming = $state<GoogleEvent[]>([]);
	let showGoogle = $state(true);
	let gcalBusy = $state(false);
	let gcalNotice = $state('');

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

	const gcalByDay = $derived(
		gcalEvents.reduce<Record<string, GoogleEvent[]>>((map, event) => {
			const key = dayKeyForEvent(event);
			if (key) (map[key] ??= []).push(event);
			return map;
		}, {})
	);

	const nextUp = $derived.by(() => {
		type Row = { key: string; ms: number; assignment?: AssignmentView; event?: GoogleEvent };
		const rows: Row[] = [];
		const today0 = new Date(today.getFullYear(), today.getMonth(), today.getDate()).getTime();
		for (const item of assignments.filter((a) => a.status !== 'submitted')) {
			rows.push({ key: `a:${item.assignment.id}`, ms: today0 + item.daysUntilDue * 86_400_000, assignment: item });
		}
		for (const event of gcalUpcoming) {
			const ms = startMs(event);
			if (ms >= today0) rows.push({ key: `g:${event.id}`, ms, event });
		}
		return rows.sort((a, b) => a.ms - b.ms).slice(0, 8);
	});

	onMount(async () => {
		const response = await fetch('/api/course/syllabus');
		if (response.ok) {
			const data = await response.json();
			assignments = data.modules.flatMap((m: { assignments: AssignmentView[] }) => m.assignments);
		} else error = 'Unable to load the calendar.';

		await loadStatus();

		const params = new URLSearchParams(window.location.search);
		if (params.get('connected') === '1' && gcal?.connected) {
			await syncDeadlines(true);
		} else if (params.get('error')) {
			gcalNotice =
				params.get('error') === 'state'
					? 'Google sign-in did not complete — please try again.'
					: 'Google sign-in was cancelled or failed.';
		}
		if (params.get('connected') || params.get('error')) window.history.replaceState({}, '', '/calendar');

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
		if (status === 'due-soon') return 'bg-accent-warm/15 text-accent-warm';
		if (status === 'in-progress') return 'bg-info/15 text-info';
		return 'bg-surface-700 text-text-secondary';
	}

	function shiftMonth(delta: number) {
		viewMonth = new Date(viewMonth.getFullYear(), viewMonth.getMonth() + delta, 1);
		selectedDay = null;
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
		if (!confirm('Disconnect Google Calendar? Events already pushed to your calendar stay put.')) return;
		gcalBusy = true;
		try {
			await fetch('/api/calendar/google/disconnect', { method: 'POST' });
			if (gcal) gcal = { ...gcal, connected: false, email: null, calendarId: null, syncedCount: 0, lastSyncAt: null };
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
			const response = await fetch(`/api/calendar/google/events?start=${toKey(month)}&end=${toKey(endDate)}`);
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
			const response = await fetch(`/api/calendar/google/events?start=${toKey(today0)}&end=${toKey(horizon)}`);
			if (response.ok) {
				const data = await response.json();
				gcalUpcoming = data.events;
			}
		} catch {
			// ignore — next-up falls back to assignments only
		}
	}

	function dayKeyForEvent(event: GoogleEvent): string | null {
		if (event.allDay) {
			const m = /^(\d{4})-(\d{2})-(\d{2})/.exec(event.start);
			if (!m) return null;
			return keyFor(new Date(Number(m[1]), Number(m[2]) - 1, Number(m[3])));
		}
		const d = new Date(event.start);
		return Number.isNaN(d.getTime()) ? null : keyFor(d);
	}

	function startMs(event: GoogleEvent): number {
		if (event.allDay) {
			const m = /^(\d{4})-(\d{2})-(\d{2})/.exec(event.start);
			if (!m) return Infinity;
			return new Date(Number(m[1]), Number(m[2]) - 1, Number(m[3])).getTime();
		}
		const t = Date.parse(event.start);
		return Number.isNaN(t) ? Infinity : t;
	}

	function whenLabel(event: GoogleEvent): string {
		const ms = startMs(event);
		const today0 = new Date(today.getFullYear(), today.getMonth(), today.getDate()).getTime();
		const dayDiff = Math.round((ms - today0) / 86_400_000);
		const prefix =
			dayDiff === 0 ? 'Today · ' : dayDiff === 1 ? 'Tomorrow · ' : dayDiff === -1 ? 'Yesterday · ' : '';
		if (event.allDay) {
			const m = /^(\d{4})-(\d{2})-(\d{2})/.exec(event.start);
			const dateLabel = m
				? new Date(Number(m[1]), Number(m[2]) - 1, Number(m[3])).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
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

<div class="mx-auto max-w-5xl space-y-8">
	<div>
		<p class="text-sm font-semibold uppercase tracking-[0.16em] text-accent">Deadlines</p>
		<h1 class="mt-1 text-2xl font-bold text-text-primary sm:text-3xl">Course calendar</h1>
		<p class="mt-2 text-text-secondary">
			Every assignment due date, anchored to your exam date — plus your Google events.
		</p>
	</div>

	{#if error}
		<section class="glass rounded-2xl p-6 text-danger">{error}</section>
	{:else}
		{#if gcal}
			<section class="glass rounded-2xl p-5 sm:p-6">
				{#if !gcal.configured}
					<div>
						<h2 class="text-lg font-bold text-text-primary">Google Calendar</h2>
						<p class="mt-1 text-sm text-text-secondary">
							Set <code class="rounded bg-surface-700 px-1.5 py-0.5 text-xs text-text-primary">GOOGLE_CLIENT_ID</code> and
							<code class="rounded bg-surface-700 px-1.5 py-0.5 text-xs text-text-primary">GOOGLE_CLIENT_SECRET</code> in
							<code class="rounded bg-surface-700 px-1.5 py-0.5 text-xs text-text-primary">web/.env</code> to connect
							(see <code class="rounded bg-surface-700 px-1.5 py-0.5 text-xs text-text-primary">web/GOOGLE-CALENDAR.md</code>).
						</p>
					</div>
				{:else if !gcal.connected}
					<div class="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
						<div>
							<h2 class="text-lg font-bold text-text-primary">Google Calendar</h2>
							<p class="mt-1 text-sm text-text-secondary">
								See your real events next to course deadlines, and push deadlines to your phone for reminders.
							</p>
						</div>
						<button
							class="inline-flex h-11 shrink-0 items-center gap-2 rounded-xl bg-accent px-5 text-sm font-semibold text-white transition hover:brightness-110 active:scale-[0.98] disabled:opacity-50"
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
								<span class="grid h-10 w-10 place-items-center rounded-xl bg-accent/10 text-lg">📅</span>
								<div>
									<h2 class="text-lg font-bold text-text-primary">Google Calendar</h2>
									<p class="text-sm text-text-secondary">Connected as {gcal.email}</p>
								</div>
							</div>
							<button
								class="text-sm font-medium text-danger transition hover:text-danger/70 disabled:opacity-50"
								type="button"
								onclick={disconnect}
								disabled={gcalBusy}
							>
								Disconnect
							</button>
						</div>
						<div class="flex flex-wrap items-center gap-3 border-t border-border pt-4">
							<button
								class="rounded-xl border px-3 py-2 text-sm font-medium transition {showGoogle
									? 'border-accent/60 bg-accent/10 text-accent'
									: 'border-border text-text-secondary hover:border-border-strong'}"
								type="button"
								aria-pressed={showGoogle}
								onclick={() => (showGoogle = !showGoogle)}
							>
								{showGoogle ? '✓ ' : ''}Show Google events
							</button>
							<div class="flex flex-wrap items-center gap-3 text-sm text-text-secondary">
								<span>
									{gcal.syncedCount} deadline{gcal.syncedCount === 1 ? '' : 's'} pushed
									{#if gcal.lastSyncAt}
										· synced {new Date(gcal.lastSyncAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
									{/if}
								</span>
								<button
									class="inline-flex h-10 items-center gap-2 rounded-xl bg-accent px-4 text-sm font-semibold text-white transition hover:brightness-110 active:scale-[0.98] disabled:opacity-50"
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
					<p class="mt-4 rounded-xl bg-info/10 px-3 py-2 text-sm text-info">{gcalNotice}</p>
				{/if}
			</section>
		{/if}

		<div class="grid gap-6 lg:grid-cols-3">
			<section class="glass rounded-2xl p-5 sm:p-6 lg:col-span-2">
				<div class="mb-4 flex items-center justify-between">
					<h2 class="text-lg font-bold text-text-primary">{monthLabel}</h2>
					<div class="flex gap-2">
						<button
							class="grid h-9 w-9 place-items-center rounded-xl border border-border text-text-secondary transition hover:border-border-strong hover:text-text-primary"
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
							class="grid h-9 w-9 place-items-center rounded-xl border border-border text-text-secondary transition hover:border-border-strong hover:text-text-primary"
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
				<div
					class="grid grid-cols-7 gap-1 text-center text-xs font-semibold uppercase tracking-wide text-text-muted"
				>
					{#each ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'] as day (day)}<div class="py-2">
							{day}
						</div>{/each}
				</div>
				<div class="grid grid-cols-7 gap-1">
					{#each Array(firstWeekday) as _}<div></div>{/each}
					{#each Array(daysInMonth) as _, index (index)}
						{@const day = new Date(viewMonth.getFullYear(), viewMonth.getMonth(), index + 1)}
						{@const items = byDay[keyFor(day)] ?? []}
						{@const gitems = gcal?.connected && showGoogle ? (gcalByDay[keyFor(day)] ?? []) : []}
						<button
							class="min-h-16 rounded-xl border p-1.5 text-left transition {isToday(day)
								? 'border-accent/60 bg-accent/10'
								: 'border-border bg-surface-800/40 hover:bg-surface-700/60'}"
							type="button"
							onclick={() =>
								(selectedDay = selectedDay && keyFor(selectedDay) === keyFor(day) ? null : day)}
						>
							<span
								class="text-xs font-semibold {isToday(day)
									? 'text-accent'
									: inPast(day)
										? 'text-text-subtle'
										: 'text-text-secondary'}">{index + 1}</span
							>
							{#if items.length || gitems.length}
								<span class="mt-1 flex flex-wrap items-center gap-0.5">
									{#each items as item (item.assignment.id)}
										<span
											class="block h-1.5 w-1.5 rounded-full {item.status === 'submitted'
												? 'bg-success'
												: item.status === 'overdue'
													? 'bg-danger'
													: item.status === 'due-soon'
														? 'bg-accent-warm'
														: item.status === 'in-progress'
															? 'bg-info'
															: 'bg-surface-600'}"
											title={item.assignment.title}
										></span>
									{/each}
									{#each gitems.slice(0, 3) as event (event.id)}
										<span
											class="block h-1.5 w-1.5 rounded-full bg-accent-secondary"
											title={`${event.summary} (Google)`}
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
				<div class="mt-3 flex flex-wrap items-center gap-4 text-xs text-text-muted">
					<span class="flex items-center gap-1.5"
						><span class="h-2 w-2 rounded-full bg-accent"></span> course deadline</span
					>
					{#if gcal?.connected}
						<span class="flex items-center gap-1.5"
							><span class="h-2 w-2 rounded-full bg-accent-secondary"></span> Google event</span
						>
					{/if}
				</div>
				{#if selectedDay}
					{@const items = byDay[keyFor(selectedDay)] ?? []}
					{@const gitems = gcal?.connected && showGoogle ? (gcalByDay[keyFor(selectedDay)] ?? []) : []}
					<div class="mt-4 rounded-xl border border-border bg-surface-800/60 p-4">
						<p class="mb-3 text-sm font-bold text-text-primary">
							{keyFor(selectedDay)}
							{#if isToday(selectedDay)}<span class="ml-2 text-xs font-medium text-accent"
									>Today</span
								>{/if}
						</p>
						{#if items.length === 0 && gitems.length === 0}
							<p class="text-sm text-text-muted">No assignments or events this day.</p>
						{:else}
							{#if items.length}
								<p class="mb-2 text-xs font-bold uppercase tracking-wide text-text-muted"
									>Course deadlines</p
								>
								<div class="space-y-2">
									{#each items as item (item.assignment.id)}
										<a
											href="/assignments/{item.assignment.id}"
											class="flex items-center justify-between gap-3 rounded-lg bg-surface-700/50 p-2.5 transition hover:bg-surface-700/80"
										>
											<span class="text-sm font-medium text-text-primary"
												>{item.assignment.title}</span
											>
											<StatusChip status={item.status} />
										</a>
									{/each}
								</div>
							{/if}
							{#if gitems.length}
								<p class="mb-2 mt-4 text-xs font-bold uppercase tracking-wide text-text-muted"
									>Google events</p
								>
								<div class="space-y-2">
									{#each gitems as event (event.id)}
										<a
											href={event.url || '#'}
											target="_blank"
											rel="noreferrer"
											class="flex items-center justify-between gap-3 rounded-lg bg-surface-700/50 p-2.5 transition hover:bg-surface-700/80"
										>
											<div class="min-w-0">
												<p class="truncate text-sm font-medium text-text-primary"
													>{event.summary}</p
												>
												<p class="mt-0.5 text-xs text-text-muted"
													>{event.allDay ? 'All day' : event.startTime} · {event.calendarName}</p
												>
											</div>
											<svg
												viewBox="0 0 24 24"
												class="h-4 w-4 shrink-0 text-text-muted"
												fill="none"
												stroke="currentColor"
												stroke-width="2"
											><path d="M7 17 17 7M7 7h10v10" /></svg
											>
										</a>
									{/each}
								</div>
							{/if}
						{/if}
					</div>
				{/if}
			</section>

			<section class="glass h-fit rounded-2xl p-5 sm:p-6">
				<h2 class="text-lg font-bold text-text-primary">Next up</h2>
				{#if nextUp.length === 0}
					<p class="mt-4 rounded-xl bg-success/10 p-4 text-sm text-success">
						Nothing on the horizon. 🎉
					</p>
				{:else}
					<div class="mt-4 space-y-2">
						{#each nextUp as item (item.key)}
							{#if item.assignment}
								<a
									href="/assignments/{item.assignment.assignment.id}"
									class="flex items-center justify-between gap-2 rounded-xl bg-surface-700/50 p-3 transition hover:bg-surface-700/80"
								>
									<div class="min-w-0">
										<p class="truncate text-sm font-medium text-text-primary">
											{item.assignment.assignment.title}
										</p>
										<p
											class="mt-0.5 text-xs {item.assignment.daysUntilDue < 0
												? 'text-danger'
												: item.assignment.daysUntilDue <= 2
													? 'text-accent-warm'
													: 'text-text-muted'}"
										>
											{item.assignment.dueDateLabel}
											{#if item.assignment.daysUntilDue < 0}· {item.assignment.daysUntilDue === -1
													? 'yesterday'
													: `${-item.assignment.daysUntilDue} days ago`}{:else if item.assignment.daysUntilDue === 0}· today{:else if item.assignment.daysUntilDue === 1}·
												tomorrow{:else}· {item.assignment.daysUntilDue} days{/if}
										</p>
									</div>
									<span
										class={`shrink-0 rounded-full px-2 py-0.5 text-[10px] font-semibold ${statusTone(item.assignment.status)}`}
									>
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
								</a>
							{:else if item.event}
								<a
									href={item.event.url || '#'}
									target="_blank"
									rel="noreferrer"
									class="flex items-center justify-between gap-2 rounded-xl bg-surface-700/50 p-3 transition hover:bg-surface-700/80"
								>
									<div class="min-w-0">
										<p class="truncate text-sm font-medium text-text-primary"
											>{item.event.summary}</p
										>
										<p class="mt-0.5 text-xs text-text-muted"
											>{whenLabel(item.event)} · {item.event.calendarName}</p
										>
									</div>
									<span
										class="shrink-0 rounded-full bg-accent-secondary/15 px-2 py-0.5 text-[10px] font-semibold text-accent-secondary"
										>Google</span
									>
								</a>
							{/if}
						{/each}
					</div>
				{/if}
			</section>
		</div>
	{/if}
</div>
