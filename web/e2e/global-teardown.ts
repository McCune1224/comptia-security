import { removeE2eDatabase } from '../playwright.config';

export default async function globalTeardown(): Promise<void> {
	removeE2eDatabase();
}
