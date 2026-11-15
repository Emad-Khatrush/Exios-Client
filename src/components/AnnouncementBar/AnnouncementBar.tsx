import { useEffect, useMemo, useState } from 'react';
import { ChevronLeft, ChevronRight, ExternalLink, Megaphone, X } from 'lucide-react';
import { Announcement } from '../../models';
import './announcementBar.css';

// Announcements the customer closed on this device; an edited announcement shows again
const KEY = 'announcements:closed';
const stamp = (a: Announcement) => `${a._id}:${a.updatedAt || a.createdAt || ''}`;
const readClosed = (): string[] => {
  try { return JSON.parse(localStorage.getItem(KEY) || '[]'); } catch { return []; }
};

const ROTATE_MS = 7000;

/* The office's announcements as one band: one at a time, with arrows and dots when there are
   several, a link when the office attached one, and a close button that is remembered. */
const AnnouncementBar = ({ announcements }: { announcements?: Announcement[] | null }) => {
  const [closed, setClosed] = useState<string[]>(readClosed);
  const [index, setIndex] = useState(0);
  const [paused, setPaused] = useState(false);

  const list = useMemo(
    () => (Array.isArray(announcements) ? announcements : []).filter((a) => a?.description && !closed.includes(stamp(a))),
    [announcements, closed],
  );
  const count = list.length;
  const at = count ? index % count : 0;

  // Several announcements take turns; a hover, a focus or reduced motion holds the one on screen
  useEffect(() => {
    if (count < 2 || paused) return undefined;
    if (window.matchMedia?.('(prefers-reduced-motion: reduce)').matches) return undefined;
    const timer = window.setInterval(() => setIndex((i) => (i + 1) % count), ROTATE_MS);
    return () => window.clearInterval(timer);
  }, [count, paused]);

  if (!count) return null;
  const current = list[at];

  const close = () => {
    const next = [...closed, stamp(current)].slice(-50);
    setClosed(next);
    try { localStorage.setItem(KEY, JSON.stringify(next)); } catch { /* private mode */ }
  };

  return (
    <section
      className="ann-bar"
      dir="rtl"
      aria-label="إعلانات إكسيوس"
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
      onFocus={() => setPaused(true)}
      onBlur={() => setPaused(false)}
    >
      <span className="ann-bar__icon" aria-hidden><Megaphone size={22} /></span>

      <div className="ann-bar__body" aria-live="polite">
        <span className="ann-bar__label">إعلان{count > 1 ? ` ${at + 1} من ${count}` : ''}</span>
        <p key={stamp(current)} className="ann-bar__text bidi-text" dir="auto">{current.description}</p>
        {current.forwardLink && (
          <a className="ann-bar__link" href={current.forwardLink} target="_blank" rel="noopener noreferrer">
            التفاصيل <ExternalLink size={14} aria-hidden />
          </a>
        )}
      </div>

      <div className="ann-bar__side">
        {count > 1 && (
          <div className="ann-bar__pager">
            <button type="button" aria-label="الإعلان السابق" onClick={() => setIndex((at - 1 + count) % count)}><ChevronRight size={18} /></button>
            <span className="ann-bar__dots" aria-hidden>
              {list.map((a, i) => <i key={a._id} className={i === at ? 'is-on' : ''} />)}
            </span>
            <button type="button" aria-label="الإعلان التالي" onClick={() => setIndex((at + 1) % count)}><ChevronLeft size={18} /></button>
          </div>
        )}
        <button type="button" className="ann-bar__close" aria-label="إخفاء هذا الإعلان" onClick={close}><X size={18} /></button>
      </div>
    </section>
  );
};

export default AnnouncementBar;
