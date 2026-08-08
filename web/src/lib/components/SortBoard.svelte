<script lang="ts">
	import { tapItem, tapBucket, isItemAssigned } from '$lib/sort-board';

	let {
		items,
		buckets,
		assignments,
		disabled = false,
		feedbackAssignments = null,
		onchange
	}: {
		items: { id: string; text: string }[];
		buckets: { id: string; label: string }[];
		assignments: Record<string, string>;
		disabled?: boolean;
		feedbackAssignments?: Record<string, string> | null;
		onchange: (assignments: Record<string, string>) => void;
	} = $props();

	let selected = $state<string | null>(null);

	function onItemTap(itemId: string) {
		if (disabled) return;
		const next = tapItem({ selected, assignments }, itemId);
		selected = next.selected;
		// Placement changed (item moved back to tray) -> notify parent.
		if (next.assignments !== assignments) onchange(next.assignments);
	}

	function onBucketTap(bucketId: string) {
		if (disabled || !selected) return;
		const next = tapBucket({ selected, assignments }, bucketId);
		selected = next.selected;
		if (next.assignments !== assignments) onchange(next.assignments);
	}

	function chipClass(itemId: string, bucketId: string): string {
		if (feedbackAssignments) {
			return feedbackAssignments[itemId] === bucketId
				? 'border-success bg-success/10 text-success'
				: 'border-danger bg-danger/10 text-danger';
		}
		return 'border-border bg-surface-800 text-text-primary';
	}
</script>

<div class="space-y-2">
	<p class="text-xs font-semibold uppercase tracking-wide text-text-muted">
		Tap an item, then tap a bucket — tap a placed item to move it back
	</p>
	<div class="flex flex-col gap-4">
		<div class="flex flex-wrap gap-2">
			{#each items as item (item.id)}
				{@const placed = isItemAssigned({ selected, assignments }, item.id)}
				{#if !placed}
					<button
						type="button"
						class="rounded-md border-2 px-3.5 py-2 text-sm font-medium transition {disabled
							? 'cursor-default opacity-60'
							: selected === item.id
								? 'border-accent bg-accent/10 text-text-primary'
								: 'border-border-strong bg-surface-700 text-text-primary hover:border-accent hover:text-accent'}"
						aria-pressed={selected === item.id}
						disabled={disabled}
						onclick={() => onItemTap(item.id)}
						onkeydown={(e) => {
							if (e.key === 'Escape') selected = null;
						}}
					>
						{item.text}
					</button>
				{/if}
			{/each}
		</div>
		<div class="space-y-3">
			{#each buckets as bucket (bucket.id)}
				{@const placedIds = items
					.filter((item) => assignments[item.id] === bucket.id)
					.map((item) => item.id)}
				<div
					class="rounded-md border border-border bg-surface-700/60 p-3 {selected
						? 'cursor-pointer border-dashed border-border-strong'
						: ''}"
					role="button"
					tabindex="0"
					aria-label={selected ? `Place selected item in ${bucket.label}` : `${bucket.label} bucket`}
					onclick={() => onBucketTap(bucket.id)}
					onkeydown={(e) => {
						if (e.key === 'Enter' || e.key === ' ') {
							e.preventDefault();
							onBucketTap(bucket.id);
						}
					}}
				>
					<p class="mb-2 text-xs font-semibold uppercase tracking-wide text-text-muted">
						{bucket.label}
					</p>
					<div class="flex flex-wrap gap-2">
						{#each items as item (item.id)}
							{@const inBucket = assignments[item.id] === bucket.id}
							{#if inBucket}
								<button
									type="button"
									class="rounded-md border-2 px-3.5 py-2 text-sm font-medium transition {disabled
										? 'cursor-default'
										: 'cursor-pointer'} {chipClass(item.id, bucket.id)}"
									disabled={disabled}
									onclick={() => onItemTap(item.id)}
								>
									{item.text}
								</button>
							{/if}
						{/each}
						{#if placedIds.length === 0}
							<span class="text-xs text-text-subtle">—</span>
						{/if}
					</div>
				</div>
			{/each}
		</div>
	</div>
</div>
