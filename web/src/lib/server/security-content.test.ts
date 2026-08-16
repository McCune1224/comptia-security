import { describe, expect, it } from 'vitest';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { COURSE_DEFINITION } from './course';
import { loadQuestionBank, objectivesByDomain } from './question-bank';
import type { QuestionDefinition } from './question-bank';

interface CoverageTopic {
	id: string;
	label: string;
	lessonId: string;
	lessonTerms: string[];
	questionIds: string[];
}
interface CoverageObjective {
	id: string;
	title: string;
	topics: CoverageTopic[];
}
interface CoverageManifest {
	exam: string;
	objectivesVersion: string;
	objectives: CoverageObjective[];
}

const manifest = JSON.parse(
	readFileSync(resolve(process.cwd(), 'src/lib/server/data/security-objective-coverage.json'), 'utf8')
) as CoverageManifest;

const EXPECTED_OBJECTIVES = [
	'1.1', '1.2', '1.3', '1.4',
	'2.1', '2.2', '2.3', '2.4', '2.5',
	'3.1', '3.2', '3.3', '3.4',
	'4.1', '4.2', '4.3', '4.4', '4.5', '4.6', '4.7', '4.8', '4.9',
	'5.1', '5.2', '5.3', '5.4', '5.5', '5.6'
];

const bank = loadQuestionBank();
const allQuestions = [...bank.mcqs, ...bank.pbqs] as QuestionDefinition[];
const byId = new Map(allQuestions.map((q) => [q.id, q]));
const lessonsById = new Map(COURSE_DEFINITION.lessons.map((l) => [l.id, l]));

describe('SY0-701 official-objective coverage manifest', () => {
	it('identifies the exam and exactly the 28 registered Security+ objectives', () => {
		expect(manifest.exam).toBe('SY0-701');
		expect(manifest.objectivesVersion).toBe('5.0');
		expect(manifest.objectives.map((o) => o.id)).toEqual(EXPECTED_OBJECTIVES);
		for (const objective of manifest.objectives) {
			expect(objectivesByDomain[Number(objective.id[0]) as 1 | 2 | 3 | 4 | 5]).toContain(objective.id);
		}
	});

	it('uses unique topic ids and non-empty mappings', () => {
		const ids = manifest.objectives.flatMap((o) => o.topics.map((t) => t.id));
		expect(new Set(ids).size).toBe(ids.length);
		expect(ids.length).toBeGreaterThan(0);
		for (const objective of manifest.objectives) {
			for (const topic of objective.topics) {
				expect(topic.id.startsWith(`${objective.id}-`), topic.id).toBe(true);
				expect(topic.label.trim().length, topic.id).toBeGreaterThan(0);
				expect(topic.lessonId, topic.id).toBeTruthy();
				expect(topic.lessonTerms.length, topic.id).toBeGreaterThan(0);
				expect(topic.questionIds.length, topic.id).toBeGreaterThan(0);
				expect(new Set(topic.questionIds).size, topic.id).toBe(topic.questionIds.length);
			}
		}
	});

	it('maps every topic to a registered lesson', () => {
		for (const objective of manifest.objectives) {
			for (const topic of objective.topics) {
				const lesson = lessonsById.get(topic.lessonId);
				expect(lesson, `${topic.id} -> ${topic.lessonId}`).toBeDefined();
			}
		}
	});

	it('maps every topic to existing questions that agree on objective', () => {
		for (const objective of manifest.objectives) {
			for (const topic of objective.topics) {
				for (const questionId of topic.questionIds) {
					const question = byId.get(questionId);
					expect(question, `${topic.id} -> ${questionId} exists`).toBeDefined();
					expect(question?.objective, `${topic.id} -> ${questionId} objective`).toBe(objective.id);
				}
			}
		}
	});

	it('assigns every topic to a lesson whose objectiveIds include the topic objective', () => {
		for (const objective of manifest.objectives) {
			for (const topic of objective.topics) {
				const lesson = lessonsById.get(topic.lessonId)!;
				expect(lesson.objectiveIds, `${topic.id} lesson objectiveIds`).toContain(objective.id);
			}
		}
	});

	it('requires every lesson to contain every mapped lesson term', () => {
		for (const objective of manifest.objectives) {
			for (const topic of objective.topics) {
				const lesson = lessonsById.get(topic.lessonId)!;
				for (const term of topic.lessonTerms) {
					expect(
						lesson.content.toLowerCase().includes(term.toLowerCase()),
						`${topic.id}: lesson ${topic.lessonId} must contain "${term}"`
					).toBe(true);
				}
			}
		}
	});
});
