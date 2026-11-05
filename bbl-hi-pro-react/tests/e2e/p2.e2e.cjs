// Phase 2 — Financial Goals: list, simulated savings, create/edit validation, home card sync, mobile overflow.
// Selectors are user-facing (roles, accessible names, headings); React ids are used only for form fields.
const { runSuite, artifact, waitState } = require('./helpers.cjs');

const TH = { sim: 'ออมจำลอง', simAmt: 'จำนวนเงินจำลอง', edit: 'แก้ไข', save: 'บันทึก', goalsRoute: 'ไปที่เป้าหมาย' };
const digits = s => s.replace(/\D/g, '');

runSuite('p2 (Financial Goals)', async ({ check, step, newPage }) => {
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
    await waitState(p, `view "${route}" to become active`, r => document.querySelector('.view.active')?.id === r, route);
  };
  const cards = () => p.locator('#goalList > article.goal-item');
  const card = (i) => cards().nth(i);
  const cardSaved = (i) => card(i).locator('.gi-saved').textContent();

  await step('Thai UI has no leaked translation keys', async () => check('TH no leaked keys', (await leak()).length === 0, JSON.stringify(await leak())));

  await step('Goals route activates', async () => { await goRoute('goals'); });
  await step('three mock goals are listed in order with statuses', async () => {
    await waitState(p, '3 goal cards', () => document.querySelectorAll('#goalList > article.goal-item').length === 3);
    const statuses = await cards().locator('.pill').allTextContents();
    check('Japan trip is behind plan', statuses[0].includes('ตามหลัง'), statuses[0]);
    check('Emergency fund is on track', statuses[1].includes('ตามแผน'), statuses[1]);
    check('Laptop is completed', statuses[2].includes('สำเร็จ'), statuses[2]);
  });
  await step('summary KPI shows whole-baht total 98,500', async () => {
    const kpi = await p.locator('#gkSaved').textContent();
    check('goal KPI total is 98,500 in whole baht', digits(kpi) === '98500' && !/\.\d{2}/.test(kpi), kpi);
  });

  await step('simulated savings add the chosen amount to the goal', async () => {
    const before = digits(await cardSaved(0));
    await card(0).getByRole('combobox', { name: TH.simAmt }).selectOption('1000');
    await card(0).getByRole('button', { name: TH.sim }).click();
    await waitState(p, 'Japan trip saved amount to change', (i) => document.querySelectorAll('#goalList > article.goal-item')[i].querySelector('.gi-saved').textContent.replace(/\D/g, '') !== '18500', 0);
    const after = digits(await cardSaved(0));
    check('saved amount increases by 1,000 (18,500 → 19,500)', before === '18500' && after === '19500', `${before} → ${after}`);
  });
  await step('focus stays on the goal\'s simulate button after saving', async () => {
    const focusIsButton = await card(0).getByRole('button', { name: TH.sim }).evaluate(el => el === document.activeElement);
    check('focus is on the Japan trip simulate button', focusIsButton);
  });
  await step('a completed goal cannot receive simulated savings', async () => {
    check('completed goal simulate button is disabled', await card(2).getByRole('button', { name: TH.sim }).isDisabled());
  });

  await step('create goal: validation errors are listed and link to their fields', async () => {
    await p.locator('#goalNew').click();
    const dialog = p.getByRole('dialog');
    await waitState(p, 'goal dialog to open', () => !!document.querySelector('.modal-box[role=dialog]'));
    await p.fill('#gName', 'x');
    await p.fill('#gTarget', '500');
    await p.fill('#gDate', '2020-01-01');
    await dialog.getByRole('button', { name: TH.save }).click();
    const links = dialog.getByRole('alert').getByRole('link');
    await waitState(p, 'error summary with links in goal dialog', () => document.querySelectorAll('.modal-box [role=alert] a').length >= 2);
    const hrefs = await links.evaluateAll(as => as.map(a => a.getAttribute('href')));
    check('error summary lists the target and date problems', hrefs.includes('#gTarget') && hrefs.includes('#gDate'), hrefs.join(' '));
  });
  await step('create goal: valid input adds a fourth card', async () => {
    await p.fill('#gName', 'ค่าเทอมลูก');
    await p.fill('#gTarget', '24000');
    await p.fill('#gDate', '2027-09-30');
    await p.fill('#gSaved', '3000');
    await p.getByRole('dialog').getByRole('button', { name: TH.save }).click();
    await waitState(p, 'fourth goal card and dialog closed', () =>
      document.querySelectorAll('#goalList > article.goal-item').length === 4 && !document.querySelector('.modal-box[role=dialog]'));
    check('new goal name appears in the list', (await p.locator('#goalList').textContent()).includes('ค่าเทอมลูก'));
  });

  await step('edit goal: saved amount above target is rejected, then accepted', async () => {
    await card(0).getByRole('button', { name: TH.edit }).click();
    await waitState(p, 'edit dialog to open', () => !!document.querySelector('.modal-box[role=dialog]'));
    await p.fill('#gName', 'ทริปญี่ปุ่นปีหน้า');
    await p.fill('#gSaved', '99999999');
    await p.getByRole('dialog').getByRole('button', { name: TH.save }).click();
    await waitState(p, 'saved-over-target error in edit dialog', () => document.querySelectorAll('.modal-box [role=alert] a').length >= 1);
    check('saved above target shows an error and keeps the dialog open', !!(await p.$('.modal-box[role=dialog]')));
    await p.fill('#gSaved', '20000');
    await p.getByRole('dialog').getByRole('button', { name: TH.save }).click();
    await waitState(p, 'edit dialog to close', () => !document.querySelector('.modal-box[role=dialog]'));
    check('edited name is saved to the list', (await p.locator('#goalList').textContent()).includes('ทริปญี่ปุ่นปีหน้า'));
  });

  await step('home goal card reflects the first goal and its simulated save', async () => {
    await goRoute('home');
    check('home goal title follows the first goal', (await p.textContent('#goalTitle')).includes('ทริปญี่ปุ่นปีหน้า'));
    const before = digits(await p.textContent('#cGoal'));
    await p.click('#goalAdd');
    await waitState(p, 'home goal amount to change', (b) => document.querySelector('#cGoal').textContent.replace(/\D/g, '') !== b, before);
    check('home "save ฿500" increases the first goal', digits(await p.textContent('#cGoal')) !== before);
  });

  await step('wellness recommendation links to the goals page', async () => {
    await goRoute('wellness');
    await p.getByRole('button', { name: TH.goalsRoute, exact: true }).first().click();
    await waitState(p, 'goals view after wellness link', () => document.querySelector('.view.active')?.id === 'goals');
    check('wellness "go to goal" opens Financial Goals', true);
  });

  await step('goals list has no horizontal overflow at 390px', async () => {
    await p.setViewportSize({ width: 390, height: 844 });
    await goRoute('goals');
    const ov = await p.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth);
    check('no horizontal overflow at 390px', ov <= 0, ov + 'px');
    await p.screenshot({ path: artifact('p2-goals-mobile.png') });
    await p.setViewportSize({ width: 1280, height: 900 });
  });

  await step('English labels for goal statuses', async () => {
    await p.click('.lang-btn[data-lang="en"]');
    await waitState(p, 'English goal status labels', () => /Behind plan|On track|Completed/.test(document.querySelector('#goalList .pill')?.textContent || ''));
    const en = await cards().locator('.pill').allTextContents();
    check('EN statuses are translated', en.every(x => /Behind plan|On track|Completed/.test(x)), JSON.stringify(en));
    check('EN has no leaked translation keys', (await leak()).length === 0);
  });
});
