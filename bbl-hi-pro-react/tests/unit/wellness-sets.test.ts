import { test } from 'node:test';
import assert from 'node:assert/strict';
import { scoreSet, overallScore, SCORE_MAX } from '../../src/domain/wellnessSets';
import { WELLNESS_SETS } from '../../src/data/wellnessSets';

const set = (id: string) => WELLNESS_SETS.find(s => s.id === id)!;
const all = (id: string, v: number) => Object.fromEntries(set(id).questions.map(q => [q.id, v]));

test('there are three sets with five questions each', () => {
  assert.equal(WELLNESS_SETS.length, 3);
  for (const s of WELLNESS_SETS) assert.equal(s.questions.length, 5, s.id);
});

test('a set scores 0 when every answer is the lowest and 100 when every answer is the highest', () => {
  assert.equal(scoreSet(set('knowledge'), all('knowledge', 0)), 0);
  assert.equal(scoreSet(set('knowledge'), all('knowledge', SCORE_MAX)), 100);
});

test('a set score is null until every question in it is answered', () => {
  const partial = { k1: 4, k2: 4 };
  assert.equal(scoreSet(set('knowledge'), partial), null);
});

test('a reverse item flips its scale: a high answer lowers the set score', () => {
  // Habit set: four items at 4 and the reverse item h3 at 4 (bad) → 16 of 20 → 80.
  const worst = { ...all('habit', 4), h3: 4 };
  const best = { ...all('habit', 4), h3: 0 };
  assert.equal(scoreSet(set('habit'), worst), 80);
  assert.equal(scoreSet(set('habit'), best), 100);
});

test('overall score averages the sets only when all of them are complete', () => {
  assert.equal(overallScore([80, 100, null]), null);
  assert.equal(overallScore([80, 100, 60]), 80);
  assert.equal(overallScore([100, 50]), 75);
});
