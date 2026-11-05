// All data in this file is fictional and exists only for the prototype.
// It is labelled "mock" in the UI. Do not replace with real customer data.
import type { TranslationKey } from '../i18n/dictionary';
import type { Goal } from '../domain/goals';
import type { TrackedRequest } from '../domain/requests';
import type { WellnessFactor } from '../domain/wellness';

/** Reference date for every mock calculation (2026-11-05). */
export const TODAY = new Date(2026, 10, 5);

/** Thousands of baht per month, Dec 2025 – Nov 2026 (index 11 = November). */
export const FLOW = {
  income: [38, 40, 39, 41, 42, 41, 43, 42, 44, 43, 44, 45],
  expense: [31, 29, 33, 27, 30, 28, 32, 29, 31, 27, 30, 28.76],
};

export const CATEGORY_KEYS = ['cat_food', 'cat_transport', 'cat_bills', 'cat_shop', 'cat_fun'] as const satisfies readonly TranslationKey[];
export const CATEGORY_COLORS = ['#0D2B5E', '#1F5BBD', '#C9963A', '#1E8A63', '#8A92A3'] as const;
/** November spending by category; sums to 28,760. */
export const CATEGORY_NOV = [8450, 2640, 6320, 6980, 4370] as const;
export const CATEGORY_BUDGET = [9000, 3000, 6500, 5000, 4500] as const;

export const INITIAL_GOALS: Goal[] = [
  { id: 'g1', nameKey: 'g_japan', target: 60000, saved: 18500, start: '2026-06-01', date: '2027-03-31' },
  { id: 'g2', nameKey: 'g_fund', target: 90000, saved: 45000, start: '2026-03-01', date: '2027-06-30' },
  { id: 'g3', nameKey: 'g_laptop', target: 35000, saved: 35000, start: '2026-08-01', date: '2026-12-31' },
];

export const INITIAL_REQUESTS: TrackedRequest[] = [
  { id: 'r1', type: 'doc', ref: 'BBL-DOC-40218', titleKey: 'opt_statement', date: '2026-10-30', step: 2 },
  { id: 'r2', type: 'doc', ref: 'BBL-DOC-40377', titleKey: 'opt_income', date: '2026-11-03', step: 1 },
  { id: 'r3', type: 'appt', ref: 'BBL-APT-20931', titleKey: 'pu_loan', branchKey: 'br_silom', date: '2026-11-12', time: '10:30', step: 1 },
];

export interface MockNotification { key: 'n1' | 'n2' | 'n3'; read: boolean }
export const INITIAL_NOTIFICATIONS: MockNotification[] = [
  { key: 'n1', read: false },
  { key: 'n2', read: false },
  { key: 'n3', read: true },
];

export interface MockActivity { k: TranslationKey; sign: '+' | '−'; amt: number; date: string }
export const INITIAL_ACTIVITY: MockActivity[] = [
  { k: 'act_salary', sign: '+', amt: 45000, date: '2026-11-01' },
  { k: 'act_bill', sign: '−', amt: 1280, date: '2026-11-03' },
  { k: 'act_save', sign: '−', amt: 5000, date: '2026-11-04' },
];

export const WELLNESS_FACTORS: WellnessFactor[] = [
  { key: 'f_savings', value: 80, weight: 30 },
  { key: 'f_bills', value: 100, weight: 25 },
  { key: 'f_budget', value: 56, weight: 25 },
  { key: 'f_fund', value: 45, weight: 20 },
];

export interface Insight { t: TranslationKey; d: TranslationKey; color: string; go: RouteTarget; act: TranslationKey }
export type RouteTarget = 'svc-overview' | 'goals' | 'wellness' | 'home' | 'svc-documents' | 'svc-appointment' | 'svc-tracking' | 'services';

export const INSIGHTS: Insight[] = [
  { t: 'ins1_t', d: 'ins1_d', color: 'var(--green)', go: 'svc-overview', act: 'ins_act_overview' },
  { t: 'ins2_t', d: 'ins2_d', color: 'var(--red)', go: 'svc-overview', act: 'ins_act_shop' },
  { t: 'ins3_t', d: 'ins3_d', color: 'var(--gold)', go: 'goals', act: 'ins_act_goal' },
];

export interface Recommendation { t: TranslationKey; d: TranslationKey; go: RouteTarget; act: TranslationKey }
export const RECOMMENDATIONS: Recommendation[] = [
  { t: 'rec1_t', d: 'rec1_d', go: 'svc-overview', act: 'rec_act_overview' },
  { t: 'rec2_t', d: 'rec2_d', go: 'svc-overview', act: 'rec_act_overview' },
  { t: 'rec3_t', d: 'rec3_d', go: 'goals', act: 'rec_act_goal' },
];
