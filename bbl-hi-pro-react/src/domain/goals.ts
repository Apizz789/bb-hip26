// Financial goals: status, progress and validation rules. Pure, no UI or storage.
import type { TranslationKey } from '../i18n/dictionary';
import { addYears, daysBetween, isoOf, parseISO } from '../utils/format';

export interface Goal {
  id: string;
  /** Set for the built-in mock goals (translated per language). */
  nameKey?: TranslationKey;
  /** Set for user-created goals. */
  name?: string;
  target: number;
  saved: number;
  start: string;
  date: string;
}

export type GoalStatus = 'done' | 'overdue' | 'behind' | 'ontrack';

/**
 * done: target reached.
 * overdue: target date passed.
 * behind: saved less than 80% of the share of time already elapsed.
 * ontrack: otherwise.
 */
export function goalStatus(g: Goal, today: Date): GoalStatus {
  if (g.saved >= g.target) return 'done';
  const end = parseISO(g.date);
  if (daysBetween(today, end) < 0) return 'overdue';
  const start = parseISO(g.start);
  const total = daysBetween(start, end);
  const elapsed = daysBetween(start, today);
  const expected = total > 0 ? Math.min(1, Math.max(0, elapsed / total)) : 1;
  return g.saved / g.target < expected * 0.8 ? 'behind' : 'ontrack';
}

export const goalRemaining = (g: Goal): number => Math.max(0, g.target - g.saved);

/** Progress in [0, 1]. */
export const goalRatio = (g: Goal): number => Math.min(1, g.saved / g.target);

/** Suggested monthly saving: remaining ÷ months left, rounded up to ฿100. */
export function suggestedMonthly(g: Goal, today: Date): number {
  const remain = goalRemaining(g);
  const months = Math.max(1, Math.ceil(daysBetween(today, parseISO(g.date)) / 30));
  return Math.ceil(remain / months / 100) * 100;
}

/** Simulated saving: never exceeds the target. Returns the amount actually added. */
export function applySimulatedSave(g: Goal, amount: number): { goal: Goal; added: number } {
  const saved = Math.min(g.target, g.saved + amount);
  return { goal: { ...g, saved }, added: saved - g.saved };
}

export interface GoalInput {
  name: string;
  target: number;
  saved: number;
  date: string;
}

export type GoalField = 'name' | 'target' | 'date' | 'saved';
export type GoalErrors = Partial<Record<GoalField, TranslationKey>>;

/** Validates create/edit input. Returns translation keys, never text. */
export function validateGoal(input: GoalInput, today: Date): GoalErrors {
  const errors: GoalErrors = {};
  const name = input.name.trim();
  if (name.length < 2 || name.length > 40) errors.name = 'err_gname';

  const { target } = input;
  if (!Number.isInteger(target) || target < 1000 || target > 10_000_000) errors.target = 'err_gtarget';

  const date = input.date ? parseISO(input.date) : null;
  const dateOk = !!date && daysBetween(today, date) >= 1 && date <= addYears(today, 10);
  if (!dateOk) errors.date = 'err_gdate';

  const { saved } = input;
  if (!Number.isFinite(saved) || saved < 0 || (target && saved > target)) errors.saved = 'err_gsaved';
  return errors;
}

/** Minimum and maximum selectable target dates (tomorrow … 10 years out). */
export const goalDateBounds = (today: Date): { min: string; max: string } => ({
  min: isoOf(new Date(today.getFullYear(), today.getMonth(), today.getDate() + 1)),
  max: isoOf(addYears(today, 10)),
});
