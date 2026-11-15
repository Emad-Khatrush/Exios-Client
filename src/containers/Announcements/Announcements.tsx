import React, { useEffect, useLayoutEffect, useMemo, useRef, useState } from "react";
import { AlertTriangle, BellOff, CheckCircle2, Info, Megaphone, OctagonAlert, RefreshCw } from "lucide-react";
import api from "../../api";
import "./announcements.css";

type Tone = "info" | "warning" | "success" | "error";

type Announcement = {
  _id: string;
  title: string;
  message: string;
  type: Tone;
  publishedAt?: string | null;
  createdAt?: string;
  expiresAt?: string | null;
};

// What each kind of notice means to the customer, in their words
const TONES: Record<Tone, { label: string, icon: typeof Info }> = {
  error: { label: "مهم", icon: OctagonAlert },
  warning: { label: "تنبيه", icon: AlertTriangle },
  success: { label: "خبر سار", icon: CheckCircle2 },
  info: { label: "معلومة", icon: Info },
};
const TONE_ORDER: Tone[] = ["error", "warning", "success", "info"];

// The last time this customer opened the page: notices after it are marked new
const SEEN_KEY = "announcements:lastSeen";
const readSeen = () => {
  try { return Number(localStorage.getItem(SEEN_KEY)) || 0; } catch { return 0; }
};
const writeSeen = () => {
  try { localStorage.setItem(SEEN_KEY, String(Date.now())); } catch { /* private window */ }
};

const DAY = 24 * 60 * 60 * 1000;
const dateOf = (a: Announcement) => new Date(a.publishedAt || a.createdAt || 0);
const startOfDay = (d: Date) => new Date(d.getFullYear(), d.getMonth(), d.getDate()).getTime();

// Latin digits, as the rest of the app writes numbers
const fmt = (d: Date, o: Intl.DateTimeFormatOptions) => d.toLocaleDateString("ar-LY-u-nu-latn", o);

const ago = (d: Date) => {
  const days = Math.round((startOfDay(new Date()) - startOfDay(d)) / DAY);
  if (days <= 0) return "اليوم";
  if (days === 1) return "أمس";
  if (days === 2) return "منذ يومين";
  if (days <= 10) return `منذ ${days} أيام`;
  if (days < 30) return `منذ ${days} يوماً`;
  return fmt(d, { day: "numeric", month: "long", year: "numeric" });
};

/* A long message shows its first lines; the button appears only when it is actually cut */
const Message = ({ text }: { text: string }) => {
  const ref = useRef<HTMLParagraphElement>(null);
  const [open, setOpen] = useState(false);
  const [cut, setCut] = useState(false);

  useLayoutEffect(() => {
    const el = ref.current;
    if (!el || open) return;
    const check = () => setCut(el.scrollHeight - el.clientHeight > 2);
    check();
    const ro = new ResizeObserver(check);
    ro.observe(el);
    return () => ro.disconnect();
  }, [text, open]);

  return (
    <>
      <p ref={ref} dir="auto" className={`notice__message bidi-text ${open ? "" : "is-clamped"}`}>{text}</p>
      {(cut || open) && (
        <button type="button" className="notice__more" aria-expanded={open} onClick={() => setOpen(!open)}>
          {open ? "عرض أقل" : "اقرأ المزيد"}
        </button>
      )}
    </>
  );
};

const Skeleton = () => (
  <div className="space-y-4" aria-hidden>
    {[0, 1, 2].map((i) => (
      <div key={i} className="notice notice--skeleton">
        <div className="notice__date"><span className="sk h-7 w-8" /><span className="sk mt-1 h-3 w-10" /></div>
        <div className="notice__card space-y-3">
          <span className="sk block h-4 w-20" />
          <span className="sk block h-5 w-2/3" />
          <span className="sk block h-4 w-full" />
          <span className="sk block h-4 w-4/5" />
        </div>
      </div>
    ))}
  </div>
);

const Announcements: React.FC = () => {
  const [items, setItems] = useState<Announcement[]>([]);
  const [status, setStatus] = useState<"loading" | "ready" | "error">("loading");
  const [filter, setFilter] = useState<Tone | "all">("all");
  // Read once, before this visit is recorded, so today's new notices stay marked until next time
  const [lastSeen] = useState(readSeen);

  const load = async () => {
    setStatus("loading");
    try {
      const res = await api.get("posts");
      setItems(res.data.results || []);
      setStatus("ready");
      writeSeen();
    } catch (error) {
      console.error("Error fetching announcements:", error);
      setStatus("error");
    }
  };

  useEffect(() => { load(); }, []);

  // Expired notices are no longer true, so they leave the board; newest first
  const live = useMemo(() => {
    const now = Date.now();
    return items
      .filter((a) => !a.expiresAt || new Date(a.expiresAt).getTime() > now)
      .sort((a, b) => dateOf(b).getTime() - dateOf(a).getTime());
  }, [items]);

  const counts = useMemo(() => {
    const c: Partial<Record<Tone, number>> = {};
    live.forEach((a) => { c[a.type] = (c[a.type] || 0) + 1; });
    return c;
  }, [live]);
  const tonesPresent = TONE_ORDER.filter((t) => counts[t]);

  const shown = filter === "all" ? live : live.filter((a) => a.type === filter);
  const newCount = lastSeen ? live.filter((a) => dateOf(a).getTime() > lastSeen).length : 0;

  // Grouped by month, so a long list reads like a dated board
  const months = useMemo(() => {
    const groups: { key: string, label: string, list: Announcement[] }[] = [];
    shown.forEach((a) => {
      const d = dateOf(a);
      const key = `${d.getFullYear()}-${d.getMonth()}`;
      let g = groups[groups.length - 1];
      if (!g || g.key !== key) {
        g = { key, label: fmt(d, { month: "long", year: "numeric" }), list: [] };
        groups.push(g);
      }
      g.list.push(a);
    });
    return groups;
  }, [shown]);

  return (
    <div dir="rtl" lang="ar" className="announcements-page w-full px-4 pb-16 pt-6 sm:px-6 lg:px-8 lg:pt-8">
      <div className="mx-auto max-w-3xl lg:max-w-5xl">
        <header className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <h1 className="flex items-center gap-2.5 text-2xl font-extrabold text-zinc-900 sm:text-3xl">
              <Megaphone className="text-green-700" size={26} aria-hidden />
              الإعلانات
            </h1>
            <p className="mt-1 max-w-[60ch] text-base leading-relaxed text-zinc-600 sm:text-lg">
              مواعيد الرحلات، تغييرات الأسعار، وأيام العطل من مكتب إكسيوس.
            </p>
          </div>
          {status === "ready" && newCount > 0 && (
            <p className="new-count" role="status">
              <span className="new-count__dot" aria-hidden />
              {newCount === 1 ? "إعلان جديد منذ زيارتك الأخيرة" : `${newCount} إعلانات جديدة منذ زيارتك الأخيرة`}
            </p>
          )}
        </header>

        {status === "ready" && tonesPresent.length > 1 && (
          <div className="notice-filter mt-6" role="group" aria-label="نوع الإعلان">
            <button type="button" aria-pressed={filter === "all"} className={filter === "all" ? "is-active" : ""} onClick={() => setFilter("all")}>
              الكل <span className="notice-filter__n">{live.length}</span>
            </button>
            {tonesPresent.map((t) => {
              const { label, icon: Icon } = TONES[t];
              return (
                <button key={t} type="button" data-tone={t} aria-pressed={filter === t} className={filter === t ? "is-active" : ""} onClick={() => setFilter(t)}>
                  <Icon size={16} aria-hidden /> {label} <span className="notice-filter__n">{counts[t]}</span>
                </button>
              );
            })}
          </div>
        )}

        <div className="mt-6">
          {status === "loading" && <Skeleton />}

          {status === "error" && (
            <div className="board-state">
              <p className="text-lg font-bold text-zinc-900">تعذر تحميل الإعلانات</p>
              <p className="mt-1 text-base text-zinc-600">تحقق من اتصالك بالإنترنت ثم أعد المحاولة.</p>
              <button type="button" className="board-state__retry" onClick={load}>
                <RefreshCw size={17} aria-hidden /> إعادة المحاولة
              </button>
            </div>
          )}

          {status === "ready" && live.length === 0 && (
            <div className="board-state">
              <BellOff className="mx-auto text-zinc-400" size={34} aria-hidden />
              <p className="mt-3 text-lg font-bold text-zinc-900">لا توجد إعلانات حالياً</p>
              <p className="mt-1 text-base text-zinc-600">عندما ينشر المكتب موعد رحلة أو تغييراً في الأسعار سيظهر هنا.</p>
            </div>
          )}

          {status === "ready" && months.map((m) => (
            <section key={m.key} className="notice-month" aria-label={m.label}>
              <h2 className="notice-month__title">{m.label}</h2>
              <ol className="notice-list">
                {m.list.map((a) => {
                  const d = dateOf(a);
                  const tone = TONES[a.type] ? a.type : "info";
                  const { label, icon: Icon } = TONES[tone];
                  const isNew = lastSeen > 0 && d.getTime() > lastSeen;
                  return (
                    <li key={a._id} className="notice" data-tone={tone}>
                      <time className="notice__date" dateTime={d.toISOString()} title={fmt(d, { weekday: "long", day: "numeric", month: "long", year: "numeric" })}>
                        <span className="notice__day">{d.getDate()}</span>
                        <span className="notice__mon">{fmt(d, { month: "short" })}</span>
                      </time>
                      <article className="notice__card">
                        <div className="notice__meta">
                          <span className="notice__tone"><Icon size={15} aria-hidden />{label}</span>
                          {isNew && <span className="notice__new">جديد</span>}
                          <span className="notice__ago">{ago(d)}</span>
                        </div>
                        <h3 dir="auto" className="notice__title bidi-text">{a.title}</h3>
                        <Message text={a.message} />
                      </article>
                    </li>
                  );
                })}
              </ol>
            </section>
          ))}
        </div>
      </div>
    </div>
  );
};

export default Announcements;
