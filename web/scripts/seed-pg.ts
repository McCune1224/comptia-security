#!/usr/bin/env node
/**
 * Seed PostgreSQL database with course data.
 * Usage: npx tsx scripts/seed-pg.ts
 * Requires DATABASE_URL environment variable.
 */
import postgres from 'postgres';
import { ACTIVE_COURSES, COURSES, defaultExamDate } from '../src/lib/server/course';

async function seed() {
    const connectionString = process.env.DATABASE_URL;
    if (!connectionString) {
        console.error('DATABASE_URL environment variable is required');
        process.exit(1);
    }

    const sql = postgres(connectionString, { max: 10 });
    const now = new Date().toISOString();

    try {
        console.log('Seeding PostgreSQL database...');

        // Seed profiles
        await sql`
            INSERT INTO profiles (id, name, color, course_id, created_at)
            VALUES ('default', 'Alex', '#67B8A8', 'secp-701', ${now})
            ON CONFLICT (id) DO NOTHING
        `;
        await sql`
            INSERT INTO profiles (id, name, color, course_id, created_at)
            VALUES ('ash', 'Ash', '#82B5D5', 'aplus-1201', ${now})
            ON CONFLICT (id) DO NOTHING
        `;

        // Seed exam dates and course content
        for (const courseId of ACTIVE_COURSES) {
            const definition = COURSES[courseId];
            if (!definition) continue;

            // Exam date
            await sql`
                INSERT INTO course_meta (profile_id, course_id, key, value)
                VALUES ('default', ${courseId}, 'exam_date', ${defaultExamDate()})
                ON CONFLICT (profile_id, course_id, key) DO NOTHING
            `;

            // Modules
            for (const module of definition.modules) {
                await sql`
                    INSERT INTO course_modules (id, course_id, week, title, description, position)
                    VALUES (${module.id}, ${courseId}, ${module.week}, ${module.title}, ${module.description}, ${module.position})
                    ON CONFLICT (id) DO UPDATE SET
                        course_id = EXCLUDED.course_id,
                        week = EXCLUDED.week,
                        title = EXCLUDED.title,
                        description = EXCLUDED.description,
                        position = EXCLUDED.position
                `;
            }

            // Lessons
            for (const lesson of definition.lessons) {
                await sql`
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
            }

            // Assignments
            for (const assignment of definition.assignments) {
                await sql`
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

            console.log(`Seeded course: ${courseId}`);
        }

        console.log('Database seeded successfully!');
    } catch (error) {
        console.error('Seeding failed:', error);
        process.exit(1);
    } finally {
        await sql.end();
    }
}

seed();
