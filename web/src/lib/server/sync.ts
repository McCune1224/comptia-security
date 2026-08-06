import fs from 'node:fs';
import path from 'node:path';
import type { QuizResult } from '$lib/types';
import { createScopedRepo, DEFAULT_SCOPE, quizRepository, type Scope } from './db';

const vault = path.resolve(import.meta.dirname, '../../../../notes');
const syncFile = (relative: string, content: string, label: string) => {
	const target = path.join(vault, relative);
	if (!fs.existsSync(path.dirname(target))) return `${label}: Obsidian target directory does not exist (${path.dirname(target)}).`;
	fs.writeFileSync(target, content);
	return `${label}: synced ${target}.`;
};

export function syncDashboard(scope: Scope = DEFAULT_SCOPE): string {
	const progress = createScopedRepo(quizRepository, scope).getAllDomainProgress();
	return syncFile('QuizApp-Dashboard.md', `# Security+ Quiz Dashboard\n\n${Object.entries(progress).map(([domain, value]) => `- Domain ${domain}: ${value.earnedPoints.toFixed(2)}/${value.possiblePoints} (${value.percentage}%)`).join('\n')}\n`, 'Dashboard');
}

export function syncWeakTopics(scope: Scope = DEFAULT_SCOPE): string {
	const topics = createScopedRepo(quizRepository, scope).getWeakTopics();
	return syncFile('QuizApp-Weak-Topics.md', `# Security+ Weak Topics\n\n${topics.map((topic) => `- Objective ${topic.objective}: ${topic.earnedPoints.toFixed(2)}/${topic.possiblePoints} (${topic.percentage}%, ${topic.severity})`).join('\n')}\n`, 'Weak topics');
}

export function writeMockExamResult(result: QuizResult): string {
	const directory = path.join(vault, 'QuizApp-Exams');
	if (!fs.existsSync(directory)) return `Mock exam: Obsidian target directory does not exist (${directory}).`;
	const date = result.completedAt.slice(0, 10);
	const target = path.join(directory, `${date}-QuizApp-${result.sessionId.slice(0, 8)}-${result.percentage}.md`);
	fs.writeFileSync(target, `# Quiz App Result\n\nRaw points: ${result.earnedPoints.toFixed(2)}/${result.possiblePoints}\n\nPercentage: ${result.percentage}%\n\nFully correct: ${result.fullyCorrect}/${result.totalQuestions}\n`);
	return `Mock exam: wrote ${target}.`;
}
