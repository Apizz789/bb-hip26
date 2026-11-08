import { test } from 'node:test';
import assert from 'node:assert/strict';
import { maskedNumber, netOf, savingsRateOf, type Account } from '../../src/domain/accounts';
import { ACCOUNTS, INITIAL_GOALS } from '../../src/data/mock';

const acct = (over: Partial<Account> = {}): Account => ({
  id: 'x', name: { th: 'ทดสอบ', en: 'Test' }, tail: '123', balance: 0, income: 45000, expense: 28760, ...over,
});

test('account numbers are masked except for the last three digits', () => {
  assert.equal(maskedNumber(acct({ tail: '123' })), 'xxx-x-xx123-x');
  assert.equal(maskedNumber(acct({ tail: '908' })), 'xxx-x-xx908-x');
});

test('net is income minus expense, and the savings rate rounds to whole percent', () => {
  assert.equal(netOf(acct()), 16240);
  assert.equal(savingsRateOf(acct()), 36);                       // 16,240 / 45,000 = 36.09%
});

test('a negative net gives a negative savings rate', () => {
  assert.equal(savingsRateOf(acct({ income: 1200, expense: 1500 })), -25);
});

test('no income means no savings rate instead of a division by zero', () => {
  assert.equal(savingsRateOf(acct({ income: 0, expense: 0 })), 0);
});

test('the default account keeps the figures the home page has always shown', () => {
  const a1 = ACCOUNTS[0];
  assert.equal(a1.id, 'a1');
  assert.equal(a1.balance, 152430.5);
  assert.equal(netOf(a1), 16240);
  assert.equal(savingsRateOf(a1), 36);
});

test('there are four accounts with unique ids, and every goal points to one of them', () => {
  assert.equal(ACCOUNTS.length, 4);
  assert.equal(new Set(ACCOUNTS.map(a => a.id)).size, 4);
  const ids = new Set(ACCOUNTS.map(a => a.id));
  for (const g of INITIAL_GOALS) assert.ok(ids.has(g.accountId), `goal ${g.id} points to ${g.accountId}`);
});
