// Monthly overview: income, expense, net, savings rate and category split (mock).
export interface MonthSummary {
  income: number;
  expense: number;
  net: number;
  /** Savings rate in percent. */
  rate: number;
  /** Category amounts scaled to this month's expense. */
  categories: number[];
}

/** flow: thousands of baht per month. categoryBaseline: the reference month's split. */
export function monthSummary(flow: { income: readonly number[]; expense: readonly number[] }, index: number, categoryBaseline: readonly number[]): MonthSummary {
  const income = flow.income[index] * 1000;
  const expense = flow.expense[index] * 1000;
  const baselineTotal = categoryBaseline.reduce((a, b) => a + b, 0);
  const scale = expense / baselineTotal;
  return {
    income,
    expense,
    net: income - expense,
    rate: ((income - expense) / income) * 100,
    categories: categoryBaseline.map(v => Math.round(v * scale)),
  };
}

/** Cash-flow chart series for the last `n` months. */
export const lastMonths = <T,>(series: readonly T[], n: number): T[] => series.slice(-n);
