import { useEffect, useRef, useState } from 'react';
import { Wifi, WifiOff } from 'lucide-react';
import './offlineBar.css';

/* A thin strip at the top while the phone has no internet, so a page that does not load says why
   instead of failing with a vague message. When the connection is back it says so for two seconds
   and slides away. Nothing shows while online. */

type Status = 'online' | 'offline' | 'back';

const OfflineBar = () => {
  const [status, setStatus] = useState<Status>(() => (typeof navigator !== 'undefined' && navigator.onLine === false ? 'offline' : 'online'));
  const timer = useRef<number>();

  useEffect(() => {
    const goOffline = () => { window.clearTimeout(timer.current); setStatus('offline'); };
    const goOnline = () => {
      setStatus((s) => (s === 'offline' ? 'back' : s));
      window.clearTimeout(timer.current);
      timer.current = window.setTimeout(() => setStatus('online'), 2000);
    };
    window.addEventListener('offline', goOffline);
    window.addEventListener('online', goOnline);
    return () => {
      window.removeEventListener('offline', goOffline);
      window.removeEventListener('online', goOnline);
      window.clearTimeout(timer.current);
    };
  }, []);

  return (
    <div className={`ofb ${status !== 'online' ? 'is-shown' : ''} ${status === 'back' ? 'is-back' : ''}`} dir="rtl" lang="ar" role="status" aria-live="polite">
      {status === 'back'
        ? <><Wifi size={16} aria-hidden /> عاد الاتصال</>
        : <><WifiOff size={16} aria-hidden /> لا يوجد اتصال بالإنترنت. تحقق من الشبكة ثم أعد المحاولة.</>}
    </div>
  );
};

export default OfflineBar;
