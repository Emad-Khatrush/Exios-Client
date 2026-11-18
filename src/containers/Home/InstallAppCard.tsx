import { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import { Bell, Download, MoreHorizontal, Share, Smartphone, SquarePlus, X, Zap } from 'lucide-react';
import { useInstallApp } from '../../utils/installApp';

/* Installing the app, made as short as each phone allows.
   - A sheet asks at the right moment, by itself: a few seconds after the customer reaches the home
     page, once; "not now" waits two weeks before asking again. The card on the home page opens the
     same sheet any time.
   - Android / computer: one button opens the phone's own install dialog (two taps in all).
   - iPhone: Apple lets no website install itself, so the sheet shows the two taps to do, with an
     arrow pointing at the share button where it is on this phone. */
const DISMISS_KEY = 'exios-install-dismissed';
const DISMISS_DAYS = 30;
const ASKED_KEY = 'exios-install-asked';
const ASK_AGAIN_DAYS = 14;
const ASK_AFTER_MS = 3000;
const DAY = 24 * 60 * 60 * 1000;

const readTime = (key: string) => { try { return Number(localStorage.getItem(key)) || 0; } catch { return 0; } };
const writeTime = (key: string) => { try { localStorage.setItem(key, String(Date.now())); } catch { /* private mode */ } };

export const wasDismissed = () => Date.now() - readTime(DISMISS_KEY) < DISMISS_DAYS * DAY;
const askedRecently = () => Date.now() - readTime(ASKED_KEY) < ASK_AGAIN_DAYS * DAY;

// Where the share button is: Safari on iPhone has it at the bottom; on iPad, and in Chrome or
// Firefox on iPhone, it is at the top
const sharePlace = (): 'bottom' | 'top' => {
  const ua = navigator.userAgent;
  const ipad = /ipad/i.test(ua) || (ua.includes('Macintosh') && navigator.maxTouchPoints > 1);
  return ipad || /crios|fxios|edgios/i.test(ua) ? 'top' : 'bottom';
};

const BENEFITS = [
  { icon: Zap, text: 'يفتح بلمسة من شاشة جوالك، بدون متصفح' },
  { icon: Bell, text: 'إشعار على جوالك عندما تتحرك شحنتك أو تصبح جاهزة' },
];

type SheetProps = { mode: 'prompt' | 'ios', onInstall: () => Promise<boolean>, onClose: (later: boolean) => void };

const InstallSheet = ({ mode, onInstall, onClose }: SheetProps) => {
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
          <span className="ia-pointer__arrow">{place === 'bottom' ? '↓' : '↑'}</span>
        </div>
      )}
      <div className={`ia-sheet__panel${mode === 'ios' && place === 'bottom' && state === 'ask' ? ' ia-sheet__panel--mid' : ''}`} onClick={(e) => e.stopPropagation()}>
        <button type="button" className="ia-sheet__close" onClick={() => onClose(true)} aria-label="إغلاق"><X size={20} /></button>
        <img src="/icon-192.png" alt="" className="ia-sheet__icon" width={64} height={64} />

        {state === 'done' ? (
          <>
            <h2 id="ia-sheet-title">تم تثبيت التطبيق ✓</h2>
            <p className="ia-sheet__lead">ستجد أيقونة Exios على شاشة جوالك. افتحه منها في المرة القادمة.</p>
            <button type="button" className="hm-btn hm-btn--primary ia-sheet__ok" onClick={() => onClose(false)}>تمام</button>
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
              <button type="button" className="hm-btn hm-btn--primary ia-sheet__ok" onClick={install} disabled={state === 'busy'} aria-busy={state === 'busy'}>
                <Download size={18} aria-hidden /> {state === 'busy' ? 'لحظة…' : 'نعم، ثبّت التطبيق'}
              </button>
            ) : (
              <ol className="ia-steps">
                <li>
                  <span className="ia-steps__n">1</span>
                  <span>
                    اضغط زر المشاركة <Share size={18} className="ia-steps__ic" aria-label="مشاركة" /> {place === 'bottom' ? 'أسفل الشاشة' : 'أعلى الشاشة'}
                    <small className="ia-steps__alt">لا تجده؟ اضغط <MoreHorizontal size={15} className="ia-steps__ic" aria-label="المزيد" /> ثم مشاركة</small>
                  </span>
                </li>
                <li>
                  <span className="ia-steps__n">2</span>
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

const InstallAppCard = () => {
  const { mode, install } = useInstallApp();
  const [hidden, setHidden] = useState(wasDismissed);
  const [sheet, setSheet] = useState(false);

  // Asks by itself, once, a moment after the home page opens
  useEffect(() => {
    if (!mode || hidden || askedRecently()) return undefined;
    const timer = window.setTimeout(() => { writeTime(ASKED_KEY); setSheet(true); }, ASK_AFTER_MS);
    return () => window.clearTimeout(timer);
  }, [mode, hidden]);

  if (!mode || hidden) return null;

  const dismiss = () => { writeTime(DISMISS_KEY); setHidden(true); };
  const closeSheet = (later: boolean) => { setSheet(false); if (later) writeTime(ASKED_KEY); };

  return (
    <>
      <section className="ia-card" aria-labelledby="ia-card-title">
        <span className="ia-card__icon" aria-hidden><Smartphone size={22} /></span>
        <span className="ia-card__text">
          <b id="ia-card-title">ثبّت تطبيق Exios على جوالك</b>
          <small>يفتح بلمسة من الشاشة الرئيسية، مع إشعارات بشحناتك.</small>
        </span>
        <span className="ia-card__actions">
          <button type="button" className="hm-btn hm-btn--primary ia-card__btn" onClick={() => setSheet(true)}>
            <Download size={17} aria-hidden /> ثبّت التطبيق
          </button>
          <button type="button" className="ia-card__later" onClick={dismiss}>ليس الآن</button>
        </span>
      </section>
      {sheet && <InstallSheet mode={mode} onInstall={install} onClose={closeSheet} />}
    </>
  );
};

export default InstallAppCard;
