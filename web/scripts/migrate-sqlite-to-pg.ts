#!/usr/bin/env node
/**
 * Migrate data from SQLite to PostgreSQL.
 * Usage: npx tsx scripts/migrate-sqlite-to-pg.ts [--sqlite-path /path/to/quiz.db]
 * Requires DATABASE_URL environment variable for PostgreSQL.
 */
import Database from 'better-sqlite3';
import postgres from 'postgres';
import fs from 'node:fs';
import path from 'node:path';

const SQLITE_PATH = process.argv.includes('--sqlite-path')
    ? process.argv[process.argv.indexOf('--sqlite-path') + 1]
    : path.join(process.cwd(), 'data/quiz.db');

async function migrate() {
    const connectionString = process.env.DATABASE_URL;
    if (!connectionString) {
        console.error('DATABASE_URL environment variable is required');
        process.exit(1);
    }

    if (!fs.existsSync(SQLITE_PATH)) {
        console.error(`SQLite database not found: ${SQLITE_PATH}`);
        process.exit(1);
    }

    console.log(`Reading from SQLite: ${SQLITE_PATH}`);
    const sqlite = new Database(SQLITE_PATH, { readonly: true });
    const pg = postgres(connectionString, { max: 10 });

    try {
        console.log('Migrating data from SQLite to PostgreSQL...');

        // Migrate profiles
        const profiles = sqlite.prepare('SELECT * FROM profiles').all() as any[];
        for (const p of profiles) {
            await pg`
                INSERT INTO profiles (id, name, color, course_id, created_at)
                VALUES (${p.id}, ${p.name}, ${p.color}, ${p.course_id}, ${p.created_at})
                ON CONFLICT (id) DO UPDATE SET
                    name = EXCLUDED.name,
                    color = EXCLUDED.color,
                    course_id = EXCLUDED.course_id,
                    created_at = EXCLUDED.created_at
            `;
        }
        console.log(`Migrated ${profiles.length} profiles`);

        // Migrate quiz sessions
        const sessions = sqlite.prepare('SELECT * FROM quiz_sessions').all() as any[];
        for (const s of sessions) {
            await pg`
                INSERT INTO quiz_sessions (id, started_at, completed_at, type, domain, total_questions, correct_answers, mode, status, points_earned, points_possible, updated_at, assignment_id, profile_id, course_id, elapsed_seconds, duration_seconds)
                VALUES (${s.id}, ${s.started_at}, ${s.completed_at}, ${s.type}, ${s.domain}, ${s.total_questions}, ${s.correct_answers}, ${s.mode}, ${s.status}, ${s.points_earned}, ${s.points_possible}, ${s.updated_at}, ${s.assignment_id}, ${s.profile_id}, ${s.course_id}, ${s.elapsed_seconds}, ${s.duration_seconds})
                ON CONFLICT (id) DO UPDATE SET
                    started_at = EXCLUDED.started_at,
                    completed_at = EXCLUDED.completed_at,
                    type = EXCLUDED.type,
                    domain = EXCLUDED.domain,
                    total_questions = EXCLUDED.total_questions,
                    correct_answers = EXCLUDED.correct_answers,
                    mode = EXCLUDED.mode,
                    status = EXCLUDED.status,
                    points_earned = EXCLUDED.points_earned,
                    points_possible = EXCLUDED.points_possible,
                    updated_at = EXCLUDED.updated_at,
                    assignment_id = EXCLUDED.assignment_id,
                    profile_id = EXCLUDED.profile_id,
                    course_id = EXCLUDED.course_id,
                    elapsed_seconds = EXCLUDED.elapsed_seconds,
                    duration_seconds = EXCLUDED.duration_seconds
            `;
        }
        console.log(`Migrated ${sessions.length} quiz sessions`);

        // Migrate quiz answers
        const answers = sqlite.prepare('SELECT * FROM quiz_answers').all() as any[];
        for (const a of answers) {
            await pg`
                INSERT INTO quiz_answers (id, session_id, question_index, prompt, domain, category, correct_answer, user_answer, is_correct, question_id, objective, response_json, points_earned, points_possible, profile_id, course_id)
                VALUES (${a.id}, ${a.session_id}, ${a.question_index}, ${a.prompt}, ${a.domain}, ${a.category}, ${a.correct_answer}, ${a.user_answer}, ${a.is_correct}, ${a.question_id}, ${a.objective}, ${a.response_json}, ${a.points_earned}, ${a.points_possible}, ${a.profile_id}, ${a.course_id})
                ON CONFLICT (id) DO UPDATE SET
                    session_id = EXCLUDED.session_id,
                    question_index = EXCLUDED.question_index,
                    prompt = EXCLUDED.prompt,
                    domain = EXCLUDED.domain,
                    category = EXCLUDED.category,
                    correct_answer = EXCLUDED.correct_answer,
                    user_answer = EXCLUDED.user_answer,
                    is_correct = EXCLUDED.is_correct,
                    question_id = EXCLUDED.question_id,
                    objective = EXCLUDED.objective,
                    response_json = EXCLUDED.response_json,
                    points_earned = EXCLUDED.points_earned,
                    points_possible = EXCLUDED.points_possible,
                    profile_id = EXCLUDED.profile_id,
                    course_id = EXCLUDED.course_id
            `;
        }
        console.log(`Migrated ${answers.length} quiz answers`);

        // Migrate domain progress
        const domainProgress = sqlite.prepare('SELECT * FROM domain_progress').all() as any[];
        for (const d of domainProgress) {
            await pg`
                INSERT INTO domain_progress (profile_id, course_id, domain, total_attempted, total_correct, points_earned, points_possible, last_reviewed_at)
                VALUES (${d.profile_id}, ${d.course_id}, ${d.domain}, ${d.total_attempted}, ${d.total_correct}, ${d.points_earned}, ${d.points_possible}, ${d.last_reviewed_at})
                ON CONFLICT (profile_id, course_id, domain) DO UPDATE SET
                    total_attempted = EXCLUDED.total_attempted,
                    total_correct = EXCLUDED.total_correct,
                    points_earned = EXCLUDED.points_earned,
                    points_possible = EXCLUDED.points_possible,
                    last_reviewed_at = EXCLUDED.last_reviewed_at
            `;
        }
        console.log(`Migrated ${domainProgress.length} domain progress records`);

        // Migrate quiz session state
        const sessionState = sqlite.prepare('SELECT * FROM quiz_session_state').all() as any[];
        for (const s of sessionState) {
            await pg`
                INSERT INTO quiz_session_state (session_id, schema_version, deadline_at, current_index, questions_json, result_json, updated_at)
                VALUES (${s.session_id}, ${s.schema_version}, ${s.deadline_at}, ${s.current_index}, ${s.questions_json}, ${s.result_json}, ${s.updated_at})
                ON CONFLICT (session_id) DO UPDATE SET
                    schema_version = EXCLUDED.schema_version,
                    deadline_at = EXCLUDED.deadline_at,
                    current_index = EXCLUDED.current_index,
                    questions_json = EXCLUDED.questions_json,
                    result_json = EXCLUDED.result_json,
                    updated_at = EXCLUDED.updated_at
            `;
        }
        console.log(`Migrated ${sessionState.length} session state records`);

        // Migrate quiz session responses
        const responses = sqlite.prepare('SELECT * FROM quiz_session_responses').all() as any[];
        for (const r of responses) {
            await pg`
                INSERT INTO quiz_session_responses (session_id, question_index, response_json, flagged, retries, hint_used, answered_at)
                VALUES (${r.session_id}, ${r.question_index}, ${r.response_json}, ${r.flagged}, ${r.retries}, ${r.hint_used}, ${r.answered_at})
                ON CONFLICT (session_id, question_index) DO UPDATE SET
                    response_json = EXCLUDED.response_json,
                    flagged = EXCLUDED.flagged,
                    retries = EXCLUDED.retries,
                    hint_used = EXCLUDED.hint_used,
                    answered_at = EXCLUDED.answered_at
            `;
        }
        console.log(`Migrated ${responses.length} session responses`);

        // Migrate review cards
        const reviewCards = sqlite.prepare('SELECT * FROM review_cards').all() as any[];
        for (const r of reviewCards) {
            await pg`
                INSERT INTO review_cards (profile_id, course_id, question_id, interval_days, ease, lapses, due_at, last_result, review_count, first_seen_at)
                VALUES (${r.profile_id}, ${r.course_id}, ${r.question_id}, ${r.interval_days}, ${r.ease}, ${r.lapses}, ${r.due_at}, ${r.last_result}, ${r.review_count}, ${r.first_seen_at})
                ON CONFLICT (profile_id, course_id, question_id) DO UPDATE SET
                    interval_days = EXCLUDED.interval_days,
                    ease = EXCLUDED.ease,
                    lapses = EXCLUDED.lapses,
                    due_at = EXCLUDED.due_at,
                    last_result = EXCLUDED.last_result,
                    review_count = EXCLUDED.review_count
            `;
        }
        console.log(`Migrated ${reviewCards.length} review cards`);

        // Migrate study log
        const studyLog = sqlite.prepare('SELECT * FROM study_log').all() as any[];
        for (const s of studyLog) {
            await pg`
                INSERT INTO study_log (profile_id, date_key, questions, sessions, updated_at)
                VALUES (${s.profile_id}, ${s.date_key}, ${s.questions}, ${s.sessions}, ${s.updated_at})
                ON CONFLICT (profile_id, date_key) DO UPDATE SET
                    questions = EXCLUDED.questions,
                    sessions = EXCLUDED.sessions,
                    updated_at = EXCLUDED.updated_at
            `;
        }
        console.log(`Migrated ${studyLog.length} study log entries`);

        // Migrate course metadata
        const courseMeta = sqlite.prepare('SELECT * FROM course_meta').all() as any[];
        for (const c of courseMeta) {
            await pg`
                INSERT INTO course_meta (profile_id, course_id, key, value)
                VALUES (${c.profile_id}, ${c.course_id}, ${c.key}, ${c.value})
                ON CONFLICT (profile_id, course_id, key) DO UPDATE SET
                    value = EXCLUDED.value
            `;
        }
        console.log(`Migrated ${courseMeta.length} course metadata entries`);

        // Migrate course modules
        const modules = sqlite.prepare('SELECT * FROM course_modules').all() as any[];
        for (const m of modules) {
            await pg`
                INSERT INTO course_modules (id, course_id, week, title, description, position)
                VALUES (${m.id}, ${m.course_id}, ${m.week}, ${m.title}, ${m.description}, ${m.position})
                ON CONFLICT (id) DO UPDATE SET
                    course_id = EXCLUDED.course_id,
                    week = EXCLUDED.week,
                    title = EXCLUDED.title,
                    description = EXCLUDED.description,
                    position = EXCLUDED.position
            `;
        }
        console.log(`Migrated ${modules.length} course modules`);

        // Migrate course lessons
        const lessons = sqlite.prepare('SELECT * FROM course_lessons').all() as any[];
        for (const l of lessons) {
            await pg`
                INSERT INTO course_lessons (id, course_id, module_id, title, summary, content, objective_ids, position)
                VALUES (${l.id}, ${l.course_id}, ${l.module_id}, ${l.title}, ${l.summary}, ${l.content}, ${l.objective_ids}, ${l.position})
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
        console.log(`Migrated ${lessons.length} course lessons`);

        // Migrate course assignments
        const assignments = sqlite.prepare('SELECT * FROM course_assignments').all() as any[];
        for (const a of assignments) {
            await pg`
                INSERT INTO course_assignments (id, course_id, module_id, title, description, kind, category, points, count, domain, mode, duration_minutes, due_offset_days, position)
                VALUES (${a.id}, ${a.course_id}, ${a.module_id}, ${a.title}, ${a.description}, ${a.kind}, ${a.category}, ${a.points}, ${a.count}, ${a.domain}, ${a.mode}, ${a.duration_minutes}, ${a.due_offset_days}, ${a.position})
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
        console.log(`Migrated ${assignments.length} course assignments`);

        // Migrate course assignment submissions
        const submissions = sqlite.prepare('SELECT * FROM course_assignment_submissions').all() as any[];
        for (const s of submissions) {
            await pg`
                INSERT INTO course_assignment_submissions (profile_id, assignment_id, session_id, earned, percentage, completed_at)
                VALUES (${s.profile_id}, ${s.assignment_id}, ${s.session_id}, ${s.earned}, ${s.percentage}, ${s.completed_at})
                ON CONFLICT (profile_id, assignment_id, session_id) DO UPDATE SET
                    earned = EXCLUDED.earned,
                    percentage = EXCLUDED.percentage,
                    completed_at = EXCLUDED.completed_at
            `;
        }
        console.log(`Migrated ${submissions.length} assignment submissions`);

        // Migrate course lesson completions
        const completions = sqlite.prepare('SELECT * FROM course_lesson_completions').all() as any[];
        for (const c of completions) {
            await pg`
                INSERT INTO course_lesson_completions (profile_id, lesson_id, completed_at)
                VALUES (${c.profile_id}, ${c.lesson_id}, ${c.completed_at})
                ON CONFLICT (profile_id, lesson_id) DO UPDATE SET
                    completed_at = EXCLUDED.completed_at
            `;
        }
        console.log(`Migrated ${completions.length} lesson completions`);

        // Migrate Google OAuth
        const oauth = sqlite.prepare('SELECT * FROM google_oauth').all() as any[];
        for (const o of oauth) {
            await pg`
                INSERT INTO google_oauth (profile_id, access_token, refresh_token, expires_at, email, calendar_id, created_at, updated_at)
                VALUES (${o.profile_id}, ${o.access_token}, ${o.refresh_token}, ${o.expires_at}, ${o.email}, ${o.calendar_id}, ${o.created_at}, ${o.updated_at})
                ON CONFLICT (profile_id) DO UPDATE SET
                    access_token = EXCLUDED.access_token,
                    refresh_token = EXCLUDED.refresh_token,
                    expires_at = EXCLUDED.expires_at,
                    email = EXCLUDED.email,
                    calendar_id = EXCLUDED.calendar_id,
                    updated_at = EXCLUDED.updated_at
            `;
        }
        console.log(`Migrated ${oauth.length} Google OAuth records`);

        // Migrate Google synced events
        const events = sqlite.prepare('SELECT * FROM google_synced_events').all() as any[];
        for (const e of events) {
            await pg`
                INSERT INTO google_synced_events (profile_id, source, event_id, summary, due_date, synced_at)
                VALUES (${e.profile_id}, ${e.source}, ${e.event_id}, ${e.summary}, ${e.due_date}, ${e.synced_at})
                ON CONFLICT (profile_id, source) DO UPDATE SET
                    event_id = EXCLUDED.event_id,
                    summary = EXCLUDED.summary,
                    due_date = EXCLUDED.due_date,
                    synced_at = EXCLUDED.synced_at
            `;
        }
        console.log(`Migrated ${events.length} Google synced events`);

        console.log('\nMigration complete!');
        console.log('Summary:');
        console.log(`  - Profiles: ${profiles.length}`);
        console.log(`  - Quiz sessions: ${sessions.length}`);
        console.log(`  - Quiz answers: ${answers.length}`);
        console.log(`  - Domain progress: ${domainProgress.length}`);
        console.log(`  - Review cards: ${reviewCards.length}`);
        console.log(`  - Study log: ${studyLog.length}`);
        console.log(`  - Course modules: ${modules.length}`);
        console.log(`  - Course lessons: ${lessons.length}`);
        console.log(`  - Course assignments: ${assignments.length}`);
        console.log(`  - Assignment submissions: ${submissions.length}`);
        console.log(`  - Lesson completions: ${completions.length}`);
    } catch (error) {
        console.error('Migration failed:', error);
        process.exit(1);
    } finally {
        sqlite.close();
        await pg.end();
    }
}

migrate();
