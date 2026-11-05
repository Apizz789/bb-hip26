import { View } from '../../components/layout/View';
import { useState, type FormEvent } from 'react';
import { useLang } from '../../app/LanguageProvider';
import { useStore } from '../../app/StoreProvider';
import { useFeedback } from '../../app/FeedbackProvider';
import { navigate } from '../../app/router';
import { BackButton, MockTag, PageHead } from '../../components/layout/Shell';
import { Field, ariaInvalid, controlClass } from '../../components/forms/Field';
import { ErrorSummary, type ErrorItem } from '../../components/forms/ErrorSummary';
import { Icon } from '../../components/icons/Icon';
import { clampCopies, docTypeKey, validateDocRequest, type Delivery, type DocErrors } from '../../domain/documents';
import { formatRef } from '../../domain/requests';
import { prefersReducedMotion } from '../../utils/storage';

type Phase = 'form' | 'review' | 'done';

const TYPE_OPTIONS = ['statement', 'income', 'balance', 'tax'] as const;
const PERIOD_OPTIONS = [['3', 'p3'], ['6', 'p6'], ['12', 'p12']] as const;

/** Document request: form → review → simulated confirmation → tracking. */
export function DocumentRequestPage() {
  const { t } = useLang();
  const { state, dispatch } = useStore();
  const { toast } = useFeedback();

  const [phase, setPhase] = useState<Phase>('form');
  const [type, setType] = useState('');
  const [period, setPeriod] = useState<string>('3');
  const [copies, setCopies] = useState(1);
  const [delivery, setDelivery] = useState<Delivery>('email');
  const [email, setEmail] = useState('');
  const [errors, setErrors] = useState<DocErrors>({});
  const [summary, setSummary] = useState<ErrorItem[]>([]);
  const [busy, setBusy] = useState(false);
  const [ref, setRef] = useState('');

  const typeLabel = (v: string) => (v ? t(docTypeKey(v as (typeof TYPE_OPTIONS)[number])) : '');

  const onSubmit = (e: FormEvent) => {
    e.preventDefault();
    const errs = validateDocRequest({ type, copies, delivery, email });
    setErrors(errs);
    const items: ErrorItem[] = [];
    if (errs.type) items.push({ id: 'docType', msg: t(errs.type) });
    if (errs.copies) items.push({ id: 'docCopies', msg: t(errs.copies) });
    if (errs.email) items.push({ id: 'docEmail', msg: t(errs.email) });
    setSummary(items);
    if (items.length) { toast(t('err_generic')); return; }
    setPhase('review');
  };

  const confirm = () => {
    setBusy(true);
    window.setTimeout(() => {
      const next = formatRef('DOC', state.reqSeq + 1);
      dispatch({ type: 'request/addDoc', titleKey: docTypeKey(type as (typeof TYPE_OPTIONS)[number]) });
      setBusy(false);
      setRef(next);
      setPhase('done');
      toast(t('toast_doc', { ref: next }));
    }, prefersReducedMotion() ? 0 : 700);
  };

  const again = () => {
    setType(''); setPeriod('3'); setCopies(1); setDelivery('email'); setEmail('');
    setErrors({}); setSummary([]); setPhase('form');
  };

  const setCopiesClamped = (n: number) => setCopies(clampCopies(n));

  return (
    <View route="svc-documents" labelledBy="docTitle">
      <BackButton />
      <PageHead titleId="docTitle" title={t('doc_title')} side={<MockTag />}>
        <p>{t('doc_sub')}</p>
      </PageHead>

      <div className="form-wrap grid-2" style={{ gap: 18 }}>
        {phase === 'form' && (
          <form className="card form-card reveal" id="docForm" noValidate onSubmit={onSubmit}>
            <ErrorSummary items={summary} />
            <Field label={t('doc_type')} htmlFor="docType" error={errors.type && t(errors.type)} errorId="errDocType">
              <select className={controlClass('select', errors.type && t(errors.type))} id="docType" value={type}
                aria-invalid={ariaInvalid(errors.type && t(errors.type))} aria-describedby="errDocType"
                onChange={e => setType(e.target.value)}>
                <option value="">{t('select_ph')}</option>
                {TYPE_OPTIONS.map(k => <option key={k} value={k}>{t(docTypeKey(k))}</option>)}
              </select>
            </Field>

            <div className="row-2">
              <Field label={t('doc_period')} htmlFor="docPeriod" errorId="errPeriod">
                <select className="select" id="docPeriod" value={period} onChange={e => setPeriod(e.target.value)}>
                  {PERIOD_OPTIONS.map(([v, k]) => <option key={v} value={v}>{t(k)}</option>)}
                </select>
              </Field>
              <Field label={t('doc_copies')} htmlFor="docCopies" error={errors.copies && t(errors.copies)} errorId="errCopies">
                <div className="stepper">
                  <button type="button" id="copiesMinus" aria-label={t('aria_less')} disabled={copies <= 1} onClick={() => setCopiesClamped(copies - 1)}>
                    <svg className="ico" viewBox="0 0 24 24" aria-hidden="true"><path d="M5 12h14" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" /></svg>
                  </button>
                  <input id="docCopies" type="number" inputMode="numeric" min={1} max={5} value={copies}
                    className={errors.copies ? 'invalid' : undefined} aria-invalid={ariaInvalid(errors.copies && t(errors.copies))}
                    aria-describedby="errCopies" onChange={e => setCopies(Number(e.target.value))} onBlur={() => setCopiesClamped(copies)} />
                  <button type="button" id="copiesPlus" aria-label={t('aria_more')} disabled={copies >= 5} onClick={() => setCopiesClamped(copies + 1)}>
                    <svg className="ico" viewBox="0 0 24 24" aria-hidden="true"><path d="M12 5v14M5 12h14" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" /></svg>
                  </button>
                </div>
              </Field>
            </div>

            <fieldset className="field radio-group" style={{ marginBottom: 16 }}>
              <legend>{t('doc_delivery')}</legend>
              <label className="radio"><input type="radio" name="delivery" value="email" checked={delivery === 'email'} onChange={() => setDelivery('email')} /><span>{t('del_email')}</span></label>
              <label className="radio"><input type="radio" name="delivery" value="branch" checked={delivery === 'branch'} onChange={() => setDelivery('branch')} /><span>{t('del_branch')}</span></label>
            </fieldset>

            {delivery === 'email' && (
              <Field label={t('doc_email')} htmlFor="docEmail" error={errors.email && t(errors.email)} errorId="errDocEmail">
                <input className={controlClass('input', errors.email && t(errors.email))} id="docEmail" type="email" autoComplete="email"
                  placeholder={t('doc_email_ph')} value={email} aria-invalid={ariaInvalid(errors.email && t(errors.email))}
                  aria-describedby="errDocEmail" onChange={e => setEmail(e.target.value)} />
              </Field>
            )}

            <button className="btn primary" type="submit">{t('doc_submit')}</button>
          </form>
        )}

        {phase === 'review' && (
          <div className="card form-card reveal" id="docReview">
            <h2 tabIndex={-1}>{t('doc_review_t')}</h2>
            <p className="muted" style={{ marginTop: 6, fontSize: '.92rem' }}>{t('doc_review_d')}</p>
            <div className="summary" id="docReviewList">
              <div><span>{t('doc_type')}</span><b>{typeLabel(type)}</b></div>
              <div><span>{t('doc_period')}</span><b>{t(PERIOD_OPTIONS.find(([v]) => v === period)?.[1] ?? 'p3')}</b></div>
              <div><span>{t('doc_copies')}</span><b>{copies}</b></div>
              <div><span>{t('doc_delivery')}</span><b>{t(delivery === 'email' ? 'del_email' : 'del_branch')}{delivery === 'email' ? ' · ' + email.trim() : ''}</b></div>
            </div>
            <div className="modal-actions" style={{ justifyContent: 'flex-start' }}>
              <button className="btn ghost" type="button" id="docEdit" disabled={busy} onClick={() => setPhase('form')}>{t('doc_edit')}</button>
              <button className="btn primary" type="button" id="docConfirm" disabled={busy} onClick={confirm}>
                {busy ? <><span className="spin" aria-hidden="true" />{t('processing')}</> : t('doc_confirm')}
              </button>
            </div>
          </div>
        )}

        <aside className="card reveal" style={{ alignSelf: 'start' }}>
          <h2 className="h3-look">{t('doc_info_t')}</h2>
          <p className="muted" style={{ marginTop: 8, fontSize: '.92rem' }}>{t('doc_info_d')}</p>
          <ul className="timeline" style={{ marginTop: 18 }}>
            <li className="done"><span className="dot"><Icon name="i-check" /></span><div><b>{t('status_submitted')}</b><small>{t('doc_info_s1')}</small></div></li>
            <li><span className="dot" /><div><b>{t('status_processing')}</b><small>{t('doc_info_s2')}</small></div></li>
            <li><span className="dot" /><div><b>{t('status_ready')}</b><small>{t('doc_info_s3')}</small></div></li>
          </ul>
        </aside>

        {phase === 'done' && (
          <div className="card success reveal play" id="docSuccess">
            <div className="tick"><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M5 12.5l4.5 4.5L19 7" /></svg></div>
            <h2 className="h3-look">{t('success_title')}</h2>
            <p>{t('success_doc')}</p>
            <span className="ref" id="docRef">{ref}</span>
            <div className="actions">
              <button className="btn primary" type="button" onClick={() => navigate('svc-tracking')}>{t('success_track')}</button>
              <button className="btn ghost" id="docAgain" type="button" onClick={again}>{t('success_again')}</button>
            </div>
          </div>
        )}
      </div>
    </View>
  );
}
