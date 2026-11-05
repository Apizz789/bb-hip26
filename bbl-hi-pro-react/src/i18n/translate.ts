import { dictionary, type TranslationKey } from './dictionary';
import { fill, type Lang } from '../utils/format';

export type Translator = (key: TranslationKey, vars?: Record<string, string | number>) => string;

/** Returns a typed translator for one language. A missing key renders the key itself, so gaps are visible. */
export function createTranslator(lang: Lang): Translator {
  const index = lang === 'th' ? 0 : 1;
  return (key, vars) => {
    const pair = dictionary[key] as readonly [string, string] | undefined;
    return fill(pair ? pair[index] : key, vars);
  };
}

/** Lists every key that has no text in one language (used by tests). */
export function missingKeys(): string[] {
  return Object.entries(dictionary)
    .filter(([, pair]) => !pair[0] || !pair[1])
    .map(([k]) => k);
}
