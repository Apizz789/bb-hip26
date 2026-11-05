// Major user journeys A-D against the React build (dist/index.html). Each step waits for the UI state it depends on.
const { runSuite, becomes, splashGone, goRoute } = require('./helpers.cjs');

runSuite('journeys (user journeys A-D)', async ({ check, step, newPage }) => {
  const p = await newPage({ viewport: { width: 390, height: 844 } });
  await splashGone(p);

  // A. Document request -> review -> confirmation -> tracking
  await step('A: document request reaches confirmation and appears in tracking', async () => {
    await goRoute(p, 'svc-documents');
    await p.selectOption('#docType', { index: 1 });
    await p.fill('#docEmail', 'tester@example.com');
    await p.click('#docForm button[type=submit]');
    check('A: review step shown after valid submit', await becomes(p, () => {
      const el = document.querySelector('#docReview');
      return !!el && el.getClientRects().length > 0;
    }));
    await p.click('#docConfirm');
    await p.waitForSelector('#docSuccess', { state: 'visible', timeout: 4000 });
    const docRef = (await p.textContent('#docRef')).trim();
    check('A: confirmation shows BBL-DOC reference', /^BBL-DOC-\d+$/.test(docRef), docRef);
    await goRoute(p, 'svc-tracking');
    check('A: new request appears in tracking', await p.locator('.req', { hasText: docRef }).count() === 1);
  });

  // B. Appointment -> branch -> purpose -> date -> time -> confirmation
  await step('B: appointment booking reaches confirmation with a reference', async () => {
    await goRoute(p, 'svc-appointment');
    await p.selectOption('#apptBranch', { index: 1 });
    await p.selectOption('#apptPurpose', { index: 1 });
    await p.locator('.date-chip:not([disabled])').first().click();
    await p.locator('.slot:not([disabled])').first().click();
    await p.click('#apptForm button[type=submit]');
    await p.waitForSelector('.modal', { state: 'visible' });
    await p.locator('.modal .btn.primary').click();
    await p.waitForSelector('#apptSuccess', { state: 'visible', timeout: 4000 });
    const apptRef = (await p.textContent('#apptRef')).trim();
    check('B: appointment confirmation shows BBL-APT reference', /^BBL-APT-\d+$/.test(apptRef), apptRef);
  });

  // C. Wellness -> insight -> recommendation -> relevant feature
  await step('C: wellness recommendation and insight navigation', async () => {
    await goRoute(p, 'wellness');
    await p.locator('.rec .btn.primary').first().click();
    check('C: recommendation marked done', await becomes(p, () => document.querySelectorAll('.rec.done').length === 1));
    check('C: progress pill updated', await becomes(p, () => (document.querySelector('#recPill')?.textContent || '').includes('1')));
    await p.locator('.insight summary').nth(1).click();
    await p.locator('.insight').nth(1).locator('.ins-act .btn.text').click();
    check('C: insight navigates to Overview', await becomes(p, () => location.hash === '#svc-overview'
      && !!document.querySelector('#svc-overview.active') && !document.querySelector('#svc-overview.is-loading')));
  });

  // D. Goals -> create -> edit -> simulated savings -> progress update
  await step('D: goal create, validation, edit and simulated savings', async () => {
    await goRoute(p, 'goals');
    await p.click('#goalNew');
    await p.waitForSelector('#gForm', { state: 'visible' });
    await p.fill('#gTarget', '');
    await p.click('button[form=gForm]');
    await p.waitForSelector('.err-summary', { state: 'visible' });
    check('D: validation summary shown for invalid goal', await p.isVisible('.err-summary'));
    await p.fill('#gName', 'ทดสอบ Test Goal');
    await p.fill('#gTarget', '50000');
    await p.fill('#gDate', '2027-09-30');
    await p.fill('#gSaved', '0');
    await p.click('button[form=gForm]');
    const card = p.locator('.goal-item', { hasText: 'Test Goal' }).first();
    await card.waitFor({ state: 'visible' });
    check('D: created goal listed', await p.locator('.goal-item', { hasText: 'Test Goal' }).count() === 1);
    await card.locator('.btn.text').click();
    await p.waitForSelector('#gForm', { state: 'visible' });
    check('D: edit dialog pre-filled with name', (await p.inputValue('#gName')).includes('Test Goal'));
    await p.fill('#gName', 'Edited Test Goal');
    await p.click('button[form=gForm]');
    const edited = p.locator('.goal-item', { hasText: 'Edited Test Goal' });
    await edited.first().waitFor({ state: 'visible' });
    check('D: edit saved', await edited.count() === 1);
    const before = (await edited.first().locator('.gi-saved').textContent()).trim();
    await edited.first().locator('.gi-actions .btn.ghost').click();
    const changed = await becomes(p, ([label, prev]) => {
      const item = [...document.querySelectorAll('.goal-item')].find(el => el.textContent.includes(label));
      const saved = item?.querySelector('.gi-saved');
      return !!saved && saved.textContent.trim() !== prev;
    }, ['Edited Test Goal', before]);
    const after = (await edited.first().locator('.gi-saved').textContent()).trim();
    check('D: simulated savings update progress', changed && before !== after, `${before} -> ${after}`);
  });
});
