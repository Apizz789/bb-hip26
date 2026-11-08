import { useLang } from '../../app/LanguageProvider';
import { useStore } from '../../app/StoreProvider';
import { ACCOUNTS } from '../../data/mock';
import { maskedNumber } from '../../domain/accounts';
import { tx } from '../../i18n/extra';
import { money } from '../../utils/format';

/** Account picker. The chosen account drives the home and goals pages. The eye toggle hides balances. */
export function AccountCards() {
  const { lang } = useLang();
  const { state, dispatch } = useStore();
  const hidden = state.hideBalances;
  return (
    <div className="acct-wrap">
      <div className="acct-head">
        <div>
          <h2 id="acctTitle">{tx(lang, 'acct_title')}</h2>
          <p className="muted small">{tx(lang, 'acct_note')}</p>
        </div>
        <button type="button" className="btn ghost eye-btn" aria-pressed={hidden} onClick={() => dispatch({ type: 'balances/toggle' })}>
          <EyeIcon off={hidden} />
          <span>{hidden ? tx(lang, 'acct_show') : tx(lang, 'acct_hide')}</span>
        </button>
      </div>
      <div className="acct-row" role="group" aria-label={tx(lang, 'acct_group')}>
        {ACCOUNTS.map(a => {
          const on = a.id === state.accountId;
          return (
            <button key={a.id} type="button" aria-pressed={on} data-acct={a.id}
              className={'acct' + (on ? ' on' : '')} onClick={() => dispatch({ type: 'account/select', id: a.id })}>
              <span className="acct-name">{a.name[lang]}</span>
              <span className="acct-no num">{maskedNumber(a)}</span>
              <span className="acct-bal num">{hidden ? '••••••' : money(a.balance)}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
}

function EyeIcon({ off }: { off: boolean }) {
  return (
    <svg className="ico" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7S2 12 2 12z" />
      <circle cx="12" cy="12" r="3" />
      {off && <path d="M3 3l18 18" />}
    </svg>
  );
}
