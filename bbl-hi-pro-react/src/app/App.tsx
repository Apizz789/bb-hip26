import { useEffect, useRef, useState, type RefObject } from 'react';
import { SKELETON_ROUTES, useRoute, type Route } from './router';
import { SpriteSheet } from '../components/icons/Icon';
import { Toast } from '../components/feedback/Toast';
import { AppHeader, BottomNav, NavProgress, SiteFooter, SkipLink, Splash } from '../components/layout/Shell';
import { SkyBackground } from '../components/layout/Sky';
import { ViewStateContext } from '../components/layout/View';
import { HomePage } from '../features/home/HomePage';
import { ServicesPage } from '../features/services/ServicesPage';
import { DocumentRequestPage } from '../features/document-request/DocumentRequestPage';
import { AppointmentPage } from '../features/appointments/AppointmentPage';
import { TrackingPage } from '../features/tracking/TrackingPage';
import { OverviewPage } from '../features/services/OverviewPage';
import { WellnessPage } from '../features/wellness/WellnessPage';
import { GoalsPage } from '../features/goals/GoalsPage';
import { PlaygroundPage } from '../features/playground/PlaygroundPage';
import { ContactPage } from '../features/contact/ContactPage';
import { BrandPage } from '../features/brand/BrandPage';
import { prefersReducedMotion } from '../utils/storage';

const SKELETON_MS = 420;
const SKELETON_MS_REDUCED = 150;

/**
 * True while the skeleton of the current navigation is showing. Derived in the same render as the route change,
 * so the first commit of a skeleton route already hides the real content. The timer only records when it ends.
 */
function useRouteLoading(route: Route, navId: number): boolean {
  const [doneNav, setDoneNav] = useState<number | null>(null);
  const skeleton = SKELETON_ROUTES.includes(route);
  useEffect(() => {
    if (!skeleton) return;
    const id = window.setTimeout(() => setDoneNav(navId), prefersReducedMotion() ? SKELETON_MS_REDUCED : SKELETON_MS);
    return () => window.clearTimeout(id);
  }, [navId, skeleton]);
  return skeleton && doneNav !== navId;
}

/**
 * Moves focus to the new page heading once the page is ready (after any skeleton), and scrolls to top.
 * Skipped on first load. If the user has already focused a control inside the new view, focus is left alone.
 */
function useRouteFocus(navId: number, loading: boolean, mainRef: RefObject<HTMLElement | null>) {
  const handled = useRef<number | null>(null);
  useEffect(() => {
    if (loading) return;
    if (handled.current === null) { handled.current = navId; return; } // first load
    if (handled.current === navId) return;
    handled.current = navId;
    window.scrollTo({ top: 0, behavior: prefersReducedMotion() ? 'auto' : 'smooth' });
    const heading = mainRef.current?.querySelector<HTMLElement>('.view.active h1');
    if (!heading) return;
    const current = document.activeElement;
    if (current && current !== heading && current.closest('.view.active')) return;
    heading.focus({ preventScroll: true });
  }, [navId, loading, mainRef]);
}

/** Stagger .reveal items in the active view. */
function useRevealStagger(route: Route, loading: boolean, mainRef: RefObject<HTMLElement | null>) {
  useEffect(() => {
    const view = mainRef.current?.querySelector<HTMLElement>('.view.active');
    if (!view) return;
    view.querySelectorAll<HTMLElement>('.reveal').forEach((el, i) => {
      if (!el.style.getPropertyValue('--i')) el.style.setProperty('--i', String(Math.min(i, 8)));
    });
  }, [route, loading, mainRef]);
}

/** Root application shell: header, routed views (all kept mounted), footer and mobile navigation. */
export function App() {
  const { route, navId } = useRoute();
  const loading = useRouteLoading(route, navId);
  const mainRef = useRef<HTMLElement>(null);
  useRouteFocus(navId, loading, mainRef);
  useRevealStagger(route, loading, mainRef);

  return (
    <>
      <SpriteSheet />
      <Splash />
      <SkyBackground />
      <SkipLink />
      <NavProgress route={route} />
      <AppHeader route={route} />
      <ViewStateContext.Provider value={{ route, loading }}>
        <main className="container" id="app" ref={mainRef} tabIndex={-1}>
          <HomePage active={route === 'home'} />
          <ServicesPage />
          <DocumentRequestPage />
          <AppointmentPage />
          <TrackingPage />
          <OverviewPage />
          <WellnessPage active={route === 'wellness'} />
          <GoalsPage />
          <PlaygroundPage />
          <ContactPage />
          <BrandPage />
        </main>
        <SiteFooter />
      </ViewStateContext.Provider>
      <BottomNav route={route} />
      <Toast />
    </>
  );
}

