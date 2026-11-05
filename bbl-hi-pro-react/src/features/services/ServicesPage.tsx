import { View } from '../../components/layout/View';
import { useLang } from '../../app/LanguageProvider';
import { navigate, type Route } from '../../app/router';
import { Icon } from '../../components/icons/Icon';
import { MockTag, PageHead } from '../../components/layout/Shell';
import type { TranslationKey } from '../../i18n/dictionary';

const CARDS: { to: Route; icon: string; title: TranslationKey; desc: TranslationKey }[] = [
  { to: 'svc-documents', icon: 'i-doc', title: 'svc_docs_t', desc: 'svc_docs_d' },
  { to: 'svc-appointment', icon: 'i-cal', title: 'svc_appt_t', desc: 'svc_appt_d' },
  { to: 'svc-tracking', icon: 'i-track', title: 'svc_track_t', desc: 'svc_track_d' },
  { to: 'svc-overview', icon: 'i-chart', title: 'svc_overview_t', desc: 'svc_overview_d' },
  { to: 'wellness', icon: 'i-heart', title: 'svc_wellness_t', desc: 'svc_wellness_d' },
];

export function ServicesPage() {
  const { t } = useLang();
  return (
    <View route="services" labelledBy="svcTitle">
      <PageHead eyebrow={t('nav_services')} title={t('svc_title')} titleId="svcTitle" side={<MockTag />}>
        <p>{t('svc_sub')}</p>
      </PageHead>
      <div className="svc-grid">
        {CARDS.map(c => (
          <button key={c.to} className="card lift svc reveal" type="button" onClick={() => navigate(c.to)}>
            <span className="qi"><Icon name={c.icon} /></span>
            <h2 className="h3-look">{t(c.title)}</h2>
            <p>{t(c.desc)}</p>
            <span className="open"><span>{t('open')}</span><Icon name="i-right" /></span>
          </button>
        ))}
      </div>
    </View>
  );
}
