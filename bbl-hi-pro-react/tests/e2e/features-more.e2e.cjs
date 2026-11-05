// Remaining existing features without E2E coverage: Home quick actions and recent activity, Services hub cards and
// back buttons, tracking request dialog (close, advance), document delivery choice, appointment confirmation cancel,
// and footer links. Roles, labels, and visible state; no fixed sleeps.
const { runSuite, waitState } = require('./helpers.cjs');

const TH = {
  quickDocs: 'ขอเอกสาร', quickTrack: 'ติดตามคำขอ', quickWellness: 'Financial Wellness', back: 'กลับไปหน้าบริการ',
  close: 'ปิด', next: 'จำลองขั้นตอนถัดไป', byEmail: 'ส่งทางอีเมล', atBranch: 'รับที่สาขา', cancel: 'ยกเลิก',
  footerBrand: 'ตัวตนแบรนด์', footerContact: 'ติดต่อเรา', done: 'คำขอนี้เสร็จสิ้นแล้ว',
};

runSuite('features-more (remaining existing behaviour)', async ({ check, step, newPage: rawNewPage }) => {
  const newPage = async (options, url) => {
    const page = await rawNewPage(options, url);
    await waitState(page, 'opening splash finished', () => !document.querySelector('#splash'), null, 6000);
    return page;
  };
  const settle = (p, route) => waitState(p, `view "${route}" loaded`, r => {
    const v = document.querySelector('.view.active');
    return v?.id === r && !v.classList.contains('is-loading');
  }, route, 6000);
  const go = async (p, route) => { await p.evaluate(r => { location.hash = '#' + r; }, route); await settle(p, route); };

  await step('home: quick actions open their pages', async () => {
    const p = await newPage({ viewport: { width: 1280, height: 900 } });
    await settle(p, 'home');
    for (const [label, route] of [[TH.quickDocs, 'svc-documents'], [TH.quickTrack, 'svc-tracking'], [TH.quickWellness, 'wellness']]) {
      await p.locator('#home').getByRole('button', { name: label, exact: true }).click();
      await settle(p, route);
      check(`quick action "${label}" opens ${route}`, true);
      await go(p, 'home');
    }
  });

  await step('home: recent activity lists transactions with signed amounts', async () => {
    const p = await newPage({ viewport: { width: 1280, height: 900 } });
    await settle(p, 'home');
    const items = p.locator('#activity li');
    const n = await items.count();
    check('recent activity has entries', n >= 1, String(n));
    const amounts = await items.locator('.amt').allTextContents();
    check('every entry shows a signed amount', amounts.every(a => /^[+\u2212-]/.test(a.trim())), amounts.slice(0, 3).join(' '));
  });

  await step('services hub: each card opens its page, and the back button returns to the hub', async () => {
    const p = await newPage({ viewport: { width: 1280, height: 900 } });
    await go(p, 'services');
    const cards = p.locator('#services button.svc');
    const count = await cards.count();
    check('services hub has five service cards', count === 5, String(count));
    for (const [i, route] of [[0, 'svc-documents'], [1, 'svc-appointment'], [2, 'svc-tracking'], [3, 'svc-overview']]) {
      await go(p, 'services');
      await p.locator('#services button.svc').nth(i).click();
      await settle(p, route);
      check(`card ${i + 1} opens ${route}`, true);
      await p.locator('.view.active .back').click();
      await settle(p, 'services');
      check(`back button on ${route} returns to the services hub`, true);
    }
  });

  await step('tracking: a completed request cannot advance; an open one advances a step and closes back to its row', async () => {
    const p = await newPage({ viewport: { width: 1280, height: 900 } });
    await go(p, 'svc-tracking');
    const rows = p.locator('#reqList .req');
    const dialog = p.getByRole('dialog');
    const nextButton = () => dialog.getByRole('button', { name: TH.next });
    const doneButton = () => dialog.getByRole('button', { name: TH.done });
    // Open each row once and record whether it can still advance. Mock data has both kinds.
    let openIndex = -1, doneIndex = -1;
    for (let i = 0; i < await rows.count() && (openIndex < 0 || doneIndex < 0); i++) {
      await rows.nth(i).click();
      await waitState(p, 'request dialog open', () => !!document.querySelector('[role=dialog] .timeline'));
      const canAdvance = await nextButton().isEnabled().catch(() => false);
      if (canAdvance && openIndex < 0) openIndex = i; else if (!canAdvance && doneIndex < 0) doneIndex = i;
      await dialog.locator('.modal-actions').getByRole('button', { name: TH.close, exact: true }).click();
      await waitState(p, 'dialog closed', () => !document.querySelector('[role=dialog] .timeline'));
    }
    check('the list has a completed request and an open request', openIndex >= 0 && doneIndex >= 0, `open ${openIndex}, done ${doneIndex}`);
    if (doneIndex >= 0) {
      await rows.nth(doneIndex).click();
      await waitState(p, 'completed request dialog open', () => !!document.querySelector('[role=dialog] .timeline'));
      check('a completed request shows a disabled completion button', await doneButton().isDisabled());
      await dialog.locator('.modal-actions').getByRole('button', { name: TH.close, exact: true }).click();
      await waitState(p, 'dialog closed', () => !document.querySelector('[role=dialog] .timeline'));
    }
    if (openIndex >= 0) {
      await rows.nth(openIndex).click();
      await waitState(p, 'open request dialog', () => !!document.querySelector('[role=dialog] .timeline'));
      check('the dialog shows a timeline of steps', (await p.locator('[role=dialog] .timeline li').count()) >= 2);
      const doneBefore = await p.locator('[role=dialog] .timeline li.done').count();
      await nextButton().click();
      await waitState(p, 'one more completed step', (before) => document.querySelectorAll('[role=dialog] .timeline li.done').length > before, doneBefore);
      check('advancing completes one more step', (await p.locator('[role=dialog] .timeline li.done').count()) === doneBefore + 1);
      await dialog.locator('.modal-actions').getByRole('button', { name: TH.close, exact: true }).click();
      await waitState(p, 'dialog closed', () => !document.querySelector('[role=dialog] .timeline'));
      check('close returns focus to the request row', await p.evaluate(() => document.activeElement?.classList.contains('req') === true));
    }
  });

  await step('document request: choosing pick-up at a branch hides the email field; email delivery shows it again', async () => {
    const p = await newPage({ viewport: { width: 1280, height: 900 } });
    await go(p, 'svc-documents');
    check('email delivery is the default and shows the email field', await p.locator('#docEmail').isVisible());
    await p.getByRole('radio', { name: TH.atBranch }).check();
    await waitState(p, 'email field hidden for branch pick-up', () => !document.querySelector('#docEmail'));
    check('branch pick-up hides the email field', true);
    await p.getByRole('radio', { name: TH.byEmail }).check();
    await waitState(p, 'email field shown again', () => !!document.querySelector('#docEmail'));
    check('email delivery shows the email field again', await p.locator('#docEmail').isVisible());
  });

  await step('appointment: cancelling the confirmation dialog books nothing', async () => {
    const p = await newPage({ viewport: { width: 1280, height: 900 } });
    await go(p, 'svc-appointment');
    await p.selectOption('#apptBranch', 'silom');
    await p.selectOption('#apptPurpose', 'loan');
    await p.getByRole('radiogroup', { name: /เลือกวันที่|Choose a date/ }).getByRole('radio').nth(1).click();
    await p.locator('#slots [role=radio]:not(:disabled)').first().click();
    await p.click('#apptForm button[type=submit]');
    await waitState(p, 'confirmation dialog', () => !!document.querySelector('[role=dialog]'));
    await p.getByRole('dialog').getByRole('button', { name: TH.cancel, exact: true }).click();
    await waitState(p, 'confirmation dialog closed', () => !document.querySelector('[role=dialog]'));
    check('cancel closes the confirmation dialog', true);
    check('no booking confirmation is shown', await p.locator('#apptSuccess').isHidden().catch(() => true));
    check('the form is still available with its choices kept', (await p.inputValue('#apptBranch')) === 'silom');
  });

  await step('footer: brand and contact links open their pages', async () => {
    const p = await newPage({ viewport: { width: 1280, height: 900 } });
    await settle(p, 'home');
    await p.locator('footer nav[aria-label="Footer"]').getByRole('link', { name: TH.footerBrand }).click();
    await settle(p, 'brand');
    check('footer brand link opens the brand page', true);
    await p.locator('footer nav[aria-label="Footer"]').getByRole('link', { name: TH.footerContact }).click();
    await settle(p, 'contact');
    check('footer contact link opens the contact page', true);
  });
});
