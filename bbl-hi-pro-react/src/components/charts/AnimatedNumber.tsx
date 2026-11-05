import { useEffect, useRef, useState } from 'react';
import { money, money2 } from '../../utils/format';
import { prefersReducedMotion } from '../../utils/storage';

export type NumberKind = 'money' | 'baht' | 'pct' | 'int';

export const formatNumber = (v: number, kind: NumberKind): string => {
  if (kind === 'money') return money2(v);
  if (kind === 'baht') return money(v);
  if (kind === 'pct') return Math.round(v) + '%';
  return Math.round(v).toLocaleString('en-US');
};

/**
 * Shows a number and animates from the previous value when it changes.
 * The first value appears immediately; reduced-motion users never see the tween.
 */
export function AnimatedNumber({ value, kind = 'int', duration = 800, className, id, as: Tag = 'strong' }: {
  value: number;
  /** Element to render; the prototype uses <b> for the score ring and <strong> elsewhere. */
  as?: 'b' | 'strong' | 'span';
  kind?: NumberKind;
  duration?: number;
  className?: string;
  id?: string;
}) {
  const [shown, setShown] = useState(value);
  const shownRef = useRef(value);

  useEffect(() => {
    const from = shownRef.current;
    if (prefersReducedMotion() || from === value || duration <= 0) {
      shownRef.current = value;
      setShown(value);
      return;
    }
    const start = performance.now();
    let frame = 0;
    const step = (now: number) => {
      const p = Math.min(1, (now - start) / duration);
      const eased = 1 - Math.pow(1 - p, 3);
      const current = from + (value - from) * eased;
      shownRef.current = current;
      setShown(current);
      if (p < 1) frame = requestAnimationFrame(step);
      else shownRef.current = value;
    };
    frame = requestAnimationFrame(step);
    return () => cancelAnimationFrame(frame);
  }, [value, duration]);

  return <Tag className={className} id={id}>{formatNumber(shown, kind)}</Tag>;
}
