// Browser storage is used ONLY for the language preference (non-sensitive).
// No financial data, goals, requests or personal details are ever stored.
import type { Lang } from './format';

const LANG_KEY = 'bblhipro-lang';

export function readStoredLang(): Lang {
  try {
    return localStorage.getItem(LANG_KEY) === 'en' ? 'en' : 'th';
  } catch {
    return 'th';
  }
}

export function writeStoredLang(lang: Lang): void {
  try {
    localStorage.setItem(LANG_KEY, lang);
  } catch {
    /* storage unavailable (private mode): the preference simply is not kept */
  }
}

export const prefersReducedMotion = (): boolean =>
  typeof matchMedia === 'function' && matchMedia('(prefers-reduced-motion: reduce)').matches;
