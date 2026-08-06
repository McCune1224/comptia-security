import { describe, expect, it } from 'vitest';
import { APLUS_1201_COURSE, APLUS_1202_COURSE } from './aplus-courses';
import { COURSE_DEFINITION, COURSES, ACTIVE_COURSES, COURSE_META } from './course';

const APLUS_COURSES = [APLUS_1201_COURSE, APLUS_1202_COURSE];

describe('A+ course definitions', () => {
	it('each has 4 modules, 7 lessons, and 12 assignments across all categories', () => {
		for (const course of APLUS_COURSES) {
			expect(course.modules).toHaveLength(4);
			expect(course.lessons).toHaveLength(7);
			expect(course.assignments).toHaveLength(12);
			const categories = course.assignments.map((a) => a.category);
			expect(categories.filter((c) => c === 'quiz')).toHaveLength(6);
			expect(categories.filter((c) => c === 'scenario-pbq')).toHaveLength(2);
			expect(categories.filter((c) => c === 'full')).toHaveLength(4);
			// every module/lesson/assignment id is globally unique (course_* PKs are shared)
			const ids = [
				...course.modules.map((m) => m.id),
				...course.lessons.map((l) => l.id),
				...course.assignments.map((a) => a.id)
			];
			expect(new Set(ids).size).toBe(ids.length);
		}
	});

	it('uses ids that do not collide with the Security+ course (shared DB PKs)', () => {
		const secpIds = new Set([
			...COURSE_DEFINITION.modules.map((m) => m.id),
			...COURSE_DEFINITION.lessons.map((l) => l.id),
			...COURSE_DEFINITION.assignments.map((a) => a.id)
		]);
		for (const course of APLUS_COURSES) {
			for (const id of [
				...course.modules.map((m) => m.id),
				...course.lessons.map((l) => l.id),
				...course.assignments.map((a) => a.id)
			]) {
				expect(secpIds.has(id)).toBe(false);
			}
		}
	});

	it('schedules full exams as 90Q / 90 minutes and sets the right passing scores', () => {
		expect(APLUS_1201_COURSE.passingScore).toBe(675);
		expect(APLUS_1202_COURSE.passingScore).toBe(700);
		for (const course of APLUS_COURSES) {
			for (const assignment of course.assignments.filter((a) => a.kind === 'full')) {
				expect(assignment.count).toBe(90);
				expect(assignment.durationMinutes).toBe(90);
				expect(assignment.mode).toBe('exam');
			}
		}
	});

	it('registers both cores in COURSES and COURSE_META', () => {
		expect(COURSES['aplus-1201']).toBe(APLUS_1201_COURSE);
		expect(COURSES['aplus-1202']).toBe(APLUS_1202_COURSE);
		expect(COURSE_META['aplus-1201']?.passingScore).toBe(675);
		expect(COURSE_META['aplus-1202']?.passingScore).toBe(700);
		expect(COURSE_META['aplus-1202']?.domains).toEqual([1, 2, 3, 4]);
		// both A+ cores are registered in ACTIVE_COURSES for seeding
		expect(ACTIVE_COURSES).toContain('aplus-1201');
		expect(ACTIVE_COURSES).toContain('aplus-1202');
	});
});
