<script lang="ts">
	import { goto } from '$app/navigation';
	import { getPercentColor, getBarColor } from '$lib/utils';

	type DomainProgress = Record<number, { attempted: number; correct: number; percentage: number; lastReviewed: string | null }>;
	type RecentSession = { id: string; date: string; type: string; score: string; percentage: number };
	type WeakTopic = { domain: number; category: string; correct: number; total: number; percentage: number };

	let progress = $state<DomainProgress>({});
	let recentSessions = $state<RecentSession[]>([]);
	let weakTopics = $state<WeakTopic[]>([]);
	let loading = $state(true);

	const DOMAIN_SLUGS: Record<number, string> = {
		1: 'General Concepts',
		2: 'Threats & Mitigations',
		3: 'Architecture',
		4: 'Operations',
		5: 'Program Management',
	};

	const DOMAIN_ICONS: Record<number, string> = {
		1: 'D1',
		2: 'D2',
		3: 'D3',
		4: 'D4',
		5: 'D5',
	};

	$effect(() => {
		loadProgress();
	});

	async function loadProgress() {
		try {
			const res = await fetch('/api/progress');
			if (res.ok) {
				const data = await res.json();
				progress = data.progress || {};
				recentSessions = data.recentSessions || [];
				weakTopics = data.weakTopics || [];
			}
		} catch {
			// no data yet
		} finally {
			loading = false;
		}
	}

	function getStatusLabel(pct: number, attempted: number): string {
		if (attempted === 0) return 'Not Started';
		if (pct >= 85) return 'Mastering';
		if (pct >= 60) return 'Reviewing';
		return 'Needs Work';
	}

	function getStatusBadge(pct: number, attempted: number): string {
		if (attempted === 0) return 'bg-slate-700/50 text-slate-500';
		if (pct >= 85) return 'bg-green-500/10 text-green-400 border-green-500/30';
		if (pct >= 60) return 'bg-yellow-500/10 text-yellow-400 border-yellow-500/30';
		return 'bg-red-500/10 text-red-400 border-red-500/30';
	}

	function startQuickQuiz(type: string, count: number, mode: string = 'practice') {
		const params = new URLSearchParams({ type, count: String(count), mode });
		if (type === 'pbq') goto(`/pbq?${params}`);
		else if (type === 'scenario') goto(`/scenarios?${params}`);
		else goto(`/quiz?${params}`);
	}

	function formatDate(iso: string): string {
		return new Date(iso).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
	}

	let totalAttempted = $derived(Object.values(progress).reduce((s, p) => s + (p?.attempted ?? 0), 0));
	let totalCorrect = $derived(Object.values(progress).reduce((s, p) => s + (p?.correct ?? 0), 0));
	let overallPct = $derived(totalAttempted > 0 ? Math.round((totalCorrect / totalAttempted) * 100) : 0);
</script>

{#if loading}
	<div class="flex flex-col items-center justify-center py-32 gap-4">
		<div class="w-10 h-10 border-3 border-accent/30 border-t-accent rounded-full animate-spin"></div>
		<p class="text-sm text-slate-500 animate-pulse-slow">Loading your progress...</p>
	</div>
{:else}
	<div class="space-y-12">
		<!-- Hero -->
		<section class="text-center py-8">
			<h1 class="text-4xl font-extrabold tracking-tight mb-3">
				<span class="gradient-text">Security+ Practice Lab</span>
			</h1>
			<p class="text-slate-400 max-w-lg mx-auto leading-relaxed">
				Master the SY0-701 exam with interactive quizzes, PBQs, and scenario-based practice — powered by your flashcard deck.
			</p>

			{#if totalAttempted > 0}
				<div class="flex items-center justify-center gap-6 mt-6">
					<div class="text-center">
						<div class="text-2xl font-bold text-white">{totalAttempted}</div>
						<div class="text-xs text-slate-500">Questions</div>
					</div>
					<div class="w-px h-8 bg-slate-700"></div>
					<div class="text-center">
						<div class="text-2xl font-bold text-green-400">{totalCorrect}</div>
						<div class="text-xs text-slate-500">Correct</div>
					</div>
					<div class="w-px h-8 bg-slate-700"></div>
					<div class="text-center">
						<div class="text-2xl font-bold {getPercentColor(overallPct)}">{overallPct}%</div>
						<div class="text-xs text-slate-500">Overall</div>
					</div>
				</div>
			{/if}
		</section>

		<!-- Quick Actions -->
		<section>
			<div class="grid grid-cols-2 lg:grid-cols-4 gap-3">
				<button onclick={() => startQuickQuiz('quiz', 20)}
					class="group relative overflow-hidden rounded-xl border border-cyan-500/20 bg-surface-800 hover:bg-surface-750 p-5 text-left transition-all hover:border-cyan-500/40 hover:-translate-y-0.5 hover:shadow-lg hover:shadow-cyan-500/5"
				>
					<div class="absolute top-0 right-0 w-20 h-20 bg-cyan-500/5 rounded-bl-full -mr-6 -mt-6 group-hover:bg-cyan-500/10 transition"></div>
					<div class="relative">
						<div class="text-xs text-slate-500 mb-2">Multiple Choice</div>
						<div class="text-white font-semibold text-sm">20 Random Q's</div>
						<div class="text-xs text-slate-500 mt-1">Practice mode</div>
					</div>
				</button>

				<button onclick={() => startQuickQuiz('scenario', 10)}
					class="group relative overflow-hidden rounded-xl border border-purple-accent/20 bg-surface-800 hover:bg-surface-750 p-5 text-left transition-all hover:border-purple-accent/40 hover:-translate-y-0.5 hover:shadow-lg hover:shadow-purple-accent/5"
				>
					<div class="absolute top-0 right-0 w-20 h-20 bg-purple-accent/5 rounded-bl-full -mr-6 -mt-6 group-hover:bg-purple-accent/10 transition"></div>
					<div class="relative">
						<div class="text-xs text-slate-500 mb-2">Situational</div>
						<div class="text-white font-semibold text-sm">10 Scenarios</div>
						<div class="text-xs text-slate-500 mt-1">Practice mode</div>
					</div>
				</button>

				<button onclick={() => startQuickQuiz('pbq', 5)}
					class="group relative overflow-hidden rounded-xl border border-orange-accent/20 bg-surface-800 hover:bg-surface-750 p-5 text-left transition-all hover:border-orange-accent/40 hover:-translate-y-0.5 hover:shadow-lg hover:shadow-orange-accent/5"
				>
					<div class="absolute top-0 right-0 w-20 h-20 bg-orange-accent/5 rounded-bl-full -mr-6 -mt-6 group-hover:bg-orange-accent/10 transition"></div>
					<div class="relative">
						<div class="text-xs text-slate-500 mb-2">Drag &amp; Rank</div>
						<div class="text-white font-semibold text-sm">5 PBQs</div>
						<div class="text-xs text-slate-500 mt-1">Drag &amp; rank</div>
					</div>
				</button>

				<button onclick={() => startQuickQuiz('pbq', 99)}
					class="group relative overflow-hidden rounded-xl border border-orange-accent/20 bg-surface-800 hover:bg-surface-750 p-5 text-left transition-all hover:border-orange-accent/40 hover:-translate-y-0.5 hover:shadow-lg hover:shadow-orange-accent/5"
				>
					<div class="absolute top-0 right-0 w-20 h-20 bg-orange-accent/5 rounded-bl-full -mr-6 -mt-6 group-hover:bg-orange-accent/10 transition"></div>
					<div class="relative">
						<div class="text-xs text-slate-500 mb-2">All PBQs</div>
						<div class="text-white font-semibold text-sm">All PBQs</div>
						<div class="text-xs text-slate-500 mt-1">Every PBQ in deck</div>
					</div>
				</button>
			</div>
		</section>

		<!-- Practice Exams -->
		<section>
			<h2 class="text-base font-semibold text-white mb-3">Practice Exams (90 Q's · Exam Mode · 90 min Timer)</h2>
			<div class="grid grid-cols-3 lg:grid-cols-5 gap-3">
				{#each ['A', 'B', 'C', 'D', 'E'] as exam}
					<button onclick={() => startQuickQuiz('full', 90, 'exam')}
						class="group relative overflow-hidden rounded-xl border border-yellow-500/20 bg-surface-800 hover:bg-surface-750 p-4 text-center transition-all hover:border-yellow-500/40 hover:-translate-y-0.5 hover:shadow-lg hover:shadow-yellow-500/5"
					>
						<div class="absolute top-0 right-0 w-16 h-16 bg-yellow-500/5 rounded-bl-full -mr-4 -mt-4 group-hover:bg-yellow-500/10 transition"></div>
						<div class="relative">
							<div class="text-yellow-400 font-bold text-lg">Exam {exam}</div>
							<div class="text-xs text-slate-500 mt-0.5">Timed · 90 min</div>
						</div>
					</button>
				{/each}
			</div>
		</section>

		<!-- Domain Progress -->
		<section>
			<div class="flex items-center justify-between mb-5">
				<h2 class="text-lg font-bold text-white">Domain Progress</h2>
				<span class="text-xs text-slate-500">{totalAttempted} total attempts</span>
			</div>
			<div class="grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
				{#each [1, 2, 3, 4, 5] as domain (domain)}
					{@const p = progress[domain]}
					{@const pct = p?.percentage ?? 0}
					{@const attempted = p?.attempted ?? 0}
					<div class="glass rounded-xl p-4 hover:border-slate-600/50 transition-all group">
						<div class="flex items-center justify-between mb-2">
							<span class="text-xs font-mono text-slate-500">D{domain}</span>
							<span class="text-[10px] font-mono text-slate-500">D{domain}</span>
						</div>
						<div class="text-sm text-white font-semibold mb-2">{DOMAIN_SLUGS[domain]}</div>
						<div class="h-1.5 bg-slate-700/50 rounded-full overflow-hidden mb-2">
							<div class="h-full {getBarColor(pct)} rounded-full animate-progress transition-all duration-700" style="width: {pct}%"></div>
						</div>
						<div class="flex items-center justify-between">
							<span class="text-xs font-mono {getPercentColor(pct)}">{pct}%</span>
							<span class="text-[10px] px-2 py-0.5 rounded-full border {getStatusBadge(pct, attempted)}">{getStatusLabel(pct, attempted)}</span>
						</div>
					</div>
				{/each}
			</div>
		</section>

		<!-- Recent + Weak -->
		<section class="grid md:grid-cols-2 gap-6">
			<div>
				<h3 class="text-base font-semibold text-white mb-4">Recent Sessions</h3>
				{#if recentSessions.length === 0}
					<div class="glass rounded-xl p-6 text-center">
						<div class="text-xs text-slate-500 mb-2">No Data</div>
						<p class="text-sm text-slate-400">No sessions yet</p>
						<p class="text-xs text-slate-600 mt-1">Take a quiz to see your progress here.</p>
					</div>
				{:else}
					<div class="glass rounded-xl overflow-hidden">
						{#each recentSessions.slice(0, 5) as s, i (s.id)}
							<a href="/progress" class="flex items-center justify-between px-4 py-3 hover:bg-white/[0.02] transition border-b border-slate-800/50 last:border-0">
								<div class="flex items-center gap-3">
									<span class="w-8 h-8 rounded-lg flex items-center justify-center text-xs font-bold
										{s.type === 'full' ? 'bg-yellow-500/10 text-yellow-400' :
										 s.type === 'pbq' ? 'bg-orange-accent/10 text-orange-accent' :
										 s.type === 'scenario' ? 'bg-purple-accent/10 text-purple-accent' :
										 'bg-accent/10 text-accent-strong'}">
										{s.type === 'full' ? 'EX' : s.type === 'pbq' ? 'PB' : s.type === 'scenario' ? 'SC' : 'MC'}
									</span>
									<div>
										<div class="text-sm text-slate-300 capitalize">{s.type}</div>
										<div class="text-xs text-slate-600">{formatDate(s.date)}</div>
									</div>
								</div>
								<div class="text-right">
									<div class="text-sm font-mono font-semibold {getPercentColor(s.percentage)}">{s.percentage}%</div>
									<div class="text-xs text-slate-600">{s.score}</div>
								</div>
							</a>
						{/each}
					</div>
				{/if}
			</div>

			<div>
				<h3 class="text-base font-semibold text-white mb-4">Weak Topics</h3>
				{#if weakTopics.length === 0}
					<div class="glass rounded-xl p-6 text-center">
						<div class="text-xs text-slate-500 mb-2">All Clear</div>
						<p class="text-sm text-slate-400">No weak areas</p>
						<p class="text-xs text-slate-600 mt-1">Keep up the great work!</p>
					</div>
				{:else}
					<div class="glass rounded-xl overflow-hidden">
						{#each weakTopics.slice(0, 6) as t (`${t.domain}-${t.category}`)}
							<div class="flex items-center justify-between px-4 py-3 hover:bg-white/[0.02] transition border-b border-slate-800/50 last:border-0">
								<div class="flex items-center gap-3 min-w-0">
									<span class="text-[10px] font-mono px-2 py-0.5 rounded bg-red-500/10 text-red-400 shrink-0">D{t.domain}</span>
									<span class="text-sm text-slate-300 truncate">{t.category}</span>
								</div>
								<div class="text-sm font-mono text-red-400 shrink-0 ml-3">{t.correct}/{t.total}</div>
							</div>
						{/each}
					</div>
				{/if}
			</div>
		</section>
	</div>
{/if}
