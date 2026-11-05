import { useEffect, useState } from 'react';
import { prefersReducedMotion } from '../../utils/storage';

const RADIUS = 66;
const CIRCUMFERENCE = 2 * Math.PI * RADIUS;

/** Circular score gauge (0–100). Animates when `active` becomes true. */
export function ScoreRing({ score, active }: { score: number; active: boolean }) {
  const target = CIRCUMFERENCE * (1 - score / 100);
  const [offset, setOffset] = useState(CIRCUMFERENCE);

  useEffect(() => {
    if (!active) return;
    if (prefersReducedMotion()) { setOffset(target); return; }
    setOffset(CIRCUMFERENCE);
    const r = requestAnimationFrame(() => setOffset(target));
    return () => cancelAnimationFrame(r);
  }, [active, target]);

  return (
    <svg viewBox="0 0 164 164" aria-hidden="true">
      <circle className="track" cx="82" cy="82" r={RADIUS} />
      <circle className="val" id="ringVal" cx="82" cy="82" r={RADIUS}
        strokeDasharray={CIRCUMFERENCE.toFixed(1)} strokeDashoffset={offset.toFixed(1)} />
    </svg>
  );
}
