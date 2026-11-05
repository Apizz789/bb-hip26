import { View } from '../../components/layout/View';
import { useState, type FormEvent } from 'react';
import { useLang } from '../../app/LanguageProvider';
import { useStore } from '../../app/StoreProvider';
import { useFeedback } from '../../app/FeedbackProvider';
import { navigate } from '../../app/router';
import { BackButton, MockTag, PageHead } from '../../components/layout/Shell';
import { Dialog } from '../../components/feedback/Dialog';
import { ChoiceGroup, type ChoiceItem } from '../../components/forms/ChoiceGroup';
import { Field, ariaInvalid, controlClass } from '../../components/forms/Field';
import { ErrorSummary, type ErrorItem } from '../../components/forms/ErrorSummary';
import { Icon } from '../../components/icons/Icon';
import { BRANCHES, PURPOSES, SLOTS, branchKey, isSlotTaken, purposeKey, validateAppointment, workingDays, type ApptErrors } from '../../domain/appointments';
import { formatRef } from '../../domain/requests';
import { TODAY } from '../../data/mock';
import { fmtDate, fmtDay, fmtDM, fill } from '../../utils/format';
import { prefersReducedMotion } from '../../utils/storage';

const DAYS = workingDays(TODAY, 6);
const MAX_NOTES = 200;

/** Appointment: branch → purpose → date → time → confirmation dialog → simulated booking. */
export function AppointmentPage() {
  const { t, lang } = useLang();
  const { state, dispatch } = useStore();
  const { toast } = useFeedback();

  const [branch, setBranch] = useState('');
  const [purpose, setPurpose] = useState('');
  const [notes, setNotes] = useState('');
  const [errors, setErrors] = useState<ApptErrors>({});
  const [summary, setSummary] = useState<ErrorItem[]>([]);
  const [confirming, setConfirming] = useState(false);
  const [busy, setBusy] = useState(false);
  const [done, setDone] = useState<{ ref: string; text: string } | null>(null);

  const dateIso = state.apptDate !== null ? DAYS[state.apptDate] : null;
  const branchLabel = branch ? t(branchKey(branch as (typeof BRANCHES)[number])) : '';
  const purposeLabel = purpose ? t(purposeKey(purpose as (typeof PURPOSES)[number])) : '';
  const whenLabel = dateIso ? fmtDate(dateIso, lang) + (state.apptTime ? ' · ' + state.apptTime : '') : '';

  const dateItems: ChoiceItem[] = DAYS.map((iso, i) => ({
    id: String(i),
    label: <><small>{fmtDay(iso, lang)}</small><strong>{fmtDM(iso, lang)}</strong></>,
  }));

  const slotItems: ChoiceItem[] = SLOTS.map((s, i) => {
    const taken = state.apptDate !== null && isSlotTaken(branch || null, state.apptDate, i);
    return {
      id: s,
      label: <>{s}{taken ? ' · ' + t('slot_full') : ''}</>,
      disabled: taken,
      title: taken ? t('slot_full') : s,
    };
  });

  const onSubmit = (e: FormEvent) => {
    e.preventDefault();
    const errs = validateAppointment({ branch, purpose, dateIdx: state.apptDate, time: state.apptTime });
    setErrors(errs);
    const items: ErrorItem[] = [];
    if (errs.branch) items.push({ id: 'apptBranch', msg: t(errs.branch) });
    if (errs.purpose) items.push({ id: 'apptPurpose', msg: t(errs.purpose) });
    if (errs.date) items.push({ id: 'dateChips', msg: t(errs.date) });
    if (errs.time) items.push({ id: 'slots', msg: t(errs.time) });
    setSummary(items);
    if (items.length) { toast(t('err_generic')); return; }
    setConfirming(true);
  };

  const confirm = () => {
    if (!dateIso || state.apptDate === null || !state.apptTime) return;
    setBusy(true);
    const time = state.apptTime;
    const dateTxt = fmtDate(dateIso, lang);
    window.setTimeout(() => {
      const ref = formatRef('APT', state.reqSeq + 1);
      dispatch({
        type: 'request/addAppt',
        titleKey: purposeKey(purpose as (typeof PURPOSES)[number]),
        branchKey: branchKey(branch as (typeof BRANCHES)[number]),
        date: dateIso,
        time,
      });
      setBusy(false);
      setConfirming(false);
      setDone({ ref, text: fill(t('appt_done_text'), { branch: branchLabel, date: dateTxt, time }) });
      toast(t('toast_appt', { ref }));
    }, prefersReducedMotion() ? 0 : 600);
  };

  const again = () => {
    setBranch(''); setPurpose(''); setNotes(''); setErrors({}); setSummary([]);
    setDone(null);
    dispatch({ type: 'appt/date', index: null });
  };

  return (
    <View route="svc-appointment" labelledBy="apptTitle">
      <BackButton />
      <PageHead titleId="apptTitle" title={t('appt_title')} side={<MockTag />}>
        <p>{t('appt_sub')}</p>
      </PageHead>

      <div className="form-wrap grid-2" style={{ gap: 18 }}>
        {!done && (
          <form className="card form-card reveal" id="apptForm" noValidate onSubmit={onSubmit}>
            <ErrorSummary items={summary} />
            <div className="row-2">
              <Field label={t('appt_branch')} htmlFor="apptBranch" error={errors.branch && t(errors.branch)} errorId="errBranch">
                <select id="apptBranch" className={controlClass('select', errors.branch && t(errors.branch))} value={branch}
                  aria-invalid={ariaInvalid(errors.branch && t(errors.branch))} aria-describedby="errBranch"
                  onChange={e => { setBranch(e.target.value); setErrors(x => ({ ...x, branch: undefined })); dispatch({ type: 'appt/time', time: null }); }}>
                  <option value="">{t('select_ph')}</option>
                  {BRANCHES.map(b => <option key={b} value={b}>{t(branchKey(b))}</option>)}
                </select>
              </Field>
              <Field label={t('appt_purpose')} htmlFor="apptPurpose" error={errors.purpose && t(errors.purpose)} errorId="errPurpose">
                <select id="apptPurpose" className={controlClass('select', errors.purpose && t(errors.purpose))} value={purpose}
                  aria-invalid={ariaInvalid(errors.purpose && t(errors.purpose))} aria-describedby="errPurpose"
                  onChange={e => { setPurpose(e.target.value); setErrors(x => ({ ...x, purpose: undefined })); }}>
                  <option value="">{t('select_ph')}</option>
                  {PURPOSES.map(p => <option key={p} value={p}>{t(purposeKey(p))}</option>)}
                </select>
              </Field>
            </div>

            <div className="field">
              <span className="label-like">{t('appt_date')}</span>
              <ChoiceGroup id="dateChips" label={t('appt_date')} groupClass="chips-row" itemClass="date-chip"
                items={dateItems} selected={state.apptDate !== null ? String(state.apptDate) : null}
                onSelect={id => { dispatch({ type: 'appt/date', index: Number(id) }); setErrors(x => ({ ...x, date: undefined })); }} />
              <p className={'err' + (errors.date ? ' show' : '')} id="errDate">{errors.date && t(errors.date)}</p>
            </div>

            <div className="field">
              <span className="label-like">{t('appt_time')}</span>
              {state.apptDate === null
                ? <span className="muted" style={{ fontSize: '.88rem' }}>{t('err_date')}</span>
                : <ChoiceGroup id="slots" label={t('appt_time')} groupClass="chips-row" itemClass="slot"
                    items={slotItems} selected={state.apptTime}
                    onSelect={time => { dispatch({ type: 'appt/time', time }); setErrors(x => ({ ...x, time: undefined })); }} />}
              <p className={'err' + (errors.time ? ' show' : '')} id="errTime">{errors.time && t(errors.time)}</p>
            </div>

            <div className="field">
              <label htmlFor="apptNotes">{t('appt_notes')}</label>
              <textarea className="textarea" id="apptNotes" maxLength={MAX_NOTES} rows={3} value={notes} onChange={e => setNotes(e.target.value)} />
              <div className="count-chars" id="notesCount">{t('chars', { n: notes.length, max: MAX_NOTES })}</div>
            </div>

            <button className="btn primary" type="submit">{t('appt_submit')}</button>
          </form>
        )}

        <aside className="card reveal" style={{ alignSelf: 'start' }}>
          <h2 className="h3-look">{t('appt_summary_t')}</h2>
          <dl className="facts" style={{ marginTop: 8 }}>
            <div><dt>{t('sum_branch')}</dt><dd id="sumBranch">{branchLabel || <span className="muted">{t('not_selected')}</span>}</dd></div>
            <div><dt>{t('sum_purpose')}</dt><dd id="sumPurpose">{purposeLabel || <span className="muted">{t('not_selected')}</span>}</dd></div>
            <div><dt>{t('sum_when')}</dt><dd id="sumWhen">{whenLabel || <span className="muted">{t('not_selected')}</span>}</dd></div>
          </dl>
          <h2 className="h3-look" style={{ marginTop: 22 }}>{t('appt_tips_t')}</h2>
          <p className="muted" style={{ marginTop: 8, fontSize: '.92rem' }}>{t('appt_tips_d')}</p>
          <div className="proto-note" style={{ marginTop: 16 }}><Icon name="i-info" /><span>{t('appt_proto')}</span></div>
        </aside>

        {done && (
          <div className="card success reveal play" id="apptSuccess">
            <div className="tick"><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M5 12.5l4.5 4.5L19 7" /></svg></div>
            <h2 className="h3-look">{t('appt_done_title')}</h2>
            <p id="apptDoneText">{done.text}</p>
            <span className="ref" id="apptRef">{done.ref}</span>
            <div className="actions">
              <button className="btn primary" type="button" onClick={() => navigate('svc-tracking')}>{t('success_track')}</button>
              <button className="btn ghost" id="apptAgain" type="button" onClick={again}>{t('success_again')}</button>
            </div>
          </div>
        )}
      </div>

      {confirming && (
        <Dialog title={t('appt_confirm_t')} onClose={() => !busy && setConfirming(false)}
          footer={<>
            <button className="btn ghost" type="button" disabled={busy} onClick={() => setConfirming(false)}>{t('cancel')}</button>
            <button className="btn primary" type="button" disabled={busy} onClick={confirm}>
              {busy ? <><span className="spin" aria-hidden="true" />{t('processing')}</> : t('confirm')}
            </button>
          </>}>
          <div className="summary">
            <div><span>{t('sum_branch')}</span><b>{branchLabel}</b></div>
            <div><span>{t('sum_purpose')}</span><b>{purposeLabel}</b></div>
            <div><span>{t('sum_when')}</span><b>{dateIso ? fmtDate(dateIso, lang) : ''} · {state.apptTime}</b></div>
          </div>
        </Dialog>
      )}
    </View>
  );
}
