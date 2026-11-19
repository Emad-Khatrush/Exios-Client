import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { ArrowLeft, Gift } from 'lucide-react';
import api from '../../api';
import { dateText } from '../ClientOrders/orderUtils';
import LevelEmblem from '../PointsPage/LevelEmblem';
import { LoyaltyResponse } from '../PointsPage/loyaltyTypes';
import { pointsText, usdText } from '../PointsPage/pointsFormat';
import { usePromotions } from '../PointsPage/PromotionBanner';
import { isActive, timesText } from '../PointsPage/promotions';

/* The customer's points balance, linking to the points page. Nothing is shown while it loads or
   if it fails, so the home page never jumps or shows an error for an extra block. */
const PointsCard = () => {
  const [data, setData] = useState<LoyaltyResponse | null>(null);
  // A points offer running now: "×2 الآن" on the card (the highest one)
  const offer = usePromotions().filter((p) => isActive(p)).sort((a, b) => b.multiplierPct - a.multiplierPct)[0];

  useEffect(() => {
    let alive = true;
    api.getLoyalty()
      .then((res: any) => { if (alive && typeof res?.data?.points === 'number') setData(res.data); })
      .catch(() => undefined);
    return () => { alive = false; };
  }, []);

  if (!data) return null;

  return (
    <Link to="/points" className="hm-points">
      <span className="hm-points__icon" aria-hidden><Gift size={22} /></span>
      <span className="hm-points__body">
        <small>
          نقاطي
          {offer && <span className="hm-points__offer" title={offer.name}>🔥 <bdi dir="ltr">{timesText(offer.multiplierPct)}</bdi> الآن</span>}
          {data.level && (
            <span className="hm-points__level" style={{ ['--lv' as any]: data.level.color }}>
              <LevelEmblem levelKey={data.level.level} rank={data.level.rank} size={18} />{data.level.name}
            </span>
          )}
        </small>
        <span className="hm-points__balance">
          <bdi dir="ltr"><b>{pointsText(data.points)}</b> نقطة</bdi>
          <span className="hm-points__usd">= <bdi dir="ltr">{usdText(data.points)}</bdi></span>
        </span>
        {data.expiringSoon && data.expiringSoon.points > 0 && (
          <span className="hm-points__soon">تنتهي {pointsText(data.expiringSoon.points)} نقطة في {dateText(data.expiringSoon.at)}</span>
        )}
      </span>
      <ArrowLeft size={18} aria-hidden />
    </Link>
  );
};

export default PointsCard;
