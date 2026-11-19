import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { ArrowLeft, CalendarClock, Flame } from 'lucide-react';
import api from '../../api';
import { LoyaltyPromotion } from './loyaltyTypes';
import { isActive, promotionLine, startsInText, timeLeft, timesText } from './promotions';

/* The points offers running now or soon (GET /client/loyalty/promotions), read once per page.
   Nothing on failure or when the customer's points are off. */
export const usePromotions = () => {
  const [list, setList] = useState<LoyaltyPromotion[]>([]);
  useEffect(() => {
    let alive = true;
    api.getLoyaltyPromotions()
      .then((res: any) => { if (alive && Array.isArray(res?.data?.promotions)) setList(res.data.promotions); })
      .catch(() => undefined);
    return () => { alive = false; };
  }, []);
  return list;
};

// The clock moves on its own each minute, so the countdown stays true while the page is open
const useNow = () => {
  const [now, setNow] = useState(() => new Date());
  useEffect(() => {
    const t = window.setInterval(() => setNow(new Date()), 60_000);
    return () => window.clearInterval(t);
  }, []);
  return now;
};

/* Above the balance: each running offer as a warm band with its multiplier, what it covers, the
   countdown and where to order; an offer about to start as one quiet line */
const PromotionBanner = ({ promotions, levelPct = 100 }: { promotions: LoyaltyPromotion[], levelPct?: number }) => {
  const now = useNow();
  const running = promotions.filter((p) => isActive(p, now));
  const soon = promotions.filter((p) => new Date(p.startsAt).getTime() > now.getTime());
  if (!running.length && !soon.length) return null;
  return (
    <div className="pr-offers">
      {running.map((p) => (
        <section key={p.id} className="pr-offer" aria-label={`عرض ${p.name}`}>
          <span className="pr-offer__times" aria-hidden><Flame size={18} /><bdi dir="ltr">{timesText(p.multiplierPct)}</bdi></span>
          <div className="pr-offer__text">
            <b dir="auto">{p.name}</b>
            <span>{p.multiplierPct > levelPct
              ? promotionLine(p)
              : `عضويتك ${timesText(levelPct)} أعلى من هذا العرض، فنقاطك تبقى ${timesText(levelPct)}`}</span>
            <small className="pr-offer__left"><CalendarClock size={14} aria-hidden /> {timeLeft(p.endsAt, now).text}</small>
          </div>
          <Link className="pr-offer__go" to={p.kinds.includes('shipping') ? '/start-shipment' : '/prices/purchase'}>
            اطلب الآن <ArrowLeft size={16} aria-hidden />
          </Link>
        </section>
      ))}
      {soon.map((p) => (
        <p key={p.id} className="pr-soon">
          <Flame size={15} aria-hidden /> <b dir="auto">{p.name}</b>: {promotionLine(p)} · {startsInText(p.startsAt, now)}
        </p>
      ))}
    </div>
  );
};

export default PromotionBanner;
