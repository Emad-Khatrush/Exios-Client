import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Check, Gift, HeartHandshake, Loader2, PackageCheck, RefreshCw, Star } from 'lucide-react';
import api from '../../api';
import { QUESTIONS, Stars } from '../../components/OrderRatingWidget/OrderRatingWidget';
import { PendingRatings, POINTS_EACH, pointsText, rateButtonText, rateThanksText } from './rateText';
import '../OrderInfoPage/orderInfo.css';
import './rate.css';

const KIND: Record<string, string> = { shipping: 'شحن', purchase: 'فاتورة شراء', remittance: 'حوالة' };
const TRACKS_SHOWN = 3;
const dayText = (d: string) => new Date(d).toLocaleDateString('ar-LY-u-nu-latn', { day: 'numeric', month: 'long' });

/* "قيّم خدمتنا": every order received and not rated yet, all ticked, rated at once; 3 points each
   (within 30 days of receiving it). Opened from the home card and the reminder notification. */
const RatePage = () => {
  const [data, setData] = useState<PendingRatings | null>(null);
  const [failed, setFailed] = useState(false);
  const [picked, setPicked] = useState<string[]>([]);
  const [values, setValues] = useState<Record<string, any>>({});
  const [sending, setSending] = useState(false);
  const [error, setError] = useState('');
  const [done, setDone] = useState<{ rated: number, points: number } | null>(null);

  const load = () => {
    setFailed(false);
    api.getPendingRatings()
      .then((res: any) => {
        if (!Array.isArray(res?.data?.orders)) { setFailed(true); return; }
        setData(res.data);
        setPicked(res.data.orders.map((o: any) => String(o._id)));
      })
      .catch(() => setFailed(true));
  };
  useEffect(() => { load(); }, []);

  const toggle = (id: string) => setPicked((p) => (p.includes(id) ? p.filter((x) => x !== id) : [...p, id]));
  const complete = QUESTIONS.every((q) => (q.type === 'text' ? String(values[q.name] || '').trim() : values[q.name]));
  const earning = data?.off ? 0 : picked.length;

  const send = async () => {
    if (!picked.length) { setError('اختر طلبية واحدة على الأقل.'); return; }
    if (!complete) { setError('قيّم بالنجوم واكتب رأيك قبل الإرسال.'); return; }
    setError('');
    setSending(true);
    try {
      const res: any = await api.rateOrders(picked, QUESTIONS.map((q) => ({ ...q, value: values[q.name] })));
      if (!res?.data) throw new Error('offline');
      setDone(res.data);
    } catch {
      setError('لم يُرسل تقييمك. تحقق من اتصالك وحاول مرة أخرى.');
    }
    setSending(false);
  };

  return (
    <div dir="rtl" lang="ar" className="rt-page w-full px-4 pb-16 pt-6 sm:px-6 lg:px-8 lg:pt-8">
      <div className="mx-auto max-w-2xl">
        <header className="rt-head">
          <span className="rt-head__icon" aria-hidden><Star size={24} /></span>
          <div>
            <h1>قيّم خدمتنا</h1>
            <p>رأيك يساعدنا نحسّن خدمتنا، ونضيف لك {pointsText(POINTS_EACH)} عن كل طلبية تقيّمها.</p>
          </div>
        </header>

        {failed && (
          <div className="rt-state" role="alert">
            <b>تعذّر تحميل طلبياتك</b>
            <button type="button" className="rt-btn rt-btn--ghost" onClick={load}><RefreshCw size={16} aria-hidden /> إعادة المحاولة</button>
          </div>
        )}
        {!failed && !data && <div className="rt-sk" aria-busy="true" />}

        {done && (
          <section className="rt-done" role="status">
            <span className="rt-done__icon" aria-hidden><HeartHandshake size={34} /></span>
            <h2>{rateThanksText(done.points)}</h2>
            <p>قيّمت {done.rated === 1 ? 'طلبية واحدة' : done.rated === 2 ? 'طلبيتين' : `${done.rated} طلبيات`}. رأيك يصل للإدارة مباشرة.</p>
            <div className="rt-done__actions">
              {done.points > 0 && <Link to="/points" className="rt-btn"><Gift size={17} aria-hidden /> نقاطي</Link>}
              <Link to="/home" className="rt-btn rt-btn--ghost">الرئيسية</Link>
            </div>
          </section>
        )}

        {data && !done && !data.orders.length && (
          <div className="rt-state">
            <span className="rt-state__icon" aria-hidden><PackageCheck size={26} /></span>
            <b>لا توجد طلبيات تنتظر تقييمك</b>
            <p>عندما تستلم طلبية جديدة تظهر هنا، وتكسب {pointsText(POINTS_EACH)} بتقييمها خلال {data.days} يوماً.</p>
          </div>
        )}

        {data && !done && data.orders.length > 0 && (
          <>
            <section className="rt-card" aria-labelledby="rt-orders">
              <div className="rt-card__head">
                <h2 id="rt-orders">طلبياتك المستلمة <span>{data.orders.length}</span></h2>
                <p>تقييم واحد يشملها كلها. أزل العلامة عن أي طلبية لا تريد تقييمها.</p>
              </div>
              <ul className="rt-orders">
                {data.orders.map((o) => {
                  const on = picked.includes(String(o._id));
                  return (
                    <li key={o._id}>
                      <button type="button" role="checkbox" aria-checked={on} className={`rt-order${on ? ' is-on' : ''}`} onClick={() => toggle(String(o._id))}>
                        <span className="rt-order__check" aria-hidden><Check size={14} strokeWidth={3} /></span>
                        <span className="rt-order__main">
                          <b><bdi dir="ltr">{o.orderId}</bdi> <small>{KIND[o.kind] || 'طلبية'}</small></b>
                          {o.trackingNumbers.length > 0 && (
                            <span className="rt-order__tracks">
                              {o.trackingNumbers.slice(0, TRACKS_SHOWN).map((t) => <bdi key={t} dir="ltr">{t}</bdi>)}
                              {o.trackingNumbers.length > TRACKS_SHOWN && <em>+{o.trackingNumbers.length - TRACKS_SHOWN}</em>}
                            </span>
                          )}
                        </span>
                        <span className="rt-order__side">
                          <small>استلمتها {dayText(o.deliveredAt)}</small>
                          {!data.off && <em className="rt-order__pts"><bdi dir="ltr">+{POINTS_EACH}</bdi></em>}
                        </span>
                      </button>
                    </li>
                  );
                })}
              </ul>
            </section>

            <section className="oi-card oi-rate rt-form" aria-labelledby="rt-form-title">
              <h2 id="rt-form-title" className="oi-card__title">كيف كانت تجربتك؟</h2>
              {QUESTIONS.filter((q) => q.type === 'rating').map((q) => (
                <Stars key={q.name} label={q.label} value={values[q.name] || 0} onChange={(v) => setValues((s) => ({ ...s, [q.name]: v }))} disabled={sending} />
              ))}
              <label className="oi-rate__text">
                <span>اكتب لنا رأيك</span>
                <textarea rows={3} value={values.reviewQuestion || ''} onChange={(e) => setValues((s) => ({ ...s, reviewQuestion: e.target.value }))}
                  placeholder="ما الذي أعجبك؟ وما الذي نحسّنه؟" disabled={sending} />
              </label>
              {error && <p className="oi-error" role="alert">{error}</p>}
              <button type="button" className="oi-btn oi-btn--primary oi-btn--block rt-send" onClick={send} disabled={sending || !picked.length}>
                {sending ? <Loader2 size={18} className="oi-spin" aria-hidden /> : <Gift size={17} aria-hidden />}
                {data.off ? 'أرسل التقييم' : rateButtonText(earning)}
              </button>
            </section>
          </>
        )}
      </div>
    </div>
  );
};

export default RatePage;
