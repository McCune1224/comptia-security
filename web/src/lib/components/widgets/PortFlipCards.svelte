<script lang="ts">
	const ports = [
		{ port: '22', service: 'SSH — secure remote shell' },
		{ port: '23', service: 'Telnet — unencrypted remote shell (legacy)' },
		{ port: '25', service: 'SMTP — sending email' },
		{ port: '53', service: 'DNS — name resolution' },
		{ port: '80', service: 'HTTP — unencrypted web' },
		{ port: '110', service: 'POP3 — download email' },
		{ port: '143', service: 'IMAP — sync email' },
		{ port: '443', service: 'HTTPS — encrypted web (TLS)' },
		{ port: '445', service: 'SMB — Windows file sharing' },
		{ port: '3389', service: 'RDP — Windows remote desktop' }
	];
	let flipped = $state<Set<number>>(new Set());

	function toggle(index: number) {
		const next = new Set(flipped);
		if (next.has(index)) next.delete(index);
		else next.add(index);
		flipped = next;
	}
</script>

<div class="space-y-2">
	<p class="text-xs font-semibold uppercase tracking-wide text-text-muted">
		Well-known ports — tap to flip
	</p>
	<div class="grid grid-cols-2 gap-2 sm:grid-cols-3">
		{#each ports as entry, i (entry.port)}
			<button
				type="button"
				class="min-h-11 rounded-md border border-border bg-surface-700 px-2 py-2 text-center text-sm font-semibold text-text-primary transition {flipped.has(
					i
				)
					? 'border-accent bg-accent/10'
					: ''}"
				aria-pressed={flipped.has(i)}
				onclick={() => toggle(i)}
			>
				{#if flipped.has(i)}
					<span class="block text-xs font-normal leading-tight text-text-secondary"
						>{entry.service}</span
					>
				{:else}
					<span class="num-display block text-base text-text-primary">{entry.port}</span>
				{/if}
			</button>
		{/each}
	</div>
</div>
