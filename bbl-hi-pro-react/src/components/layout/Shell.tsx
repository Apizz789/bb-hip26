import { useEffect, useRef, useState, type ReactNode } from 'react';
import { BrandMark, Icon } from '../icons/Icon';
import { useLang } from '../../app/LanguageProvider';
import { navigate, navParent, type Route } from '../../app/router';
import { useStore } from '../../app/StoreProvider';
import { resumeRequest } from '../../store/appState';
import { prefersReducedMotion } from '../../utils/storage';
import type { MockNotification } from '../../data/mock';
import type { TranslationKey } from '../../i18n/dictionary';

const NOTIF_KEYS: Record<MockNotification['key'], { title: TranslationKey; body: TranslationKey }> = {
  n1: { title: 'n1_t', body: 'n1_b' },
  n2: { title: 'n2_t', body: 'n2_b' },
  n3: { title: 'n3_t', body: 'n3_b' },
};

const NAV_MAIN: { route: Route; key: 'nav_home' | 'nav_services' | 'nav_wellness' | 'nav_goals' }[] = [
  { route: 'home', key: 'nav_home' },
  { route: 'services', key: 'nav_services' },
  { route: 'wellness', key: 'nav_wellness' },
  { route: 'goals', key: 'nav_goals' },
];

const NAV_MOBILE: { route: Route; key: 'nav_home_s' | 'nav_services' | 'nav_goals_s' | 'nav_wellness_s' | 'nav_playground_s'; icon: string }[] = [
  { route: 'home', key: 'nav_home_s', icon: 'i-home' },
  { route: 'services', key: 'nav_services', icon: 'i-grid' },
  { route: 'goals', key: 'nav_goals_s', icon: 'i-chart' },
  { route: 'wellness', key: 'nav_wellness_s', icon: 'i-heart' },
  { route: 'playground', key: 'nav_playground_s', icon: 'i-layers' },
];

export function SkipLink() {
  const { t } = useLang();
  return (
    <button className="skip" id="skipBtn" type="button" onClick={() => {
      // While a skeleton is showing, the heading is hidden: focus the always-focusable main instead.
      // Route focus then moves to the heading when the page is ready.
      const view = document.querySelector<HTMLElement>('.view.active');
      const heading = view && !view.classList.contains('is-loading') ? view.querySelector<HTMLElement>('h1') : null;
      (heading ?? document.getElementById('app'))?.focus();
    }}>{t('skip')}</button>
  );
}

/** Thin progress line shown briefly on each navigation (suppressed for reduced motion). */
export function NavProgress({ route }: { route: Route }) {
  const [run, setRun] = useState(false);
  const first = useRef(true);
  useEffect(() => {
    if (first.current) { first.current = false; return; }
    if (prefersReducedMotion()) return;
    setRun(false);
    const r = requestAnimationFrame(() => setRun(true));
    const timer = window.setTimeout(() => setRun(false), 1000);
    return () => { cancelAnimationFrame(r); window.clearTimeout(timer); };
  }, [route]);
  return <div className={'progress' + (run ? ' run' : '')} id="progress" aria-hidden="true" />;
}

function Notifications() {
  const { t } = useLang();
  const { state, dispatch } = useStore();
  const [open, setOpen] = useState(false);
  const wrap = useRef<HTMLDivElement>(null);
  const unread = state.notifications.filter(n => !n.read).length;

  useEffect(() => {
    if (!open) return;
    const onDown = (e: MouseEvent) => { if (!wrap.current?.contains(e.target as Node)) setOpen(false); };
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') setOpen(false); };
    document.addEventListener('mousedown', onDown);
    document.addEventListener('keydown', onKey);
    return () => { document.removeEventListener('mousedown', onDown); document.removeEventListener('keydown', onKey); };
  }, [open]);

  return (
    <div className="notif" ref={wrap}>
      <button className="icon-btn" id="bellBtn" type="button" aria-haspopup="true" aria-expanded={open}
        aria-label={t('notif_title')} onClick={() => setOpen(o => !o)}>
        <Icon name="i-bell" />
        <span className={'dot' + (unread === 0 ? ' off' : '')} id="bellDot" />
      </button>
      <div className="notif-panel" id="notifPanel" hidden={!open}>
        <div className="notif-head">
          <b>{t('notif_title')}</b>
          <button className="link-btn" id="markRead" type="button" onClick={() => dispatch({ type: 'notif/readAll' })}>{t('notif_markall')}</button>
        </div>
        <ul className="notif-list" id="notifList">
          {state.notifications.map(n => {
            const read = () => dispatch({ type: 'notif/read', key: n.key });
            return (
              <li key={n.key} className={'notif-item' + (n.read ? ' read' : '')} data-notif={n.key} tabIndex={0} role="button"
                onClick={read}
                onKeyDown={e => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); read(); } }}>
                <i className="u" />
                <div><b>{t(NOTIF_KEYS[n.key].title)}</b><span>{t(NOTIF_KEYS[n.key].body)}</span></div>
              </li>
            );
          })}
        </ul>
      </div>
    </div>
  );
}

function LanguageSwitch() {
  const { t, lang, setLang } = useLang();
  return (
    <div className="lang" role="group" aria-label={t('aria_lang')}>
      <button className="lang-btn" type="button" data-lang="th" aria-pressed={lang === 'th'} onClick={() => setLang('th')}>🇹🇭 TH</button>
      <button className="lang-btn" type="button" data-lang="en" aria-pressed={lang === 'en'} onClick={() => setLang('en')}>🇬🇧 EN</button>
    </div>
  );
}

export function AppHeader({ route }: { route: Route }) {
  const { t } = useLang();
  const parent = navParent(route);
  return (
    <header className="app-header">
      <div className="container header-inner">
        <a className="wordmark" href="#home" aria-label="BBL HI PRO">
          <BrandMark className="bm" />
          <span className="wm-text">
            <span className="wm-name">BBL HI PRO</span>
            <span className="wm-sub">{t('brand_sub')}</span>
          </span>
        </a>

        <nav className="main-nav" aria-label="Main">
          {NAV_MAIN.map(item => (
            <a key={item.route} href={'#' + item.route} data-nav={item.route}
              className={parent === item.route ? 'active' : undefined}
              aria-current={parent === item.route ? 'page' : undefined}>{t(item.key)}</a>
          ))}
          <a href="#playground" data-nav="playground" className={parent === 'playground' ? 'active' : undefined}>
            <span>{t('nav_playground')}</span>
          </a>
        </nav>

        <div className="header-tools">
          <a className={'tool-link' + (parent === 'contact' ? ' active' : '')} href="#contact" data-nav="contact"
            aria-current={parent === 'contact' ? 'page' : undefined}>{t('nav_contact')}</a>
          <LanguageSwitch />
          <Notifications />
        </div>
      </div>
    </header>
  );
}

export function BottomNav({ route }: { route: Route }) {
  const { t } = useLang();
  const parent = navParent(route);
  return (
    <nav className="bottom-nav" aria-label="Mobile">
      {NAV_MOBILE.map(item => (
        <a key={item.route} href={'#' + item.route} data-nav={item.route}
          className={parent === item.route ? 'active' : undefined}
          aria-current={parent === item.route ? 'page' : undefined}>
          <Icon name={item.icon} />
          <span>{t(item.key)}</span>
        </a>
      ))}
    </nav>
  );
}

export function SiteFooter() {
  const { t } = useLang();
  return (
    <footer className="site-foot">
      <span className="foot-brand"><BrandMark className="bm-s" /><b>BBL HI PRO</b></span>
      <span>{t('footer_mock')}</span>
      <nav aria-label="Footer">
        <a href="#brand">{t('footer_brand')}</a>
        <a href="#contact">{t('nav_contact')}</a>
      </nav>
    </footer>
  );
}

/** Opening screen: shown once on first load, then fades out. */
export function Splash() {
  const { t } = useLang();
  const [phase, setPhase] = useState<'show' | 'done' | 'gone'>('show');
  useEffect(() => {
    const reduce = prefersReducedMotion();
    const a = window.setTimeout(() => setPhase('done'), reduce ? 300 : 1000);
    const b = window.setTimeout(() => setPhase('gone'), (reduce ? 300 : 1000) + 500);
    return () => { window.clearTimeout(a); window.clearTimeout(b); };
  }, []);
  if (phase === 'gone') return null;
  return (
    <div className={'splash' + (phase === 'done' ? ' done' : '')} id="splash" role="status" aria-live="polite">
      <div className="splash-in">
        <BrandMark className="splash-mark" />
        <p className="splash-name">BBL HI PRO</p>
        <p className="splash-msg">{t('splash_msg')}</p>
        <div className="splash-bar" aria-hidden="true"><i /></div>
      </div>
    </div>
  );
}

/** Shared layout for every page header: eyebrow, title, subtitle, optional side content. */
export function PageHead({ eyebrow, title, titleId, children, side, className = 'page-head reveal' }: {
  eyebrow?: ReactNode;
  title: ReactNode;
  titleId: string;
  children?: ReactNode;
  side?: ReactNode;
  className?: string;
}) {
  return (
    <div className={className}>
      <div>
        {eyebrow && <p className="eyebrow">{eyebrow}</p>}
        <h1 id={titleId} tabIndex={-1}>{title}</h1>
        {children}
      </div>
      {side}
    </div>
  );
}

export function BackButton({ to = 'services' }: { to?: Route }) {
  const { t } = useLang();
  return (
    <button className="back" type="button" onClick={() => navigate(to)}>
      <Icon name="i-back" /><span>{t('back')}</span>
    </button>
  );
}

export function MockTag({ children }: { children?: ReactNode }) {
  const { t } = useLang();
  return <span className="mock-tag">{children ?? t('mock_label')}</span>;
}

/** Derived resume information for the home "continue" card. */
export function useResume() {
  const { state } = useStore();
  return resumeRequest(state);
}

