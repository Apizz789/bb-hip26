// Customer accounts: masked numbers and monthly flow. All values are fictional (prototype only).
import type { Lang } from '../utils/format';

export interface Account {
  id: string;
  name: Record<Lang, string>;
  /** Last three digits. The rest of the number is always masked. */
  tail: string;
  balance: number;
  /** This month's income and expenses, in baht. */
  income: number;
  expense: number;
}

export const maskedNumber = (a: Account): string => `xxx-x-xx${a.tail}-x`;
export const netOf = (a: Account): number => a.income - a.expense;
/** Savings rate in whole percent. */
export const savingsRateOf = (a: Account): number => (a.income > 0 ? Math.round((netOf(a) / a.income) * 100) : 0);
