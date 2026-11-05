import { View } from '../../components/layout/View';
import { useState } from 'react';
import { useLang } from '../../app/LanguageProvider';
import { useStore } from '../../app/StoreProvider';
import { AnimatedNumber } from '../../components/charts/AnimatedNumber';
import { BackButton, MockTag, PageHead } from '../../components/layout/Shell';
import { Icon } from '../../components/icons/Icon';
import { CATEGORY_COLORS, CATEGORY_KEYS, CATEGORY_NOV, FLOW } from '../../data/mock';
import { monthSummary } from '../../domain/overview';
import { fmtMonth, money } from '../../utils/format';

/** Financial overview: month navigation, KPIs and a category donut with a list. */
export function OverviewPage() {
  const { t, lang } = useLang();
  const { state, dispatch } = useStore();
  const [highlight, setHighlight] = useState<number | null>(null);
  const idx = state.ovIndex;
  const month = monthSummary(FLOW, idx, CATEGORY_NOV);
  const total = month.categories.reduce((a, b) => a + b, 0);
  const monthLabel = fmtMonth(new Date(2026, idx - 1, 1), lang);

  const setIndex = (next: number) => { dispatch({ type: 'overview/set', index: next }); setHighlight(null); };

  // Donut segments: stroke-dasharray slices around a circle of radius 80.
  const C = 2 * Math.PI * 80;
  let offset = 0;
  const segments = month.categories.map((v, i) => {
    const len = (v / total) * C;
    const seg = (
      <circle key={i} cx="100" cy="100" r="80" fill="none" stroke={CATEGORY_COLORS[i]}
        strokeWidth={highlight === i ? 26 : 22}
        strokeDasharray={`${Math.max(0, len - 2)} ${C}`} strokeDashoffset={-offset}
        opacity={highlight !== null && highlight !== i ? 0.25 : 1} />
    );
    offset += len;
    return seg;
  });

  return (
    <View route="svc-overview" labelledBy="ovTitle">
      <BackButton />
      <PageHead titleId="ovTitle" title={t('ov_title')} className="page-head reveal" side={
        <div className="month-nav">
          <button className="round" id="ovPrev" type="button" aria-label={t('aria_prev_month')} disabled={idx <= 0} onClick={() => setIndex(idx - 1)}>
            <Icon name="i-back" />
          </button>
          <strong id="ovMonth">{monthLabel}</strong>
          <button className="round" id="ovNext" type="button" aria-label={t('aria_next_month')} disabled={idx >= 11} onClick={() => setIndex(idx + 1)}>
            <Icon name="i-right" />
          </button>
        </div>
      }>
        <p>{t('ov_sub')}</p>
      </PageHead>

      <div className="ov-kpis reveal">
        <div className="card kpi lift"><span>{t('home_income')}</span><AnimatedNumber id="ovIncome" className="count" value={month.income} kind="money" duration={0} /></div>
        <div className="card kpi lift"><span>{t('home_expenses')}</span><AnimatedNumber id="ovExpense" className="count" value={month.expense} kind="money" duration={0} /></div>
        <div className="card kpi lift"><span>{t('home_net')}</span><AnimatedNumber id="ovNet" className="count" value={month.net} kind="money" duration={0} /></div>
        <div className="card kpi lift"><span>{t('home_rate')}</span><AnimatedNumber id="ovRate" className="count" value={month.rate} kind="pct" duration={0} /></div>
      </div>

      <div className="card reveal" style={{ padding: 26 }}>
        <div className="card-head" style={{ marginBottom: 22 }}>
          <div>
            <h2>{t('ov_breakdown')}</h2>
            <p>{t('ov_breakdown_sub')}</p>
          </div>
          <MockTag />
        </div>
        <div className="donut-wrap">
          <div className="donut" id="donut">
            <svg viewBox="0 0 200 200" role="img" aria-label={t('ov_breakdown')}>{segments}</svg>
            <div className="center">
              {highlight === null
                ? <><small>{t('ov_total')}</small><b>{money(total)}</b></>
                : <><small>{t(CATEGORY_KEYS[highlight])}</small><b>{money(month.categories[highlight])}</b></>}
            </div>
          </div>
          <ul className="cat-list" id="catList">
            {CATEGORY_KEYS.map((k, i) => (
              <li key={k}>
                <button type="button" data-cat={i}
                  className={highlight !== null && highlight !== i ? 'dim' : ''}
                  aria-pressed={highlight === i}
                  onClick={() => setHighlight(highlight === i ? null : i)}>
                  <i className="sw" style={{ background: CATEGORY_COLORS[i] }} />
                  <span>{t(k)}</span>
                  <span className="v num">{money(month.categories[i])} <span className="p">{Math.round(month.categories[i] / total * 100)}%</span></span>
                </button>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </View>
  );
}
