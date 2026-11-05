// Financial Wellness score. The score is a weighted sum of factor values (mock).
import type { TranslationKey } from '../i18n/dictionary';

export interface WellnessFactor {
  key: TranslationKey;
  /** Mock score for this factor, 0–100. */
  value: number;
  /** Weight in percent. Weights sum to 100. */
  weight: number;
}

export const computeScore = (factors: readonly WellnessFactor[]): number =>
  Math.round(factors.reduce((sum, f) => sum + (f.value * f.weight) / 100, 0));

/** Points contributed by one factor, one decimal place. */
export const contribution = (f: WellnessFactor): string => ((f.value * f.weight) / 100).toFixed(1);
