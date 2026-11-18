import { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import { Bell, Download, MoreHorizontal, Share, SquarePlus, X, Zap } from 'lucide-react';
import './install.css';

/* The install sheet, used by the home page card and the landing page.
   - Android / computer: one button opens the phone's own install dialog (two taps in all).
   - iPhone: Apple lets no website install itself, so the sheet shows the taps to do, with an
     arrow pointing at where to tap first on this phone. (Tried on QA: the share sheet a page opens
     itself, Web Share, has no "Add to Home Screen" on iPhone, so there is no shortcut button.) */

// Where to tap first, on this phone:
// - 'menu': Safari 26 (iOS 26) keeps Share inside the ⋯ button at the bottom right
// - 'bottom': older Safari on iPhone, the Share button in the middle of the bottom bar
// - 'top': iPad, and Chrome/Firefox/Edge on iPhone, Share at the top right
// iOS 26 still reports an iOS 18 system in its user agent; Safari's own "Version/26" tells it apart.
type Place = 'menu' | 'bottom' | 'top';
const sharePlace = (): Place => {
  const ua = navigator.userAgent;
  const ipad = /ipad/i.test(ua) || (ua.includes('Macintosh') && navigator.maxTouchPoints > 1);
  if (ipad || /crios|fxios|edgios/i.test(ua)) return 'top';
  const safari = Number((ua.match(/Version\/(\d+)/) || [])[1] || 0);
  return safari >= 26 ? 'menu' : 'bottom';
};
const ARROW: Record<Place, string> = { menu: '↘', bottom: '↓', top: '↗' };

const BENEFITS = [
  { icon: Zap, text: 'يفتح بلمسة من شاشة جوالك، بدون متصفح' },
  { icon: Bell, text: 'إشعار على جوالك عندما تتحرك شحنتك أو تصبح جاهزة' },
];

type SheetProps = { mode: 'prompt' | 'ios', onInstall: () => Promise<boolean>, onClose: (later: boolean) => void };

export const InstallSheet = ({ mode, onInstall, onClose }: SheetProps) => {
  const [state, setState] = useState<'ask' | 'busy' | 'done'>('ask');
  const place = sharePlace();

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(true); };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onClose]);

  const install = async () => {
    setState('busy');
    const ok = await onInstall().catch(() => false);
    if (ok) setState('done');
    else onClose(true);
  };

  return createPortal(
    <div className="ia-sheet" role="dialog" aria-modal="true" aria-labelledby="ia-sheet-title" dir="rtl" onClick={() => onClose(true)}>
      {/* iPhone: the arrow points at the share button, outside the sheet */}
      {mode === 'ios' && state === 'ask' && (
        <div className={`ia-pointer ia-pointer--${place}`} aria-hidden>
          <span className="ia-pointer__label">من هنا</span>
          <span className="ia-pointer__arrow">{ARROW[place]}</span>
        </div>
      )}
      <div className={`ia-sheet__panel${mode === 'ios' && place !== 'top' && state === 'ask' ? ' ia-sheet__panel--mid' : ''}`} onClick={(e) => e.stopPropagation()}>
        <button type="button" className="ia-sheet__close" onClick={() => onClose(true)} aria-label="إغلاق"><X size={20} /></button>
        <img src="/icon-192.png" alt="" className="ia-sheet__icon" width={64} height={64} />

        {state === 'done' ? (
          <>
            <h2 id="ia-sheet-title">تم تثبيت التطبيق ✓</h2>
            <p className="ia-sheet__lead">ستجد أيقونة Exios على شاشة جوالك. افتحه منها في المرة القادمة.</p>
            <button type="button" className="ia-btn ia-sheet__ok" onClick={() => onClose(false)}>تمام</button>
          </>
        ) : (
          <>
            <h2 id="ia-sheet-title">تثبّت تطبيق Exios على جوالك؟</h2>
            <ul className="ia-benefits">
              {BENEFITS.map(({ icon: Icon, text }) => (
                <li key={text}><Icon size={18} aria-hidden /> {text}</li>
              ))}
            </ul>

            {mode === 'prompt' ? (
              <button type="button" className="ia-btn ia-sheet__ok" onClick={install} disabled={state === 'busy'} aria-busy={state === 'busy'}>
                <Download size={18} aria-hidden /> {state === 'busy' ? 'لحظة…' : 'نعم، ثبّت التطبيق'}
              </button>
            ) : (
              <ol className="ia-steps">
                {place === 'menu' ? (
                  <>
                    <li>
                      <span className="ia-steps__n">1</span>
                      <span>اضغط <MoreHorizontal size={18} className="ia-steps__ic" aria-label="المزيد" /> <b>أسفل يمين الشاشة</b></span>
                    </li>
                    <li>
                      <span className="ia-steps__n">2</span>
                      <span>اضغط <b>مشاركة</b> <Share size={18} className="ia-steps__ic" aria-hidden /></span>
                    </li>
                  </>
                ) : (
                  <li>
                    <span className="ia-steps__n">1</span>
                    <span>اضغط زر المشاركة <Share size={18} className="ia-steps__ic" aria-label="مشاركة" /> {place === 'bottom' ? 'أسفل الشاشة' : 'أعلى يمين الشاشة'}</span>
                  </li>
                )}
                <li>
                  <span className="ia-steps__n">{place === 'menu' ? 3 : 2}</span>
                  <span>اختر <b>إضافة إلى الشاشة الرئيسية</b> <SquarePlus size={18} className="ia-steps__ic" aria-hidden /> ثم <b>إضافة</b></span>
                </li>
              </ol>
            )}

            <button type="button" className="ia-sheet__later" onClick={() => onClose(true)}>ليس الآن</button>
          </>
        )}
      </div>
    </div>,
    document.body,
  );
};
