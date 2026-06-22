import fs from 'node:fs';
import path from 'node:path';
import type { QuizResult } from '$lib/types';
import { getAllDomainProgress, getWeakTopics, getRecentSessions } from './db';

const VAULT_ROOT = path.resolve(import.meta.dirname, '../../../../');
const INDEX_DIR = path.join(VAULT_ROOT, 'notes', '01-Index');
const MOCK_EXAMS_DIR = path.join(VAULT_ROOT, 'notes', '05-Exam-Prep', 'Mock-Exams');

const DOMAIN_NAMES: Record<number, string> = {
	1: 'General Security Concepts',
	2: 'Threats, Vulnerabilities, Mitigations',
	3: 'Security Architecture',
	4: 'Security Operations',
	5: 'Security Program Management',
};

/** Update Security+ Dashboard.md with current stats */
export function syncDashboard(): string {
	const progress = getAllDomainProgress();

	let dashboardPath = path.join(INDEX_DIR, 'Security+ Dashboard.md');
	if (!fs.existsSync(dashboardPath)) {
		// Check if the file name matches (Obsidian might use slightly different name)
		const files = fs.readdirSync(INDEX_DIR);
		const match = files.find(f => f.toLowerCase().includes('dashboard'));
		if (match) dashboardPath = path.join(INDEX_DIR, match);
		else return 'Dashboard file not found';
	}

	const totalAttempted = Object.values(progress).reduce((s, p) => s + p.attempted, 0);
	const totalCorrect = Object.values(progress).reduce((s, p) => s + p.correct, 0);
	const avgScore = totalAttempted > 0 ? Math.round((totalCorrect / totalAttempted) * 100) : 0;

	let content = fs.readFileSync(dashboardPath, 'utf-8');

	// Update domain status rows
	for (let d = 1; d <= 5; d++) {
		const p = progress[d];
		let status = '🔴 Not Started';
		if (p && p.attempted > 0) {
			if (p.percentage >= 85) status = '🟢 Mastering';
			else if (p.percentage >= 70) status = '🟡 Reviewing';
			else status = '🔴 Needs Work';
		}
		const lastReview = p?.lastReviewed
			? new Date(p.lastReviewed).toLocaleDateString()
			: '';

		// Replace the status cell and last review cell for this domain row
		content = content.replace(
			new RegExp(`(Domain ${d}: .+?\\|) .+? (\\|) .+?$`, 'm'),
			`$1 ${status} $2 ${lastReview}`
		);
	}

	// Update Stats
	content = content.replace(
		/- \\*\\*Practice Tests Taken:\\*\\* \d+/,
		`- **Practice Tests Taken:** ${countSessions()}`
	);
	content = content.replace(
		/- \\*\\*Average Score:\\*\\* \d+%/,
		`- **Average Score:** ${avgScore}%`
	);

	fs.writeFileSync(dashboardPath, content);
	return 'Dashboard updated';
}

/** Append missed topics to Weak Topics Tracker.md */
export function syncWeakTopics(): string {
	const weakTopics = getWeakTopics(2);
	if (weakTopics.length === 0) return 'No weak topics to report';

	let trackerPath = path.join(INDEX_DIR, 'Weak Topics Tracker.md');
	if (!fs.existsSync(trackerPath)) {
		const files = fs.readdirSync(INDEX_DIR);
		const match = files.find(f => f.toLowerCase().includes('weak'));
		if (match) trackerPath = path.join(INDEX_DIR, match);
		else return 'Weak Topics Tracker not found';
	}

	let content = fs.readFileSync(trackerPath, 'utf-8');

	const dateStr = new Date().toISOString().split('T')[0];

	// Add high priority items (below 70%)
	const highPriority = weakTopics.filter(t => t.percentage < 70);
	if (highPriority.length > 0) {
		const lines = highPriority.map(t =>
			`- [ ] D${t.domain} ${t.category} — ${t.correct}/${t.total} correct (${t.percentage}%)`
		).join('\n');
		// Find a good insertion point - after "## High Priority"
		if (content.includes('## High Priority')) {
			// Check if there's already content after the header
			const insertMarker = '## High Priority (Missed Multiple Times)';
			const insertIdx = content.indexOf(insertMarker);
			if (insertIdx >= 0) {
				const afterHeader = content.indexOf('\n', insertIdx) + 1;
				const existingLine = content.slice(afterHeader).split('\n')[0];
				if (existingLine.trim() === '- [ ]') {
					content = content.slice(0, afterHeader) + lines + '\n' + content.slice(afterHeader);
				} else {
					content = content.replace(
						insertMarker,
						insertMarker + '\n' + lines
					);
				}
			}
		}
	}

	// Add medium priority items (70-84%)
	const mediumPriority = weakTopics.filter(t => t.percentage >= 70 && t.percentage < 85);
	if (mediumPriority.length > 0) {
		const lines = mediumPriority.map(t =>
			`- [ ] D${t.domain} ${t.category} — ${t.correct}/${t.total} correct (${t.percentage}%)`
		).join('\n');
		if (content.includes('## Medium Priority')) {
			const insertMarker = '## Medium Priority (Missed Once)';
			const insertIdx = content.indexOf(insertMarker);
			if (insertIdx >= 0) {
				const afterHeader = content.indexOf('\n', insertIdx) + 1;
				const existingLine = content.slice(afterHeader).split('\n')[0];
				if (existingLine.trim() === '- [ ]') {
					content = content.slice(0, afterHeader) + lines + '\n' + content.slice(afterHeader);
				} else {
					content = content.replace(
						insertMarker,
						insertMarker + '\n' + lines
					);
				}
			}
		}
	}

	fs.writeFileSync(trackerPath, content);
	return 'Weak topics updated';
}

/** Write a mock exam result file */
export function writeMockExamResult(result: QuizResult): string {
	const dateStr = new Date().toISOString().split('T')[0];
	const fileName = `${dateStr}-QuizApp-${result.percentage}.md`;
	const filePath = path.join(MOCK_EXAMS_DIR, fileName);

	const domainRows = [1, 2, 3, 4, 5].map(d => {
		const b = result.domainBreakdown[d];
		if (!b) return null;
		const pct = b.total > 0 ? Math.round((b.correct / b.total) * 100) : 0;
		let icon = pct >= 85 ? '🟢' : pct >= 75 ? '🟡' : '🔴';
		const domainNames: Record<number, string> = {
			1: 'General Security Concepts',
			2: 'Threats, Vulnerabilities, Mitigations',
			3: 'Security Architecture',
			4: 'Security Operations',
			5: 'Security Program Management',
		};
		return `| ${d}. ${domainNames[d]} | ${b.total} | ${b.correct} | ${pct}% | ${icon} |`;
	}).filter(Boolean).join('\n');

	const content = `# Mock Exam - Quiz App - ${dateStr}

## Score Summary
**Total Score:** ${result.score}/${result.total} (${result.percentage}%)
**Target:** 85%+
**Type:** ${result.type}

## Domain Performance
| Domain | Questions | Correct | % | Status |
|--------|-----------|---------|---|--------|
${domainRows}

Legend:
🟢 85%+ (Good)
🟡 75-84% (Needs improvement)
🔴 <75% (Priority study area)

## Next Steps
- [ ] Review missed concepts from weak domains
- [ ] Take another practice test in 2-3 days

---

**Confidence Level:** (rate 1-10)
**Ready for Real Exam?** Yes/No
`;

	fs.writeFileSync(filePath, content);
	return `Mock exam result written to ${fileName}`;
}

/** ponytail: count via existing query, ok for MVP dataset size */
function countSessions(): number {
	try {
		return getRecentSessions(1000).length;
	} catch {
		return 0;
	}
}
