import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { useSelector } from 'react-redux';
import {
  ArrowLeft, Boxes, MapPin, OctagonX, PackageCheck, PackagePlus, PackageSearch, Plus, Receipt, RefreshCw, Search, ShoppingBag,
  SlidersHorizontal, X,
} from 'lucide-react';
import api from '../../api';
import AnnouncementBar from '../../components/AnnouncementBar/AnnouncementBar';
import { Announcement, OrderStatusType, Package } from '../../models';
import { officeFor } from '../../constants/contact';
import { useCopy } from '../../utils/useCopy';
import { CardSkeleton, PurchaseCard, ShipmentCard } from './OrderCards';
import ReadyBill from './ReadyBill';
import { ORDER_THEMES } from '../../constants/orderThemes';
import Flag from '../PricesPage/Flag';
import {
  COUNTRY_LABEL, DEFAULT_FILTERS, OrderFilters, activeFilterCount, applyFilters, isPurchaseInvoice, originOf, shipMethod, usd,
} from './orderUtils';
import './orders.css';

type View = 'shipments' | 'purchases';
type Counts = {
  activeOrders: number, warehouseArrived: number, readyForReceivement: number,
  finishedOrders: number, unsureOrders: number, invoiceOrders: number, blockedOrders?: number,
};

// The fields the cards show; the server only ever returns fields a customer may read
const LIST_FIELDS = {
  orderId: 1, createdAt: 1, orderStatus: 1, isPayment: 1, isShipment: 1, isFinished: 1, isCanceled: 1, unsureOrder: 1,
  productName: 1, totalInvoice: 1,
  'shipment.method': 1, 'shipment.fromWhere': 1, 'shipment.toWhere': 1,
  'paymentList._id': 1, 'paymentList.status': 1, 'paymentList.settings': 1,
  'paymentList.deliveredPackages.trackingNumber': 1,
  'paymentList.deliveredPackages.weight': 1, 'paymentList.deliveredPackages.exiosPrice': 1,
  'customization.note': 1, 'customization.theme': 1,
  shippingBlocked: 1, shippingBlockReason: 1,
};

const SHIPMENT_TABS: { value: string, label: string, count: keyof Counts, empty: string }[] = [
  { value: 'active', label: 'النشطة', count: 'activeOrders', empty: 'لا توجد شحنات نشطة الآن.' },
  { value: 'arrivedWarehouse', label: 'في المخزن', count: 'warehouseArrived', empty: 'لا توجد شحنات في مخزننا الخارجي الآن.' },
  { value: 'readyForPickup', label: 'جاهزة للاستلام', count: 'readyForReceivement', empty: 'لا توجد شحنات جاهزة للاستلام الآن.' },
  { value: 'finished', label: 'تم التسليم', count: 'finishedOrders', empty: 'لم تستلم أي شحنة بعد.' },
  { value: 'unsure', label: 'أرقام قيد المتابعة', count: 'unsureOrders', empty: 'لم ترسل أرقام تتبع لنتابعها.' },
  // Shown only when there is one: shipments the office stopped (prohibited goods)
  { value: 'blocked', label: 'موقوفة عن الشحن', count: 'blockedOrders', empty: 'لا توجد شحنات موقوفة.' },
];

const STOPPED_KEY = 'exios:blocked-banner-seen';

const PERIODS = [
  { value: 'all', label: 'كل الوقت' },
  { value: '30', label: 'آخر 30 يوماً' },
  { value: '90', label: 'آخر 3 أشهر' },
  { value: '365', label: 'آخر سنة' },
];

const FILTER_KEYS: Record<keyof OrderFilters, string> = { method: 'm', country: 'c', note: 'n', period: 'p', sort: 's' };

const PURCHASE_FILTERS = [
  { value: 'all', label: 'الكل' },
  { value: 'pending', label: 'قيد الشراء' },
  { value: 'paid', label: 'تم الشراء' },
];

const ClientOrders = () => {
  const account = useSelector((state: any) => state.session.account);
  const office = officeFor(account?.city);
  const { copied, copy } = useCopy();

  // The view and tab live in the address, so coming back from an order lands on the same list
  const [params, setParams] = useSearchParams();
  const view: View = params.get('view') === 'purchases' ? 'purchases' : 'shipments';
  const tab = SHIPMENT_TABS.some((t) => t.value === params.get('tab')) ? params.get('tab')! : 'active';
  const pFilter = PURCHASE_FILTERS.some((f) => f.value === params.get('filter')) ? params.get('filter')! : 'all';
  const setParam = (next: Record<string, string | null>) => {
    const p = new URLSearchParams(params);
    Object.entries(next).forEach(([k, v]) => (v === null ? p.delete(k) : p.set(k, v)));
    setParams(p, { replace: true });
  };

  // Advanced filters, also kept in the address (short keys)
  const filters: OrderFilters = {
    method: (['air', 'sea', 'unknown'].includes(params.get('m') || '') ? params.get('m') : 'all') as OrderFilters['method'],
    country: params.get('c') || 'all',
    note: params.get('n') || 'all',
    period: (['30', '90', '365'].includes(params.get('p') || '') ? params.get('p') : 'all') as OrderFilters['period'],
    sort: params.get('s') === 'old' ? 'old' : 'new',
  };
  const filterCount = activeFilterCount(filters);
  const [panelOpen, setPanelOpen] = useState(filterCount > 0);
  const setFilter = (key: keyof OrderFilters, value: string) => {
    setParam({ [FILTER_KEYS[key]]: value === DEFAULT_FILTERS[key] ? null : value });
  };
  const clearFilters = () => setParam({ m: null, c: null, n: null, p: null, s: null });

  const listKey = view === 'purchases' ? 'invoiceOrders' : tab;
  const cache = useRef<Record<string, Package[]>>({});
  // Each answer is kept with the list it belongs to, and the list shown is picked by the tab on screen.
  // So on a tab change the old tab's orders are never shown under the new tab, not even for one frame
  // (the effect that loads the new tab only runs after the screen is painted).
  const [loaded, setLoaded] = useState<{ key: string, list: Package[] } | null>(null);
  const orders = loaded?.key === listKey ? loaded.list : cache.current[listKey] || null;
  const [counts, setCounts] = useState<Counts | null>(null);
  const [failedKey, setFailedKey] = useState<string | null>(null);
  const failed = failedKey === listKey;
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);

  const [query, setQuery] = useState('');
  const [results, setResults] = useState<Package[] | null>(null);
  const [searching, setSearching] = useState(false);
  const searchId = useRef(0);

  // A list loads once, then shows instantly from memory while it refreshes in the background.
  // Switching fast (active → ready → active) sends several requests that can come back in any order:
  // only the newest request for a list may fill it, and only the newest answer may set the counts.
  const requestSeq = useRef(0);
  const latestFor = useRef<Record<string, number>>({});
  const countsFrom = useRef(0);
  const load = useCallback((key: string) => {
    const id = ++requestSeq.current;
    latestFor.current[key] = id;
    setFailedKey((k) => (k === key ? null : k));
    api.getOrdersForUser(key as OrderStatusType, LIST_FIELDS)
      .then((res: any) => {
        const countList = res.data?.results?.countList;
        if (countList && id > countsFrom.current) { countsFrom.current = id; setCounts(countList); }
        if (latestFor.current[key] !== id) return;
        const list: Package[] = res.data?.results?.orders || [];
        cache.current[key] = list;
        setLoaded({ key, list });
      })
      .catch(() => { if (latestFor.current[key] === id && !cache.current[key]) setFailedKey(key); });
  }, []);

  useEffect(() => { load(listKey); }, [listKey, load]);

  useEffect(() => {
    api.getAnnouncements().then((res: any) => setAnnouncements(Array.isArray(res?.data) ? res.data : [])).catch(() => undefined);
  }, []);

  // Search across every order: by order number, tracking number or name. Waits for a pause in typing,
  // and only the latest search may fill the list.
  useEffect(() => {
    const q = query.trim();
    if (!q) { setResults(null); setSearching(false); return undefined; }
    setSearching(true);
    const id = ++searchId.current;
    const timer = window.setTimeout(() => {
      api.getOrdersBySearch(encodeURIComponent(q), LIST_FIELDS)
        .then((res: any) => { if (id === searchId.current) setResults(res.data?.results?.orders || []); })
        .catch(() => { if (id === searchId.current) setResults([]); })
        .finally(() => { if (id === searchId.current) setSearching(false); });
    }, 400);
    return () => window.clearTimeout(timer);
  }, [query]);

  const purchases = useMemo(() => {
    if (view !== 'purchases' || !orders) return null;
    const live = orders.filter((o) => !o.isCanceled);
    return {
      list: orders.filter((o) => (pFilter === 'paid' ? Number(o.orderStatus) >= 1 : pFilter === 'pending' ? Number(o.orderStatus) < 1 : true)),
      total: live.reduce((sum, o) => sum + (Number(o.totalInvoice) || 0), 0),
      pending: live.filter((o) => Number(o.orderStatus) < 1).length,
      paid: live.filter((o) => Number(o.orderStatus) >= 1).length,
    };
  }, [orders, view, pFilter]);

  const ready = counts?.readyForReceivement || 0;
  const blockedCount = counts?.blockedOrders || 0;
  const isSearch = results !== null || searching;
  // The blocked banner can be dismissed. It stays hidden until another order is stopped
  // (we remember how many were stopped when it was closed; the tab stays either way).
  const [stoppedSeen, setStoppedSeen] = useState(() => {
    try { return Number(localStorage.getItem(STOPPED_KEY)) || 0; } catch { return 0; }
  });
  const saveStoppedSeen = (n: number) => {
    setStoppedSeen(n);
    try { localStorage.setItem(STOPPED_KEY, String(n)); } catch { /* storage unavailable */ }
  };
  const dismissStopped = () => saveStoppedSeen(blockedCount);
  useEffect(() => {
    // fewer stopped orders now (released or delivered): lower the mark so a new one shows again
    if (counts && blockedCount < stoppedSeen) saveStoppedSeen(blockedCount);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [counts, blockedCount]);
  const visibleTabs = SHIPMENT_TABS.filter((t) => t.value !== 'blocked' || blockedCount > 0 || tab === 'blocked');
  const base = results ?? (view === 'purchases' ? purchases?.list ?? null : orders);
  const shown = useMemo(() => (base ? applyFilters(base, filters) : null),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [base, filters.method, filters.country, filters.note, filters.period, filters.sort]);

  // Only offer the countries and note colours this customer actually has
  const options = useMemo(() => {
    const list = base || [];
    return {
      unknownMethod: list.some((o) => !isPurchaseInvoice(o) && shipMethod(o) === 'unknown'),
      // The countries this customer ships from, most orders first; a country the office typed itself keeps its own name
      countries: (() => {
        const n = new Map<string, number>();
        list.forEach((o) => { if (!isPurchaseInvoice(o)) { const c = originOf(o); if (c) n.set(c, (n.get(c) || 0) + 1); } });
        return Array.from(n.entries()).sort((a, b) => b[1] - a[1]).map(([c, count]) => ({ c, count }));
      })(),
      // The chosen colour stays on offer after a tab change, so it can still be turned off
      colors: ORDER_THEMES.filter((t) => t.id === filters.note || list.some((o) => o.customization?.note && (o.customization?.theme || 'emerald') === t.id)),
      hasNotes: list.some((o) => !!o.customization?.note),
    };
  }, [base, filters.note]);
  // Method and origin mean nothing for purchase invoices
  const forShipments = view === 'shipments' || isSearch;
  const currentTab = SHIPMENT_TABS.find((t) => t.value === tab)!;

  const card = (o: Package) => (isPurchaseInvoice(o)
    ? <PurchaseCard key={o._id} order={o} copied={copied} copy={copy} />
    : <ShipmentCard key={o._id} order={o} copied={copied} copy={copy} />);

  return (
    <div dir="rtl" lang="ar" className="or-page">
      <div className="or-wrap">
        <header className="or-head or-anim" style={{ ['--i' as any]: 0 }}>
          <div>
            <h1>طلبياتي</h1>
            <p>تابع شحناتك من المخزن حتى الاستلام، وفواتير ما اشتريناه لك.</p>
          </div>
          <Link to="/add-tracking-numbers" className="or-btn or-btn--primary">
            <PackagePlus size={18} aria-hidden /> إضافة رقم تتبع
          </Link>
        </header>

        <AnnouncementBar announcements={announcements} />

        {/* Two kinds of orders, kept apart: shipments travel, purchase invoices are money paid for you */}
        <div className="or-switch or-anim" style={{ ['--i' as any]: 1 }} role="tablist" aria-label="نوع الطلبيات">
          <button
            type="button"
            role="tab"
            aria-selected={view === 'shipments'}
            className={view === 'shipments' ? 'is-on' : ''}
            onClick={() => setParam({ view: null, filter: null })}
          >
            <Boxes size={19} aria-hidden /> الشحنات
            {counts && <span className="or-switch__count">{counts.activeOrders}</span>}
          </button>
          <button
            type="button"
            role="tab"
            aria-selected={view === 'purchases'}
            className={view === 'purchases' ? 'is-on' : ''}
            onClick={() => setParam({ view: 'purchases', tab: null, m: null, c: null })}
          >
            <Receipt size={19} aria-hidden /> فواتير الشراء
            {counts && <span className="or-switch__count">{counts.invoiceOrders}</span>}
          </button>
        </div>

        {view === 'shipments' && ready > 0 && tab !== 'readyForPickup' && !isSearch && (
          <div className="or-ready">
            <span className="or-ready__icon" aria-hidden><PackageCheck size={22} /></span>
            <div className="or-ready__text">
              <b>{ready === 1 ? 'عندك شحنة جاهزة للاستلام' : `عندك ${ready} شحنات جاهزة للاستلام`}</b>
              <span>من {office.name}، {office.address}</span>
            </div>
            <div className="or-ready__actions">
              <button type="button" className="or-btn or-btn--dark" onClick={() => setParam({ tab: 'readyForPickup' })}>
                عرضها <ArrowLeft size={16} aria-hidden />
              </button>
              <a className="or-btn or-btn--ghost-dark" href={office.mapsUrl} target="_blank" rel="noreferrer">
                <MapPin size={16} aria-hidden /> الموقع
              </a>
            </div>
          </div>
        )}

        {view === 'shipments' && blockedCount > stoppedSeen && tab !== 'blocked' && !isSearch && (
          <div className="or-stopped">
            <button type="button" className="or-stopped__main" onClick={() => setParam({ tab: 'blocked' })}>
              <span className="or-stopped__icon" aria-hidden><OctagonX size={20} /></span>
              <span className="or-stopped__text">
                <b>{blockedCount === 1 ? 'أوقفنا شحن إحدى طلبياتك' : `أوقفنا شحن ${blockedCount} من طلبياتك`}</b>
                <span>غالباً بسبب بضاعة ممنوعة من الشحن. اطّلع على السبب وتواصل مع المكتب.</span>
              </span>
              <ArrowLeft size={18} aria-hidden />
            </button>
            <button type="button" className="or-stopped__close" onClick={dismissStopped} aria-label="إخفاء التنبيه">
              <X size={16} aria-hidden />
            </button>
          </div>
        )}

        <div className="or-tools or-anim" style={{ ['--i' as any]: 2 }}>
          <div className="or-searchrow">
          <label className="or-search">
            <Search size={18} aria-hidden />
            <span className="sr-only">بحث في الطلبيات</span>
            <input
              type="search"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="ابحث برقم الطلبية أو رقم التتبع"
              autoComplete="off"
            />
            {query && (
              <button type="button" onClick={() => setQuery('')} aria-label="مسح البحث"><X size={16} /></button>
            )}
          </label>
          <button
            type="button"
            className={`or-filterbtn ${panelOpen ? 'is-open' : ''} ${filterCount ? 'is-active' : ''}`}
            onClick={() => setPanelOpen((v) => !v)}
            aria-expanded={panelOpen}
            aria-controls="or-filters"
          >
            <SlidersHorizontal size={18} aria-hidden /> فلترة
            {filterCount > 0 && <span>{filterCount}</span>}
          </button>
          </div>

          {/* Advanced filters: shipping method, origin, the customer's own notes and colours, time, order */}
          {panelOpen && (
            <div className="or-filters" id="or-filters">
              {forShipments && (
                <div className="or-fgroup" role="group" aria-label="طريقة الشحن">
                  <span className="or-fgroup__label" aria-hidden>طريقة الشحن</span>
                  <div>
                    {[['all', 'الكل'], ['air', 'جوي'], ['sea', 'بحري'], ...(options.unknownMethod || filters.method === 'unknown' ? [['unknown', 'غير محددة']] : [])].map(([v, l]) => (
                      <button key={v} type="button" aria-pressed={filters.method === v} className={`or-fchip ${filters.method === v ? 'is-on' : ''}`} onClick={() => setFilter('method', v)}>{l}</button>
                    ))}
                  </div>
                </div>
              )}

              {forShipments && (options.countries.length > 0 || filters.country !== 'all') && (
                <div className="or-fgroup" role="group" aria-label="الشحن من">
                  <span className="or-fgroup__label" aria-hidden>الشحن من</span>
                  <div>
                    <button type="button" aria-pressed={filters.country === 'all'} className={`or-fchip ${filters.country === 'all' ? 'is-on' : ''}`} onClick={() => setFilter('country', 'all')}>الكل</button>
                    {options.countries.map(({ c, count }) => (
                      <button key={c} type="button" aria-pressed={filters.country === c} className={`or-fchip or-fchip--country ${filters.country === c ? 'is-on' : ''}`} onClick={() => setFilter('country', c)}>
                        <Flag country={c} size={18} />
                        <span>{COUNTRY_LABEL[c] || c}</span>
                        <span className="or-fchip__n">{count}</span>
                      </button>
                    ))}
                  </div>
                </div>
              )}

              <div className="or-fgroup" role="group" aria-label="ملاحظاتي">
                <span className="or-fgroup__label" aria-hidden>ملاحظاتي</span>
                <div>
                  {[['all', 'الكل'], ['with', 'عليها ملاحظة'], ['without', 'بدون ملاحظة']].map(([v, l]) => (
                    <button key={v} type="button" aria-pressed={filters.note === v} className={`or-fchip ${filters.note === v ? 'is-on' : ''}`} onClick={() => setFilter('note', v)} disabled={v !== 'all' && !options.hasNotes && filters.note !== v}>{l}</button>
                  ))}
                  {options.colors.map((t) => (
                    <button
                      key={t.id}
                      type="button"
                      aria-pressed={filters.note === t.id}
                      aria-label={`ملاحظات باللون ${t.label}`}
                      title={t.label}
                      className={`or-fswatch ${filters.note === t.id ? 'is-on' : ''}`}
                      style={{ background: t.gradient, ['--sw' as any]: t.accent }}
                      onClick={() => setFilter('note', filters.note === t.id ? 'all' : t.id)}
                    />
                  ))}
                </div>
              </div>

              <div className="or-fgroup" role="group" aria-label="الفترة">
                <span className="or-fgroup__label" aria-hidden>الفترة</span>
                <div>
                  {PERIODS.map((p) => (
                    <button key={p.value} type="button" aria-pressed={filters.period === p.value} className={`or-fchip ${filters.period === p.value ? 'is-on' : ''}`} onClick={() => setFilter('period', p.value)}>{p.label}</button>
                  ))}
                </div>
              </div>

              <div className="or-fgroup" role="group" aria-label="الترتيب">
                <span className="or-fgroup__label" aria-hidden>الترتيب</span>
                <div>
                  <button type="button" aria-pressed={filters.sort === 'new'} className={`or-fchip ${filters.sort === 'new' ? 'is-on' : ''}`} onClick={() => setFilter('sort', 'new')}>الأحدث أولاً</button>
                  <button type="button" aria-pressed={filters.sort === 'old'} className={`or-fchip ${filters.sort === 'old' ? 'is-on' : ''}`} onClick={() => setFilter('sort', 'old')}>الأقدم أولاً</button>
                </div>
              </div>

              {filterCount > 0 && (
                <div className="or-filters__foot">
                  <span>{shown && base ? `يظهر ${shown.length} من ${base.length}` : ''}</span>
                  <button type="button" className="or-linkbtn" onClick={clearFilters}><X size={15} aria-hidden /> مسح الفلاتر</button>
                </div>
              )}
            </div>
          )}

          {!isSearch && view === 'shipments' && (
            <div className="or-chips" role="tablist" aria-label="حالة الشحنات">
              {visibleTabs.map((t) => (
                <button
                  key={t.value}
                  type="button"
                  role="tab"
                  aria-selected={tab === t.value}
                  className={`or-chip ${tab === t.value ? 'is-on' : ''} ${t.value === 'readyForPickup' && ready > 0 ? 'is-hot' : ''} ${t.value === 'blocked' ? 'is-stop' : ''}`}
                  onClick={() => setParam({ tab: t.value === 'active' ? null : t.value })}
                >
                  {t.label}
                  {counts && <span>{counts[t.count] || 0}</span>}
                </button>
              ))}
            </div>
          )}

          {!isSearch && view === 'purchases' && (
            <div className="or-chips" role="tablist" aria-label="حالة الفواتير">
              {PURCHASE_FILTERS.map((f) => (
                <button
                  key={f.value}
                  type="button"
                  role="tab"
                  aria-selected={pFilter === f.value}
                  className={`or-chip ${pFilter === f.value ? 'is-on' : ''}`}
                  onClick={() => setParam({ filter: f.value === 'all' ? null : f.value })}
                >
                  {f.label}
                  {purchases && <span>{f.value === 'all' ? purchases.paid + purchases.pending : f.value === 'paid' ? purchases.paid : purchases.pending}</span>}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Purchases: what you have spent through us, at a glance */}
        {!isSearch && view === 'purchases' && purchases && orders && orders.length > 0 && (
          <dl className="or-summary">
            <div><dt>إجمالي المشتريات</dt><dd><bdi dir="ltr">{usd(purchases.total)}</bdi></dd></div>
            <div><dt>تم شراؤها</dt><dd>{purchases.paid}</dd></div>
            <div><dt>قيد الشراء</dt><dd>{purchases.pending}</dd></div>
          </dl>
        )}

        {/* Ready for pickup: what collecting them comes to, worked out */}
        {!isSearch && view === 'shipments' && tab === 'readyForPickup' && shown && shown.length > 0 && (
          <ReadyBill orderIds={shown.map((o) => o._id)} />
        )}

        {!isSearch && view === 'shipments' && tab === 'unsure' && (
          <p className="or-hint">
            أرقام التتبع التي أرسلتها لنتابعها. عندما يصل الطرد لمخزننا ينتقل إلى الشحنات النشطة.
            إن أخطأت في رقم أو تراجعت عنه، افتحه واحذفه.
          </p>
        )}

        {isSearch && (
          <p className="or-results">
            {searching ? 'جارٍ البحث…' : `${results?.length || 0} ${results?.length === 1 ? 'نتيجة' : 'نتائج'} لـ «${query.trim()}»`}
          </p>
        )}

        {/* The list */}
        {failed && !shown ? (
          <div className="or-empty">
            <PackageSearch size={36} aria-hidden />
            <b>تعذّر تحميل الطلبيات</b>
            <p>تحقق من اتصالك بالإنترنت ثم حاول مرة أخرى.</p>
            <button type="button" className="or-btn or-btn--primary" onClick={() => load(listKey)}>
              <RefreshCw size={16} aria-hidden /> إعادة المحاولة
            </button>
          </div>
        ) : shown === null || (searching && results === null) ? (
          <div className={`or-list ${view === 'purchases' ? 'or-list--receipts' : ''}`} aria-busy="true">
            {[0, 1, 2, 3].map((i) => <CardSkeleton key={i} receipt={view === 'purchases'} />)}
          </div>
        ) : shown.length ? (
          <div key={`${isSearch ? 'search' : `${listKey}:${pFilter}`}:${params.get('m')}${params.get('c')}${params.get('n')}${params.get('p')}${params.get('s')}`} className={`or-list or-list--enter ${view === 'purchases' && !isSearch ? 'or-list--receipts' : ''}`}>
            {shown.map(card)}
          </div>
        ) : filterCount > 0 && base && base.length > 0 ? (
          <div className="or-empty">
            <SlidersHorizontal size={34} aria-hidden />
            <b>لا توجد طلبيات بهذه الفلاتر</b>
            <p>غيّر الفلاتر أو امسحها لترى كل الطلبيات في هذا القسم.</p>
            <button type="button" className="or-btn or-btn--outline" onClick={clearFilters}><X size={16} aria-hidden /> مسح الفلاتر</button>
          </div>
        ) : isSearch ? (
          <div className="or-empty">
            <Search size={34} aria-hidden />
            <b>لا توجد طلبية بهذا الرقم</b>
            <p>تأكد من رقم الطلبية أو رقم التتبع. إن أرسلت طرداً لمخزننا ولم يظهر بعد، أضف رقم تتبعه لنتابعه.</p>
            <Link to="/add-tracking-numbers" className="or-btn or-btn--outline"><Plus size={16} aria-hidden /> إضافة رقم تتبع</Link>
          </div>
        ) : view === 'purchases' ? (
          <div className="or-empty">
            <ShoppingBag size={36} aria-hidden />
            <b>{pFilter === 'all' ? 'لا توجد فواتير شراء' : 'لا توجد فواتير هنا'}</b>
            <p>نشتري لك من المواقع والمتاجر ونرسلها لمخزننا. اطلب من المكتب الشراء لك وتظهر فاتورتك هنا.</p>
            <Link to="/prices/purchase" className="or-btn or-btn--outline">أسعار الشراء</Link>
          </div>
        ) : (
          <div className="or-empty">
            <PackageSearch size={36} aria-hidden />
            <b>{currentTab.empty}</b>
            {tab === 'active' || tab === 'unsure' ? (
              <>
                <p>أرسل بضاعتك إلى عنوان مخزننا، ثم أضف رقم التتبع لنتابع طردك حتى يصلك.</p>
                <div className="or-empty__actions">
                  <Link to="/address" className="or-btn or-btn--primary">عناوين المخازن</Link>
                  <Link to="/add-tracking-numbers" className="or-btn or-btn--outline">إضافة رقم تتبع</Link>
                </div>
              </>
            ) : (
              <button type="button" className="or-btn or-btn--outline" onClick={() => setParam({ tab: null })}>عرض الشحنات النشطة</button>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default ClientOrders;
