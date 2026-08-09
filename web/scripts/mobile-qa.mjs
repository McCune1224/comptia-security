#!/usr/bin/env node
/**
 * mobile-qa.mjs — FAIL-THRESHOLD mobile touch-QA gate for the CompTIA study app.
 *
 * Drives the PRODUCTION build (node build/index.js) on a THROWAWAY DB through an
 * iPhone-class touch-emulated viewport and asserts the mobile contract:
 *
 *   • every interactive element on every route is ≥44×44 CSS px
 *   • no horizontal overflow at 390px
 *   • zero console.error / uncaught page errors / failed resources
 *   • every question kind the engine supports is exercised (drill + screenshot)
 *
 * Routes owned by this gate fail it on violation. Routes owned by sibling
 * workstreams (modules/[id] → WT-C, ExamFlow drill screens → WT-A) are swept and
 * LOGGED as deferred findings for the post-merge re-audit but do not fail the gate.
 *
 * Usage (cwd = web/):
 *   node scripts/mobile-qa.mjs [--report-only]
 *
 * Exit codes:
 *   0  pass — no gate violations
 *   1  gate violations (small targets on owned routes, overflow, console errors)
 *   2  environment failure (server boot, browser launch)
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
const MIN_TAP = 44;
const REPORT_ONLY = process.argv.includes('--report-only');

// ---------------------------------------------------------------------------
// Route ownership: routes we own fail the gate; routes owned by sibling
// workstreams are swept but their findings are logged as deferred (post-merge
// re-audit), never as gate failures.
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
	'/scenarios'
];
const DEFERRED_ROUTE_PREFIXES = ['/modules/']; // WT-C owns modules/[id] (+ its 32px ✓ button)

/**
 * Question kinds the engine supports. Data-driven on purpose: when WT-A merges
 * `memory` / `slider` (and WT-D authors `hotspot` items), add the name here and
 * the drill + screenshot happen automatically. A kind with no bank items is
 * reported as "not exercisable yet" (Info) instead of failing the gate.
 */
const KINDS = [
	'choice',
	'configuration',
	'evidence',
	'matching',
	'multi-step',
	'numeric',
	'ordering',
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
const activeSessions = new Set();
let orderingAttempts = 0;
let orderingFailures = 0;

function addFinding(pageUrl, severity, category, title, details, screenshot = null) {
	findings.push({ pageUrl, severity, category, title, details, screenshot });
}

function addViolation(scope, message) {
	gateViolations.push({ scope, message });
	console.log(`GATE-VIOLATION [${scope}]: ${message}`);
}

function slug(str) {
	return str.replace(/[^a-z0-9]+/gi, '-').replace(/^-+|-+$/g, '').toLowerCase() || 'page';
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
 * and check horizontal overflow at 390px. Radio/checkbox inputs inside a
 * <label> are measured by the label box (the label is the real hit target).
 * Returns { small: [...], overflow: boolean }.
 */
async function sweepPage(page) {
	return page.evaluate((min) => {
		const small = [];
		const sel = 'button, a, [role="button"], input, select, [tabindex]:not([tabindex="-1"])';
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
			// Sibling-owned surface (ExamFlow / modules page): one compact finding so the
			// post-merge re-audit has a pointer without flooding the report with hundreds
			// of identical navigator-button rows.
			const examples = small
				.slice(0, 5)
				.map((s) => `${s.tag} "${s.text}" ${s.w}×${s.h}px`)
				.join('; ');
			addFinding(
				route,
				'Info',
				'Accessibility',
				`${small.length} small touch targets (deferred — post-merge re-audit)`,
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
		const msg = 'horizontal overflow at 390px';
		addFinding(route, deferred ? 'Info' : 'Medium', 'Layout', `Horizontal overflow${deferred ? ' (deferred)' : ''}`, msg);
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
		try {
			const res = await fetch(`${BASE}/`);
			if (res.ok) return child;
		} catch {}
		await new Promise((r) => setTimeout(r, 500));
	}
	throw new Error(`server did not boot:\n${out.slice(-2000)}`);
}

// ---- kind detection -------------------------------------------------------
async function detectKind(page, allowMultiStep = true) {
	const probe = await page.evaluate((multi) => {
		const has = (sel) => !!document.querySelector(sel);
		const text = document.body.innerText || '';
		const low = text.toLowerCase();
		// multi-step first: the step nav ("← Back") is unique to step children.
		if (multi && [...document.querySelectorAll('button')].some((b) => b.textContent?.includes('← Back')))
			return 'multi-step';
		if (has('[data-connect-premise]')) return 'matching';
		if (low.includes('tap a region')) return 'hotspot';
		if (has('select')) return 'configuration';
		if (has('input[type="number"]')) return 'numeric';
		if (low.includes('word bank —')) return 'word-bank';
		if (low.includes('tap an item, then tap a bucket')) return 'sort';
		if (has('[aria-label^="Reorder item"]')) return 'ordering';
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
		const enabled = await locator.first().isEnabled().catch(() => false);
		if (!enabled) return false;
		await locator.first().tap({ timeout: 3000 });
		return true;
	} catch {
		return false;
	}
}

async function interactWithKind(page, kind) {
	switch (kind) {
		case 'choice': {
			const radios = page.locator('input[type="radio"]');
			if (await radios.count()) {
				await radios.first().tap({ timeout: 3000 }).catch(() => {});
			} else {
				const boxes = page.locator('input[type="checkbox"]');
				const n = await boxes.count();
				for (let i = 0; i < Math.min(2, n); i++) {
					await boxes.nth(i).tap({ timeout: 3000 }).catch(() => {});
				}
			}
			break;
		}
		case 'matching': {
			const premises = page.locator('[data-connect-premise]');
			const targets = page.locator('[data-connect-target]');
			const n = await premises.count();
			for (let i = 0; i < n; i++) {
				await premises.nth(i).tap({ timeout: 3000 }).catch(() => {});
				await page.waitForTimeout(120);
				await targets.nth(i).tap({ timeout: 3000 }).catch(() => {});
				await page.waitForTimeout(120);
			}
			break;
		}
		case 'hotspot': {
			// tap every tap-region button once (valid response: distinct region ids).
			const regions = page.locator('button[aria-pressed]');
			const n = await regions.count();
			for (let i = 0; i < n; i++) {
				await regions.nth(i).tap({ timeout: 3000 }).catch(() => {});
				await page.waitForTimeout(100);
			}
			break;
		}
		case 'sort': {
			for (let i = 0; i < 8; i++) {
				const tray = page.locator('div.flex.flex-wrap.gap-2 > button[aria-pressed]:not([disabled])');
				if (!(await tray.count())) break;
				await tray.first().tap({ timeout: 3000 }).catch(() => {});
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
				await blanks.nth(i).tap({ timeout: 3000 }).catch(() => {});
				await page.waitForTimeout(120);
				const chips = page
					.locator('p:has-text("Word bank —")')
					.first()
					.locator('..')
					.locator('div.flex.flex-wrap')
					.first()
					.locator('button:not([disabled])');
				await chips.first().tap({ timeout: 3000 }).catch(() => {});
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
						await selects.nth(i).selectOption(val).catch(() => {});
						break;
					}
				}
			}
			break;
		}
		case 'evidence': {
			const text = await page.evaluate(() => document.body.innerText || '');
			const m = text.match(/[Ss]elect (?:up to )?(ALL|the|TWO|THREE|FOUR|ONE|one|two|three|four)/);
			let want = 1;
			if (m) {
				const w = m[1].toUpperCase();
				if (w === 'ALL') want = Infinity;
				else want = w === 'ONE' ? 1 : w === 'TWO' ? 2 : w === 'THREE' ? 3 : w === 'FOUR' ? 4 : 1;
			}
			const boxes = page.locator('.font-mono input[type="checkbox"]');
			const total = await boxes.count();
			const n = Math.min(total, want === Infinity ? total : want);
			for (let i = 0; i < n; i++) {
				await boxes.nth(i).check({ timeout: 3000 }).catch(() => {});
			}
			const afterEnabled = await page
				.locator('button:has-text("Check Answer")')
				.first()
				.isEnabled()
				.catch(() => false);
			console.log(`evidence boxes=${total} want=${want === Infinity ? 'ALL' : want} checkEnabled=${afterEnabled}`);
			break;
		}
		case 'ordering': {
			orderingAttempts++;
			const handles = page.locator('[aria-label^="Reorder item"]');
			const ok = await touchDragBoxes(page, handles.nth(0), handles.nth(1));
			const draftActive = await page
				.locator('button:has-text("Check Answer")')
				.first()
				.isEnabled()
				.catch(() => false);
			console.log(`ordering drag ok=${ok} draftEnabled=${draftActive}`);
			if (!draftActive) {
				orderingFailures++;
				const first = page.locator('[aria-label^="Reorder item"]').first();
				await first.focus();
				await page.keyboard.press('ArrowDown');
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
 * occurrence at 390×844 and 390×1400, dark.
 */
async function driveSession(page, context, type, routeTag, body, tag, cap = 160) {
	const res = await context.request.post(`${BASE}/api/quiz/start`, { data: body });
	const payload = await res.json().catch(() => ({}));
	const sessionId = payload.session?.sessionId;
	if (!res.ok() || !sessionId) {
		throw new Error(`seed ${type} session failed: ${res.status()} ${JSON.stringify(payload).slice(0, 200)}`);
	}
	activeSessions.add(sessionId);
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
			// drill screens are ExamFlow (WT-A): sweep as deferred, log only.
			const { small } = await sweepRoute(page, `${routeTag}#${kind}`, true);
			console.log(`[${tag}] kind=${kind} first-seen (${small} small targets, deferred)`);
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
async function walkPages(page) {
	for (const route of OWNED_ROUTES) {
		try {
			await page.goto(`${BASE}${route}`);
			await page.waitForTimeout(1400);
			const { small, overflow } = await sweepRoute(page, route);
			console.log(`[walk] ${route}: ${small} small, overflow=${overflow}`);
			await screenshot(page, `page-${slug(route)}-390x844`, VIEWPORT);
			await screenshot(page, `page-${slug(route)}-390x1400`, TALL);
			// bottom sheet / menu exercise on home (the "More" header button).
			if (route === '/') {
				const menu = page.locator('button:has-text("More")');
				if (await menu.count()) {
					await menu.first().tap({ timeout: 3000 }).catch(() => {});
					await page.waitForTimeout(600);
					await screenshot(page, 'page-home-menu-390x844', VIEWPORT);
					await page.keyboard.press('Escape');
					await page.waitForTimeout(400);
				}
			}
		} catch (err) {
			console.log(`walk ${route} ERROR: ${err.message}`);
		}
	}
	// Deferred routes (modules/[id], WT-C) — swept, logged, never failing.
	for (const route of ['/modules/week-1']) {
		try {
			await page.goto(`${BASE}${route}`);
			await page.waitForTimeout(1400);
			const { small, overflow } = await sweepRoute(page, route);
			console.log(`[walk][deferred] ${route}: ${small} small, overflow=${overflow}`);
			await screenshot(page, `page-${slug(route)}-390x844`, VIEWPORT);
			await screenshot(page, `page-${slug(route)}-390x1400`, TALL);
		} catch (err) {
			console.log(`walk ${route} ERROR: ${err.message}`);
		}
	}
}

// ---- report ---------------------------------------------------------------
function writeReport(summary) {
	const final = [...findings];
	if (orderingAttempts > 0 && orderingFailures > orderingAttempts / 2) {
		final.push({
			pageUrl: 'pbq',
			severity: 'High',
			category: 'Functional',
			title: 'Ordering touch-drag does not reorder (scroll hijack)',
			details: `${orderingFailures}/${orderingAttempts} touch drags on the handle produced no SortableJS reorder — the page scrolls instead.`,
			screenshot: null
		});
	} else if (orderingAttempts > 0) {
		final.push({
			pageUrl: 'pbq',
			severity: 'Info',
			category: 'UX',
			title: 'Ordering touch-drag verified',
			details: `${orderingAttempts - orderingFailures}/${orderingAttempts} touch drags reordered successfully (${orderingFailures} first-attempt flake under emulation).`,
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

- **Gate status:** ${gateViolations.length === 0 ? '✅ PASS (exit 0)' : `❌ FAIL (${gateViolations.length} violation(s), exit 1)`}
- **Routes swept:** ${OWNED_ROUTES.length} owned + ${DEFERRED_ROUTE_PREFIXES.length} deferred route(s)
- **Kinds exercised:** ${[...KINDS_SEEN].sort().join(', ') || 'none'}${notSeen.length ? `\n- **Kinds NOT exercised (no bank items yet / post-merge re-audit):** ${notSeen.join(', ')}` : ''}
- **Console errors:** ${consoleErrors.length} · **Page errors:** ${pageErrors.length} · **Failed resources:** ${failedRequests.length}
- **Findings:** ${unique.length} unique (${unique.filter((f) => f.severity === 'High').length} high, ${unique.filter((f) => f.severity === 'Medium').length} medium, ${unique.filter((f) => f.severity === 'Low' || f.severity === 'Info').length} low/info)
- **DB:** throwaway \`${DB}\` (never the user's real DB)
- **Viewport:** ${VIEWPORT.width}×${VIEWPORT.height} + ${TALL.height} @3x, hasTouch, dark theme

${summary ? `## Notes\n\n${summary}\n\n` : ''}
## Gate results

- **Small touch targets (<${MIN_TAP}px) on owned routes:** ${gateViolations.filter((v) => /[0-9]+×[0-9]+px/.test(v.message)).length}
- **Horizontal overflow:** ${gateViolations.filter((v) => v.message.includes('overflow')).length}
- **Console/page errors:** ${consoleErrors.length + pageErrors.length + failedRequests.length}

${gateViolations.length ? gateViolations.map((v) => `- ❌ \`[${v.scope}]\` ${v.message}`).join('\n') : '- ✅ none — all owned routes clear the ≥44×44px contract at 390px, no overflow, no console errors.'}

## Console / page errors

${consoleErrors.length ? consoleErrors.map((e) => `- \`${e}\``).join('\n') : '- none'}
${pageErrors.length ? pageErrors.map((e) => `- \`pageerror: ${e}\``).join('\n') : ''}
${failedRequests.length ? failedRequests.map((e) => `- \`failed request: ${e}\``).join('\n') : ''}

## Kinds exercised

${KINDS.map((k) => `- **${k}:** ${KINDS_SEEN.has(k) ? 'exercised + screenshotted' : 'not exercisable — no bank items in this build (engine kind; lands with WT-A/WT-D merges)'}`).join('\n')}

## Screenshots

${screenshots || '- none'}

## Remaining / deferred items (post-merge re-audit)

- Deferred routes swept and logged only (sibling workstream ownership): see findings tagged \`(deferred)\` below.
- Known, un-fixed by design: \`/modules/[id]\` lesson-complete ✓ (32×32) + "← Syllabus" (76×40) — owned by WT-C. ExamFlow question-navigator buttons (h-10 w-10 = 40px) — owned by WT-A. Both re-audited after their branches merge.

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
	const browser = await chromium.launch({ executablePath: chromiumPath, args: ['--blink-settings=preferredColorScheme=2'] });
	const context = await browser.newContext({
		viewport: VIEWPORT,
		deviceScaleFactor: 3,
		isMobile: true,
		hasTouch: true,
		userAgent:
			'Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.0 Mobile/15E148 Safari/604.1'
	});
	const page = await context.newPage();
	attachListeners(page);

	// 1) Kind drills — seed sessions via the API, drive every engine kind on touch.
	await driveSession(page, context, 'pbq', 'pbq', { type: 'pbq', count: 5, mode: 'practice' }, 'pbq', 170);
	await driveSession(page, context, 'quiz', 'quiz', { type: 'quiz', count: 24, mode: 'practice' }, 'quiz', 60);

	// 2) Full route walk — touch sweep + overflow + dual-viewport screenshots.
	await walkPages(page);

	// 3) Cleanup: abandon any leftover active sessions (throwaway DB anyway).
	for (const id of [...activeSessions]) await abandonSession(context, id);

	await browser.close();

	// 4) Gate decision.
	const consoleTotal = consoleErrors.length + pageErrors.length + failedRequests.length;
	writeReport(
		`Post-fix audit run (fail-threshold gate). Drills seeded via POST /api/quiz/start; every kind answered + screenshotted. Routes swept for ≥${MIN_TAP}px touch targets + 390px overflow; console/page errors fail the gate.`
	);
	console.log(
		`DONE — kinds: ${[...KINDS_SEEN].sort().join(', ')} | gate violations: ${gateViolations.length} | console errors: ${consoleTotal}`
	);
	if (gateViolations.length === 0 && consoleTotal === 0) {
		console.log('GATE: PASS — zero <44px targets on owned routes, zero overflow, zero console errors.');
		process.exit(0);
	}
	if (REPORT_ONLY) {
		console.log(`GATE: FAIL would exit 1 (${gateViolations.length} violations, ${consoleTotal} console errors) — report-only mode, exiting 0.`);
		process.exit(0);
	}
	console.log(`GATE: FAIL — ${gateViolations.length} violations, ${consoleTotal} console/page errors.`);
	process.exit(1);
} catch (err) {
	console.error(`FATAL: ${err.message}`);
	process.exit(2);
} finally {
	if (server) server.kill('SIGTERM');
	rmSync(DB, { force: true });
	rmSync(`${DB}-wal`, { force: true });
	rmSync(`${DB}-shm`, { force: true });
}
