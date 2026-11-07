// Phase 1 — core flows: language, routing, skip link, resume card, document request, appointment,
// tracking filters, wellness, notifications, mobile layout. Selectors are roles/labels where the UI has them.
const { runSuite, artifact, waitState, focusedId } = require('./helpers.cjs');

const ROUTES = ['home', 'services', 'svc-documents', 'svc-appointment', 'svc-tracking', 'svc-overview', 'goals', 'wellness', 'playground', 'contact', 'brand'];
const digits = s => s.replace(/\D/g, '');

runSuite('p1 (core flows)', async ({ check, step, newPage }) => {
  const p = await newPage({ viewport: { width: 1280, height: 900 } });
  const leak = () => p.evaluate(() => {
    const bad = [];
    document.querySelectorAll('body *').forEach(el => {
      if (el.children.length) return;
      const tx = el.textContent.trim();
      if (/^[a-z]+_[a-z0-9_]+$/.test(tx)) bad.push(tx);
    });
    return bad;
  });
  const goRoute = async (route) => {
    await p.evaluate(r => { location.hash = '#' + r; }, route);
    await waitState(p, `view "${route}" to finish loading`, r => {
      const v = document.querySelector('.view.active');
      return v?.id === r && !v.classList.contains('is-loading');
    }, route, 6000);
  };
  const dialogOpen = () => waitState(p, 'a dialog to open', () => !!document.querySelector('[role=dialog]'));
  const dialogClosed = () => waitState(p, 'the dialog to close', () => !document.querySelector('[role=dialog]'));
  const alertLinks = (scope) => scope.getByRole('alert').getByRole('link');

  await step('language switch: no leaked keys in Thai or English, English nav is English', async () => {
    check('TH has no leaked translation keys', (await leak()).length === 0, JSON.stringify(await leak()));
    await p.click('.lang-btn[data-lang="en"]');
    await waitState(p, 'English UI', () => document.documentElement.lang === 'en');
    check('EN has no leaked translation keys', (await leak()).length === 0, JSON.stringify(await leak()));
    const nav = await p.$$eval('.main-nav a', a => a.map(x => x.textContent.trim()));
    check('EN main nav has no Thai text', nav.length > 0 && nav.every(x => !/[ก-๙]/.test(x)), nav.join(' | '));
    await p.click('.lang-btn[data-lang="th"]');
    await waitState(p, 'Thai UI', () => document.documentElement.lang === 'th');
  });

  await step('every route activates', async () => {
    const failed = [];
    for (const r of ROUTES) {
      await p.evaluate(x => { location.hash = '#' + x; }, r);
      try { await waitState(p, r, x => document.querySelector('.view.active')?.id === x, r, 3000); } catch { failed.push(r); }
    }
    check('all routes activate', failed.length === 0, failed.join(', '));
  });

  await step('route change moves focus to the page heading', async () => {
    await goRoute('svc-documents');
    await waitState(p, 'focus on the page heading', () => document.activeElement?.tagName === 'H1', null, 3000);
    check('focus is on the H1 after navigating to documents', true);
  });

  await step('skip link moves focus into the main content', async () => {
    await goRoute('home');
    // Early activation (during the skeleton) is covered by route-focus.e2e.cjs.
    await p.focus('#skipBtn');
    await p.keyboard.press('Enter');
    const onHeading = await p.evaluate(() => document.activeElement?.tagName === 'H1' && !!document.activeElement.closest('.view.active'));
    check('skip link moves focus to the active page heading', onHeading, await focusedId(p));
  });

  await step('resume card opens its request details and Escape returns focus', async () => {
    const title = await p.textContent('#resumeTitle');
    check('resume card shows a request title', title.trim().length > 0, title);
    await p.click('#resumeBtn');
    await dialogOpen();
    check('resume details open in a dialog', await p.isVisible('[role=dialog]'));
    await p.keyboard.press('Escape');
    await dialogClosed();
    check('Escape closes the dialog', true);
    check('focus returns to the resume button', await p.evaluate(() => document.activeElement?.id === 'resumeBtn'), await focusedId(p));
  });

  await step('document request: empty submit lists problems that link to their fields', async () => {
    await goRoute('svc-documents');
    await p.click('#docForm button[type=submit]');
    const links = alertLinks(p.locator('#docForm'));
    await waitState(p, 'document error summary', () => !!document.querySelector('#docForm [role=alert] a'));
    const count = await links.count();
    check('error summary lists at least two problems', count >= 2, count + ' links');
    const firstHref = await links.first().getAttribute('href');
    await links.first().click();
    const target = (firstHref || '').replace('#', '');
    check('clicking the first problem focuses its field', (await focusedId(p)) === target, `${firstHref} → ${await focusedId(p)}`);
  });

  await step('document request: invalid email is reported in the summary', async () => {
    await p.selectOption('#docType', 'income');
    await p.fill('#docEmail', 'bad');
    await p.click('#docForm button[type=submit]');
    await waitState(p, 'email problem in summary', () => !!document.querySelector('#docForm [role=alert] a[href="#docEmail"]'));
    const emailLink = p.locator('#docForm [role=alert] a[href="#docEmail"]');
    const msg = await emailLink.textContent();
    check('email problem appears in the summary and links to the email field', await emailLink.count() === 1 && /อีเมล|email/i.test(msg), msg);
  });

  await step('document request: valid form → review → edit keeps values → confirm', async () => {
    await p.fill('#docEmail', 'name@example.com');
    await p.click('#docForm button[type=submit]');
    await waitState(p, 'review step', () => document.querySelector('#docReview')?.offsetParent != null);
    const review = (await p.textContent('#docReviewList')).replace(/\s+/g, ' ');
    check('review lists the email address', review.includes('name@example.com'), review.slice(0, 120));
    await p.click('#docEdit');
    await waitState(p, 'form step again', () => !!document.querySelector('#docEmail'));
    check('edit returns to the form with the email kept', (await p.inputValue('#docEmail')) === 'name@example.com');
    await p.click('#docForm button[type=submit]');
    await waitState(p, 'review step again', () => document.querySelector('#docReview')?.offsetParent != null);
    await p.click('#docConfirm');
    await waitState(p, 'document success', () => !!document.querySelector('#docSuccess') && document.querySelector('#docSuccess').offsetParent !== null, null, 6000);
    const ref = await p.textContent('#docRef');
    check('confirmation shows a reference number', /\S/.test(ref), ref);
    await p.click('#docAgain');
  });

  await step('appointment: empty submit lists problems', async () => {
    await goRoute('svc-appointment');
    await p.click('#apptForm button[type=submit]');
    await waitState(p, 'appointment error summary', () => !!document.querySelector('#apptForm [role=alert] a'));
    check('appointment error summary lists problems', (await alertLinks(p.locator('#apptForm')).count()) >= 1);
  });

  await step('appointment: branch changes which time slots are full', async () => {
    await p.selectOption('#apptBranch', 'silom');
    await p.selectOption('#apptPurpose', 'loan');
    await p.getByRole('radiogroup', { name: /เลือกวันที่|Choose a date/ }).getByRole('radio').nth(1).click();
    await waitState(p, 'time slots for the chosen date', () => document.querySelectorAll('#slots [role=radio]').length > 0);
    const fullSilom = await p.$$eval('#slots [role=radio]:disabled', e => e.map(x => x.textContent.trim()).join(','));
    await p.selectOption('#apptBranch', 'chatuchak');
    await p.waitForFunction(() => true);
    const fullChatuchak = await p.$$eval('#slots [role=radio]:disabled', e => e.map(x => x.textContent.trim()).join(','));
    check('full time slots differ between branches', fullSilom !== fullChatuchak, `silom[${fullSilom}] chatuchak[${fullChatuchak}]`);
  });

  await step('appointment: summary shows the chosen date', async () => {
    const when = (await p.textContent('#sumWhen')).trim();
    check('summary shows a date, not "not selected"', when.length > 0 && !/ยังไม่|not selected/i.test(when), when);
  });

  await step('appointment: arrow keys move and select within the date group', async () => {
    const group = p.getByRole('radiogroup', { name: /เลือกวันที่|Choose a date/ });
    await group.getByRole('radio').nth(1).focus();
    await p.keyboard.press('ArrowRight');
    const checkedIndex = await group.evaluate(g => Array.from(g.querySelectorAll('[role=radio]')).findIndex(r => r.getAttribute('aria-checked') === 'true'));
    check('ArrowRight selects the next date', checkedIndex === 2, 'checked index ' + checkedIndex);
  });

  await step('appointment: confirmation dialog traps focus and confirms the booking', async () => {
    await p.getByRole('radiogroup', { name: /เลือกวันที่|Choose a date/ }).getByRole('radio').nth(1).click();
    await p.locator('#slots [role=radio]:not(:disabled)').first().click();
    await p.click('#apptForm button[type=submit]');
    await dialogOpen();
    for (let i = 0; i < 6; i++) await p.keyboard.press('Tab');
    check('Tab keeps focus inside the confirmation dialog', await p.evaluate(() => !!document.activeElement?.closest('[role=dialog]')));
    await p.getByRole('dialog').getByRole('button', { name: /ยืนยัน|Confirm/ }).click();
    await waitState(p, 'appointment success', () => !!document.querySelector('#apptSuccess') && document.querySelector('#apptSuccess').offsetParent !== null, null, 6000);
    check('booking shows a reference number', /\S/.test(await p.textContent('#apptRef')));
    await p.click('#apptAgain');
  });

  await step('tracking: filters change the list and the count matches the list', async () => {
    await goRoute('svc-tracking');
    await p.getByRole('button', { name: 'เสร็จสิ้น', exact: true }).or(p.getByRole('button', { name: 'Completed', exact: true })).click();
    await p.getByRole('button', { name: 'กำลังดำเนินการ', exact: true }).or(p.getByRole('button', { name: 'In progress', exact: true })).click();
    const items = await p.locator('#reqList > li').count();
    const countText = await p.getByText(/^\d+ (รายการ|items)$/).textContent();
    check('count text matches the number of listed requests', Number(digits(countText)) === items, `${countText} vs ${items} rows`);
  });

  await step('wellness: factor table total equals the score', async () => {
    await goRoute('wellness');
    await p.locator('details.how summary').click();
    const open = await p.evaluate(() => document.querySelector('details.how').open);
    check('"how is it calculated" opens', open);
    const total = digits(await p.locator('details.how table tr.total td').last().textContent());
    const score = digits(await p.textContent('#cScore'));
    check('factor table total matches the score ring', total === score, `${total} vs ${score}`);
  });

  await step('wellness: insight action navigates to its page', async () => {
    await p.locator('#insights .ins-act button').first().click();
    await waitState(p, 'overview page after insight action', () => document.querySelector('.view.active')?.id === 'svc-overview');
    check('insight action opens the overview', true);
  });

  await step('playground opens the zoo page, with no Coming Soon tag in the nav', async () => {
    await goRoute('playground');
    check('Playground nav has no Coming Soon tag', (await p.locator('.main-nav .soon-tag').count()) === 0);
    check('the zoo iframe is shown', (await p.locator('iframe.pg-zoo-frame').count()) === 1);
  });

  await step('notifications: keyboard Enter marks an item read', async () => {
    await goRoute('home');
    await p.click('#bellBtn');
    await p.locator('#notifList [data-notif="n1"]').focus();
    await p.keyboard.press('Enter');
    await waitState(p, 'notification n1 to be read', () => document.querySelector('[data-notif="n1"]')?.classList.contains('read'));
    check('notification n1 is marked read after Enter', true);
  });

  await step('mobile 390px: documents page has no overflow and bottom nav is used', async () => {
    const m = await newPage({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 2, isMobile: true, hasTouch: true }, undefined);
    await m.evaluate(() => { location.hash = '#svc-documents'; });
    await waitState(m, 'documents at 390px', () => document.querySelector('.view.active')?.id === 'svc-documents');
    const ov = await m.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth);
    check('390px documents: no horizontal overflow', ov <= 0, ov + 'px');
    await m.screenshot({ path: artifact('p1-mobile-docs.png'), fullPage: true });
    await m.evaluate(() => { location.hash = '#home'; });
    await waitState(m, 'home at 390px', () => document.querySelector('.view.active')?.id === 'home');
    check('390px: bottom nav visible, top nav hidden', await m.isVisible('.bottom-nav') && await m.isHidden('.main-nav'));
    await m.screenshot({ path: artifact('p1-mobile-home.png') });
  });
});
