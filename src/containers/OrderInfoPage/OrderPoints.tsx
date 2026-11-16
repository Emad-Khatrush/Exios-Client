import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Coins } from 'lucide-react';
import api from '../../api';
import { OrderLoyalty } from '../PointsPage/loyaltyTypes';
import { pointsText, usdText } from '../PointsPage/pointsFormat';

// Read only: shows this order's points and what could be used. Redeeming is done by staff.
const OrderPoints = ({ orderId, isPurchase = false }: { orderId: string, isPurchase?: boolean }) => {
  const [data, setData] = useState<OrderLoyalty | null>(null);

  useEffect(() => {
    let alive = true;
    setData(null);
    if (!orderId) return undefined;
    (async () => {
      try {
        const res: any = await api.getOrderLoyalty(orderId);
        const d = res?.data;
        if (alive && d && typeof d.earned === 'number') setData(d as OrderLoyalty);
      } catch {
        // nothing to show
      }
    })();
    return () => { alive = false; };
  }, [orderId]);

  if (!data) return null;

  const { earned, pending, redeemed, noPoints, quote } = data;
  const canUse = !!quote && quote.owedCents > 0 && quote.maxPoints > 0;
  if (!earned && !pending && !redeemed && !noPoints && !canUse) return null;

  return (
    <div className="oi-points">
      <h3 className="oi-points__title"><Coins size={16} aria-hidden /> نقاط هذه الطلبية</h3>
      {noPoints ? (
        <p className="oi-points__line">{noPoints.reason}</p>
      ) : pending > 0 ? (
        <>
          <p className="oi-points__line"><bdi dir="ltr">{pointsText(pending)}</bdi> نقطة في الطريق</p>
          <p className="oi-points__hint">{isPurchase ? 'تُضاف بعد دفع الفاتورة كاملة.' : 'تُضاف بعد دفع الطلبية كاملة واستلامها.'}</p>
        </>
      ) : earned > 0 ? (
        <p className="oi-points__line">حصلت على <bdi dir="ltr">{pointsText(earned)}</bdi> نقطة</p>
      ) : null}
      {redeemed > 0 && (
        <p className="oi-points__line">نقاط استُخدمت على هذه الطلبية: <bdi dir="ltr">{pointsText(redeemed)}</bdi> نقطة</p>
      )}
      {canUse && (
        <p className="oi-points__note">
          يمكنك دفع حتى <bdi dir="ltr">{pointsText(quote.maxPoints)}</bdi> نقطة (<bdi dir="ltr">{usdText(quote.maxPoints)}</bdi>) من هذه الفاتورة بنقاطك. اطلب ذلك من الموظف عند الاستلام أو الدفع.{' '}
          <Link to="/points">نقاطي</Link>
        </p>
      )}
    </div>
  );
};

export default OrderPoints;
