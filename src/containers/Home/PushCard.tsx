import { useEffect, useState } from 'react';
import { Bell, BellRing, Check } from 'lucide-react';
import { enablePush, pushState, PushState } from '../../utils/push';
import { isStandalone, useInstallApp } from '../../utils/installApp';
import { PushSheet } from '../../components/InstallApp/PushSheet';
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

/* In the installed app (opened from the home screen) the question also comes by itself, as a sheet,
   a moment after the home page opens: the easiest moment to say yes. "Not now" there waits 3 days.
   It waits for any other dialog on screen (passport check, popup ads) to close first. */
const PROMPT_KEY = 'exios-push-prompted';
const PROMPT_AGAIN_DAYS = 3;
const PROMPT_AFTER_MS = 2000;

const promptedRecently = () => {
  try {
    const at = Number(localStorage.getItem(PROMPT_KEY));
    return at > 0 && Date.now() - at < PROMPT_AGAIN_DAYS * 24 * 60 * 60 * 1000;
  } catch {
    return false;
  }
};
const otherDialogOpen = () => !!document.querySelector('.MuiDialog-root, .ia-sheet, .pt-celebrate');

const PushCard = () => {
  const { mode: installMode } = useInstallApp();
  const [state, setState] = useState<PushState>(null);
  const [hidden, setHidden] = useState(dismissedRecently);
  const [busy, setBusy] = useState(false);
  const [done, setDone] = useState(false);
  const [sheet, setSheet] = useState(false);

  useEffect(() => {
    let alive = true;
    pushState().then((s) => { if (alive) setState(s); }).catch(() => undefined);
    return () => { alive = false; };
  }, []);

  useEffect(() => {
    if (state !== 'ask' || !isStandalone() || promptedRecently()) return undefined;
    let timer = window.setTimeout(function tryOpen() {
      if (otherDialogOpen()) { timer = window.setTimeout(tryOpen, 1500); return; }
      try { localStorage.setItem(PROMPT_KEY, String(Date.now())); } catch { /* asked again next visit */ }
      setSheet(true);
    }, PROMPT_AFTER_MS);
    return () => window.clearTimeout(timer);
  }, [state]);

  // From the sheet: the same as the card's button, but the sheet shows the outcome itself
  const enableFromSheet = async () => {
    const ok = await enablePush().catch(() => false);
    if (!ok) setHidden(true); // refused in the phone's dialog: asking again would only annoy
    return ok;
  };
  const closeSheet = () => {
    setSheet(false);
    if (typeof Notification !== 'undefined' && Notification.permission === 'granted') setDone(true);
  };
  const pushSheet = sheet ? <PushSheet onEnable={enableFromSheet} onClose={closeSheet} /> : null;

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
  // The sheet stays while it is open, even if the card itself is hidden
  if (state !== 'ask' || hidden || (installMode === 'ios' && !installDismissed())) return pushSheet;

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
    <>
    {pushSheet}
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
    </>
  );
};

export default PushCard;
