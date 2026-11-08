// Existing features that had no E2E coverage: contact form, overview month and category controls, home cash-flow range,
// wellness spending accordion, document copies stepper, appointment notes counter, notifications mark-all-read,
// brand page, and the Financial Playground Coming Soon state. Roles, labels, and visible state; no fixed sleeps.
const { runSuite, waitState } = require('./helpers.cjs');

const TH = {
  contactName: 'ชื่อ-นามสกุล', contactEmail: 'อีเมล', contactSubject: 'หัวข้อ', contactMessage: 'ข้อความ',
  send: 'ส่งข้อความ', prevMonth: 'เดือนก่อนหน้า', nextMonth: 'เดือนถัดไป', range12: '12 เดือน', range6: '6 เดือน',
  more: 'เพิ่มจำนวน', less: 'ลดจำนวน', markAll: 'อ่านทั้งหมด', bell: 'การแจ้งเตือน', back: 'กลับหน้าหลัก',
  brandTitle: 'ตัวตนแบรนด์ BBL HI PRO', brandStatus: 'สถานะ: ยืนยันแล้ว', lightBg: 'บนพื้นสว่าง', darkBg: 'บนพื้นเข้ม',
  sizes: 'ขนาดการใช้งาน (px)', soon: 'เร็ว ๆ นี้', playHeading: 'พื้นที่เรียนรู้การเงินแบบเล่นได้',
};

runSuite('features (existing behaviour without E2E coverage)', async ({ check, step, newPage: rawNewPage }) => {
  const newPage = async (options, url) => {
    const page = await rawNewPage(options, url);
    await waitState(page, 'opening splash finished', () => !document.querySelector('#splash'), null, 6000);
    return page;
  };
  const settle = (p, route) => waitState(p, `view "${route}" loaded`, r => {
    const v = document.querySelector('.view.active');
    return v?.id === r && !v.classList.contains('is-loading');
  }, route, 6000);
  const contactField = (p, label) => p.locator('#contactForm').getByLabel(label);
  const go = async (p, route) => { await p.evaluate(r => { location.hash = '#' + r; }, route); await settle(p, route); };

  // ---------- Contact ----------
  await step('contact: empty submit shows errors, focuses the first invalid field, and shows the toast', async () => {
    const p = await newPage({ viewport: { width: 1280, height: 900 } });
    await go(p, 'contact');
    await p.getByRole('button', { name: TH.send }).click();
    await waitState(p, 'contact errors visible', () => document.querySelectorAll('#contactForm .err.show').length >= 3);
    check('name error shown and the field is marked invalid', (await p.getAttribute('#cName', 'aria-invalid')) === 'true' && (await p.textContent('#errName')).trim().length > 0);
    check('first invalid field receives focus', await p.evaluate(() => document.activeElement?.id === 'cName'), await p.evaluate(() => document.activeElement?.id));
    await waitState(p, 'status message shown', () => document.querySelector('#toast')?.classList.contains('show') && document.querySelector('#toast').textContent.includes('เครื่องหมายสีแดง'));
    check('status message asks the user to check the marked fields', true);
  });

  await step('contact: errors update live as fields are corrected; message counter tracks length', async () => {
    const p = await newPage({ viewport: { width: 1280, height: 900 } });
    await go(p, 'contact');
    await p.getByRole('button', { name: TH.send }).click();
    await waitState(p, 'contact errors', () => document.querySelectorAll('#contactForm .err.show').length >= 3);
    await contactField(p, TH.contactName).fill('A');
    check('a one-letter name is still rejected', (await p.textContent('#errName')).trim().length > 0);
    await contactField(p, TH.contactName).fill('Pim');
    await waitState(p, 'name error cleared', () => document.querySelector('#errName')?.textContent.trim() === '');
    check('name error clears once the name is valid', true);
    await contactField(p, TH.contactEmail).fill('bad');
    check('invalid email is reported', (await p.textContent('#errEmail')).trim().length > 0);
    await contactField(p, TH.contactEmail).fill('pim@example.com');
    await waitState(p, 'email error cleared', () => document.querySelector('#errEmail')?.textContent.trim() === '');
    await contactField(p, TH.contactMessage).fill('short');
    check('message under 10 characters is rejected', (await p.textContent('#errMessage')).trim().length > 0);
    const msg = 'This message is long enough.';
    await contactField(p, TH.contactMessage).fill(msg);
    await waitState(p, 'message error cleared', () => document.querySelector('#errMessage')?.textContent.trim() === '');
    const counter = (await p.textContent('#msgCount')).trim();
    check('message counter shows length out of 500', counter === `${msg.length}/500`, counter);
    check('subject is required', (await p.textContent('#errSubject')).trim().length > 0);
  });

  await step('contact: valid submission shows sending state, then a simulated success, and can be reset', async () => {
    const p = await newPage({ viewport: { width: 1280, height: 900 } });
    await go(p, 'contact');
    await contactField(p, TH.contactName).fill('Pim');
    await contactField(p, TH.contactEmail).fill('pim@example.com');
    await contactField(p, TH.contactSubject).selectOption('ux');
    await contactField(p, TH.contactMessage).fill('This message is long enough.');
    await p.getByRole('button', { name: TH.send }).click();
    check('submit button is disabled while sending', await p.locator('#ctSubmit').isDisabled());
    await waitState(p, 'simulated success', () => !!document.querySelector('#contactSuccess'), null, 6000);
    check('success state replaces the form', await p.isHidden('#contactForm').catch(() => true));
    await p.click('#ctAgain');
    await waitState(p, 'form back after reset', () => !!document.querySelector('#contactForm') && !document.querySelector('#contactSuccess'));
    check('reset clears the name field', (await p.inputValue('#cName')) === '');
  });

  // ---------- Financial Overview ----------
  await step('overview: month controls step through months and disable at the ends', async () => {
    const p = await newPage({ viewport: { width: 1280, height: 900 } });
    await go(p, 'svc-overview');
    const label = () => p.textContent('#ovMonth').then(s => s.trim());
    const start = await label();
    check('starts on the latest month, with next disabled', await p.locator('#ovNext').isDisabled() && !(await p.locator('#ovPrev').isDisabled()), start);
    await p.getByRole('button', { name: TH.prevMonth }).click();
    await waitState(p, 'previous month shown', (prev) => document.querySelector('#ovMonth').textContent.trim() !== prev, start);
    const prevLabel = await label();
    check('previous month changes the month label', prevLabel !== start, `${start} → ${prevLabel}`);
    check('next is enabled after stepping back', await p.locator('#ovNext').isEnabled());
    while (!(await p.locator('#ovPrev').isDisabled())) await p.getByRole('button', { name: TH.prevMonth }).click();
    await waitState(p, 'previous disabled at the first month', () => document.querySelector('#ovPrev').disabled);
    check('previous is disabled at the first month', await p.locator('#ovPrev').isDisabled());
  });

  await step('overview: category buttons toggle their highlight (aria-pressed) one at a time', async () => {
    const p = await newPage({ viewport: { width: 1280, height: 900 } });
    await go(p, 'svc-overview');
    const cats = p.locator('#catList button');
    await cats.nth(0).click();
    await waitState(p, 'first category pressed', () => document.querySelector('#catList button').getAttribute('aria-pressed') === 'true');
    check('clicked category is pressed', (await cats.nth(0).getAttribute('aria-pressed')) === 'true');
    check('other categories are not pressed', (await cats.nth(1).getAttribute('aria-pressed')) === 'false');
    await cats.nth(1).click();
    await waitState(p, 'second category pressed', () => document.querySelectorAll('#catList button')[1].getAttribute('aria-pressed') === 'true');
    check('pressing another category moves the highlight', (await cats.nth(0).getAttribute('aria-pressed')) === 'false');
    await cats.nth(1).click();
    await waitState(p, 'highlight cleared', () => document.querySelectorAll('#catList button')[1].getAttribute('aria-pressed') === 'false');
    check('pressing the highlighted category again clears it', true);
  });

  // ---------- Home cash-flow range ----------
  await step('home: cash-flow range switches between 6 and 12 months', async () => {
    const p = await newPage({ viewport: { width: 1280, height: 900 } });
    await settle(p, 'home');
    const cols = () => p.locator('#chart .col').count();
    check('chart starts with 6 months', (await cols()) === 6, String(await cols()));
    await p.getByRole('button', { name: TH.range12 }).click();
    await waitState(p, '12 months shown', () => document.querySelectorAll('#chart .col').length === 12);
    check('12-month range shows 12 columns and is pressed', (await p.getByRole('button', { name: TH.range12 }).getAttribute('aria-pressed')) === 'true');
    await p.getByRole('button', { name: TH.range6 }).click();
    await waitState(p, '6 months shown', () => document.querySelectorAll('#chart .col').length === 6);
    check('6-month range is restored', (await p.getByRole('button', { name: TH.range6 }).getAttribute('aria-pressed')) === 'true');
  });

  // ---------- Wellness spending accordion ----------
  await step('wellness: spending rows expand one at a time (accordion)', async () => {
    const p = await newPage({ viewport: { width: 1280, height: 900 } });
    await go(p, 'wellness');
    const rows = p.locator('#spend button[aria-expanded]');
    const count = await rows.count();
    check('spending has several category rows', count >= 2, String(count));
    check('all rows start collapsed', (await rows.evaluateAll(rs => rs.every(r => r.getAttribute('aria-expanded') === 'false'))));
    await rows.nth(0).click();
    await waitState(p, 'first spending row expanded', () => document.querySelectorAll('#spend button[aria-expanded]')[0].getAttribute('aria-expanded') === 'true');
    check('clicked row expands and shows its detail', (await rows.nth(0).locator('.detail').textContent()).trim().length > 0);
    await rows.nth(1).click();
    await waitState(p, 'second row expanded, first collapsed', () => document.querySelectorAll('#spend button[aria-expanded]')[1].getAttribute('aria-expanded') === 'true' && document.querySelectorAll('#spend button[aria-expanded]')[0].getAttribute('aria-expanded') === 'false');
    check('opening a second row collapses the first', true);
    await rows.nth(1).click();
    await waitState(p, 'row collapsed again', () => document.querySelectorAll('#spend button[aria-expanded]')[1].getAttribute('aria-expanded') === 'false');
    check('the open row collapses when pressed again', true);
  });

  // ---------- Document request copies stepper ----------
  await step('document request: copies stepper stays between 1 and 5', async () => {
    const p = await newPage({ viewport: { width: 1280, height: 900 } });
    await go(p, 'svc-documents');
    const copies = p.locator('#docCopies');
    check('copies starts at 1, and decrease is disabled', (await copies.inputValue()) === '1' && await p.getByRole('button', { name: TH.less }).isDisabled());
    await p.getByRole('button', { name: TH.more }).click();
    await waitState(p, 'copies 2', () => document.querySelector('#docCopies').value === '2');
    check('increase adds one copy', true);
    await p.getByRole('button', { name: TH.less }).click();
    await waitState(p, 'copies 1 again', () => document.querySelector('#docCopies').value === '1');
    check('decrease removes one copy', true);
    for (let i = 0; i < 4; i++) await p.getByRole('button', { name: TH.more }).click();
    await waitState(p, 'copies 5', () => document.querySelector('#docCopies').value === '5');
    check('increase stops at 5, and increase is disabled there', await p.getByRole('button', { name: TH.more }).isDisabled());
    await copies.fill('9');
    await copies.blur();
    await waitState(p, 'typed value clamped to 5', () => document.querySelector('#docCopies').value === '5');
    check('typing above 5 is clamped on leaving the field', (await copies.inputValue()) === '5');
  });

  // ---------- Appointment notes counter ----------
  await step('appointment: notes counter tracks length and stops at 200', async () => {
    const p = await newPage({ viewport: { width: 1280, height: 900 } });
    await go(p, 'svc-appointment');
    check('counter starts at 0/200', (await p.textContent('#notesCount')).trim() === '0/200');
    await p.locator('#apptNotes').fill('abc');
    await waitState(p, 'counter 3/200', () => document.querySelector('#notesCount').textContent.trim() === '3/200');
    check('counter shows 3/200 after typing three characters', true);
    await p.locator('#apptNotes').fill('x'.repeat(210));
    await waitState(p, 'counter capped at 200', () => document.querySelector('#notesCount').textContent.trim() === '200/200');
    check('notes cannot exceed 200 characters', (await p.locator('#apptNotes').inputValue()).length === 200);
  });

  // ---------- Notifications ----------
  await step('notifications: panel opens and "mark all as read" clears every unread item', async () => {
    const p = await newPage({ viewport: { width: 1280, height: 900 } });
    await settle(p, 'home');
    await p.getByRole('button', { name: TH.bell }).click();
    await waitState(p, 'notification panel open', () => !document.querySelector('#notifPanel').hidden);
    check('bell opens the notification panel', true);
    const unread = await p.locator('.notif-item:not(.read)').count();
    check('some notifications start unread, and the bell shows a dot', unread > 0 && !(await p.getAttribute('#bellDot', 'class')).includes('off'), `unread ${unread}`);
    await p.getByRole('button', { name: TH.markAll }).click();
    await waitState(p, 'all notifications read', () => document.querySelectorAll('.notif-item:not(.read)').length === 0 && document.querySelector('#bellDot').classList.contains('off'));
    check('mark all as read marks every item read and hides the dot', true);
  });

  // ---------- Brand ----------
  await step('brand: heading, status tag, light and dark variants and size samples are shown', async () => {
    const p = await newPage({ viewport: { width: 1280, height: 900 } });
    await go(p, 'brand');
    check('brand heading is shown', (await p.textContent('#brTitle')).trim() === TH.brandTitle);
    check('brand status tag is shown', (await p.locator('#brand').textContent()).includes(TH.brandStatus));
    check('light background variant is shown', await p.getByRole('heading', { name: TH.lightBg }).isVisible());
    check('dark background variant is shown', await p.getByRole('heading', { name: TH.darkBg }).isVisible());
    check('size samples are shown', await p.getByRole('heading', { name: TH.sizes }).isVisible());
    check('brand page exposes no form controls', await p.locator('#brand input, #brand select, #brand textarea').count() === 0);
  });

  // ---------- Playground ----------
  await step('playground: the 3D zoo in an iframe, then the nav returns home', async () => {
    const p = await newPage({ viewport: { width: 1280, height: 900 } });
    await go(p, 'playground');
    check('title is Financial Playground', (await p.textContent('#pgTitle')).trim() === 'Financial Playground');
    check('the zoo iframe is shown', await p.locator('#playground iframe.pg-zoo-frame').count() === 1);
    check('the iframe loads zoo/index.html', (await p.getAttribute('#playground iframe.pg-zoo-frame', 'src')) === 'zoo/index.html');
    check('the iframe has an accessible title', (await p.getAttribute('#playground iframe.pg-zoo-frame', 'title')) === 'Financial Playground');
    check('no "Coming soon" label on the page', !(await p.locator('#playground').textContent()).includes(TH.soon));
    await p.locator('.main-nav [data-nav="home"]').first().click();
    await settle(p, 'home');
    check('the nav returns to home', true);
  });
});
