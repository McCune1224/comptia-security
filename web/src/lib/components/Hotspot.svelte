<script lang="ts">
	import {
		hotspotTemplate,
		OSI_LAYER_BANDS,
		TOPOLOGY_ANCHORS,
		PACKET_BANDS
	} from '$lib/hotspot-templates';

	let {
		template,
		regions,
		selectedIds,
		disabled = false,
		feedbackCorrectIds = null,
		onchange
	}: {
		template: string;
		regions: { id: string; label: string; x1: number; y1: number; x2: number; y2: number }[];
		selectedIds: string[];
		disabled?: boolean;
		feedbackCorrectIds?: string[] | null;
		onchange: (regionIds: string[]) => void;
	} = $props();

	const def = $derived(hotspotTemplate(template));

	function toggle(regionId: string) {
		if (disabled) return;
		onchange(
			selectedIds.includes(regionId)
				? selectedIds.filter((id) => id !== regionId)
				: [...selectedIds, regionId]
		);
	}

	function regionClass(regionId: string): string {
		const selected = selectedIds.includes(regionId);
		if (feedbackCorrectIds) {
			if (feedbackCorrectIds.includes(regionId)) return 'border-success bg-success/15 text-success';
			if (selected) return 'border-danger bg-danger/15 text-danger';
			return 'border-border bg-transparent text-text-muted';
		}
		if (selected) return 'border-accent bg-accent/20 text-text-primary';
		return 'border-border/70 bg-transparent text-text-muted hover:border-accent hover:text-text-primary';
	}

	/** Tall enough that every region renders ≥44px (mobile tap target). */
	const minHeight = $derived(() => {
		if (template === 'log-lines') return Math.max(340, regions.length * 52);
		const minBand = Math.min(...regions.map((r) => r.y2 - r.y1));
		return Math.max(320, Math.ceil(100 / minBand) * 44);
	});
</script>

<div class="space-y-2">
	{#if def}
		<p class="text-xs font-semibold uppercase tracking-wide text-text-muted">{def.description}</p>
	{/if}
	<div
		class="relative w-full overflow-hidden rounded-md border border-border bg-surface-800"
		style:min-height="{minHeight()}px"
	>
		<!-- Template background (all in 0-100 normalized space) -->
		{#if template === 'osi-stack'}
			{#each OSI_LAYER_BANDS as band}
				<div
					class="absolute left-0 flex w-full items-center border-b border-border/60 px-2 last:border-b-0"
					style:top="{band.y1}%"
					style:height="{band.y2 - band.y1}%"
				>
					<span class="text-[11px] font-semibold text-text-secondary">{band.label}</span>
				</div>
			{/each}
		{:else if template === 'topology-basic'}
			<div
				class="absolute inset-x-[5%] top-[2%] flex h-[18%] items-center justify-center rounded-md border-2 border-dashed border-border-strong bg-surface-700/60 text-xs font-bold text-text-secondary"
			>
				<svg
					viewBox="0 0 24 24"
					class="h-5 w-5"
					fill="none"
					stroke="currentColor"
					stroke-width="1.8"><path d="M17.5 19H9a7 7 0 1 1 6.71-9h1.79a4.5 4.5 0 1 1 0 9Z" /></svg
				> Internet
			</div>
			{#each TOPOLOGY_ANCHORS.filter((a) => a.id !== 'cloud') as anchor}
				<div
					class="absolute flex items-center justify-center rounded-md border border-border bg-surface-700 text-center text-[11px] font-semibold text-text-secondary"
					style:left="{anchor.x1}%"
					style:top="{anchor.y1}%"
					style:width="{anchor.x2 - anchor.x1}%"
					style:height="{anchor.y2 - anchor.y1}%"
				>
					{anchor.label}
				</div>
			{/each}
		{:else if template === 'packet-frame'}
			<div
				class="absolute left-[2%] right-[2%] top-[30%] flex h-[24%] overflow-hidden rounded-md border border-border"
			>
				{#each PACKET_BANDS as band}
					<div
						class="flex items-center justify-center border-r border-border/60 px-0.5 text-center text-[10px] font-semibold leading-tight text-text-secondary last:border-r-0"
						style:width="{band.x2 - band.x1}%"
					>
						{band.label}
					</div>
				{/each}
			</div>
			<div
				class="absolute inset-x-[2%] top-[62%] flex items-center justify-center rounded-md border border-dashed border-border-strong bg-surface-700/50 py-3 text-xs font-bold text-text-secondary"
			>
				Ethernet frame
			</div>
		{:else if template === 'log-lines'}
			{#each regions as region}
				<div
					class="absolute left-0 flex w-full items-center overflow-hidden border-b border-border/40 px-3 font-mono text-[11px] leading-tight text-text-secondary last:border-b-0"
					style:top="{region.y1}%"
					style:height="{region.y2 - region.y1}%"
				>
					<span class="truncate">{region.label}</span>
				</div>
			{/each}
		{/if}

		<!-- Tap regions -->
		{#each regions as region (region.id)}
			<button
				type="button"
				class="absolute rounded-sm border-2 transition {regionClass(region.id)} {disabled
					? 'cursor-default'
					: 'cursor-pointer'}"
				style:left="{region.x1}%"
				style:top="{region.y1}%"
				style:width="{region.x2 - region.x1}%"
				style:height="{region.y2 - region.y1}%"
				aria-pressed={selectedIds.includes(region.id)}
				aria-label={region.label}
				{disabled}
				onclick={() => toggle(region.id)}
			>
				{#if template !== 'log-lines' && template !== 'osi-stack'}
					<span class="sr-only">{region.label}</span>
				{/if}
			</button>
		{/each}
	</div>
	{#if !disabled}
		<p class="text-xs font-semibold uppercase tracking-wide text-text-muted">
			Tap a region — tap again to remove
		</p>
	{/if}
</div>
