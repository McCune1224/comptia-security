import type { Scope } from './db';

export interface ScopedCacheStats {
	hits: number;
	misses: number;
	dbReads: number;
	bypasses: number;
}

type Entry = { expiresAt: number; value: unknown };

const CACHE_VERSION = 'v1';
const DEFAULT_TTL_MS = 60_000;
const DEFAULT_MAX_ENTRIES = 128;
const instrumentationEnabled =
	process.env.VITEST === 'true' ||
	process.env.NODE_ENV === 'test' ||
	process.env.NODE_ENV === 'development';

/**
 * Small, repository-local cache for immutable/read-mostly course projections.
 * The database remains authoritative: a cache error or expired entry always
 * executes the supplied database reader. Mutable progress/session reads do not
 * use this abstraction.
 */
export class ScopedReadCache {
	private readonly entries = new Map<string, Entry>();
	private readonly stats: ScopedCacheStats = { hits: 0, misses: 0, dbReads: 0, bypasses: 0 };

	constructor(
		private readonly ttlMs = DEFAULT_TTL_MS,
		private readonly maxEntries = DEFAULT_MAX_ENTRIES
	) {}

	key(
		scope: Scope,
		projection: 'course-modules' | 'course-lessons' | 'course-assignments'
	): string {
		return `${CACHE_VERSION}:${projection}:profile=${scope.profileId}:course=${scope.courseId}`;
	}

	read<T>(key: string, load: () => T): T {
		const now = Date.now();
		try {
			const cached = this.entries.get(key);
			if (cached && cached.expiresAt > now) {
				this.entries.delete(key);
				this.entries.set(key, cached);
				if (instrumentationEnabled) this.stats.hits++;
				return structuredClone(cached.value) as T;
			}
			if (cached) this.entries.delete(key);
		} catch {
			// Cache bookkeeping problems are treated as a miss.
		}
		if (instrumentationEnabled) {
			this.stats.misses++;
			this.stats.dbReads++;
		}
		const value = load();
		try {
			this.entries.set(key, { value: structuredClone(value), expiresAt: now + this.ttlMs });
			while (this.entries.size > this.maxEntries)
				this.entries.delete(this.entries.keys().next().value!);
		} catch {
			// A non-cloneable value still returns successfully from the DB.
		}
		return value;
	}

	bypass(): void {
		if (instrumentationEnabled) this.stats.bypasses++;
	}

	invalidateScope(scope: Scope): void {
		const prefix = `${CACHE_VERSION}:`;
		for (const key of this.entries.keys()) {
			if (
				key.startsWith(prefix) &&
				key.includes(`:profile=${scope.profileId}:course=${scope.courseId}`)
			)
				this.entries.delete(key);
		}
	}

	getStats(): ScopedCacheStats {
		return { ...this.stats };
	}
}
