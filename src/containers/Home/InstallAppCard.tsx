import { useEffect, useState } from 'react';
import { Download, Smartphone } from 'lucide-react';
import { useInstallApp } from '../../utils/installApp';
import { InstallSheet } from '../../components/InstallApp/InstallSheet';

/* "Install the app" on the home page. The install sheet (components/InstallApp) asks at the right
   moment, by itself: a few seconds after the customer reaches the home page, once; "not now" waits
   two weeks before asking again. The card opens the same sheet any time. */
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
