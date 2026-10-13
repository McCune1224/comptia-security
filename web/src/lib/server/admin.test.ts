import { describe, expect, it } from 'vitest';
import type { QuizResult } from '$lib/types';
import { createCourseService } from './course-service';
import { createScopedRepo, type QuizRepository, type Scope } from './db';
import { ProgressBackupError, parseProgressBackup, type ProgressBackup } from './backup';
import { createTestRepository } from './test-db';

const TARGET: Scope = { profileId: 'default', courseId: 'secp-701' };
const SAME_PROFILE_OTHER_COURSE: Scope = { profileId: 'default', courseId: 'aplus-1201' };
const OTHER_PROFILE: Scope = { profileId: 'ash', courseId: 'aplus-1201' };

function emptyDomainBreakdown() {
	return {
		1: { earnedPoints: 0, possiblePoints: 0, fullyCorrect: 0, totalQuestions: 0 },
		2: { earnedPoints: 0, possiblePoints: 0, fullyCorrect: 0, totalQuestions: 0 },
		3: { earnedPoints: 0, possiblePoints: 0, fullyCorrect: 0, totalQuestions: 0 },
		4: { earnedPoints: 0, possiblePoints: 0, fullyCorrect: 0, totalQuestions: 0 },
		5: { earnedPoints: 0, possiblePoints: 0, fullyCorrect: 0, totalQuestions: 0 }
	};
}

function resultFor(sessionId: string, completedAt: string): QuizResult {
	const breakdown = emptyDomainBreakdown();
	breakdown[1] = { earnedPoints: 15, possiblePoints: 20, fullyCorrect: 15, totalQuestions: 20 };
	return {
		sessionId,
		type: 'quiz',
		mode: 'practice',
		earnedPoints: 15,
		possiblePoints: 20,
		percentage: 75,
		fullyCorrect: 15,
		totalQuestions: 20,
		flaggedQuestionIndexes: [],
		objectiveBreakdown: {},
		domainBreakdown: breakdown,
		completedAt,
		review: []
	} as unknown as QuizResult;
}

/** Seeds a full progress footprint into one scope: session+state+response, answers, domain progress, review card, study day, submission, lesson completion. */
async function seedProgress(repo: QuizRepository, scope: Scope, tag: string): Promise<void> {
	const scoped = createScopedRepo(repo, scope);
	const sessionId = `sess-${tag}`;
	await scoped.createSession({
		id: sessionId,
		type: 'quiz',
		mode: 'practice',
		domain: 1,
		startedAt: '2026-08-05T10:00:00.000Z',
		deadlineAt: null,
		questions: []
	});
	await scoped.saveResponse(sessionId, 0, { choice: 2 } as never, '2026-08-05T10:01:00.000Z');
	const assignmentId = scope.courseId === 'secp-701' ? 'a1-1' : 'ap1-1';
	const lessonId = scope.courseId === 'secp-701' ? 'lesson-1-1' : 'ap1-lesson-1-1';
	await scoped.complete(
		sessionId,
		resultFor(sessionId, '2026-08-05T10:30:00.000Z'),
		[],
		'2026-08-05T10:30:00.000Z'
	);
	await scoped.upsertReviewCard({
		questionId: `q-${tag}`,
		intervalDays: 2,
		ease: 2.5,
		lapses: 0,
		dueAt: '2026-08-07',
		lastResult: 'correct',
		reviewCount: 1,
		firstSeenAt: '2026-08-05T00:00:00.000Z'
	});
	await scoped.recordStudyDay('2026-08-05', 20, '2026-08-05T10:30:00.000Z');
	await scoped.recordSubmission({
		assignmentId,
		sessionId,
		earned: 15,
		percentage: 75,
		completedAt: '2026-08-05T10:30:00.000Z'
	});
	await scoped.setLessonCompleted(lessonId, true);
}

describe('scoped progress reset', () => {
	it('wipes every progress row for the active profile+course and leaves everything else intact', async () => {
		const repo = await createTestRepository();
		await seedProgress(repo, TARGET, 'target');
		await seedProgress(repo, SAME_PROFILE_OTHER_COURSE, 'other-course');
		await seedProgress(repo, OTHER_PROFILE, 'other-profile');

		// Configuration set on the target scope must survive the reset.
		const target = createScopedRepo(repo, TARGET);
		await target.setExamDate('2026-10-15');
		await target.setDueDateOverride('a1-1', '2026-09-30');

		const service = createCourseService({ repository: target, courseId: TARGET.courseId });
		await service.setExamDate('2026-10-15'); // idempotent no-op, keeps expectations explicit

		await target.resetProgress();

		// Target scope: all progress gone.
		expect(await target.getActiveSession()).toBeNull();
		expect(await target.getAllCompletedSessions()).toHaveLength(0);
		expect(await target.getReviewCards()).toHaveLength(0);
		expect(await target.getStudyLog()).toHaveLength(0);
		expect(await target.getAllDomainProgress()).toEqual({});
		// Submission/completion reads are profile-scoped, so the surviving rows of
		// the profile's OTHER course still show up — assert per course instead.
		const remainingSubmissions = await target.getSubmissions();
		expect(remainingSubmissions.map((submission) => submission.assignmentId)).toEqual(['ap1-1']);
		expect(await target.getLessonCompletions()).toEqual(new Set(['ap1-lesson-1-1']));
		// Study days are per-profile by design — the whole profile's log is wiped.
		expect(await createScopedRepo(repo, SAME_PROFILE_OTHER_COURSE).getStudyLog()).toHaveLength(0);

		// Configuration survives.
		expect(await target.getExamDate()).toBe('2026-10-15');
		expect(await target.getDueDateOverrides()).toEqual({ 'a1-1': '2026-09-30' });
		// Course content untouched.
		expect(await target.getCourseAssignments()).toHaveLength(12);

		// Same profile, OTHER course: every progress row intact (study log excepted, per-profile).
		const otherCourse = createScopedRepo(repo, SAME_PROFILE_OTHER_COURSE);
		expect(await otherCourse.getAllCompletedSessions()).toHaveLength(1);
		expect(await otherCourse.getReviewCards()).toHaveLength(1);
		expect(await otherCourse.getSubmissions()).toHaveLength(1);
		expect(await otherCourse.getLessonCompletions()).toEqual(new Set(['ap1-lesson-1-1']));
		expect(Object.keys(await otherCourse.getAllDomainProgress())).toEqual(['1']);

		// OTHER profile: completely intact, study log included.
		const ash = createScopedRepo(repo, OTHER_PROFILE);
		expect(await ash.getAllCompletedSessions()).toHaveLength(1);
		expect(await ash.getReviewCards()).toHaveLength(1);
		expect(await ash.getSubmissions()).toHaveLength(1);
		expect(await ash.getStudyLog()).toHaveLength(1);
		expect(await ash.getLessonCompletions()).toEqual(new Set(['ap1-lesson-1-1']));

		await repo.close();
	});

	it('resets are idempotent (resetting an empty scope succeeds)', async () => {
		const repo = await createTestRepository();
		const target = createScopedRepo(repo, TARGET);
		await target.resetProgress();
		await target.resetProgress();
		expect(await target.getAllCompletedSessions()).toHaveLength(0);
		await repo.close();
	});
});

describe('progress backup + restore', () => {
	it('exports, wipes, and restores the full scope: a verified round trip', async () => {
		const repo = await createTestRepository();
		await seedProgress(repo, TARGET, 'target');
		const target = createScopedRepo(repo, TARGET);
		await target.setExamDate('2026-10-15');
		await target.setDueDateOverride('a1-1', '2026-09-30');

		const original: ProgressBackup = await target.exportProgress();
		expect(original.courseId).toBe('secp-701');
		expect(original.examDate).toBe('2026-10-15');
		expect(original.dueDateOverrides).toEqual({ 'a1-1': '2026-09-30' });
		expect(original.sessions).toHaveLength(1);
		expect(original.sessions[0].answers).toHaveLength(0); // complete() was called with no answer rows
		expect(original.sessions[0].responses).toHaveLength(1);
		expect(original.sessions[0].state).not.toBeNull();
		expect(original.domainProgress).toEqual([
			{
				domain: 1,
				totalAttempted: 20,
				totalCorrect: 15,
				pointsEarned: 15,
				pointsPossible: 20,
				lastReviewedAt: '2026-08-05T10:30:00.000Z'
			}
		]);
		expect(original.reviewCards).toHaveLength(1);
		expect(original.studyLog).toHaveLength(1);
		expect(original.submissions).toHaveLength(1);
		expect(original.lessonCompletions).toEqual([
			{ lessonId: 'lesson-1-1', completedAt: expect.any(String) }
		]);

		// Damage the scope after export: new configuration, wiped progress.
		await target.setExamDate('2026-12-25');
		await target.setDueDateOverride('a1-2', '2026-12-01');
		await target.resetProgress();
		expect(await target.getAllCompletedSessions()).toHaveLength(0);

		// Restore through the same parse boundary the API uses.
		const parsed = parseProgressBackup(JSON.parse(JSON.stringify(original)));
		await target.importProgress(parsed);

		const restored: ProgressBackup = await target.exportProgress();
		expect(restored.examDate).toBe(original.examDate);
		expect(restored.dueDateOverrides).toEqual(original.dueDateOverrides);
		expect(restored.sessions).toHaveLength(original.sessions.length);
		expect(restored.reviewCards).toEqual(original.reviewCards);
		expect(restored.studyLog).toEqual(original.studyLog);
		expect(restored.domainProgress).toEqual(original.domainProgress);
		expect(restored.lessonCompletions).toEqual(original.lessonCompletions);
		// Session ids are remapped on import; everything else matches.
		expect(restored.sessions[0].id).not.toBe(original.sessions[0].id);
		const { id: _omit, ...originalSession } = original.sessions[0];
		const { id: _omit2, ...restoredSession } = restored.sessions[0];
		expect(restoredSession).toEqual(originalSession);
		// Submissions point at the remapped session.
		expect(restored.submissions).toHaveLength(1);
		expect(restored.submissions[0].sessionId).toBe(restored.sessions[0].id);
		expect(restored.submissions[0].assignmentId).toBe('a1-1');
		expect(restored.submissions[0].percentage).toBe(75);

		// The restored session is functional through the normal repository reads.
		const reopened = await target.getSession(restored.sessions[0].id);
		expect(reopened).not.toBeNull();
		expect(reopened?.responses[0]).toEqual({ choice: 2 });
		expect(reopened?.result?.percentage).toBe(75);
		expect(await target.getRecentSessions(5)).toHaveLength(1);

		await repo.close();
	});

	it('refuses to import a backup belonging to another course', async () => {
		const repo = await createTestRepository();
		const target = createScopedRepo(repo, TARGET);
		const backup = parseProgressBackup({
			format: 'course-progress-backup',
			version: 1,
			courseId: 'aplus-1201',
			exportedAt: '2026-08-05T00:00:00.000Z',
			examDate: '2026-10-15',
			dueDateOverrides: {},
			sessions: [],
			domainProgress: [],
			reviewCards: [],
			studyLog: [],
			submissions: [],
			lessonCompletions: []
		});
		await expect(target.importProgress(backup)).rejects.toThrow(
			/aplus-1201.*secp-701|secp-701.*aplus-1201/
		);
		await repo.close();
	});
});

describe('backup parser (import boundary)', () => {
	const validBackup = {
		format: 'course-progress-backup',
		version: 1,
		courseId: 'secp-701',
		exportedAt: '2026-08-05T00:00:00.000Z',
		examDate: '2026-10-15',
		dueDateOverrides: { 'a1-1': '2026-09-30' },
		sessions: [
			{
				id: 's1',
				startedAt: '2026-08-05T10:00:00.000Z',
				completedAt: null,
				type: 'quiz',
				domain: 1,
				totalQuestions: 0,
				correctAnswers: 0,
				mode: 'practice',
				status: 'active',
				pointsEarned: 0,
				pointsPossible: 0,
				updatedAt: '2026-08-05T10:00:00.000Z',
				assignmentId: null,
				elapsedSeconds: null,
				durationSeconds: null,
				state: {
					deadlineAt: null,
					currentIndex: 0,
					questionsJson: '[]',
					resultJson: null
				},
				responses: [],
				answers: []
			}
		],
		domainProgress: [],
		reviewCards: [],
		studyLog: [],
		submissions: [],
		lessonCompletions: []
	};

	it('parses a valid document and preserves overrides', () => {
		const backup = parseProgressBackup(structuredClone(validBackup));
		expect(backup.dueDateOverrides).toEqual({ 'a1-1': '2026-09-30' });
		expect(backup.sessions[0].state?.questionsJson).toBe('[]');
	});

	it('rejects wrong format, version, and shapes with readable reasons', () => {
		expect(() => parseProgressBackup({ ...validBackup, format: 'other' })).toThrow(
			ProgressBackupError
		);
		expect(() => parseProgressBackup({ ...validBackup, version: 2 })).toThrow(/version/);
		expect(() => parseProgressBackup({ ...validBackup, sessions: 'nope' })).toThrow(
			/sessions must be an array/
		);
		expect(() => parseProgressBackup({ ...validBackup, dueDateOverrides: { a1: 7 } })).toThrow(
			/must be a string/
		);
		const session = structuredClone(validBackup).sessions[0] as Record<string, unknown>;
		delete session.startedAt;
		expect(() => parseProgressBackup({ ...validBackup, sessions: [session] })).toThrow(/startedAt/);
		const brokenJson = structuredClone(validBackup).sessions[0] as Record<string, unknown>;
		(brokenJson.state as Record<string, unknown>).questionsJson = '{not json';
		expect(() => parseProgressBackup({ ...validBackup, sessions: [brokenJson] })).toThrow(
			/questionsJson/
		);
		const nonArrayQuestions = structuredClone(validBackup).sessions[0] as Record<string, unknown>;
		(nonArrayQuestions.state as Record<string, unknown>).questionsJson = '{"a":1}';
		expect(() => parseProgressBackup({ ...validBackup, sessions: [nonArrayQuestions] })).toThrow(
			/questionsJson/
		);
	});
});
