import { FormEvent, useEffect, useMemo, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { CheckCircle2, ChevronDown, ChevronLeft, ChevronRight, ImagePlus, Lightbulb, MessageSquareWarning, RefreshCw, Send, X } from 'lucide-react';
import api from '../../api';
import './suggestions.css';

type Kind = 'complaint' | 'suggestion';
type Status = 'new' | 'in_progress' | 'resolved' | 'closed';
type Feedback = {
  _id: string;
  number: number;
  kind: Kind;
  topic: string;
  subject: string;
  orderRef?: string;
  status: Status;
  resolvedAt?: string | null;
  unread?: boolean;
  canReply?: boolean;
  messages: Message[];
  createdAt: string;
};
type Message = { _id: string, from: 'customer' | 'staff', text: string, images: { url: string, name?: string }[], at: string };

const TOPICS: Record<Kind, { key: string, label: string }[]> = {
  complaint: [
    { key: 'delay', label: 'تأخير الشحنة' },
    { key: 'damage', label: 'تلف أو نقص' },
    { key: 'shipping', label: 'الشحن والاستلام' },
    { key: 'payment', label: 'الدفع والحوالات' },
    { key: 'pricing', label: 'الأسعار' },
    { key: 'staff', label: 'تعامل الموظفين' },
    { key: 'app', label: 'التطبيق' },
    { key: 'other', label: 'أخرى' },
  ],
  suggestion: [
    { key: 'shipping', label: 'خدمات الشحن' },
    { key: 'pricing', label: 'الأسعار' },
    { key: 'app', label: 'التطبيق' },
    { key: 'staff', label: 'خدمة العملاء' },
    { key: 'other', label: 'أخرى' },
  ],
};
const topicLabel = (kind: Kind, key: string) => TOPICS[kind].find((t) => t.key === key)?.label
  || TOPICS.complaint.find((t) => t.key === key)?.label || 'أخرى';

// The road a request travels; "closed" ends it like "resolved" does
const STEPS: { key: Status, label: string }[] = [
  { key: 'new', label: 'تم الاستلام' },
  { key: 'in_progress', label: 'قيد المعالجة' },
  { key: 'resolved', label: 'تم الحل' },
];
const STATUS_LABEL: Record<Status, string> = { new: 'تم الاستلام', in_progress: 'قيد المعالجة', resolved: 'تم الحل', closed: 'مغلق' };
const stepIndex = (s: Status) => (s === 'closed' ? 2 : STEPS.findIndex((x) => x.key === s));

const MAX = 4000;
const fmtDate = (v?: string | null) => (v ? new Date(v).toLocaleDateString('ar-LY-u-nu-latn', { day: 'numeric', month: 'long', year: 'numeric' }) : '');
const fmtTime = (v: string) => new Date(v).toLocaleString('ar-LY-u-nu-latn', { day: 'numeric', month: 'short', hour: 'numeric', minute: '2-digit' });
const ARABIC = /[\u0600-\u06FF]/;
const errorText = (e: any) => {
  const message = e?.response?.data?.message || e?.message;
  return message && ARABIC.test(message) ? message : 'تعذر الإرسال. تحقق من اتصالك ثم حاول مرة أخرى.';
};

// Text and screenshots go together as multipart; the server answers in the customer's language
async function sendForm(url: string, form: FormData) {
  const response = await api.fetchFormData(url, 'POST', form);
  const data = await response.json().catch(() => ({}));
  if (!response.ok) throw new Error(data?.message || 'request-failed');
  return data;
}

const MAX_IMAGES = 5;
const MAX_IMAGE_MB = 8;
const IMAGE_TYPES = ['image/png', 'image/jpeg', 'image/webp', 'image/gif'];

/* Screenshots for a message: previews the customer can remove before sending */
const ImagePicker = ({ files, onChange, compact }: { files: File[], onChange: (f: File[]) => void, compact?: boolean }) => {
  const input = useRef<HTMLInputElement>(null);
  const [error, setError] = useState('');
  const previews = useMemo(() => files.map((f) => URL.createObjectURL(f)), [files]);
  useEffect(() => () => previews.forEach((u) => URL.revokeObjectURL(u)), [previews]);

  const add = (list: FileList | null) => {
    if (!list) return;
    const picked = Array.from(list);
    const isType = (f: File) => IMAGE_TYPES.includes(f.type);
    const isSize = (f: File) => f.size <= MAX_IMAGE_MB * 1024 * 1024;
    const ok = picked.filter((f) => isType(f) && isSize(f));
    setError(picked.some((f) => !isType(f)) ? 'يمكن إرفاق صور فقط (PNG أو JPG أو WEBP)'
      : picked.some((f) => !isSize(f)) ? `حجم الصورة يجب ألا يتجاوز ${MAX_IMAGE_MB} ميغابايت`
        : files.length + ok.length > MAX_IMAGES ? `يمكن إرفاق ${MAX_IMAGES} صور كحد أقصى` : '');
    onChange([...files, ...ok].slice(0, MAX_IMAGES));
    if (input.current) input.current.value = '';
  };

  return (
    <div className={`fb-images ${compact ? 'is-compact' : ''}`}>
      {!!files.length && (
        <ul className="fb-images__list">
          {files.map((_, i) => (
            <li key={previews[i]}>
              <img src={previews[i]} alt={`صورة مرفقة ${i + 1}`} />
              <button type="button" aria-label={`إزالة الصورة ${i + 1}`} onClick={() => { onChange(files.filter((_, j) => j !== i)); setError(''); }}><X size={14} /></button>
            </li>
          ))}
        </ul>
      )}
      {files.length < MAX_IMAGES && (
        <button type="button" className="fb-images__add" onClick={() => input.current?.click()}>
          <ImagePlus size={18} aria-hidden />
          {compact ? 'صورة' : 'إرفاق صور'}
          {!compact && <span>حتى {MAX_IMAGES} صور، مثل سكرين شوت أو صورة الطرد</span>}
        </button>
      )}
      <input ref={input} type="file" accept={IMAGE_TYPES.join(',')} multiple hidden onChange={(e) => add(e.target.files)} />
      {error && <span className="fb-error" role="alert">{error}</span>}
    </div>
  );
};

/* Pictures opened full size over the whole screen. Rendered on <body>: a page container with a
   transform or overflow would otherwise trap a fixed overlay inside it, under the header. */
const Lightbox = ({ urls, start, onClose }: { urls: string[], start: number, onClose: () => void }) => {
  const [index, setIndex] = useState(start);
  const [state, setState] = useState<'loading' | 'ready' | 'error'>('loading');
  const url = urls[index];
  const many = urls.length > 1;
  // In Arabic the next picture is to the left
  const go = (step: number) => { if (many) { setIndex((i) => (i + step + urls.length) % urls.length); setState('loading'); } };

  useEffect(() => {
    const key = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
      if (e.key === 'ArrowLeft') go(1);
      if (e.key === 'ArrowRight') go(-1);
    };
    window.addEventListener('keydown', key);
    const overflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => { window.removeEventListener('keydown', key); document.body.style.overflow = overflow; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [urls.length]);

  return createPortal(
    <div className="fb-lb" role="dialog" aria-modal="true" aria-label="عرض الصورة" dir="rtl" onClick={onClose}>
      <div className="fb-lb__bar" onClick={(e) => e.stopPropagation()}>
        <button type="button" className="fb-lb__btn" aria-label="إغلاق" onClick={onClose}><X size={20} /></button>
        {many && <span className="fb-lb__count">{index + 1} من {urls.length}</span>}
        <a className="fb-lb__open" href={url} target="_blank" rel="noopener noreferrer">فتح في تبويب جديد</a>
      </div>
      <div className="fb-lb__stage">
        {state === 'loading' && <span className="fb-lb__spinner" aria-label="جارٍ تحميل الصورة" />}
        {state === 'error' ? (
          <div className="fb-lb__error" onClick={(e) => e.stopPropagation()}>
            <p>تعذر تحميل الصورة.</p>
            <button type="button" onClick={() => setState('loading')}>إعادة المحاولة</button>
          </div>
        ) : (
          <img
            key={`${url}-${state === 'loading' ? 'try' : 'ok'}`}
            src={url}
            alt={`الصورة ${index + 1}`}
            className={state === 'ready' ? 'is-ready' : ''}
            onLoad={() => setState('ready')}
            onError={() => setState('error')}
            onClick={(e) => e.stopPropagation()}
          />
        )}
      </div>
      {many && (
        <>
          <button type="button" className="fb-lb__nav fb-lb__nav--prev" aria-label="الصورة السابقة" onClick={(e) => { e.stopPropagation(); go(-1); }}><ChevronRight size={26} /></button>
          <button type="button" className="fb-lb__nav fb-lb__nav--next" aria-label="الصورة التالية" onClick={(e) => { e.stopPropagation(); go(1); }}><ChevronLeft size={26} /></button>
        </>
      )}
    </div>,
    document.body,
  );
};

/* A thumbnail that shows a quiet placeholder while loading and a clear tile if the picture fails */
const Thumb = ({ url, label, onOpen }: { url: string, label: string, onOpen: () => void }) => {
  const [state, setState] = useState<'loading' | 'ready' | 'error'>('loading');
  return (
    <button type="button" className={`fb-thumb is-${state}`} onClick={onOpen} aria-label={label}>
      {state !== 'error'
        ? <img src={url} alt={label} loading="lazy" onLoad={() => setState('ready')} onError={() => setState('error')} />
        : <span>تعذر عرض الصورة</span>}
    </button>
  );
};

/* The conversation: the customer on one side, the office on the other */
const Thread = ({ messages }: { messages: Message[] }) => {
  const [zoom, setZoom] = useState<{ urls: string[], at: number } | null>(null);
  return (
    <>
      <ol className="fb-thread">
        {messages.map((m) => (
          <li key={m._id} className={`fb-msg fb-msg--${m.from}`}>
            <p className="fb-msg__who">{m.from === 'staff' ? 'مكتب إكسيوس' : 'أنت'}<span>{fmtTime(m.at)}</span></p>
            {m.text && <p className="fb-msg__text bidi-text" dir="auto">{m.text}</p>}
            {!!m.images.length && (
              <div className="fb-msg__images">
                {m.images.map((img, i) => (
                  <Thumb key={img.url} url={img.url} label={`فتح الصورة ${i + 1}`} onOpen={() => setZoom({ urls: m.images.map((x) => x.url), at: i })} />
                ))}
              </div>
            )}
          </li>
        ))}
      </ol>
      {zoom && <Lightbox urls={zoom.urls} start={zoom.at} onClose={() => setZoom(null)} />}
    </>
  );
};

/* Answering the office from inside the complaint */
const Composer = ({ f, onUpdated }: { f: Feedback, onUpdated: (f: Feedback) => void }) => {
  const [text, setText] = useState('');
  const [files, setFiles] = useState<File[]>([]);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const send = async () => {
    if (!text.trim() && !files.length) { setError('اكتب رسالة أو أرفق صورة'); return; }
    setBusy(true); setError('');
    try {
      const form = new FormData();
      form.append('text', text);
      files.forEach((file) => form.append('images', file));
      onUpdated(await sendForm(`client/feedback/${f._id}/messages`, form));
      setText(''); setFiles([]);
    } catch (err) {
      setError(errorText(err));
    } finally {
      setBusy(false);
    }
  };
  return (
    <div className="fb-composer">
      <textarea value={text} onChange={(e) => setText(e.target.value)} rows={3} maxLength={MAX} dir="auto" placeholder="اكتب ردك على المكتب…" aria-label="ردك" />
      <div className="fb-composer__bar">
        <ImagePicker files={files} onChange={setFiles} compact />
        <button type="button" className="fb-btn fb-btn--send" disabled={busy} onClick={send}>
          {busy ? <RefreshCw size={16} className="fb-spin" aria-hidden /> : <Send size={16} aria-hidden />}
          {busy ? 'جارٍ الإرسال…' : 'إرسال'}
        </button>
      </div>
      {error && <p className="fb-error" role="alert">{error}</p>}
    </div>
  );
};

type MyOrder = {
  _id: string;
  orderId: string;
  productName: string;
  createdAt: string;
  kind: 'shipping' | 'purchase' | 'remittance';
  method: string;
  finished: boolean;
};
const orderKind = (o: MyOrder) => (o.kind === 'purchase' ? 'شراء'
  : o.kind === 'remittance' ? 'حوالة'
    : o.method === 'air' ? 'شحن جوي' : o.method === 'sea' ? 'شحن بحري' : 'شحن');

/* The customer's orders as choices; "not about an order" first, so leaving it is a choice too */
const OrderPicker = ({ orders, value, onChange }: { orders: MyOrder[], value: string, onChange: (id: string) => void }) => {
  const [query, setQuery] = useState('');
  const q = query.trim().toLowerCase();
  const shown = q ? orders.filter((o) => `${o.orderId} ${o.productName} ${orderKind(o)}`.toLowerCase().includes(q)) : orders;
  return (
    <div className="fb-orders">
      {orders.length > 5 && (
        <input className="fb-orders__search" type="search" value={query} onChange={(e) => setQuery(e.target.value)} placeholder="ابحث برقم الطلبية أو اسم المنتج" aria-label="بحث في طلبياتك" />
      )}
      <div className="fb-orders__list" role="radiogroup" aria-label="الطلبية">
        {!q && (
          <button type="button" role="radio" aria-checked={!value} className={`fb-order ${!value ? 'is-active' : ''}`} onClick={() => onChange('')}>
            <span className="fb-order__radio" aria-hidden />
            <span className="fb-order__main"><b>ليست عن طلبية معينة</b></span>
          </button>
        )}
        {shown.map((o) => (
          <button key={o._id} type="button" role="radio" aria-checked={value === o._id} className={`fb-order ${value === o._id ? 'is-active' : ''}`} onClick={() => onChange(o._id)}>
            <span className="fb-order__radio" aria-hidden />
            <span className="fb-order__main">
              <b><bdi dir="ltr">{o.orderId}</bdi></b>
              <small>{orderKind(o)}{o.productName ? ` · ${o.productName}` : ''}</small>
            </span>
            <span className="fb-order__side">
              <span className={`fb-order__state ${o.finished ? 'is-done' : ''}`}>{o.finished ? 'مكتملة' : 'جارية'}</span>
              <small>{fmtDate(o.createdAt)}</small>
            </span>
          </button>
        ))}
        {q && !shown.length && <p className="fb-orders__none">لا توجد طلبية بهذا الرقم أو الاسم.</p>}
      </div>
    </div>
  );
};

const Progress =({ status }: { status: Status }) => {
  const at = stepIndex(status);
  return (
    <ol className="fb-steps" aria-label={`الحالة: ${STATUS_LABEL[status]}`}>
      {STEPS.map((s, i) => (
        <li key={s.key} className={i < at ? 'is-done' : i === at ? 'is-current' : ''}>
          <span className="fb-steps__dot" aria-hidden />
          <span className="fb-steps__label">{i === 2 && status === 'closed' ? 'مغلق' : s.label}</span>
        </li>
      ))}
    </ol>
  );
};

const Ticket = ({ f, onOpen, onUpdated }: { f: Feedback, onOpen: (f: Feedback) => void, onUpdated: (f: Feedback) => void }) => {
  const [open, setOpen] = useState(false);
  const isComplaint = f.kind === 'complaint';
  const toggle = () => {
    if (!open && f.unread && isComplaint) onOpen(f);
    setOpen(!open);
  };
  return (
    <li className={`fb-ticket ${open ? 'is-open' : ''}`} data-kind={f.kind}>
      <button type="button" className="fb-ticket__head" aria-expanded={open} onClick={toggle}>
        <span className="fb-ticket__kind">{f.kind === 'complaint' ? 'شكوى' : 'اقتراح'}</span>
        <span className="fb-ticket__main">
          <span className="fb-ticket__subject" dir="auto">{f.subject}</span>
          <span className="fb-ticket__meta">
            <bdi dir="ltr">#{f.number}</bdi>
            <span>{topicLabel(f.kind, f.topic)}</span>
            <span>{fmtDate(f.createdAt)}</span>
          </span>
        </span>
        {/* A suggestion is only delivered: no status to follow */}
        {isComplaint
          ? <span className={`fb-status fb-status--${f.status}`}>{STATUS_LABEL[f.status]}</span>
          : <span className="fb-status fb-status--sent">وصل</span>}
        {isComplaint && f.unread && <span className="fb-ticket__unread" aria-label="رد جديد" />}
        <ChevronDown className="fb-ticket__chev" size={20} aria-hidden />
      </button>
      {open && (
        <div className="fb-ticket__body">
          {isComplaint && <Progress status={f.status} />}
          {f.orderRef && <p className="fb-ticket__order">رقم الطلبية: <bdi dir="ltr">{f.orderRef}</bdi></p>}
          {isComplaint ? <Thread messages={f.messages} /> : (
            <p className="fb-ticket__message bidi-text" dir="auto">{f.messages[0]?.text}</p>
          )}
          {!isComplaint && <p className="fb-ticket__wait">وصل اقتراحك لإدارة إكسيوس. شكراً لك.</p>}
          {isComplaint && !f.messages.some((m) => m.from === 'staff') && (
            <p className="fb-ticket__wait">سيصلك رد المكتب هنا، ونراجع الشكاوى عادة خلال يوم عمل.</p>
          )}
          {isComplaint && (f.canReply
            ? <Composer f={f} onUpdated={onUpdated} />
            : <p className="fb-ticket__wait">هذه الشكوى مغلقة. إذا احتجت شيئاً آخر أرسل شكوى جديدة.</p>)}
        </div>
      )}
    </li>
  );
};

const SuggestionsPage = () => {
  const [kind, setKind] = useState<Kind>('complaint');
  const [topic, setTopic] = useState('delay');
  const [subject, setSubject] = useState('');
  const [message, setMessage] = useState('');
  const [orderRef, setOrderRef] = useState('');
  const [orderId, setOrderId] = useState('');
  const [orders, setOrders] = useState<MyOrder[] | null>(null);
  const [manual, setManual] = useState(false);
  const [sending, setSending] = useState(false);
  const [formError, setFormError] = useState('');
  const [tried, setTried] = useState(false);
  const [sent, setSent] = useState<Feedback | null>(null);
  const [files, setFiles] = useState<File[]>([]);

  const [list, setList] = useState<Feedback[]>([]);
  const [listState, setListState] = useState<'loading' | 'ready' | 'error'>('loading');
  const subjectRef = useRef<HTMLInputElement>(null);

  const load = async () => {
    setListState('loading');
    try {
      const res = await api.get('client/feedback');
      setList(Array.isArray(res.data) ? res.data : []);
      setListState('ready');
    } catch {
      setListState('error');
    }
  };
  useEffect(() => {
    load();
    // Without the list the form falls back to typing the number
    api.get('client/feedback/orders')
      .then((res: any) => setOrders(Array.isArray(res.data) ? res.data : []))
      .catch(() => setOrders([]));
  }, []);
  const picking = !!orders?.length && !manual;

  const pickKind = (k: Kind) => {
    setKind(k);
    setTopic(TOPICS[k][0].key);
  };

  const errors = {
    subject: subject.trim().length < 3 ? 'اكتب عنواناً قصيراً، مثل: «الطرد وصل ناقص قطعة»' : '',
    message: message.trim().length < 10 ? 'اكتب التفاصيل في 10 أحرف على الأقل' : '',
  };

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    setTried(true);
    setFormError('');
    if (errors.subject || errors.message) return;
    setSending(true);
    try {
      const form = new FormData();
      Object.entries({ kind, topic, subject, message }).forEach(([k, v]) => form.append(k, v));
      if (kind === 'complaint') {
        if (picking && orderId) form.append('order', orderId);
        if (!picking && orderRef) form.append('orderRef', orderRef);
        files.forEach((file) => form.append('images', file));
      }
      const created: Feedback = await sendForm('client/feedback', form);
      setSent(created);
      setList((l) => [created, ...l]);
      setSubject(''); setMessage(''); setOrderRef(''); setOrderId(''); setManual(false); setFiles([]); setTried(false);
    } catch (err) {
      setFormError(errorText(err));
    } finally {
      setSending(false);
    }
  };

  const markSeen = (f: Feedback) => {
    setList((l) => l.map((x) => (x._id === f._id ? { ...x, unread: false } : x)));
    api.post(`client/feedback/${f._id}/seen`, {}).catch(() => undefined);
  };

  const replaceOne = (f: Feedback) => setList((l) => l.map((x) => (x._id === f._id ? f : x)));

  const unread = useMemo(() => list.filter((f) => f.kind === 'complaint' && f.unread).length, [list]);
  // Only complaints are followed up; suggestions are just delivered
  const open = useMemo(() => list.filter((f) => f.kind === 'complaint' && (f.status === 'new' || f.status === 'in_progress')).length, [list]);

  return (
    <div dir="rtl" lang="ar" className="fb-page w-full px-4 pb-16 pt-6 sm:px-6 lg:px-8 lg:pt-8">
      <div className="mx-auto max-w-6xl">
        <header>
          <h1 className="text-2xl font-extrabold text-zinc-900 sm:text-3xl">شكوى أو اقتراح</h1>
          <p className="mt-1 max-w-[62ch] text-base leading-relaxed text-zinc-600 sm:text-lg">
            اكتب لنا مباشرة من هنا. تصل رسالتك لإدارة إكسيوس، وتتابع حالتها والرد عليها في هذه الصفحة.
          </p>
        </header>

        <div className="fb-layout mt-8">
          {/* The form */}
          <section className="fb-card" aria-labelledby="fb-form-title">
            {sent ? (
              <div className="fb-sent" role="status">
                <CheckCircle2 size={44} className="fb-sent__icon" aria-hidden />
                <h2 id="fb-form-title" className="text-xl font-extrabold text-zinc-900">
                  {sent.kind === 'complaint' ? 'وصلت شكواك' : 'وصل اقتراحك'}
                </h2>
                {sent.kind === 'complaint' && <p className="fb-sent__number">رقم الطلب <bdi dir="ltr">#{sent.number}</bdi></p>}
                <p className="mt-2 text-base leading-relaxed text-zinc-600">
                  {sent.kind === 'complaint'
                    ? 'ستتابع حالتها والرد عليها في قائمة «طلباتي». اذكر هذا الرقم إذا تواصلت معنا على واتساب.'
                    : 'وصل اقتراحك لإدارة إكسيوس. شكراً لك على فكرتك.'}
                </p>
                <button type="button" className="fb-btn fb-btn--ghost mt-5" onClick={() => { setSent(null); setTimeout(() => subjectRef.current?.focus(), 0); }}>
                  إرسال طلب آخر
                </button>
              </div>
            ) : (
              <form onSubmit={submit} noValidate>
                <h2 id="fb-form-title" className="sr-only">طلب جديد</h2>
                <div className="fb-kind" role="radiogroup" aria-label="نوع الطلب">
                  <button type="button" role="radio" aria-checked={kind === 'complaint'} className={kind === 'complaint' ? 'is-active' : ''} data-kind="complaint" onClick={() => pickKind('complaint')}>
                    <MessageSquareWarning size={24} aria-hidden />
                    <span><b>شكوى</b><small>مشكلة في شحنة أو خدمة</small></span>
                  </button>
                  <button type="button" role="radio" aria-checked={kind === 'suggestion'} className={kind === 'suggestion' ? 'is-active' : ''} data-kind="suggestion" onClick={() => pickKind('suggestion')}>
                    <Lightbulb size={24} aria-hidden />
                    <span><b>اقتراح</b><small>فكرة نحسّن بها خدمتنا</small></span>
                  </button>
                </div>

                <fieldset className="mt-6">
                  <legend className="fb-label">الموضوع</legend>
                  <div className="fb-topics">
                    {TOPICS[kind].map((t) => (
                      <button key={t.key} type="button" aria-pressed={topic === t.key} className={topic === t.key ? 'is-active' : ''} onClick={() => setTopic(t.key)}>
                        {t.label}
                      </button>
                    ))}
                  </div>
                </fieldset>

                <label className="fb-field mt-6">
                  <span className="fb-label">العنوان</span>
                  <input
                    ref={subjectRef}
                    value={subject}
                    maxLength={140}
                    onChange={(e) => setSubject(e.target.value)}
                    placeholder={kind === 'complaint' ? 'مثال: الطرد وصل ناقص قطعة' : 'مثال: إضافة تتبع لحظي للرحلات'}
                    aria-invalid={tried && !!errors.subject}
                    dir="auto"
                  />
                  {tried && errors.subject && <span className="fb-error">{errors.subject}</span>}
                </label>

                {kind === 'complaint' && orders === null && (
                  <div className="mt-6" aria-hidden>
                    <span className="fb-label">الطلبية</span>
                    <div className="fb-skeleton" />
                  </div>
                )}
                {kind === 'complaint' && picking && (
                  <fieldset className="mt-6">
                    <legend className="fb-label">الطلبية <span className="fb-optional">اختر الطلبية التي تخصها الشكوى</span></legend>
                    <OrderPicker orders={orders!} value={orderId} onChange={setOrderId} />
                    <button type="button" className="fb-link" onClick={() => { setManual(true); setOrderId(''); }}>الطلبية غير موجودة؟ اكتب رقمها</button>
                  </fieldset>
                )}
                {kind === 'complaint' && orders !== null && !picking && (
                  <label className="fb-field mt-6">
                    <span className="fb-label">رقم الطلبية <span className="fb-optional">اختياري</span></span>
                    <input value={orderRef} maxLength={40} onChange={(e) => setOrderRef(e.target.value)} placeholder="مثال: EX-24518" dir="ltr" />
                    <span className="fb-hint">إذا كانت الشكوى عن طلبية معينة، يساعدنا الرقم على الوصول لها أسرع.</span>
                    {!!orders.length && <button type="button" className="fb-link" onClick={() => { setManual(false); setOrderRef(''); }}>اختر من طلبياتي</button>}
                  </label>
                )}

                <label className="fb-field mt-6">
                  <span className="fb-label">التفاصيل</span>
                  <textarea
                    value={message}
                    maxLength={MAX}
                    rows={6}
                    onChange={(e) => setMessage(e.target.value)}
                    placeholder={kind === 'complaint' ? 'ماذا حدث؟ ومتى؟ وما الذي تتوقعه منا؟' : 'ما فكرتك؟ وكيف ستساعدك؟'}
                    aria-invalid={tried && !!errors.message}
                    dir="auto"
                  />
                  <span className="fb-field__foot">
                    {tried && errors.message ? <span className="fb-error">{errors.message}</span> : <span />}
                    <span className={`fb-count ${message.length > MAX - 200 ? 'is-near' : ''}`} dir="ltr">{message.length} / {MAX}</span>
                  </span>
                </label>

                {kind === 'complaint' && (
                  <div className="mt-6">
                    <span className="fb-label">صور <span className="fb-optional">اختياري</span></span>
                    <ImagePicker files={files} onChange={setFiles} />
                  </div>
                )}

                {formError && <p className="fb-form-error" role="alert">{formError}</p>}

                <button type="submit" className="fb-btn fb-btn--primary mt-8 w-full" disabled={sending}>
                  {sending ? <RefreshCw size={18} className="fb-spin" aria-hidden /> : <Send size={18} aria-hidden />}
                  {sending ? 'جارٍ الإرسال…' : kind === 'complaint' ? 'إرسال الشكوى' : 'إرسال الاقتراح'}
                </button>
              </form>
            )}
          </section>

          {/* The customer's requests */}
          <section className="fb-mine" aria-labelledby="fb-mine-title">
            <div className="flex flex-wrap items-baseline justify-between gap-2">
              <h2 id="fb-mine-title" className="text-xl font-extrabold text-zinc-900">طلباتي</h2>
              {listState === 'ready' && list.some((f) => f.kind === 'complaint') && (
                <p className="text-sm font-semibold text-zinc-600">
                  {open > 0 ? `${open} قيد المتابعة` : 'لا توجد شكاوى مفتوحة'}
                  {unread > 0 && <span className="fb-unread-count">{unread === 1 ? 'رد جديد' : `${unread} ردود جديدة`}</span>}
                </p>
              )}
            </div>

            {listState === 'loading' && (
              <div className="mt-4 space-y-3" aria-hidden>{[0, 1, 2].map((i) => <div key={i} className="fb-skeleton" />)}</div>
            )}
            {listState === 'error' && (
              <div className="fb-empty mt-4">
                <p className="font-bold text-zinc-900">تعذر تحميل طلباتك</p>
                <button type="button" className="fb-btn fb-btn--ghost mt-3" onClick={load}><RefreshCw size={16} aria-hidden /> إعادة المحاولة</button>
              </div>
            )}
            {listState === 'ready' && list.length === 0 && (
              <div className="fb-empty mt-4">
                <p className="font-bold text-zinc-900">لم ترسل أي طلب بعد</p>
                <p className="mt-1 text-zinc-600">عندما ترسل شكوى أو اقتراحاً ستجده هنا مع حالته ورد المكتب.</p>
              </div>
            )}
            {listState === 'ready' && list.length > 0 && (
              <ul className="fb-list mt-5">
                {list.map((f) => <Ticket key={f._id} f={f} onOpen={markSeen} onUpdated={replaceOne} />)}
              </ul>
            )}
          </section>
        </div>
      </div>
    </div>
  );
};

export default SuggestionsPage;
