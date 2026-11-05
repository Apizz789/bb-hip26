import { View } from '../../components/layout/View';
import { useState } from 'react';
import { useLang } from '../../app/LanguageProvider';
import { useStore } from '../../app/StoreProvider';
import { navigate } from '../../app/router';
import { BackButton, MockTag, PageHead } from '../../components/layout/Shell';
import { Icon } from '../../components/icons/Icon';
import { matchesFilter, pillTone, STEP_KEYS, type FilterId, type TrackedRequest } from '../../domain/requests';
import { RequestDialog } from './RequestDialog';
import { requestMeta } from './requestText';

const FILTERS: { id: FilterId; key: 'filter_all' | 'filter_active' | 'filter_done' }[] = [
  { id: 'all', key: 'filter_all' },
  { id: 'active', key: 'filter_active' },
  { id: 'done', key: 'filter_done' },
];

/** Request tracking: filter chips, list with step indicator, and a details dialog. */
export function TrackingPage() {
  const { t, lang } = useLang();
  const { state, dispatch } = useStore();
  const [openId, setOpenId] = useState<string | null>(null);
  const list = state.requests.filter(r => matchesFilter(r, state.filter));

  return (
    <View route="svc-tracking" labelledBy="trackTitle">
      <BackButton />
      <PageHead titleId="trackTitle" title={t('track_title')} side={<MockTag />}>
        <p>{t('track_sub')}</p>
      </PageHead>

      <div className="filter-bar reveal">
        <div className="seg" role="group" aria-label="Filter">
          {FILTERS.map(f => (
            <button key={f.id} type="button" data-filter={f.id} aria-pressed={state.filter === f.id}
              onClick={() => dispatch({ type: 'filter/set', filter: f.id })}>{t(f.key)}</button>
          ))}
        </div>
        <span className="muted" style={{ fontSize: '.88rem' }}>{t('req_count', { n: list.length })}</span>
      </div>

      <ul className="req-list" id="reqList">
        {list.map(r => <RequestRow key={r.id} r={r} lang={lang} onOpen={() => setOpenId(r.id)} />)}
      </ul>

      {list.length === 0 && (
        <div className="empty" id="reqEmpty">
          <p>{t('track_empty')}</p>
          <button className="btn ghost" type="button" style={{ marginTop: 14 }} onClick={() => navigate('services')}>{t('track_cta')}</button>
        </div>
      )}

      {openId && <RequestDialog requestId={openId} onClose={() => setOpenId(null)} />}
    </View>
  );
}

function RequestRow({ r, lang, onOpen }: { r: TrackedRequest; lang: 'th' | 'en'; onOpen: () => void }) {
  const { t } = useLang();
  const tone = pillTone(r);
  return (
    <li>
      <button className="req" type="button" data-req={r.id} onClick={onOpen}
        aria-label={`${t(r.titleKey)} ${r.ref}`}>
        <span className="qi"><Icon name={r.type === 'doc' ? 'i-doc' : 'i-cal'} /></span>
        <span style={{ minWidth: 0 }}>
          <b style={{ display: 'block' }}>{t(r.titleKey)}</b>
          <span className="meta" style={{ display: 'block' }}>{t(r.type === 'doc' ? 'type_doc' : 'type_appt')} · {requestMeta(r, t, lang)}</span>
          <span className="ref-s" style={{ display: 'block' }}>{r.ref}</span>
          <span className="steps" aria-hidden="true">
            {[0, 1, 2].map(i => <i key={i} className={i < r.step ? 'done' : i === r.step ? 'on' : ''} />)}
          </span>
        </span>
        <span className={'pill' + (tone ? ' ' + tone : '')}>{t(STEP_KEYS[r.type][r.step])}</span>
      </button>
    </li>
  );
}

