// ponytail: shared domain names, progress helpers — single source across all components
export const DOMAIN_NAMES: Record<number, string> = {
	1: 'General Security Concepts',
	2: 'Threats, Vulnerabilities, Mitigations',
	3: 'Security Architecture',
	4: 'Security Operations',
	5: 'Security Program Management'
};

export function getPercentColor(pct: number): string {
	if (pct >= 85) return 'text-success';
	if (pct >= 60) return 'text-accent-warm';
	return 'text-danger';
}

export function getBarColor(pct: number): string {
	if (pct >= 85) return 'bg-success';
	if (pct >= 60) return 'bg-accent-warm';
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
