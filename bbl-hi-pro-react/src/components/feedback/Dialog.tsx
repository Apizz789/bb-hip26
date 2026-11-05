import { useEffect, useRef, type ReactNode } from 'react';
import { Icon } from '../icons/Icon';
import { useLang } from '../../app/LanguageProvider';

interface DialogProps {
  title: string;
  onClose: () => void;
  children: ReactNode;
  footer?: ReactNode;
  /** Element to focus on open. Defaults to the first footer button. */
  initialFocus?: () => HTMLElement | null;
  /** Used by tests and CSS hooks. */
  id?: string;
}

const FOCUSABLE = 'button:not([disabled]), a[href], input, select, textarea';

/** Accessible modal: focus moves in on open, Tab is trapped, Escape closes, focus returns on close. */
export function Dialog({ title, onClose, children, footer, initialFocus, id = 'mTitle' }: DialogProps) {
  const { t } = useLang();
  const boxRef = useRef<HTMLDivElement>(null);
  const closeRef = useRef(onClose);
  closeRef.current = onClose;

  useEffect(() => {
    const returnTo = document.activeElement as HTMLElement | null;
    const box = boxRef.current;
    const start = initialFocus?.() ?? box?.querySelector<HTMLElement>('.modal-actions .btn') ?? box?.querySelector<HTMLElement>('.modal-x');
    start?.focus();

    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        closeRef.current();
        return;
      }
      if (e.key !== 'Tab' || !box) return;
      const items: HTMLElement[] = Array.from(box.querySelectorAll<HTMLElement>(FOCUSABLE));
      if (!items.length) return;
      const first = items[0];
      const last = items[items.length - 1];
      if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last.focus(); }
      else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus(); }
    };
    document.addEventListener('keydown', onKey);
    return () => {
      document.removeEventListener('keydown', onKey);
      returnTo?.focus?.();
    };
    // Focus handling runs once per open; initialFocus is captured at open time.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div className="modal" onMouseDown={e => { if (e.target === e.currentTarget) onClose(); }}>
      <div className="modal-box" role="dialog" aria-modal="true" aria-labelledby={id} ref={boxRef}>
        <button className="modal-x" type="button" onClick={onClose} aria-label={t('close')}>
          <Icon name="i-close" />
        </button>
        <h3 id={id}>{title}</h3>
        <div className="modal-body">{children}</div>
        {footer && <div className="modal-actions">{footer}</div>}
      </div>
    </div>
  );
}
