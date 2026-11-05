import { useEffect, useState } from 'react';
import { useLang } from '../../app/LanguageProvider';
import { fmtMonth, money2 } from '../../utils/format';
import { prefersReducedMotion } from '../../utils/storage';

export interface FlowSeries { income: readonly number[]; expense: readonly number[] }

/**
 * Income vs expense bars for the last `months` months (values in thousands of baht).
 * `active` replays the grow animation each time the home page is shown.
 */
export function CashFlowChart({ flow, months, active }: { flow: FlowSeries; months: number; active: boolean }) {
  const { t, lang } = useLang();
  const [grow, setGrow] = useState(false);

  useEffect(() => {
    if (!active) return;
    setGrow(false);
    const r = requestAnimationFrame(() => setGrow(true));
    return () => cancelAnimationFrame(r);
  }, [active, months]);

  const inc = flow.income.slice(-months);
  const exp = flow.expense.slice(-months);
  const max = Math.max(...inc, ...exp) * 1.12;
  const now = new Date(2026, 10, 1);
  const reduce = prefersReducedMotion();
  const legendIncome = t('legend_income');
  const legendExpense = t('legend_expenses');

  return (
    <div className={'chart' + (grow ? ' grow' : '')} id="chart">
      {inc.map((v, i) => {
        const d = new Date(now.getFullYear(), now.getMonth() - (months - 1 - i), 1);
        const hi = (v / max) * 100;
        const he = (exp[i] / max) * 100;
        const delay = reduce ? 0 : i * 45;
        return (
          <div className="col" tabIndex={0} key={i}
            aria-label={`${fmtMonth(d, lang)}: ${legendIncome} ${money2(v * 1000)}, ${legendExpense} ${money2(exp[i] * 1000)}`}>
            <div className="bars">
              <span className="bi" style={{ height: `${hi}%`, ['--d' as string]: `${delay}ms` }} title={`${legendIncome}: ${money2(v * 1000)}`} />
              <span className="be" style={{ height: `${he}%`, ['--d' as string]: `${delay + 80}ms` }} title={`${legendExpense}: ${money2(exp[i] * 1000)}`} />
            </div>
            <span className="m">{fmtMonth(d, lang, 'short')}</span>
          </div>
        );
      })}
    </div>
  );
}
