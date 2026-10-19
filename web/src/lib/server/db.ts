import type {
	CourseId,
	QuestionResponse,
	QuizResult,
	SessionMode,
	SessionStatus,
	SessionType
} from '$lib/types';
import type { QuestionDefinition } from './question-bank';
import type { CourseAssignment, CourseLesson, CourseModule, SubmissionRecord } from './course';
import type { ProgressBackup } from './backup';
import type { IcsEvent } from './ics';
import type { ScopedCacheStats } from './scoped-cache';

/** Hard cap on profiles (local study app; two users). */
export const MAX_PROFILES = 2;

/** Who the current request is acting as: a profile plus a course. */
export interface Scope {
	profileId: string;
	courseId: CourseId;
}

export const DEFAULT_SCOPE: Scope = { profileId: 'default', courseId: 'secp-701' };

export interface ProfileRow {
	id: string;
	name: string;
	color: string;
	createdAt: string;
	/** The course this profile is currently studying (drives profile→course coupling). */
	courseId: CourseId;
}

export type SessionRow = {
	id: string;
	started_at: string;
	completed_at: string | null;
	type: SessionType;
	domain: number | null;
	mode: SessionMode;
	status: SessionStatus;
	points_earned: number;
	points_possible: number;
	updated_at: string;
	assignment_id: string | null;
	elapsed_seconds: number | null;
	duration_seconds: number | null;
};

export type StateRow = {
	deadline_at: string | null;
	current_index: number;
	questions_json: string;
	result_json: string | null;
};

export interface StoredGoogleOAuth {
	accessToken: string;
	refreshToken: string;
	expiresAt: number; // epoch ms
	email: string;
	calendarId: string | null;
}

export interface StoredSyncedEvent {
	source: string;
	eventId: string;
	summary: string;
	dueDate: string;
	syncedAt: string;
}

/** A user's uploaded .ics calendar, normalized at the import boundary. */
export interface StoredCalendarImport {
	sourceName: string;
	events: IcsEvent[];
	importedAt: string;
}

export interface StoredSession {
	summary: SessionRow;
	deadlineAt: string | null;
	currentIndex: number;
	questions: QuestionDefinition[];
	result: QuizResult | null;
	responses: Record<number, QuestionResponse>;
	/** Practice-mode retry count per question index (0 = first attempt). */
	retries: Record<number, number>;
	/** Practice-mode hint revealed per question index. */
	hints: Record<number, boolean>;
	flags: number[];
}

export interface ReviewCardRow {
	questionId: string;
	intervalDays: number;
	ease: number;
	lapses: number;
	dueAt: string; // local calendar date YYYY-MM-DD
	lastResult: 'correct' | 'wrong' | null;
	reviewCount: number;
	firstSeenAt: string;
}

export interface StudyDayRow {
	dateKey: string;
	questions: number;
	sessions: number;
	updatedAt: string;
}

export interface AnswerHistoryRow {
	questionId: string;
	isCorrect: boolean;
	completedAt: string;
}

/**
 * Persistence contract for the quiz engine. Every method is asynchronous and
 * backed by PostgreSQL (see `db-pg.ts`); call sites must await the repository.
 */
export interface QuizRepository {
	// Profile management (global — not scope-filtered).
	getProfiles(): Promise<ProfileRow[]>;
	createProfile(name: string, color: string, courseId?: CourseId): Promise<ProfileRow>;
	renameProfile(id: string, name: string): Promise<void>;
	/** Persist which course a profile is studying (profile→course coupling). */
	setProfileCourse(id: string, courseId: CourseId): Promise<void>;
	deleteProfile(id: string): Promise<void>;
	/** Returns a view of the same connection bound to a different scope. */
	forScope(scope: Scope): QuizRepository;

	/** Idempotent content + default-profile seeding (course tables, exam dates). */
	seed(): Promise<void>;

	createSession(session: {
		id: string;
		type: SessionType;
		mode: SessionMode;
		domain: number | null;
		startedAt: string;
		deadlineAt: string | null;
		questions: QuestionDefinition[];
		assignmentId?: string | null;
	}): Promise<void>;
	getSession(id: string): Promise<StoredSession | null>;
	getActiveSession(): Promise<StoredSession | null>;
	saveResponse(
		id: string,
		index: number,
		response: QuestionResponse,
		answeredAt: string,
		opts?: { incrementRetries?: boolean }
	): Promise<void>;
	/** Marks a practice-mode hint as revealed for a question index (server-enforced cost). */
	markHintUsed(id: string, index: number, updatedAt: string): Promise<void>;
	updateState(
		id: string,
		currentIndex?: number,
		flag?: { questionIndex: number; value: boolean },
		updatedAt?: string
	): Promise<void>;
	abandon(id: string, updatedAt: string): Promise<boolean>;
	complete(
		id: string,
		result: QuizResult,
		answers: {
			index: number;
			question: QuestionDefinition;
			response: QuestionResponse | null;
			points: number;
		}[],
		completedAt: string
	): Promise<{ result: QuizResult; finalized: boolean }>;
	getAllDomainProgress(): Promise<
		Record<
			number,
			{
				attempted: number;
				correct: number;
				earnedPoints: number;
				possiblePoints: number;
				percentage: number;
				lastReviewed: string | null;
			}
		>
	>;
	getRecentSessions(limit?: number): Promise<SessionRow[]>;
	getAllCompletedSessions(): Promise<SessionRow[]>;
	getWeakTopics(): Promise<
		{
			domain: number;
			objective: string;
			earnedPoints: number;
			possiblePoints: number;
			percentage: number;
			severity: 'high' | 'review';
		}[]
	>;
	getReviewCards(): Promise<ReviewCardRow[]>;
	upsertReviewCard(card: ReviewCardRow): Promise<void>;
	getStudyLog(): Promise<StudyDayRow[]>;
	recordStudyDay(dateKey: string, questions: number, updatedAt: string): Promise<void>;
	/**
	 * Atomically records one review session: upserts every review card and logs
	 * the study day in a single transaction, so a mid-loop failure can never
	 * leave `study_log` advanced while `review_cards` are stale.
	 */
	recordReviewCompletion(payload: {
		dateKey: string;
		questions: number;
		updatedAt: string;
		cards: ReviewCardRow[];
	}): Promise<void>;
	getAnswerHistory(): Promise<AnswerHistoryRow[]>;
	getAnsweredQuestionIds(): Promise<string[]>;
	getObjectiveProgress(): Promise<
		{
			objective: string;
			attempted: number;
			earnedPoints: number;
			possiblePoints: number;
		}[]
	>;
	getExamDate(): Promise<string>;
	setExamDate(examDate: string): Promise<void>;
	/** Explicit due dates for this scope: assignment id → YYYY-MM-DD. */
	getDueDateOverrides(): Promise<Record<string, string>>;
	/** Sets an explicit due date; `null` clears the override so the schedule derives again. */
	setDueDateOverride(assignmentId: string, dueDate: string | null): Promise<void>;
	/**
	 * Wipes all runtime progress for this scope: quiz sessions (with state,
	 * responses, answers), domain progress, review cards, the profile's study
	 * log, and this course's assignment submissions + lesson completions.
	 * Profiles, course content, exam date and due-date overrides survive.
	 */
	resetProgress(): Promise<void>;
	/** Everything `resetProgress` removes, plus configuration, as a portable document. */
	exportProgress(): Promise<ProgressBackup>;
	/** Restores a validated backup into this scope: wipes scoped progress, then reinserts (session ids remapped). */
	importProgress(backup: ProgressBackup): Promise<void>;
	getCourseModules(): Promise<CourseModule[]>;
	getCourseLessons(): Promise<CourseLesson[]>;
	getCourseAssignments(): Promise<CourseAssignment[]>;
	getLessonCompletions(): Promise<Set<string>>;
	setLessonCompleted(lessonId: string, completed: boolean): Promise<void>;
	getSubmissions(): Promise<SubmissionRecord[]>;
	recordSubmission(submission: SubmissionRecord): Promise<void>;
	getGoogleOAuth(): Promise<StoredGoogleOAuth | null>;
	saveGoogleOAuth(oauth: {
		accessToken: string;
		refreshToken: string;
		expiresAt: number;
		email: string;
		calendarId?: string | null;
	}): Promise<void>;
	clearGoogleOAuth(): Promise<void>;
	getSyncedEvents(): Promise<StoredSyncedEvent[]>;
	recordSyncedEvent(
		source: string,
		eventId: string,
		summary: string,
		dueDate: string,
		syncedAt: string
	): Promise<void>;
	removeSyncedEvent(source: string): Promise<void>;
	getCalendarImport(): Promise<StoredCalendarImport | null>;
	saveCalendarImport(input: {
		sourceName: string;
		events: IcsEvent[];
		importedAt: string;
	}): Promise<void>;
	clearCalendarImport(): Promise<void>;
	/** Test/dev-only counters for the bounded read cache; zeroed in production. */
	getCacheStats(): ScopedCacheStats;
	close(): Promise<void>;
}

/** Binds an existing repository to a different scope (same underlying connection). */
export function createScopedRepo(repo: QuizRepository, scope: Scope): QuizRepository {
	return repo.forScope(scope);
}

// Re-exported so call sites can keep importing cache types alongside the repo.
export type { ScopedCacheStats };
