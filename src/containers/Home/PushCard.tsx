import { useEffect, useState } from 'react';
import { Bell, BellRing, Check } from 'lucide-react';
import { enablePush, pushState, PushState } from '../../utils/push';
import { useInstallApp } from '../../utils/installApp';
import { wasDismissed as installDismissed } from './InstallAppCard';

/* "Turn on notifications" on the home page. Asked with a button the customer taps, never with a
   browser pop-up on arrival (people refuse those). Shown only when it can be turned on; on iPhone
   only once the app is installed, since Safari allows it nowhere else.
   "Not now" hides it for two weeks on this device. */
const DISMISS_KEY = 'exios-push-dismissed';
const DISMISS_DAYS = 14;

const dismissedRecently = () => {
  try {
    const at = Number(localStorage.getItem(DISMISS_KEY));
    return at > 0 && Date.now() - at < DISMISS_DAYS * 24 * 60 * 60 * 1000;
  } catch {
    return false;
  }
};

const PushCard = () => {
  const { mode: installMode } = useInstallApp();
  const [state, setState] = useState<PushState>(null);
  const [hidden, setHidden] = useState(dismissedRecently);
  const [busy, setBusy] = useState(false);
  const [done, setDone] = useState(false);

  useEffect(() => {
    let alive = true;
    pushState().then((s) => { if (alive) setState(s); }).catch(() => undefined);
    return () => { alive = false; };
  }, []);

  if (done) {
    return (
      <section className="ia-card is-done" role="status">
        <span className="ia-card__icon" aria-hidden><Check size={22} /></span>
        <span className="ia-card__text">
          <b>تم تفعيل الإشعارات</b>
          <small>سنبلغك على جوالك عندما تتحرك شحنتك أو تصبح جاهزة للاستلام.</small>
        </span>
      </section>
    );
  }

  // iPhone asks for the install first (its card is showing); elsewhere both cards can show
  if (state !== 'ask' || hidden || (installMode === 'ios' && !installDismissed())) return null;

  const dismiss = () => {
    try { localStorage.setItem(DISMISS_KEY, String(Date.now())); } catch { /* hide for this visit only */ }
    setHidden(true);
  };

  const onEnable = async () => {
    setBusy(true);
    try {
      if (await enablePush()) setDone(true);
      else setHidden(true); // refused in the browser's dialog: asking again would only annoy
    } catch {
      setHidden(true);
    } finally {
      setBusy(false);
    }
  };

  return (
    <section className="ia-card" aria-labelledby="push-card-title">
      <span className="ia-card__icon" aria-hidden><BellRing size={22} /></span>
      <span className="ia-card__text">
        <b id="push-card-title">فعّل إشعارات شحناتك</b>
        <small>نبلغك على جوالك عند وصول طردك للمخزن، وعند شحنه، وعندما يصبح جاهزاً للاستلام.</small>
      </span>
      <span className="ia-card__actions">
        <button type="button" className="hm-btn hm-btn--primary ia-card__btn" onClick={onEnable} disabled={busy} aria-busy={busy}>
          <Bell size={17} aria-hidden /> {busy ? 'لحظة…' : 'فعّل الإشعارات'}
        </button>
        <button type="button" className="ia-card__later" onClick={dismiss}>ليس الآن</button>
      </span>
    </section>
  );
};

export default PushCard;
