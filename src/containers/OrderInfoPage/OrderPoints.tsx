import { Link } from 'react-router-dom';
import { Coins } from 'lucide-react';
import { OrderLoyalty } from '../PointsPage/loyaltyTypes';
import { pointsText, usdText } from '../PointsPage/pointsFormat';

// Read only: shows this order's points and what could be used. Redeeming is done by staff.
// The data is loaded by the order page (the packages show their own points).
const OrderPoints = ({ data, isPurchase = false }: { data: OrderLoyalty | null, isPurchase?: boolean }) => {
  if (!data) return null;

  const { earned, pending, redeemed, noPoints, quote } = data;
  const canUse = !!quote && quote.owedCents > 0 && quote.maxPoints > 0;
  // A shipment's points on the way are shown on each package; the purchase invoice has no package
  const showPending = isPurchase && pending > 0;
  if (!earned && !showPending && !redeemed && !noPoints && !canUse) return null;

  return (
    <div className="oi-points">
      <h3 className="oi-points__title"><Coins size={16} aria-hidden /> نقاط هذه الطلبية</h3>
      {noPoints ? (
        <p className="oi-points__line">{noPoints.reason}</p>
      ) : showPending ? (
        <>
          <p className="oi-points__line"><bdi dir="ltr">{pointsText(pending)}</bdi> نقطة في الطريق</p>
          <p className="oi-points__hint">تُضاف بعد دفع الفاتورة كاملة.</p>
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
