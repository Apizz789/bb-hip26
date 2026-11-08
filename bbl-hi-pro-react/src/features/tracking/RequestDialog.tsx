import { useLang } from '../../app/LanguageProvider';
import { useStore } from '../../app/StoreProvider';
import { useFeedback } from '../../app/FeedbackProvider';
import { Dialog } from '../../components/feedback/Dialog';
import { isFinal, STEP_KEYS, type TrackedRequest } from '../../domain/requests';
import { requestMeta } from './requestText';
import { downloadSamplePdf } from './samplePdf';
import { tx } from '../../i18n/extra';
import { fmtDate } from '../../utils/format';

/** Request details with a status timeline. "Next status" is a simulated update only. */
export function RequestDialog({ requestId, onClose }: { requestId: string; onClose: () => void }) {
  const { t, lang } = useLang();
  const { state, dispatch } = useStore();
  const { toast } = useFeedback();
  const r = state.requests.find(x => x.id === requestId);
  if (!r) return null;
  const req: TrackedRequest = r;
  const done = isFinal(req);

  const advanceStatus = () => {
    if (done) return;
    dispatch({ type: 'request/advance', id: req.id });
    toast(t('track_next_msg', { status: t(STEP_KEYS[req.type][req.step + 1]) }));
  };

  return (
    <Dialog
      title={t(req.titleKey)}
      onClose={onClose}
      footer={<>
        <button className="btn ghost" type="button" onClick={onClose}>{t('close')}</button>
        <button className="btn primary" type="button" onClick={advanceStatus} disabled={done}>
          {done ? t('track_done_msg') : t('track_next')}
        </button>
      </>}
    >
      <div className="summary">
        <div><span>{t('req_ref')}</span><b>{req.ref}</b></div>
        <div><span>{t('req_date_lbl')}</span><b>{requestMeta(req, t, lang)}</b></div>
      </div>
      <ul className="timeline">
        {STEP_KEYS[req.type].map((k, i) => {
          const cls = i < req.step ? 'done' : i === req.step ? 'now' : '';
          return (
            <li key={k} className={cls}>
              <span className="dot">{i < req.step && <svg className="ico" viewBox="0 0 24 24" aria-hidden="true"><use href="#i-check" /></svg>}</span>
              <div><b>{t(k)}</b></div>
            </li>
          );
        })}
      </ul>
      {req.type === 'doc' && done && (
        <div className="pdf-box">
          <button className="btn primary full" type="button"
            onClick={() => void downloadSamplePdf({ ref: req.ref, title: t(req.titleKey), date: fmtDate(req.date, lang), lang })}>
            {tx(lang, 'pdf_btn')}
          </button>
          <p className="micro">{tx(lang, 'pdf_note')}</p>
        </div>
      )}
    </Dialog>
  );
}
