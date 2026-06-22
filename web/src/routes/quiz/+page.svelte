<script lang="ts">
	import { page } from '$app/stores';
	import { goto } from '$app/navigation';
	import QuizFlow from '$lib/components/QuizFlow.svelte';
	import { DOMAIN_NAMES } from '$lib/utils';

	let type = $state('');
	let count = $state(20);
	let domain = $state<number | undefined>(undefined);
	let mode = $state<'practice' | 'exam'>('practice');
	let started = $state(false);

	$effect(() => {
		const params = $page.url.searchParams;
		type = params.get('type') || 'quiz';
		count = parseInt(params.get('count') || '20', 10);
		domain = params.get('domain') ? parseInt(params.get('domain')!, 10) : undefined;
		mode = (params.get('mode') || 'practice') as 'practice' | 'exam';
		started = !!params.get('type');
	});

	function startQuiz() {
		const p = new URLSearchParams({ type: type || 'quiz', count: String(count), mode });
		if (domain) p.set('domain', String(domain));
		goto(`/quiz?${p}`, { replaceState: true });
	}
</script>

{#if started}
	<QuizFlow type={type as 'quiz' | 'scenario'} {mode} {count} {domain} onDone={() => goto('/')} />
{:else}
	<div class="max-w-md mx-auto space-y-8 py-8">
		<div class="text-center space-y-2">
			<div class="text-xs text-slate-500 mb-3 uppercase tracking-wide">Multiple Choice</div>
			<h1 class="text-2xl font-bold text-white">Definition Quiz</h1>
			<p class="text-sm text-slate-400">Test your knowledge of Security+ terms and concepts.</p>
		</div>

		<div class="glass rounded-2xl p-6 space-y-5">
			<div>
				<label for="qz-domain" class="block text-sm font-medium text-slate-300 mb-2">Domain</label>
				<select id="qz-domain" bind:value={domain}
					class="w-full bg-slate-800/80 border border-slate-600 rounded-xl px-4 py-3 text-white text-sm focus:border-cyan-500 focus:outline-none focus:ring-1 focus:ring-cyan-500/50 transition">
					<option value={undefined}>All Domains (Mixed)</option>
					{#each [1, 2, 3, 4, 5] as d (d)}
						<option value={d}>Domain {d}: {DOMAIN_NAMES[d]}</option>
					{/each}
				</select>
			</div>

			<div>
				<label for="qz-count" class="block text-sm font-medium text-slate-300 mb-2">Questions: <span class="text-cyan-400 font-bold">{count}</span></label>
				<input id="qz-count" type="range" min="5" max="50" step="5" bind:value={count} class="w-full accent-cyan-500" />
				<div class="flex justify-between text-xs text-slate-600 mt-1"><span>5</span><span>25</span><span>50</span></div>
			</div>

			<div>
				<div class="block text-sm font-medium text-slate-300 mb-2">Mode</div>
				<div class="grid grid-cols-2 gap-3">
					<button onclick={() => mode = 'practice'}
						class="p-3.5 rounded-xl border text-sm transition-all {mode === 'practice' ? 'border-cyan-500 bg-cyan-500/10 shadow-[0_0_20px_rgba(6,182,212,0.1)]' : 'border-slate-700/50 bg-slate-800/40 hover:border-slate-500'}">
						<div class="text-cyan-400 font-semibold text-sm">Practice</div>
						<div class="text-xs text-slate-500 mt-0.5">Immediate feedback</div>
					</button>
					<button onclick={() => mode = 'exam'}
						class="p-3.5 rounded-xl border text-sm transition-all {mode === 'exam' ? 'border-yellow-500 bg-yellow-500/10 shadow-[0_0_20px_rgba(234,179,8,0.1)]' : 'border-slate-700/50 bg-slate-800/40 hover:border-slate-500'}">
						<div class="text-yellow-400 font-semibold text-sm">Exam</div>
						<div class="text-xs text-slate-500 mt-0.5">Score at end</div>
					</button>
				</div>
			</div>

			<button onclick={startQuiz}
				class="w-full py-3.5 bg-cyan-600 hover:bg-cyan-500 rounded-xl text-white font-semibold transition-all hover:shadow-lg hover:shadow-cyan-500/20">
				Start Quiz
			</button>
		</div>
	</div>
{/if}
