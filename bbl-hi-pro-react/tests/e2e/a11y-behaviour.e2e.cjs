// Accessibility behaviour checks beyond DOM structure, on the React build (dist/index.html):
//  - text contrast measured from computed colours (WCAG 2.x ratio) on every route
//  - keyboard walk: every Tab stop is visible, shows a focus indicator, and focus never falls to <body>
//  - skip link is the first Tab stop and is visible once focused
//  - goal dialog exposes modal dialog semantics with an accessible name
//  - reduced motion removes the reveal animation
// Not covered: screen reader output, zoom beyond the 320 px reflow check in responsive.e2e.cjs, touch target sizes,
// and an automated rules engine (axe is not available offline). No WCAG conformance is claimed from these checks.
const { runSuite, goRoute, splashGone, routeReady, becomes } = require('./helpers.cjs');

const ROUTES = ['home', 'services', 'svc-documents', 'svc-appointment', 'svc-tracking', 'svc-overview', 'wellness', 'goals', 'playground', 'contact', 'brand'];
const KEY_WALK_STOPS = 40;

// Relative luminance and contrast ratio (WCAG 2.x), computed in Node from colours read off the page.
const luminance = c => {
  const f = v => { v /= 255; return v <= 0.03928 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4); };
  return 0.2126 * f(c.r) + 0.7152 * f(c.g) + 0.0722 * f(c.b);
};
const contrastRatio = (a, b) => {
  const [hi, lo] = [luminance(a), luminance(b)].sort((x, y) => y - x);
  return (hi + 0.05) / (lo + 0.05);
};

/** Text elements in the active view with their computed foreground colour and the first opaque background behind them. */
const readTextColours = (page) => page.evaluate(() => {
  const parse = c => { const m = c.match(/[\d.]+/g).map(Number); return { r: m[0], g: m[1], b: m[2], a: m.length > 3 ? m[3] : 1 }; };
  const view = document.querySelector('.view.active');
  const walker = document.createTreeWalker(view, NodeFilter.SHOW_TEXT);
  const seen = new Set();
  const items = [];
  while (walker.nextNode()) {
    const node = walker.currentNode;
    if (!node.textContent.trim()) continue;
    const el = node.parentElement;
    if (!el || seen.has(el)) continue;
    seen.add(el);
    const cs = getComputedStyle(el);
    const rect = el.getBoundingClientRect();
    if (cs.visibility === 'hidden' || cs.display === 'none' || rect.width === 0 || Number(cs.opacity) === 0) continue;
    let bg = { r: 255, g: 255, b: 255, a: 1 };
    let imageBehind = false;
    for (let n = el; n; n = n.parentElement) {
      const s = getComputedStyle(n);
      if (s.backgroundImage && s.backgroundImage !== 'none') { imageBehind = true; break; }
      const c = parse(s.backgroundColor);
      if (c.a > 0) { bg = c; break; }
    }
    const fg = parse(cs.color);
    items.push({
      text: node.textContent.trim().slice(0, 40), fg, bg, imageBehind,
      size: parseFloat(cs.fontSize), weight: Number(cs.fontWeight),
    });
  }
  return items;
});

runSuite('a11y-behaviour (contrast, keyboard, dialog, motion)', async ({ check, step, newPage }) => {
  // ---- Contrast on every route (desktop viewport, so every text block is laid out) ----
  await step('text contrast on every route', async () => {
    const p = await newPage({ viewport: { width: 1280, height: 900 } });
    await splashGone(p);
    let measured = 0;
    let unmeasured = 0;
    let minRatio = Infinity;
    const failures = [];
    for (const r of ROUTES) {
      await goRoute(p, r);
      for (const it of await readTextColours(p)) {
        if (it.imageBehind) { unmeasured++; continue; }
        measured++;
        // Blend a semi-transparent foreground over its background before measuring.
        const fg = {
          r: it.fg.r * it.fg.a + it.bg.r * (1 - it.fg.a),
          g: it.fg.g * it.fg.a + it.bg.g * (1 - it.fg.a),
          b: it.fg.b * it.fg.a + it.bg.b * (1 - it.fg.a),
        };
        const ratio = contrastRatio(fg, it.bg);
        minRatio = Math.min(minRatio, ratio);
        const large = it.size >= 24 || (it.size >= 18.66 && it.weight >= 700);
        const need = large ? 3 : 4.5;
        if (ratio < need) failures.push(`${r}: "${it.text}" ${ratio.toFixed(2)}:1 (needs ${need})`);
      }
    }
    check('text meets WCAG AA contrast on every route (4.5:1 normal, 3:1 large)', failures.length === 0,
      failures.slice(0, 8).join('; ') || `${measured} text items measured, min ${minRatio.toFixed(2)}:1, ${unmeasured} over background images`);
    check('every text item on every route could be measured (no background images)', unmeasured === 0, `${unmeasured} unmeasured`);
    await p.close();
  });

  // ---- Keyboard: skip link first, then a walk with visible focus ----
  await step('skip link is the first Tab stop and is visible when focused', async () => {
    const p = await newPage({ viewport: { width: 1280, height: 900 } });
    await splashGone(p);
    await p.keyboard.press('Tab');
    const first = await p.evaluate(() => document.activeElement?.id || '');
    check('first Tab stop is the skip link', first === 'skipBtn', first);
    // The skip link slides in over 0.2 s (top: -80px -> 12px); wait for it to land before measuring.
    const onScreen = await becomes(p, () => {
      const r = document.getElementById('skipBtn').getBoundingClientRect();
      return r.top >= 0 && r.width > 0 && r.height > 0;
    });
    check('skip link is visible on focus', onScreen);
    await p.close();
  });

  await step('keyboard walk: every stop is visible and shows a focus indicator; the walk cycles back to the skip link', async () => {
    const p = await newPage({ viewport: { width: 1280, height: 900 } });
    await splashGone(p);
    // Start from the top of the document. Setting the hash would start Tab order inside the page section and skip the header.
    await routeReady(p, 'home');
    const stops = [];
    // The walk ends when the browser wraps focus back to the document (body); everything before that is a real stop.
    for (let i = 0; i < KEY_WALK_STOPS; i++) {
      await p.keyboard.press('Tab');
      const info = await p.evaluate(() => {
        const el = document.activeElement;
        const r = el.getBoundingClientRect();
        const cs = getComputedStyle(el);
        const hasRing = (cs.outlineStyle !== 'none' && parseFloat(cs.outlineWidth) > 0) || (cs.boxShadow && cs.boxShadow !== 'none');
        return {
          label: (el.getAttribute('aria-label') || el.textContent || el.tagName).trim().slice(0, 30),
          tag: el.tagName,
          visible: r.width > 0 && r.height > 0,
          hasRing,
        };
      });
      if (info.tag === 'BODY') break;
      stops.push(info);
    }
    const hidden = stops.filter(s => !s.visible).map(s => s.label);
    const unringed = stops.filter(s => !s.hasRing).map(s => s.label);
    check(`keyboard walk reaches ${stops.length} interactive stops before wrapping`, stops.length >= 20, `${stops.length} stops`);
    check('every Tab stop is visible', hidden.length === 0, hidden.slice(0, 6).join(', '));
    check('every Tab stop shows a focus indicator', unringed.length === 0, unringed.slice(0, 6).join(', '));
    await p.keyboard.press('Tab');
    const cycled = await p.evaluate(() => document.activeElement?.id || '');
    check('after the last stop, focus wraps back to the skip link', cycled === 'skipBtn', cycled);
    await p.close();
  });

  // ---- Dialog semantics ----
  await step('goal dialog has modal dialog semantics and an accessible name', async () => {
    const p = await newPage({ viewport: { width: 1280, height: 900 } });
    await splashGone(p);
    await goRoute(p, 'goals');
    await p.click('#goalNew');
    await p.waitForSelector('[role=dialog]', { state: 'visible' });
    const dlg = await p.evaluate(() => {
      const el = document.querySelector('[role=dialog]');
      const labelId = el.getAttribute('aria-labelledby');
      const label = labelId ? document.getElementById(labelId)?.textContent.trim() : '';
      return { modal: el.getAttribute('aria-modal'), label };
    });
    check('dialog declares aria-modal="true"', dlg.modal === 'true', String(dlg.modal));
    check('dialog has a non-empty accessible name from aria-labelledby', !!dlg.label, dlg.label);
    await p.keyboard.press('Escape');
    await becomes(p, () => !document.querySelector('[role=dialog]'));
    await p.close();
  });

  // ---- Reduced motion ----
  await step('reduced motion removes the reveal animation', async () => {
    const p = await newPage({ viewport: { width: 1280, height: 900 }, reducedMotion: 'reduce' });
    await splashGone(p);
    await goRoute(p, 'home');
    const durations = await p.evaluate(() => [...document.querySelectorAll('.view.active .reveal')]
      .map(el => parseFloat(getComputedStyle(el).animationDuration) || 0));
    check('reveal elements exist on home', durations.length > 0, `${durations.length} elements`);
    check('reveal animation duration is effectively zero under reduced motion',
      durations.length > 0 && durations.every(d => d <= 0.01), `max ${Math.max(0, ...durations)}s`);
    await p.close();
  });
});
