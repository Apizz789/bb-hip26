import { test } from 'node:test';
import assert from 'node:assert/strict';
import { initialState, reducer } from '../../src/store/appState';

// Regression: a simulated goal save must record which goal changed and bump `seq`, so the card can replay its highlight.
test('simulated save records the goal and increments seq on each save', () => {
  assert.equal(initialState.lastSimulated, null);
  const once = reducer(initialState, { type: 'goal/simulateSave', id: 'g1', amount: 500 });
  assert.deepEqual(once.lastSimulated, { id: 'g1', seq: 1 });
  assert.equal(once.goals.find(g => g.id === 'g1')?.saved, 19000);
  const twice = reducer(once, { type: 'goal/simulateSave', id: 'g1', amount: 100 });
  assert.deepEqual(twice.lastSimulated, { id: 'g1', seq: 2 });
});

test('a save on a completed goal changes nothing, including the highlight record', () => {
  const same = reducer(initialState, { type: 'goal/simulateSave', id: 'g3', amount: 500 });
  assert.equal(same, initialState);
  assert.equal(same.lastSimulated, null);
});

test('saving is capped at the target and still records the goal', () => {
  const capped = reducer(initialState, { type: 'goal/simulateSave', id: 'g1', amount: 999999 });
  assert.equal(capped.goals.find(g => g.id === 'g1')?.saved, 60000);
  assert.deepEqual(capped.lastSimulated, { id: 'g1', seq: 1 });
});

test('choosing an account changes the selection, and the eye toggle hides balances', () => {
  const picked = reducer(initialState, { type: 'account/select', id: 'a2' });
  assert.equal(picked.accountId, 'a2');
  const hidden = reducer(picked, { type: 'balances/toggle' });
  assert.equal(hidden.hideBalances, true);
  assert.equal(reducer(hidden, { type: 'balances/toggle' }).hideBalances, false);
});

test('a new goal is saved to the account that is selected', () => {
  const picked = reducer(initialState, { type: 'account/select', id: 'a3' });
  const next = reducer(picked, { type: 'goal/create', input: { name: 'Trip', target: 30000, saved: 0, date: '2027-06-30' } });
  const added = next.goals[next.goals.length - 1];
  assert.equal(added.id, 'g7');
  assert.equal(added.accountId, 'a3');
});

