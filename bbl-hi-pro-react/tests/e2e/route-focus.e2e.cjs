// Route focus and the skip link, including activation while a skeleton is showing (early activation).
// Waits are state-based: each step waits for a named UI state (loading class, focused element) instead of a fixed delay.
const { runSuite, waitState, becomes } = require('./helpers.cjs');

// Resolves once the active view is showing its skeleton for `id`, then runs `action` in the same task.
// Looping on requestAnimationFrame keeps the activation inside the loading window without a fixed sleep.
const activateSkipWhileLoading = (id) => new Promise((resolve, reject) => {
  const started = Date.now();
  const tick = () => {
    const v = document.querySelector('.view.active');
    if (v?.id === id && v.classList.contains('is-loading')) {
      document.getElementById('skipBtn').click();
      return resolve({ focused: document.activeElement?.id || document.activeElement?.tagName, stillLoading: v.classList.contains('is-loading') });
    }
    if (Date.now() - started > 3000) return reject(new Error('skeleton for ' + id + ' never appeared'));
    requestAnimationFrame(tick);
  };
  tick();
});

runSuite('route-focus (skip link and route focus)', async ({ check, step, newPage }) => {
  const p = await newPage({ viewport: { width: 1280, height: 900 } });
  const settled = (route) => waitState(p, `view "${route}" loaded and focus settled`, r => {
    const v = document.querySelector('.view.active');
    return v?.id === r && !v.classList.contains('is-loading');
  }, route, 6000);

  await step('initial page load settles', async () => {
    await settled('home');
    check('home is loaded', true);
  });

  await step('skip link pressed while a skeleton is showing moves focus to the main content, then to the heading', async () => {
    await p.evaluate(() => { location.hash = '#goals'; });
    const r = await p.evaluate(activateSkipWhileLoading, 'goals');
    check('skip link was activated while the goals skeleton was showing', r.stillLoading, 'focus after activation: ' + r.focused);
    check('focus moved to the main content (not lost)', r.focused === 'app', r.focused);
    await waitState(p, 'goals heading to take focus after the skeleton', () => document.activeElement?.id === 'goalsTitle', null, 6000);
    check('focus then settles on the goals heading', true);
  });

  await step('clicking a header link to a skeleton page focuses its heading once ready', async () => {
    await p.click('.main-nav a[href="#wellness"]');
    await waitState(p, 'wellness heading focused', () => document.activeElement?.id === 'wlTitle', null, 6000);
    check('header link focuses the wellness heading after its skeleton', true);
  });

  await step('pages without a skeleton focus their heading right away', async () => {
    await p.evaluate(() => { location.hash = '#svc-documents'; });
    await waitState(p, 'documents heading focused', () => document.activeElement?.tagName === 'H1' && !!document.activeElement.closest('.view.active'), null, 1500);
    check('documents heading focused without a skeleton delay', true);
  });

  await step('returning to a skeleton page shows the skeleton again', async () => {
    await p.evaluate(() => { location.hash = '#svc-tracking'; });
    await settled('svc-tracking');
    await p.evaluate(() => { location.hash = '#svc-overview'; });
    await settled('svc-overview');
    await p.evaluate(() => { location.hash = '#svc-tracking'; });
    await waitState(p, 'tracking skeleton on return', () => document.querySelector('#svc-tracking').classList.contains('is-loading'), null, 2000);
    check('skeleton is shown again on return to tracking', true);
    await settled('svc-tracking');
  });

  await step('keyboard: Tab reaches the skip link first, and Enter activates it after the page settles', async () => {
    // A fresh page: sequential focus starts at the top of the document, so the first Tab stop is the skip link.
    const k = await newPage({ viewport: { width: 1280, height: 900 } });
    await waitState(k, 'home settled for keyboard test', () => !document.querySelector('.view.active')?.classList.contains('is-loading') && !document.querySelector('#splash'), null, 6000);
    await k.keyboard.press('Tab');
    check('first Tab stop is the skip link', await k.evaluate(() => document.activeElement?.id === 'skipBtn'), await k.evaluate(() => document.activeElement?.id || document.activeElement?.tagName));
    await k.keyboard.press('Enter');
    await waitState(k, 'home heading focused after keyboard skip', () => document.activeElement?.id === 'homeTitle', null, 3000);
    check('keyboard Enter on skip link focuses the page heading', true);
  });

  await step('route change scrolls the page to the top, on routes with and without a skeleton', async () => {
    // Both pages are taller than the 150 px scroll used here, so the browser would keep the offset without a reset.
    await p.evaluate(() => { location.hash = '#brand'; });
    await settled('brand');
    for (const route of ['wellness', 'brand']) {
      const scrolled = await p.evaluate(() => { window.scrollTo({ top: 150, behavior: 'instant' }); return window.scrollY; });
      check(`page is scrolled before navigating to ${route}`, scrolled > 0, `scrollY=${scrolled}`);
      await p.evaluate(r => { location.hash = '#' + r; }, route);
      await settled(route);
      const top = await becomes(p, () => window.scrollY === 0);
      check(`navigating to ${route} scrolls to the top once the page is ready`, top, `scrollY=${await p.evaluate(() => window.scrollY)}`);
    }
  });

  await step('reduced motion: early skip activation still lands on the content', async () => {
    const q = await newPage({ viewport: { width: 390, height: 844 }, reducedMotion: 'reduce' });
    await waitState(q, 'home settled under reduced motion', () => !document.querySelector('.view.active')?.classList.contains('is-loading') && !document.querySelector('#splash'), null, 6000);
    await q.evaluate(() => { location.hash = '#goals'; });
    const r = await q.evaluate(activateSkipWhileLoading, 'goals');
    check('reduced motion: skip activated during the (shorter) skeleton', r.stillLoading, 'focus: ' + r.focused);
    check('reduced motion: focus is on main, then the goals heading', r.focused === 'app', r.focused);
    await waitState(q, 'goals heading focused (reduced motion)', () => document.activeElement?.id === 'goalsTitle', null, 4000);
    check('reduced motion: focus settles on the goals heading', true);
  });
});
