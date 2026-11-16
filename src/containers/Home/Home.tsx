import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useSelector } from 'react-redux';
import {
  ArrowLeft, Ban, Check, CircleCheckBig, Copy, FileText, MapPin, MessageSquareText, PackageCheck, PackageOpen, PackagePlus,
  Phone, Receipt, Rocket, ShoppingBag, Tags, Warehouse,
} from 'lucide-react';
import { TbBrandWhatsapp } from 'react-icons/tb';
import api from '../../api';
import AnnouncementBar from '../../components/AnnouncementBar/AnnouncementBar';
import LatestPosts from './LatestPosts';
import RecentShipments from './RecentShipments';
import Flag from '../PricesPage/Flag';
import { money, Pricing, updatedLabel } from '../PricesPage/pricingMath';
import { cachedPricing, fetchPricing } from '../PricesPage/pricingCache';
import { Announcement, Package } from '../../models';
import { officeFor, whatsappLink } from '../../constants/contact';
import { useCopy } from '../../utils/useCopy';
import './home.css';

type Counts = { activeOrders: number, readyForReceivement: number, receivedOrders: number, totalPaidInvoices: number };

const greeting = () => {
  const h = new Date().getHours();
  return h < 12 ? 'صباح الخير' : h < 18 ? 'مساء الخير' : 'مساء النور';
};

const SHORTCUTS = [
  { to: '/start-shipment', icon: Rocket, title: 'ابدأ الشحن', text: 'خطوات شحنة جديدة' },
  { to: '/address', icon: Warehouse, title: 'عناويننا', text: 'عنوان المخزن وعلامة الشحن' },
  { to: '/add-tracking-numbers', icon: PackagePlus, title: 'إضافة رقم تتبع', text: 'عند شحن البائع لطردك' },
  { to: '/prices/shipping', icon: Tags, title: 'أسعار الشحن', text: 'الأسعار والحاسبة' },
  { to: '/prices/purchase', icon: ShoppingBag, title: 'أسعار الشراء', text: 'نشتري لك من المواقع' },
  { to: '/prohibited-items', icon: Ban, title: 'ممنوعات الشحن', text: 'ما لا يمكن شحنه' },
  { to: '/terms-privacy', icon: FileText, title: 'الشروط', text: 'شروط الشحن والشراء' },
  { to: '/contact-us', icon: Phone, title: 'تواصل معنا', text: 'المكاتب والأرقام' },
];

const Home = () => {
  const account = useSelector((state: any) => state.session.account);
  const { copied, copy } = useCopy();
  const [counts, setCounts] = useState<Counts | null>(null);
  const [orders, setOrders] = useState<Package[] | null>(null);
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  const [pricing, setPricing] = useState<Pricing | null>(() => cachedPricing() as Pricing | null);
  const [unreadReplies, setUnreadReplies] = useState(0);

  // Each block loads on its own: a slow or failed one never holds the others back
  useEffect(() => {
    api.getHomeData().then((res: any) => setCounts(res.data?.results?.countList || null)).catch(() => setCounts({ activeOrders: 0, readyForReceivement: 0, receivedOrders: 0, totalPaidInvoices: 0 }));
    api.getAnnouncements().then((res: any) => setAnnouncements(Array.isArray(res?.data) ? res.data : [])).catch(() => undefined);
    api.getOrdersForUser('all', {
      orderId: 1, createdAt: 1, orderStatus: 1, isPayment: 1, isShipment: 1, productName: 1,
      'shipment.method': 1, 'shipment.fromWhere': 1, 'shipment.toWhere': 1,
      'paymentList._id': 1, 'paymentList.status': 1, 'paymentList.settings': 1,
      'paymentList.deliveredPackages.trackingNumber': 1, 'paymentList.deliveredPackages.weight': 1,
    }).then((res: any) => setOrders(res.data?.results?.orders || [])).catch(() => setOrders([]));
    fetchPricing(['shipping', 'fcl']).then((data) => setPricing({ ...data } as Pricing)).catch(() => undefined);
    api.get('client/feedback')
      .then((res: any) => setUnreadReplies(Array.isArray(res?.data) ? res.data.filter((f: any) => f.unread).length : 0))
      .catch(() => undefined);
  }, []);

  const id = account?.customerId || '';
  const firstName = account?.firstName || '';
  const office = officeFor(account?.city);
  const ready = counts?.readyForReceivement || 0;

  const routes = pricing?.shipping?.routes || [];
  const todayPrices = routes.filter((r) => r.country === 'china' || r.country === 'uae').slice(0, 3);
  const rate = pricing?.exchangeRate;
  const pricesUpdated = updatedLabel(pricing?.shipping?.updatedAt);

  const stats = [
    { key: 'active', label: 'طلبيات نشطة', value: counts?.activeOrders, icon: PackageOpen, to: '/orders?tab=active' },
    { key: 'ready', label: 'جاهزة للاستلام', value: counts?.readyForReceivement, icon: PackageCheck, to: '/orders?tab=readyForPickup', hot: ready > 0 },
    { key: 'done', label: 'تم تسليمها', value: counts?.receivedOrders, icon: CircleCheckBig, to: '/orders?tab=finished' },
    { key: 'invoices', label: 'إجمالي الفواتير', value: counts ? money(counts.totalPaidInvoices || 0) : undefined, icon: Receipt, to: '/orders?view=purchases', ltr: true },
  ];

  return (
    <div dir="rtl" lang="ar" className="hm-page page-enter w-full px-4 pb-16 pt-6 sm:px-6 lg:px-8 lg:pt-8">
      <div className="mx-auto max-w-6xl">
        {/* Welcome, the customer's code, and the one thing most visits are for */}
        <header className="hm-hero">
          <div className="hm-hero__text">
            <p className="hm-hero__hello">{greeting()}{firstName ? `، ${firstName}` : ''}</p>
            {/* Until the counts arrive we don't know which message is true, so neither is shown:
                a placeholder of the same size holds the place and nothing flips a second later */}
            {counts === null ? (
              <h1 aria-busy="true"><span className="hm-sk hm-sk--hero" /><span className="sr-only">جاري التحميل</span></h1>
            ) : (
              <h1 className="hm-reveal">{ready > 0
                ? (ready === 1 ? 'عندك طلبية جاهزة للاستلام' : `عندك ${ready} طلبيات جاهزة للاستلام`)
                : 'من أين نشحن لك اليوم؟'}
              </h1>
            )}
            <div className="hm-hero__actions">
              {counts === null
                ? <span className="hm-sk hm-sk--btn" aria-hidden />
                : ready > 0
                ? <Link className="hm-btn hm-btn--light hm-reveal" to="/orders?tab=readyForPickup">عرض طلبياتي <ArrowLeft size={18} aria-hidden /></Link>
                : <Link className="hm-btn hm-btn--light hm-reveal" to="/start-shipment"><Rocket size={18} aria-hidden /> ابدأ الشحن</Link>}
              <Link className="hm-btn hm-btn--ghost" to="/address">عناويننا</Link>
            </div>
          </div>
          <div className="hm-code">
            <span className="hm-code__label">كود الشحن الخاص بك</span>
            <bdi className="hm-code__value" dir="ltr">{id}</bdi>
            <button type="button" className={`hm-code__copy ${copied === 'code' ? 'is-done' : ''}`} onClick={() => copy('code', id)}>
              {copied === 'code' ? <><Check size={15} aria-hidden /> نُسخ</> : <><Copy size={15} aria-hidden /> نسخ الكود</>}
            </button>
            <span className="hm-code__hint">يُكتب في العنوان وعلى الكرتونة، وبه نعرف أن الطرد لك.</span>
          </div>
        </header>

        <div>
          <AnnouncementBar announcements={announcements} />
          {unreadReplies > 0 && (
            <Link to="/suggestions" className="hm-notice">
              <MessageSquareText size={20} aria-hidden />
              <span>{unreadReplies === 1 ? 'وصلك رد جديد من المكتب على شكواك' : `وصلتك ${unreadReplies} ردود جديدة من المكتب على شكاواك`}</span>
              <b>عرض الرد <ArrowLeft size={16} aria-hidden /></b>
            </Link>
          )}
        </div>

        {/* Numbers */}
        <ul className="hm-stats">
          {stats.map(({ key, label, value, icon: Icon, to, hot, ltr }) => (
            <li key={key}>
              <Link to={to} className={`hm-stat ${hot ? 'is-hot' : ''}`}>
                <span className="hm-stat__icon" aria-hidden><Icon size={22} /></span>
                <span className="hm-stat__label">{label}</span>
                {value === undefined
                  ? <span className="hm-sk hm-sk--num" aria-hidden />
                  : <bdi className="hm-stat__value" dir={ltr ? 'ltr' : undefined}>{value}</bdi>}
              </Link>
            </li>
          ))}
        </ul>

        <LatestPosts />

        <div className="hm-grid">
          {/* The two newest shipments and their packages */}
          <RecentShipments orders={orders} total={orders?.length || 0} />

          <aside className="hm-side">
            {/* Today's prices */}
            {(!!todayPrices.length || rate?.rate) && (
              <section className="hm-card" aria-labelledby="hm-prices">
                <div className="hm-card__head">
                  <h2 id="hm-prices">أسعار اليوم</h2>
                  <Link to="/prices/shipping">الحاسبة</Link>
                </div>
                <ul className="hm-prices">
                  {todayPrices.map((r) => (
                    <li key={r.key}>
                      <span className="flag-frame"><Flag country={r.country} size={20} /></span>
                      <span>{r.method === 'air' ? 'جوي' : 'بحري'} من {r.countryLabel || (r.country === 'china' ? 'الصين' : 'الإمارات')}</span>
                      <b dir="ltr">{money(r.price)}</b>
                      <small>لكل {r.unit === 'cbm' ? 'م³' : 'كجم'}</small>
                    </li>
                  ))}
                  {rate?.rate && (
                    <li className="hm-prices__rate">
                      <span className="hm-prices__usd" aria-hidden>$</span>
                      <span>سعر صرف الدولار</span>
                      <b dir="ltr">{rate.rate}</b>
                      <small>دينار</small>
                    </li>
                  )}
                </ul>
                {pricesUpdated && <p className="hm-muted">آخر تحديث للأسعار: {pricesUpdated.short}</p>}
              </section>
            )}

            {/* The customer's office */}
            <section className="hm-card hm-office" aria-labelledby="hm-office">
              <div className="hm-card__head"><h2 id="hm-office">{office.name}</h2><span className="hm-office__tag">مكتبك</span></div>
              <p className="hm-office__address"><MapPin size={16} aria-hidden /> {office.address}</p>
              <div className="hm-office__actions">
                <a
                  className="hm-btn hm-btn--primary"
                  href={whatsappLink(office.whatsapp, `مرحباً، أنا ${[account?.firstName, account?.lastName].filter(Boolean).join(' ') || 'عميل إكسيوس'}${id ? ` - كود العميل ${id}` : ''}.\n`)}
                  target="_blank"
                  rel="noreferrer"
                >
                  <TbBrandWhatsapp size={19} aria-hidden /> واتساب
                </a>
                <a className="hm-btn hm-btn--outline" href={`tel:${office.phones[0]}`}><Phone size={16} aria-hidden /> <bdi dir="ltr">{office.phones[0]}</bdi></a>
              </div>
            </section>
          </aside>
        </div>

        {/* Everything else, one tap away */}
        <section aria-labelledby="hm-short">
          <h2 id="hm-short" className="hm-title">الوصول السريع</h2>
          <ul className="hm-shortcuts">
            {SHORTCUTS.map(({ to, icon: Icon, title, text }) => (
              <li key={to}>
                <Link to={to} className="hm-short">
                  <span className="hm-short__icon" aria-hidden><Icon size={21} /></span>
                  <span className="hm-short__text"><b>{title}</b><small>{text}</small></span>
                </Link>
              </li>
            ))}
          </ul>
        </section>
      </div>
    </div>
  );
};

export default Home;
