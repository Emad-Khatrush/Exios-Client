import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { ArrowLeft, Gift } from 'lucide-react';
import api from '../../api';
import { dateText } from '../ClientOrders/orderUtils';
import { LoyaltyResponse } from '../PointsPage/loyaltyTypes';
import { pointsText, usdText } from '../PointsPage/pointsFormat';

/* The customer's points balance, linking to the points page. Nothing is shown while it loads or
   if it fails, so the home page never jumps or shows an error for an extra block. */
const PointsCard = () => {
  const [data, setData] = useState<LoyaltyResponse | null>(null);

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
        <small>نقاطي</small>
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
