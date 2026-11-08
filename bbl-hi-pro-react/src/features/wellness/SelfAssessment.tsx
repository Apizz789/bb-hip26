import { useState } from 'react';
import { useLang } from '../../app/LanguageProvider';
import { ChoiceGroup } from '../../components/forms/ChoiceGroup';
import { WELLNESS_SETS } from '../../data/wellnessSets';
import { overallScore, scoreSet } from '../../domain/wellnessSets';
import { SCALE_KEYS, tx } from '../../i18n/extra';

/** Self-assessment: pick a set, answer each item on a five-step scale, then see the set score and the overall score. */
export function SelfAssessment() {
  const { lang } = useLang();
  const [active, setActive] = useState(WELLNESS_SETS[0].id);
  const [answers, setAnswers] = useState<Record<string, number>>({});
  const set = WELLNESS_SETS.find(s => s.id === active) ?? WELLNESS_SETS[0];
  const setScoreNow = scoreSet(set, answers);
  const overall = overallScore(WELLNESS_SETS.map(s => scoreSet(s, answers)));
  const answered = set.questions.filter(q => answers[q.id] !== undefined).length;

  return (
    <section className="card reveal selfassess" aria-labelledby="wqTitle">
      <div className="card-head">
        <div>
          <h2 id="wqTitle">{tx(lang, 'wq_title')}</h2>
          <p>{tx(lang, 'wq_sub')}</p>
        </div>
        <button className="btn ghost" type="button" onClick={() => setAnswers({})}>{tx(lang, 'wq_reset')}</button>
      </div>
      <ChoiceGroup id="wqSets" label={tx(lang, 'wq_title')} groupClass="pill-row" itemClass="pill-opt" selected={active}
        onSelect={setActive} items={WELLNESS_SETS.map(s => ({ id: s.id, label: s.title[lang] }))} />
      <ol className="wq-list">
        {set.questions.map((q, i) => (
          <li key={q.id} className="wq-item">
            <p className="wq-text"><b>{i + 1}.</b> {q.text[lang]}</p>
            <ChoiceGroup id={'q-' + q.id} label={q.text[lang]} groupClass="scale" itemClass="scale-opt"
              selected={answers[q.id] !== undefined ? String(answers[q.id]) : null}
              onSelect={id => setAnswers(a => ({ ...a, [q.id]: Number(id) }))}
              items={SCALE_KEYS.map((k, v) => ({ id: String(v), label: tx(lang, k) }))} />
          </li>
        ))}
      </ol>
      <div className="wq-result">
        <div><span>{tx(lang, 'wq_answered')}</span><b className="num">{answered}/{set.questions.length}</b></div>
        <div><span>{tx(lang, 'wq_score')}</span><b className="num">{setScoreNow ?? '–'}</b></div>
        <div><span>{tx(lang, 'wq_overall')}</span><b className="num">{overall ?? '–'}</b></div>
      </div>
      <p className="micro">{tx(lang, 'wq_source')}</p>
    </section>
  );
}
