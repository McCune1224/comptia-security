<script lang="ts">
	import { onMount, tick } from 'svelte';
	import MatchConnect from '$lib/components/MatchConnect.svelte';
	import ProgressRing from '$lib/components/ProgressRing.svelte';
	import { DOMAIN_NAMES } from '$lib/utils';
	import { OBJECTIVE_ACRONYMS, TERMINOLOGY_BANK, TERMINOLOGY_FLOORS } from '$lib/terminology-data';
	import type { TerminologyEntry } from '$lib/terminology-data';
	import {
		checkFill,
		filterEntries,
		gradeMatching,
		missedEntries,
		planRetry,
		planSession,
		scoreResults
	} from '$lib/terminology-drill';
	import type {
		DomainFilter,
		DrillConfig,
		DrillFormat,
		EntryResult,
		SessionPlan
	} from '$lib/terminology-drill';

	type View = 'setup' | 'drill' | 'result';

	const CATEGORY_LABELS: Record<TerminologyEntry['category'], string> = {
		protocol: 'Protocol',
		acronym: 'Acronym',
		port: 'Port',
		term: 'Concept'
	};

	const categoryCounts = TERMINOLOGY_BANK.reduce<Record<string, number>>((counts, entry) => {
		counts[entry.category] = (counts[entry.category] ?? 0) + 1;
		return counts;
	}, {});

	const domainCounts = [1, 2, 3, 4, 5].map((domain) => ({
		domain,
		count: TERMINOLOGY_BANK.filter((entry) => entry.domain === domain).length
	}));

	let view = $state<View>('setup');
	let hydrated = $state(false);
	let config = $state<DrillConfig>({
		section: 'terminology',
		domain: 'all',
		portOnly: false,
		format: 'fill',
		count: 12
	});

	let plan = $state<SessionPlan | null>(null);
	let itemIndex = $state(0);
	let results = $state<EntryResult[]>([]);

	let fillAnswer = $state('');
	let checked = $state(false);
	let fillCorrect = $state(false);
	let expectedAnswer = $state('');
	let matches = $state<Record<string, string>>({});
	let matchingResults = $state<EntryResult[]>([]);
	let matchingFeedback = $state<Record<string, string> | null>(null);
	let answerInput = $state<HTMLInputElement | null>(null);

	const pool = $derived(filterEntries(TERMINOLOGY_BANK, config));
	const currentItem = $derived(plan?.items[itemIndex] ?? null);
	const currentEntry = $derived(
		currentItem?.kind === 'fill' ? (currentItem.entries[0] ?? null) : null
	);
	const itemCount = $derived(plan?.items.length ?? 0);
	const isLast = $derived(itemCount > 0 && itemIndex >= itemCount - 1);
	const score = $derived(scoreResults(results));
	const missed = $derived(missedEntries(results));
	const progress = $derived(
		itemCount === 0 ? 0 : Math.min(100, ((itemIndex + (checked ? 1 : 0)) / itemCount) * 100)
	);
	const allMatched = $derived(
		currentItem?.kind === 'matching'
			? currentItem.entries.every((entry) => Boolean(matches[entry.id]))
			: true
	);
	const matchingAllCorrect = $derived(
		matchingResults.length > 0 && matchingResults.every((result) => result.correct)
	);
	const matchingCorrectCount = $derived(matchingResults.filter((result) => result.correct).length);

	$effect(() => {
		if (view === 'drill' && currentItem?.kind === 'fill' && !checked) {
			void tick().then(() => answerInput?.focus());
		}
	});

	onMount(() => {
		hydrated = true;
	});

	function resetItemState() {
		fillAnswer = '';
		checked = false;
		fillCorrect = false;
		expectedAnswer = '';
		matches = {};
		matchingResults = [];
		matchingFeedback = null;
	}

	function chooseSection(section: DrillConfig['section']) {
		config.section = section;
		if (section === 'protocols') config.portOnly = false;
	}

	function chooseFormat(format: DrillFormat) {
		config.format = format;
	}

	function setDomain(value: string) {
		config.domain = value === 'all' ? 'all' : (Number(value) as Exclude<DomainFilter, 'all'>);
	}

	function setCount(value: string) {
		config.count = Number(value);
	}

	function beginSession(nextPlan: SessionPlan) {
		if (nextPlan.totalEntries === 0) return;
		plan = nextPlan;
		itemIndex = 0;
		results = [];
		resetItemState();
		view = 'drill';
	}

	function start() {
		beginSession(planSession(TERMINOLOGY_BANK, config));
	}

	function submitFill() {
		if (!currentEntry || checked) return;
		const result = checkFill(currentEntry, fillAnswer);
		fillCorrect = result.correct;
		expectedAnswer = result.expected;
		checked = true;
		results = [...results, { entry: currentEntry, correct: result.correct }];
	}

	function submitMatching() {
		if (!currentItem || currentItem.kind !== 'matching' || !allMatched || checked) return;
		const graded = gradeMatching(currentItem, matches);
		matchingResults = graded;
		matchingFeedback = Object.fromEntries(currentItem.entries.map((entry) => [entry.id, entry.id]));
		checked = true;
		results = [...results, ...graded];
	}

	function nextItem() {
		if (!checked) return;
		if (isLast) {
			view = 'result';
			return;
		}
		itemIndex += 1;
		resetItemState();
	}

	function retryMissed() {
		if (missed.length === 0) return;
		beginSession(planRetry(missed, config.format));
	}

	function newDrill() {
		view = 'setup';
		plan = null;
		itemIndex = 0;
		results = [];
		resetItemState();
	}

	function answerNoun(entry: TerminologyEntry): string {
		if (entry.category === 'port') return 'port number';
		if (entry.category === 'protocol') return 'protocol';
		if (entry.category === 'acronym') return 'acronym';
		return 'term';
	}

	function categoryTone(category: TerminologyEntry['category']): string {
		if (category === 'protocol') return 'bg-accent/10 text-accent';
		if (category === 'port') return 'bg-info/10 text-info';
		if (category === 'acronym') return 'bg-accent-secondary/10 text-accent-secondary';
		return 'bg-warning/10 text-warning';
	}
</script>

<div class="space-y-6" data-testid="terminology-page" data-hydrated={hydrated}>
	{#if view === 'setup'}
		<section class="card p-6 sm:p-8">
			<p class="eyebrow">Practice · Drill room</p>
			<h1 class="h-display mt-2 text-3xl text-text-primary sm:text-4xl">
				The <span class="serif-italic text-accent">terminology bench</span>
			</h1>
			<p class="mt-3 max-w-2xl text-sm leading-relaxed text-text-secondary sm:text-base">
				Drill the vocabulary the exam assumes you already own — protocols, acronyms, named concepts,
				and the well-known ports that tie them together. Matching and fill-in-the-blank only, with
				immediate feedback. Nothing is saved.
			</p>
			<div class="mt-5 flex flex-wrap gap-2 text-xs font-semibold">
				<span class="chip bg-accent/10 text-accent">{categoryCounts.protocol} protocols</span>
				<span class="chip bg-accent-secondary/10 text-accent-secondary"
					>{categoryCounts.acronym} acronyms</span
				>
				<span class="chip bg-info/10 text-info">{categoryCounts.port} ports</span>
				<span class="chip bg-warning/10 text-warning">{categoryCounts.term} concepts</span>
			</div>
		</section>

		<div class="grid gap-4 lg:grid-cols-2">
			<button
				type="button"
				class="card p-5 text-left transition hover:-translate-y-0.5 hover:shadow-[var(--shadow-lift)] {config.section ===
				'protocols'
					? 'border-accent'
					: ''}"
				aria-pressed={config.section === 'protocols'}
				data-testid="section-protocols"
				onclick={() => chooseSection('protocols')}
			>
				<div class="flex items-start justify-between gap-3">
					<span class="grid h-11 w-11 place-items-center rounded bg-accent/10 text-accent">
						<svg
							viewBox="0 0 24 24"
							class="h-5 w-5"
							fill="none"
							stroke="currentColor"
							stroke-width="1.8"
							><path d="M4 7h16M4 12h10M4 17h13" /><circle cx="19" cy="16" r="2" /></svg
						>
					</span>
					{#if config.section === 'protocols'}
						<span class="text-xs font-bold uppercase tracking-wide text-accent">Selected</span>
					{/if}
				</div>
				<h2 class="h-display mt-4 text-xl text-text-primary">Protocols</h2>
				<p class="mt-1.5 text-sm leading-relaxed text-text-muted">
					Transport, routing, web, mail, directory, authentication, tunneling, and remote-access
					protocols — what each one does and where it belongs.
				</p>
				<p class="mt-3 text-xs font-semibold text-text-subtle">
					{categoryCounts.protocol} entries
				</p>
			</button>

			<button
				type="button"
				class="card p-5 text-left transition hover:-translate-y-0.5 hover:shadow-[var(--shadow-lift)] {config.section ===
				'terminology'
					? 'border-accent'
					: ''}"
				aria-pressed={config.section === 'terminology'}
				data-testid="section-terminology"
				onclick={() => chooseSection('terminology')}
			>
				<div class="flex items-start justify-between gap-3">
					<span
						class="grid h-11 w-11 place-items-center rounded bg-accent-secondary/10 text-accent-secondary"
					>
						<svg
							viewBox="0 0 24 24"
							class="h-5 w-5"
							fill="none"
							stroke="currentColor"
							stroke-width="1.8"><path d="M4 5h16v14H4z" /><path d="M8 9h8M8 13h5" /></svg
						>
					</span>
					{#if config.section === 'terminology'}
						<span class="text-xs font-bold uppercase tracking-wide text-accent">Selected</span>
					{/if}
				</div>
				<h2 class="h-display mt-4 text-xl text-text-primary">Acronyms &amp; Terminology</h2>
				<p class="mt-1.5 text-sm leading-relaxed text-text-muted">
					The SY0-701 acronym set, named security concepts, and — as a filter — the well-known ports
					the exam expects you to recognize instantly.
				</p>
				<p class="mt-3 text-xs font-semibold text-text-subtle">
					{categoryCounts.acronym + categoryCounts.term + categoryCounts.port} entries
				</p>
			</button>
		</div>

		<section class="card space-y-5 p-6 sm:p-8">
			<div class="flex flex-wrap items-end justify-between gap-3">
				<div>
					<p class="eyebrow">Session setup</p>
					<h2 class="h-display mt-1 text-xl text-text-primary">Build the drill</h2>
				</div>
				<p class="text-xs font-semibold text-text-muted">
					{pool.length}
					{pool.length === 1 ? 'entry' : 'entries'} in this filter
				</p>
			</div>

			<div class="grid gap-4 sm:grid-cols-2">
				<label class="block text-sm font-semibold text-text-secondary">
					Domain
					<select
						class="mt-1.5"
						value={config.domain}
						data-testid="domain-select"
						onchange={(event) => setDomain(event.currentTarget.value)}
					>
						<option value="all">All domains</option>
						{#each [1, 2, 3, 4, 5] as domain (domain)}
							<option value={domain}>
								Domain {domain} — {DOMAIN_NAMES[domain]}
							</option>
						{/each}
					</select>
				</label>

				<label class="block text-sm font-semibold text-text-secondary">
					Session length
					<select
						class="mt-1.5"
						value={config.count}
						data-testid="length-select"
						onchange={(event) => setCount(event.currentTarget.value)}
					>
						<option value={6}>6 entries</option>
						<option value={12}>12 entries</option>
						<option value={18}>18 entries</option>
					</select>
				</label>
			</div>

			<fieldset>
				<legend class="mb-1.5 block text-sm font-semibold text-text-secondary">Format</legend>
				<div class="grid gap-2 sm:grid-cols-3">
					{#each [{ id: 'matching', label: 'Matching', hint: 'Connect definitions to terms' }, { id: 'fill', label: 'Fill-in-the-blank', hint: 'Type the answer' }, { id: 'mixed', label: 'Mixed', hint: 'Both formats' }] as option (option.id)}
						<button
							type="button"
							class="rounded border px-3 py-2.5 text-left text-sm font-semibold transition {config.format ===
							option.id
								? 'border-accent bg-accent/10 text-accent'
								: 'border-border bg-surface-800 text-text-secondary hover:border-border-strong hover:text-text-primary'}"
							aria-pressed={config.format === option.id}
							data-testid={`format-${option.id}`}
							onclick={() => chooseFormat(option.id as DrillFormat)}
						>
							<span class="block">{option.label}</span>
							<span class="mt-0.5 block text-[11px] font-medium text-text-muted">{option.hint}</span
							>
						</button>
					{/each}
				</div>
			</fieldset>

			{#if config.section === 'terminology'}
				<label
					class="flex cursor-pointer items-start gap-3 rounded border border-border bg-surface-800 p-4 transition hover:border-border-strong"
				>
					<input
						type="checkbox"
						class="mt-0.5"
						checked={config.portOnly}
						data-testid="ports-toggle"
						aria-label="Ports only"
						onchange={(event) => (config.portOnly = event.currentTarget.checked)}
					/>
					<span class="min-w-0">
						<span class="block text-sm font-semibold text-text-primary">Ports only</span>
						<span class="block text-xs leading-relaxed text-text-muted">
							Filter this section down to the {categoryCounts.port} well-known ports — service name and
							purpose to port number, or the reverse in matching.
						</span>
					</span>
				</label>
			{/if}

			<div class="flex flex-col gap-3 border-t border-border pt-5 sm:flex-row sm:items-center">
				<button
					type="button"
					class="btn btn-primary"
					disabled={pool.length === 0}
					data-testid="start-drill"
					onclick={start}
				>
					Start drill
				</button>
				<p class="text-xs leading-relaxed text-text-muted">
					{config.format === 'matching'
						? 'Matching boards hold up to three pairs; every pair is scored.'
						: config.format === 'mixed'
							? 'Mixed alternates matching boards and typed answers across the same entries.'
							: 'One definition at a time; type the protocol, acronym, concept, or port.'}
					No account, no session record — this drill leaves nothing behind.
				</p>
			</div>
		</section>

		<section class="card p-5 sm:p-6">
			<div class="flex flex-wrap items-center justify-between gap-3">
				<div>
					<p class="eyebrow">Coverage</p>
					<h2 class="h-display mt-1 text-xl text-text-primary">Every domain, every category</h2>
				</div>
				<p class="text-xs font-semibold text-text-muted">
					{OBJECTIVE_ACRONYMS.length} objective acronyms · {TERMINOLOGY_BANK.length} bank entries
				</p>
			</div>
			<div class="mt-4 grid grid-cols-2 gap-2 sm:grid-cols-5">
				{#each domainCounts as item (item.domain)}
					<div class="rounded border border-border bg-surface-800 p-3">
						<p class="text-[10px] font-bold uppercase tracking-wide text-text-subtle">
							Domain {item.domain}
						</p>
						<p class="num-display mt-1 text-xl text-text-primary">{item.count}</p>
						<p class="truncate text-[11px] text-text-muted">{DOMAIN_NAMES[item.domain]}</p>
					</div>
				{/each}
			</div>
			<p class="mt-3 text-xs leading-relaxed text-text-muted">
				Content floors: {TERMINOLOGY_FLOORS.protocol}+ protocols, {TERMINOLOGY_FLOORS.acronym}+
				acronyms, {TERMINOLOGY_FLOORS.port}+ ports, {TERMINOLOGY_FLOORS.term}+ named concepts, and
				at least {TERMINOLOGY_FLOORS.domain} entries per domain. The unit suite and coverage report enforce
				them.
			</p>
		</section>
	{:else if view === 'drill' && plan && currentItem}
		<section class="card p-5 sm:p-7">
			<div class="flex flex-wrap items-center justify-between gap-3">
				<div>
					<p class="eyebrow">
						{config.section === 'protocols'
							? 'Protocols'
							: 'Acronyms & terminology'}{config.portOnly ? ' · Ports' : ''}
					</p>
					<p class="mt-1 text-sm font-semibold text-text-secondary">
						Item {itemIndex + 1} of {itemCount}
					</p>
				</div>
				<div class="flex items-center gap-3">
					<p class="text-xs font-semibold text-text-muted">
						{score.correct} / {score.total} correct
					</p>
					<button type="button" class="btn btn-ghost min-h-11" onclick={newDrill}>
						End drill
					</button>
				</div>
			</div>
			<div class="mt-4 h-1.5 overflow-hidden rounded-full bg-surface-700" aria-hidden="true">
				<div
					class="h-full bg-accent transition-all duration-300"
					style={`width: ${progress}%`}
				></div>
			</div>
		</section>

		<section class="card p-6 sm:p-8" data-testid="question-card">
			<div class="flex flex-wrap items-center gap-2">
				<span
					class="chip {categoryTone(currentItem.entries[0].category)}"
					data-testid="category-badge"
				>
					{CATEGORY_LABELS[currentItem.entries[0].category]}
				</span>
				<span class="chip bg-surface-700 text-text-muted"
					>Domain {currentItem.entries[0].domain}</span
				>
				{#if currentItem.entries[0].objective}
					<span class="chip bg-surface-700 text-text-muted"
						>Objective {currentItem.entries[0].objective}</span
					>
				{/if}
			</div>

			{#if currentItem.kind === 'fill' && currentEntry}
				<form
					class="mt-5"
					data-testid="fill-form"
					onsubmit={(event) => {
						event.preventDefault();
						if (checked) nextItem();
						else submitFill();
					}}
				>
					<p class="text-sm font-semibold text-text-secondary">
						Which {answerNoun(currentEntry)} matches this definition?
					</p>
					<p
						class="h-display mt-2 max-w-2xl text-xl leading-snug text-text-primary sm:text-2xl"
						data-testid="definition"
					>
						{currentEntry.definition}
					</p>

					<label class="mt-5 block text-sm font-semibold text-text-secondary">
						Your answer
						<input
							bind:this={answerInput}
							bind:value={fillAnswer}
							type="text"
							class="mt-1.5 w-full"
							placeholder={currentEntry.category === 'port' ? 'Port number' : 'Type the term'}
							autocomplete="off"
							autocapitalize="off"
							spellcheck="false"
							disabled={checked}
							data-testid="answer-input"
						/>
					</label>

					<div class="mt-4 flex flex-wrap items-center gap-3">
						{#if !checked}
							<button type="submit" class="btn btn-primary" data-testid="check-answer">
								Check answer
							</button>
							<p class="text-xs text-text-muted">
								Case, spaces, and hyphens are ignored. Aliases are accepted; typos are not.
							</p>
						{:else}
							<button type="submit" class="btn btn-primary" data-testid="next-item">
								{isLast ? 'See results' : 'Next item'}
							</button>
						{/if}
					</div>
				</form>

				{#if checked}
					<div
						class="mt-5 rounded border p-4 {fillCorrect
							? 'border-success/30 bg-success/10 text-success'
							: 'border-danger/30 bg-danger/10 text-danger'}"
						role="status"
						aria-live="polite"
						data-testid="feedback"
						data-answer={fillCorrect ? currentEntry.term : expectedAnswer}
					>
						<p class="text-sm font-bold">
							{fillCorrect ? 'Correct.' : 'Not quite.'}
						</p>
						<p class="mt-1 text-sm leading-relaxed">
							{fillCorrect
								? `You answered ${currentEntry.term}.`
								: `The answer is ${expectedAnswer}. ${currentEntry.definition}`}
						</p>
					</div>
				{/if}
			{:else if currentItem.kind === 'matching'}
				<div class="mt-5" data-testid="matching-board">
					<p class="mb-3 text-sm font-semibold text-text-secondary">
						Match each definition to its {currentItem.entries[0].category === 'port'
							? 'port'
							: 'term'}.
					</p>
					{#key `${currentItem.id}-${checked}`}
						<MatchConnect
							premises={currentItem.entries.map((entry) => ({
								id: entry.id,
								text: entry.definition
							}))}
							targets={[...currentItem.entries].reverse().map((entry) => ({
								id: entry.id,
								text: entry.term
							}))}
							{matches}
							disabled={checked}
							feedbackMatches={matchingFeedback}
							onchange={(next) => {
								if (!checked) matches = next;
							}}
						/>
					{/key}
				</div>

				<div class="mt-4 flex flex-wrap items-center gap-3">
					{#if !checked}
						<button
							type="button"
							class="btn btn-primary"
							disabled={!allMatched}
							data-testid="submit-matches"
							onclick={submitMatching}
						>
							Submit matches
						</button>
						<p class="text-xs text-text-muted">
							Connect all {currentItem.entries.length} pairs, then submit.
						</p>
					{:else}
						<button
							type="button"
							class="btn btn-primary"
							data-testid="next-item"
							onclick={nextItem}
						>
							{isLast ? 'See results' : 'Next item'}
						</button>
					{/if}
				</div>

				{#if checked}
					<div
						class="mt-5 rounded border p-4 {matchingAllCorrect
							? 'border-success/30 bg-success/10 text-success'
							: 'border-warning/30 bg-warning/10 text-warning'}"
						role="status"
						aria-live="polite"
						data-testid="feedback"
					>
						<p class="text-sm font-bold">
							{matchingCorrectCount} of {matchingResults.length} pairs matched.
						</p>
						<p class="mt-1 text-sm leading-relaxed">
							{matchingAllCorrect
								? 'Every pair is correct.'
								: 'Green lines are correct; red lines are not. Review the definitions above, then retry the missed items at the end.'}
						</p>
					</div>
				{/if}
			{/if}
		</section>
	{:else if view === 'result'}
		<section class="card p-6 sm:p-8">
			<div class="flex flex-col gap-6 sm:flex-row sm:items-center">
				<ProgressRing value={score.percent} label="score" />
				<div class="min-w-0">
					<p class="eyebrow">Drill complete</p>
					<h1 class="h-display mt-1 text-3xl text-text-primary">
						{score.percent >= 85
							? 'Recall is sharp'
							: score.percent >= 60
								? 'Good base, keep drilling'
								: 'Worth another pass'}
					</h1>
					<p class="mt-2 text-sm leading-relaxed text-text-secondary" data-testid="result-score">
						{score.correct} of {score.total} correct ({score.percent}%). {missed.length === 0
							? 'Nothing missed.'
							: `${missed.length} ${missed.length === 1 ? 'entry' : 'entries'} to revisit.`}
					</p>
					<div class="mt-4 flex flex-wrap gap-2">
						{#if missed.length > 0}
							<button
								type="button"
								class="btn btn-primary"
								data-testid="retry-missed"
								onclick={retryMissed}
							>
								Retry missed ({missed.length})
							</button>
						{/if}
						<button type="button" class="btn btn-ghost" data-testid="new-drill" onclick={newDrill}>
							New drill
						</button>
					</div>
				</div>
			</div>
		</section>

		{#if missed.length > 0}
			<section class="card p-5 sm:p-6">
				<p class="eyebrow">Missed items</p>
				<h2 class="h-display mt-1 text-xl text-text-primary">What to review</h2>
				<ul class="mt-4 space-y-3">
					{#each missed as entry (entry.id)}
						<li class="rounded border border-border bg-surface-800 p-4">
							<div class="flex flex-wrap items-center gap-2">
								<span class="chip {categoryTone(entry.category)}"
									>{CATEGORY_LABELS[entry.category]}</span
								>
								<span class="text-sm font-bold text-text-primary">{entry.term}</span>
								<span class="text-xs text-text-subtle">Domain {entry.domain}</span>
							</div>
							<p class="mt-2 text-sm leading-relaxed text-text-secondary">{entry.definition}</p>
						</li>
					{/each}
				</ul>
			</section>
		{/if}
	{:else}
		<section class="card p-6">
			<p class="serif-italic text-sm text-text-muted">
				That drill has no entries. Return to setup and choose another domain or format.
			</p>
			<button type="button" class="btn btn-primary mt-4" onclick={newDrill}>Back to setup</button>
		</section>
	{/if}
</div>
