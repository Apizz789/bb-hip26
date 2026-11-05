import { useEffect, useRef } from 'react';
import { useStore } from '../../app/StoreProvider';

/**
 * Replays the prototype's goal highlight (`.bump`) on the element returned, after a simulated save for `goalId`.
 * The class is restarted with a reflow so repeated saves animate again. Reduced motion is handled in CSS
 * (the animation duration is set to ~0), so the class is still applied but nothing visibly moves.
 */
export function useGoalBump(goalId: string) {
  const { state } = useStore();
  const ref = useRef<HTMLElement>(null);
  const seq = state.lastSimulated?.id === goalId ? state.lastSimulated.seq : 0;
  // Only bump for saves that happen while this card is mounted, not for an existing save on mount.
  const seen = useRef(seq);

  useEffect(() => {
    if (seq === seen.current) return;
    seen.current = seq;
    const el = ref.current;
    if (!el || seq === 0) return;
    el.classList.remove('bump');
    void el.offsetWidth;
    el.classList.add('bump');
  }, [seq]);

  return ref;
}
