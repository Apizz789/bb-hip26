import { createContext, useContext, type ReactNode } from 'react';
import type { Route } from '../../app/router';
import { SkeletonFor } from '../feedback/Skeleton';

export interface ViewState {
  /** The route currently shown. */
  route: Route;
  /** True while the active view shows its skeleton placeholder. */
  loading: boolean;
}

export const ViewStateContext = createContext<ViewState>({ route: 'home', loading: false });

interface ViewProps {
  route: Route;
  labelledBy: string;
  children: ReactNode;
}

/**
 * Page section. All views stay mounted (so form state survives navigation, as in the prototype);
 * only the active one is displayed. Skeleton placeholders render inside the active view while loading.
 */
export function View({ route, labelledBy, children }: ViewProps) {
  const current = useContext(ViewStateContext);
  const active = current.route === route;
  const loading = active && current.loading;
  const className = 'view' + (active ? ' active' : '') + (loading ? ' is-loading' : '');
  return (
    <section className={className} id={route} aria-labelledby={labelledBy}>
      {loading && <SkeletonFor route={route} />}
      {children}
    </section>
  );
}
