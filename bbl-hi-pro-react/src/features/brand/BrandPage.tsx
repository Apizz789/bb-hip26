import { View } from '../../components/layout/View';
import { useLang } from '../../app/LanguageProvider';
import { MockTag } from '../../components/layout/Shell';

/** Brand options: Growth Garden mark in light/dark variants, sizes, favicon preview and usage rules. */
export function BrandPage() {
  const { t } = useLang();
  return (
    <View route="brand" labelledBy="brTitle">
      <div className="page-head reveal">
        <div>
          <p className="eyebrow">{t('footer_brand')}</p>
          <h1 id="brTitle" tabIndex={-1}>{t('br_title')}</h1>
          <p>{t('br_sub')}</p>
        </div>
        <MockTag>{t('br_status')}</MockTag>
      </div>

      <div className="brand-grid">
        <article className="card reveal brand-intro">
          <svg className="bm-xl" viewBox="0 0 64 64" aria-hidden="true"><use href="#bm-light" /></svg>
          <div>
            <h2>{t('br_concept_b')}</h2>
            <p className="muted">{t('br_concept_d')}</p>
          </div>
        </article>

        <article className="card reveal">
          <h3>{t('br_light_t')}</h3>
          <div className="variant light"><svg className="bm-xl" viewBox="0 0 64 64" aria-hidden="true"><use href="#bm-light" /></svg></div>
        </article>

        <article className="card reveal">
          <h3>{t('br_dark_t')}</h3>
          <div className="variant dark"><svg className="bm-xl" viewBox="0 0 64 64" aria-hidden="true"><use href="#bm-dark" /></svg></div>
        </article>

        <article className="card reveal">
          <h3>{t('br_sizes_t')}</h3>
          <div className="sizes">
            {[64, 32, 20, 16].map(size => (
              <figure key={size}>
                <svg width={size} height={size} viewBox="0 0 64 64" aria-hidden="true"><use href="#bm-light" /></svg>
                <figcaption>{size}</figcaption>
              </figure>
            ))}
          </div>
          <h3 style={{ marginTop: 22 }}>{t('br_fav_t')}</h3>
          <p className="muted small">{t('br_fav_d')}</p>
          <div className="tabmock" aria-hidden="true">
            <span className="tab"><svg width={16} height={16} viewBox="0 0 64 64"><use href="#bm-light" /></svg><span>{t('brand_sub')}</span></span>
          </div>
        </article>

        <article className="card reveal">
          <h3>{t('br_rules_t')}</h3>
          <ul className="rules">
            <li>{t('br_rule1')}</li>
            <li>{t('br_rule2')}</li>
            <li>{t('br_rule3')}</li>
          </ul>
        </article>
      </div>
      <p className="micro" style={{ marginTop: 20 }}>{t('br_foot')}</p>
    </View>
  );
}
