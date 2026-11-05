import { View } from '../../components/layout/View';
import { useState } from 'react';
import { useLang } from '../../app/LanguageProvider';
import { useStore } from '../../app/StoreProvider';
import { AnimatedNumber } from '../../components/charts/AnimatedNumber';
import { MockTag, PageHead } from '../../components/layout/Shell';
import { TODAY } from '../../data/mock';
import { goalRatio, goalRemaining, goalStatus, suggestedMonthly, type Goal, type GoalStatus } from '../../domain/goals';
import { fmtDate, money } from '../../utils/format';
import { useSimulateSave } from './useSimulateSave';
import { useGoalBump } from './useGoalBump';
import { goalName } from './goalText';
import type { TranslationKey } from '../../i18n/dictionary';
import { GoalDialog } from './GoalDialog';

const ST_CLASS: Record<GoalStatus, string> = { done: 'st-done', ontrack: 'st-ontrack', behind: 'st-behind', overdue: 'st-overdue' };
const ST_KEY: Record<GoalStatus, TranslationKey> = {
  done: 'st_done', ontrack: 'st_ontrack', behind: 'st_behind', overdue: 'st_overdue',
};
const SIM_AMOUNTS = [100, 500, 1000] as const;
const DEFAULT_SIM = 500;

/** Financial Goals: summary, goal cards with simulated savings, and create/edit dialog. */
export function GoalsPage() {
  const { t, lang } = useLang();
  const { state } = useStore();
  const simulate = useSimulateSave();
  const [dialog, setDialog] = useState<Goal | 'new' | null>(null);

  const doneCount = state.goals.filter(g => goalStatus(g, TODAY) === 'done').length;
  const totalSaved = state.goals.reduce((sum, g) => sum + g.saved, 0);

  return (
    <View route="goals" labelledBy="goalsTitle">
      <PageHead title={t('goals_title')} titleId="goalsTitle" side={
        <div className="head-actions">
          <MockTag />
          <button className="btn primary" type="button" id="goalNew" onClick={() => setDialog('new')}>{t('goals_new')}</button>
        </div>
      }>
        <p>{t('goals_sub')}</p>
      </PageHead>

      <div className="kpis goal-kpis reveal">
        <div className="card kpi"><span>{t('goals_total')}</span><strong className="count" id="gkCount"><AnimatedNumber value={state.goals.length} kind="int" /></strong></div>
        <div className="card kpi"><span>{t('goals_saved')}</span><strong className="count" id="gkSaved"><AnimatedNumber value={totalSaved} kind="baht" /></strong></div>
        <div className="card kpi"><span>{t('goals_done')}</span><strong className="count" id="gkDone"><AnimatedNumber value={doneCount} kind="int" /></strong></div>
      </div>

      {state.goals.length > 0 ? (
        <div className="goal-grid" id="goalList">
          {state.goals.map(g => (
            <GoalCard key={g.id} goal={g} lang={lang} onEdit={() => setDialog(g)} onSimulate={amount => simulate(g.id, amount)} />
          ))}
        </div>
      ) : (
        <div className="empty" id="goalEmpty">
          <p>{t('goals_empty')}</p>
          <button className="btn ghost" type="button" id="goalNew2" style={{ marginTop: 14 }} onClick={() => setDialog('new')}>{t('goals_new')}</button>
        </div>
      )}
      <p className="micro" style={{ marginTop: 20 }}>{t('goals_note')}</p>

      {dialog && <GoalDialog goal={dialog === 'new' ? null : dialog} onClose={() => setDialog(null)} />}
    </View>
  );
}

interface GoalCardProps {
  goal: Goal;
  lang: 'th' | 'en';
  onEdit: () => void;
  onSimulate: (amount: number) => void;
}

function GoalCard({ goal: g, lang, onEdit, onSimulate }: GoalCardProps) {
  const { t } = useLang();
  const [amount, setAmount] = useState<number>(DEFAULT_SIM);
  const st = goalStatus(g, TODAY);
  const isDone = st === 'done';
  const pct = Math.round(goalRatio(g) * 100);
  const remain = goalRemaining(g);
  const name = goalName(g, t);
  const cardRef = useGoalBump(g.id);

  return (
    <article className="card lift goal-item reveal" ref={cardRef}>
      <header className="gi-head">
        <div>
          <h2 className="gi-name" id={`gn-${g.id}`}>{name}</h2>
          <p className="muted small">{t('goal_deadline', { date: fmtDate(g.date, lang) })}</p>
        </div>
        <span className={'pill ' + ST_CLASS[st]}>{t(ST_KEY[st])}</span>
      </header>
      <div className="gi-figs">
        <strong className="gi-saved num">{money(g.saved)}</strong>
        <span className="muted">/ {money(g.target)}</span>
      </div>
      <div className={'bar' + (isDone ? ' green' : '')} role="progressbar" aria-labelledby={`gn-${g.id}`}
        aria-valuemin={0} aria-valuemax={100} aria-valuenow={pct}>
        <i style={{ width: pct + '%' }} />
      </div>
      <p className="small muted">
        {t('goal_pct', { p: pct })} · {isDone ? t('goal_suggest_done') : t('goal_left', { amt: money(remain) })}
      </p>
      {!isDone && st !== 'overdue' && (
        <p className="small">{t('goal_suggest', { amt: money(suggestedMonthly(g, TODAY)) })}</p>
      )}
      <div className="gi-actions">
        <select className="select sel-sm" aria-label={t('goal_sim_amt')} value={amount} disabled={isDone}
          onChange={e => setAmount(Number(e.target.value))}>
          {SIM_AMOUNTS.map(a => <option key={a} value={a}>{money(a)}</option>)}
        </select>
        <button className="btn ghost" type="button" disabled={isDone} onClick={() => onSimulate(amount)}>{t('goal_sim')}</button>
        <button className="btn text" type="button" onClick={onEdit}>{t('goal_edit')}</button>
      </div>
    </article>
  );
}
