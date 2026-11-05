// Shared runner for the E2E suites. Targets the React build (dist/index.html) unless BBL_URL is set.
// Every check runs even after an earlier failure; each failure names the behaviour that failed; the process
// exits non-zero when any check fails, so run-all.mjs reports the suite as FAIL.
const path = require('path');
const fs = require('fs');
const { chromium } = require('playwright');

const ROOT = path.resolve(__dirname, '../..');
const ARTIFACTS = path.resolve(ROOT, '.artifacts');
const DEFAULT_URL = 'file://' + path.resolve(ROOT, 'dist/index.html');

const fileUrl = () => process.env.BBL_URL || DEFAULT_URL;
const artifact = (name) => { fs.mkdirSync(ARTIFACTS, { recursive: true }); return path.join(ARTIFACTS, name); };

/** Console/page errors that are expected in the sandbox (no external network). */
const IGNORED_CONSOLE = /ERR_TUNNEL|Failed to load resource/;

/**
 * Runs one suite. `body` receives helpers:
 *   check(label, ok, detail?)  — record a pass/fail for one behaviour
 *   step(label, fn)            — run fn; a thrown error (e.g. a wait timing out) fails only this step, labelled
 *   newPage(options)           — a new page with JS error capture, already opened on the app
 *   errors                     — collected page/console errors (checked at the end)
 */
async function runSuite(name, body) {
  const browser = await chromium.launch();
  const results = [];
  const errors = [];
  const check = (label, ok, detail = '') => {
    results.push({ label, ok: !!ok });
    console.log((ok ? 'PASS ' : 'FAIL ') + label + (detail ? ' — ' + detail : ''));
  };
  const step = async (label, fn) => {
    try { await fn(); } catch (e) {
      results.push({ label, ok: false });
      // First meaningful lines of the error (Playwright puts the reason, e.g. an intercepting element, after the first line).
      const lines = String(e.message || e).split('\n').map(x => x.trim()).filter(Boolean).slice(0, 4);
      console.log('FAIL ' + label + ' — ' + lines.join(' | ').slice(0, 600));
    }
  };
  const newPage = async (options = {}, url = fileUrl()) => {
    const ctx = await browser.newContext(options);
    const page = await ctx.newPage();
    page.on('pageerror', e => errors.push('pageerror: ' + e.message));
    page.on('console', m => {
      if (m.type() === 'error' && !IGNORED_CONSOLE.test(m.text())) errors.push('console: ' + m.text());
    });
    await page.goto(url);
    return page;
  };

  try {
    await body({ check, step, newPage, errors });
  } catch (e) {
    results.push({ label: 'suite aborted', ok: false });
    console.log('FAIL suite aborted — ' + String(e.message || e).split('\n')[0]);
  }

  check('no JavaScript page errors' + (errors.length ? ': ' + errors.join(' | ') : ''), errors.length === 0);
  const failed = results.filter(r => !r.ok);
  console.log(`\n${name}: ${results.length - failed.length}/${results.length} checks passed`);
  if (failed.length) {
    console.log(name + ' FAILED: ' + failed.map(f => f.label).join('; '));
    process.exitCode = 1;
  }
  await browser.close();
}

/** Resolves once `fn` (evaluated in the page) returns true. Fails with `label` if it never does. */
async function waitState(page, label, fn, arg, timeout = 5000) {
  try {
    await page.waitForFunction(fn, arg, { timeout });
  } catch {
    throw new Error('timed out waiting for: ' + label);
  }
}

/** Visible text of the element that currently has focus (for focus-order checks). */
const focusedId = (page) => page.evaluate(() => document.activeElement?.id || document.activeElement?.tagName || '');

/** Waits until the opening splash has been removed (it blocks clicks on a fresh page). */
const splashGone = (page) => waitState(page, 'opening splash finished', () => !document.querySelector('#splash'), null, 6000);

/** Waits until `route` is the active view and any skeleton on it has finished. */
const routeReady = (page, route) => waitState(page, `view "${route}" loaded`, r => {
  const v = document.querySelector('.view.active');
  return v?.id === r && !v.classList.contains('is-loading');
}, route, 6000);

/** Navigates the app to a route (hash) and waits until that route is ready. */
const goRoute = async (page, route) => {
  await page.evaluate(r => { location.hash = '#' + r; }, route);
  await routeReady(page, route);
};

/**
 * Like waitState, but resolves to true/false instead of throwing. Use it for a check whose failure should be
 * recorded as one failed check (with its own label), not as an aborted step.
 */
async function becomes(page, fn, arg, timeout = 5000) {
  try {
    await page.waitForFunction(fn, arg, { timeout });
    return true;
  } catch {
    return false;
  }
}

module.exports = { runSuite, artifact, waitState, becomes, focusedId, splashGone, routeReady, goRoute, ROOT };
