import { useState, CSSProperties } from 'react';
import { CircularProgress } from '@mui/material';
import { MdCheck, MdClose, MdOutlineStickyNote2 } from 'react-icons/md';
import { FiEdit3 } from 'react-icons/fi';
import api from '../../api';
import Card from '../Card/Card';
import { apiErrorsTypes } from '../../constants/errorTypes';
import { ORDER_THEMES, getOrderTheme } from '../../constants/orderThemes';

const MAX_NOTE_LENGTH = 600;

// Long notes are still saved in full, only the collapsed preview (shown before
// "تعديل" is clicked) is clamped so one order card can't push the rest of the
// list down the page.
const clampStyle: CSSProperties = {
  display: '-webkit-box',
  WebkitLineClamp: 5,
  WebkitBoxOrient: 'vertical',
  overflow: 'hidden',
};

type Props = {
  orderId: string
  note?: string
  themeId?: string
  onSaved: (customization: { note?: string, theme?: string }) => void
}

const OrderNoteCustomizer = (props: Props) => {
  const { orderId, note, themeId, onSaved } = props;
  const hasCustomization = !!note;

  const [isEditing, setIsEditing] = useState(false);
  const [draftNote, setDraftNote] = useState(note || '');
  const [draftTheme, setDraftTheme] = useState(themeId || ORDER_THEMES[0].id);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState('');

  const activeTheme = getOrderTheme(themeId);

  const startEditing = () => {
    setDraftNote(note || '');
    setDraftTheme(themeId || ORDER_THEMES[0].id);
    setError('');
    setIsEditing(true);
  }

  const save = async () => {
    try {
      setIsSaving(true);
      setError('');
      const trimmedNote = draftNote.trim();
      await api.updateOrderCustomization(orderId, { note: trimmedNote, theme: draftTheme });
      onSaved({ note: trimmedNote, theme: draftTheme });
      setIsEditing(false);
    } catch (err: any) {
      setError(apiErrorsTypes[err?.data?.message] || 'حدث خطأ اثناء الحفظ، الرجاء المحاولة مرة اخرى');
    }
    setIsSaving(false);
  }

  const remove = async () => {
    try {
      setIsSaving(true);
      setError('');
      // Only clearing the note here, the color the customer already picked is left
      // untouched (the API keeps the existing theme when none is sent).
      await api.updateOrderCustomization(orderId, { note: '' });
      onSaved({ note: '', theme: themeId });
      setIsEditing(false);
    } catch (err: any) {
      setError(apiErrorsTypes[err?.data?.message] || 'حدث خطأ اثناء الحذف، الرجاء المحاولة مرة اخرى');
    }
    setIsSaving(false);
  }

  if (!isEditing) {
    return (
      <Card className="rounded-2xl mb-5 p-0 overflow-hidden">
        {hasCustomization ? (
          <div style={{ background: activeTheme.gradient }} className="p-5">
            <div className="flex items-start justify-between gap-4">
              <button
                type="button"
                onClick={startEditing}
                className="shrink-0 flex items-center gap-1.5 rounded-full bg-white/20 hover:bg-white/30 backdrop-blur-sm px-3 py-1.5 text-xs font-bold transition-colors active:scale-[0.98]"
                style={{ color: activeTheme.text }}
              >
                <FiEdit3 size={14} />
                تعديل
              </button>
              <div className="flex-1 text-right min-w-0">
                <div className="flex items-center justify-end gap-2 mb-2">
                  <h3 className="text-sm font-bold" style={{ color: activeTheme.text }}>ملاحظتي على الطلبية</h3>
                  <MdOutlineStickyNote2 size={18} style={{ color: activeTheme.text }} />
                </div>
                <p className="text-sm leading-relaxed break-words" style={{ color: activeTheme.text, ...clampStyle }}>{note}</p>
              </div>
            </div>
          </div>
        ) : (
          <button
            type="button"
            onClick={startEditing}
            className="w-full flex items-center justify-between gap-3 p-5 text-right hover:bg-gray-50 transition-colors active:scale-[0.99]"
          >
            <span className="shrink-0 text-xs font-bold text-green-700 bg-green-50 rounded-full px-3 py-1.5">إضافة</span>
            <span className="flex-1 flex items-center justify-end gap-2 min-w-0">
              <span className="min-w-0">
                <span className="block text-sm font-bold text-zinc-700">أضف ملاحظة ولون مخصص لطلبيتك</span>
                <span className="block text-xs text-gray-400 mt-0.5">ملاحظة خاصة بك فقط تساعدك على تمييز هذه الطلبية بين طلبياتك</span>
              </span>
              <MdOutlineStickyNote2 size={20} className="text-gray-400 shrink-0" />
            </span>
          </button>
        )}
      </Card>
    )
  }

  return (
    <Card className="rounded-2xl mb-5 text-right">
      <h3 className="text-base font-bold text-zinc-800 mb-1">ملاحظتي ولون الطلبية</h3>
      <p className="text-xs text-gray-400 mb-4">ملاحظة خاصة بك فقط، تساعدك على تذكر هذه الطلبية وتمييزها بسهولة بين طلبياتك</p>

      <textarea
        value={draftNote}
        onChange={(e) => setDraftNote(e.target.value.slice(0, MAX_NOTE_LENGTH))}
        placeholder="اكتب ملاحظة خاصة بك على هذه الطلبية، مثال: طلبية اشتريتها من علي بابا بضاعة قطع غيار"
        rows={5}
        disabled={isSaving}
        className="w-full resize-none rounded-xl border border-gray-300 bg-gray-50 p-3 text-sm text-gray-900 text-right placeholder:text-gray-400 focus:border-green-500 focus:ring-green-500 focus:outline-none disabled:opacity-60"
      />
      <p className="text-xs text-gray-400 mt-1 mb-4">{draftNote.length}/{MAX_NOTE_LENGTH}</p>

      <p className="text-sm font-bold text-zinc-700 mb-2">اختر لون الطلبية</p>
      <div className="flex flex-wrap gap-3 justify-end mb-5">
        {ORDER_THEMES.map(theme => (
          <button
            key={theme.id}
            type="button"
            aria-label={theme.label}
            onClick={() => setDraftTheme(theme.id)}
            disabled={isSaving}
            className="w-9 h-9 rounded-full transition-transform active:scale-90 disabled:opacity-60"
            style={{
              background: theme.gradient,
              outline: draftTheme === theme.id ? `2px solid ${theme.accent}` : 'none',
              outlineOffset: '2px',
              boxShadow: draftTheme === theme.id ? '0 0 0 2px white inset' : 'none',
            }}
          >
            {draftTheme === theme.id && <MdCheck className="mx-auto" color={theme.text} size={18} />}
          </button>
        ))}
      </div>

      {error && <p className="text-xs text-red-600 mb-3">{error}</p>}

      <div className="flex items-center justify-end gap-2">
        {hasCustomization &&
          <button
            type="button"
            onClick={remove}
            disabled={isSaving}
            className="text-xs font-bold text-red-600 hover:text-red-700 px-3 py-2 disabled:opacity-60"
          >
            حذف الملاحظة
          </button>
        }
        <button
          type="button"
          onClick={() => setIsEditing(false)}
          disabled={isSaving}
          className="flex items-center gap-1 text-sm font-bold text-gray-500 hover:text-gray-700 px-4 py-2 rounded-lg disabled:opacity-60"
        >
          <MdClose size={16} />
          إلغاء
        </button>
        <button
          type="button"
          onClick={save}
          disabled={isSaving}
          className="flex items-center gap-1.5 text-sm font-bold text-white bg-green-600 hover:bg-green-700 px-5 py-2 rounded-lg transition-colors active:scale-[0.98] disabled:opacity-60"
        >
          {isSaving ? <CircularProgress size={16} sx={{ color: '#ffffff' }} /> : <MdCheck size={18} />}
          حفظ
        </button>
      </div>
    </Card>
  )
}

export default OrderNoteCustomizer;
