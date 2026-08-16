import { expect, test } from '@playwright/test';
import type { BrowserContext, Page } from '@playwright/test';

/** Parse #RGB or #RRGGBB into sRGB 0-1 components. */
function parseHex(hex: string): [number, number, number] {
	let value = hex.trim().replace('#', '');
	if (value.length === 3)
		value = value
			.split('')
			.map((c) => c + c)
			.join('');
	if (value.length !== 6) throw new Error(`unexpected color: ${hex}`);
	const channels = [0, 2, 4].map((offset) => parseInt(value.slice(offset, offset + 2), 16) / 255);
	return channels as [number, number, number];
}

function linearize(channel: number): number {
	return channel <= 0.04045 ? channel / 12.92 : Math.pow((channel + 0.055) / 1.055, 2.4);
}

/** WCAG relative luminance. */
function luminance(hex: string): number {
	const [r, g, b] = parseHex(hex).map(linearize);
	return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}

/** WCAG contrast ratio between two colors. */
function contrast(fg: string, bg: string): number {
	const lighter = Math.max(luminance(fg), luminance(bg));
	const darker = Math.min(luminance(fg), luminance(bg));
	return (lighter + 0.05) / (darker + 0.05);
}

const MIN_CONTRAST = 4.5;

/** Text colors that must clear AA against the panel surfaces. */
const TEXT_TOKENS = [
	'--color-text-primary',
	'--color-text-secondary',
	'--color-text-muted',
	'--color-text-subtle',
	'--color-accent',
	'--color-success',
	'--color-danger',
	'--color-info',
	'--color-warning'
];

const SURFACE_TOKENS = ['--color-bg-base', '--color-surface-900', '--color-surface-800', '--color-surface-700'];

/** Solid fill/foreground pairs that must clear AA. */
const FILL_PAIRS: [string, string][] = [
	['--color-on-accent', '--color-accent'],
	['--color-on-warning', '--color-warning'],
	['--color-on-success', '--color-success'],
	['--color-on-danger', '--color-danger'],
	['--color-on-info', '--color-info']
];

async function themeContext(
	browser: import('@playwright/test').Browser,
	theme: 'dark' | 'light'
): Promise<BrowserContext> {
	return browser.newContext({
		colorScheme: theme,
		viewport: { width: 390, height: 844 },
		initScript: `localStorage.setItem('theme', '${theme}');`
	});
}

function computed(page: Page, token: string): string {
	return page.evaluate((name) => getComputedStyle(document.documentElement).getPropertyValue(name).trim(), token);
}

async function assertContrastPairs(page: Page, theme: 'dark' | 'light') {
	const failures: string[] = [];
	for (const surface of SURFACE_TOKENS) {
		const bg = await computed(page, surface);
		for (const text of TEXT_TOKENS) {
			const fg = await computed(page, text);
			const ratio = contrast(fg, bg);
			if (ratio < MIN_CONTRAST) failures.push(`${theme} ${text} on ${surface}: ${ratio.toFixed(2)}:1`);
		}
	}
	for (const [fgToken, bgToken] of FILL_PAIRS) {
		const fg = await computed(page, fgToken);
		const bg = await computed(page, bgToken);
		const ratio = contrast(fg, bg);
		if (ratio < MIN_CONTRAST) failures.push(`${theme} ${fgToken} on ${bgToken}: ${ratio.toFixed(2)}:1`);
	}
	expect(failures, failures.join('\n')).toEqual([]);
}

test('both themes meet WCAG AA for text and solid-fill foregrounds', async ({ browser }) => {
	const dark = await themeContext(browser, 'dark');
	const darkPage = await dark.newPage();
	await darkPage.goto('/');
	expect(await darkPage.evaluate(() => document.documentElement.dataset.theme)).toBe('dark');
	await assertContrastPairs(darkPage, 'dark');
	await dark.close();

	const light = await themeContext(browser, 'light');
	const lightPage = await light.newPage();
	await lightPage.goto('/');
	expect(await lightPage.evaluate(() => document.documentElement.dataset.theme)).toBe('light');
	await assertContrastPairs(lightPage, 'light');
	await light.close();
});

test('toggling the theme persists across reloads', async ({ browser }) => {
	// The standalone toggle renders only at xl; mobile uses the in-menu toggle.
	const context = await browser.newContext({
		colorScheme: 'dark',
		viewport: { width: 1280, height: 900 },
		initScript: `localStorage.setItem('theme', 'dark');`
	});
	const page = await context.newPage();
	await page.goto('/');
	await expect(page.getByRole('switch', { name: 'Toggle light and dark theme' })).toBeVisible();

	// Toggle dark -> light.
	await page.getByRole('switch', { name: 'Toggle light and dark theme' }).click();
	expect(await page.evaluate(() => document.documentElement.dataset.theme)).toBe('light');
	expect(await page.evaluate(() => localStorage.getItem('theme'))).toBe('light');

	// Reload: the same theme returns with no flash to the opposite palette.
	await page.reload();
	expect(await page.evaluate(() => document.documentElement.dataset.theme)).toBe('light');
	expect(await page.evaluate(() => localStorage.getItem('theme'))).toBe('light');
	await context.close();
});
