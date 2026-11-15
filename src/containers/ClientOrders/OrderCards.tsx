import { Link } from 'react-router-dom';
import { AlertTriangle, ArrowLeft, Box, Check, Copy, OctagonX, Plane, ScanSearch, Ship, StickyNote } from 'lucide-react';
import Flag from '../PricesPage/Flag';
import { Package } from '../../models';
import { getOrderTheme } from '../../constants/orderThemes';
import {
  METHOD_SHORT, shipMethod, shippingCost,
  COUNTRY_KEYS, SHIPMENT_STAGES, dateText, goodsName, isBlocked, packageStage, packagesText, placeName, relativeDay,
  shipmentStage, stageKey, stageLabel, usd, visiblePackages,
} from './orderUtils';

type CopyProps = { copied: string, copy: (id: string, value: string) => void };

// A copy button that sits above the card's full-size link
const CopyId = ({ id, value, copied, copy }: CopyProps & { id: string, value: string }) => (
  <button
    type="button"
    className={`or-copy ${copied === id ? 'is-done' : ''}`}
    onClick={() => copy(id, value)}
    aria-label={`نسخ رقم الطلبية ${value}`}
  >
    <bdi dir="ltr">{value}</bdi>
    {copied === id ? <Check size={13} aria-hidden /> : <Copy size={13} aria-hidden />}
  </button>
);

const Note = ({ order }: { order: Package }) => {
  const note = order.customization?.note;
  if (!note) return null;
  const theme = getOrderTheme(order.customization?.theme);
  return (
    <p className="or-note" style={{ ['--note' as any]: theme.accent }}>
      <StickyNote size={14} aria-hidden />
      <span>{note}</span>
    </p>
  );
};

/* One shipment: what it is, where it comes from, and how far along it is */
export const ShipmentCard = ({ order, copied, copy }: { order: Package } & CopyProps) => {
  const stage = shipmentStage(order);
  const blocked = isBlocked(order);
  const key = blocked ? 'blocked' : order.unsureOrder ? 'unsure' : stageKey(order);
  const packages = visiblePackages(order);
  const tracking = packages.map((p) => p.deliveredPackages?.trackingNumber).filter(Boolean) as string[];
  const country = COUNTRY_KEYS.includes(order.shipment?.fromWhere) ? order.shipment.fromWhere : '';
  const from = placeName(order.shipment?.fromWhere);
  const method = shipMethod(order);
  const MethodIcon = blocked ? OctagonX : order.unsureOrder ? ScanSearch : method === 'sea' ? Ship : method === 'air' ? Plane : Box;
  // Not yet set by the office (and the order still moving): the customer should tell us air or sea
  const methodMissing = method === 'unknown' && !order.unsureOrder && !order.isCanceled && !order.isFinished;

  // How many packages already reached the last stop worth telling: ready or received
  const done = packages.filter((p) => packageStage(p) >= 3).length;
  const cost = shippingCost(packages);
  const theme = order.customization?.note ? getOrderTheme(order.customization?.theme) : null;

  return (
    <article className={`or-card is-${key} ${methodMissing && !blocked ? 'is-nomethod' : ''}`} style={theme ? { ['--note' as any]: theme.accent } : undefined}>
      <Link to={`/order/${order._id}`} className="or-card__link" aria-label={`عرض الطلبية ${order.orderId}`} />

      <header className="or-card__head">
        <span className="or-card__icon" aria-hidden>
          <MethodIcon size={20} />
          {methodMissing && !blocked && <span className="or-card__q">؟</span>}
        </span>
        <div className="or-card__title">
          <h3>{goodsName(order)}</h3>
          <p className="or-card__route">
            {country && <span className="flag-frame"><Flag country={country} size={15} /></span>}
            {from ? <span>من {from}</span> : method !== 'unknown' && <span>{METHOD_SHORT[method]}</span>}
            {(from || method !== 'unknown') && <span className="or-dot" aria-hidden />}
            <span>{relativeDay(order.createdAt)}</span>
          </p>
        </div>
        <span className={`or-pill is-${key}`}>{stageLabel(order)}</span>
      </header>

      {methodMissing && !blocked && (
        <p className="or-warn">
          <AlertTriangle size={17} aria-hidden />
          <span><b>طريقة الشحن غير محددة.</b> تواصل مع الشركة لتأكيدها: جوي أم بحري.</span>
        </p>
      )}

      {/* Stopped by the office: the reason they wrote takes the place of the progress */}
      {blocked && (
        <p className="or-blocked">
          <b>سبب الإيقاف</b>
          <span className="bidi-text" dir="auto">{order.shippingBlockReason || 'تواصل مع المكتب لمعرفة السبب.'}</span>
        </p>
      )}

      {!order.unsureOrder && !blocked && (
        // Where the shipment is, by name: passed stops are ticked, the current one is marked
        <ol className="or-stages" aria-label={`المرحلة ${stage + 1} من ${SHIPMENT_STAGES.length}: ${stageLabel(order)}`}>
          {SHIPMENT_STAGES.map((s, i) => {
            const done = i < stage || (i === stage && s.key === 'delivered');
            return (
              <li key={s.key} className={done ? 'is-done' : i === stage ? 'is-now' : ''} aria-current={i === stage ? 'step' : undefined}>
                <span className="or-stages__dot" aria-hidden>{done && <Check size={11} strokeWidth={3.5} />}</span>
                <span className="or-stages__label">{i === 0 && order.isPayment ? 'الشراء' : s.short}</span>
              </li>
            );
          })}
        </ol>
      )}

      <div className="or-card__meta">
        <CopyId id={`o-${order._id}`} value={order.orderId} copied={copied} copy={copy} />
        {cost.priced > 0 && (
          <span className="or-card__cost" title={cost.priced < cost.count ? `لـ ${cost.priced} من ${cost.count} طرود` : undefined}>
            إجمالي الشحن <b><bdi dir="ltr">{usd(cost.total)}</bdi></b>{cost.priced < cost.count && <em>+</em>}
          </span>
        )}
        {!!packages.length && (
          <span className="or-card__pkgs">
            {packagesText(packages.length)}
            {done > 0 && done < packages.length && <> · <b>وصل منها {done}</b></>}
          </span>
        )}
      </div>

      {!!tracking.length && (
        <ul className="or-tracks" aria-label="أرقام التتبع">
          {tracking.slice(0, 3).map((t) => <li key={t}><bdi dir="ltr">{t}</bdi></li>)}
          {tracking.length > 3 && <li className="or-tracks__more">+{tracking.length - 3}</li>}
        </ul>
      )}

      <Note order={order} />

      <span className="or-card__go" aria-hidden>التفاصيل <ArrowLeft size={15} /></span>
    </article>
  );
};

/* One purchase invoice, drawn as a receipt: the amount first, then whether we have paid the seller */
export const PurchaseCard = ({ order, copied, copy }: { order: Package } & CopyProps) => {
  const paid = Number(order.orderStatus) >= 1;
  const name = goodsName(order);

  return (
    <article className={`or-receipt ${paid ? 'is-paid' : 'is-pending'} ${order.isCanceled ? 'is-canceled' : ''}`}>
      <Link to={`/order/${order._id}`} className="or-card__link" aria-label={`عرض فاتورة الشراء ${order.orderId}`} />

      <div className="or-receipt__top">
        <span className="or-receipt__kind">فاتورة شراء</span>
        <span className="or-stamp">{order.isCanceled ? 'ملغاة' : paid ? 'تم الشراء' : 'قيد الشراء'}</span>
      </div>

      <p className="or-receipt__amount"><bdi dir="ltr">{usd(order.totalInvoice)}</bdi></p>
      {name !== 'فاتورة شراء' && <p className="or-receipt__name">{name}</p>}

      <div className="or-receipt__rows">
        <span>رقم الفاتورة</span>
        <CopyId id={`p-${order._id}`} value={order.orderId} copied={copied} copy={copy} />
        <span>التاريخ</span>
        <b>{dateText(order.createdAt)}</b>
      </div>

      <Note order={order} />

      <span className="or-card__go" aria-hidden>تفاصيل الفاتورة <ArrowLeft size={15} /></span>
    </article>
  );
};

export const CardSkeleton = ({ receipt }: { receipt?: boolean }) => (
  <div className={`or-sk ${receipt ? 'or-sk--receipt' : ''}`} aria-hidden>
    <span className="or-sk__line is-wide" />
    <span className="or-sk__line" />
    <span className="or-sk__bar" />
  </div>
);
