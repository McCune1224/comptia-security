<script lang="ts">
	import { widgets } from '$lib/components/widgets';

	let { body }: { body: string } = $props();

	type Block =
		| { type: 'widget'; id: string }
		| { type: 'heading'; text: string }
		| { type: 'table'; headers: string[]; rows: string[][] }
		| { type: 'list'; ordered: boolean; items: string[] }
		| { type: 'para'; text: string };

	/** Inline markdown-lite: escape first, then bold / italic / code spans. Content is trusted static seed data. */
	function inline(text: string): string {
		const escaped = text.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
		return escaped
			.replace(/\*\*(.+?)\*\*/g, '<strong class="text-text-primary">$1</strong>')
			.replace(/\*(.+?)\*/g, '<em>$1</em>')
			.replace(
				/`(.+?)`/g,
				'<code class="rounded-sm bg-surface-700 px-1 py-0.5 text-[0.85em] text-accent">$1</code>'
			);
	}

	/** Block parser: widget markers, ## headings, pipe tables, - bullets, 1. numbered, paragraphs. */
	function parse(content: string): Block[] {
		const lines = content.split('\n');
		const blocks: Block[] = [];
		let i = 0;
		while (i < lines.length) {
			const line = lines[i].trim();
			if (!line) {
				i++;
				continue;
			}
			const widget = line.match(/^::widget ([a-z0-9-]+)::$/);
			if (widget) {
				blocks.push({ type: 'widget', id: widget[1] });
				i++;
				continue;
			}
			if (line.startsWith('## ')) {
				blocks.push({ type: 'heading', text: line.slice(3) });
				i++;
				continue;
			}
			if (line.startsWith('|')) {
				let j = i;
				while (j < lines.length && lines[j].trim().startsWith('|')) j++;
				if (j - i >= 3) {
					const headers = lines[i]
						.split('|')
						.map((s) => s.trim())
						.filter(Boolean);
					const rows: string[][] = [];
					for (let r = i + 2; r < j; r++) {
						const cells = lines[r]
							.split('|')
							.map((s) => s.trim())
							.filter(Boolean);
						if (cells.length) rows.push(cells);
					}
					blocks.push({ type: 'table', headers, rows });
				} else {
					blocks.push({ type: 'para', text: line });
				}
				i = j;
				continue;
			}
			if (line.startsWith('- ')) {
				const items: string[] = [];
				while (i < lines.length && lines[i].trim().startsWith('- ')) {
					items.push(lines[i].trim().slice(2));
					i++;
				}
				blocks.push({ type: 'list', ordered: false, items });
				continue;
			}
			if (/^\d+\.\s/.test(line)) {
				const items: string[] = [];
				while (i < lines.length && /^\d+\.\s/.test(lines[i].trim())) {
					items.push(lines[i].trim().replace(/^\d+\.\s/, ''));
					i++;
				}
				blocks.push({ type: 'list', ordered: true, items });
				continue;
			}
			const para: string[] = [];
			while (
				i < lines.length &&
				lines[i].trim() &&
				!lines[i].trim().startsWith('## ') &&
				!lines[i].trim().startsWith('|') &&
				!lines[i].trim().startsWith('- ') &&
				!/^\d+\.\s/.test(lines[i].trim()) &&
				!lines[i].trim().match(/^::widget/)
			) {
				para.push(lines[i].trim());
				i++;
			}
			blocks.push({ type: 'para', text: para.join(' ') });
		}
		return blocks;
	}

	const blocks = $derived(parse(body));
</script>

<div class="space-y-4">
	{#each blocks as block, bi (bi)}
		{#if block.type === 'widget'}
			{@const Widget = widgets[block.id]}
			{#if Widget}
				<div class="rounded-md border border-border bg-surface-800/60 p-4">
					<Widget />
				</div>
			{/if}
		{:else if block.type === 'heading'}
			<h3 class="h-display border-b border-border/60 pb-2 pt-2 text-base text-text-primary">
				{@html inline(block.text)}
			</h3>
		{:else if block.type === 'table'}
			<div class="overflow-x-auto rounded-md border border-border">
				<table class="w-full text-sm">
					<thead>
						<tr class="border-b border-border bg-surface-700/60">
							{#each block.headers as header (header)}
								<th class="px-3 py-2 text-left font-semibold text-text-primary">
									{@html inline(header)}
								</th>
							{/each}
						</tr>
					</thead>
					<tbody>
						{#each block.rows as row (row.join('|'))}
							<tr class="border-b border-border/50 last:border-b-0">
								{#each row as cell (cell)}
									<td class="px-3 py-2 align-top text-text-secondary">
										{@html inline(cell)}
									</td>
								{/each}
							</tr>
						{/each}
					</tbody>
				</table>
			</div>
		{:else if block.type === 'list'}
			{#if block.ordered}
				<ol class="list-decimal space-y-1.5 pl-5 text-sm leading-6 text-text-secondary">
					{#each block.items as item (item)}
						<li>{@html inline(item)}</li>
					{/each}
				</ol>
			{:else}
				<ul class="space-y-1.5 text-sm leading-6 text-text-secondary">
					{#each block.items as item (item)}
						<li class="flex gap-2">
							<span class="mt-2.5 h-1 w-1 shrink-0 bg-accent"></span>
							<span>{@html inline(item)}</span>
						</li>
					{/each}
				</ul>
			{/if}
		{:else}
			<p class="text-sm leading-6 text-text-secondary">{@html inline(block.text)}</p>
		{/if}
	{/each}
</div>
