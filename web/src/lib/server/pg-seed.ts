import type postgres from 'postgres';
import { ACTIVE_COURSES, COURSES, defaultExamDate } from './course';

/**
 * Content + default-profile seeding, shared by the runtime repository's
 * `seed()`, the `npm run db:seed` script, and the test helper. Idempotent:
 * profiles use ON CONFLICT DO NOTHING (later user renames survive), course
 * content upserts so content updates reach existing databases.
 */
export async function seedCourseContent(sql: postgres.Sql): Promise<void> {
	await sql.begin(async (tx) => {
		const now = new Date().toISOString();
		// Two profiles out of the box: Alex (default / Security+) and Ash (A+).
		await tx`
			INSERT INTO profiles (id, name, color, course_id, created_at)
			VALUES ('default', 'Alex', '#67B8A8', 'secp-701', ${now})
			ON CONFLICT (id) DO NOTHING
		`;
		await tx`
			INSERT INTO profiles (id, name, color, course_id, created_at)
			VALUES ('ash', 'Ash', '#82B5D5', 'aplus-1201', ${now})
			ON CONFLICT (id) DO NOTHING
		`;
		for (const courseId of ACTIVE_COURSES) {
			const definition = COURSES[courseId];
			if (!definition) continue;
			await tx`
				INSERT INTO course_meta (profile_id, course_id, key, value)
				VALUES ('default', ${courseId}, 'exam_date', ${defaultExamDate()})
				ON CONFLICT (profile_id, course_id, key) DO NOTHING
			`;
			for (const module of definition.modules)
				await tx`
					INSERT INTO course_modules (id, course_id, week, title, description, position)
					VALUES (${module.id}, ${courseId}, ${module.week}, ${module.title}, ${module.description}, ${module.position})
					ON CONFLICT (id) DO UPDATE SET
						course_id = EXCLUDED.course_id,
						week = EXCLUDED.week,
						title = EXCLUDED.title,
						description = EXCLUDED.description,
						position = EXCLUDED.position
				`;
			for (const lesson of definition.lessons)
				await tx`
					INSERT INTO course_lessons (id, course_id, module_id, title, summary, content, objective_ids, position)
					VALUES (${lesson.id}, ${courseId}, ${lesson.moduleId}, ${lesson.title}, ${lesson.summary}, ${lesson.content}, ${lesson.objectiveIds ? JSON.stringify(lesson.objectiveIds) : null}, ${lesson.position})
					ON CONFLICT (id) DO UPDATE SET
						course_id = EXCLUDED.course_id,
						module_id = EXCLUDED.module_id,
						title = EXCLUDED.title,
						summary = EXCLUDED.summary,
						content = EXCLUDED.content,
						objective_ids = EXCLUDED.objective_ids,
						position = EXCLUDED.position
				`;
			for (const assignment of definition.assignments)
				await tx`
					INSERT INTO course_assignments (id, course_id, module_id, title, description, kind, category, points, count, domain, mode, duration_minutes, due_offset_days, position)
					VALUES (${assignment.id}, ${courseId}, ${assignment.moduleId}, ${assignment.title}, ${assignment.description}, ${assignment.kind}, ${assignment.category}, ${assignment.points}, ${assignment.count}, ${assignment.domain}, ${assignment.mode}, ${assignment.durationMinutes}, ${assignment.dueOffsetDays}, ${assignment.position})
					ON CONFLICT (id) DO UPDATE SET
						course_id = EXCLUDED.course_id,
						module_id = EXCLUDED.module_id,
						title = EXCLUDED.title,
						description = EXCLUDED.description,
						kind = EXCLUDED.kind,
						category = EXCLUDED.category,
						points = EXCLUDED.points,
						count = EXCLUDED.count,
						domain = EXCLUDED.domain,
						mode = EXCLUDED.mode,
						duration_minutes = EXCLUDED.duration_minutes,
						due_offset_days = EXCLUDED.due_offset_days,
						position = EXCLUDED.position
				`;
		}
	});
}
