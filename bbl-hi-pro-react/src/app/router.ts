// Hash-based routing (no server needed). Route ids match the prototype's section ids.
import { useEffect, useState } from 'react';

export const ROUTES = [
  'home', 'services', 'svc-documents', 'svc-appointment', 'svc-tracking', 'svc-overview',
  'wellness', 'goals', 'playground', 'contact', 'brand',
] as const;
export type Route = (typeof ROUTES)[number];

/** Pages that show a short skeleton when first opened from another page. */
export const SKELETON_ROUTES: readonly Route[] = ['home', 'goals', 'wellness', 'svc-overview', 'svc-tracking'];

export const isRoute = (value: string): value is Route => (ROUTES as readonly string[]).includes(value);

export function routeFromHash(hash: string): Route {
  const h = hash.replace(/^#\/?/, '');
  return isRoute(h) ? h : 'home';
}

/** Parent item in the navigation (sub-pages of Services highlight "services"). */
export const navParent = (route: Route): string => (route.startsWith('svc-') ? 'services' : route);

export function navigate(route: Route): void {
  if (location.hash !== '#' + route) location.hash = '#' + route;
}

export interface RouteState {
  route: Route;
  /** Increases on every route change (not on same-route hash edits). Lets loading state be derived in the same render. */
  navId: number;
}

export function useRoute(): RouteState {
  const [state, setState] = useState<RouteState>(() => ({ route: routeFromHash(location.hash), navId: 0 }));
  useEffect(() => {
    const onChange = () => setState((prev: RouteState) => {
      const route = routeFromHash(location.hash);
      return route === prev.route ? prev : { route, navId: prev.navId + 1 };
    });
    window.addEventListener('hashchange', onChange);
    return () => window.removeEventListener('hashchange', onChange);
  }, []);
  return state;
}
