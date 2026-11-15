import { KeyboardEvent, ReactNode, useEffect, useId, useMemo, useRef, useState } from 'react';
import { Check, ChevronDown, Search, X } from 'lucide-react';
import './picker.css';

export type PickerOption = {
  value: string
  label: string
  hint?: string // shown to the side (a dialling code, an office)
  icon?: ReactNode
  keywords?: string // extra text the search also matches (an English name, a code)
}

type Props = {
  id?: string
  value: string
  options: PickerOption[]
  onChange: (value: string) => void
  title: string // heading of the list, and its accessible name
  placeholder?: string
  searchable?: boolean
  searchPlaceholder?: string
  invalid?: boolean
  describedBy?: string
  disabled?: boolean
  className?: string
  // What the closed button shows; the selected option's icon and label by default
  renderValue?: (option: PickerOption | undefined) => ReactNode
  dataField?: string
}

// Arabic letters that are typed several ways, folded so a search finds them either way
const fold = (s: string) => s.toLowerCase()
  .replace(/[أإآ]/g, 'ا').replace(/ة/g, 'ه').replace(/ى/g, 'ي').replace(/[ً-ْ]/g, '')
  .trim();

/* A list to pick one thing from. Opens under its button on a wide screen and as a sheet from the
   bottom on a phone; a search box for long lists; arrows, Enter, Escape and typing to jump. */
const Picker = ({
  id, value, options, onChange, title, placeholder = 'اختر', searchable = false, searchPlaceholder = 'ابحث',
  invalid, describedBy, disabled, className = '', renderValue, dataField,
}: Props) => {
  const auto = useId().replace(/:/g, '');
  const listId = `pk-list-${auto}`;
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState('');
  const [active, setActive] = useState(0);
  const wrapRef = useRef<HTMLDivElement>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const listRef = useRef<HTMLUListElement>(null);
  const searchRef = useRef<HTMLInputElement>(null);
  const typed = useRef({ text: '', at: 0 });

  const selected = options.find((o) => o.value === value);
  const shown = useMemo(() => {
    const q = fold(query);
    if (!q) return options;
    return options.filter((o) => fold(`${o.label} ${o.hint || ''} ${o.keywords || ''}`).includes(q));
  }, [options, query]);

  const close = (refocus = true) => {
    setOpen(false);
    setQuery('');
    if (refocus) triggerRef.current?.focus();
  };

  const openList = () => {
    if (disabled) return;
    setActive(Math.max(0, options.findIndex((o) => o.value === value)));
    setOpen(true);
  };

  const choose = (o: PickerOption) => {
    onChange(o.value);
    close();
  };

  // Focus the search (or the list) once open; keep the chosen one in view
  useEffect(() => {
    if (!open) return;
    window.setTimeout(() => (searchable ? searchRef.current : listRef.current)?.focus({ preventScroll: true }), 0);
  }, [open, searchable]);
  useEffect(() => {
    if (!open) return;
    listRef.current?.querySelector<HTMLElement>(`[data-i="${active}"]`)?.scrollIntoView({ block: 'nearest' });
  }, [active, open, shown]);
  useEffect(() => { setActive(0); }, [query]);

  // A tap outside closes it; on a phone the page behind the sheet does not scroll
  useEffect(() => {
    if (!open) return undefined;
    const onDown = (e: MouseEvent | TouchEvent) => {
      if (!wrapRef.current?.contains(e.target as Node)) close(false);
    };
    document.addEventListener('mousedown', onDown);
    document.addEventListener('touchstart', onDown);
    const sheet = window.matchMedia('(max-width: 640px)').matches;
    const overflow = document.body.style.overflow;
    if (sheet) document.body.style.overflow = 'hidden';
    return () => {
      document.removeEventListener('mousedown', onDown);
      document.removeEventListener('touchstart', onDown);
      document.body.style.overflow = overflow;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  const onKeys = (e: KeyboardEvent) => {
    if (e.key === 'ArrowDown') { e.preventDefault(); setActive((i) => Math.min(shown.length - 1, i + 1)); return; }
    if (e.key === 'ArrowUp') { e.preventDefault(); setActive((i) => Math.max(0, i - 1)); return; }
    if (e.key === 'Home') { e.preventDefault(); setActive(0); return; }
    if (e.key === 'End') { e.preventDefault(); setActive(shown.length - 1); return; }
    if (e.key === 'Enter') { e.preventDefault(); if (shown[active]) choose(shown[active]); return; }
    if (e.key === 'Escape') { e.preventDefault(); close(); return; }
    if (e.key === 'Tab') { close(false); return; }
    // No search box: typing jumps to the first option starting with what was typed
    if (!searchable && e.key.length === 1) {
      const now = Date.now();
      typed.current = { text: (now - typed.current.at < 700 ? typed.current.text : '') + e.key, at: now };
      const i = shown.findIndex((o) => fold(o.label).startsWith(fold(typed.current.text)));
      if (i >= 0) setActive(i);
    }
  };

  const onTriggerKeys = (e: KeyboardEvent) => {
    if (['ArrowDown', 'ArrowUp', 'Enter', ' '].includes(e.key)) { e.preventDefault(); openList(); }
  };

  return (
    <div ref={wrapRef} className={`pk ${open ? 'is-open' : ''} ${className}`}>
      <button
        ref={triggerRef}
        id={id}
        type="button"
        className={`pk-trigger ${invalid ? 'is-invalid' : ''}`}
        onClick={() => (open ? close() : openList())}
        onKeyDown={onTriggerKeys}
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-controls={open ? listId : undefined}
        aria-invalid={invalid || undefined}
        aria-describedby={describedBy}
        aria-label={selected ? `${title}: ${selected.label}` : title}
        disabled={disabled}
        data-field={dataField}
      >
        {renderValue ? renderValue(selected) : (
          <>
            {selected?.icon && <span className="pk-trigger__icon">{selected.icon}</span>}
            <span className={`pk-trigger__text ${selected ? '' : 'is-placeholder'}`}>{selected ? selected.label : placeholder}</span>
            {selected?.hint && <span className="pk-trigger__hint">{selected.hint}</span>}
          </>
        )}
        <ChevronDown size={18} className="pk-trigger__chev" aria-hidden />
      </button>

      {open && (
        <>
          <div className="pk-scrim" aria-hidden onClick={() => close(false)} />
          <div className="pk-pop" dir="rtl">
            <div className="pk-pop__head">
              <span className="pk-pop__grab" aria-hidden />
              <b>{title}</b>
              <button type="button" className="pk-pop__close" onClick={() => close()} aria-label="إغلاق"><X size={18} /></button>
            </div>
            {searchable && (
              <label className="pk-search">
                <Search size={17} aria-hidden />
                <input
                  ref={searchRef}
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  onKeyDown={onKeys}
                  placeholder={searchPlaceholder}
                  aria-label={searchPlaceholder}
                  aria-controls={listId}
                  aria-activedescendant={shown[active] ? `${listId}-${active}` : undefined}
                  autoComplete="off"
                  spellCheck={false}
                />
              </label>
            )}
            <ul
              ref={listRef}
              id={listId}
              role="listbox"
              aria-label={title}
              tabIndex={-1}
              onKeyDown={searchable ? undefined : onKeys}
              aria-activedescendant={!searchable && shown[active] ? `${listId}-${active}` : undefined}
              className="pk-list"
            >
              {shown.map((o, i) => (
                <li
                  key={o.value}
                  id={`${listId}-${i}`}
                  data-i={i}
                  role="option"
                  aria-selected={o.value === value}
                  className={`pk-opt ${i === active ? 'is-active' : ''} ${o.value === value ? 'is-selected' : ''}`}
                  onMouseMove={() => i !== active && setActive(i)}
                  onClick={() => choose(o)}
                >
                  {o.icon && <span className="pk-opt__icon">{o.icon}</span>}
                  <span className="pk-opt__label">{o.label}</span>
                  {o.hint && <span className="pk-opt__hint">{o.hint}</span>}
                  <Check size={17} className="pk-opt__check" aria-hidden />
                </li>
              ))}
              {!shown.length && <li className="pk-empty" role="presentation">لا نتائج لـ «{query}»</li>}
            </ul>
          </div>
        </>
      )}
    </div>
  );
};

export default Picker;
