import { useCallback, useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Bell, ChevronLeft, Gift, Loader2, Megaphone, Package, RefreshCw } from 'lucide-react';
import api from '../../api';
import { clearUnread } from '../../utils/unreadNotifications';
import './notifications.css';

/* Every message sent to the customer (a shipment moved on, ready for pickup, points, a new level, a
   stopped shipment, the office's announcements), newest first and grouped by day, so one that was
   swiped away on the phone, or never reached it, can be read again. Opening the page marks them
   read; the ones that were new keep their mark for this visit. A tap opens the page it is about. */

type Item = { id: string, title: string, body: string, url: string, at: string, unread: boolean };

const pad = (n: number) => String(n).padStart(2, '0');
const dayKey = (d: Date) => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
const dayLabel = (key: string) => {
  const today = new Date();
  const yesterday = new Date(today.getTime() - 24 * 60 * 60 * 1000);
  if (key === dayKey(today)) return 'اليوم';
  if (key === dayKey(yesterday)) return 'أمس';
  const [y, m, d] = key.split('-');
  return `${d}/${m}/${y}`;
};
const timeText = (d: Date) => `${pad(d.getHours())}:${pad(d.getMinutes())}`;

// What it is about, by the page it opens
const iconFor = (url: string) => {
  if (url.startsWith('/order')) return Package;
  if (url.startsWith('/points')) return Gift;
  if (url === '/home' || url.startsWith('/announcements')) return Megaphone;
  return Bell;
};

// Order numbers, tracking numbers and amounts with a separator ("1853-5650", "EX-1001", "10.70") kept
// left-to-right inside the Arabic text, so they are not shown flipped ("5650-1853"). Newer messages
// already carry the marks from the server; this covers the ones saved before.
const LTR_RUN = /([A-Za-z0-9]+(?:[-_/.:][A-Za-z0-9]+)+)/g;
const withLtr = (text: string) => text.split(LTR_RUN).map((part, i) => (i % 2 ? <bdi key={i} dir="ltr">{part}</bdi> : part));

// Only pages of the app itself are opened
const internal = (url: string) => url.startsWith('/') && !url.startsWith('//');

const NotificationsPage = () => {
  const navigate = useNavigate();
  const [items, setItems] = useState<Item[] | null>(null);
  const [next, setNext] = useState<string | null>(null);
  const [failed, setFailed] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const marked = useRef(false);

  const load = useCallback(() => {
    setFailed(false);
    setItems(null);
    api.getNotifications()
      .then((res: any) => {
        setItems(Array.isArray(res?.data?.items) ? res.data.items : []);
        setNext(res?.data?.next || null);
        // Seen now: the bell and the menu stop counting them
        if (!marked.current) {
          marked.current = true;
          clearUnread();
          api.markNotificationsSeen().catch(() => undefined);
        }
      })
      .catch(() => setFailed(true));
  }, []);
  useEffect(() => { load(); }, [load]);

  const more = () => {
    if (!next || loadingMore) return;
    setLoadingMore(true);
    api.getNotifications(next)
      .then((res: any) => {
        setItems((list) => [...(list || []), ...(res?.data?.items || [])]);
        setNext(res?.data?.next || null);
      })
      .catch(() => undefined)
      .finally(() => setLoadingMore(false));
  };

  // Grouped by day, in the order they came
  const days: { key: string, items: Item[] }[] = [];
  (items || []).forEach((n) => {
    const key = dayKey(new Date(n.at));
    const last = days[days.length - 1];
    if (last && last.key === key) last.items.push(n); else days.push({ key, items: [n] });
  });
  const newCount = (items || []).filter((n) => n.unread).length;

  return (
    <div dir="rtl" lang="ar" className="nt-page w-full px-4 pb-16 pt-6 sm:px-6 lg:px-8 lg:pt-8">
      <div className="mx-auto max-w-2xl">
        <header className="nt-head">
          <h1>الإشعارات</h1>
          <p>{newCount > 0 ? (newCount === 1 ? 'إشعار جديد واحد' : `${newCount} إشعارات جديدة`) : 'كل ما أرسلناه لك عن شحناتك ونقاطك، وإعلانات المكتب.'}</p>
        </header>

        {failed && (
          <div className="nt-state" role="alert">
            <b>تعذّر تحميل الإشعارات</b>
            <p>تحقق من اتصالك ثم حاول مرة أخرى.</p>
            <button type="button" className="nt-btn" onClick={load}><RefreshCw size={16} aria-hidden /> إعادة المحاولة</button>
          </div>
        )}

        {!failed && items === null && (
          <div className="nt-list" aria-busy="true">
            {[0, 1, 2, 3].map((i) => <div key={i} className="nt-sk" />)}
            <span className="sr-only">جاري التحميل</span>
          </div>
        )}

        {items && items.length === 0 && (
          <div className="nt-state">
            <span className="nt-state__icon" aria-hidden><Bell size={26} /></span>
            <b>لا توجد إشعارات بعد</b>
            <p>هنا تجد كل ما نرسله لك: وصول طرودك للمخزن، شحنها، جاهزيتها للاستلام، نقاطك، وإعلانات المكتب.</p>
          </div>
        )}

        {days.map((day) => (
          <section key={day.key} className="nt-day" aria-label={dayLabel(day.key)}>
            <h2>{dayLabel(day.key)}</h2>
            <ul className="nt-list">
              {day.items.map((n) => {
                const Icon = iconFor(n.url);
                const at = new Date(n.at);
                const open = internal(n.url) ? () => navigate(n.url) : undefined;
                const content = (
                  <>
                    <span className="nt-item__icon" aria-hidden><Icon size={19} /></span>
                    <span className="nt-item__text">
                      <b>{withLtr(n.title)}</b>
                      {n.body && <span className="nt-item__body">{withLtr(n.body)}</span>}
                      <small>{timeText(at)}{n.unread && <span className="nt-item__new">جديد</span>}</small>
                    </span>
                    {open && <ChevronLeft size={18} className="nt-item__go" aria-hidden />}
                  </>
                );
                return (
                  <li key={n.id}>
                    {open
                      ? <button type="button" className={`nt-item${n.unread ? ' is-unread' : ''}`} onClick={open}>{content}</button>
                      : <div className={`nt-item${n.unread ? ' is-unread' : ''}`}>{content}</div>}
                  </li>
                );
              })}
            </ul>
          </section>
        ))}

        {next && (
          <div className="nt-more">
            <button type="button" className="nt-btn" onClick={more} disabled={loadingMore}>
              {loadingMore ? <><Loader2 size={16} className="nt-spin" aria-hidden /> جارٍ التحميل…</> : 'إشعارات أقدم'}
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default NotificationsPage;
