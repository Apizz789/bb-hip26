// Accessibility DOM checks on every route of the React build: accessible names, labels, alt text, focus moved to the
// page heading on route change, heading outline without skipped levels, and a visible focus indicator on the first
// Tab stop. These are structural checks; contrast, focus walks and dialog semantics are in a11y-behaviour.e2e.cjs.
const { runSuite, goRoute, splashGone } = require('./helpers.cjs');

const ROUTES = ['home', 'services', 'svc-documents', 'svc-appointment', 'svc-tracking', 'svc-overview', 'wellness', 'goals', 'playground', 'contact', 'brand'];

runSuite('a11y-dom (structure, names, labels, focus, headings)', async ({ check, newPage }) => {
  const p = await newPage({ viewport: { width: 390, height: 844 } });
  await splashGone(p);

  const naming = {};
  for (const r of ROUTES) {
    await goRoute(p, r);
    naming[r] = await p.evaluate(() => {
      const visible = el => !!(el.offsetParent || el.getClientRects().length) && getComputedStyle(el).visibility !== 'hidden';
      const issues = [];
      document.querySelectorAll('button, a[href], [role="button"], [role="radio"]').forEach(el => {
        if (!visible(el)) return;
        const name = (el.getAttribute('aria-label') || el.textContent || '').trim() || el.getAttribute('title') || '';
        if (!name) issues.push('unnamed ' + el.tagName.toLowerCase() + (el.className ? '.' + String(el.className).split(' ')[0] : ''));
      });
      document.querySelectorAll('input, select, textarea').forEach(el => {
        if (!visible(el) || el.type === 'hidden') return;
        const labelled = (el.id && document.querySelector(`label[for="${el.id}"]`)) || el.closest('label');
        if (!labelled && !el.getAttribute('aria-label') && !el.getAttribute('aria-labelledby')) issues.push('unlabelled ' + (el.id || el.name || el.type));
      });
      document.querySelectorAll('img').forEach(el => { if (!el.hasAttribute('alt')) issues.push('img without alt'); });
      return issues;
    });
  }
  const namingFails = ROUTES.filter(r => naming[r].length);
  check('controls have accessible names and form fields have labels on every route', namingFails.length === 0,
    namingFails.map(r => `${r}: ${naming[r].slice(0, 6).join('; ')}`).join(' | '));

  // Route change moves focus to the new page heading (skeleton routes are checked after the skeleton finishes).
  const focusFails = [];
  for (const r of ROUTES) {
    await goRoute(p, r);
    const ok = await p.evaluate(() => document.activeElement && document.activeElement.tagName === 'H1' && !!document.activeElement.closest('.view.active'));
    if (!ok) focusFails.push(r);
  }
  check('focus moves to page h1 on route change', focusFails.length === 0, focusFails.join(', '));

  // Heading outline: no level skips inside the active view.
  const skipFails = [];
  for (const r of ROUTES) {
    await goRoute(p, r);
    const skip = await p.evaluate(() => {
      const lv = [...document.querySelectorAll('.view.active h1, .view.active h2, .view.active h3')].map(e => +e.tagName[1]);
      return lv.some((x, i) => i > 0 && x > lv[i - 1] + 1);
    });
    if (skip) skipFails.push(r);
  }
  check('no heading-level skips', skipFails.length === 0, skipFails.join(', '));

  // Focus indicator on the first Tab stop of the home page.
  await goRoute(p, 'home');
  await p.keyboard.press('Tab');
  const focusStyle = await p.evaluate(() => {
    const el = document.activeElement; const cs = getComputedStyle(el);
    return { outline: cs.outlineStyle, width: cs.outlineWidth, shadow: cs.boxShadow };
  });
  const focusVisible = focusStyle.outline !== 'none' || (focusStyle.shadow && focusStyle.shadow !== 'none');
  check('focus indicator visible on first Tab stop', focusVisible, JSON.stringify(focusStyle));
});
