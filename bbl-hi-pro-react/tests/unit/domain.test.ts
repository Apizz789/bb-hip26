import { test } from 'node:test';
import assert from 'node:assert/strict';
import { goalStatus, suggestedMonthly, validateGoal, applySimulatedSave, goalDateBounds, type Goal } from '../../src/domain/goals';
import { validateDocRequest, clampCopies } from '../../src/domain/documents';
import { isSlotTaken, validateAppointment, workingDays, BRANCHES } from '../../src/domain/appointments';
import { computeScore, contribution } from '../../src/domain/wellness';
import { monthSummary } from '../../src/domain/overview';
import { validateContact } from '../../src/domain/contact';
import { advance, isFinal, pillTone, formatRef, matchesFilter } from '../../src/domain/requests';
import { money, money2, fmtDate, isoOf, fill } from '../../src/utils/format';
import { TODAY, WELLNESS_FACTORS, FLOW, CATEGORY_NOV, INITIAL_GOALS } from '../../src/data/mock';

const g = (over: Partial<Goal> = {}): Goal => ({ id: 'x', accountId: 'a1', target: 60000, saved: 18500, start: '2026-06-01', date: '2027-03-31', ...over });

test('goal status matches the prototype rules for the mock goals', () => {
  assert.equal(goalStatus(INITIAL_GOALS[0], TODAY), 'behind');   // Japan trip
  assert.equal(goalStatus(INITIAL_GOALS[1], TODAY), 'ontrack');  // Emergency fund
  assert.equal(goalStatus(INITIAL_GOALS[2], TODAY), 'done');     // Laptop
});

test('overdue when the target date has passed and the goal is unfinished', () => {
  assert.equal(goalStatus(g({ date: '2026-10-01' }), TODAY), 'overdue');
});

test('suggested monthly amount is remaining / months left, rounded up to ฿100', () => {
  // remaining 41,500; days to 2027-03-31 from 2026-11-05 = 146 → 5 months → 8,300
  assert.equal(suggestedMonthly(g(), TODAY), 8300);
});

test('simulated savings never exceed the target', () => {
  const { goal, added } = applySimulatedSave(g({ saved: 59800 }), 500);
  assert.equal(goal.saved, 60000);
  assert.equal(added, 200);
});

test('goal validation returns translation keys for each invalid field', () => {
  const errs = validateGoal({ name: 'x', target: 500, saved: 0, date: '2020-01-01' }, TODAY);
  assert.deepEqual(errs, { name: 'err_gname', target: 'err_gtarget', date: 'err_gdate' });
});

test('saved amount cannot exceed the target', () => {
  const errs = validateGoal({ name: 'Trip', target: 30000, saved: 40000, date: '2027-06-30' }, TODAY);
  assert.deepEqual(errs, { saved: 'err_gsaved' });
});

test('valid goal input has no errors and date bounds are tomorrow to +10 years', () => {
  assert.deepEqual(validateGoal({ name: 'Trip', target: 30000, saved: 0, date: '2027-06-30' }, TODAY), {});
  const b = goalDateBounds(TODAY);
  assert.equal(b.min, '2026-11-06');
  assert.equal(b.max, '2036-11-05');
});

test('document request validation', () => {
  assert.deepEqual(validateDocRequest({ type: '', copies: 1, delivery: 'branch', email: '' }), { type: 'err_doc_type' });
  assert.deepEqual(validateDocRequest({ type: 'tax', copies: 9, delivery: 'email', email: 'bad' }), { copies: 'err_copies', email: 'err_email' });
  assert.deepEqual(validateDocRequest({ type: 'tax', copies: 2, delivery: 'branch', email: 'ignored' }), {});
  assert.equal(clampCopies(0), 1);
  assert.equal(clampCopies(7), 5);
  assert.equal(clampCopies(Number.NaN), 1);
});

test('appointment availability is deterministic and varies by branch', () => {
  assert.equal(isSlotTaken('silom', 0, 0), true);      // (0 + 0 + 0) % 5 === 0
  assert.equal(isSlotTaken('silom', 0, 1), false);     // (0 + 2 + 0) % 5 === 2
  const silom = [0, 1, 2, 3, 4, 5, 6].map(s => isSlotTaken('silom', 0, s));
  const chatuchak = [0, 1, 2, 3, 4, 5, 6].map(s => isSlotTaken('chatuchak', 0, s));
  assert.notDeepEqual(silom, chatuchak);
  assert.equal(BRANCHES.length, 4);
});

test('appointment validation reports each missing step', () => {
  assert.deepEqual(validateAppointment({ branch: '', purpose: '', dateIdx: null, time: null }),
    { branch: 'err_branch', purpose: 'err_purpose', date: 'err_date', time: 'err_time' });
});

test('working days skip weekends', () => {
  const days = workingDays(TODAY, 6);
  assert.equal(days.length, 6);
  for (const d of days) {
    const wd = new Date(d + 'T00:00:00').getDay();
    assert.ok(wd !== 0 && wd !== 6, d + ' is a weekend');
  }
  assert.equal(days[0], '2026-11-06');
});

test('wellness score is 72 and factor contributions match the prototype table', () => {
  assert.equal(computeScore(WELLNESS_FACTORS), 72);
  assert.deepEqual(WELLNESS_FACTORS.map(contribution), ['24.0', '25.0', '14.0', '9.0']);
});

test('monthly overview: categories sum to the expense and savings rate is 36%', () => {
  const m = monthSummary(FLOW, 11, CATEGORY_NOV);
  assert.equal(m.expense, 28760);
  assert.equal(m.categories.reduce((a, b) => a + b, 0), 28760);
  assert.equal(m.net, 16240);
  assert.equal(Math.round(m.rate), 36);
});

test('contact validation', () => {
  assert.deepEqual(validateContact({ name: 'A', email: 'x', subject: '', message: 'short' }),
    { name: 'err_name', email: 'err_email_c', subject: 'err_subject', message: 'err_message' });
  assert.deepEqual(validateContact({ name: 'Somchai', email: 'a@b.co', subject: 'general', message: 'This is a valid message' }), {});
});

test('request steps advance and stop at ready/completed', () => {
  const r = { id: 'r', type: 'doc' as const, ref: 'R', titleKey: 'opt_statement' as const, date: '2026-11-05', step: 1 as const };
  const next = advance(r);
  assert.equal(next.step, 2);
  assert.ok(isFinal(next));
  assert.equal(advance(next).step, 2);
  assert.equal(pillTone(next), 'green');
  assert.equal(formatRef('DOC', 40501), 'BBL-DOC-40501');
  assert.equal(matchesFilter(r, 'active'), true);
  assert.equal(matchesFilter(next, 'active'), false);
});

test('money formatting', () => {
  assert.equal(money(18500), '฿18,500');
  assert.equal(money(152430.5), '฿152,430.5');
  assert.equal(money2(45000), '฿45,000.00');
});

test('date formatting uses the Buddhist calendar in Thai and Gregorian in English', () => {
  assert.match(fmtDate('2026-11-01', 'th'), /2569/);
  assert.match(fmtDate('2026-11-01', 'en'), /2026/);
  assert.equal(isoOf(new Date(2026, 10, 5)), '2026-11-05');
});

test('placeholder filling', () => {
  assert.equal(fill('ออม {amt} แล้ว', { amt: '฿500' }), 'ออม ฿500 แล้ว');
});
