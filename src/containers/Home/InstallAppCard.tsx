import { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import { Download, Share, Smartphone, SquarePlus, X } from 'lucide-react';
import { useInstallApp } from '../../utils/installApp';

/* "Install the app" on the home page, only where it can be installed and isn't yet.
   Android/desktop: one tap opens the browser's install dialog. iPhone: the steps from the share
   menu. "Not now" hides it for a month on this device. */
const DISMISS_KEY = 'exios-install-dismissed';
const DISMISS_DAYS = 30;

const wasDismissed = () => {
  try {
    const at = Number(localStorage.getItem(DISMISS_KEY));
    return at > 0 && Date.now() - at < DISMISS_DAYS * 24 * 60 * 60 * 1000;
  } catch {
    return false;
  }
};

const IosSteps = ({ onClose }: { onClose: () => void }) => {
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onClose]);

  return createPortal(
    <div className="ia-sheet" role="dialog" aria-modal="true" aria-labelledby="ia-sheet-title" dir="rtl" onClick={onClose}>
      <div className="ia-sheet__panel" onClick={(e) => e.stopPropagation()}>
        <button type="button" className="ia-sheet__close" onClick={onClose} aria-label="إغلاق"><X size={20} /></button>
        <img src="/icon-192.png" alt="" className="ia-sheet__icon" width={64} height={64} />
        <h2 id="ia-sheet-title">ثبّت تطبيق اكسيوس على الآيفون</h2>
        <ol className="ia-steps">
          <li>
            <span className="ia-steps__n">1</span>
            <span>اضغط زر المشاركة <Share size={18} className="ia-steps__ic" aria-label="مشاركة" /> في شريط المتصفح</span>
          </li>
          <li>
            <span className="ia-steps__n">2</span>
            <span>اختر <b>إضافة إلى الشاشة الرئيسية</b> <SquarePlus size={18} className="ia-steps__ic" aria-hidden /></span>
          </li>
          <li>
            <span className="ia-steps__n">3</span>
            <span>اضغط <b>إضافة</b> في الأعلى، وستجد أيقونة اكسيوس على شاشتك</span>
          </li>
        </ol>
        <p className="ia-sheet__note">إذا لم تجد الخيار، افتح الموقع من متصفح Safari.</p>
        <button type="button" className="hm-btn hm-btn--primary ia-sheet__ok" onClick={onClose}>فهمت</button>
      </div>
    </div>,
    document.body,
  );
};

const InstallAppCard = () => {
  const { mode, install } = useInstallApp();
  const [hidden, setHidden] = useState(wasDismissed);
  const [steps, setSteps] = useState(false);

  if (!mode || hidden) return null;

  const dismiss = () => {
    try { localStorage.setItem(DISMISS_KEY, String(Date.now())); } catch { /* private mode: hide for this visit only */ }
    setHidden(true);
  };

  const onInstall = () => {
    if (mode === 'ios') setSteps(true);
    else install().catch(() => undefined);
  };

  return (
    <>
      <section className="ia-card" aria-labelledby="ia-card-title">
        <span className="ia-card__icon" aria-hidden><Smartphone size={22} /></span>
        <span className="ia-card__text">
          <b id="ia-card-title">ثبّت تطبيق اكسيوس على جوالك</b>
          <small>يفتح بلمسة من الشاشة الرئيسية، أسرع وبدون متصفح.</small>
        </span>
        <span className="ia-card__actions">
          <button type="button" className="hm-btn hm-btn--primary ia-card__btn" onClick={onInstall}>
            <Download size={17} aria-hidden /> ثبّت التطبيق
          </button>
          <button type="button" className="ia-card__later" onClick={dismiss}>ليس الآن</button>
        </span>
      </section>
      {steps && <IosSteps onClose={() => setSteps(false)} />}
    </>
  );
};

export default InstallAppCard;
