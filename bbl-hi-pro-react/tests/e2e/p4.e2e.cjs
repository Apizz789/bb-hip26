// Phase 4 — splash, skeleton loading, reduced motion, English intro. Waits for the actual states, not fixed delays.
const { runSuite, artifact, waitState } = require('./helpers.cjs');

runSuite('p4 (splash and skeleton)', async ({ check, step, newPage }) => {
  const p = await newPage({ viewport: { width: 1280, height: 900 } });

  await step('splash is shown on first load and translated', async () => {
    const shown = await p.$eval('#splash', e => !e.classList.contains('done')).catch(() => false);
    check('splash visible on first load', shown);
    check('splash message is translated (TH)', (await p.textContent('#splash .splash-msg')).includes('ข้อมูลจำลอง'));
  });
  await step('splash is removed after loading', async () => {
    await waitState(p, 'splash to be removed', () => document.querySelector('#splash') === null, null, 6000);
    check('splash removed after load', true);
  });
  await step('home intro and tool link render', async () => {
    check('home intro text is present', (await p.textContent('.hero-intro')).length > 20);
    check('tool link stays on one line', await p.$eval('.tool-link', e => e.getBoundingClientRect().height < 40));
  });

  await step('skeleton appears on navigation to goals, then content replaces it', async () => {
    await p.evaluate(() => { location.hash = '#goals'; });
    await waitState(p, 'goals skeleton to appear', () => {
      const v = document.querySelector('#goals');
      return v?.classList.contains('is-loading') && !!v.querySelector('.skel-wrap .skel');
    });
    check('skeleton shown on goals navigation', true);
    check('real goal list hidden while loading', await p.$eval('#goalList', e => getComputedStyle(e).display === 'none'));
    await waitState(p, 'goals skeleton to clear', () => !document.querySelector('#goals').classList.contains('is-loading') && !document.querySelector('#goals .skel-wrap'), null, 6000);
    check('skeleton removed after loading', true);
    check('goal content visible after loading', await p.$eval('#goalList', e => e.getBoundingClientRect().height > 100));
    await waitState(p, 'focus on the goals heading', () => document.activeElement?.id === 'goalsTitle', null, 3000);
    check('focus moves to the goals heading after the skeleton', true);
  });

  await step('pages without data do not show a skeleton', async () => {
    await p.evaluate(() => { location.hash = '#contact'; });
    await waitState(p, 'contact active', () => document.querySelector('.view.active')?.id === 'contact');
    check('no skeleton on the contact page', await p.$eval('#contact', e => !e.classList.contains('is-loading')));
  });

  await step('reduced motion: splash ends quickly, skeleton still shows but without shimmer, then clears', async () => {
    const q = await newPage({ viewport: { width: 390, height: 844 }, reducedMotion: 'reduce' });
    await waitState(q, 'splash finished under reduced motion', () => document.querySelector('#splash') === null || document.querySelector('#splash').classList.contains('done'), null, 4000);
    check('reduced motion: splash finishes quickly', true);
    await q.evaluate(() => { location.hash = '#svc-tracking'; });
    await waitState(q, 'tracking skeleton under reduced motion', () => document.querySelector('#svc-tracking').classList.contains('is-loading'), null, 2000);
    check('reduced motion: skeleton still shown', true);
    await waitState(q, 'tracking skeleton to clear', () => !document.querySelector('#svc-tracking').classList.contains('is-loading'), null, 4000);
    check('reduced motion: skeleton clears', true);
    await q.screenshot({ path: artifact('p4-skel-home-390.png') });
    await q.click('.lang-btn[data-lang="en"]');
    await waitState(q, 'English intro', () => document.querySelector('.hero-intro')?.textContent.includes('web companion'), null, 3000);
    check('English intro text is shown', true);
  });
});
