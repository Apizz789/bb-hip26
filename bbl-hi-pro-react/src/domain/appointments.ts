// Branch appointment rules. Availability is deterministic mock data, not a real calendar.
import type { TranslationKey } from '../i18n/dictionary';
import { isoOf } from '../utils/format';

export const BRANCHES = ['silom', 'sukhumvit', 'siam', 'chatuchak'] as const;
export type BranchId = (typeof BRANCHES)[number];
export const SLOTS = ['09:00', '10:00', '11:00', '13:00', '14:00', '15:00', '16:00'] as const;
export const PURPOSES = ['invest', 'account', 'loan', 'general'] as const;
export type PurposeId = (typeof PURPOSES)[number];

const PURPOSE_KEYS: Record<PurposeId, TranslationKey> = {
  invest: 'pu_invest', account: 'pu_account', loan: 'pu_loan', general: 'pu_general',
};
export const purposeKey = (p: PurposeId): TranslationKey => PURPOSE_KEYS[p];
const BRANCH_KEYS: Record<BranchId, TranslationKey> = {
  silom: 'br_silom', sukhumvit: 'br_sukhumvit', siam: 'br_siam', chatuchak: 'br_chatuchak',
};
export const branchKey = (b: BranchId): TranslationKey => BRANCH_KEYS[b];

/** Next `count` weekdays after `from` (weekends are never offered). */
export function workingDays(from: Date, count = 6): string[] {
  const out: string[] = [];
  const d = new Date(from.getFullYear(), from.getMonth(), from.getDate());
  while (out.length < count) {
    d.setDate(d.getDate() + 1);
    if (d.getDay() !== 0 && d.getDay() !== 6) out.push(isoOf(d));
  }
  return out;
}

/** Deterministic mock availability: roughly one in five slots is full, varying by branch. */
export function isSlotTaken(branch: string | null, dayIdx: number, slotIdx: number): boolean {
  const bi = Math.max(0, (BRANCHES as readonly string[]).indexOf(branch ?? ''));
  return (dayIdx * 3 + slotIdx * 2 + bi) % 5 === 0;
}

export interface ApptInput {
  branch: string;
  purpose: string;
  dateIdx: number | null;
  time: string | null;
}
export type ApptErrors = Partial<Record<'branch' | 'purpose' | 'date' | 'time', TranslationKey>>;

export function validateAppointment(input: ApptInput): ApptErrors {
  const errors: ApptErrors = {};
  if (!input.branch) errors.branch = 'err_branch';
  if (!input.purpose) errors.purpose = 'err_purpose';
  if (input.dateIdx === null) errors.date = 'err_date';
  if (!input.time) errors.time = 'err_time';
  return errors;
}
