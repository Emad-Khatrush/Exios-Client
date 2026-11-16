import { useEffect, useMemo, useRef, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { useSelector } from 'react-redux';
import {
  AlertTriangle, ArrowRight, Ban, Box, Check, CircleHelp, Clock3, Copy, ListX, Loader2, MapPin, OctagonX, PackageSearch, Phone,
  Plane, Printer, Receipt, ScanSearch, Ship, StickyNote, Trash2, Truck,
} from 'lucide-react';
import { TbBrandWhatsapp } from 'react-icons/tb';
import api from '../../api';
import { Package, PackageDetails } from '../../models';
import { OFFICES, officeFor, whatsappLink } from '../../constants/contact';
import { libyanCities } from '../../constants/info';
import { getOrderTheme, OrderTheme } from '../../constants/orderThemes';
import logo from '../../../public/images/exios-logo.png';
import { useCopy } from '../../utils/useCopy';
import Flag from '../PricesPage/Flag';
import OrderRatingWidget from '../../components/OrderRatingWidget/OrderRatingWidget';
import OrderNoteCustomizer from '../../components/OrderNoteCustomizer/OrderNoteCustomizer';
import PackageCard from './PackageCard';
import FileViewer, { KIND_ICONS, toViewerFile } from '../../components/FileViewer/FileViewer';
import {
  METHOD_LABEL, countryKey, PACKAGE_STAGES, SHIPMENT_STAGES, dateText, goodsName, isBlocked, isPurchaseInvoice, shipMethod, nextStepText,
  packageStage, placeName, tripArrival, tripName, shippingCost, relativeDay, shipmentStage, stageKey, stageLabel, timeText, usd, visiblePackages,
} from '../ClientOrders/orderUtils';
import '../ClientOrders/orders.css';
import './orderInfo.css';

const ORDER_FIELDS = {
  orderId: 1, placedAt: 1, createdAt: 1, updatedAt: 1, orderStatus: 1, isPayment: 1, isShipment: 1, isFinished: 1, isCanceled: 1,
  unsureOrder: 1, productName: 1, customerInfo: 1, totalInvoice: 1, images: 1, activity: 1,
  'customization.note': 1, 'customization.theme': 1,
  shippingBlocked: 1, shippingBlockReason: 1, shippingBlockedAt: 1,
  'shipment.method': 1, 'shipment.fromWhere': 1, 'shipment.toWhere': 1, 'shipment.estimatedDelivery': 1,
  'paymentList._id': 1, // needed to match each package to its trip
  'paymentList.status': 1, 'paymentList.images': 1, 'paymentList.settings': 1,
  'paymentList.deliveredPackages.arrivedAt': 1, 'paymentList.deliveredPackages.trackingNumber': 1,
  'paymentList.deliveredPackages.shipmentMethod': 1, 'paymentList.deliveredPackages.weight': 1,
  'paymentList.deliveredPackages.exiosPrice': 1, 'paymentList.deliveredPackages.boxesCount': 1,
  'paymentList.deliveredPackages.deliveredInfo': 1,
};

// Files open in the same viewer as the admin panel (images, PDFs, video…)
type Photos = { files: any[], index: number } | null;

const cleanText = (v?: any) => {
  const t = String(v ?? '').trim();
  return t && t !== '.' && t !== '-' && t !== '0' ? t : '';
};

/* ---------- Shared pieces ---------- */

const Activity = ({ order }: { order: Package }) => {
  const items = (order.activity || []).slice().reverse();
  if (!items.length) return null;
  return (
    <section className="oi-card" aria-labelledby="oi-activity">
      <h2 id="oi-activity" className="oi-card__title">سجل الطلبية</h2>
      <ol className="oi-log">
        {items.map((a, i) => (
          <li key={i} className={i === 0 ? 'is-latest' : ''}>
            <span className="oi-log__dot" aria-hidden />
            <p className="oi-log__text bidi-text" dir="auto">{a.description}</p>
            <p className="oi-log__meta">
              {cleanText(a.country) && <span>{a.country}</span>}
              {a.createdAt && <span>{relativeDay(a.createdAt)} · <bdi dir="ltr">{timeText(a.createdAt)}</bdi></span>}
            </p>
          </li>
        ))}
      </ol>
    </section>
  );
};

const Receipts = ({ order, onOpen }: { order: Package, onOpen: (p: Photos) => void }) => {
  const files = (order.images || []).filter((img) => img?.path);
  if (!files.length) return null;
  return (
    <section className="oi-card" aria-labelledby="oi-receipts">
      <h2 id="oi-receipts" className="oi-card__title">الإيصالات والمستندات</h2>
      <div className="oi-docs">
        {files.map((raw, i) => {
          const f = toViewerFile(raw);
          const Icon = KIND_ICONS[f.kind];
          return (
            <button key={`${i}:${f.url}`} type="button" className="oi-doc" onClick={() => onOpen({ files, index: i })} aria-label={`عرض المستند ${i + 1}`}>
              {f.kind === 'image'
                ? <img src={f.url} alt="" loading="lazy" onError={(e) => { e.currentTarget.style.visibility = 'hidden'; }} />
                : <span className="oi-thumb__file"><Icon size={24} aria-hidden /><em>{f.ext || 'file'}</em></span>}
            </button>
          );
        })}
      </div>
    </section>
  );
};

const HelpCard = ({ order, office, customerId }: { order: Package, office: ReturnType<typeof officeFor>, customerId: string }) => (
  <section className="oi-card oi-help oi-noprint" aria-labelledby="oi-help">
    <CircleHelp size={22} aria-hidden />
    <div>
      <h2 id="oi-help">عندك سؤال عن هذه الطلبية؟</h2>
      <p>راسل {office.name}، ورقم الطلبية مكتوب في رسالتك.</p>
    </div>
    <a
      className="oi-btn oi-btn--wa"
      href={whatsappLink(office.whatsapp, `مرحباً، عندي سؤال عن الطلبية رقم ${order.orderId}${customerId ? ` (كود العميل ${customerId})` : ''}.\n`)}
      target="_blank"
      rel="noreferrer"
    >
      <TbBrandWhatsapp size={19} aria-hidden /> واتساب
    </a>
  </section>
);

const CopyChip = ({ value, copied, copy }: { value: string, copied: string, copy: (id: string, v: string) => void }) => (
  <button type="button" className={`or-copy ${copied === 'order' ? 'is-done' : ''}`} onClick={() => copy('order', value)} aria-label={`نسخ الرقم ${value}`}>
    <bdi dir="ltr">{value}</bdi>
    {copied === 'order' ? <Check size={13} aria-hidden /> : <Copy size={13} aria-hidden />}
  </button>
);

// The customer's colour, pressed onto the order like a postage stamp.
// - pressKey changes on arrival and on every save: the stamp is pressed again, with an ink ring.
// - while picking, its colour eases with the page (it is drawn from --oi-accent) and a sheen
//   passes over it for each new colour, so it looks freshly inked rather than swapped.
const ThemeStamp = ({ theme, note, preview, pressKey }: { theme: OrderTheme, note?: string, preview: boolean, pressKey: number }) => (
  <span className="oi-tstamp-wrap oi-noprint" key={pressKey}>
    <button
      type="button"
      className="oi-tstamp"
      style={{ color: theme.text }}
      onClick={() => document.getElementById('oi-note-anchor')?.scrollIntoView({ behavior: 'smooth', block: 'center' })}
      aria-label={note ? `ملاحظتي: ${note}` : 'معاينة لون الطلبية'}
    >
      <i className="oi-tstamp__sheen" key={theme.id} aria-hidden />
      <StickyNote size={16} aria-hidden />
      <span className="oi-tstamp__label">{preview && !note ? 'معاينة' : 'ملاحظتي'}</span>
      {note && <span className="oi-tstamp__text">{note}</span>}
    </button>
  </span>
);

/* ---------- Purchase invoice ---------- */

const PurchaseView = ({ order, setOrder, onPhotos, office, customerId, customerName, theme, preview, onPreview, pressKey }: {
  order: Package, setOrder: (o: Package) => void, onPhotos: (p: Photos) => void, office: ReturnType<typeof officeFor>,
  customerId: string, customerName: string, theme: OrderTheme | null, preview: boolean, onPreview: (t?: string | null) => void,
  pressKey: number,
}) => {
  const { copied, copy } = useCopy();
  const paid = Number(order.orderStatus) >= 1;
  const name = goodsName(order);
  const stamp = order.isCanceled ? 'ملغاة' : paid ? 'تم الشراء' : 'قيد الشراء';

  return (
    <div className="oi-purchase or-anim" style={{ ['--i' as any]: 1 }}>
      <article className={`oi-bill ${order.isCanceled ? 'is-canceled' : paid ? 'is-paid' : 'is-pending'}`} aria-labelledby="oi-bill-title">
        {/* Printed copy only: the company's letterhead */}
        <div className="oi-print-head">
          <img src={logo} alt="Exios" />
          <div>
            <b>شركة اكسيوس للشحن وخدمات الشراء</b>
            <span>www.exioslibya.com</span>
          </div>
          <div className="oi-print-head__doc">
            <b>فاتورة شراء</b>
            <span>رقم <bdi dir="ltr">{order.orderId}</bdi></span>
          </div>
        </div>

        {theme && <div className="oi-bill__theme"><ThemeStamp theme={theme} note={order.customization?.note} preview={preview} pressKey={pressKey} /></div>}

        <div className="oi-bill__top">
          <span className="oi-bill__brand"><Receipt size={18} aria-hidden /> <span id="oi-bill-title">فاتورة شراء</span></span>
          <span className="or-stamp">{stamp}</span>
        </div>

        <p className="oi-bill__label">قيمة الفاتورة</p>
        <p className="oi-bill__amount"><bdi dir="ltr">{usd(order.totalInvoice)}</bdi></p>

        <dl className="oi-bill__rows">
          <div><dt>رقم الفاتورة</dt><dd><CopyChip value={order.orderId} copied={copied} copy={copy} /></dd></div>
          <div><dt>التاريخ</dt><dd>{dateText(order.createdAt)}</dd></div>
          {name !== 'فاتورة شراء' && <div><dt>البضاعة</dt><dd>{name}</dd></div>}
          {(cleanText(order.customerInfo?.fullName) || customerName) && <div><dt>العميل</dt><dd>{cleanText(order.customerInfo?.fullName) || customerName}</dd></div>}
          {customerId && <div><dt>كود العميل</dt><dd><bdi dir="ltr">{customerId}</bdi></dd></div>}
          <div><dt>الحالة</dt><dd>{stamp}</dd></div>
        </dl>

        {/* Two steps only: the invoice is made, then we pay the seller */}
        {!order.isCanceled && (
          <ol className="oi-bill__steps">
            <li className="is-done"><span aria-hidden><Check size={13} strokeWidth={3} /></span>أُنشئت الفاتورة</li>
            <li className={paid ? 'is-done' : 'is-now'}>
              <span aria-hidden>{paid ? <Check size={13} strokeWidth={3} /> : <Clock3 size={13} />}</span>
              {paid ? 'دفعنا للبائع' : 'ندفع للبائع'}
            </li>
          </ol>
        )}

        <p className="oi-bill__note">
          {order.isCanceled
            ? 'أُلغيت هذه الفاتورة. إن كنت تظن أن هذا خطأ تواصل مع المكتب.'
            : paid
              ? 'دفعنا المبلغ للبائع. تابع معه موعد الإرسال، وعندما تصل البضاعة لمخزننا تظهر كشحنة جديدة في «الشحنات».'
              : 'نجهّز عملية الشراء. نُحدّث الفاتورة عند الدفع للبائع.'}
        </p>

        {/* Printed copy only: where to reach us, and when it was printed */}
        <div className="oi-print-foot">
          <p>شكراً لتعاملك مع اكسيوس. المبالغ بالدولار الأمريكي.</p>
          <ul>
            {OFFICES.map((o) => (
              <li key={o.key}><b>{o.name}</b> {o.address} · <bdi dir="ltr">{o.phones.join(' - ')}</bdi></li>
            ))}
          </ul>
          <p className="oi-print-foot__meta">طُبعت من حساب العميل في تطبيق اكسيوس بتاريخ <bdi dir="ltr">{dateText(new Date())} {timeText(new Date())}</bdi></p>
        </div>

        <div className="oi-bill__actions oi-noprint">
          {paid && <Link to="/orders" className="oi-btn oi-btn--outline">الشحنات</Link>}
          <button type="button" className="oi-btn oi-btn--outline" onClick={() => window.print()}>
            <Printer size={17} aria-hidden /> طباعة
          </button>
        </div>
      </article>

      <div className="oi-purchase__side">
        <Receipts order={order} onOpen={onPhotos} />
        <div id="oi-note-anchor">
          <OrderNoteCustomizer
            orderId={order._id}
            note={order.customization?.note}
            themeId={order.customization?.theme}
            onPreview={onPreview}
            onSaved={(customization) => setOrder({ ...order, customization })}
          />
        </div>
        <Activity order={order} />
        <HelpCard order={order} office={office} customerId={customerId} />
      </div>
    </div>
  );
};

/* ---------- Shipment ---------- */

const OrderInfoPage = () => {
  const { id: orderId } = useParams();
  const navigate = useNavigate();
  const account = useSelector((state: any) => state.session.account);
  const office = officeFor(account?.city);
  const customerId = account?.customerId || '';
  const { copied, copy } = useCopy();

  const [order, setOrder] = useState<Package | null>(null);
  const [rated, setRated] = useState(true);
  const [failed, setFailed] = useState(false);
  const [photos, setPhotos] = useState<Photos>(null);
  const [pkgFilter, setPkgFilter] = useState<number | 'all'>('all');
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState('');
  // While the customer picks a colour the page shows it live; undefined = not editing
  const [previewTheme, setPreviewTheme] = useState<string | null | undefined>(undefined);
  // The colour is inked in a moment after the page opens (so it eases in), and pressed again on each save
  const [inked, setInked] = useState(false);
  const [pressKey, setPressKey] = useState(0);
  const [stamped, setStamped] = useState(false);
  const stampTimer = useRef<number>();
  const stampNow = () => {
    setPressKey((k) => k + 1);
    setStamped(true);
    window.clearTimeout(stampTimer.current);
    stampTimer.current = window.setTimeout(() => setStamped(false), 1400);
  };
  useEffect(() => () => window.clearTimeout(stampTimer.current), []);

  useEffect(() => {
    let alive = true;
    setOrder(null);
    setFailed(false);
    api.getSingleOrder(orderId || '', ORDER_FIELDS)
      .then((res: any) => { if (alive) setOrder(res.data); })
      .catch(() => { if (alive) setFailed(true); });
    api.getOrderRating(orderId)
      .then((res: any) => { if (alive) setRated(!!res?.data); })
      .catch(() => undefined);
    return () => { alive = false; };
  }, [orderId]);

  const loadedId = order?._id;
  useEffect(() => {
    setInked(false);
    if (!loadedId) return undefined;
    const t = window.setTimeout(() => setInked(true), 280);
    return () => window.clearTimeout(t);
  }, [loadedId]);

  const packages = useMemo(() => (order ? visiblePackages(order) : []), [order]);
  const stageCounts = useMemo(() => {
    const c: Record<number, number> = {};
    packages.forEach((p) => { const s = packageStage(p); c[s] = (c[s] || 0) + 1; });
    return c;
  }, [packages]);

  const deleteUnsure = async () => {
    setDeleting(true);
    setDeleteError('');
    try {
      await api.deleteUnsureOrder(orderId as string);
      navigate('/orders?tab=unsure', { replace: true });
    } catch {
      setDeleteError('لم يُحذف الطلب. حاول مرة أخرى.');
      setDeleting(false);
    }
  };

  const back = (
    <Link to={order && isPurchaseInvoice(order) ? '/orders?view=purchases' : '/orders'} className="oi-back oi-noprint">
      <ArrowRight size={17} aria-hidden /> طلبياتي
    </Link>
  );

  if (failed) {
    return (
      <div dir="rtl" lang="ar" className="or-page oi-page">
        <div className="or-wrap">
          {back}
          <div className="or-empty">
            <PackageSearch size={36} aria-hidden />
            <b>لم نجد هذه الطلبية</b>
            <p>ربما حُذفت أو أن الرابط غير صحيح. ابحث عنها في قائمة طلبياتك.</p>
            <Link to="/orders" className="or-btn or-btn--primary">طلبياتي</Link>
          </div>
        </div>
      </div>
    );
  }

  if (!order) {
    return (
      <div dir="rtl" lang="ar" className="or-page oi-page" aria-busy="true">
        <div className="or-wrap">
          {back}
          <div className="oi-sk oi-sk--head" />
          <div className="oi-sk oi-sk--hero" />
          <div className="oi-layout">
            <div className="oi-sk oi-sk--block" />
            <div className="oi-sk oi-sk--block" />
          </div>
        </div>
      </div>
    );
  }

  const openPhotos = (p: Photos) => setPhotos(p);
  const customerName = [account?.firstName, account?.lastName].filter(Boolean).join(' ');

  // The order's colour: the saved one (only with a note, as on the list), or the one being previewed.
  // It drives --oi-accent, which is animated, so the page eases from one colour to the next.
  const savedTheme = order.customization?.note ? (order.customization?.theme || 'emerald') : null;
  const themeId = previewTheme !== undefined ? previewTheme : savedTheme;
  const previewing = previewTheme !== undefined;
  // until the page has settled, show it in the plain green; then the customer's colour eases in
  const theme = themeId && (inked || previewing) ? getOrderTheme(themeId) : null;
  const themeStyle = theme ? ({ ['--oi-accent' as any]: theme.accent } as React.CSSProperties) : undefined;
  const pageClass = `or-page oi-page ${theme ? 'has-theme' : ''} ${stamped ? 'is-stamped' : ''}`;
  const lightbox = (
    <FileViewer open={!!photos} files={photos?.files} startIndex={photos?.index || 0} onClose={() => setPhotos(null)} />
  );

  if (isPurchaseInvoice(order)) {
    return (
      <div dir="rtl" lang="ar" className={pageClass} style={themeStyle}>
        <div className="or-wrap">
          {back}
          <PurchaseView
            order={order}
            setOrder={(o) => { setOrder(o); setPreviewTheme(undefined); if (o.customization?.note) stampNow(); }}
            onPhotos={openPhotos}
            office={office}
            customerId={customerId}
            customerName={customerName}
            theme={theme}
            preview={previewing}
            onPreview={setPreviewTheme}
            pressKey={pressKey}
          />
        </div>
        {lightbox}
      </div>
    );
  }

  const stage = shipmentStage(order);
  const blocked = isBlocked(order);
  const key = blocked ? 'blocked' : order.unsureOrder ? 'unsure' : stageKey(order);
  const country = countryKey(order.shipment?.fromWhere);
  const from = placeName(order.shipment?.fromWhere);
  const to = placeName(order.shipment?.toWhere);
  // The order's destination when it is not the office's own city (sent on from there)
  const toKey = String(order.shipment?.toWhere || '').trim().toLowerCase();
  const toCity = libyanCities.find((c) => c.value === toKey || c.label === to);
  const otherCity = to && toCity?.value !== office.key && (toCity?.label || to) !== office.city ? (toCity?.label || to) : '';
  const method = shipMethod(order);
  // packages the office left without a method (and not yet handed over)
  const pkgsNoMethod = packages.filter((p) => p.deliveredPackages?.shipmentMethod === 'unknown' && packageStage(p) < 4).length;
  const MethodIcon = blocked ? OctagonX : order.unsureOrder ? ScanSearch : method === 'sea' ? Ship : method === 'air' ? Plane : Box;
  const delivered = order.isFinished || stage === 4 || packages.some((p) => p.status?.received);
  // Where to collect: shown while the order, or any one of its packages, waits at the office
  const showPickup = !blocked && (key === 'ready' || !!stageCounts[3]) && !order.isFinished && stage !== 4;
  const showRating = delivered && !rated && !order.unsureOrder;

  // Weight per unit across the packages, e.g. "42.5 كجم · 1.2 م³"
  const totals = packages.reduce((acc, p) => {
    const w = p.deliveredPackages?.weight;
    if (w?.total) {
      const unit = String(w.measureUnit || '').toLowerCase() === 'cbm' ? 'م³' : 'كجم';
      acc[unit] = Math.round(((acc[unit] || 0) + Number(w.total)) * 100) / 100;
    }
    return acc;
  }, {} as Record<string, number>);
  const totalsText = Object.entries(totals).map(([u, v]) => `${v} ${u}`).join(' · ');
  const cost = shippingCost(packages);

  // When the trips carrying this order reach Libya: one line per trip, or one date when they all share it
  // Expected until every package on that trip has actually reached Libya
  const tripMap = new Map<string, { date: string, label: string }>();
  packages.forEach((p) => {
    const a = tripArrival(p);
    if (!a || !p.trip?.voyage) return;
    const seen = tripMap.get(p.trip.voyage);
    tripMap.set(p.trip.voyage, seen && seen.label !== a.label ? { ...a, label: 'الوصول المتوقع' } : a);
  });
  const trips = Array.from(tripMap.entries());
  const arrivalRows = trips.length && trips.every(([, a]) => a.date === trips[0][1].date && a.label === trips[0][1].label)
    ? [{ k: trips[0][1].label, v: trips[0][1].date }]
    : trips.map(([voyage, a]) => ({ k: `${a.label}: ${tripName(voyage)}`, v: a.date }));

  // Sea freight lands in Tripoli: an order collected in Benghazi travels on by road, and that leg is charged with the shipping
  const seaOrder = method === 'sea' || packages.some((p) => p.deliveredPackages?.shipmentMethod === 'sea');
  const toBenghazi = order.placedAt === 'benghazi' || toCity?.value === 'benghazi' || /بنغازي|benghazi/i.test(to);
  const showDomesticNote = seaOrder && toBenghazi && !order.isCanceled && !isPurchaseInvoice(order);

  const filtered = pkgFilter === 'all' ? packages : packages.filter((p) => packageStage(p) === pkgFilter);
  const stagesPresent = Object.keys(stageCounts).map(Number).sort();

  const details = [
    { k: 'رقم الطلبية', v: <CopyChip value={order.orderId} copied={copied} copy={copy} /> },
    { k: 'البضاعة', v: goodsName(order) },
    from && { k: 'من', v: from },
    to && { k: 'إلى', v: to },
    { k: 'طريقة الشحن', v: METHOD_LABEL[method] },
    { k: 'تاريخ الإنشاء', v: dateText(order.createdAt) },
    order.shipment?.estimatedDelivery && !delivered && !arrivalRows.length && { k: 'الوصول المتوقع', v: dateText(order.shipment.estimatedDelivery) },
    ...arrivalRows,
    order.isPayment && Number(order.totalInvoice) > 0 && { k: 'قيمة المشتريات', v: <bdi dir="ltr">{usd(order.totalInvoice)}</bdi> },
    cleanText(order.customerInfo?.fullName) && { k: 'المستلم', v: order.customerInfo.fullName },
    cleanText(order.customerInfo?.phone) && { k: 'الهاتف', v: <bdi dir="ltr">{String(order.customerInfo.phone)}</bdi> },
  ].filter(Boolean) as { k: string, v: React.ReactNode }[];

  return (
    <div dir="rtl" lang="ar" className={pageClass} style={themeStyle}>
      <div className="or-wrap">
        {back}

        {/* What it is */}
        <header className="oi-head or-anim" style={{ ['--i' as any]: 1 }}>
          <span className={`oi-head__icon is-${key}`} aria-hidden><MethodIcon size={24} /></span>
          <div className="oi-head__text">
            <h1>{goodsName(order)}</h1>
            <p>
              <CopyChip value={order.orderId} copied={copied} copy={copy} />
              {(from || to) && (
                <span className="oi-head__route">
                  {country && <span className="flag-frame"><Flag country={country} size={15} /></span>}
                  {from}{from && to && ' ← '}{to}
                </span>
              )}
              <span>أُنشئت {relativeDay(order.createdAt)}</span>
            </p>
          </div>
          {theme && <ThemeStamp theme={theme} note={order.customization?.note} preview={previewing} pressKey={pressKey} />}
        </header>

        {order.isCanceled && (
          <div className="oi-alert is-danger" role="status">
            <Ban size={20} aria-hidden />
            <p>أُلغيت هذه الطلبية من الإدارة. إن كنت تظن أن هذا خطأ تواصل مع {office.name}.</p>
          </div>
        )}

        {(method === 'unknown' || pkgsNoMethod > 0) && !order.unsureOrder && !order.isCanceled && !order.isFinished && (
          <div className="oi-alert is-warn" role="status">
            <AlertTriangle size={20} aria-hidden />
            <p>
              <b>{method === 'unknown' ? 'طريقة الشحن غير محددة.' : pkgsNoMethod === 1 ? 'طرد واحد طريقة شحنه غير محددة.' : `${pkgsNoMethod} طرود طريقة شحنها غير محددة.`}</b>
              {' '}يجب تأكيدها مع الشركة: جوي أم بحري، حتى لا تتأخر شحنتك.
            </p>
            <a className="oi-btn oi-btn--small" href={whatsappLink(office.whatsapp, `مرحباً، بخصوص الطلبية ${order.orderId}: أريد الشحن `)} target="_blank" rel="noreferrer">
              <TbBrandWhatsapp size={17} aria-hidden /> التأكيد مع الشركة
            </a>
          </div>
        )}

        {/* Where it is now, and what happens next */}
        {!order.isCanceled && (
          <section className={`oi-status or-anim is-${key}`} style={{ ['--i' as any]: 2 }} aria-labelledby="oi-status-title">
            <p className="oi-status__kicker">الحالة الآن</p>
            <h2 id="oi-status-title">{stageLabel(order)}</h2>
            <p className="oi-status__next">{nextStepText(order, office.name)}</p>

            {blocked && (
              <div className="oi-block">
                <p className="oi-block__label"><OctagonX size={16} aria-hidden /> سبب الإيقاف، كما كتبه المكتب</p>
                <p className="oi-block__reason bidi-text" dir="auto">{order.shippingBlockReason || 'لم يُكتب سبب. تواصل مع المكتب لمعرفته.'}</p>
                {order.shippingBlockedAt && <p className="oi-block__date">أُوقفت {relativeDay(order.shippingBlockedAt)}</p>}
                <div className="oi-block__actions">
                  <a
                    className="oi-btn oi-btn--light-red"
                    href={whatsappLink(office.whatsapp, `مرحباً، بخصوص الطلبية الموقوفة ${order.orderId}${customerId ? ` (كود العميل ${customerId})` : ''}: `)}
                    target="_blank"
                    rel="noreferrer"
                  >
                    <TbBrandWhatsapp size={17} aria-hidden /> تواصل مع المكتب
                  </a>
                  <Link className="oi-btn oi-btn--ghost-light" to="/prohibited-items"><ListX size={16} aria-hidden /> قائمة الممنوعات</Link>
                </div>
              </div>
            )}

            {!order.unsureOrder && !blocked && (
              <ol className="oi-steps">
                {SHIPMENT_STAGES.map((s, i) => (
                  <li key={s.key} className={i < stage ? 'is-done' : i === stage ? 'is-now' : ''} aria-current={i === stage ? 'step' : undefined}>
                    <span className="oi-steps__dot" aria-hidden>{i < stage || (i === stage && stage === 4) ? <Check size={13} strokeWidth={3} /> : null}</span>
                    <span className="oi-steps__label">{s.short}</span>
                  </li>
                ))}
              </ol>
            )}

            {showPickup && (
              <div className="oi-pickup">
                <div className="oi-pickup__where">
                  <MapPin size={18} aria-hidden />
                  <span><b>{office.name}</b>{office.address}</span>
                </div>
                <div className="oi-pickup__actions">
                  <a className="oi-btn oi-btn--dark" href={office.mapsUrl} target="_blank" rel="noreferrer"><MapPin size={16} aria-hidden /> الموقع</a>
                  <a className="oi-btn oi-btn--light" href={`tel:${office.phones[0]}`}><Phone size={16} aria-hidden /> اتصال</a>
                  <a
                    className="oi-btn oi-btn--light"
                    href={whatsappLink(office.whatsapp, `مرحباً، أريد استلام الطلبية ${order.orderId}${customerId ? ` (كود العميل ${customerId})` : ''}.\n`)}
                    target="_blank"
                    rel="noreferrer"
                  >
                    <TbBrandWhatsapp size={17} aria-hidden /> واتساب
                  </a>
                </div>
              </div>
            )}

            {/* Not collecting at this office: ask it, on WhatsApp, to send the order on to their city.
                The order's destination is filled in when it is not the office's own city. */}
            {showPickup && (
              <a
                className="oi-elsewhere"
                href={whatsappLink(
                  office.whatsapp,
                  `مرحباً، أريد إرسال الطلبية ${order.orderId}${customerId ? ` (كود العميل ${customerId})` : ''} لأستلمها في مدينة أخرى.\n`
                  + `المدينة: ${otherCity}\n`
                  + 'العنوان أو ملاحظة: ',
                )}
                target="_blank"
                rel="noreferrer"
              >
                <span className="oi-elsewhere__icon" aria-hidden><Truck size={18} /></span>
                <span className="oi-elsewhere__text">
                  <b>{otherCity ? `تريد استلامها في ${otherCity}؟` : 'تريد استلامها في مدينة أخرى؟'}</b>
                  <small>راسل {office.name} على واتساب ليرسلها لك، ويخبرك بالرسوم والموعد.</small>
                </span>
                <TbBrandWhatsapp size={20} className="oi-elsewhere__wa" aria-hidden />
              </a>
            )}
          </section>
        )}

        {order.unsureOrder && (
          <div className="oi-alert is-info">
            <ScanSearch size={20} aria-hidden />
            <p>إن لم ترسل بضاعة لمخزننا، أو أخطأت في رقم التتبع، احذف هذا الطلب.</p>
            <button type="button" className="oi-btn oi-btn--small oi-btn--danger" onClick={() => setConfirmDelete(true)}>
              <Trash2 size={16} aria-hidden /> حذف الطلب
            </button>
          </div>
        )}

        <div className="oi-layout or-anim" style={{ ['--i' as any]: 3 }}>
          <div className="oi-main">
            {showRating && <OrderRatingWidget />}

            {/* Packages: each travels on its own */}
            <section className="oi-card" aria-labelledby="oi-pkgs">
              <div className="oi-card__head">
                <h2 id="oi-pkgs" className="oi-card__title">
                  {order.unsureOrder ? 'أرقام التتبع' : 'الطرود'} <span className="oi-count">{packages.length}</span>
                </h2>
                {totalsText && <span className="oi-muted">{totalsText}</span>}
              </div>

              {/* Shipping total: each package's price × its weight, added up */}
              {cost.priced > 0 && !order.unsureOrder && (
                <div className="oi-cost">
                  <span>
                    <b>إجمالي الشحن</b>
                    <small>
                      {cost.priced < cost.count
                        ? `لـ ${cost.priced} من ${cost.count} طرود. الباقي لم يُوزن أو يُسعَّر بعد.`
                        : 'سعر كل طرد × وزنه أو حجمه'}
                    </small>
                  </span>
                  <strong><bdi dir="ltr">{usd(cost.total)}</bdi></strong>
                </div>
              )}

              {packages.length > 2 && stagesPresent.length > 1 && (
                <div className="or-chips oi-pkg-filter" role="tablist" aria-label="تصفية الطرود">
                  <button type="button" role="tab" aria-selected={pkgFilter === 'all'} className={`or-chip ${pkgFilter === 'all' ? 'is-on' : ''}`} onClick={() => setPkgFilter('all')}>
                    الكل <span>{packages.length}</span>
                  </button>
                  {stagesPresent.map((s) => (
                    <button key={s} type="button" role="tab" aria-selected={pkgFilter === s} className={`or-chip ${pkgFilter === s ? 'is-on' : ''}`} onClick={() => setPkgFilter(s)}>
                      {PACKAGE_STAGES[s]} <span>{stageCounts[s]}</span>
                    </button>
                  ))}
                </div>
              )}

              {packages.length ? (
                <ul className="oi-pkgs">
                  {filtered.map((p: PackageDetails) => {
                    const index = packages.indexOf(p);
                    return (
                      <PackageCard
                        key={p._id || index}
                        pkg={p}
                        index={index}
                        copied={copied}
                        copy={copy}
                        onPhotos={(files, index) => openPhotos({ files, index })}
                      />
                    );
                  })}
                </ul>
              ) : (
                <p className="oi-empty-line">لم يصل أي طرد لمخزننا بعد. عندما يصل نسجّله ونزنه ويظهر هنا مع صوره.</p>
              )}
            </section>

            <Activity order={order} />
          </div>

          <aside className="oi-side">
            <section className="oi-card" aria-labelledby="oi-details">
              <h2 id="oi-details" className="oi-card__title">تفاصيل الطلبية</h2>
              <dl className="oi-dl">
                {details.map((d) => (
                  <div key={d.k}><dt>{d.k}</dt><dd>{d.v}</dd></div>
                ))}
              </dl>
              {showDomesticNote && (
                <p className="oi-domestic">
                  <Truck size={17} aria-hidden />
                  <span>الشحن البحري يصل طرابلس، ثم ننقله برّاً إلى بنغازي. تكلفة النقل الداخلي تُدفع مع قيمة الشحن.</span>
                </p>
              )}
            </section>

            <div id="oi-note-anchor">
              <OrderNoteCustomizer
                orderId={orderId || ''}
                note={order.customization?.note}
                themeId={order.customization?.theme}
                onPreview={setPreviewTheme}
                onSaved={(customization) => {
                  setOrder((prev) => (prev ? { ...prev, customization } : prev));
                  setPreviewTheme(undefined);
                  if (customization.note) stampNow();
                }}
              />
            </div>

            <Receipts order={order} onOpen={openPhotos} />
            <HelpCard order={order} office={office} customerId={customerId} />
          </aside>
        </div>
      </div>

      {lightbox}

      {confirmDelete && (
        <div className="oi-modal" role="dialog" aria-modal="true" aria-labelledby="oi-del-title" onClick={(e) => { if (e.target === e.currentTarget && !deleting) setConfirmDelete(false); }}>
          <div className="oi-modal__box">
            <span className="oi-modal__icon" aria-hidden><Trash2 size={22} /></span>
            <h2 id="oi-del-title">حذف طلب المتابعة؟</h2>
            <p>نتوقف عن متابعة {packages.length > 1 ? 'أرقام التتبع هذه' : 'رقم التتبع هذا'}. لا يمكن التراجع عن الحذف.</p>
            {deleteError && <p className="oi-error" role="alert">{deleteError}</p>}
            <div className="oi-modal__actions">
              <button type="button" className="oi-btn oi-btn--quiet" onClick={() => setConfirmDelete(false)} disabled={deleting} autoFocus>تراجع</button>
              <button type="button" className="oi-btn oi-btn--danger" onClick={deleteUnsure} disabled={deleting}>
                {deleting ? <Loader2 size={17} className="oi-spin" aria-hidden /> : <Trash2 size={17} aria-hidden />} حذف
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default OrderInfoPage;
