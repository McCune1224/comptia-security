// shared domain names, progress helpers — single source across all components
export const DOMAIN_NAMES: Record<number, string> = {
	1: 'General Security Concepts',
	2: 'Threats, Vulnerabilities, Mitigations',
	3: 'Security Architecture',
	4: 'Security Operations',
	5: 'Security Program Management'
};

/** All SY0-701 objectives in canonical order, grouped by domain. */
export const OBJECTIVES_BY_DOMAIN: Record<number, string[]> = {
	1: ['1.1', '1.2', '1.3', '1.4'],
	2: ['2.1', '2.2', '2.3', '2.4', '2.5'],
	3: ['3.1', '3.2', '3.3', '3.4'],
	4: ['4.1', '4.2', '4.3', '4.4', '4.5', '4.6', '4.7', '4.8', '4.9'],
	5: ['5.1', '5.2', '5.3', '5.4', '5.5', '5.6']
};

export function getPercentColor(pct: number): string {
	if (pct >= 85) return 'text-success';
	if (pct >= 60) return 'text-warning';
	return 'text-danger';
}

export function getBarColor(pct: number): string {
	if (pct >= 85) return 'bg-success';
	if (pct >= 60) return 'bg-warning';
	return 'bg-danger';
}

export function getScoreLabel(pct: number): string {
	if (pct >= 90) return 'Excellent';
	if (pct >= 75) return 'Good';
	if (pct >= 60) return 'Fair';
	return 'Needs Work';
}

export function formatDate(date: Date | string): string {
	let value: Date;
	if (typeof date === 'string') {
		// Treat YYYY-MM-DD as a local calendar date to avoid UTC timezone shifts.
		const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(date);
		value = match
			? new Date(Number(match[1]), Number(match[2]) - 1, Number(match[3]))
			: new Date(date);
	} else {
		value = date;
	}
	return value.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
}

export function relativeDue(days: number): string {
	if (days < 0) return `Overdue by ${-days} day${-days === 1 ? '' : 's'}`;
	if (days === 0) return 'Due today';
	if (days === 1) return 'Due tomorrow';
	return `Due in ${days} days`;
}

/**
 * Validates a calendar date key: strict YYYY-MM-DD shape AND a real calendar
 * date (2026-02-30 is rejected, not clamped). Returns the normalized key or
 * null. Shared by the client-side editors and the server API boundary.
 */
export function parseDateKey(value: unknown): string | null {
	if (typeof value !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(value)) return null;
	const [year, month, day] = value.split('-').map(Number) as [number, number, number];
	const date = new Date(year, month - 1, day);
	if (date.getFullYear() !== year || date.getMonth() !== month - 1 || date.getDate() !== day)
		return null;
	return value;
}

/**
 * Shifts a YYYY-MM-DD key by whole days using calendar arithmetic (DST-safe —
 * millisecond math drifts across a daylight-saving boundary). Used for all-day
 * calendar events, whose end is exclusive.
 */
export function addDaysToDateKey(key: string, days: number): string {
	const [year, month, day] = key.split('-').map(Number) as [number, number, number];
	const date = new Date(year, month - 1, day + days);
	const y = date.getFullYear();
	const m = String(date.getMonth() + 1).padStart(2, '0');
	const d = String(date.getDate()).padStart(2, '0');
	return `${y}-${m}-${d}`;
}
