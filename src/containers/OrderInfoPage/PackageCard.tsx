import { useState } from 'react';
import { AlertTriangle, Box, Check, ChevronDown, Coins, Copy, Images } from 'lucide-react';
import { PackageDetails } from '../../models';
import { KIND_ICONS, toViewerFile } from '../../components/FileViewer/FileViewer';
import { PackagePoints } from '../PointsPage/loyaltyTypes';
import { pointsText } from '../PointsPage/pointsFormat';
import { PACKAGE_STAGES, dateText, packageCost, packageStage, tripArrival, tripName, unitText, usd, weightText } from '../ClientOrders/orderUtils';

type Props = {
  pkg: PackageDetails
  index: number
  copied: string
  copy: (id: string, value: string) => void
  onPhotos: (files: any[], index: number) => void
  points?: PackagePoints
}

const METHOD: Record<string, string> = { air: 'جوي', sea: 'بحري', unknown: 'طريقة غير محددة' };

/* One package: its own progress (packages of one order travel separately), its numbers, its photos */
const PackageCard = ({ pkg, index, copied, copy, onPhotos, points }: Props) => {
  const stage = packageStage(pkg);
  const received = stage === 4;
  // Packages already handed over start folded, so the ones still on their way stand out
  const [open, setOpen] = useState(!received);

  const d = pkg.deliveredPackages || ({} as PackageDetails['deliveredPackages']);
  const tracking = d.trackingNumber;
  const weight = weightText(pkg);
  const cost = packageCost(pkg);
  const files = (pkg.images || []).filter((img) => img?.path);
  const photos = files.map(toViewerFile);
  const name = tracking ? (tracking.length === 4 ? `ينتهي بـ ${tracking}` : tracking) : `طرد ${index + 1}`;
  // The office marked this package's method as not set: until it is delivered, the customer must confirm it
  const methodMissing = d.shipmentMethod === 'unknown' && !received;
  // Points of this package: earned, or on the way (and what they wait for)
  const pointsLine = points && points.earned > 0
    ? { done: true, n: points.earned, text: 'حصلت على', tail: 'نقطة' }
    : points && points.pending > 0
      ? { done: false, n: points.pending, text: '+', tail: points.waitingFor === 'payment' ? 'نقطة بعد الدفع والاستلام' : points.waitingFor === 'processing' ? 'نقطة تُضاف خلال ساعة' : 'نقطة بعد الاستلام' }
      : null;
  const copyId = `pkg-${pkg._id || index}`;
  const bodyId = `pkg-body-${pkg._id || index}`;

  // The stops this package passes, with a date where the office recorded one
  const stops = [
    { label: 'وصل مخزننا الخارجي', date: d.arrivedAt },
    { label: pkg.trip?.voyage ? <>شُحن إلى ليبيا ضمن <bdi>{tripName(pkg.trip.voyage)}</bdi></> : 'شُحن إلى ليبيا' },
    { label: 'وصل ليبيا وجاهز للاستلام' },
    { label: 'تم الاستلام', date: d.deliveredInfo?.deliveredDate },
  ];

  const arrival = tripArrival(pkg);
  const unit = unitText(pkg);

  // Numbers sit in their own isolated runs so the Arabic unit around them keeps its place
  const facts = [
    weight && { k: 'الوزن / الحجم', v: weight },
    d.shipmentMethod && METHOD[d.shipmentMethod] && { k: 'الشحن', v: METHOD[d.shipmentMethod] },
    d.exiosPrice ? { k: 'السعر', v: <><bdi dir="ltr">{usd(d.exiosPrice)}</bdi> لكل {unit}</> } : null,
    cost !== null && {
      k: 'الإجمالي',
      v: <bdi dir="ltr">{usd(cost)}</bdi>,
      total: true,
      hint: <><bdi dir="ltr">{d.weight.total}</bdi> {unit} × <bdi dir="ltr">{usd(d.exiosPrice)}</bdi></>,
    },
    d.boxesCount && Number(d.boxesCount) > 0 && { k: 'عدد الكراتين', v: d.boxesCount },
    pkg.trip?.voyage && { k: 'الرحلة', v: pkg.trip.voyage, bidi: true },
    arrival && { k: arrival.label, v: arrival.date },
  ].filter(Boolean) as { k: string, v: React.ReactNode, bidi?: boolean, total?: boolean, hint?: React.ReactNode }[];

  return (
    <li className={`oi-pkg is-${stage} ${methodMissing ? 'is-nomethod' : ''}`}>
      <div className="oi-pkg__head">
        <span className="oi-pkg__icon" aria-hidden>
          <Box size={18} />
          {methodMissing && <span className="oi-pkg__q">؟</span>}
        </span>
        <div className="oi-pkg__title">
          <span className="oi-pkg__name">
            {tracking && tracking.length > 4 ? (
              <button
                type="button"
                className={`oi-pkg__track ${copied === copyId ? 'is-done' : ''}`}
                onClick={() => copy(copyId, tracking)}
                aria-label={`نسخ رقم التتبع ${tracking}`}
              >
                <bdi dir="ltr">{tracking}</bdi>
                {copied === copyId ? <Check size={13} aria-hidden /> : <Copy size={13} aria-hidden />}
              </button>
            ) : <b>{name}</b>}
          </span>
          <span className="oi-pkg__sub">
            {[weight, d.shipmentMethod && METHOD[d.shipmentMethod]].filter(Boolean).join(' · ') || 'لم يُوزن بعد'}
            {cost !== null && <> · <b className="oi-pkg__cost"><bdi dir="ltr">{usd(cost)}</bdi></b></>}
          </span>
        </div>
        <span className={`oi-pkg__state is-${stage}`}>{PACKAGE_STAGES[stage]}</span>
        <button
          type="button"
          className={`oi-pkg__toggle ${open ? 'is-open' : ''}`}
          onClick={() => setOpen((v) => !v)}
          aria-expanded={open}
          aria-controls={bodyId}
          aria-label={open ? 'إخفاء تفاصيل الطرد' : 'عرض تفاصيل الطرد'}
        >
          <ChevronDown size={18} />
        </button>
      </div>

      {pointsLine && (
        <p className={`oi-pkg__points ${pointsLine.done ? 'is-done' : ''}`}>
          <Coins size={14} aria-hidden />
          <span>{pointsLine.text}{pointsLine.done ? ' ' : ''}<bdi dir="ltr">{pointsText(pointsLine.n)}</bdi> {pointsLine.tail}</span>
        </p>
      )}

      {/* Shown folded or open: this is the one thing the customer has to act on */}
      {methodMissing && (
        <p className="oi-pkg__warn">
          <AlertTriangle size={16} aria-hidden />
          <span><b>طريقة شحن هذا الطرد غير محددة.</b> تواصل مع الشركة لتأكيدها: جوي أم بحري.</span>
        </p>
      )}

      {open && (
        <div className="oi-pkg__body" id={bodyId}>
          <ol className="oi-stops">
            {stops.map((s, i) => {
              // Stop i is passed once the package reaches stage i + 1; the first one not passed is next
              const state = stage >= i + 1 ? 'is-done' : stage === i ? 'is-next' : '';
              return (
                <li key={i} className={state}>
                  <span className="oi-stops__dot" aria-hidden>{state === 'is-done' && <Check size={11} strokeWidth={3} />}</span>
                  <span className="oi-stops__label">{s.label}</span>
                  {state === 'is-done' && s.date && <span className="oi-stops__date">{dateText(s.date)}</span>}
                </li>
              );
            })}
          </ol>

          {!!facts.length && (
            <dl className="oi-facts">
              {facts.map((f) => (
                <div key={f.k} className={f.total ? 'is-total' : undefined}>
                  <dt>{f.k}</dt>
                  <dd>{f.bidi ? <span className="bidi-text" dir="auto">{f.v}</span> : f.v}</dd>
                  {f.hint && <small>{f.hint}</small>}
                </div>
              ))}
            </dl>
          )}

          {!!photos.length && (
            <div className="oi-thumbs">
              {photos.slice(0, 4).map((f, i) => {
                const Icon = KIND_ICONS[f.kind];
                return (
                  <button
                    key={`${i}:${f.url}`}
                    type="button"
                    className="oi-thumb"
                    onClick={() => onPhotos(files, i)}
                    aria-label={`عرض الملف ${i + 1} من ${photos.length}`}
                  >
                    {f.kind === 'image'
                      ? <img src={f.url} alt="" loading="lazy" onError={(e) => { e.currentTarget.style.visibility = 'hidden'; }} />
                      : <span className="oi-thumb__file"><Icon size={20} aria-hidden /><em>{f.ext || 'file'}</em></span>}
                    {i === 3 && photos.length > 4 && <span className="oi-thumb__more">+{photos.length - 4}</span>}
                  </button>
                );
              })}
              <span className="oi-thumbs__label"><Images size={15} aria-hidden /> صور البضاعة في المخزن</span>
            </div>
          )}
        </div>
      )}
    </li>
  );
};

export default PackageCard;
