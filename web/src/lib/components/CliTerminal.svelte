<script lang="ts">
	import type { QuestionResponse } from '$lib/types';

	type Task = { id: string; label: string; placeholder: string; tokens?: string[] };

	let {
		device,
		shell,
		transcript,
		vocabulary,
		tasks,
		values,
		feedbackValues = null,
		disabled = false,
		onchange
	}: {
		device: string;
		shell: string;
		transcript: string[];
		vocabulary: string[];
		tasks: Task[];
		values: Record<string, string>;
		feedbackValues?: Record<string, string> | null;
		disabled?: boolean;
		onchange: (response: Extract<QuestionResponse, { kind: 'cli' }>) => void;
	} = $props();

	let focusedTask = $state<string | null>(null);

	function tokenList(task: Task): string[] {
		return task.tokens?.length ? task.tokens : vocabulary;
	}

	function update(taskId: string, value: string) {
		onchange({ kind: 'cli', values: { ...values, [taskId]: value } });
	}

	function insertToken(token: string) {
		const target = focusedTask ?? tasks.find((task) => !(values[task.id] ?? '').trim())?.id;
		if (!target || disabled) return;
		const current = values[target] ?? '';
		const next = current.trim().length ? `${current.trimEnd()} ${token}` : token;
		update(target, next);
	}
</script>

<div class="space-y-3">
	<p class="text-xs font-semibold uppercase tracking-wide text-text-muted">
		Constrained terminal — type each command, or tap a token to insert it
	</p>
	<div class="overflow-hidden rounded-xl border border-border bg-surface-900 shadow-[var(--shadow-card)]">
		<div class="flex flex-wrap items-center justify-between gap-2 border-b border-border px-3 py-2">
			<span class="font-mono text-xs text-text-muted">{device}</span>
			<span class="chip bg-surface-700 text-text-muted">Terminal</span>
		</div>
		<div class="max-h-52 overflow-y-auto px-3 py-3 font-mono text-xs leading-relaxed text-text-secondary">
			{#each transcript as line, index (index)}
				<p class="whitespace-pre-wrap break-words">{line}</p>
			{/each}
			{#if transcript.length === 0}
				<p class="text-text-muted">No existing output.</p>
			{/if}
		</div>
	</div>

	<div class="space-y-4">
		{#each tasks as task, index (task.id)}
			{@const current = values[task.id] ?? ''}
			{@const correct = feedbackValues?.[task.id] ?? null}
			<div class="rounded-xl border border-border bg-surface-900/50 p-3">
				<label class="block text-sm font-semibold text-text-secondary" for="cli-{task.id}">
					{index + 1}. {task.label}
				</label>
				<div class="mt-2 flex items-start gap-2">
					<span class="mt-2 shrink-0 font-mono text-sm text-accent">{shell}</span>
					<input
						id="cli-{task.id}"
						class="min-h-11 w-full rounded border px-3 py-2 font-mono text-sm text-text-primary {disabled
							? correct === current
								? 'border-success/50 bg-success/5'
								: 'border-danger/50 bg-danger/5'
							: 'border-border bg-bg-base'}"
						type="text"
						spellcheck="false"
						autocapitalize="off"
						autocomplete="off"
						placeholder={task.placeholder}
						value={current}
						disabled={disabled}
						list="cli-tokens-{task.id}"
						onfocus={() => (focusedTask = task.id)}
						oninput={(event) => update(task.id, event.currentTarget.value)}
					/>
					<datalist id="cli-tokens-{task.id}">
						{#each tokenList(task) as token (token)}
							<option value={token}></option>
						{/each}
					</datalist>
				</div>
				{#if disabled && correct && current.trim() !== correct}
					<p class="mt-2 font-mono text-xs leading-snug text-success">Expected: {correct}</p>
				{/if}
			</div>
		{/each}
	</div>

	<div>
		<p class="mb-2 text-xs font-semibold uppercase tracking-wide text-text-muted">
			Allowed tokens — tap to insert into the focused command
		</p>
		<div class="flex flex-wrap gap-2">
			{#each vocabulary as token (token)}
				<button
					class="min-h-11 rounded border border-border bg-surface-900/60 px-3 py-1.5 font-mono text-xs text-text-primary transition hover:border-accent hover:text-accent disabled:opacity-40"
					type="button"
					disabled={disabled}
					onclick={() => insertToken(token)}>{token}</button
				>
			{/each}
		</div>
	</div>
</div>
