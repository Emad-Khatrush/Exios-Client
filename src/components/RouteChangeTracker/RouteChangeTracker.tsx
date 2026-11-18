import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import api from '../../api';
import { getVisitorSessionId } from '../../utils/analytics';
import { isIOS, isStandalone } from '../../utils/installApp';

// Once per app start, for a logged-in customer: this device, installed or not, notifications on or
// not (the admin shows it on the customer's page and on the analytics page)
let pinged = false;
const pingAppDevice = () => {
  if (pinged) return;
  try { if (!localStorage.getItem('authToken')) return; } catch { return; }
  pinged = true;
  let push = false;
  try { push = 'Notification' in window && Notification.permission === 'granted' && !!localStorage.getItem('exios-push-token'); } catch { /* ignore */ }
  const platform = isIOS() ? 'ios' : /android/i.test(navigator.userAgent) ? 'android' : 'desktop';
  api.pingAppDevice({ deviceId: getVisitorSessionId(), standalone: isStandalone(), push, platform }).catch(() => { pinged = false; });
};

// Pings the admin analytics endpoint on every route the SPA renders, logged in
// or not (landing/login/signup included). Rendered once inside <Router>, next
// to <Routes>, so useLocation always has a router context.
const RouteChangeTracker = () => {
  const location = useLocation();

  useEffect(() => {
    api.trackVisit({
      sessionId: getVisitorSessionId(),
      path: location.pathname,
      referrer: document.referrer,
      app: isStandalone(),
    }).catch(() => {
      // Analytics must never break the app.
    });
    // After logging in the path changes too, so the first page after login reports the device
    pingAppDevice();
  }, [location.pathname]);

  return null;
};

export default RouteChangeTracker;
