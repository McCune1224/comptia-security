<script lang="ts">
	import { getPercentColor, getBarColor, DOMAIN_NAMES } from '$lib/utils';

	type DomainProgress = Record<number, { attempted: number; correct: number; percentage: number; lastReviewed: string | null }>;
	type RecentSession = { id: string; date: string; type: string; score: string; percentage: number };
	type WeakTopic = { domain: number; category: string; correct: number; total: number; percentage: number };

	let progress = $state<DomainProgress>({});
	let recentSessions = $state<RecentSession[]>([]);
	let weakTopics = $state<WeakTopic[]>([]);
	let loading = $state(true);
	let filterDomain = $state<number | null>(null);
	let syncing = $state(false);
	let syncMessage = $state('');

	const DOMAIN_ICONS: Record<number, string> = {
		1: 'D1', 2: 'D2', 3: 'D3', 4: 'D4', 5: 'D5',
	};

	$effect(() => { loadData(); });

	async function loadData() {
		loading = true;
		try {
			const res = await fetch('/api/progress');
			if (res.ok) {
				const data = await res.json();
				progress = data.progress || {};
				recentSessions = data.recentSessions || [];
				weakTopics = data.weakTopics || [];
			}
		} catch {} finally { loading = false; }
	}

	let filteredTopics = $derived(filterDomain ? weakTopics.filter(t => t.domain === filterDomain) : weakTopics);
	let totalAttempted = $derived(Object.values(progress).reduce((s, p) => s + (p?.attempted ?? 0), 0));
	let totalCorrect = $derived(Object.values(progress).reduce((s, p) => s + (p?.correct ?? 0), 0));
	let overallPct = $derived(totalAttempted > 0 ? Math.round((totalCorrect / totalAttempted) * 100) : 0);

	function formatDate(iso: string): string {
		return new Date(iso).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
	}

	async function syncToObsidian() {
		syncing = true; syncMessage = '';
		try {
			const res = await fetch('/api/sync', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({}) });
			const data = await res.json();
			syncMessage = data.messages?.join('. ') || 'Synced.';
		} catch { syncMessage = 'Sync failed.'; } finally { syncing = false; }
	}
</script>

{#if loading}
	<div class="flex justify-center py-32">
		<div class="w-10 h-10 border-3 border-cyan-500/20 border-t-cyan-400 rounded-full animate-spin"></div>
	</div>
{:else}
	<div class="space-y-10">
		<div class="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
			<div>
				<h1 class="text-2xl font-bold text-white">Progress</h1>
				<p class="text-sm text-slate-400 mt-1">Track your study across all five Security+ domains.</p>
			</div>
			<button onclick={syncToObsidian} disabled={syncing}
				class="px-5 py-2.5 bg-slate-800 hover:bg-slate-700 rounded-xl text-sm text-slate-300 transition border border-slate-700 disabled:opacity-50">
				{syncing ? 'Syncing...' : 'Sync to Obsidian'}
			</button>
		</div>

		{#if syncMessage}
			<div class="bg-cyan-500/5 border border-cyan-500/20 rounded-xl px-4 py-3 text-sm text-cyan-300">{syncMessage}</div>
		{/if}

		<!-- Stats -->
		<div class="grid grid-cols-3 gap-4">
			<div class="glass rounded-2xl p-5 text-center">
				<div class="text-xs text-slate-500 mb-1">Attempted</div>
				<div class="text-3xl font-bold text-white">{totalAttempted}</div>
			</div>
			<div class="glass rounded-2xl p-5 text-center">
				<div class="text-xs text-slate-500 mb-1">Correct</div>
				<div class="text-3xl font-bold text-green-400">{totalCorrect}</div>
			</div>
			<div class="glass rounded-2xl p-5 text-center">
				<div class="text-xs text-slate-500 mb-1">Overall</div>
				<div class="text-3xl font-bold {getPercentColor(overallPct)}">{overallPct}%</div>
			</div>
		</div>

		<!-- Domain Breakdown -->
		<div>
			<h2 class="text-lg font-bold text-white mb-4">Domain Breakdown</h2>
			<div class="space-y-3">
				{#each [1, 2, 3, 4, 5] as domain (domain)}
					{@const p = progress[domain]}
					{@const pct = p?.percentage ?? 0}
					{@const attempted = p?.attempted ?? 0}
					{@const correct = p?.correct ?? 0}
					<div class="glass rounded-xl p-4 hover:border-slate-600/50 transition">
						<div class="flex items-center justify-between mb-3">
							<div class="flex items-center gap-3">
								<span class="text-xl">{DOMAIN_ICONS[domain]}</span>
								<div>
									<div class="text-sm font-semibold text-white">{DOMAIN_NAMES[domain]}</div>
									<div class="text-xs text-slate-500">Domain {domain}{p?.lastReviewed ? ` · last reviewed ${formatDate(p.lastReviewed)}` : ''}</div>
								</div>
							</div>
							<div class="text-right">
								<div class="text-lg font-bold font-mono {getPercentColor(pct)}">{pct}%</div>
								<div class="text-xs text-slate-500">{correct}/{attempted} correct</div>
							</div>
						</div>
						<div class="h-2 bg-slate-700/50 rounded-full overflow-hidden">
							<div class="h-full {getBarColor(pct)} rounded-full animate-progress" style="width: {pct}%"></div>
						</div>
					</div>
				{/each}
			</div>
		</div>

		<!-- Weak Topics -->
		<div>
			<div class="flex items-center justify-between mb-4">
				<h2 class="text-lg font-bold text-white">Weak Topics</h2>
				<select bind:value={filterDomain} class="bg-slate-800 border border-slate-600 rounded-lg px-3 py-1.5 text-xs text-slate-300 focus:border-cyan-500 focus:outline-none">
					<option value={null}>All Domains</option>
					{#each [1, 2, 3, 4, 5] as d (d)}<option value={d}>Domain {d}</option>{/each}
				</select>
			</div>
			{#if filteredTopics.length === 0}
				<div class="glass rounded-xl p-8 text-center">
					<div class="text-2xl mb-2">💪</div>
					<p class="text-sm text-slate-400">No weak topics detected</p>
					<p class="text-xs text-slate-600 mt-1">Keep up the great work!</p>
				</div>
			{:else}
				<div class="glass rounded-xl overflow-hidden">
					<table class="w-full text-sm">
						<thead>
							<tr class="border-b border-slate-700/50">
								<th class="text-left px-5 py-3 text-xs text-slate-500 font-medium">Domain</th>
								<th class="text-left px-5 py-3 text-xs text-slate-500 font-medium">Topic</th>
								<th class="text-right px-5 py-3 text-xs text-slate-500 font-medium">Correct</th>
								<th class="text-right px-5 py-3 text-xs text-slate-500 font-medium">%</th>
							</tr>
						</thead>
						<tbody>
							{#each filteredTopics as t (`${t.domain}-${t.category}`)}
								<tr class="border-b border-slate-800/50 hover:bg-white/[0.02] transition">
									<td class="px-5 py-3 text-slate-400">D{t.domain}</td>
									<td class="px-5 py-3 text-slate-300">{t.category}</td>
									<td class="px-5 py-3 text-right text-slate-400">{t.correct}/{t.total}</td>
									<td class="px-5 py-3 text-right font-mono text-red-400">{t.percentage}%</td>
								</tr>
							{/each}
						</tbody>
					</table>
				</div>
			{/if}
		</div>

		<!-- Recent Sessions -->
		<div>
			<h2 class="text-lg font-bold text-white mb-4">Recent Sessions</h2>
			{#if recentSessions.length === 0}
				<div class="glass rounded-xl p-8 text-center">
					<div class="text-2xl mb-2">🚀</div>
					<p class="text-sm text-slate-400">No completed sessions</p>
					<p class="text-xs text-slate-600 mt-1">Complete a quiz to see your history.</p>
				</div>
			{:else}
				<div class="glass rounded-xl overflow-hidden">
					<table class="w-full text-sm">
						<thead>
							<tr class="border-b border-slate-700/50">
								<th class="text-left px-5 py-3 text-xs text-slate-500 font-medium">Date</th>
								<th class="text-left px-5 py-3 text-xs text-slate-500 font-medium">Type</th>
								<th class="text-right px-5 py-3 text-xs text-slate-500 font-medium">Score</th>
								<th class="text-right px-5 py-3 text-xs text-slate-500 font-medium">%</th>
							</tr>
						</thead>
						<tbody>
							{#each recentSessions as s (s.id)}
								<tr class="border-b border-slate-800/50 hover:bg-white/[0.02] transition">
									<td class="px-5 py-3 text-slate-400 text-xs">{formatDate(s.date)}</td>
									<td class="px-5 py-3 text-slate-300 capitalize">{s.type}</td>
									<td class="px-5 py-3 text-right text-slate-400">{s.score}</td>
									<td class="px-5 py-3 text-right font-mono font-semibold {getPercentColor(s.percentage)}">{s.percentage}%</td>
								</tr>
							{/each}
						</tbody>
					</table>
				</div>
			{/if}
		</div>
	</div>
{/if}
