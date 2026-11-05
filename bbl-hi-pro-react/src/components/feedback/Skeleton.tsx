import type { ReactNode } from 'react';
import type { Route } from '../../app/router';

const sk = (cls: string, n = 1) => Array.from({ length: n }, (_, i) => <div key={i} className={`skel ${cls}`} />);

/** Placeholder layout per page, shown briefly when the page is opened. */
export function SkeletonFor({ route }: { route: Route }) {
  const wrap = (children: ReactNode) => <div className="skel-wrap" aria-hidden="true">{children}</div>;
  switch (route) {
    case 'home':
      return wrap(<>{sk('h')}{sk('s')}<div className="skel-row k4">{sk('kpi', 4)}</div><div className="skel-row c2">{sk('tall')}{sk('card')}</div></>);
    case 'goals':
      return wrap(<>{sk('h')}{sk('s')}<div className="skel-row k3">{sk('kpi', 3)}</div><div className="skel-row c2">{sk('card', 2)}</div></>);
    case 'wellness':
      return wrap(<>{sk('h')}{sk('s')}<div className="skel-row c2">{sk('tall')}{sk('card')}</div>{sk('card')}</>);
    case 'svc-overview':
      return wrap(<>{sk('h')}{sk('s')}<div className="skel-row k4">{sk('kpi', 4)}</div>{sk('tall')}</>);
    case 'svc-tracking':
      return wrap(<>{sk('h')}{sk('s')}<div className="skel-row" style={{ gridAutoFlow: 'column' }}>{sk('chip', 3)}</div>{sk('row', 3)}</>);
    default:
      return null;
  }
}
