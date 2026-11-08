// Scoring for the self-assessment sets. Pure: no UI or storage.
import type { WellnessSet } from '../data/wellnessSets';

export const SCORE_MAX = 4;

/** Set score 0–100 once every question is answered; otherwise null. Reverse items flip the scale. */
export function scoreSet(set: WellnessSet, answers: Record<string, number>): number | null {
  if (set.questions.some(q => answers[q.id] === undefined)) return null;
  const sum = set.questions.reduce((acc, q) => acc + (q.reverse ? SCORE_MAX - answers[q.id] : answers[q.id]), 0);
  return Math.round((sum / (set.questions.length * SCORE_MAX)) * 100);
}

/** Average of the set scores, only when every set is complete. */
export function overallScore(scores: (number | null)[]): number | null {
  if (scores.some(s => s === null)) return null;
  const nums = scores as number[];
  return Math.round(nums.reduce((a, b) => a + b, 0) / nums.length);
}
