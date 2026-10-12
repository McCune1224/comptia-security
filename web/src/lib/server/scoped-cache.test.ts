import { describe, expect, it } from 'vitest';
import { createScopedRepo, type Scope } from './db';
import { createTestRepository } from './test-db';

const alexSec: Scope = { profileId: 'default', courseId: 'secp-701' };
const ashSec: Scope = { profileId: 'ash', courseId: 'secp-701' };
const alexAplus: Scope = { profileId: 'default', courseId: 'aplus-1201' };

describe('scoped read cache', () => {
	it('keeps profile and course dimensions in distinct cache keys', async () => {
		const repository = await createTestRepository();
		const alex = createScopedRepo(repository, alexSec);
		const ash = createScopedRepo(repository, ashSec);
		const aplus = createScopedRepo(repository, alexAplus);

		expect(await alex.getCourseModules()).toHaveLength(4);
		expect(await ash.getCourseModules()).toHaveLength(4);
		expect(await aplus.getCourseModules()).not.toEqual(await alex.getCourseModules());
		expect(await alex.getCourseModules()).toEqual(await alex.getCourseModules());
		expect(repository.getCacheStats()).toMatchObject({ hits: 3, misses: 3, dbReads: 3 });
		await repository.close();
	});

	it('counts cache hits as avoided database reads and fresh repositories start empty', async () => {
		const first = await createTestRepository();
		const scoped = createScopedRepo(first, alexSec);

		await scoped.getCourseLessons();
		await scoped.getCourseLessons();
		await scoped.getCourseLessons();
		expect(first.getCacheStats()).toMatchObject({ hits: 2, misses: 1, dbReads: 1 });
		await first.close();

		const fresh = await createTestRepository();
		expect(fresh.getCacheStats()).toEqual({ hits: 0, misses: 0, dbReads: 0, bypasses: 0 });
		await fresh.close();
	});

	it('invalidates cached course projections after a scoped write', async () => {
		const repository = await createTestRepository();
		const scoped = createScopedRepo(repository, alexSec);

		await scoped.getCourseAssignments();
		await scoped.setExamDate('2026-12-31');
		await scoped.getCourseAssignments();

		expect(repository.getCacheStats()).toMatchObject({ hits: 0, misses: 2, dbReads: 2 });
		await repository.close();
	});

	it('never caches mutable session and evaluation reads', async () => {
		const repository = await createTestRepository();
		const scoped = createScopedRepo(repository, alexSec);
		// An active session in scope forces getActiveSession down its read path,
		// so every mutable read below genuinely bypasses the cache.
		await repository.createSession({
			id: 'cache-bypass-session',
			type: 'quiz',
			mode: 'practice',
			domain: 1,
			startedAt: '2026-07-22T12:00:00.000Z',
			deadlineAt: null,
			questions: [
				{
					id: 'pbq-cache-bypass',
					domain: 1,
					objective: '1.1',
					format: 'pbq',
					prompt: 'Cache bypass probe.',
					explanation: 'Synthetic.',
					sourceRefs: [{ source: 'exam-objectives', section: '1.1' }],
					kind: 'single-choice',
					options: [
						{ id: 'a', text: 'Option A', rationale: 'Correct.' },
						{ id: 'b', text: 'Option B', rationale: 'Wrong.' }
					],
					correctOptionIds: ['a'],
					selectCount: 1
				}
			]
		});

		await scoped.getActiveSession();
		await scoped.getSession('missing');
		await scoped.getAllDomainProgress();
		await scoped.getRecentSessions();
		await scoped.getAllCompletedSessions();
		await scoped.getWeakTopics();
		await scoped.getSubmissions();
		// 8 bypasses: getActiveSession counts two (the active-session probe plus
		// the owned-session read), every other mutable read counts one.
		expect(repository.getCacheStats()).toMatchObject({
			hits: 0,
			misses: 0,
			dbReads: 0,
			bypasses: 8
		});
		await repository.close();
	});
});
