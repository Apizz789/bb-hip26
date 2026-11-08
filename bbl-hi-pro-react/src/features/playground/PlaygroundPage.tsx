import { useEffect, useRef, type SyntheticEvent } from 'react';
import { View } from '../../components/layout/View';
import { useLang } from '../../app/LanguageProvider';

/** Same-origin zoo document: it never shows a scrollbar of its own. Its height comes from the frame. */
const BASE_CSS = 'html,body{margin:0!important;overflow:hidden!important}';

/** Visible space under the page heading and above the footer, in px. Matches the frame's CSS. */
function frameArea(): number {
  const mobile = window.matchMedia('(max-width:959px)').matches;
  const pageTop = parseFloat(getComputedStyle(document.getElementById('app') ?? document.body).paddingTop) || 0;
  return Math.max(window.innerHeight - (mobile ? 380 : 330) - pageTop, 520 - pageTop);
}

/**
 * The stage keeps the size it had inside the frame (64% of the visible space, 340–680px).
 * It no longer depends on the frame's own height, so the frame can grow to the zoo's full content.
 */
function stageCss(area: number): string {
  const h = Math.min(680, Math.max(340, Math.round(area * 0.64)));
  return `.stage:not(.fs){height:${h}px!important}`;
}

type Detach = () => void;

/** Once the zoo has loaded: apply the embed styles, size the frame to the zoo's full content, and keep it in step. */
function attachFrame(frame: HTMLIFrameElement): Detach {
  try {
    const doc = frame.contentDocument;
    const win = frame.contentWindow;
    if (!doc || !win) return () => {};
    let styleEl = doc.getElementById('embed-fit') as HTMLStyleElement | null;
    if (!styleEl) {
      styleEl = doc.createElement('style');
      styleEl.id = 'embed-fit';
      doc.head.appendChild(styleEl);
    }
    const style = styleEl;
    const fit = () => {
      style.textContent = BASE_CSS + stageCss(frameArea());
      frame.style.setProperty('--zoo-content', `${doc.documentElement.scrollHeight}px`);
    };
    let raf = 0;
    const schedule = () => {
      cancelAnimationFrame(raf);
      raf = requestAnimationFrame(fit);
    };
    fit();
    const RO = (win as unknown as { ResizeObserver: typeof ResizeObserver }).ResizeObserver;
    const ro = new RO(schedule);
    ro.observe(doc.body);
    window.addEventListener('resize', schedule);
    return () => {
      cancelAnimationFrame(raf);
      ro.disconnect();
      window.removeEventListener('resize', schedule);
    };
  } catch {
    // Blocked or cross-origin: the zoo still shows with its own layout.
    return () => {};
  }
}

/** Financial Playground: the 3D zoo (public/zoo, Thai locked at v10.13) fills the page width, and its height follows its content, so nothing is cut off. */
export function PlaygroundPage() {
  const { t, lang } = useLang();
  const detach = useRef<Detach | null>(null);
  useEffect(() => () => {
    detach.current?.();
    detach.current = null;
  }, []);
  // Thai keeps the locked v10.13 file; English uses the v10.14 translation (same scene, English text).
  const src = lang === 'en' ? 'zoo/zoo-3d-v10.14-en.html' : 'zoo/index.html';
  const onLoad = (e: SyntheticEvent<HTMLIFrameElement>) => {
    detach.current?.();
    detach.current = attachFrame(e.currentTarget);
  };
  return (
    <View route="playground" labelledBy="pgTitle">
      <div className="page-head reveal">
        <div>
          <p className="eyebrow">{t('pg_eyebrow')}</p>
          <h1 id="pgTitle" tabIndex={-1}>{t('pg_title')}</h1>
        </div>
      </div>
      <div className="reveal">
        <iframe className="pg-zoo-frame" src={src} title={t('pg_title')} loading="lazy" onLoad={onLoad} />
      </div>
    </View>
  );
}
