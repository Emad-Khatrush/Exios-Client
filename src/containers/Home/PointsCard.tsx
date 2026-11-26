import { useEffect, useState } from 'react';
import TeaserPointsCard from './TeaserPointsCard';
import { Link } from 'react-router-dom';
import { ArrowLeft, Gift } from 'lucide-react';
import api from '../../api';
import { dateText } from '../ClientOrders/orderUtils';
import LevelEmblem from '../PointsPage/LevelEmblem';
import { LoyaltyResponse, shownPoints } from '../PointsPage/loyaltyTypes';
import { pointsText, usdText } from '../PointsPage/pointsFormat';
import { usePromotions } from '../PointsPage/PromotionBanner';
import { isActive } from '../PointsPage/promotions';
import OfferPointsCard from './OfferPointsCard';

/* The customer's points balance, linking to the points page. Nothing is shown while it loads or
   if it fails, so the home page never jumps or shows an error for an extra block. */
const PointsCard = () => {
  const [data, setData] = useState<LoyaltyResponse | null>(null);
  const promotions = usePromotions();
  // With offers about, the clock ticks each second so a coming offer turns into the running one by itself
  const [now, setNow] = useState(() => new Date());
  useEffect(() => {
    if (!promotions.length) return undefined;
    const t = window.setInterval(() => setNow(new Date()), 1000);
    return () => window.clearInterval(t);
  }, [promotions.length]);

  useEffect(() => {
    let alive = true;
    api.getLoyalty()
      .then((res: any) => { if (alive && typeof res?.data?.points === 'number') setData(res.data); })
      .catch(() => undefined);
    return () => { alive = false; };
  }, []);

  if (!data) return null;

  // A running offer higher than the customer's membership turns this into the offer card
  const levelPct = data.level ? Math.round(data.level.multiplier * 100) : 100;
  const beats = promotions.filter((p) => p.multiplierPct > levelPct).sort((a, b) => b.multiplierPct - a.multiplierPct);
  const offer = beats.find((p) => isActive(p, now));
  if (offer) return <OfferPointsCard offer={offer} levelPct={levelPct} points={shownPoints(data)} />;
  // An announced offer still to come: the countdown to its start (the soonest one)
  const coming = beats.filter((p) => new Date(p.startsAt).getTime() > now.getTime())
    .sort((a, b) => new Date(a.startsAt).getTime() - new Date(b.startsAt).getTime())[0];
  if (coming) return <TeaserPointsCard offer={coming} now={now} />;

  return (
    <Link to="/points" className="hm-points">
      <span className="hm-points__icon" aria-hidden><Gift size={22} /></span>
      <span className="hm-points__body">
        <small>
          نقاطي
          {data.level && (
            <span className="hm-points__level" style={{ ['--lv' as any]: data.level.color }}>
              <LevelEmblem levelKey={data.level.level} rank={data.level.rank} size={18} />{data.level.name}
            </span>
          )}
        </small>
        <span className="hm-points__balance">
          <bdi dir="ltr"><b>{pointsText(shownPoints(data))}</b> نقطة</bdi>
          <span className="hm-points__usd">= <bdi dir="ltr">{usdText(shownPoints(data))}</bdi></span>
        </span>
        {data.expiringSoon && data.expiringSoon.points > 0 && (
          <span className="hm-points__soon">تنتهي {pointsText(data.expiringSoon.points)} نقطة في {dateText(data.expiringSoon.at)}</span>
        )}
        {data.giftsWaiting && data.giftsWaiting.points > 0 && (
          <span className="hm-points__soon">🎁 استعمل هديتك في أول فاتورة قبل {dateText(data.giftsWaiting.until)}</span>
        )}
      </span>
      <ArrowLeft size={18} aria-hidden />
    </Link>
  );
};

export default PointsCard;
