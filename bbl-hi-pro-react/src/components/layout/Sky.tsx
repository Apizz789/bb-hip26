import { useEffect, useState } from 'react';

type TimeOfDay = 'day' | 'dusk' | 'night';

/** Local-time phase: day 06:00–15:59, dusk 16:00–18:59, night otherwise. */
export function timeOfDay(hour: number): TimeOfDay {
  if (hour >= 6 && hour < 16) return 'day';
  if (hour >= 16 && hour < 19) return 'dusk';
  return 'night';
}

// Fixed star positions so the scene is identical on every render.
const STARS = Array.from({ length: 18 }, (_, i) => ({ x: ((i * 271) % 1400) + 20, y: ((i * 89) % 200) + 12, r: i % 3 === 0 ? 1.6 : 1 }));

/** Calm backdrop behind every page: a light sky that follows the local time (sun, dusk or moon with stars). Decorative only. */
export function SkyBackground() {
  const [tod, setTod] = useState<TimeOfDay>(() => timeOfDay(new Date().getHours()));
  useEffect(() => {
    const id = window.setInterval(() => setTod(timeOfDay(new Date().getHours())), 60_000);
    return () => window.clearInterval(id);
  }, []);
  return (
    <div className={'sky sky-' + tod} aria-hidden="true">
      <svg viewBox="0 0 1440 420" preserveAspectRatio="xMidYMin slice" focusable="false">
        <defs>
          <linearGradient id="skyGrad" x1="0" y1="0" x2="0" y2="1">
            <stop className="sky-top" offset="0" />
            <stop className="sky-bottom" offset="1" />
          </linearGradient>
        </defs>
        <rect width="1440" height="420" fill="url(#skyGrad)" />
        {tod === 'night' && <g className="sky-stars">{STARS.map((s, i) => <circle key={i} cx={s.x} cy={s.y} r={s.r} />)}</g>}
        {tod === 'night'
          ? <circle className="sky-moon" cx="1190" cy="120" r="34" />
          : <circle className="sky-sun" cx="1190" cy="120" r="46" />}
      </svg>
    </div>
  );
}
