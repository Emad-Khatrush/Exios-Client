import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { Gift, HeartHandshake, Loader2, Star } from 'lucide-react';
import api from '../../api';
import { POINTS_EACH, pointsText, rateThanksText } from '../../containers/RatePage/rateText';

// The questions the office reads; the names are what the API stores, so they stay as they are
export const QUESTIONS = [
  { name: 'employeeQuestion', label: 'كيف كان تعامل الموظفين معك؟', type: 'rating' },
  { name: 'generalQuestion', label: 'ما رأيك في الخدمة بشكل عام؟', type: 'rating' },
  { name: 'reviewQuestion', label: 'اكتب لنا رأيك', type: 'text' },
];

const WORDS = ['', 'سيئة', 'مقبولة', 'جيدة', 'جيدة جداً', 'ممتازة'];

export const Stars = ({ label, value, onChange, disabled }: { label: string, value: number, onChange: (v: number) => void, disabled: boolean }) => {
  const [hover, setHover] = useState(0);
  const shown = hover || value;
  return (
    <fieldset className="oi-rate__row">
      <legend>{label}</legend>
      <div className="oi-stars" onMouseLeave={() => setHover(0)}>
        {[1, 2, 3, 4, 5].map((n) => (
          <button
            key={n}
            type="button"
            className={n <= shown ? 'is-on' : ''}
            onClick={() => onChange(n)}
            onMouseEnter={() => setHover(n)}
            disabled={disabled}
            aria-pressed={value === n}
            aria-label={`${n} من 5`}
          >
            <Star size={26} aria-hidden />
          </button>
        ))}
        <span className="oi-stars__word" aria-live="polite">{WORDS[shown]}</span>
      </div>
    </fieldset>
  );
};

// Asked before the stars, so customers rate honestly instead of politely: the office reads every
// rating to improve, nothing changes for them, and the points come whatever they say (they do: the
// reward does not look at the stars)
export const HonestNote = () => (
  <p className="oi-rate__honest" dir="rtl" lang="ar">
    <span aria-hidden>🤝</span>
    <span><b>قل رأيك بكل صراحة.</b> نقرأ كل تقييم لنطوّر خدمتنا، ورأيك مهما كان لا يؤثر على تعاملنا معك. ونقاطك تُضاف كاملة سواء كان تقييمك إيجابياً أو سلبياً.</span>
  </p>
);

/* After delivery: two star ratings and a few words, sent once */
const OrderRatingWidget = () => {
  const { id: orderId } = useParams();
  const [values, setValues] = useState<Record<string, any>>({});
  const [sending, setSending] = useState(false);
  const [error, setError] = useState('');
  const [sent, setSent] = useState(false);
  // 2 points when this order still earns them (received within 30 days), and what the rating added
  const [earns, setEarns] = useState(false);
  const [added, setAdded] = useState(0);
  useEffect(() => {
    let alive = true;
    api.getPendingRatings()
      .then((res: any) => { if (alive && !res?.data?.off) setEarns((res?.data?.orders || []).some((o: any) => String(o._id) === String(orderId))); })
      .catch(() => undefined);
    return () => { alive = false; };
  }, [orderId]);

  const complete = QUESTIONS.every((q) => (q.type === 'text' ? String(values[q.name] || '').trim() : values[q.name]));

  const send = async () => {
    if (!complete) { setError('قيّم بالنجوم واكتب رأيك قبل الإرسال.'); return; }
    setError('');
    setSending(true);
    try {
      const res: any = await api.createRatingForOrder(orderId, { questions: QUESTIONS.map((q) => ({ ...q, value: values[q.name] })) });
      if (!res) throw new Error('offline');
      setAdded(Number(res?.data?.points) || 0);
      setSent(true);
    } catch {
      setError('لم يُرسل تقييمك. تحقق من اتصالك وحاول مرة أخرى.');
    }
    setSending(false);
  };

  if (sent) {
    return (
      <section className="oi-card oi-rate is-sent" aria-live="polite">
        <HeartHandshake size={30} aria-hidden />
        <b>{added > 0 ? rateThanksText(added) : 'وصلنا تقييمك، شكراً لك'}</b>
        <p>رأيك يساعدنا نحسّن خدمتنا.</p>
      </section>
    );
  }

  return (
    <section className="oi-card oi-rate" aria-labelledby="oi-rate-title">
      <h2 id="oi-rate-title" className="oi-card__title">كيف كانت تجربتك؟</h2>
      <p className="oi-muted">استلمت شحنتك. قيّم خدمتنا في أقل من دقيقة.</p>
      {earns && <p className="oi-rate__earn"><Gift size={16} aria-hidden /> قيّم واكسب {pointsText(POINTS_EACH)}</p>}
      <HonestNote />

      {QUESTIONS.filter((q) => q.type === 'rating').map((q) => (
        <Stars
          key={q.name}
          label={q.label}
          value={values[q.name] || 0}
          onChange={(v) => setValues((s) => ({ ...s, [q.name]: v }))}
          disabled={sending}
        />
      ))}

      <label className="oi-rate__text">
        <span>اكتب لنا رأيك</span>
        <textarea
          rows={3}
          value={values.reviewQuestion || ''}
          onChange={(e) => setValues((s) => ({ ...s, reviewQuestion: e.target.value }))}
          placeholder="ما الذي أعجبك؟ وما الذي نحسّنه؟"
          disabled={sending}
        />
      </label>

      {error && <p className="oi-error" role="alert">{error}</p>}

      <button type="button" className="oi-btn oi-btn--primary oi-btn--block" onClick={send} disabled={sending}>
        {sending ? <Loader2 size={18} className="oi-spin" aria-hidden /> : <Star size={17} aria-hidden />} إرسال التقييم
      </button>
    </section>
  );
};

export default OrderRatingWidget;
