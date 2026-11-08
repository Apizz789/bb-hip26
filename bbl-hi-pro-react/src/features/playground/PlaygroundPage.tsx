import type { SyntheticEvent } from 'react';
import { View } from '../../components/layout/View';
import { useLang } from '../../app/LanguageProvider';

/** Applied inside the zoo document (same origin) so the zoo never shows its own scrollbar; the frame gives it the space. */
const EMBED_CSS = 'html,body{margin:0!important;height:100%!important;overflow:hidden!important}';

function lockScroll(e: SyntheticEvent<HTMLIFrameElement>) {
  try {
    const doc = e.currentTarget.contentDocument;
    if (!doc || doc.getElementById('embed-lock')) return;
    const style = doc.createElement('style');
    style.id = 'embed-lock';
    style.textContent = EMBED_CSS;
    doc.head.appendChild(style);
  } catch {
    // Blocked or cross-origin: the zoo still works, it just keeps its own scrollbar.
  }
}

/** Financial Playground: the 3D zoo (public/zoo/index.html, locked at v10.13) fills the page area. */
export function PlaygroundPage() {
  const { t, lang } = useLang();
  // Thai keeps the locked v10.13 file; English uses the v10.14 translation (same scene, English text).
  const src = lang === 'en' ? 'zoo/zoo-3d-v10.14-en.html' : 'zoo/index.html';
  return (
    <View route="playground" labelledBy="pgTitle">
      <div className="page-head reveal">
        <div>
          <p className="eyebrow">{t('pg_eyebrow')}</p>
          <h1 id="pgTitle" tabIndex={-1}>{t('pg_title')}</h1>
        </div>
      </div>
      <div className="reveal">
        <iframe className="pg-zoo-frame" src={src} title={t('pg_title')} loading="lazy" onLoad={lockScroll} />
      </div>
    </View>
  );
}
