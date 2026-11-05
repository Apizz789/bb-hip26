import { View } from '../../components/layout/View';
import { useEffect, useState } from 'react';
import { useLang } from '../../app/LanguageProvider';
import { useStore } from '../../app/StoreProvider';
import { useFeedback } from '../../app/FeedbackProvider';
import { navigate } from '../../app/router';
import { ScoreRing } from '../../components/charts/ScoreRing';
import { Icon } from '../../components/icons/Icon';
import { MockTag, PageHead } from '../../components/layout/Shell';
import { AnimatedNumber } from '../../components/charts/AnimatedNumber';
import { CATEGORY_BUDGET, CATEGORY_KEYS, CATEGORY_NOV, INSIGHTS, RECOMMENDATIONS, WELLNESS_FACTORS } from '../../data/mock';
import { computeScore, contribution } from '../../domain/wellness';
import { money } from '../../utils/format';

/** Financial Wellness: score and explanation, insights, spending vs budget, recommendations. */
export function WellnessPage({ active }: { active: boolean }) {
  const { t } = useLang();
  const { state, dispatch } = useStore();
  const { toast } = useFeedback();
  const score = computeScore(WELLNESS_FACTORS);
  const doneCount = state.recDone.filter(Boolean).length;
  const [openSpend, setOpenSpend] = useState<number | null>(null);
  const [barsReady, setBarsReady] = useState(false);

  useEffect(() => {
    if (!active) return;
    setBarsReady(false);
    const r = requestAnimationFrame(() => setBarsReady(true));
    return () => cancelAnimationFrame(r);
  }, [active]);

  return (
    <View route="wellness" labelledBy="wlTitle">
      <PageHead eyebrow={t('nav_wellness')} title={t('wl_title')} titleId="wlTitle" side={<MockTag />}>
        <p>{t('wl_sub')}</p>
      </PageHead>

      <div className="grid grid-2">
        <div className="card reveal" aria-labelledby="scoreTitle">
          <h2 id="scoreTitle">{t('wl_score')}</h2>
          <div className="ring-wrap" style={{ marginTop: 16 }}>
            <div className="ring" role="img" aria-labelledby="scoreTitle">
              <ScoreRing score={score} active={active} />
              <div className="center">
                <AnimatedNumber id="cScore" as="b" className="count" value={score} kind="int" duration={active ? 800 : 0} />
                <small>{t('wl_outof')}</small>
              </div>
            </div>
            <div className="score-text">
              <h3>{t('wl_level')}</h3>
              <p className="muted" style={{ fontSize: '.9rem', marginTop: 6 }}>{t('wl_level_d')}</p>
              <span className="pill green">{t('wl_level_tag')}</span>
            </div>
          </div>

          <details className="how">
            <summary>{t('wl_how_t')}</summary>
            <p className="muted small">{t('wl_how_d')}</p>
            <table className="factor-table">
              <thead><tr><th>{t('wl_factor')}</th><th>{t('wl_yours')}</th><th>{t('wl_weight')}</th><th>{t('wl_contrib')}</th></tr></thead>
              <tbody>
                {WELLNESS_FACTORS.map(f => (
                  <tr key={f.key}><td>{t(f.key)}</td><td className="num">{f.value}%</td><td className="num">{f.weight}%</td><td className="num">{contribution(f)}</td></tr>
                ))}
                <tr className="total"><td><b>{t('wl_total')}</b></td><td /><td /><td className="num"><b>{score}</b></td></tr>
              </tbody>
            </table>
          </details>

          <h3 style={{ marginTop: 24 }}>{t('wl_insights')}</h3>
          <div className="insights" id="insights">
            {INSIGHTS.map((x, i) => (
              <details key={x.t} className="insight" open={i === 0}>
                <summary>
                  <span style={{ display: 'flex', alignItems: 'center', gap: 10 }}><i className="tag-dot" style={{ background: x.color }} />{t(x.t)}</span>
                  <Icon name="i-right" className="ico chev" size={18} />
                </summary>
                <p className="body">{t(x.d)}</p>
                <div className="ins-act"><button className="btn text" type="button" onClick={() => navigate(x.go)}>{t(x.act)}</button></div>
              </details>
            ))}
          </div>
        </div>

        <div className="grid" style={{ gap: 18 }}>
          <div className="card reveal">
            <div className="card-head" style={{ marginBottom: 12 }}>
              <div><h2>{t('wl_spend')}</h2><p>{t('wl_spend_sub')}</p></div>
            </div>
            <div className="spend" id="spend">
              {CATEGORY_KEYS.map((k, i) => {
                const spent = CATEGORY_NOV[i];
                const budget = CATEGORY_BUDGET[i];
                const pct = Math.min(100, spent / budget * 100);
                const over = spent > budget;
                const diff = Math.abs(budget - spent);
                const open = openSpend === i;
                return (
                  <button key={k} className={'spend-row' + (open ? ' open' : '')} type="button" aria-expanded={open}
                    onClick={() => setOpenSpend(open ? null : i)}>
                    <div className="top"><span style={{ color: 'var(--ink)', fontWeight: 700 }}>{t(k)}</span><span>{money(spent)} / {money(budget)}</span></div>
                    <div className={'bar' + (over ? ' warn' : '')}><i style={{ width: barsReady ? pct + '%' : 0 }} /></div>
                    <div className={'detail' + (over ? ' over' : '')}>{over ? t('spend_over', { amt: money(diff) }) : t('spend_under', { amt: money(diff) })}</div>
                  </button>
                );
              })}
            </div>
          </div>

          <div className="card reveal progress-card">
            <div className="card-head" style={{ marginBottom: 6 }}>
              <h2>{t('wl_recs')}</h2>
              <span className="pill" id="recPill">{t('rec_count', { n: doneCount, total: state.recDone.length })}</span>
            </div>
            <div className="bar green"><i id="recBar" style={{ width: (doneCount / state.recDone.length * 100) + '%' }} /></div>
            <p className="muted" style={{ fontSize: '.85rem', marginTop: 6 }}>{t('wl_progress')}</p>
          </div>
        </div>
      </div>

      <div className="recs section-block" id="recs">
        {RECOMMENDATIONS.map((r, i) => {
          const done = state.recDone[i];
          return (
            <article key={r.t} className={'rec reveal' + (done ? ' done' : '')} style={{ ['--i' as string]: i }}>
              <span className="n">{i + 1}</span>
              <h3>{t(r.t)}</h3>
              <p>{t(r.d)}</p>
              <button className={'btn ' + (done ? 'ghost' : 'primary')} type="button" aria-pressed={done}
                onClick={() => { dispatch({ type: 'rec/toggle', index: i }); toast(t('toast_rec')); }}>
                {done ? t('rec_undo') : t('rec_mark')}
              </button>
              <button className="btn text" type="button" onClick={() => navigate(r.go)}>{t(r.act)}</button>
            </article>
          );
        })}
      </div>
      <p className="micro" style={{ textAlign: 'center', marginTop: 24 }}>{t('wl_note')}</p>
    </View>
  );
}
