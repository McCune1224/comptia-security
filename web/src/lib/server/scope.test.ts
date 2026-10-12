import { describe, expect, it } from 'vitest';
import { resolveScope } from './scope';
import { createTestRepository } from './test-db';

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
	it("restores Ash's preferred course when the course cookie is missing", async () => {
		const repository = await createTestRepository();
		expect(await resolveScope(eventWithCookies({ profile_id: 'ash' }))).toEqual({
			profileId: 'ash',
			courseId: 'aplus-1201'
		});
		await repository.close();
	});

	it('uses a valid explicit course cookie for the selected profile', async () => {
		const repository = await createTestRepository();
		expect(
			await resolveScope(eventWithCookies({ profile_id: 'ash', course_id: 'secp-701' }))
		).toEqual({
			profileId: 'ash',
			courseId: 'secp-701'
		});
		await repository.close();
	});

	it('falls back to the selected profile preference when the course cookie is invalid', async () => {
		const repository = await createTestRepository();
		expect(
			await resolveScope(eventWithCookies({ profile_id: 'ash', course_id: 'not-a-course' }))
		).toEqual({
			profileId: 'ash',
			courseId: 'aplus-1201'
		});
		await repository.close();
	});
});
