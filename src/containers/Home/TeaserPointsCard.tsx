import { Link } from 'react-router-dom';
import { ArrowLeft, Hourglass } from 'lucide-react';
import { LoyaltyPromotion } from '../PointsPage/loyaltyTypes';
import { countdownParts, coverText, lastDayText, startDayText, timesText } from '../PointsPage/promotions';

/* An announced offer before it starts: a calm, expectant card (deep purple to night blue) counting down
   to its start. PointsCard swaps it for the offer card the second the offer starts. */
const TeaserPointsCard = ({ offer, now }: { offer: LoyaltyPromotion, now: Date }) => {
  const left = countdownParts(offer.startsAt, now);
  return (
    <section className="op-card op-card--soon" aria-labelledby="op-soon-title">
      <span className="op-card__sparks" aria-hidden><i /><i /><i /><i /><i /><i /></span>

      <div className="op-card__head">
        <div>
          <p className="op-card__kicker"><Hourglass size={15} aria-hidden className="op-hourglass" /> قريباً</p>
          <h2 id="op-soon-title" dir="auto">{offer.name}</h2>
          <p className="op-card__cover">نقاطك مضاعفة على {coverText(offer)}</p>
        </div>
        <span className="op-card__times" aria-label={`نقاطك ${timesText(offer.multiplierPct)}`}><bdi dir="ltr">{timesText(offer.multiplierPct)}</bdi></span>
      </div>

      <div className="op-count" role="timer" aria-label={`يبدأ العرض خلال ${left.days} يوم و${left.hours} ساعة`}>
        <span className="op-count__label">يبدأ خلال</span>
        <div className="op-count__boxes" dir="ltr">
          {[[left.days, 'يوم'], [left.hours, 'ساعة'], [left.minutes, 'دقيقة'], [left.seconds, 'ثانية']].map(([value, unit], i) => (
            <span key={unit} className="op-count__box">
              <b key={value} className={i === 3 ? 'is-tick' : undefined}>{value}</b>
              <small>{unit}</small>
            </span>
          ))}
        </div>
        <span className="op-soon__dates">من {startDayText(offer.startsAt)} حتى {lastDayText(offer.endsAt)}</span>
      </div>

      <p className="op-soon__tip">
        💡 جهّز طلبيتك من الآن: كل طلبية تُنشئها خلال العرض تأخذ النقاط <bdi dir="ltr">{timesText(offer.multiplierPct)}</bdi>
      </p>

      <div className="op-card__actions">
        <Link to="/points" className="op-btn op-btn--go">تفاصيل نقاطي <ArrowLeft size={17} aria-hidden /></Link>
      </div>
    </section>
  );
};

export default TeaserPointsCard;
