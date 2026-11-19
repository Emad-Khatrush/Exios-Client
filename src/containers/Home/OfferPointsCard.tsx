import { useEffect, useId, useState } from 'react';
import { Link } from 'react-router-dom';
import { ArrowLeft, Flame } from 'lucide-react';
import { LoyaltyPromotion } from '../PointsPage/loyaltyTypes';
import { pointsText, usdText } from '../PointsPage/pointsFormat';
import { EarnKind, countdownParts, coverText, offerPoints, timesText } from '../PointsPage/promotions';

/* The points card on home while an offer beats the customer's membership: what the offer is, a
   live countdown, a slider that works out what an order of any amount earns now against without
   the offer, the balance, and where to order. Back to the usual card when the offer ends. */

type Props = { offer: LoyaltyPromotion, levelPct: number, points: number };

// The kind the calculator speaks of: shipping first, as most orders are shipments
const KIND_WORD: Record<EarnKind, { label: string, cta: string, to: string }> = {
  shipping: { label: 'شحنة', cta: 'ابدأ شحنة الآن', to: '/start-shipment' },
  purchase: { label: 'فاتورة شراء', cta: 'اطلب الشراء الآن', to: '/prices/purchase' },
  remittance: { label: 'حوالة', cta: 'اطلب الحوالة الآن', to: '/prices/transfers' },
};

const useSecondClock = () => {
  const [now, setNow] = useState(() => new Date());
  useEffect(() => {
    const t = window.setInterval(() => setNow(new Date()), 1000);
    return () => window.clearInterval(t);
  }, []);
  return now;
};

const OfferPointsCard = ({ offer, levelPct, points }: Props) => {
  const now = useSecondClock();
  const sliderId = useId();
  const [usd, setUsd] = useState(200);
  const kind: EarnKind = offer.kinds.includes('shipping') ? 'shipping' : offer.kinds.includes('purchase') ? 'purchase' : 'remittance';
  const word = KIND_WORD[kind];
  const calc = offerPoints(usd, kind, levelPct, offer.multiplierPct);
  const left = countdownParts(offer.endsAt, now);
  // The slider's filled part, for its track
  const fill = `${((usd - 20) / (2000 - 20)) * 100}%`;

  return (
    <section className="op-card" aria-labelledby="op-title">
      <span className="op-card__sparks" aria-hidden><i /><i /><i /><i /><i /><i /></span>

      <div className="op-card__head">
        <div>
          <p className="op-card__kicker"><Flame size={16} aria-hidden className="op-flame" /> عرض النقاط</p>
          <h2 id="op-title" dir="auto">{offer.name}</h2>
          <p className="op-card__cover">نقاطك مضاعفة على {coverText(offer)}</p>
        </div>
        <span className="op-card__times" aria-label={`نقاطك ${timesText(offer.multiplierPct)}`}><bdi dir="ltr">{timesText(offer.multiplierPct)}</bdi></span>
      </div>

      <div className="op-count" role="timer" aria-label={`ينتهي العرض خلال ${left.days} يوم و${left.hours} ساعة`}>
        <span className="op-count__label">ينتهي خلال</span>
        <div className="op-count__boxes" dir="ltr">
          {[[left.days, 'يوم'], [left.hours, 'ساعة'], [left.minutes, 'دقيقة'], [left.seconds, 'ثانية']].map(([value, unit], i) => (
            <span key={unit} className="op-count__box">
              <b key={value} className={i === 3 ? 'is-tick' : undefined}>{value}</b>
              <small>{unit}</small>
            </span>
          ))}
        </div>
      </div>

      <div className="op-calc">
        <label htmlFor={sliderId}>احسب نقاطك: {word.label} بـ <bdi dir="ltr" className="op-calc__usd">${usd.toLocaleString('en-US')}</bdi></label>
        <input
          id={sliderId}
          type="range"
          min={20}
          max={2000}
          step={10}
          value={usd}
          onChange={(e) => setUsd(Number(e.target.value))}
          style={{ ['--fill' as any]: fill }}
          dir="ltr"
        />
        <p className="op-calc__result" aria-live="polite">
          = <b key={calc.now} className="op-calc__now"><bdi dir="ltr">{pointsText(calc.now)}</bdi> نقطة</b> الآن
          {calc.extra > 0 && <> <span className="op-calc__was">(بدل <s><bdi dir="ltr">{pointsText(calc.before)}</bdi></s>)</span></>}
        </p>
        {calc.extra > 0 && (
          <p className="op-calc__extra">تربح <bdi dir="ltr">{pointsText(calc.extra)}</bdi> نقطة إضافية = <bdi dir="ltr">{usdText(calc.extra)}</bdi></p>
        )}
      </div>

      <p className="op-card__balance">رصيدك <bdi dir="ltr">{pointsText(points)}</bdi> نقطة = <bdi dir="ltr">{usdText(points)}</bdi></p>

      <div className="op-card__actions">
        <Link to={word.to} className="op-btn op-btn--go">{word.cta} <ArrowLeft size={17} aria-hidden /></Link>
        <Link to="/points" className="op-btn op-btn--ghost">نقاطي</Link>
      </div>
    </section>
  );
};

export default OfferPointsCard;
