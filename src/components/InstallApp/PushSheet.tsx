import { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import { Bell, BellRing, Check, Gift, PackageCheck, Plane, X } from 'lucide-react';
import './install.css';

/* Right after the app is installed and opened from the home screen: one tap to turn notifications on.
   The phone's own permission question only opens from a tap (iPhone requires it), so this sheet asks
   first, in the customer's words, and its button opens it. PushCard decides when to show it. */

const BENEFITS = [
  { icon: PackageCheck, text: 'وصول طردك لمخزننا' },
  { icon: Plane, text: 'شحن طلبيتك إلى ليبيا' },
  { icon: BellRing, text: 'عندما تصبح جاهزة للاستلام' },
  { icon: Gift, text: 'نقاطك ومستواك الجديد' },
];

type Props = {
  onEnable: () => Promise<boolean>
  onClose: () => void
}

export const PushSheet = ({ onEnable, onClose }: Props) => {
  const [state, setState] = useState<'ask' | 'busy' | 'done'>('ask');

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape' && state !== 'busy') onClose(); };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onClose, state]);

  // Turned on: it says so for a moment, then goes away by itself
  useEffect(() => {
    if (state !== 'done') return undefined;
    const t = window.setTimeout(onClose, 2600);
    return () => window.clearTimeout(t);
  }, [state, onClose]);

  const enable = async () => {
    setState('busy');
    const ok = await onEnable().catch(() => false);
    if (ok) setState('done');
    else onClose();
  };

  return createPortal(
    <div className="ia-sheet ps-sheet" role="dialog" aria-modal="true" aria-labelledby="ps-title" dir="rtl" onClick={() => state !== 'busy' && onClose()}>
      <div className="ia-sheet__panel" onClick={(e) => e.stopPropagation()}>
        {state !== 'done' && (
          <button type="button" className="ia-sheet__close" onClick={onClose} disabled={state === 'busy'} aria-label="إغلاق"><X size={20} /></button>
        )}

        {state === 'done' ? (
          <div className="ps-done" role="status">
            <span className="ps-bell is-done" aria-hidden><Check size={34} strokeWidth={2.6} /></span>
            <h2 id="ps-title">تم تفعيل الإشعارات</h2>
            <p className="ia-sheet__lead">سنبلغك على جوالك بكل جديد عن شحناتك.</p>
          </div>
        ) : (
          <>
            <span className="ps-bell" aria-hidden><Bell size={34} strokeWidth={2.2} /><i /></span>
            <h2 id="ps-title">خلّيك على علم بشحناتك</h2>
            <p className="ia-sheet__lead">فعّل الإشعارات، ونبلغك على جوالك فور ما يتغيّر شيء:</p>
            <ul className="ia-benefits ps-benefits">
              {BENEFITS.map(({ icon: Icon, text }) => (
                <li key={text}><Icon size={18} aria-hidden /> {text}</li>
              ))}
            </ul>
            <button type="button" className="ia-btn ia-sheet__ok" onClick={enable} disabled={state === 'busy'} aria-busy={state === 'busy'}>
              <Bell size={18} aria-hidden /> {state === 'busy' ? 'لحظة…' : 'فعّل الإشعارات'}
            </button>
            <p className="ps-hint">بعدها اختر «السماح» في رسالة الجوال.</p>
            <button type="button" className="ia-sheet__later" onClick={onClose} disabled={state === 'busy'}>ليس الآن</button>
          </>
        )}
      </div>
    </div>,
    document.body,
  );
};
