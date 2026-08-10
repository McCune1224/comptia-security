import { describe, expect, it } from 'vitest';
import { createQuizRepository, createScopedRepo, type Scope } from './db';

const alexSec: Scope = { profileId: 'default', courseId: 'secp-701' };
const ashSec: Scope = { profileId: 'ash', courseId: 'secp-701' };
const alexAplus: Scope = { profileId: 'default', courseId: 'aplus-1201' };

describe('scoped read cache', () => {
	it('keeps profile and course dimensions in distinct cache keys', () => {
		const repository = createQuizRepository(':memory:');
		const alex = createScopedRepo(repository, alexSec);
		const ash = createScopedRepo(repository, ashSec);
		const aplus = createScopedRepo(repository, alexAplus);

		expect(alex.getCourseModules()).toHaveLength(4);
		expect(ash.getCourseModules()).toHaveLength(4);
		expect(aplus.getCourseModules()).not.toEqual(alex.getCourseModules());
		expect(alex.getCourseModules()).toEqual(alex.getCourseModules());
		expect(repository.getCacheStats()).toMatchObject({ hits: 3, misses: 3, dbReads: 3 });
		repository.close();
	});

	it('counts cache hits as avoided database reads and fresh repositories start empty', () => {
		const first = createQuizRepository(':memory:');
		const scoped = createScopedRepo(first, alexSec);

		scoped.getCourseLessons();
		scoped.getCourseLessons();
		scoped.getCourseLessons();
		expect(first.getCacheStats()).toMatchObject({ hits: 2, misses: 1, dbReads: 1 });
		first.close();

		const fresh = createQuizRepository(':memory:');
		expect(fresh.getCacheStats()).toEqual({ hits: 0, misses: 0, dbReads: 0, bypasses: 0 });
		fresh.close();
	});

	it('invalidates cached course projections after a scoped write', () => {
		const repository = createQuizRepository(':memory:');
		const scoped = createScopedRepo(repository, alexSec);

		scoped.getCourseAssignments();
		scoped.setExamDate('2026-12-31');
		scoped.getCourseAssignments();

		expect(repository.getCacheStats()).toMatchObject({ hits: 0, misses: 2, dbReads: 2 });
		repository.close();
	});

	it('never caches mutable session and evaluation reads', () => {
		const repository = createQuizRepository(':memory:');
		const scoped = createScopedRepo(repository, alexSec);

		scoped.getActiveSession();
		scoped.getSession('missing');
		scoped.getAllDomainProgress();
		scoped.getRecentSessions();
		scoped.getAllCompletedSessions();
		scoped.getWeakTopics();
		scoped.getSubmissions();
		expect(repository.getCacheStats()).toMatchObject({
			hits: 0,
			misses: 0,
			dbReads: 0,
			bypasses: 7
		});
		repository.close();
	});
});
