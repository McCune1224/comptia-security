import type { ReviewCardRow, StudyDayRow } from './db';
import type { SubmissionRecord } from './course';

/**
 * Profile+course progress backup — the document `GET /api/admin/backup`
 * downloads and `POST /api/admin/backup` restores. Row shapes mirror the
 * database columns (camelCase); identity columns are ignored on import: rows
 * always land in the active scope, with session ids remapped to fresh ids.
 */
export const BACKUP_FORMAT = 'course-progress-backup';
export const BACKUP_VERSION = 1;

export interface BackupSessionState {
	deadlineAt: string | null;
	currentIndex: number;
	questionsJson: string;
	resultJson: string | null;
}

export interface BackupSessionResponse {
	questionIndex: number;
	responseJson: string | null;
	flagged: number;
	retries: number;
	hintUsed: number;
	answeredAt: string | null;
}

export interface BackupAnswer {
	questionIndex: number;
	prompt: string;
	domain: number;
	category: string | null;
	correctAnswer: string;
	userAnswer: string;
	isCorrect: number;
	questionId: string | null;
	objective: string | null;
	responseJson: string | null;
	pointsEarned: number;
	pointsPossible: number;
}

export interface BackupSession {
	id: string;
	startedAt: string;
	completedAt: string | null;
	type: string;
	domain: number | null;
	totalQuestions: number;
	correctAnswers: number;
	mode: string;
	status: string;
	pointsEarned: number;
	pointsPossible: number;
	updatedAt: string;
	assignmentId: string | null;
	elapsedSeconds: number | null;
	durationSeconds: number | null;
	state: BackupSessionState | null;
	responses: BackupSessionResponse[];
	answers: BackupAnswer[];
}

export interface BackupDomainProgress {
	domain: number;
	totalAttempted: number;
	totalCorrect: number;
	pointsEarned: number;
	pointsPossible: number;
	lastReviewedAt: string | null;
}

export interface BackupLessonCompletion {
	lessonId: string;
	completedAt: string;
}

export interface ProgressBackup {
	format: typeof BACKUP_FORMAT;
	version: typeof BACKUP_VERSION;
	/** The course the data belongs to — imports must target the same course. */
	courseId: string;
	exportedAt: string;
	examDate: string;
	dueDateOverrides: Record<string, string>;
	sessions: BackupSession[];
	domainProgress: BackupDomainProgress[];
	reviewCards: ReviewCardRow[];
	studyLog: StudyDayRow[];
	submissions: SubmissionRecord[];
	lessonCompletions: BackupLessonCompletion[];
}

/** Rejected import payloads carry a human-readable reason for the API to return. */
export class ProgressBackupError extends Error {}

type Obj = Record<string, unknown>;

function asObject(value: unknown, what: string): Obj {
	if (!value || typeof value !== 'object' || Array.isArray(value))
		throw new ProgressBackupError(`${what} must be an object.`);
	return value as Obj;
}

function asArray(value: unknown, what: string): unknown[] {
	if (!Array.isArray(value)) throw new ProgressBackupError(`${what} must be an array.`);
	return value;
}

function str(source: Obj, key: string, what: string): string {
	const value = source[key];
	if (typeof value !== 'string') throw new ProgressBackupError(`${what}.${key} must be a string.`);
	return value;
}

function optStr(source: Obj, key: string, what: string): string | null {
	const value = source[key];
	if (value === null || value === undefined) return null;
	if (typeof value !== 'string') throw new ProgressBackupError(`${what}.${key} must be a string.`);
	return value;
}

function num(source: Obj, key: string, what: string): number {
	const value = source[key];
	if (typeof value !== 'number' || !Number.isFinite(value))
		throw new ProgressBackupError(`${what}.${key} must be a number.`);
	return value;
}

function optNum(source: Obj, key: string, what: string): number | null {
	const value = source[key];
	if (value === null || value === undefined) return null;
	return num(source, key, what);
}

/** Stored JSON snapshots must parse (and questions must be an array) or a restored session could not be reopened. */
function jsonString(source: Obj, key: string, what: string, expect: 'array' | 'any'): string {
	const value = str(source, key, what);
	try {
		const parsed: unknown = JSON.parse(value);
		if (expect === 'array' && !Array.isArray(parsed))
			throw new ProgressBackupError(`${what}.${key} must hold a JSON array.`);
		if (expect === 'any' && (parsed === null || typeof parsed !== 'object'))
			throw new ProgressBackupError(`${what}.${key} must hold a JSON object.`);
	} catch {
		throw new ProgressBackupError(`${what}.${key} is not valid JSON.`);
	}
	return value;
}

function parseSession(input: unknown, index: number): BackupSession {
	const what = `sessions[${index}]`;
	const row = asObject(input, what);
	return {
		id: str(row, 'id', what),
		startedAt: str(row, 'startedAt', what),
		completedAt: optStr(row, 'completedAt', what),
		type: str(row, 'type', what),
		domain: optNum(row, 'domain', what),
		totalQuestions: num(row, 'totalQuestions', what),
		correctAnswers: num(row, 'correctAnswers', what),
		mode: str(row, 'mode', what),
		status: str(row, 'status', what),
		pointsEarned: num(row, 'pointsEarned', what),
		pointsPossible: num(row, 'pointsPossible', what),
		updatedAt: str(row, 'updatedAt', what),
		assignmentId: optStr(row, 'assignmentId', what),
		elapsedSeconds: optNum(row, 'elapsedSeconds', what),
		durationSeconds: optNum(row, 'durationSeconds', what),
		state: (() => {
			const raw = row.state;
			if (raw === null || raw === undefined) return null;
			const whatState = `${what}.state`;
			const state = asObject(raw, whatState);
			return {
				deadlineAt: optStr(state, 'deadlineAt', whatState),
				currentIndex: num(state, 'currentIndex', whatState),
				questionsJson: jsonString(state, 'questionsJson', whatState, 'array'),
				resultJson: (() => {
					const value = optStr(state, 'resultJson', whatState);
					if (value === null) return null;
					return jsonString(state, 'resultJson', whatState, 'any');
				})()
			};
		})(),
		responses: asArray(row.responses ?? [], `${what}.responses`).map((item, i) => {
			const whatResponse = `${what}.responses[${i}]`;
			const response = asObject(item, whatResponse);
			return {
				questionIndex: num(response, 'questionIndex', whatResponse),
				responseJson: optStr(response, 'responseJson', whatResponse),
				flagged: num(response, 'flagged', whatResponse),
				retries: num(response, 'retries', whatResponse),
				hintUsed: num(response, 'hintUsed', whatResponse),
				answeredAt: optStr(response, 'answeredAt', whatResponse)
			};
		}),
		answers: asArray(row.answers ?? [], `${what}.answers`).map((item, i) => {
			const whatAnswer = `${what}.answers[${i}]`;
			const answer = asObject(item, whatAnswer);
			return {
				questionIndex: num(answer, 'questionIndex', whatAnswer),
				prompt: str(answer, 'prompt', whatAnswer),
				domain: num(answer, 'domain', whatAnswer),
				category: optStr(answer, 'category', whatAnswer),
				correctAnswer: str(answer, 'correctAnswer', whatAnswer),
				userAnswer: str(answer, 'userAnswer', whatAnswer),
				isCorrect: num(answer, 'isCorrect', whatAnswer),
				questionId: optStr(answer, 'questionId', whatAnswer),
				objective: optStr(answer, 'objective', whatAnswer),
				responseJson: optStr(answer, 'responseJson', whatAnswer),
				pointsEarned: num(answer, 'pointsEarned', whatAnswer),
				pointsPossible: num(answer, 'pointsPossible', whatAnswer)
			};
		})
	};
}

/**
 * Validates an untrusted import payload (the parsed request body) and returns
 * the typed backup. Throws ProgressBackupError with a reason on any defect.
 */
export function parseProgressBackup(input: unknown): ProgressBackup {
	const doc = asObject(input, 'Backup document');
	if (doc.format !== BACKUP_FORMAT)
		throw new ProgressBackupError(`format must be "${BACKUP_FORMAT}".`);
	if (doc.version !== BACKUP_VERSION)
		throw new ProgressBackupError(`Unsupported backup version: ${String(doc.version)}.`);
	if (typeof doc.courseId !== 'string' || doc.courseId.length === 0)
		throw new ProgressBackupError('courseId must be a string.');
	if (typeof doc.exportedAt !== 'string')
		throw new ProgressBackupError('exportedAt must be a string.');

	const overrides: Record<string, string> = {};
	const rawOverrides = asObject(doc.dueDateOverrides ?? {}, 'dueDateOverrides');
	for (const [assignmentId, dueDate] of Object.entries(rawOverrides)) {
		if (typeof dueDate !== 'string')
			throw new ProgressBackupError(`dueDateOverrides.${assignmentId} must be a string.`);
		overrides[assignmentId] = dueDate;
	}

	return {
		format: BACKUP_FORMAT,
		version: BACKUP_VERSION,
		courseId: doc.courseId,
		exportedAt: doc.exportedAt,
		examDate: str(doc, 'examDate', 'document'),
		dueDateOverrides: overrides,
		sessions: asArray(doc.sessions ?? [], 'sessions').map(parseSession),
		domainProgress: asArray(doc.domainProgress ?? [], 'domainProgress').map((item, i) => {
			const what = `domainProgress[${i}]`;
			const row = asObject(item, what);
			return {
				domain: num(row, 'domain', what),
				totalAttempted: num(row, 'totalAttempted', what),
				totalCorrect: num(row, 'totalCorrect', what),
				pointsEarned: num(row, 'pointsEarned', what),
				pointsPossible: num(row, 'pointsPossible', what),
				lastReviewedAt: optStr(row, 'lastReviewedAt', what)
			};
		}),
		reviewCards: asArray(doc.reviewCards ?? [], 'reviewCards').map((item, i) => {
			const what = `reviewCards[${i}]`;
			const row = asObject(item, what);
			return {
				questionId: str(row, 'questionId', what),
				intervalDays: num(row, 'intervalDays', what),
				ease: num(row, 'ease', what),
				lapses: num(row, 'lapses', what),
				dueAt: str(row, 'dueAt', what),
				lastResult: optStr(row, 'lastResult', what) as ReviewCardRow['lastResult'],
				reviewCount: num(row, 'reviewCount', what),
				firstSeenAt: str(row, 'firstSeenAt', what)
			};
		}),
		studyLog: asArray(doc.studyLog ?? [], 'studyLog').map((item, i) => {
			const what = `studyLog[${i}]`;
			const row = asObject(item, what);
			return {
				dateKey: str(row, 'dateKey', what),
				questions: num(row, 'questions', what),
				sessions: num(row, 'sessions', what),
				updatedAt: str(row, 'updatedAt', what)
			};
		}),
		submissions: asArray(doc.submissions ?? [], 'submissions').map((item, i) => {
			const what = `submissions[${i}]`;
			const row = asObject(item, what);
			return {
				assignmentId: str(row, 'assignmentId', what),
				sessionId: str(row, 'sessionId', what),
				earned: num(row, 'earned', what),
				percentage: num(row, 'percentage', what),
				completedAt: str(row, 'completedAt', what)
			};
		}),
		lessonCompletions: asArray(doc.lessonCompletions ?? [], 'lessonCompletions').map((item, i) => {
			const what = `lessonCompletions[${i}]`;
			const row = asObject(item, what);
			return { lessonId: str(row, 'lessonId', what), completedAt: str(row, 'completedAt', what) };
		})
	};
}
