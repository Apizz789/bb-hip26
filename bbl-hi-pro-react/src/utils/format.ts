// Pure formatting helpers. Thai uses the Buddhist calendar (th-TH locale default).
export type Lang = 'th' | 'en';

export const localeFor = (lang: Lang): string => (lang === 'th' ? 'th-TH' : 'en-GB');

/** Whole-baht amounts, up to 2 decimals (e.g. ฿152,430.5 → ฿152,430.5). */
export const money = (n: number): string =>
  '฿' + Number(n).toLocaleString('en-US', { minimumFractionDigits: 0, maximumFractionDigits: 2 });

/** Always two decimals, used for balances and transaction amounts. */
export const money2 = (n: number): string =>
  '฿' + Number(n).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });

export const pad = (n: number): string => String(n).padStart(2, '0');

/** Date-only ISO string (YYYY-MM-DD) for a local calendar date. */
export const isoOf = (d: Date): string => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;

/** Parses YYYY-MM-DD as a local midnight date (avoids UTC shifts). */
export const parseISO = (iso: string): Date => new Date(iso + 'T00:00:00');

export const daysBetween = (a: Date, b: Date): number => Math.round((b.getTime() - a.getTime()) / 86400000);

export const addYears = (d: Date, years: number): Date =>
  new Date(d.getFullYear() + years, d.getMonth(), d.getDate());

export const fmtDate = (iso: string, lang: Lang): string =>
  new Intl.DateTimeFormat(localeFor(lang), { day: 'numeric', month: 'short', year: 'numeric' }).format(parseISO(iso));

export const fmtDay = (iso: string, lang: Lang): string =>
  new Intl.DateTimeFormat(localeFor(lang), { weekday: 'short' }).format(parseISO(iso));

export const fmtDM = (iso: string, lang: Lang): string =>
  new Intl.DateTimeFormat(localeFor(lang), { day: 'numeric', month: 'short' }).format(parseISO(iso));

export const fmtMonth = (d: Date, lang: Lang, style: 'short' | 'long' = 'long'): string =>
  new Intl.DateTimeFormat(localeFor(lang), style === 'long' ? { month: 'long', year: 'numeric' } : { month: 'short' }).format(d);

/** Replaces {placeholders} in a translated string. */
export const fill = (template: string, vars?: Record<string, string | number>): string =>
  vars ? template.replace(/\{(\w+)\}/g, (_, k: string) => String(vars[k] ?? '')) : template;
