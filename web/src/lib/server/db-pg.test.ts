import { describe, expect, it } from 'vitest';
import postgres from 'postgres';
import { createTestRepository, testDatabaseUrl } from './test-db';
import { createScopedRepo, MAX_PROFILES } from './db';
import type { QuizResult } from '$lib/types';

const emptyDomainBreakdown = () => ({
	1: { earnedPoints: 0, possiblePoints: 0, fullyCorrect: 0, totalQuestions: 0 },
	2: { earnedPoints: 0, possiblePoints: 0, fullyCorrect: 0, totalQuestions: 0 },
	3: { earnedPoints: 0, possiblePoints: 0, fullyCorrect: 0, totalQuestions: 0 },
	4: { earnedPoints: 0, possiblePoints: 0, fullyCorrect: 0, totalQuestions: 0 },
	5: { earnedPoints: 0, possiblePoints: 0, fullyCorrect: 0, totalQuestions: 0 }
});

describe('postgres repository', () => {
	it('reaches the seeded shape directly with both profiles and course content', async () => {
		const repo = await createTestRepository();
		const profiles = await repo.getProfiles();
		expect(profiles).toHaveLength(2);
		expect(profiles.map((p) => p.id)).toEqual(['default', 'ash']);
		expect(profiles.find((p) => p.id === 'default')).toMatchObject({
			id: 'default',
			name: 'Alex',
			courseId: 'secp-701'
		});
		expect(profiles.find((p) => p.id === 'ash')).toMatchObject({
			id: 'ash',
			name: 'Ash',
			courseId: 'aplus-1201'
		});
		expect(await repo.getExamDate()).toMatch(/^\d{4}-\d{2}-\d{2}$/);
		expect(await repo.getCourseModules()).toHaveLength(4);
		expect(await repo.getCourseLessons()).toHaveLength(7);
		expect(await repo.getCourseAssignments()).toHaveLength(12);
		expect(await repo.getActiveSession()).toBeNull();
		expect(await repo.getReviewCards()).toHaveLength(0);
		await repo.close();
	});

	it('keeps two profiles completely isolated (sessions, review cards, exam dates, submissions, study log)', async () => {
		const repo = await createTestRepository();
		const alice = createScopedRepo(repo, { profileId: 'alice', courseId: 'secp-701' });
		const bob = createScopedRepo(repo, { profileId: 'bob', courseId: 'secp-701' });

		await alice.createSession({
			id: 'a-sess',
			type: 'quiz',
			mode: 'practice',
			domain: 1,
			startedAt: '2026-08-05T10:00:00.000Z',
			deadlineAt: null,
			questions: []
		});
		expect((await alice.getActiveSession())?.summary.id).toBe('a-sess');
		expect(await bob.getActiveSession()).toBeNull();
		expect(await bob.getSession('a-sess')).toBeNull(); // cross-scope session lookup is a miss

		await alice.upsertReviewCard({
			questionId: 'q-1',
			intervalDays: 2,
			ease: 2.5,
			lapses: 0,
			dueAt: '2026-08-07',
			lastResult: 'correct',
			reviewCount: 1,
			firstSeenAt: '2026-08-05T00:00:00.000Z'
		});
		expect(await alice.getReviewCards()).toHaveLength(1);
		expect(await bob.getReviewCards()).toHaveLength(0);

		await alice.setExamDate('2026-10-15');
		expect(await alice.getExamDate()).toBe('2026-10-15');
		expect(await bob.getExamDate()).not.toBe('2026-10-15');

		await alice.recordStudyDay('2026-08-05', 20, '2026-08-05T10:00:00.000Z');
		expect(await alice.getStudyLog()).toHaveLength(1);
		expect(await bob.getStudyLog()).toHaveLength(0);

		await alice.recordSubmission({
			assignmentId: 'a1-1',
			sessionId: 'a-sess',
			earned: 18,
			percentage: 90,
			completedAt: '2026-08-05T10:00:00.000Z'
		});
		expect(await alice.getSubmissions()).toHaveLength(1);
		expect(await bob.getSubmissions()).toHaveLength(0);

		await alice.saveGoogleOAuth({
			accessToken: 'a',
			refreshToken: 'r',
			expiresAt: 1,
			email: 'a@example.com'
		});
		expect((await alice.getGoogleOAuth())?.email).toBe('a@example.com');
		expect(await bob.getGoogleOAuth()).toBeNull();

		await alice.recordSyncedEvent(
			'exam',
			'evt-1',
			'Exam',
			'2026-10-15',
			'2026-08-05T00:00:00.000Z'
		);
		expect(await alice.getSyncedEvents()).toHaveLength(1);
		expect(await bob.getSyncedEvents()).toHaveLength(0);

		// Scoped state updates must not let another profile mutate the session.
		await bob.updateState('a-sess', 1, undefined, '2026-08-05T10:04:00.000Z');
		expect(((await alice.getSession('a-sess')) as { currentIndex: number }).currentIndex).toBe(0);

		// Abandoning in one scope never touches the other scope's session.
		expect(await bob.abandon('a-sess', '2026-08-05T10:05:00.000Z')).toBe(false);
		expect(await alice.getActiveSession()).not.toBeNull();
		expect(await alice.abandon('a-sess', '2026-08-05T10:05:00.000Z')).toBe(true);
		await repo.close();
	});

	it('isolates a completed session across scopes end-to-end (answers + domain progress)', async () => {
		const repo = await createTestRepository();
		const alice = createScopedRepo(repo, { profileId: 'alice', courseId: 'secp-701' });
		const bob = createScopedRepo(repo, { profileId: 'bob', courseId: 'secp-701' });

		await alice.createSession({
			id: 's1',
			type: 'quiz',
			mode: 'practice',
			domain: 1,
			startedAt: '2026-08-05T10:00:00.000Z',
			deadlineAt: null,
			questions: []
		});
		const result = {
			sessionId: 's1',
			type: 'quiz' as const,
			mode: 'practice' as const,
			earnedPoints: 0,
			possiblePoints: 0,
			percentage: 0,
			fullyCorrect: 0,
			totalQuestions: 0,
			flaggedQuestionIndexes: [],
			objectiveBreakdown: {},
			domainBreakdown: emptyDomainBreakdown(),
			completedAt: '2026-08-05T10:30:00.000Z',
			review: []
		} as unknown as QuizResult;
		await expect(bob.complete('s1', result, [], '2026-08-05T10:30:00.000Z')).rejects.toThrow(
			'outside the active scope'
		);
		expect(await bob.getAllCompletedSessions()).toHaveLength(0);
		expect(await alice.getAllCompletedSessions()).toHaveLength(0);
		await alice.complete('s1', result, [], '2026-08-05T10:30:00.000Z');
		expect(await alice.getAllCompletedSessions()).toHaveLength(1);
		expect(await bob.getAllCompletedSessions()).toHaveLength(0);
		expect(await bob.getSession('s1')).toBeNull();
		await repo.close();
	});

	it('persists elapsed/duration seconds on completion and is idempotent on re-complete', async () => {
		const repo = await createTestRepository();
		const scoped = createScopedRepo(repo, { profileId: 'default', courseId: 'secp-701' });
		await scoped.createSession({
			id: 'timing-1',
			type: 'quiz',
			mode: 'practice',
			domain: 1,
			startedAt: '2026-08-10T12:00:00.000Z',
			deadlineAt: null,
			questions: []
		});
		const result = {
			sessionId: 'timing-1',
			type: 'quiz',
			mode: 'practice',
			totalQuestions: 0,
			fullyCorrect: 0,
			earnedPoints: 0,
			possiblePoints: 0,
			percentage: 0,
			flaggedQuestionIndexes: [],
			domainBreakdown: emptyDomainBreakdown(),
			objectiveBreakdown: {},
			completedAt: '2026-08-10T12:00:12.000Z',
			elapsedSeconds: 12,
			durationSeconds: 12,
			review: []
		} as unknown as QuizResult;

		const first = await scoped.complete('timing-1', result, [], result.completedAt);
		expect(first).toEqual({ result, finalized: true });
		// Second completion returns the stored result, not a new finalize.
		const second = await scoped.complete('timing-1', result, [], result.completedAt);
		expect(second).toEqual({ result, finalized: false });

		const url = testDatabaseUrl();
		const check = postgres(url, { max: 1 });
		try {
			const persisted =
				await check`SELECT elapsed_seconds, duration_seconds, status FROM quiz_sessions WHERE id = 'timing-1'`;
			expect(persisted[0]).toEqual({
				elapsed_seconds: 12,
				duration_seconds: 12,
				status: 'completed'
			});
		} finally {
			await check.end({ timeout: 5 });
		}
		await repo.close();
	});

	it('enforces one active session per scope in the database', async () => {
		const repo = await createTestRepository();
		const scoped = createScopedRepo(repo, { profileId: 'default', courseId: 'secp-701' });
		const base = {
			type: 'quiz' as const,
			mode: 'practice' as const,
			domain: 1,
			deadlineAt: null,
			questions: []
		};
		await scoped.createSession({ ...base, id: 'active-1', startedAt: '2026-08-01T09:00:00.000Z' });
		await expect(
			scoped.createSession({ ...base, id: 'active-2', startedAt: '2026-08-01T10:00:00.000Z' })
		).rejects.toThrow(/quiz_sessions_one_active_scope|duplicate key/i);
		await repo.close();
	});

	it('seed() heals course_id drift (content upserts re-stamp the owning course)', async () => {
		const repo = await createTestRepository();
		const url = testDatabaseUrl();
		const damage = postgres(url, { max: 1 });
		try {
			// Simulate rows stamped with the wrong course (the historical A+ bug).
			await damage`UPDATE course_modules SET course_id = 'secp-701' WHERE id LIKE 'ap1-%' OR id LIKE 'ap2-%'`;
			await damage`UPDATE course_assignments SET course_id = 'secp-701' WHERE id LIKE 'ap1-%' OR id LIKE 'ap2-%'`;
		} finally {
			await damage.end({ timeout: 5 });
		}

		await repo.seed();

		const healed = postgres(url, { max: 1 });
		try {
			const modules =
				await healed`SELECT course_id, COUNT(*)::int AS c FROM course_modules GROUP BY course_id ORDER BY course_id`;
			expect(modules).toEqual([
				{ course_id: 'aplus-1201', c: 4 },
				{ course_id: 'aplus-1202', c: 4 },
				{ course_id: 'secp-701', c: 4 }
			]);
			const assignments =
				await healed`SELECT course_id, COUNT(*)::int AS c FROM course_assignments GROUP BY course_id ORDER BY course_id`;
			expect(assignments).toEqual([
				{ course_id: 'aplus-1201', c: 12 },
				{ course_id: 'aplus-1202', c: 12 },
				{ course_id: 'secp-701', c: 12 }
			]);
		} finally {
			await healed.end({ timeout: 5 });
		}
		await repo.close();
	});
});

describe('profile management', () => {
	it('enforces the hard cap of two profiles (Alex + Ash seeded)', async () => {
		const repo = await createTestRepository();
		expect(await repo.getProfiles()).toHaveLength(2);
		await expect(repo.createProfile('Third', '#E0B66A')).rejects.toThrow(`cap of ${MAX_PROFILES}`);
		await repo.renameProfile('ash', 'Ash B');
		expect((await repo.getProfiles()).find((p) => p.id === 'ash')?.name).toBe('Ash B');
		await repo.close();
	});

	it("remembers each profile's course (profile→course coupling)", async () => {
		const repo = await createTestRepository();
		expect((await repo.getProfiles()).find((p) => p.id === 'default')?.courseId).toBe('secp-701');
		expect((await repo.getProfiles()).find((p) => p.id === 'ash')?.courseId).toBe('aplus-1201');

		// Switching courses updates the active profile's preference.
		await repo.setProfileCourse('ash', 'aplus-1202');
		expect((await repo.getProfiles()).find((p) => p.id === 'ash')?.courseId).toBe('aplus-1202');

		// New profiles inherit the caller-provided course.
		await repo.deleteProfile('ash');
		const created = await repo.createProfile('New', '#D894B8', 'aplus-1201');
		expect(created.courseId).toBe('aplus-1201');
		await repo.close();
	});

	it('deleting a profile removes its data and frees the cap; default is protected', async () => {
		const repo = await createTestRepository();
		const scope = createScopedRepo(repo, { profileId: 'ash', courseId: 'secp-701' });
		await scope.setExamDate('2026-11-01');
		await scope.recordStudyDay('2026-08-05', 5, '2026-08-05T00:00:00.000Z');
		await scope.createSession({
			id: 'ash-sess',
			type: 'quiz',
			mode: 'practice',
			domain: null,
			startedAt: '2026-08-05T10:00:00.000Z',
			deadlineAt: null,
			questions: []
		});

		await expect(repo.deleteProfile('default')).rejects.toThrow(
			'default profile cannot be deleted'
		);
		await repo.deleteProfile('ash');
		expect((await repo.getProfiles()).map((p) => p.id)).toEqual(['default']);
		expect(await repo.getProfiles()).toHaveLength(1);
		// Data for the deleted profile is gone.
		expect(
			await createScopedRepo(repo, { profileId: 'ash', courseId: 'secp-701' }).getStudyLog()
		).toHaveLength(0);
		expect(
			await createScopedRepo(repo, { profileId: 'ash', courseId: 'secp-701' }).getActiveSession()
		).toBeNull();
		// Cap freed.
		await repo.createProfile('New', '#67B8A8');
		expect(await repo.getProfiles()).toHaveLength(2);
		await repo.close();
	});
});
