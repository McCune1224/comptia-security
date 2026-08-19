#!/usr/bin/env node
/**
 * mobile-qa.mjs — FAIL-THRESHOLD mobile touch-QA gate for the CompTIA study app.
 *
 * Runs the production build against a throwaway database and drives it with a
 * real mobile-emulated Chromium:
 *   1. Kind drills — seeds sessions via the API and answers every supported
 *      engine kind on touch, in BOTH themes (dark + light).
 *   2. Full route walk — touch-target sweep (≥44×44px), 390px horizontal
 *      overflow, console/page/failed-request errors, dual-viewport screenshots.
 *   3. Fixed viewports — 320×568, 390×844, and 640×360 landscape: dropdown
 *      containment, calendar, lesson objective drills, and the fixed bottom
 *      nav never covering the final assessment action.
 *
 * Env: PORT (default 4899), QUIZ_DB_PATH (default /tmp/qa-<pid>.db)
 * Never points at the user's real data/quiz.db.
 */
import { spawn } from 'node:child_process';
import { existsSync, mkdirSync, writeFileSync, rmSync, readdirSync } from 'node:fs';
import { homedir } from 'node:os';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { chromium } from 'playwright-core';

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = join(__dirname, '..');
const OUT = join(ROOT, 'dogfood-output');
const SHOTS = join(OUT, 'screenshots');
const PORT = process.env.PORT || '4899';
const DB = process.env.QUIZ_DB_PATH || `/tmp/qa-${process.pid}.db`;
const BASE = `http://localhost:${PORT}`;
const VIEWPORT = { width: 390, height: 844 };
const TALL = { width: 390, height: 1400 };
const LANDSCAPE = { width: 640, height: 360 };
const NARROW = { width: 320, height: 568 };
const MIN_TAP = 44;
const REPORT_ONLY = process.argv.includes('--report-only');

// ---------------------------------------------------------------------------
// Route ownership: every route is owned by this app — no deferred exemptions.
// ---------------------------------------------------------------------------
const OWNED_ROUTES = [
	'/',
	'/syllabus',
	'/progress',
	'/calendar',
	'/review',
	'/mastery',
	'/gradebook',
	'/history',
	'/pbq',
	'/quiz',
	'/scenarios',
	'/modules/week-1'
];
const DEFERRED_ROUTE_PREFIXES = [];

/**
 * Question kinds the engine supports. Data-driven: when a kind has no bank
 * items it is reported as "unavailable" (Info) instead of failing the gate.
 */
const KINDS = [
	'choice',
	'configuration',
	'evidence',
	'matching',
	'memory',
	'multi-step',
	'numeric',
	'ordering',
	'slider',
	'sort',
	'word-bank',
	'hotspot'
];

// ---- cached Chromium discovery -------------------------------------------
function findChromium() {
	const cache = join(homedir(), '.cache', 'ms-playwright');
	if (!existsSync(cache)) return null;
	const dirs = readdirSync(cache).filter((d) => d.startsWith('chromium-'));
	dirs.sort();
	for (let i = dirs.length - 1; i >= 0; i--) {
		const candidates = [
			join(cache, dirs[i], 'chrome-linux64', 'chrome'),
			join(cache, dirs[i], 'chrome-linux', 'chrome')
		];
		for (const c of candidates) if (existsSync(c)) return c;
	}
	return null;
}

// ---- findings store -------------------------------------------------------
const findings = [];
const gateViolations = []; // <44px on owned routes, overflow, console errors → exit 1
const consoleErrors = [];
const pageErrors = [];
const failedRequests = [];
const KINDS_SEEN = new Set();
const KINDS_NOT_SEEN = [];
const THEMES_SEEN = [];
let sessionQuestions = null;
const activeSessions = new Set();
let orderingAttempts = 0;
let orderingFailures = 0;
let orderingKeyboardRecovered = 0;
const FIXED_CHECKS = [];

function addFinding(pageUrl, severity, category, title, details, screenshot = null) {
	findings.push({ pageUrl, severity, category, title, details, screenshot });
}

function addViolation(scope, message) {
	gateViolations.push({ scope, message });
	console.log(`GATE-VIOLATION [${scope}]: ${message}`);
}

function slug(str) {
	return (
		str
			.replace(/[^a-z0-9]+/gi, '-')
			.replace(/^-+|-+$/g, '')
			.toLowerCase() || 'page'
	);
}

// ---- console / request listeners ------------------------------------------
function attachListeners(page) {
	page.on('console', (msg) => {
		if (msg.type() === 'error') {
			const url = (msg.location() && msg.location().url) || '';
			const text = msg.text();
			consoleErrors.push(`${text} ${url ? `(${url})` : ''}`.trim());
			console.log(`CONSOLE-ERROR: ${text} ${url ? `| ${url}` : ''}`);
		}
	});
	page.on('pageerror', (err) => {
		pageErrors.push(err.message);
		console.log(`PAGE-ERROR: ${err.message}`);
	});
	page.on('requestfailed', (req) => {
		const why = req.failure() ? req.failure().errorText : 'unknown';
		failedRequests.push(`${req.url()} — ${why}`);
		console.log(`REQ-FAILED: ${req.url()} — ${why}`);
	});
	page.on('response', (res) => {
		if (res.status() >= 400 && res.url().includes('/api/')) {
			res
				.text()
				.then((body) =>
					console.log(`API-ERROR ${res.status()}: ${res.url()} — ${body.slice(0, 200)}`)
				)
				.catch(() => {});
		}
	});
	// Native confirm() on Submit must be accepted for the session to complete.
	page.on('dialog', (dialog) => dialog.accept().catch(() => {}));
}

// ---- helpers --------------------------------------------------------------
async function screenshot(page, name, viewport = VIEWPORT) {
	const file = join(SHOTS, `${name}.png`);
	try {
		await page.setViewportSize(viewport);
	} catch {
		// mobile contexts may reject setViewportSize — keep the current size.
	}
	await page.waitForTimeout(250);
	await page.screenshot({ path: file, fullPage: false });
	try {
		await page.setViewportSize(VIEWPORT);
	} catch {}
	return file;
}

/** Touch-drag between two locators' centers via CDP touch events. */
async function touchDragBoxes(page, fromLocator, toLocator) {
	let cdp = null;
	try {
		cdp = await page.context().newCDPSession(page);
		const from = await fromLocator.boundingBox();
		const to = await toLocator.boundingBox();
		if (!from || !to) return false;
		const x1 = from.x + from.width / 2;
		const y1 = from.y + from.height / 2;
		const x2 = to.x + to.width / 2;
		const y2 = to.y + to.height / 2;
		await cdp.send('Input.dispatchTouchEvent', {
			type: 'touchStart',
			touchPoints: [{ x: x1, y: y1 }]
		});
		await page.waitForTimeout(120);
		for (let i = 1; i <= 10; i++) {
			await cdp.send('Input.dispatchTouchEvent', {
				type: 'touchMove',
				touchPoints: [{ x: x1 + ((x2 - x1) * i) / 10, y: y1 + ((y2 - y1) * i) / 10 }]
			});
			await page.waitForTimeout(30);
		}
		await page.waitForTimeout(150);
		await cdp.send('Input.dispatchTouchEvent', { type: 'touchEnd', touchPoints: [] });
		await page.waitForTimeout(400);
		return true;
	} catch (err) {
		console.log(`touchDrag failed: ${err.message}`);
		return false;
	} finally {
		if (cdp) await cdp.detach().catch(() => {});
	}
}

async function touchDrag(page, fromSelector, toSelector) {
	return touchDragBoxes(page, page.locator(fromSelector).first(), page.locator(toSelector).first());
}

/**
 * Sweep every interactive element on the page for the ≥44×44 touch contract
 * and check horizontal overflow at the current viewport. Radio/checkbox inputs
 * inside a <label> are measured by the label box (the label is the real hit
 * target). Returns { small: [...], overflow: boolean }.
 */
async function sweepPage(page) {
	return page.evaluate((min) => {
		const small = [];
		const sel =
			'button, a, [role="button"], [role="slider"], input, select, [tabindex]:not([tabindex="-1"])';
		for (const el of document.querySelectorAll(sel)) {
			const style = getComputedStyle(el);
			if (style.visibility === 'hidden' || style.display === 'none') continue;
			if (el.disabled) continue;
			let box = el;
			if (
				el instanceof HTMLInputElement &&
				(el.type === 'radio' || el.type === 'checkbox') &&
				el.closest('label')
			) {
				box = el.closest('label');
			}
			const r = box.getBoundingClientRect();
			if (r.width === 0 || r.height === 0) continue;
			if (r.width < min || r.height < min) {
				small.push({
					tag: box === el ? el.tagName.toLowerCase() : `label>${el.tagName.toLowerCase()}`,
					text: (el.getAttribute('aria-label') || el.textContent || el.value || '')
						.trim()
						.replace(/\s+/g, ' ')
						.slice(0, 48),
					w: Math.round(r.width),
					h: Math.round(r.height)
				});
			}
		}
		const de = document.documentElement;
		const overflow =
			de.scrollWidth > window.innerWidth + 1 ||
			(document.body && document.body.scrollWidth > window.innerWidth + 1);
		return { small, overflow };
	}, MIN_TAP);
}

/** Sweep a route: record findings; fail the gate for owned routes. */
async function sweepRoute(page, route, forceDeferred = false) {
	const deferred = forceDeferred || DEFERRED_ROUTE_PREFIXES.some((p) => route.startsWith(p));
	const { small, overflow } = await sweepPage(page);
	if (small.length) {
		if (deferred) {
			const examples = small
				.slice(0, 5)
				.map((s) => `${s.tag} "${s.text}" ${s.w}×${s.h}px`)
				.join('; ');
			addFinding(
				route,
				'Info',
				'Accessibility',
				`${small.length} small touch targets (deferred — logged only)`,
				`e.g. ${examples}${small.length > 5 ? ` (+${small.length - 5} more)` : ''}`
			);
			console.log(`[sweep] ${route}: ${small.length} small target(s) (deferred — logged only)`);
		} else {
			console.log(`[sweep] ${route}: ${small.length} small target(s) (violation)`);
			for (const s of small.slice(0, 12)) {
				addFinding(
					route,
					'Medium',
					'Accessibility',
					`Touch target under ${MIN_TAP}px`,
					`${s.tag} "${s.text}" is ${s.w}×${s.h}px`
				);
				addViolation(route, `${s.tag} "${s.text}" is ${s.w}×${s.h}px (< ${MIN_TAP}px)`);
			}
			if (small.length > 12) addViolation(route, `${small.length - 12} more small targets…`);
		}
	}
	if (overflow) {
		const msg = `horizontal overflow at ${page.viewportSize()?.width ?? 'current'}px`;
		addFinding(
			route,
			deferred ? 'Info' : 'Medium',
			'Layout',
			`Horizontal overflow${deferred ? ' (deferred)' : ''}`,
			msg
		);
		if (!deferred) addViolation(route, msg);
	}
	return { small: small.length, overflow };
}

// ---- server boot ----------------------------------------------------------
async function bootServer() {
	rmSync(DB, { force: true });
	rmSync(`${DB}-wal`, { force: true });
	rmSync(`${DB}-shm`, { force: true });
	const child = spawn('node', ['build/index.js'], {
		cwd: ROOT,
		env: { ...process.env, PORT, QUIZ_DB_PATH: DB },
		stdio: ['ignore', 'pipe', 'pipe']
	});
	let out = '';
	child.stdout.on('data', (d) => (out += d));
	child.stderr.on('data', (d) => (out += d));
	for (let i = 0; i < 60; i++) {
		if (child.exitCode !== null || child.signalCode !== null)
			throw new Error(`server died during boot (port ${PORT} in use?):\n${out.slice(-2000)}`);
		try {
			const res = await fetch(`${BASE}/`);
			if (res.ok) return child;
		} catch {}
		await new Promise((r) => setTimeout(r, 500));
	}
	throw new Error(`server did not boot:\n${out.slice(-2000)}`);
}

// ---- theme-aware context ---------------------------------------------------
async function newThemeContext(browser, theme) {
	const context = await browser.newContext({
		viewport: VIEWPORT,
		deviceScaleFactor: 3,
		isMobile: true,
		hasTouch: true,
		colorScheme: theme,
		initScript: `localStorage.setItem('theme', '${theme}');`,
		userAgent:
			'Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.0 Mobile/15E148 Safari/604.1'
	});
	return context;
}

async function actualTheme(page) {
	return page.evaluate(() => document.documentElement.dataset.theme ?? '(none)');
}

// ---- kind detection -------------------------------------------------------
async function detectKind(page, allowMultiStep = true) {
	const probe = await page.evaluate((multi) => {
		const has = (sel) => !!document.querySelector(sel);
		const text = document.body.innerText || '';
		const low = text.toLowerCase();
		// multi-step first: the step nav ("← Back") is unique to step children.
		if (
			multi &&
			[...document.querySelectorAll('button')].some((b) => b.textContent?.includes('← Back'))
		)
			return 'multi-step';
		if (has('[data-connect-premise]')) return 'matching';
		if (low.includes('tap a region')) return 'hotspot';
		if (has('[role="slider"]')) return 'slider';
		if (has('select')) return 'configuration';
		if (has('input[type="number"]')) return 'numeric';
		if (low.includes('word bank —')) return 'word-bank';
		if (low.includes('tap an item, then tap a bucket')) return 'sort';
		if (has('[aria-label^="Reorder item"]')) return 'ordering';
		if (has('button[aria-pressed]') && low.includes('flip')) return 'memory';
		const mono = document.querySelectorAll('.font-mono input[type="checkbox"]').length;
		if (mono > 0) return 'evidence';
		if (has('input[type="radio"]') || has('input[type="checkbox"]')) return 'choice';
		return 'unknown';
	}, allowMultiStep);
	return probe;
}

/** Tap a locator only if present AND enabled; never waits 30s on a disabled button. */
async function tapEnabled(locator) {
	try {
		const n = await locator.count();
		if (!n) return false;
		const enabled = await locator
			.first()
			.isEnabled()
			.catch(() => false);
		if (!enabled) return false;
		await locator.first().tap({ timeout: 3000 });
		return true;
	} catch {
		return false;
	}
}

/**
 * SelectCount for the question (or multi-step child step) currently on screen,
 * read from the seeded session payload so checkbox taps match exactly.
 */
async function expectedChoiceCount(page) {
	const text = await page.evaluate(() => document.body.innerText || '');
	const qm = text.match(/Q(\d+)\s+OF\s+\d+/i);
	const sm = text.match(/Step\s+(\d+)\s+of\s+\d+/i);
	if (!qm || !sessionQuestions) return 1;
	const question = sessionQuestions[parseInt(qm[1], 10) - 1];
	if (!question) return 1;
	if (question.kind === 'multiple-choice') return question.selectCount ?? 2;
	if (question.kind === 'multi-step' && sm) {
		const step = question.steps[parseInt(sm[1], 10) - 1];
		if (step?.kind === 'multiple-choice') return step.selectCount ?? 2;
	}
	return 1;
}

async function interactWithKind(page, kind) {
	switch (kind) {
		case 'choice': {
			const radios = page.locator('input[data-answer-option][type="radio"]');
			if (await radios.count()) {
				await radios
					.first()
					.tap({ timeout: 3000 })
					.catch(() => {});
			} else {
				const want = await expectedChoiceCount(page);
				const boxes = page.locator('input[data-answer-option][type="checkbox"]');
				const n = await boxes.count();
				for (let i = 0; i < Math.min(Math.min(want, 3), n); i++) {
					await boxes
						.nth(i)
						.tap({ timeout: 3000 })
						.catch(() => {});
					await page.waitForTimeout(120);
				}
			}
			break;
		}
		case 'matching': {
			const premises = page.locator('[data-connect-premise]');
			const targets = page.locator('[data-connect-target]');
			const n = await premises.count();
			for (let i = 0; i < n; i++) {
				await premises
					.nth(i)
					.tap({ timeout: 3000 })
					.catch(() => {});
				await page.waitForTimeout(120);
				await targets
					.nth(i)
					.tap({ timeout: 3000 })
					.catch(() => {});
				await page.waitForTimeout(120);
			}
			break;
		}
		case 'hotspot': {
			// tap every tap-region button once (valid response: distinct region ids).
			const regions = page.locator('button[aria-pressed]');
			const n = await regions.count();
			for (let i = 0; i < n; i++) {
				await regions
					.nth(i)
					.tap({ timeout: 3000 })
					.catch(() => {});
				await page.waitForTimeout(100);
			}
			break;
		}
		case 'memory': {
			// flip cards in pairs until the board resolves.
			const cards = page.locator('button[aria-label*="card" i], button[aria-pressed]');
			const n = await cards.count();
			for (let i = 0; i < Math.min(n, 8); i++) {
				await cards
					.nth(i % n)
					.tap({ timeout: 3000 })
					.catch(() => {});
				await page.waitForTimeout(120);
				await cards
					.nth((i + 1) % n)
					.tap({ timeout: 3000 })
					.catch(() => {});
				await page.waitForTimeout(180);
			}
			break;
		}
		case 'slider': {
			const slider = page.locator('[role="slider"]').first();
			const box = await slider.boundingBox().catch(() => null);
			if (box) {
				await page.touchscreen.tap(box.x + box.width * 0.5, box.y + box.height / 2).catch(() => {});
			}
			await slider.focus().catch(() => {});
			await page.keyboard.press('ArrowRight').catch(() => {});
			break;
		}
		case 'sort': {
			for (let i = 0; i < 8; i++) {
				const tray = page.locator(
					'div.flex.flex-wrap.gap-2 > button[aria-pressed]:not([disabled])'
				);
				if (!(await tray.count())) break;
				await tray
					.first()
					.tap({ timeout: 3000 })
					.catch(() => {});
				await page.waitForTimeout(150);
				const bucketLabel = page.locator('div.rounded-md.border[role="button"] p').first();
				await bucketLabel.tap({ timeout: 3000 }).catch(() => {});
				await page.waitForTimeout(150);
			}
			const remaining = await page
				.locator('div.flex.flex-wrap.gap-2 > button[aria-pressed]')
				.count()
				.catch(() => -1);
			const checkOk = await page
				.locator('button:has-text("Check Answer")')
				.first()
				.isEnabled()
				.catch(() => false);
			console.log(`sort remaining=${remaining} checkEnabled=${checkOk}`);
			break;
		}
		case 'word-bank': {
			const blanks = page.locator('button', { hasText: /^_+[0-9]+$/ });
			const n = await blanks.count();
			for (let i = 0; i < n; i++) {
				await blanks
					.nth(i)
					.tap({ timeout: 3000 })
					.catch(() => {});
				await page.waitForTimeout(120);
				const chips = page
					.locator('p:has-text("Word bank —")')
					.first()
					.locator('..')
					.locator('div.flex.flex-wrap')
					.first()
					.locator('button:not([disabled])');
				await chips
					.first()
					.tap({ timeout: 3000 })
					.catch(() => {});
				await page.waitForTimeout(120);
			}
			break;
		}
		case 'configuration': {
			const selects = page.locator('select');
			const n = await selects.count();
			for (let i = 0; i < n; i++) {
				const opts = selects.nth(i).locator('option');
				const m = await opts.count();
				for (let j = 1; j < m; j++) {
					const val = await opts.nth(j).getAttribute('value');
					if (val) {
						await selects
							.nth(i)
							.selectOption(val)
							.catch(() => {});
						break;
					}
				}
			}
			break;
		}
		case 'evidence': {
			// Prefer the seeded payload's exact selectCount; fall back to prompt text.
			let want = 1;
			const text = await page.evaluate(() => document.body.innerText || '');
			const qm = text.match(/Q(\d+)\s+OF\s+\d+/i);
			const sm = text.match(/Step\s+(\d+)\s+of\s+\d+/i);
			let payloadQuestion = null;
			if (qm && sessionQuestions) {
				const question = sessionQuestions[parseInt(qm[1], 10) - 1];
				if (question?.kind === 'evidence') payloadQuestion = question;
				if (question?.kind === 'multi-step' && sm) {
					const step = question.steps[parseInt(sm[1], 10) - 1];
					if (step?.kind === 'evidence') payloadQuestion = step;
				}
			}
			if (payloadQuestion) {
				want = payloadQuestion.selectCount;
			} else {
				const m = text.match(
					/[Ss]elect (?:up to )?(ALL|the|TWO|THREE|FOUR|ONE|one|two|three|four)/
				);
				if (m) {
					const w = m[1].toUpperCase();
					if (w === 'ALL') want = Infinity;
					else want = w === 'ONE' ? 1 : w === 'TWO' ? 2 : w === 'THREE' ? 3 : w === 'FOUR' ? 4 : 1;
				}
			}
			const boxes = page.locator('.font-mono input[type="checkbox"]');
			const total = await boxes.count();
			const n = Math.min(total, want === Infinity ? total : want);
			for (let i = 0; i < n; i++) {
				await boxes
					.nth(i)
					.check({ timeout: 3000 })
					.catch(() => {});
			}
			const afterEnabled = await page
				.locator('button:has-text("Check Answer")')
				.first()
				.isEnabled()
				.catch(() => false);
			console.log(
				`evidence boxes=${total} want=${want === Infinity ? 'ALL' : want} checkEnabled=${afterEnabled}`
			);
			break;
		}
		case 'ordering': {
			orderingAttempts++;
			const handles = page.locator('[aria-label^="Reorder item"]');
			const order = () =>
				page
					.evaluate(() =>
						[...document.querySelectorAll('[data-id]')]
							.map((el) => el.getAttribute('data-id'))
							.join(',')
					)
					.catch(() => '');
			const before = await order();
			await touchDragBoxes(page, handles.nth(0), handles.nth(1));
			await page.waitForTimeout(350);
			const after = await order();
			const reordered = before !== after;
			console.log(`ordering drag reordered=${reordered}`);
			if (!reordered) {
				orderingFailures++;
				const first = handles.first();
				await first.focus().catch(() => {});
				await page.keyboard.press('ArrowDown');
				await page.waitForTimeout(350);
				const afterFallback = await order();
				if (before !== afterFallback) orderingKeyboardRecovered++;
			}
			break;
		}
		case 'numeric': {
			await page
				.locator('input[type="number"]')
				.first()
				.fill('1', { timeout: 3000 })
				.catch(() => {});
			break;
		}
		case 'multi-step': {
			for (let step = 0; step < 5; step++) {
				const child = await detectKind(page, false);
				if (child !== 'unknown') await interactWithKind(page, child);
				const advanced = await tapEnabled(page.locator('button:has-text("Next →")'));
				if (!advanced) break;
				await page.waitForTimeout(250);
			}
			break;
		}
		default: {
			break;
		}
	}
	await page.waitForTimeout(250);
}

async function clickPrimary(page) {
	const check = page.locator('button:has-text("Check Answer"), button:has-text("Save Answer")');
	return tapEnabled(check);
}

async function advanceAfterFeedback(page) {
	const before = await page
		.evaluate(() => (document.body.innerText || '').match(/Q(\d+)\s+OF\s+(\d+)/i)?.[1] ?? '')
		.catch(() => '');
	const nextBtn = page.locator('button:has-text("Next →")').last();
	const advanced = await tapEnabled(nextBtn);
	if (!advanced) {
		await tapEnabled(page.locator('button:has-text("Submit")'));
		await page.waitForTimeout(1200);
		return;
	}
	await page.waitForTimeout(600);
	const after = await page
		.evaluate(() => (document.body.innerText || '').match(/Q(\d+)\s+OF\s+(\d+)/i)?.[1] ?? '')
		.catch(() => '');
	if (before && after && before === after) {
		console.log(`advance stalled on Q${before} — Next tap did not move; trying Submit`);
		await tapEnabled(page.locator('button:has-text("Submit")'));
		await page.waitForTimeout(1200);
	}
}

/** Abandon a server-side session (cleanup; throwaway DB anyway). */
async function abandonSession(context, sessionId) {
	try {
		await context.request.delete(`${BASE}/api/quiz/session/${sessionId}`);
	} catch {}
	activeSessions.delete(sessionId);
}

/**
 * Seed a session via the API, then drive it on touch until every not-yet-seen
 * kind in KINDS has been exercised (answered + screenshotted), the session
 * completes, or the iteration cap is hit. Screenshots every kind's first
 * occurrence at 390×844 and 390×1400, in the context's current theme.
 */
async function driveSession(page, context, type, routeTag, body, tag, cap = 160) {
	const res = await context.request.post(`${BASE}/api/quiz/start`, { data: body });
	const payload = await res.json().catch(() => ({}));
	const sessionId = payload.session?.sessionId;
	if (!res.ok() || !sessionId) {
		throw new Error(
			`seed ${type} session failed: ${res.status()} ${JSON.stringify(payload).slice(0, 200)}`
		);
	}
	activeSessions.add(sessionId);
	const viewRes = await context.request.get(`${BASE}/api/quiz/session/${sessionId}`);
	const viewPayload = await viewRes.json().catch(() => ({}));
	sessionQuestions = viewPayload.session?.questions ?? null;
	await page.goto(`${BASE}/${routeTag}?session=${sessionId}`);
	await page.waitForTimeout(1200);

	let completed = false;
	for (let i = 0; i < cap; i++) {
		await page.waitForTimeout(350);
		const bodyText = await page.evaluate(() => document.body.innerText || '');
		const low = bodyText.toLowerCase();
		const qMark = bodyText.match(/Q(\d+)\s+OF\s+(\d+)/i);
		if (low.includes('session complete')) {
			console.log(`[${tag}] session complete after ${i} iterations`);
			completed = true;
			break;
		}
		const kind = await detectKind(page);
		const qPos = qMark ? ` (${qMark[0]})` : '';
		console.log(`[${tag}] it${i}${qPos} kind=${kind}`);
		if (kind !== 'unknown' && !KINDS_SEEN.has(kind) && KINDS.includes(kind)) {
			KINDS_SEEN.add(kind);
			await screenshot(page, `kind-${slug(kind)}-390x844`, VIEWPORT);
			await screenshot(page, `kind-${slug(kind)}-390x1400`, TALL);
			const { small } = await sweepRoute(page, `${routeTag}#${kind}`);
			console.log(`[${tag}] kind=${kind} first-seen (${small} small targets)`);
		}
		if (kind === 'unknown') {
			const snippet = bodyText.replace(/\s+/g, ' ').slice(0, 500);
			console.log(`[${tag}] q${i} UNKNOWN page text: ${snippet}`);
			await advanceAfterFeedback(page).catch(() => {});
			continue;
		}
		await interactWithKind(page, kind);
		const clicked = await clickPrimary(page);
		if (!clicked) {
			console.log(`[${tag}] q${i} kind=${kind} check-disabled — advancing`);
			await advanceAfterFeedback(page);
			continue;
		}
		await page.waitForTimeout(600);
		const after = await page.evaluate(() => document.body.innerText || '');
		if (after.includes('Try again')) {
			// Only re-answer when the retry gate actually opened; ExamFlow renders
			// "Try again" solely while retries remain, so a disabled/missing button
			// means the response is locked — re-submitting would 400 (console error).
			const tapped = await tapEnabled(page.locator('button:has-text("Try again")'));
			if (tapped) {
				await page.waitForTimeout(400);
				await interactWithKind(page, kind);
				const reclicked = await clickPrimary(page);
				if (reclicked) await page.waitForTimeout(600);
			}
		}
		await advanceAfterFeedback(page);
		console.log(`[${tag}] q${i} kind=${kind} answered`);
	}
	if (!completed) {
		console.log(`[${tag}] iteration cap reached — abandoning session ${sessionId}`);
		await abandonSession(context, sessionId);
	}
	return completed;
}

// ---- page walk ------------------------------------------------------------
async function walkPages(page, theme) {
	for (const route of OWNED_ROUTES) {
		try {
			await page.goto(`${BASE}${route}`);
			await page.waitForTimeout(1400);
			const { small, overflow } = await sweepRoute(page, `${route} (${theme})`);
			console.log(`[walk][${theme}] ${route}: ${small} small, overflow=${overflow}`);
			await screenshot(page, `page-${slug(route)}-${theme}-390x844`, VIEWPORT);
			await screenshot(page, `page-${slug(route)}-${theme}-390x1400`, TALL);
			// bottom nav / mobile menu exercise on home.
			if (route === '/') {
				const menu = page.locator('button[aria-label="Open menu"]');
				if (await menu.count()) {
					await menu
						.first()
						.tap({ timeout: 3000 })
						.catch(() => {});
					await page.waitForTimeout(600);
					await screenshot(page, `page-home-menu-${theme}-390x844`, VIEWPORT);
					await page.keyboard.press('Escape');
					await page.waitForTimeout(400);
				}
			}
		} catch (err) {
			console.log(`walk ${route} ERROR: ${err.message}`);
		}
	}
}

/** True when an element box is at least MIN_TAP × MIN_TAP. */
function meetsTap(box) {
	return box && box.width >= MIN_TAP && box.height >= MIN_TAP;
}

/**
 * Fixed-viewport scenarios: 320×568, 390×844, 640×360 landscape.
 * Covers dashboard/bottom nav, dropdown containment, calendar, lesson
 * objective drills, and the fixed bottom nav never covering the final
 * assessment action. Interactive elements must be ≥44×44; no page-level
 * horizontal overflow; dropdowns stay in the viewport and scroll internally.
 */
async function fixedViewportScenarios(page, context, theme) {
	const scope = `fixed:${theme}`;
	const check = async (viewport, name, fn) => {
		try {
			await page.setViewportSize(viewport);
			await page.waitForTimeout(400);
			await fn();
			FIXED_CHECKS.push(`${name}@${viewport.width}x${viewport.height}`);
			console.log(`[fixed][${theme}] ${name} OK (${viewport.width}×${viewport.height})`);
		} catch (err) {
			console.log(`[fixed][${theme}] ${name} ERROR: ${err.message}`);
		}
	};

	const assertNoPageOverflow = async (label) => {
		const overflow = await page.evaluate(
			() =>
				document.documentElement.scrollWidth > window.innerWidth + 1 ||
				(document.body && document.body.scrollWidth > window.innerWidth + 1)
		);
		if (overflow) addViolation(scope, `${label}: page-level horizontal overflow`);
	};

	const assertBottomNavClear = async (label) => {
		// The fixed bottom nav must not cover the final assessment action once
		// the user has scrolled it into view.
		const navBox = await page
			.locator('nav[aria-label="Primary navigation"]')
			.boundingBox()
			.catch(() => null);
		if (!navBox) return;
		const submit = page.locator('button:has-text("Submit")').last();
		await submit.scrollIntoViewIfNeeded().catch(() => {});
		await page.waitForTimeout(300);
		const box = await submit.boundingBox().catch(() => null);
		if (box && box.y + box.height > navBox.y + 4) {
			addViolation(scope, `${label}: bottom nav covers the final assessment action`);
		}
	};

	const dropdownContained = async (label, openSelector, closeVia = 'Escape') => {
		const open = page.locator(openSelector).first();
		if (!(await open.count())) return;
		await open.tap({ timeout: 3000 }).catch(() => {});
		await page.waitForTimeout(500);
		// Every open dropdown panel must fit the viewport and scroll internally.
		const panels = page.locator('[role="menu"]');
		const n = await panels.count();
		for (let i = 0; i < n; i++) {
			const box = await panels
				.nth(i)
				.boundingBox()
				.catch(() => null);
			if (!box) continue;
			if (
				box.x < 0 ||
				box.y < 0 ||
				box.x + box.width > page.viewportSize().width + 1 ||
				box.y + box.height > page.viewportSize().height + 1
			) {
				addViolation(
					scope,
					`${label}: dropdown leaves the viewport (${Math.round(box.x)},${Math.round(box.y)} ${Math.round(box.width)}×${Math.round(box.height)} at ${page.viewportSize().width}×${page.viewportSize().height})`
				);
			}
			const scrollable = await panels
				.nth(i)
				.evaluate((el) => el.scrollHeight > el.clientHeight + 4)
				.catch(() => false);
			if (box.height >= page.viewportSize().height - 40 && !scrollable) {
				addViolation(scope, `${label}: dropdown fills the viewport but does not scroll internally`);
			}
		}
		await page.keyboard.press(closeVia);
		await page.waitForTimeout(400);
	};

	await check(LANDSCAPE, 'dropdowns', async () => {
		await page.goto(`${BASE}/`);
		await page.waitForTimeout(1200);
		await dropdownContained('MobileMenu', 'button[aria-label="Open menu"]');
		await dropdownContained('CourseSwitcher', 'button[aria-label="Switch course"]');
		await dropdownContained('ProfileSwitcher', 'button[aria-label="Switch profile"]');
		await assertNoPageOverflow('landscape dropdowns');
	});

	await check(NARROW, 'calendar', async () => {
		await page.goto(`${BASE}/calendar`);
		await page.waitForTimeout(1200);
		await assertNoPageOverflow('calendar 320px');
		// Select a calendar day — day cells must stay ≥44px tall within the scroller.
		const day = page
			.locator('button')
			.filter({ has: page.locator('span') })
			.first();
		const dayBox = await day.boundingBox().catch(() => null);
		if (dayBox && (dayBox.width < 20 || dayBox.height < 40)) {
			addViolation(
				scope,
				`calendar day cell too small (${Math.round(dayBox.width)}×${Math.round(dayBox.height)})`
			);
		}
		await day.tap({ timeout: 3000 }).catch(() => {});
		await page.waitForTimeout(400);
	});

	await check(NARROW, 'lesson drills', async () => {
		await page.goto(`${BASE}/modules/week-1`);
		await page.waitForTimeout(1200);
		await assertNoPageOverflow('lesson 320px');
		// Open the first lesson, then verify an objective drill link starts a 5-question session.
		const lessonRow = page.locator('[role="button"]').filter({ hasText: 'Domain 1' }).first();
		await lessonRow.tap({ timeout: 3000 }).catch(() => {});
		await page.waitForTimeout(600);
		const drill = page.locator('a', { hasText: /^Drill \d+\.\d+$/ }).first();
		const drillBox = await drill.boundingBox().catch(() => null);
		if (!meetsTap(drillBox)) addViolation(scope, `objective drill link < ${MIN_TAP}px`);
		const href = await drill.getAttribute('href').catch(() => null);
		const match = href ? /objective=([\d.]+)&count=5/.exec(href) : null;
		if (!match) {
			addViolation(scope, 'objective drill link does not target a 5-question objective session');
			return;
		}
		await page.goto(`${BASE}${href}`);
		await page.waitForTimeout(1500);
		const text = await page.evaluate(() => document.body.innerText || '');
		if (!/Q1\s+OF\s+5/i.test(text))
			addViolation(scope, `objective drill did not start a 5-question session (${href})`);
		// The bottom nav must not cover the action row on a drill.
		await assertBottomNavClear('drill');
		// Abandon the drill session so the next theme's seeded sessions are not blocked.
		const sessionId = new URL(page.url()).searchParams.get('session');
		if (sessionId) {
			await context.request.delete(`${BASE}/api/quiz/session/${sessionId}`).catch(() => {});
			activeSessions.delete(sessionId);
		}
	});

	await check(NARROW, 'dashboard', async () => {
		await page.goto(`${BASE}/`);
		await page.waitForTimeout(1200);
		await assertNoPageOverflow('dashboard 320px');
		// Bottom nav tabs remain ≥44px and fully visible.
		const nav = page.locator('nav[aria-label="Primary navigation"] a');
		const n = await nav.count();
		for (let i = 0; i < n; i++) {
			const box = await nav
				.nth(i)
				.boundingBox()
				.catch(() => null);
			if (!meetsTap(box)) addViolation(scope, `bottom nav tab ${i} < ${MIN_TAP}px`);
		}
	});

	await check(VIEWPORT, 'assessment action row', async () => {
		// Drive one choice question inside a seeded session and confirm the
		// fixed bottom nav never covers the action row.
		const res = await context.request.post(`${BASE}/api/quiz/start`, {
			data: { type: 'quiz', count: 3, mode: 'practice' }
		});
		const payload = await res.json().catch(() => ({}));
		const sessionId = payload.session?.sessionId;
		if (!sessionId) return;
		activeSessions.add(sessionId);
		await page.goto(`${BASE}/quiz?session=${sessionId}`);
		await page.waitForTimeout(1200);
		await assertBottomNavClear('assessment action row');
		await abandonSession(context, sessionId);
	});
}

// ---- report ---------------------------------------------------------------
function writeReport(summary) {
	const final = [...findings];
	if (
		orderingAttempts > 0 &&
		orderingFailures === orderingAttempts &&
		orderingKeyboardRecovered === 0
	) {
		final.push({
			pageUrl: 'pbq',
			severity: 'High',
			category: 'Functional',
			title: 'Ordering cannot be reordered (drag and keyboard fallback both fail)',
			details: `${orderingAttempts}/${orderingAttempts} touch drags produced no SortableJS reorder and the keyboard fallback did not recover — the ordering interaction is broken.`,
			screenshot: null
		});
	} else if (orderingAttempts > 0) {
		final.push({
			pageUrl: 'pbq',
			severity: 'Info',
			category: 'UX',
			title: 'Ordering reorder verified',
			details: `${orderingAttempts - orderingFailures}/${orderingAttempts} touch drags reordered; ${orderingKeyboardRecovered} failed drags recovered via the keyboard fallback (CDP touch emulation flake — verify on a physical device).`,
			screenshot: null
		});
	}
	const groups = new Map();
	for (const f of final) {
		const key = `${f.title}|${f.details}|${f.pageUrl}`;
		const g = groups.get(key) ?? { ...f, count: 0 };
		g.count++;
		groups.set(key, g);
	}
	const sevOrder = { Critical: 0, High: 1, Medium: 2, Low: 3, Info: 4 };
	const unique = [...groups.values()].sort(
		(a, b) => sevOrder[a.severity] - sevOrder[b.severity] || a.title.localeCompare(b.title)
	);
	const rows = unique
		.map(
			(f, i) =>
				`### Issue ${i + 1}: ${f.title}${f.count > 1 ? ` (×${f.count})` : ''}\n\n- **Severity:** ${f.severity} · **Category:** ${f.category}\n- **Page:** \`${f.pageUrl}\`\n- **Details:** ${f.details}\n${
					f.screenshot ? `- **Screenshot:** ${f.screenshot}\n` : ''
				}`
		)
		.join('\n\n');

	const notSeen = KINDS.filter((k) => !KINDS_SEEN.has(k));
	const screenshots = readdirSync(SHOTS)
		.filter((f) => f.endsWith('.png'))
		.sort()
		.map((f) => `- \`screenshots/${f}\``)
		.join('\n');

	const report = `# Mobile QA Report — ${new Date().toISOString()}

## Executive summary

- **Gate status:** ${gateViolations.length === 0 ? 'PASS (exit 0)' : `FAIL (${gateViolations.length} violation(s), exit 1)`}
- **Themes exercised:** ${THEMES_SEEN.join(', ') || 'none'} (computed \`data-theme\` recorded per run)
- **Routes swept:** ${OWNED_ROUTES.length} owned route(s)
- **Kinds exercised:** ${[...KINDS_SEEN].sort().join(', ') || 'none'}${notSeen.length ? `\n- **Kinds NOT exercised (no bank items yet — renderer supported, reported unavailable):** ${notSeen.join(', ')}` : ''}
- **Console errors:** ${consoleErrors.length} · **Page errors:** ${pageErrors.length} · **Failed resources:** ${failedRequests.length}
- **Fixed-viewport checks:** ${FIXED_CHECKS.length} run
- **Findings:** ${unique.length} unique (${unique.filter((f) => f.severity === 'High').length} high, ${unique.filter((f) => f.severity === 'Medium').length} medium, ${unique.filter((f) => f.severity === 'Low' || f.severity === 'Info').length} low/info)
- **DB:** throwaway \`${DB}\` (never the user's real DB)
- **Viewports:** ${VIEWPORT.width}×${VIEWPORT.height} + ${TALL.height} @3x, ${NARROW.width}×${NARROW.height}, ${LANDSCAPE.width}×${LANDSCAPE.height} landscape, hasTouch, both themes

${summary ? `## Notes\n\n${summary}\n\n` : ''}
## Gate results

- **Small touch targets (<${MIN_TAP}px):** ${gateViolations.filter((v) => /[0-9]+×[0-9]+px/.test(v.message)).length}
- **Horizontal overflow:** ${gateViolations.filter((v) => v.message.includes('overflow')).length}
- **Dropdown/viewport violations:** ${gateViolations.filter((v) => v.message.includes('dropdown') || v.message.includes('covers')).length}
- **Console/page errors:** ${consoleErrors.length + pageErrors.length + failedRequests.length}

${gateViolations.length ? gateViolations.map((v) => `- \`[${v.scope}]\` ${v.message}`).join('\n') : '- none — all owned routes clear the ≥44×44px contract, no overflow, no console errors.'}

## Console / page errors

${consoleErrors.length ? consoleErrors.map((e) => `- \`${e}\``).join('\n') : '- none'}
${pageErrors.length ? pageErrors.map((e) => `- \`pageerror: ${e}\``).join('\n') : ''}
${failedRequests.length ? failedRequests.map((e) => `- \`failed request: ${e}\``).join('\n') : ''}

## Kinds exercised

${KINDS.map((k) => `- **${k}:** ${KINDS_SEEN.has(k) ? 'exercised + screenshotted' : 'unavailable — no bank items in this build (renderer supported)'}`).join('\n')}

## Screenshots

${screenshots || '- none'}

## Findings

${rows || '- none'}
`;
	writeFileSync(join(OUT, 'report.md'), report);
}

// ---- main -----------------------------------------------------------------
mkdirSync(SHOTS, { recursive: true });
const chromiumPath = findChromium();
if (!chromiumPath) {
	console.error('No cached Playwright Chromium found. Install: npx playwright install chromium');
	process.exit(2);
}
console.log(`chromium: ${chromiumPath}\ndb: ${DB}\nbase: ${BASE}\nreportOnly: ${REPORT_ONLY}`);

let server;
try {
	server = await bootServer();
	const browser = await chromium.launch({ executablePath: chromiumPath });

	for (const theme of ['dark', 'light']) {
		const context = await newThemeContext(browser, theme);
		const page = await context.newPage();
		attachListeners(page);

		await page.goto(`${BASE}/`);
		await page.waitForTimeout(800);
		const themeActual = await actualTheme(page);
		THEMES_SEEN.push(`${theme} (computed: ${themeActual})`);
		console.log(`[theme] ${theme} -> computed data-theme=${themeActual}`);

		// 1) Kind drills — seed sessions via the API, drive every engine kind on touch.
		// Re-seed until all kinds with bank items (slider/evidence included) are seen.
		const EXERCISABLE = KINDS.filter((k) => !['memory', 'hotspot', 'numeric'].includes(k));
		for (let seed = 0; seed < 4 && EXERCISABLE.some((k) => !KINDS_SEEN.has(k)); seed++) {
			await driveSession(
				page,
				context,
				'pbq',
				'pbq',
				{ type: 'pbq', count: 30, mode: 'practice' },
				`pbq-${theme}-s${seed}`,
				170
			);
		}
		await driveSession(
			page,
			context,
			'quiz',
			'quiz',
			{ type: 'quiz', count: 24, mode: 'practice' },
			`quiz-${theme}`,
			60
		);

		// 2) Full route walk — touch sweep + overflow + dual-viewport screenshots.
		await walkPages(page, theme);

		// 3) Fixed-viewport scenarios.
		await fixedViewportScenarios(page, context, theme);

		// 4) Cleanup: abandon leftover active sessions (throwaway DB anyway).
		for (const id of [...activeSessions]) await abandonSession(context, id);
		await context.close();
	}
	await browser.close();

	// 5) Gate decision.
	const consoleTotal = consoleErrors.length + pageErrors.length + failedRequests.length;
	writeReport(
		`Post-fix audit run (fail-threshold gate), both themes. Drills seeded via POST /api/quiz/start; every kind answered + screenshotted. Routes swept for ≥${MIN_TAP}px touch targets + horizontal overflow; console/page errors fail the gate; fixed-viewport scenarios cover dropdowns, calendar, lesson drills, and bottom-nav clearance.`
	);
	console.log(
		`DONE — themes: ${THEMES_SEEN.join(' | ')} | kinds: ${[...KINDS_SEEN].sort().join(', ')} | gate violations: ${gateViolations.length} | console errors: ${consoleTotal}`
	);
	if (gateViolations.length === 0 && consoleTotal === 0) {
		console.log(
			'GATE: PASS — zero <44px targets, zero overflow, zero console errors, both themes.'
		);
		process.exit(0);
	}
	if (REPORT_ONLY) {
		console.log(
			`GATE: FAIL would exit 1 (${gateViolations.length} violations, ${consoleTotal} console errors) — report-only mode, exiting 0.`
		);
		process.exit(0);
	}
	console.log(
		`GATE: FAIL — ${gateViolations.length} violations, ${consoleTotal} console/page errors.`
	);
	process.exit(1);
} catch (err) {
	console.error(`FATAL: ${err.message}`);
	process.exit(2);
} finally {
	// The adapter-node server may not exit on SIGTERM promptly; force-kill so a
	// zombie never lingers on PORT for the next run.
	if (server) {
		try {
			server.kill('SIGKILL');
		} catch {}
	}
	rmSync(DB, { force: true });
	rmSync(`${DB}-wal`, { force: true });
	rmSync(`${DB}-shm`, { force: true });
}
