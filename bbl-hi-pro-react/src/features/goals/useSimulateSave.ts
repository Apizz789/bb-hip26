import { useCallback } from 'react';
import { useLang } from '../../app/LanguageProvider';
import { useStore } from '../../app/StoreProvider';
import { useFeedback } from '../../app/FeedbackProvider';
import { applySimulatedSave } from '../../domain/goals';
import { money } from '../../utils/format';
import { goalName } from './goalText';

/** Adds simulated savings to a goal and shows the matching message. Nothing is transferred. */
export function useSimulateSave() {
  const { t } = useLang();
  const { state, dispatch } = useStore();
  const { toast } = useFeedback();

  return useCallback((id: string, amount: number) => {
    const g = state.goals.find(x => x.id === id);
    if (!g || g.saved >= g.target) return;
    const { goal, added } = applySimulatedSave(g, amount);
    dispatch({ type: 'goal/simulateSave', id, amount });
    if (goal.saved >= goal.target) toast(t('toast_goal_done', { name: goalName(goal, t) }));
    else toast(t('toast_goal_add', { amt: money(added) }));
  }, [state.goals, dispatch, toast, t]);
}
