import { describe, expect, it } from 'vitest';
import { resolveScope } from './scope';

function eventWithCookies(values: Record<string, string | undefined>) {
	return {
		cookies: {
			get(name: string) {
				return values[name];
			}
		}
	} as never;
}

describe('resolveScope', () => {
	it("restores Ash's preferred course when the course cookie is missing", () => {
		expect(resolveScope(eventWithCookies({ profile_id: 'ash' }))).toEqual({
			profileId: 'ash',
			courseId: 'aplus-1201'
		});
	});

	it('uses a valid explicit course cookie for the selected profile', () => {
		expect(resolveScope(eventWithCookies({ profile_id: 'ash', course_id: 'secp-701' }))).toEqual({
			profileId: 'ash',
			courseId: 'secp-701'
		});
	});

	it('falls back to the selected profile preference when the course cookie is invalid', () => {
		expect(resolveScope(eventWithCookies({ profile_id: 'ash', course_id: 'not-a-course' }))).toEqual({
			profileId: 'ash',
			courseId: 'aplus-1201'
		});
	});
});
