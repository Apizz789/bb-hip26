import { useRef, useState, type FormEvent } from 'react';
import { useLang } from '../../app/LanguageProvider';
import { useStore } from '../../app/StoreProvider';
import { Dialog } from '../../components/feedback/Dialog';
import { ErrorSummary, type ErrorItem } from '../../components/forms/ErrorSummary';
import { Field, ariaInvalid, controlClass } from '../../components/forms/Field';
import { TODAY } from '../../data/mock';
import { goalDateBounds, validateGoal, type Goal, type GoalErrors, type GoalField, type GoalInput } from '../../domain/goals';
import { goalName } from './goalText';

const FIELD_ID: Record<GoalField, string> = { name: 'gName', target: 'gTarget', date: 'gDate', saved: 'gSaved' };
const FIELD_ORDER: GoalField[] = ['name', 'target', 'date', 'saved'];

interface GoalDialogProps {
  /** Existing goal to edit, or null to create a new one. */
  goal: Goal | null;
  onClose: () => void;
}

/** Create / edit goal form. Validation runs on submit, like the prototype. */
export function GoalDialog({ goal, onClose }: GoalDialogProps) {
  const { t } = useLang();
  const { dispatch } = useStore();
  const nameRef = useRef<HTMLInputElement>(null);
  const bounds = goalDateBounds(TODAY);

  const [name, setName] = useState(goal ? goalName(goal, t) : '');
  const [target, setTarget] = useState(String(goal ? goal.target : 30000));
  const [date, setDate] = useState(goal ? goal.date : bounds.min);
  const [saved, setSaved] = useState(String(goal ? goal.saved : 0));
  const [errors, setErrors] = useState<GoalErrors>({});

  const items: ErrorItem[] = FIELD_ORDER.filter(k => errors[k]).map(k => ({ id: FIELD_ID[k], msg: t(errors[k]!) }));

  function submit(e: FormEvent) {
    e.preventDefault();
    const input: GoalInput = { name: name.trim(), target: Number(target), saved: Number(saved), date };
    const errs = validateGoal(input, TODAY);
    setErrors(errs);
    if (Object.keys(errs).length > 0) return;

    if (goal) {
      const keepNameKey = !!goal.nameKey && input.name === t(goal.nameKey);
      dispatch({ type: 'goal/update', id: goal.id, input, keepNameKey });
    } else {
      dispatch({ type: 'goal/create', input });
    }
    onClose();
  }

  const err = (k: GoalField) => (errors[k] ? t(errors[k]!) : undefined);

  return (
    <Dialog
      title={t(goal ? 'gf_title_edit' : 'gf_title_new')}
      onClose={onClose}
      id="gdTitle"
      initialFocus={() => nameRef.current}
      footer={
        <>
          <button className="btn ghost" type="button" onClick={onClose}>{t('cancel')}</button>
          <button className="btn primary" type="submit" form="gForm">{t('gf_save')}</button>
        </>
      }
    >
      <form id="gForm" className="goal-form" onSubmit={submit} noValidate>
        <ErrorSummary items={items} />
        <Field label={t('gf_name')} htmlFor="gName" error={err('name')} errorId="errGName">
          <input ref={nameRef} className={controlClass('input', err('name'))} id="gName" type="text" maxLength={40}
            value={name} placeholder={t('gf_name_ph')} aria-invalid={ariaInvalid(err('name'))}
            aria-describedby="errGName" onChange={e => setName(e.target.value)} />
        </Field>
        <Field label={t('gf_target')} htmlFor="gTarget" error={err('target')} errorId="errGTarget">
          <input className={controlClass('input', err('target'))} id="gTarget" type="number" inputMode="numeric"
            min={1000} max={10000000} step={100} value={target} aria-invalid={ariaInvalid(err('target'))}
            aria-describedby="errGTarget" onChange={e => setTarget(e.target.value)} />
        </Field>
        <Field label={t('gf_date')} htmlFor="gDate" error={err('date')} errorId="errGDate">
          <input className={controlClass('input', err('date'))} id="gDate" type="date" min={bounds.min} max={bounds.max}
            value={date} aria-invalid={ariaInvalid(err('date'))} aria-describedby="errGDate"
            onChange={e => setDate(e.target.value)} />
        </Field>
        <Field label={t('gf_saved')} htmlFor="gSaved" error={err('saved')} errorId="errGSaved">
          <input className={controlClass('input', err('saved'))} id="gSaved" type="number" inputMode="numeric"
            min={0} step={100} value={saved} aria-invalid={ariaInvalid(err('saved'))}
            aria-describedby="errGSaved" onChange={e => setSaved(e.target.value)} />
        </Field>
      </form>
    </Dialog>
  );
}
