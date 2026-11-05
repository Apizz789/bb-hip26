// Interaction checks: language switching, dialog focus, error summary navigation, goal validation and
// goal/home state synchronisation. Runs against the React build (dist/index.html).
const { runSuite, becomes, waitState, splashGone, goRoute, routeReady } = require('./helpers.cjs');

// Thai letters and marks only; the baht sign (U+0E3F) is valid in English text.
const THAI = /[ก-ฺเ-๛]/;

runSuite('interactions (language, dialog focus, validation, state sync)', async ({ check, step, newPage }) => {
  const p = await newPage({ viewport: { width: 390, height: 844 } }, undefined);
  await splashGone(p);
  await p.evaluate(() => { location.hash = '#goals'; });
  await routeReady(p, 'goals');

  await step('language switch updates the page, and the choice is stored and restored', async () => {
    check('default language is Thai', (await p.getAttribute('html', 'lang')) === 'th');
    await p.click('.lang-btn[data-lang="en"]');
    await waitState(p, 'English page language', () => document.documentElement.lang === 'en');
    check('EN switch sets html lang', (await p.getAttribute('html', 'lang')) === 'en');
    await waitState(p, 'English goals heading', () => document.querySelector('#goalsTitle')?.textContent.trim() === 'Financial Goals');
    check('EN switch updates goals heading', (await p.textContent('#goalsTitle')).trim() === 'Financial Goals');
    check('EN goals view has no Thai text', !THAI.test(await p.locator('#goals').innerText()));
    const stored = await p.evaluate(() => { try { return localStorage.getItem('bblhipro-lang'); } catch { return 'unavailable'; } });
    check('language preference persisted', stored === 'en', String(stored));
    await p.reload();
    await splashGone(p);
    await routeReady(p, 'goals');
    check('language preference restored after reload', (await p.getAttribute('html', 'lang')) === 'en');
    await p.click('.lang-btn[data-lang="th"]');
    await waitState(p, 'Thai page language', () => document.documentElement.lang === 'th');
  });

  await step('goal dialog: focus moves in, Tab stays inside, Escape closes and restores focus', async () => {
    await p.focus('#goalNew');
    await p.keyboard.press('Enter');
    await p.waitForSelector('.modal-box', { state: 'visible' });
    check('dialog moves focus inside on open', await p.evaluate(() => !!document.activeElement.closest('.modal-box')));
    for (let i = 0; i < 12; i++) await p.keyboard.press('Tab');
    check('Tab is trapped inside dialog', await p.evaluate(() => !!document.activeElement.closest('.modal-box')));
    await p.keyboard.press('Escape');
    check('Escape closes dialog', await becomes(p, () => document.querySelectorAll('.modal-box').length === 0));
    check('focus returns to trigger after close', await becomes(p, () => document.activeElement?.id === 'goalNew'),
      await p.evaluate(() => document.activeElement && document.activeElement.id));
  });

  await step('goal validation: error summary lists every problem, takes focus, and links focus fields', async () => {
    await p.click('#goalNew');
    await p.waitForSelector('#gForm', { state: 'visible' });
    await p.fill('#gName', 'x');
    await p.fill('#gTarget', '500');
    await p.fill('#gSaved', '-5');
    await p.click('button[form=gForm]');
    const linked = await becomes(p, () => document.querySelectorAll('.err-summary a').length >= 3);
    check('error summary lists all invalid goal fields', linked, `links=${await p.locator('.err-summary a').count()}`);
    check('error summary receives focus on appearance',
      await becomes(p, () => document.activeElement?.classList.contains('err-summary')));
    await p.locator('.err-summary a[href="#gTarget"]').click();
    check('error summary link focuses its field', await becomes(p, () => document.activeElement?.id === 'gTarget'));
    await p.keyboard.press('Escape');
    await becomes(p, () => document.querySelectorAll('.modal-box').length === 0);
  });

  await step('simulated savings on Goals update the Home goal summary', async () => {
    await goRoute(p, 'goals');
    const firstCard = p.locator('.goal-item').first();
    const firstName = (await firstCard.locator('.gi-name').textContent()).trim();
    const beforeSave = (await firstCard.locator('.gi-saved').textContent()).trim();
    await firstCard.locator('.gi-actions .btn.ghost').click();
    await waitState(p, 'saved amount to change on Goals', ([prev]) => {
      const s = document.querySelector('.goal-item .gi-saved');
      return !!s && s.textContent.trim() !== prev;
    }, [beforeSave]);
    const savedText = (await firstCard.locator('.gi-saved').textContent()).trim();
    await goRoute(p, 'home');
    // The home amount counts up (AnimatedNumber), so wait for it to reach the value shown on Goals.
    const synced = await becomes(p, ([title, amount]) =>
      document.querySelector('#goalTitle')?.textContent.trim() === title
      && document.querySelector('#cGoal')?.textContent.trim() === amount, [firstName, savedText]);
    const homeGoalTitle = (await p.textContent('#goalTitle')).trim();
    const homeGoalSaved = (await p.textContent('#cGoal')).trim();
    check('home goal summary matches goal updated on Goals', synced && homeGoalTitle === firstName && homeGoalSaved === savedText,
      `${homeGoalTitle} ${homeGoalSaved} vs ${firstName} ${savedText}`);
  });

  await step('advancing a tracked request updates the Home resume card', async () => {
    await goRoute(p, 'home');
    const resumeBefore = (await p.textContent('#resumeTitle')).trim();
    await goRoute(p, 'svc-tracking');
    const target = p.locator('.req', { has: p.locator('.pill:not(.green)') }).first();
    await target.click();
    await p.waitForSelector('.modal-box', { state: 'visible' });
    const advance = p.locator('.modal-box .modal-actions .btn.primary');
    const canAdvance = await advance.isEnabled();
    if (canAdvance) await advance.click();
    await p.keyboard.press('Escape');
    await becomes(p, () => document.querySelectorAll('.modal-box').length === 0);
    await goRoute(p, 'home');
    const resumeAfter = (await p.textContent('#resumeTitle')).trim();
    check('home resume card updates after advancing a request', canAdvance && resumeBefore !== resumeAfter,
      `${resumeBefore} -> ${resumeAfter}`);
  });
});
