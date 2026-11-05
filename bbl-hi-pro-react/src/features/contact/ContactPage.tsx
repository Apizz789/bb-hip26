import { View } from '../../components/layout/View';
import { useEffect, useRef, useState, type FormEvent } from 'react';
import { useLang } from '../../app/LanguageProvider';
import { useFeedback } from '../../app/FeedbackProvider';
import { Icon } from '../../components/icons/Icon';
import { ariaInvalid, controlClass } from '../../components/forms/Field';
import { validateContact, type ContactErrors } from '../../domain/contact';
import { prefersReducedMotion } from '../../utils/storage';

type Field = 'name' | 'email' | 'subject' | 'message';
const FIELD_ORDER: Field[] = ['name', 'email', 'subject', 'message'];

/** Contact Us: fictional profile, contact form with validation and a simulated submission. */
export function ContactPage() {
  const { t } = useLang();
  const { toast } = useFeedback();
  const [values, setValues] = useState({ name: '', email: '', subject: '', message: '' });
  const [touched, setTouched] = useState(false);
  const [sending, setSending] = useState(false);
  const [sent, setSent] = useState(false);
  const refs = useRef<Partial<Record<Field, HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement | null>>>({});
  const timer = useRef<number | null>(null);

  useEffect(() => () => { if (timer.current !== null) window.clearTimeout(timer.current); }, []);

  // Errors appear only after the first submit attempt; afterwards they update live (prototype behaviour).
  const errors: ContactErrors = touched ? validateContact({
    name: values.name, email: values.email, subject: values.subject, message: values.message,
  }) : {};
  const err = (f: Field) => (errors[f] ? t(errors[f]!) : undefined);

  function set<K extends Field>(key: K, value: string) {
    setValues(v => ({ ...v, [key]: value }));
  }

  function submit(e: FormEvent) {
    e.preventDefault();
    setTouched(true);
    const errs = validateContact({ name: values.name, email: values.email, subject: values.subject, message: values.message });
    const firstBad = FIELD_ORDER.find(f => errs[f]);
    if (firstBad) {
      toast(t('err_generic'));
      refs.current[firstBad]?.focus();
      return;
    }
    setSending(true);
    timer.current = window.setTimeout(() => {
      setSending(false);
      setSent(true);
      toast(t('toast_ct'));
    }, prefersReducedMotion() ? 0 : 900);
  }

  function reset() {
    setValues({ name: '', email: '', subject: '', message: '' });
    setTouched(false);
    setSent(false);
  }

  return (
    <View route="contact" labelledBy="ctTitle">
      <div className="page-head reveal">
        <div>
          <p className="eyebrow">{t('nav_contact')}</p>
          <h1 id="ctTitle" tabIndex={-1}>{t('ct_title')}</h1>
          <p>{t('ct_sub')}</p>
        </div>
      </div>

      <div className="contact-grid">
        <div className="grid" style={{ gap: 18 }}>
          <div className="card profile reveal">
            <div className="profile-top">
              <div className="avatar" aria-hidden="true">AO</div>
              <div>
                <h2>{t('ct_name')}</h2>
                <p>{t('ct_role')}</p>
              </div>
            </div>
            <dl className="facts">
              <div><dt>{t('ct_f_role')}</dt><dd>{t('ct_role')}</dd></div>
              <div><dt>{t('ct_f_org')}</dt><dd>Bangkok Bank</dd></div>
              <div><dt>{t('ct_f_project')}</dt><dd>BBL HI PRO</dd></div>
            </dl>
          </div>
          <div className="card intro reveal">
            <h3>{t('ct_intro_t')}</h3>
            <p>{t('ct_intro_d')}</p>
          </div>
        </div>

        <div>
          {!sent && (
            <form className="card form-card reveal" id="contactForm" onSubmit={submit} noValidate>
              <div className="row-2">
                <div className="field">
                  <label htmlFor="cName">{t('f_name')}</label>
                  <input ref={el => { refs.current.name = el; }} className={controlClass('input', err('name'))} id="cName" type="text"
                    autoComplete="name" value={values.name} aria-invalid={ariaInvalid(err('name'))} aria-describedby="errName"
                    onChange={e => set('name', e.target.value)} />
                  <p className={'err' + (err('name') ? ' show' : '')} id="errName">{err('name')}</p>
                </div>
                <div className="field">
                  <label htmlFor="cEmail">{t('f_email')}</label>
                  <input ref={el => { refs.current.email = el; }} className={controlClass('input', err('email'))} id="cEmail" type="email"
                    autoComplete="email" placeholder={t('f_email_ph')} value={values.email} aria-invalid={ariaInvalid(err('email'))}
                    aria-describedby="errEmail" onChange={e => set('email', e.target.value)} />
                  <p className={'err' + (err('email') ? ' show' : '')} id="errEmail">{err('email')}</p>
                </div>
              </div>
              <div className="field">
                <label htmlFor="cSubject">{t('f_subject')}</label>
                <select ref={el => { refs.current.subject = el; }} className={controlClass('select', err('subject'))} id="cSubject"
                  value={values.subject} aria-invalid={ariaInvalid(err('subject'))} aria-describedby="errSubject"
                  onChange={e => set('subject', e.target.value)}>
                  <option value="">{t('select_ph')}</option>
                  <option value="general">{t('s_general')}</option>
                  <option value="ux">{t('s_ux')}</option>
                  <option value="issue">{t('s_issue')}</option>
                  <option value="partner">{t('s_partner')}</option>
                </select>
                <p className={'err' + (err('subject') ? ' show' : '')} id="errSubject">{err('subject')}</p>
              </div>
              <div className="field">
                <label htmlFor="cMessage">{t('f_message')}</label>
                <textarea ref={el => { refs.current.message = el; }} className={controlClass('textarea', err('message'))} id="cMessage"
                  maxLength={500} rows={5} value={values.message} aria-invalid={ariaInvalid(err('message'))} aria-describedby="errMessage"
                  onChange={e => set('message', e.target.value)} />
                <p className={'err' + (err('message') ? ' show' : '')} id="errMessage">{err('message')}</p>
              </div>
              <div className="count-chars" id="msgCount">{t('chars', { n: values.message.length, max: 500 })}</div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 14, flexWrap: 'wrap' }}>
                <div className="proto-note" style={{ margin: 0 }}>
                  <Icon name="i-info" />
                  <span>{t('ct_proto')}</span>
                </div>
                <button className="btn primary" type="submit" id="ctSubmit" disabled={sending}>
                  {sending ? <><span className="spin" aria-hidden="true" />{t('ct_sending')}</> : t('ct_send')}
                </button>
              </div>
            </form>
          )}

          {sent && (
            <div className="card success reveal play" id="contactSuccess">
              <div className="tick"><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M5 12.5l4.5 4.5L19 7" /></svg></div>
              <h3>{t('ct_success_t')}</h3>
              <p>{t('ct_success_d')}</p>
              <div className="actions">
                <button className="btn ghost" id="ctAgain" type="button" onClick={reset}>{t('ct_again')}</button>
              </div>
            </div>
          )}
        </div>
      </div>
    </View>
  );
}
