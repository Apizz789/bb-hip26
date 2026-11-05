import { useRef, type KeyboardEvent, type ReactNode } from 'react';

export interface ChoiceItem { id: string; label: ReactNode; disabled?: boolean; title?: string }

/**
 * Radio-like chip group (dates and times). Arrow keys move focus and select, as in the prototype.
 * Items are buttons with role="radio", so assistive technology announces the group.
 */
export function ChoiceGroup({ id, label, items, selected, onSelect, groupClass, itemClass }: {
  id: string;
  label: string;
  items: ChoiceItem[];
  selected: string | null;
  onSelect: (id: string) => void;
  groupClass: string;
  itemClass: string;
}) {
  const ref = useRef<HTMLDivElement>(null);

  const onKeyDown = (e: KeyboardEvent<HTMLDivElement>) => {
    if (!['ArrowRight', 'ArrowDown', 'ArrowLeft', 'ArrowUp'].includes(e.key)) return;
    const nodes: HTMLButtonElement[] = ref.current
      ? Array.from(ref.current.querySelectorAll<HTMLButtonElement>('[role="radio"]:not([disabled])'))
      : [];
    const i = nodes.indexOf(e.target as HTMLButtonElement);
    if (i < 0) return;
    e.preventDefault();
    const next = (e.key === 'ArrowRight' || e.key === 'ArrowDown') ? (i + 1) % nodes.length : (i - 1 + nodes.length) % nodes.length;
    nodes[next].focus();
    onSelect(nodes[next].dataset.id ?? '');
  };

  return (
    <div className={groupClass} role="radiogroup" aria-label={label} ref={ref} onKeyDown={onKeyDown} id={id} tabIndex={-1}>
      {items.map(item => (
        <button key={item.id} type="button" role="radio" data-id={item.id}
          aria-checked={selected === item.id} className={itemClass}
          disabled={item.disabled} aria-disabled={item.disabled || undefined} title={item.title}
          onClick={() => onSelect(item.id)}>
          {item.label}
        </button>
      ))}
    </div>
  );
}
