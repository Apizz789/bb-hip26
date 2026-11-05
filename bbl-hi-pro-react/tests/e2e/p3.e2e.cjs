// Phase 3 — goal highlight (prototype `.bump`), journeys across goals/wellness, responsive and reduced-motion checks.
const { runSuite, artifact, waitState } = require('./helpers.cjs');

const TH = { sim: 'ออมจำลอง', simAmt: 'จำนวนเงินจำลอง', save: 'บันทึก', goalsRoute: 'ไปที่เป้าหมาย' };
const bumpState = (i) => `document.querySelectorAll('#goalList > article.goal-item')[${i}].classList.contains('bump')`;

runSuite('p3 (highlight, journeys, responsive)', async ({ check, step, newPage }) => {
  const p = await newPage({ viewport: { width: 1280, height: 900 } });
  const leak = () => p.evaluate(() => { const bad = []; document.querySelectorAll('body *').forEach(el => { if (el.children.length) return; const tx = el.textContent.trim(); if (/^[a-z]+_[a-z0-9_]+$/.test(tx)) bad.push(tx); }); return bad; });
  const goRoute = async (route) => {
    await p.evaluate(r => { location.hash = '#' + r; }, route);
    await waitState(p, `view "${route}" to become active`, r => document.querySelector('.view.active')?.id === r, route);
  };
  const card = (i) => p.locator('#goalList > article.goal-item').nth(i);

  await step('English and Thai pages have no leaked translation keys', async () => {
    check('TH no leaked keys', (await leak()).length === 0);
    await p.click('.lang-btn[data-lang="en"]');
    await waitState(p, 'English labels', () => document.documentElement.lang === 'en');
    check('EN no leaked keys', (await leak()).length === 0);
    await p.click('.lang-btn[data-lang="th"]');
    await waitState(p, 'Thai labels', () => document.documentElement.lang === 'th');
  });

  await step('goal KPI shows whole baht', async () => {
    await goRoute('goals');
    const kpi = await p.textContent('#gkSaved');
    check('goal KPI has no decimals and shows ฿', !/\.\d{2}$/.test(kpi.trim()) && kpi.includes('฿'), kpi);
  });

  await step('simulated saving highlights the saved goal card only', async () => {
    await card(0).getByRole('combobox', { name: TH.simAmt }).selectOption('500');
    await card(0).getByRole('button', { name: TH.sim }).click();
    await waitState(p, 'Japan trip card to get the bump class', bumpState(0));
    check('clicked goal card gets the highlight', true);
    check('other goal cards are not highlighted', await p.evaluate(() => !document.querySelectorAll('#goalList > article.goal-item')[1].classList.contains('bump') && !document.querySelectorAll('#goalList > article.goal-item')[2].classList.contains('bump')));
    const anim = await card(0).evaluate(el => getComputedStyle(el).animationName);
    check('highlight animation (goalBump) is applied to the card', anim === 'goalBump', anim);
  });

  await step('home goal card highlights after its quick save', async () => {
    await goRoute('home');
    await p.click('#goalAdd');
    await waitState(p, 'home goal card to get the bump class', () => document.querySelector('.goal-card').classList.contains('bump'));
    const anim = await p.evaluate(() => getComputedStyle(document.querySelector('.goal-card')).animationName);
    check('home goal card highlight animation is applied', anim === 'goalBump', anim);
  });

  await step('goal form saves when Enter is pressed in the target field', async () => {
    await goRoute('goals');
    await p.locator('#goalNew').click();
    await waitState(p, 'goal dialog to open', () => !!document.querySelector('.modal-box[role=dialog]'));
    await p.fill('#gName', 'ทดสอบ Enter');
    await p.fill('#gTarget', '12000');
    await p.fill('#gSaved', '0');
    await p.fill('#gDate', '2027-06-30');
    await p.press('#gTarget', 'Enter');
    await waitState(p, 'Enter to save and close the dialog', () => !document.querySelector('.modal-box[role=dialog]'));
    check('new goal appears after Enter', (await p.locator('#goalList').textContent()).includes('ทดสอบ Enter'));
  });

  await step('view transition animation is applied on route change', async () => {
    await goRoute('svc-documents');
    const anim = await p.evaluate(() => getComputedStyle(document.querySelector('.view.active')).animationName);
    check('route change animates the view', anim !== 'none', anim);
  });

  await step('navigation breakpoints: 768px uses bottom nav, 1000px uses top nav', async () => {
    const tablet = await newPage({ viewport: { width: 768, height: 860 } });
    check('768px: bottom nav visible', await tablet.$eval('.bottom-nav', e => getComputedStyle(e).display !== 'none'));
    check('768px: top nav hidden', await tablet.$eval('.main-nav', e => getComputedStyle(e).display === 'none'));
    const wide = await newPage({ viewport: { width: 1000, height: 860 } });
    check('1000px: top nav visible', await wide.$eval('.main-nav', e => getComputedStyle(e).display !== 'none'));
  });

  await step('mobile 390px: key pages have no horizontal overflow', async () => {
    const m = await newPage({ viewport: { width: 390, height: 844 }, isMobile: true, hasTouch: true, deviceScaleFactor: 2 });
    for (const route of ['svc-documents', 'svc-appointment', 'goals', 'wellness']) {
      await m.evaluate(r => { location.hash = '#' + r; }, route);
      await waitState(m, `${route} active at 390px`, r => document.querySelector('.view.active')?.id === r, route);
      const ov = await m.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth);
      check(`390px ${route}: no horizontal overflow`, ov <= 0, ov + 'px');
    }
    await m.evaluate(() => { location.hash = '#goals'; });
    await m.screenshot({ path: artifact('p3-goals-390.png') });
  });

  await step('wellness actions navigate to their target page', async () => {
    const w = await newPage({ viewport: { width: 390, height: 844 } });
    await w.evaluate(() => { location.hash = '#wellness'; });
    await waitState(w, 'wellness active', () => document.querySelector('.view.active')?.id === 'wellness');
    const actions = await w.locator('#insights .ins-act button, #recs button.btn.text').count();
    check('wellness has actions that navigate', actions > 0, actions + ' actions');
  });

  await step('reduced motion: highlight still applies but does not animate', async () => {
    const rm = await newPage({ viewport: { width: 390, height: 844 }, reducedMotion: 'reduce' });
    await rm.evaluate(() => { location.hash = '#goals'; });
    await waitState(rm, 'goals active under reduced motion', () => document.querySelector('.view.active')?.id === 'goals');
    const viewDur = await rm.evaluate(() => parseFloat(getComputedStyle(document.querySelector('.view.active')).animationDuration));
    check('reduced motion shortens the view animation', viewDur < 0.01, viewDur + 's');
    await rm.locator('#goalList > article.goal-item').nth(0).getByRole('button', { name: TH.sim }).click();
    await waitState(rm, 'reduced-motion highlight class', bumpState(0));
    const dur = await rm.evaluate(() => parseFloat(getComputedStyle(document.querySelector('#goalList > article.goal-item')).animationDuration));
    check('reduced motion: highlight duration is effectively zero', dur < 0.01, dur + 's');
  });
});
