import { View } from '../../components/layout/View';
import { useLang } from '../../app/LanguageProvider';

/** Financial Playground: the 3D zoo (public/zoo/index.html, locked at v10.13), a self-contained page with its own simulated state. */
export function PlaygroundPage() {
  const { t } = useLang();
  return (
    <View route="playground" labelledBy="pgTitle">
      <div className="page-head reveal">
        <div>
          <p className="eyebrow">{t('pg_eyebrow')}</p>
          <h1 id="pgTitle" tabIndex={-1}>{t('pg_title')}</h1>
        </div>
      </div>
      <div className="reveal">
        <iframe className="pg-zoo-frame" src="zoo/index.html" title={t('pg_title')} loading="lazy" />
      </div>
    </View>
  );
}
