import { Link } from 'react-router-dom';
import { ArrowLeft, Box, Plane, Rocket, Ship, ShoppingBag, PackageSearch } from 'lucide-react';
import Flag from '../PricesPage/Flag';
import { Package, PackageDetails } from '../../models';
import { getOrderStatusLabels } from '../../utils/methods';

const MAX_PACKAGES = 2;
const COUNTRY_KEY: Record<string, string> = { china: 'china', uae: 'uae', turkey: 'turkey', usa: 'usa', uk: 'uk' };

// Where one package is, in the customer's words, and how many of the three stops it has passed
const packageStage = (p: PackageDetails) => {
  if (p.status?.received) return { label: 'تم الاستلام', step: 3 };
  if (p.status?.arrivedLibya) return { label: 'وصل ليبيا', step: 2 };
  if (p.status?.arrived) return { label: 'في المخزن', step: 1 };
  return { label: 'في الطريق للمخزن', step: 0 };
};
const STOPS = ['المخزن', 'ليبيا', 'الاستلام'];

const weightText = (p: PackageDetails) => {
  const w = p.deliveredPackages?.weight;
  if (!w?.total) return '';
  const unit = w.measureUnit === 'CBM' || w.measureUnit === 'cbm' ? 'م³' : 'كجم';
  return `${w.total} ${unit}`;
};

const isReady = (o: Package) => (o.isPayment ? o.orderStatus === 4 : o.orderStatus === 3);
// "-" or empty: the office left the goods unnamed
const goodsName = (o: Package) => {
  const name = (o.productName || '').trim();
  if (name && name !== '-') return name;
  if (o.isPayment && !o.isShipment) return 'طلبية شراء';
  if (o.shipment?.method === 'sea') return 'شحن بحري';
  return o.shipment?.method === 'air' ? 'شحن جوي' : 'شحنة';
};

/* The customer's two newest shipments, each with a short list of its packages */
const RecentShipments = ({ orders, total }: { orders: Package[] | null, total: number }) => {
  const recent = (orders || []).slice(0, 2);

  return (
    <section className="hm-card" aria-labelledby="hm-orders">
      <div className="hm-card__head">
        <h2 id="hm-orders">آخر شحناتك</h2>
        {total > 0 && <Link to="/orders">كل الطلبيات ({total})</Link>}
      </div>

      {orders === null && <div className="hm-ships" aria-hidden>{[0, 1].map((i) => <div key={i} className="hm-sk hm-sk--ship" />)}</div>}

      {orders !== null && !recent.length && (
        <div className="hm-empty">
          <PackageSearch size={34} aria-hidden />
          <b>لا توجد شحنات نشطة</b>
          <p>عندما يصل طردك لمخزننا يظهر هنا، وتتابع رحلته حتى الاستلام.</p>
          <Link className="hm-btn hm-btn--primary" to="/start-shipment"><Rocket size={18} aria-hidden /> ابدأ شحنة جديدة</Link>
        </div>
      )}

      {!!recent.length && (
        <ul className="hm-ships">
          {recent.map((o) => {
            const invoiceOnly = o.isPayment && !o.isShipment;
            const MethodIcon = invoiceOnly ? ShoppingBag : o.shipment?.method === 'sea' ? Ship : o.shipment?.method === 'air' ? Plane : Box;
            const packages = (o.paymentList || []).filter((p) => p?.settings?.visableForClient !== false);
            const more = packages.length - MAX_PACKAGES;
            const country = COUNTRY_KEY[o.shipment?.fromWhere];
            return (
              <li key={o._id} className={`hm-ship ${isReady(o) ? 'is-ready' : ''}`}>
                <Link to={`/order/${o._id}`} className="hm-ship__head">
                  <span className="hm-order__icon" aria-hidden><MethodIcon size={20} /></span>
                  <span className="hm-ship__title">
                    <bdi dir="ltr">{o.orderId}</bdi>
                    <span className="hm-ship__sub">
                      {country && <Flag country={country} size={16} />}
                      {goodsName(o)}
                      {!!packages.length && <span className="hm-ship__count">· {packages.length === 1 ? 'طرد واحد' : packages.length === 2 ? 'طردان' : `${packages.length} طرود`}</span>}
                    </span>
                  </span>
                  <span className="hm-order__status">{getOrderStatusLabels(o)}</span>
                </Link>

                {packages.length ? (
                  <ul className="hm-pkgs">
                    {packages.slice(0, MAX_PACKAGES).map((p, i) => {
                      const stage = packageStage(p);
                      const tracking = p.deliveredPackages?.trackingNumber;
                      const weight = weightText(p);
                      return (
                        <li key={(p as any)._id || i} className="hm-pkg">
                          <span className="hm-pkg__icon" aria-hidden><Box size={16} /></span>
                          <span className="hm-pkg__main">
                            <span className="hm-pkg__top">
                              {tracking ? <bdi dir="ltr" className="hm-pkg__track">{tracking}</bdi> : <span className="hm-pkg__track">طرد {i + 1}</span>}
                              {weight && <span className="hm-pkg__weight">{weight}</span>}
                            </span>
                            {/* Three stops: the warehouse, Libya, handed over */}
                            <span className="hm-pkg__stops" aria-label={`الحالة: ${stage.label}`}>
                              {STOPS.map((s, k) => <i key={s} className={k < stage.step ? 'is-on' : ''} title={s} />)}
                            </span>
                          </span>
                          <span className={`hm-pkg__state is-${stage.step}`}>{stage.label}</span>
                        </li>
                      );
                    })}
                  </ul>
                ) : (
                  <p className="hm-pkgs__none">لم يصل أي طرد لمخزننا بعد.</p>
                )}

                {more > 0 && (
                  <Link to={`/order/${o._id}`} className="hm-pkgs__more">
                    {more === 1 ? 'طرد آخر' : `+${more} طرود أخرى`} في هذه الشحنة <ArrowLeft size={15} aria-hidden />
                  </Link>
                )}
              </li>
            );
          })}
        </ul>
      )}
    </section>
  );
};

export default RecentShipments;
