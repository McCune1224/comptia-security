<script lang="ts">
	import type { QuestionResponse } from '$lib/types';

	type Column = { id: string; label: string; options: { id: string; text: string }[] };
	type Row = { id: string; label: string };

	let {
		columns,
		rows,
		values,
		rowOrder,
		feedbackValues = null,
		disabled = false,
		onchange
	}: {
		columns: Column[];
		rows: Row[];
		values: Record<string, Record<string, string>>;
		rowOrder: string[];
		feedbackValues?: Record<string, Record<string, string>> | null;
		disabled?: boolean;
		onchange: (response: Extract<QuestionResponse, { kind: 'rule-table' }>) => void;
	} = $props();

	/** Every row id, in the learner's order (falls back to the presentation order). */
	function effectiveOrder(): string[] {
		return rowOrder.length === rows.length ? rowOrder : rows.map((row) => row.id);
	}

	function rowById(id: string): Row | undefined {
		return rows.find((row) => row.id === id);
	}

	function valueFor(rowId: string, columnId: string): string {
		return values[rowId]?.[columnId] ?? '';
	}

	function feedbackFor(rowId: string, columnId: string): string | null {
		return feedbackValues?.[rowId]?.[columnId] ?? null;
	}

	function cellClass(rowId: string, columnId: string): string {
		if (!disabled || !feedbackValues) return 'border-border bg-surface-900/60';
		return valueFor(rowId, columnId) === feedbackFor(rowId, columnId)
			? 'border-success/50 bg-success/5'
			: 'border-danger/50 bg-danger/5';
	}

	function setCell(rowId: string, columnId: string, optionId: string) {
		const next = { ...values, [rowId]: { ...(values[rowId] ?? {}), [columnId]: optionId } };
		onchange({ kind: 'rule-table', values: next, rowOrder: effectiveOrder() });
	}

	function move(rowId: string, direction: -1 | 1) {
		const order = [...effectiveOrder()];
		const index = order.indexOf(rowId);
		const target = index + direction;
		if (index < 0 || target < 0 || target >= order.length) return;
		[order[index], order[target]] = [order[target], order[index]];
		onchange({ kind: 'rule-table', values, rowOrder: order });
	}
</script>

<div class="space-y-3">
	<p class="text-xs font-semibold uppercase tracking-wide text-text-muted">
		Rule table — fill every cell, then order the rules (first match first)
	</p>
	<div class="overflow-x-auto rounded-xl border border-border">
		<table class="w-full min-w-[46rem] border-collapse text-sm">
			<caption class="sr-only">Firewall or access-control rule table</caption>
			<thead>
				<tr class="border-b border-border bg-surface-900/70">
					<th class="p-2 text-left text-xs font-bold uppercase tracking-wide text-text-muted" scope="col"
						>Order</th
					>
					{#each columns as column (column.id)}
						<th
							class="p-2 text-left text-xs font-bold uppercase tracking-wide text-text-muted"
							scope="col">{column.label}</th
						>
					{/each}
				</tr>
			</thead>
			<tbody>
				{#each effectiveOrder() as rowId, index (rowId)}
					{@const row = rowById(rowId)}
					{#if row}
						<tr class="border-b border-border/70 last:border-b-0">
							<td class="p-2">
								<div class="flex items-center gap-1">
									<span class="min-w-6 text-center font-mono text-xs text-text-muted">{index + 1}</span>
									<button
										class="grid h-11 w-11 place-items-center rounded border border-border text-text-secondary transition hover:border-border-strong hover:text-text-primary disabled:opacity-30"
										type="button"
										aria-label="Move rule {row.label} up"
										disabled={disabled || index === 0}
										onclick={() => move(rowId, -1)}>↑</button
									>
									<button
										class="grid h-11 w-11 place-items-center rounded border border-border text-text-secondary transition hover:border-border-strong hover:text-text-primary disabled:opacity-30"
										type="button"
										aria-label="Move rule {row.label} down"
										disabled={disabled || index === effectiveOrder().length - 1}
										onclick={() => move(rowId, 1)}>↓</button
									>
								</div>
							</td>
							{#each columns as column (column.id)}
								{@const current = valueFor(rowId, column.id)}
								{@const correct = feedbackFor(rowId, column.id)}
								<td class="p-2 align-top">
									<select
										class="min-h-11 w-full min-w-32 rounded border px-2 py-1.5 text-text-primary {cellClass(
											rowId,
											column.id
										)}"
										aria-label="{row.label}, {column.label}"
										value={current}
										disabled={disabled}
										onchange={(event) =>
											setCell(rowId, column.id, event.currentTarget.value)}
									>
										<option value="">Select…</option>
										{#each column.options as option (option.id)}
											<option value={option.id}>{option.text}</option>
										{/each}
									</select>
									{#if disabled && correct && current !== correct}
										<p class="mt-1 text-xs leading-snug text-success">
											Correct: {column.options.find((option) => option.id === correct)?.text}
										</p>
									{/if}
								</td>
							{/each}
						</tr>
					{/if}
				{/each}
			</tbody>
		</table>
	</div>
</div>
