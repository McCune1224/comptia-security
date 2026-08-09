<script lang="ts">
	let {
		pairs,
		matchedIds,
		disabled = false,
		feedbackCorrectIds = null,
		onchange
	}: {
		pairs: { id: string; a: string; b: string }[];
		/** Pair ids the parent has recorded as matched (the response). */
		matchedIds: string[];
		disabled?: boolean;
		/** After feedback: the correct pair ids, for success/danger coloring. */
		feedbackCorrectIds?: string[] | null;
		onchange: (matchedPairIds: string[]) => void;
	} = $props();

	/** Card instances: two per pair (a-side and b-side). */
	const cards = $derived(
		pairs.flatMap((pair) => [
			{ key: `${pair.id}:a`, pairId: pair.id, text: pair.a },
			{ key: `${pair.id}:b`, pairId: pair.id, text: pair.b }
		])
	);

	const matched = $derived(new Set(matchedIds));
	const revealed = $derived(!!feedbackCorrectIds); // review state: everything face-up

	let flipped = $state<string[]>([]);
	let lockTaps = $state(false);

	function tap(key: string) {
		if (disabled || lockTaps || revealed) return;
		const card = cards.find((c) => c.key === key);
		if (!card || matched.has(card.pairId) || flipped.includes(key)) return;
		const next = [...flipped, key];
		if (next.length === 2) {
			const [k1, k2] = next;
			const c1 = cards.find((c) => c.key === k1)!;
			const c2 = cards.find((c) => c.key === k2)!;
			if (c1.pairId === c2.pairId) {
				flipped = [];
				onchange([...matchedIds, c1.pairId]);
			} else {
				lockTaps = true;
				flipped = next;
				setTimeout(() => {
					flipped = [];
					lockTaps = false;
				}, 700);
			}
		} else {
			flipped = next;
		}
	}

	function cardClass(card: { key: string; pairId: string }): string {
		const isMatched = matched.has(card.pairId);
		const isFlipped = flipped.includes(card.key);
		const isFaceUp = isMatched || isFlipped || revealed;
		if (feedbackCorrectIds) {
			if (feedbackCorrectIds.includes(card.pairId)) return 'border-success bg-success/15 text-success';
			if (isMatched) return 'border-danger bg-danger/15 text-danger';
			return 'border-border bg-surface-800 text-text-muted';
		}
		if (isFaceUp) {
			return isMatched
				? 'border-accent bg-accent/15 text-text-primary'
				: 'border-border-strong bg-surface-600 text-text-primary';
		}
		return 'border-border bg-surface-700 text-text-muted';
	}
</script>

<div class="grid grid-cols-4 gap-2">
	{#each cards as card (card.key)}
		<button
			type="button"
			class="flex min-h-[52px] items-center justify-center rounded-md border p-2 text-center text-sm font-semibold transition {cardClass(card)} {disabled || revealed
				? 'cursor-default'
				: 'cursor-pointer'}"
			aria-pressed={matched.has(card.pairId) || flipped.includes(card.key)}
			aria-label={matched.has(card.pairId) || flipped.includes(card.key) || revealed
				? `${card.text} (${card.pairId})`
				: 'Face-down card'}
			disabled={disabled || revealed}
			onclick={() => tap(card.key)}
		>
			{#if matched.has(card.pairId) || flipped.includes(card.key) || revealed}
				<span class="truncate">{card.text}</span>
			{:else}
				<span aria-hidden="true">?</span>
			{/if}
		</button>
	{/each}
</div>
{#if !disabled && !revealed}
	<p class="mt-2 text-xs font-semibold uppercase tracking-wide text-text-muted">
		Tap two cards to find a pair
	</p>
{/if}
