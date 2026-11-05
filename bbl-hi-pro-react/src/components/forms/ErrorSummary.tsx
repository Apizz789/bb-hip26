import { useEffect, useRef } from 'react';
import { useLang } from '../../app/LanguageProvider';

export interface ErrorItem { id: string; msg: string }

/** Lists every problem; each link moves focus to its field. Focused when it appears. */
export function ErrorSummary({ items }: { items: ErrorItem[] }) {
  const { t } = useLang();
  const ref = useRef<HTMLDivElement>(null);
  const shown = items.length > 0;
  useEffect(() => { if (shown) ref.current?.focus(); }, [shown, items.map(i => i.id).join('|')]); // eslint-disable-line react-hooks/exhaustive-deps

  if (!shown) return <div className="err-summary" hidden />;
  return (
    <div className="err-summary" role="alert" tabIndex={-1} ref={ref}>
      <b>{t('err_summary')}</b>
      <ul>
        {items.map(it => (
          <li key={it.id}>
            <a href={'#' + it.id} onClick={e => { e.preventDefault(); document.getElementById(it.id)?.focus(); }}>{it.msg}</a>
          </li>
        ))}
      </ul>
    </div>
  );
}
