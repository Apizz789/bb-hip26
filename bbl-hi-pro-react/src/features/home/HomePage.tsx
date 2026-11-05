import type { TranslationKey } from '../../i18n/dictionary';
import { View } from '../../components/layout/View';
import { useState } from 'react';
import { useLang } from '../../app/LanguageProvider';
import { useStore } from '../../app/StoreProvider';
import { navigate, type Route } from '../../app/router';
import { AnimatedNumber } from '../../components/charts/AnimatedNumber';
import { CashFlowChart } from '../../components/charts/CashFlowChart';
import { Icon } from '../../components/icons/Icon';
import { goalRatio, goalRemaining } from '../../domain/goals';
import { STEP_KEYS } from '../../domain/requests';
import { FLOW } from '../../data/mock';
import { resumeRequest } from '../../store/appState';
import { money, money2, fmtDate } from '../../utils/format';
import { goalName } from '../goals/goalText';
import { useSimulateSave } from '../goals/useSimulateSave';
import { useGoalBump } from '../goals/useGoalBump';
import { RequestDialog } from '../tracking/RequestDialog';
import { requestMeta } from '../tracking/requestText';

/** Home: balance, continue card, KPIs, cash flow, goal summary, quick actions, activity. */
type DayPeriod = 'morning' | 'afternoon' | 'evening';
const GREET_KEY: Record<DayPeriod, TranslationKey> = {
  morning: 'greet_morning', afternoon: 'greet_afternoon', evening: 'greet_evening',
};

export function HomePage({ active }: { active: boolean }) {
  const { t, lang } = useLang();
  const { state, dispatch } = useStore();
  const simulate = useSimulateSave();
  const [openRequestId, setOpenRequestId] = useState<string | null>(null);

  const hour = new Date().getHours();
  const period: DayPeriod = hour < 12 ? 'morning' : hour < 17 ? 'afternoon' : 'evening';
  const resume = resumeRequest(state);
  const goal = state.goals[0];
  const goalCardRef = useGoalBump(goal.id);
  const remain = goalRemaining(goal);
  const pct = goalRatio(goal) * 100;

  return (
    <View route="home" labelledBy="homeTitle">
      <div className="hero reveal">
        <svg className="hero-arcs" viewBox="0 0 400 400" aria-hidden="true">
          <g fill="none" stroke="#fff" strokeWidth="1">
            <circle cx="200" cy="200" r="60" /><circle cx="200" cy="200" r="100" />
            <circle cx="200" cy="200" r="140" /><circle cx="200" cy="200" r="180" />
          </g>
        </svg>
        <div>
          <p className="eyebrow" id="greet">{t(GREET_KEY[period])}</p>
          <h1 id="homeTitle" tabIndex={-1}>{t('hello_name')}</h1>
          <p className="hero-sub">{t('home_sub')}</p>
          <p className="hero-intro">{t('home_intro')}</p>
        </div>
        <div className="hero-balance">
          <span className="label">{t('home_balance')}</span>
          <AnimatedNumber id="cBalance" className="count" value={152430.5} kind="money" />
          <span className="note">{t('home_balance_note')}</span>
        </div>
      </div>

      <section className="resume card reveal" aria-labelledby="resumeEyebrow">
        <div>
          <span className="eyebrow" id="resumeEyebrow">{t('resume_t')}</span>
          <p className="resume-title" id="resumeTitle">{resume ? t(resume.titleKey) : t('resume_none')}</p>
          <p className="muted" id="resumeMeta">
            {resume ? `${t(STEP_KEYS[resume.type][resume.step])} · ${requestMeta(resume, t, lang)}` : t('resume_none_d')}
          </p>
        </div>
        <button className="btn primary" id="resumeBtn" type="button"
          onClick={() => (resume ? setOpenRequestId(resume.id) : navigate('svc-documents'))}>
          {resume ? t('resume_cta') : t('resume_new')}
        </button>
      </section>

      <div className="kpis reveal">
        <div className="card kpi lift"><span>{t('home_income')}</span><AnimatedNumber className="count" id="cIncome" value={45000} kind="money" /><em className="up">{t('home_income_note')}</em></div>
        <div className="card kpi lift"><span>{t('home_expenses')}</span><AnimatedNumber className="count" id="cExpense" value={28760} kind="money" /><em className="down">{t('home_expense_note')}</em></div>
        <div className="card kpi lift"><span>{t('home_net')}</span><AnimatedNumber className="count" id="cNet" value={16240} kind="money" /><em>{t('home_net_note')}</em></div>
        <div className="card kpi lift"><span>{t('home_rate')}</span><AnimatedNumber className="count" id="cRate" value={36} kind="pct" /><em>{t('home_rate_note')}</em></div>
      </div>

      <div className="grid grid-2 home-grid">
        <article className="card reveal" aria-labelledby="chartTitle">
          <div className="card-head">
            <div>
              <h2 id="chartTitle">{t('home_cashflow')}</h2>
              <p>{t('home_cashflow_sub')}</p>
            </div>
            <div className="seg" role="group" aria-label="Range">
              <button type="button" data-range="6" aria-pressed={state.range === 6} onClick={() => dispatch({ type: 'range/set', range: 6 })}>{t('period_6m')}</button>
              <button type="button" data-range="12" aria-pressed={state.range === 12} onClick={() => dispatch({ type: 'range/set', range: 12 })}>{t('period_12m')}</button>
            </div>
          </div>
          <div className="legend">
            <span className="lbl"><i className="sw inc" /><span>{t('legend_income')}</span></span>
            <span className="lbl"><i className="sw exp" /><span>{t('legend_expenses')}</span></span>
            <span className="mock-tag" style={{ marginLeft: 'auto' }}>{t('mock_label')}</span>
          </div>
          <CashFlowChart flow={FLOW} months={state.range} active={active} />
        </article>

        <article className="card reveal goal-card" aria-labelledby="goalTitle" ref={goalCardRef}>
          <div className="goal-title">
            <h2 id="goalTitle">{goalName(goal, t)}</h2>
            <span className="pill blue">{t('home_goal_tag')}</span>
          </div>
          <div className="goal-figs">
            <AnimatedNumber className="count" id="cGoal" value={goal.saved} kind="baht" />
            <span className="goal-target" id="goalTarget">{'/ ' + money(goal.target)}</span>
          </div>
          <div className="bar" role="progressbar" aria-labelledby="goalTitle" aria-valuemin={0} aria-valuemax={goal.target} aria-valuenow={goal.saved}>
            <i id="goalBar" style={{ width: pct + '%' }} />
          </div>
          <p id="goalRemain" style={{ marginTop: 12 }}>
            {remain > 0 ? t('goal_remain', { amt: money(remain) }) : t('goal_done')}
          </p>
          <button className="btn primary full" id="goalAdd" type="button" disabled={remain === 0}
            onClick={() => simulate(goal.id, 500)}>{t('goal_add')}</button>
          <button className="btn text" type="button" onClick={() => navigate('goals')} style={{ marginTop: 8 }}>{t('goals_all')}</button>
          <p className="micro">{t('sim_note')}</p>
        </article>
      </div>

      <section className="section-block reveal" aria-labelledby="quickTitle">
        <h2 id="quickTitle">{t('home_quick')}</h2>
        <div className="quick-grid">
          <QuickAction to="svc-documents" icon="i-doc" label={t('quick_docs')} />
          <QuickAction to="svc-appointment" icon="i-cal" label={t('quick_appt')} />
          <QuickAction to="svc-tracking" icon="i-track" label={t('quick_track')} />
          <QuickAction to="wellness" icon="i-heart" label={t('quick_wellness')} />
        </div>
      </section>

      <section className="section-block reveal" aria-labelledby="actTitle">
        <h2 id="actTitle">{t('home_activity')}</h2>
        <ul className="activity" id="activity">
          {state.activity.map((a, i) => (
            <li key={i}>
              <div><b>{t(a.k)}</b><div className="when">{fmtDate(a.date, lang)}</div></div>
              <span className={'amt num' + (a.sign === '+' ? ' in' : '')}>{a.sign}{money2(a.amt)}</span>
            </li>
          ))}
        </ul>
      </section>

      {openRequestId && <RequestDialog requestId={openRequestId} onClose={() => setOpenRequestId(null)} />}
    </View>
  );
}

function QuickAction({ to, icon, label }: { to: Route; icon: string; label: string }) {
  return (
    <button className="quick" type="button" onClick={() => navigate(to)}>
      <span className="qi"><Icon name={icon} /></span>
      <span>{label}</span>
    </button>
  );
}
