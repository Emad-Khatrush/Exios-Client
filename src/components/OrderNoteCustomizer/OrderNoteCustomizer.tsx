import { useState } from 'react';
import { Check, Loader2, PenLine, StickyNote } from 'lucide-react';
import api from '../../api';
import { apiErrorsTypes } from '../../constants/errorTypes';
import { ORDER_THEMES, getOrderTheme } from '../../constants/orderThemes';

const MAX_NOTE_LENGTH = 600;

type Props = {
  orderId: string
  note?: string
  themeId?: string
  onSaved: (customization: { note?: string, theme?: string }) => void
  // While editing: the colour picked so far, so the page can show it live (undefined = stop previewing)
  onPreview?: (themeId?: string | null) => void
}

/* The customer's own note and colour for an order: only they see it, and it marks the order in the list */
const OrderNoteCustomizer = ({ orderId, note, themeId, onSaved, onPreview }: Props) => {
  const [editing, setEditing] = useState(false);
  const [draftNote, setDraftNote] = useState(note || '');
  const [draftTheme, setDraftTheme] = useState(themeId || ORDER_THEMES[0].id);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const theme = getOrderTheme(editing ? draftTheme : themeId);

  const start = () => {
    setDraftNote(note || '');
    setDraftTheme(themeId || ORDER_THEMES[0].id);
    setError('');
    setEditing(true);
    onPreview?.(themeId || ORDER_THEMES[0].id);
  };
  const pick = (id: string) => { setDraftTheme(id); onPreview?.(id); };
  const cancel = () => { setEditing(false); onPreview?.(undefined); };

  const submit = async (body: { note: string, theme?: string }, failText: string) => {
    try {
      setSaving(true);
      setError('');
      await api.updateOrderCustomization(orderId, body);
      onSaved({ note: body.note, theme: body.theme ?? themeId });
      setEditing(false);
      onPreview?.(undefined);
    } catch (err: any) {
      setError(apiErrorsTypes[err?.data?.message] || failText);
    }
    setSaving(false);
  };

  if (!editing) {
    return note ? (
      <section className="oi-card oi-note" style={{ ['--note' as any]: theme.accent }} aria-label="ملاحظتي">
        <div className="oi-note__head">
          <span><StickyNote size={16} aria-hidden /> ملاحظتي</span>
          <button type="button" className="oi-link" onClick={start}><PenLine size={14} aria-hidden /> تعديل</button>
        </div>
        <p className="oi-note__text">{note}</p>
      </section>
    ) : (
      <button type="button" className="oi-card oi-note-add" onClick={start}>
        <span className="oi-note-add__icon" aria-hidden><StickyNote size={18} /></span>
        <span>
          <b>أضف ملاحظة ولوناً</b>
          <small>ملاحظة تراها أنت فقط، تميّز هذه الطلبية في قائمتك.</small>
        </span>
      </button>
    );
  }

  return (
    <section className="oi-card oi-note-edit" style={{ ['--note' as any]: theme.accent }} aria-labelledby="oi-note-title">
      <h2 id="oi-note-title" className="oi-card__title">ملاحظتي ولون الطلبية</h2>
      <textarea
        value={draftNote}
        onChange={(e) => setDraftNote(e.target.value.slice(0, MAX_NOTE_LENGTH))}
        placeholder="مثال: قطع غيار من علي بابا، للمحل"
        rows={4}
        disabled={saving}
        aria-label="الملاحظة"
      />
      <p className="oi-note-edit__count"><bdi dir="ltr">{draftNote.length}/{MAX_NOTE_LENGTH}</bdi></p>

      <p className="oi-note-edit__label" id="oi-note-colors">اللون</p>
      <div className="oi-swatches" role="radiogroup" aria-labelledby="oi-note-colors">
        {ORDER_THEMES.map((t) => (
          <button
            key={t.id}
            type="button"
            role="radio"
            aria-checked={draftTheme === t.id}
            aria-label={t.label}
            className={draftTheme === t.id ? 'is-on' : ''}
            style={{ background: t.gradient }}
            onClick={() => pick(t.id)}
            disabled={saving}
          >
            {draftTheme === t.id && <Check size={16} color={t.text} aria-hidden />}
          </button>
        ))}
      </div>

      {error && <p className="oi-error" role="alert">{error}</p>}

      <div className="oi-note-edit__actions">
        {note && (
          <button type="button" className="oi-link is-danger" onClick={() => submit({ note: '' }, 'لم تُحذف الملاحظة. حاول مرة أخرى.')} disabled={saving}>
            حذف الملاحظة
          </button>
        )}
        <span className="oi-grow" />
        <button type="button" className="oi-btn oi-btn--quiet" onClick={cancel} disabled={saving}>إلغاء</button>
        <button
          type="button"
          className="oi-btn oi-btn--primary"
          onClick={() => submit({ note: draftNote.trim(), theme: draftTheme }, 'لم تُحفظ الملاحظة. حاول مرة أخرى.')}
          disabled={saving}
        >
          {saving ? <Loader2 size={17} className="oi-spin" aria-hidden /> : <Check size={17} aria-hidden />} حفظ
        </button>
      </div>
    </section>
  );
};

export default OrderNoteCustomizer;
