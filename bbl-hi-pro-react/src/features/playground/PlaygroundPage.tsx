import { View } from '../../components/layout/View';
import { useLang } from '../../app/LanguageProvider';
import { navigate } from '../../app/router';

/** Financial Playground: Coming Soon placeholder only. Zoo Garden is out of scope for this migration. */
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
      <div className="soon reveal">
        <svg className="rings" viewBox="0 0 320 320" aria-hidden="true">
          <circle cx="160" cy="160" r="60" /><circle cx="160" cy="160" r="110" /><circle cx="160" cy="160" r="158" />
        </svg>
        <div className="content">
          <div className="mark">
            <svg viewBox="0 0 64 64" aria-hidden="true"><use href="#bm-dark" /></svg>
          </div>
          <span className="pill blue">{t('pg_soon')}</span>
          <h2 style={{ marginTop: 14, fontSize: '1.4rem' }}>{t('pg_heading')}</h2>
          <p>{t('pg_desc')}</p>
          <button className="btn ghost" type="button" onClick={() => navigate('home')}>{t('pg_back')}</button>
        </div>
      </div>
    </View>
  );
}
