import { ReactNode, useEffect, useMemo, useRef, useState } from 'react';
import { useSelector } from 'react-redux';
import {
  ArrowLeft, Banknote, Calculator, Check, Clock, Container as ContainerIcon, Crown, History, Info, Landmark, Plane, RefreshCw, Ship, ShoppingCart,
} from 'lucide-react';
import QuoteTicket from './QuoteTicket';
import { PricingPart, cachedPricing, fetchPricing, hasParts } from './pricingCache';
import Flag, { countryOfPort } from './Flag';
import {
  Container, Pricing, Quote, ShippingRoute, Tier, alipayQuote, carrierName, fclQuote, ltr, money, plain, purchaseQuote, shippingQuote, swiftQuote, tierFor, toNumber, updatedLabel,
} from './pricingMath';
import { SpecialPrices, categoryLabel, specialCategories, withSpecialPrices } from '../../utils/specialPrices';
import './pricesPage.css';

type Service = 'shipping' | 'fcl' | 'purchase' | 'alipay' | 'swift';
export type PriceGroup = 'shipping' | 'purchase' | 'transfers';

// The price sections each page needs: only these are loaded when the page opens
const GROUP_PARTS: Record<PriceGroup, PricingPart[]> = {
  shipping: ['shipping', 'fcl'],
  purchase: ['purchase'],
  transfers: ['alipay', 'swift'],
};

// One page per kind of service, each its own entry in the sidebar
const GROUPS: Record<PriceGroup, { title: string, sub: string, services: { key: Service, label: string, icon: ReactNode }[] }> = {
  shipping: {
    title: 'أسعار الشحن',
    sub: 'من الصين ودول أخرى إلى ليبيا. احسب تكلفة شحنتك ثم أرسلها لنا على واتساب.',
    services: [
      { key: 'shipping', label: 'جوي وبحري', icon: <Plane size={17} aria-hidden /> },
      { key: 'fcl', label: 'حاوية كاملة', icon: <ContainerIcon size={17} aria-hidden /> },
    ],
  },
  purchase: {
    title: 'أسعار الشراء',
    sub: 'نشتري لك من المواقع والموردين. اعرف العمولة قبل أن تطلب.',
    services: [{ key: 'purchase', label: 'الشراء', icon: <ShoppingCart size={17} aria-hidden /> }],
  },
  transfers: {
    title: 'الحوالات المالية',
    sub: 'ندفع لمورّدك في الصين باليوان، أو نحوّل له عبر البنك.',
    services: [
      { key: 'alipay', label: 'علي باي', icon: <Banknote size={17} aria-hidden /> },
      { key: 'swift', label: 'سويفت', icon: <Landmark size={17} aria-hidden /> },
    ],
  },
};

// Full-container prices are at the origin: the customer pays Libyan customs separately. Shared
// (air and sea) shipping does not carry this notice.
const FOB_NOTICE = 'أسعار الحاويات FOB: لا تشمل الجمارك والرسوم في ليبيا.';

// A carrier's Arabic name, with the name as typed beside it when it was translated (كوسكو COSCO)
const CarrierName = ({ name, className = '' }: { name?: string, className?: string }) => {
  const c = carrierName(name);
  if (!c.ar) return null;
  return (
    <span className={`carrier-name ${className}`}>
      <bdi>{c.ar}</bdi>
      {c.latin && <span dir="ltr" className="carrier-latin">{c.latin}</span>}
    </span>
  );
};

// "Shipping line: COSCO" on a shared route, in its own pill so it reads at a glance
const CarrierPill = ({ route }: { route: ShippingRoute }) => (route.carrier ? (
  <span className="carrier-pill">
    {route.method === 'sea' ? <Ship size={16} aria-hidden /> : <Plane size={16} aria-hidden />}
    <span className="carrier-pill__label">{route.method === 'sea' ? 'الخط الملاحي' : 'شركة الطيران'}</span>
    <CarrierName name={route.carrier} className="font-bold text-zinc-900" />
  </span>
) : null);

// "up to 200", "200 to 1,000", "over 7,000"
// "from 1 to 1,000", "from 1,001 to 5,000", "from 5,001 and above". A bracket's upper bound is
// inclusive, so the next one starts just after it: +1 for whole amounts, +0.01 otherwise.
const startAfter = (n: number) => (Number.isInteger(n) ? n + 1 : Math.round((n + 0.01) * 100) / 100);
const bracketRange = (tiers: Tier[], i: number, unit: (n: number) => string) => {
  const tier = tiers[i];
  const prev = i > 0 ? tiers[i - 1].upTo : null;
  const from = prev === null ? 1 : startAfter(prev);
  if (tier.upTo === null) return prev === null ? 'أي مبلغ' : `من ${ltr(unit(from))} فما فوق`;
  return `من ${ltr(unit(from))} إلى ${ltr(unit(tier.upTo))}`;
};

// One named commission in a stacked step: "Commission 3% of the invoice" or "Commission $10 fixed"
const CommissionPair = ({ t, of }: { t: Tier, of: string }) => (
  <span className="tier-pair">
    <span className="tier-pair__label">العمولة</span>
    {t.type === 'fixed'
      ? <span className="tier-pair__value"><b dir="ltr">{money(t.value || 0)}</b><small>مبلغ ثابت</small></span>
      : <span className="tier-pair__value"><b dir="ltr">{plain(t.value || 0)}%</b><small>{of}</small></span>}
  </span>
);
const yuan = (n: number) => `¥${plain(n, 0)}`;
const perUnit = (r: ShippingRoute) => (r.unit === 'kg' ? 'لكل كجم' : 'لكل متر مكعب');
const reducedMotion = () => typeof window !== 'undefined' && window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;
const scrollTo = (el: HTMLElement | null) => el?.scrollIntoView({ behavior: reducedMotion() ? 'auto' : 'smooth', block: 'start' });

// When a price was last changed: "updated today", "updated 3 days ago", "updated on 2 November 2026"
const Updated = ({ at, className = '' }: { at?: string | null, className?: string }) => {
  const u = updatedLabel(at);
  if (!u) return null;
  return (
    <span className={`updated${u.fresh ? ' is-fresh' : ''} ${className}`}>
      <History size={13} aria-hidden />
      <span>حُدّث {u.short === u.full ? 'في ' : ''}<time dateTime={u.iso} title={u.full}>{u.short}</time></span>
    </span>
  );
};

const Field = ({ id, label, unit, value, onChange, hint }: {
  id: string, label: string, unit: string, value: string, onChange: (v: string) => void, hint?: string,
}) => (
  <div className="grid gap-1.5">
    <label htmlFor={id} className="text-base font-semibold text-zinc-700">{label}</label>
    <div className="relative">
      <input
        id={id}
        type="text"
        inputMode="decimal"
        autoComplete="off"
        dir="ltr"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder="0"
        className="!rounded-xl !border-zinc-300 !bg-white !py-3 !pl-16 !pr-4 text-right text-xl font-bold tabular-nums !text-zinc-900 !shadow-none placeholder:font-normal placeholder:text-zinc-300 focus:!border-green-700 focus:!ring-2 focus:!ring-green-700/20"
      />
      {/* Above the input: the app's base input style raises a focused input's z-index */}
      <span className="pointer-events-none absolute inset-y-0 left-3 z-20 flex items-center text-base font-semibold text-zinc-600">{unit}</span>
    </div>
    {hint && <p className="text-sm text-zinc-600">{hint}</p>}
  </div>
);

const Chips = ({ label, items, value, onChange }: { label: string, items: { key: string, label: string, icon?: ReactNode }[], value: string, onChange: (k: string) => void }) => (
  <div className="grid gap-1.5">
    <span className="text-base font-semibold text-zinc-700">{label}</span>
    <div className="flex flex-wrap gap-2" role="radiogroup" aria-label={label}>
      {items.map((item) => (
        <button
          key={item.key}
          type="button"
          role="radio"
          aria-checked={item.key === value}
          onClick={() => onChange(item.key)}
          className={`inline-flex items-center gap-2 rounded-xl border px-3.5 py-2 text-base font-semibold transition-colors duration-200 focus:outline-none focus-visible:ring-2 focus-visible:ring-green-700 focus-visible:ring-offset-2 ${item.key === value ? 'border-green-700 bg-green-50 text-green-800' : 'border-zinc-200 bg-white text-zinc-700 hover:border-zinc-300'}`}
        >
          {item.icon}{item.label}
        </button>
      ))}
    </div>
  </div>
);

const Note = ({ text }: { text?: string }) => (text ? <p className="bidi-text mt-5 whitespace-pre-line rounded-xl bg-amber-50 px-4 py-3 text-base leading-relaxed text-amber-900" dir="auto">{text}</p> : null);

// A route's own notes, inside its card. Long notes open on demand so cards keep a similar height.
const CardNote = ({ text }: { text: string }) => {
  const [open, setOpen] = useState(false);
  const long = text.length > 160 || text.split('\n').length > 3;
  return (
    <div className="card-note">
      <p className="flex items-center gap-1.5 text-sm font-bold text-zinc-700"><Info size={13} aria-hidden /> ملاحظات</p>
      <p className={`bidi-text mt-1 whitespace-pre-line text-base leading-relaxed text-zinc-600 ${long && !open ? 'card-note__clamp' : ''}`} dir="auto">{text}</p>
      {long && (
        <button type="button" onClick={() => setOpen((o) => !o)} aria-expanded={open} className="mt-1 text-sm font-bold text-green-700 hover:text-green-800 focus:outline-none focus-visible:underline">
          {open ? 'عرض أقل' : 'اقرأ كل الملاحظات'}
        </button>
      )}
    </div>
  );
};

// Brackets as steps from small to large amounts; the step the customer's amount falls in lights up
// `stacked`: one step under the other at every width, smallest amount on top
const Ladder = ({ tiers, active, range, children, stacked }: {
  tiers: Tier[], active: number, range: (i: number) => string, children: (t: Tier, i: number) => ReactNode, stacked?: boolean,
}) => (
  <ol className={`tier-ladder${stacked ? ' tier-ladder--stacked' : ''}`} style={{ ['--n' as any]: Math.min(tiers.length, 5) }}>
    {tiers.map((t, i) => (
      <li key={i} className={`tier-step${i === active ? ' is-active' : ''}`} aria-current={i === active ? 'step' : undefined}>
        <span className="tier-step__range" dir="rtl">{range(i)}</span>
        <div className="tier-step__value">{children(t, i)}</div>
        {i === active && <span className="tier-step__here">مبلغك هنا</span>}
      </li>
    ))}
  </ol>
);

// "Shanghai ← Tripoli", each port with its country's flag
const Ports = ({ c, size = 18 }: { c: Container, size?: number }) => {
  if (!c.fromPort && !c.toPort) return c.route ? <span className="text-base text-zinc-600">{c.route}</span> : null;
  return (
    <span className="flex flex-wrap items-center gap-x-2 gap-y-1 text-base font-semibold text-zinc-700">
      {c.fromPort && <span className="inline-flex items-center gap-1.5"><Flag country={countryOfPort(c.fromPort)} size={size} />{c.fromPort}</span>}
      {c.fromPort && c.toPort && <ArrowLeft size={15} className="text-zinc-400" aria-label="إلى" />}
      {c.toPort && <span className="inline-flex items-center gap-1.5"><Flag country={countryOfPort(c.toPort) || 'libya'} size={size} />{c.toPort}</span>}
    </span>
  );
};

// A priced section's title row: the title, a line under it, and when its prices last changed
const SectionHead = ({ title, sub, updatedAt }: { title: string, sub: string, updatedAt?: string | null }) => (
  <div className="flex flex-wrap items-start justify-between gap-x-4 gap-y-2">
    <div>
      <h2 className="text-xl font-bold text-zinc-900">{title}</h2>
      <p className="mt-0.5 text-base text-zinc-600">{sub}</p>
    </div>
    <Updated at={updatedAt} />
  </div>
);

// "Your special prices": the customer's own rates (set by the office), one row per kind of goods,
// air per KG and sea per CBM. Shown above the shipping prices, which then use them for China.
const SpecialPricesCard = ({ prices }: { prices?: SpecialPrices }) => {
  const cats = specialCategories(prices);
  if (!cats.length) return null;
  const hasAir = cats.some((c) => c.air);
  const hasSea = cats.some((c) => c.sea);
  return (
    <section className="sp-card" aria-labelledby="sp-title">
      <div className="sp-card__head">
        <span className="sp-card__badge" aria-hidden><Crown size={22} /></span>
        <div>
          <h2 id="sp-title">أسعارك الخاصة</h2>
          <p>حدّدها لك المكتب، وبها تُحسب شحناتك من <span className="sp-card__flag"><Flag country="china" size={18} /></span> الصين.</p>
        </div>
      </div>
      <table className="sp-table">
        <thead>
          <tr>
            <th scope="col">نوع البضاعة</th>
            {hasAir && <th scope="col"><Plane size={15} aria-hidden /> جوي <small>لكل كجم</small></th>}
            {hasSea && <th scope="col"><Ship size={15} aria-hidden /> بحري <small>لكل م³</small></th>}
          </tr>
        </thead>
        <tbody>
          {cats.map((c) => (
            <tr key={c.name}>
              <th scope="row" dir="auto">{categoryLabel(c.name)}</th>
              {hasAir && <td>{c.air ? <bdi dir="ltr">{money(c.air)}</bdi> : <span className="sp-none">—</span>}</td>}
              {hasSea && <td>{c.sea ? <bdi dir="ltr">{money(c.sea)}</bdi> : <span className="sp-none">—</span>}</td>}
            </tr>
          ))}
        </tbody>
      </table>
      <p className="sp-card__foot"><Check size={15} aria-hidden /> الحاسبة تحسب بأسعارك هذه. الشحن من الدول الأخرى بالأسعار العامة أدناه.</p>
    </section>
  );
};

const PricesPage = ({ group = 'shipping' }: { group?: PriceGroup }) => {
  const account = useSelector((state: any) => state.session.account);
  // Starts from what this visit already loaded, so a page seen before opens at once
  const [pricing, setPricing] = useState<Pricing | null>(() => cachedPricing() as Pricing | null);
  const [error, setError] = useState(false);
  const parts = GROUP_PARTS[group] || GROUP_PARTS.shipping;
  const ready = hasParts(pricing, parts);
  const [service, setService] = useState<Service | null>(null);

  const [routeKey, setRouteKey] = useState('');
  const [categoryKey, setCategoryKey] = useState('');
  const [weight, setWeight] = useState('');
  const [dims, setDims] = useState({ length: '', width: '', height: '', boxes: '1' });
  const [useDims, setUseDims] = useState(false);
  const [buyAmount, setBuyAmount] = useState('');
  const [siteKey, setSiteKey] = useState('');
  const [yuanAmount, setYuanAmount] = useState('');
  const [swiftAmount, setSwiftAmount] = useState('');
  const [containerKey, setContainerKey] = useState('');
  const [containerCount, setContainerCount] = useState('1');

  // The mobile dock appears once the service tabs scroll away
  const tabsRef = useRef<HTMLDivElement>(null);
  const panelRef = useRef<HTMLElement>(null);
  const calcRef = useRef<HTMLElement>(null);
  const [showDock, setShowDock] = useState(false);
  const [calcInView, setCalcInView] = useState(false);

  // Loads (or refreshes) this page's sections. Only the page on screen may show an error, and only
  // when it has nothing to show: with prices already loaded a failed refresh stays quiet.
  const groupRef = useRef(group);
  groupRef.current = group;
  const load = () => {
    const forGroup = group;
    setError(false);
    fetchPricing(parts)
      .then((loaded) => {
        const data = loaded as Pricing;
        setPricing({ ...data });
        setRouteKey((k) => k || data.shipping?.routes[0]?.key || '');
        setSiteKey((k) => k || data.purchase?.sites[0]?.key || '');
        // Start on the cheapest container offer
        setContainerKey((k) => k || [...(data.fcl?.containers || [])].sort((a, b) => a.price - b.price)[0]?.key || '');
      })
      .catch(() => {
        if (groupRef.current === forGroup && !hasParts(cachedPricing(), GROUP_PARTS[forGroup] || GROUP_PARTS.shipping)) setError(true);
      });
  };
  useEffect(() => { setService(null); load(); }, [group]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    if (!pricing || typeof IntersectionObserver === 'undefined') return undefined;
    const tabs = new IntersectionObserver(([entry]) => {
      // Only below the tabs, not above them
      setShowDock(!entry.isIntersecting && entry.boundingClientRect.top < 0);
    });
    const calc = new IntersectionObserver(([entry]) => setCalcInView(entry.isIntersecting), { threshold: 0.25 });
    if (tabsRef.current) tabs.observe(tabsRef.current);
    if (calcRef.current) calc.observe(calcRef.current);
    return () => { tabs.disconnect(); calc.disconnect(); };
  }, [pricing, ready]);

  const page = GROUPS[group] || GROUPS.shipping;
  const available = useMemo(() => page.services.filter((s) => pricing?.[s.key]), [pricing, page]);
  const active = service && available.some((s) => s.key === service) ? service : available[0]?.key;
  // Everyone's routes, with this customer's own prices on those from China (when the office set any)
  const shippingRoutes = useMemo(
    () => withSpecialPrices(pricing?.shipping?.routes || [], account?.specialPrices),
    [pricing, account?.specialPrices],
  );
  const route = shippingRoutes.find((r) => r.key === routeKey) || shippingRoutes[0];
  const category = route?.categories.find((c) => c.key === categoryKey) || route?.categories[0];
  const containers = pricing?.fcl?.containers || [];
  const container = containers.find((c) => c.key === containerKey) || containers[0];

  // Container offers by type (20 ft, 40 ft...), cheapest first within each
  const offersByType = useMemo(() => {
    const groups = new Map<string, Container[]>();
    containers.forEach((c) => groups.set(c.label, [...(groups.get(c.label) || []), c]));
    return Array.from(groups, ([label, list]) => ({ label, list: [...list].sort((a, b) => a.price - b.price) }));
  }, [containers]);
  const typeOffers = offersByType.find((g) => g.label === container?.label)?.list || [];
  // All offers in one grid, side by side; the cheapest of a type with several offers is marked
  const allOffers = offersByType.flatMap((g) => g.list.map((c, i) => ({ c, cheapest: g.list.length > 1 && i === 0 })));

  const selectRoute = (r: ShippingRoute) => {
    setRouteKey(r.key);
    // Keep the kind of goods when the new route prices it too
    if (!r.categories.some((c) => c.key === categoryKey)) setCategoryKey(r.categories[0]?.key || '');
  };

  const quote: Quote | null = useMemo(() => {
    if (!pricing || !active) return null;
    if (active === 'shipping' && route && pricing.shipping) {
      return shippingQuote(route, {
        amount: toNumber(weight),
        categoryKey: category?.key,
        ...(useDims ? { length: toNumber(dims.length), width: toNumber(dims.width), height: toNumber(dims.height), boxes: toNumber(dims.boxes) || 1 } : {}),
      }, pricing.shipping.volumetricDivisor);
    }
    if (active === 'purchase' && pricing.purchase) return purchaseQuote(pricing.purchase, toNumber(buyAmount), siteKey);
    if (active === 'alipay' && pricing.alipay) return alipayQuote(pricing.alipay, toNumber(yuanAmount));
    if (active === 'swift' && pricing.swift) return swiftQuote(pricing.swift, toNumber(swiftAmount));
    if (active === 'fcl' && container) return fclQuote(container, toNumber(containerCount));
    return null;
  }, [pricing, active, route, category, weight, dims, useDims, buyAmount, siteKey, yuanAmount, swiftAmount, container, containerCount]);

  // The bracket each typed amount falls in, to light its step
  const activeStep = (tiers: Tier[] | undefined, amount: string) => {
    const n = toNumber(amount);
    return tiers && n ? tiers.indexOf(tierFor(tiers, n)) : -1;
  };

  const customer = { name: [account?.firstName, account?.lastName].filter(Boolean).join(' '), customerId: account?.customerId };
  const emptyText = {
    shipping: route?.unit === 'cbm' ? 'اكتب حجم شحنتك بالمتر المكعب لترى التكلفة.' : 'اكتب وزن شحنتك لترى التكلفة.',
    purchase: 'اكتب قيمة مشترياتك لترى العمولة والإجمالي.',
    alipay: 'اكتب المبلغ باليوان الذي يجب أن يصل للمورد.',
    swift: 'اكتب مبلغ الحوالة بالدولار.',
    fcl: 'اختر نوع الحاوية والخط الملاحي وعدد الحاويات.',
  }[active || 'shipping'];

  // ---- States
  if (error) {
    return (
      <div dir="rtl" lang="ar" className="mx-auto max-w-xl px-4 py-16 text-center">
        <h1 className="text-xl font-bold text-zinc-900">تعذر تحميل الأسعار</h1>
        <p className="mt-2 text-base text-zinc-600">تحقق من اتصالك بالإنترنت ثم أعد المحاولة.</p>
        <button type="button" onClick={load} className="mt-6 inline-flex items-center gap-2 rounded-xl bg-green-700 px-5 py-3 font-bold text-white hover:bg-green-800 active:scale-[0.98]">
          <RefreshCw size={16} aria-hidden /> أعد المحاولة
        </button>
      </div>
    );
  }

  if (!pricing || !ready) {
    return (
      <div dir="rtl" className="w-full px-4 py-8 sm:px-6 lg:px-8" aria-busy="true" aria-label="جارٍ تحميل الأسعار">
        <div className="h-8 w-40 animate-pulse rounded-lg bg-zinc-300/60" />
        <div className="mt-6 grid gap-6 lg:grid-cols-12">
          <div className="h-96 animate-pulse rounded-2xl bg-zinc-300/50 lg:col-span-7 2xl:col-span-8" />
          <div className="h-80 animate-pulse rounded-2xl bg-zinc-300/50 lg:col-span-5 2xl:col-span-4" />
        </div>
      </div>
    );
  }

  if (!available.length) {
    return (
      <div dir="rtl" lang="ar" className="mx-auto max-w-xl px-4 py-16 text-center">
        <h1 className="text-xl font-bold text-zinc-900">{page.title}</h1>
        <p className="mt-2 text-base text-zinc-600">هذه الأسعار غير معروضة حالياً. تواصل مع المكتب وسنرسلها لك.</p>
      </div>
    );
  }

  const routes = shippingRoutes;
  const byMethod = [
    { method: 'air', title: 'شحن جوي', icon: <Plane size={18} aria-hidden />, list: routes.filter((r) => r.method === 'air') },
    { method: 'sea', title: 'شحن بحري', icon: <Ship size={18} aria-hidden />, list: routes.filter((r) => r.method === 'sea') },
  ].filter((g) => g.list.length);
  const generalNote = active === 'shipping' ? pricing.shipping?.note : active === 'fcl' ? pricing.fcl?.note : '';

  const pickService = (key: Service) => {
    setService(key);
    // From the dock: back to the top of the newly shown prices
    if (showDock) requestAnimationFrame(() => scrollTo(panelRef.current));
  };

  return (
    <div dir="rtl" lang="ar" className="prices-page w-full px-4 pb-32 pt-6 sm:px-6 lg:px-8 lg:pb-16 lg:pt-8">
      {/* Header */}
      <header className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold text-zinc-900 sm:text-3xl">{page.title}</h1>
          <p className="mt-1 max-w-[60ch] text-base leading-relaxed text-zinc-600 sm:text-lg">{page.sub}</p>
        </div>
        {pricing.exchangeRate && (
          <div className="rounded-xl bg-white px-4 py-2.5 shadow-sm">
            <p className="text-sm text-zinc-600">سعر صرف الدولار</p>
            <p className="flex items-baseline gap-1.5 text-xl font-bold text-zinc-900">
              <span className="text-base font-semibold text-zinc-600">1 دولار =</span>
              <span dir="ltr" className="tabular-nums">{plain(pricing.exchangeRate.rate)}</span>
              <span className="text-base font-semibold text-zinc-600">دينار</span>
            </p>
            <Updated at={pricing.exchangeRate.updatedAt} className="mt-0.5" />
          </div>
        )}
      </header>

      <div ref={tabsRef}>
        {available.length > 1 && (
          <nav className="prices-tabs -mx-4 mt-6 flex overflow-x-auto px-4 sm:mx-0 sm:px-0" aria-label="الخدمات">
            <div className="inline-flex w-max gap-1 rounded-2xl bg-white p-1 shadow-sm" role="tablist">
              {available.map((s) => (
                <button
                  key={s.key}
                  type="button"
                  role="tab"
                  aria-selected={s.key === active}
                  onClick={() => pickService(s.key)}
                  className={`flex items-center gap-2 whitespace-nowrap rounded-xl px-4 py-2.5 text-base font-bold transition-colors duration-200 focus:outline-none focus-visible:ring-2 focus-visible:ring-green-700 ${s.key === active ? 'bg-green-700 text-white' : 'text-zinc-600 hover:bg-zinc-100'}`}
                >
                  {s.icon}{s.label}
                </button>
              ))}
            </div>
          </nav>
        )}
      </div>

      <div className="mt-6 grid items-start gap-6 lg:grid-cols-12">
        {/* ---- Prices */}
        <section ref={panelRef} className="prices-panel min-w-0 scroll-mt-4 lg:col-span-7 2xl:col-span-8" key={active} role="tabpanel">
          {active === 'shipping' && pricing.shipping && (
            <div className="grid gap-8">
              <SpecialPricesCard prices={account?.specialPrices} />
              {byMethod.map((g) => (
                <div key={g.method}>
                  <h2 className="mb-3 flex items-center gap-2 text-xl font-bold text-zinc-900">
                    <span className="grid h-8 w-8 place-items-center rounded-lg bg-white text-green-700 shadow-sm">{g.icon}</span>{g.title}
                  </h2>
                  {/* items-start: a one-price card is not stretched to a three-kind card's height */}
                  <ul className="grid items-start gap-3 sm:grid-cols-2 2xl:grid-cols-3" aria-label={g.title}>
                    {g.list.map((r) => {
                      const on = r.key === route?.key;
                      return (
                        <li key={r.key} className={`route-card flex flex-col overflow-hidden rounded-2xl bg-white shadow-sm ring-1 transition-shadow duration-200 ${r.special ? 'route-card--special' : ''} ${on ? 'ring-2 ring-green-700' : 'ring-zinc-200 hover:ring-zinc-300'}`}>
                          {r.special && <span className="route-card__special"><Crown size={14} aria-hidden /> سعرك الخاص</span>}
                          <button
                            type="button"
                            aria-pressed={on}
                            aria-label={`${r.label}: احسب به في الحاسبة`}
                            onClick={() => selectRoute(r)}
                            className="flex flex-1 flex-col p-5 text-start focus:outline-none focus-visible:bg-green-50/50"
                          >
                            <span className="flex items-start justify-between gap-3">
                              <span className="flex items-center gap-3">
                                <span className="flag-frame"><Flag country={r.country} size={34} /></span>
                                <span>
                                  <span className="block text-xl font-extrabold leading-tight text-zinc-900">{r.countryLabel}</span>
                                  {r.duration && <span className="mt-1 inline-flex items-center gap-1 text-sm font-medium text-zinc-600"><Clock size={13} aria-hidden />{r.duration}</span>}
                                </span>
                              </span>
                              {on
                                ? <span className="inline-flex items-center gap-1 rounded-lg bg-green-700 px-2 py-1 text-xs font-bold text-white"><Check size={12} aria-hidden />في الحاسبة</span>
                                : <span className="route-card__hint rounded-lg bg-zinc-100 px-2 py-1 text-xs font-bold text-zinc-600">احسب به</span>}
                            </span>
                            {r.carrier && <span className="mt-4"><CarrierPill route={r} /></span>}
                            {r.categories.length > 1 ? (
                              <span className="mt-4 grid gap-2">
                                {r.categories.map((c) => (
                                  <span key={c.key} className="flex items-baseline justify-between gap-3 rounded-xl bg-zinc-50 px-3 py-2.5">
                                    <span className="text-base font-medium text-zinc-700">{c.label}</span>
                                    <span className="flex items-baseline gap-1 whitespace-nowrap">
                                      <span dir="ltr" className="text-xl font-extrabold tabular-nums text-zinc-900">{money(c.price)}</span>
                                      <span className="text-sm text-zinc-600">{perUnit(r)}</span>
                                    </span>
                                  </span>
                                ))}
                              </span>
                            ) : (
                              <span className="mt-auto flex flex-wrap items-baseline gap-x-1.5 gap-y-1 pt-4">
                                <span dir="ltr" className="text-3xl font-extrabold tabular-nums text-zinc-900">{money(r.price)}</span>
                                <span className="text-base text-zinc-600">{perUnit(r)}</span>
                                {/* What everyone else pays, when this customer's price is lower */}
                                {r.special && r.regularPrice && r.regularPrice > r.price && (
                                  <span className="route-card__was">بدل <s dir="ltr">{money(r.regularPrice)}</s></span>
                                )}
                              </span>
                            )}
                            {r.minCharge > 0 && <span className="mt-2 text-sm text-zinc-600">أقل تكلفة للشحنة <bdi dir="ltr" className="font-bold text-zinc-700">{money(r.minCharge)}</bdi></span>}
                          </button>
                          <div className="route-card__foot">
                            <Updated at={r.updatedAt} />
                            {r.note && <CardNote text={r.note} />}
                          </div>
                        </li>
                      );
                    })}
                  </ul>
                </div>
              ))}
            </div>
          )}

          {active === 'fcl' && pricing.fcl && (
            <div className="rounded-2xl bg-white p-5 shadow-sm sm:p-6">
              <SectionHead title="حاوية لك وحدك" sub="عروض الخطوط الملاحية من ميناء الشحن حتى ميناء الوصول في ليبيا." updatedAt={pricing.fcl.updatedAt} />
              <ul className="mt-5 grid items-start gap-3 sm:grid-cols-2 2xl:grid-cols-3" role="radiogroup" aria-label="عروض الحاويات">
                {allOffers.map(({ c, cheapest }) => {
                  const on = c.key === container?.key;
                  return (
                    <li key={c.key} className="contents">
                      <button
                        type="button"
                        role="radio"
                        aria-checked={on}
                        onClick={() => setContainerKey(c.key)}
                        className={`relative flex flex-col gap-3 rounded-2xl p-5 text-start ring-1 transition-shadow duration-200 focus:outline-none focus-visible:ring-2 focus-visible:ring-green-700 ${on ? 'bg-green-50/60 ring-2 ring-green-700' : 'bg-zinc-50 ring-zinc-200 hover:ring-zinc-300'}`}
                      >
                        <span className="flex items-start justify-between gap-2">
                          <span className="inline-flex items-center gap-1.5 rounded-lg bg-white px-2.5 py-1 text-base font-bold text-green-800 ring-1 ring-zinc-200">
                            <ContainerIcon size={15} aria-hidden />{c.label}
                          </span>
                          {cheapest && <span className="rounded-lg bg-amber-100 px-2 py-1 text-sm font-bold text-amber-900">الأرخص</span>}
                        </span>
                        <span className="grid gap-0.5">
                          <span className="text-base font-semibold text-zinc-600">الخط الملاحي</span>
                          {c.carrier
                            ? <CarrierName name={c.carrier} className="text-xl font-extrabold text-zinc-900" />
                            : <span className="text-xl font-extrabold text-zinc-900">شحن حاوية</span>}
                        </span>
                        <Ports c={c} />
                        <span className="flex items-baseline gap-1.5">
                          <span dir="ltr" className="text-3xl font-extrabold tabular-nums text-zinc-900">{money(c.price)}</span>
                          <span className="text-lg text-zinc-600">للحاوية</span>
                        </span>
                        <span className="flex flex-wrap items-center gap-x-3 gap-y-1 text-base text-zinc-600">
                          {c.duration && <span className="inline-flex items-center gap-1"><Clock size={14} aria-hidden />{c.duration}</span>}
                          <Updated at={c.updatedAt} />
                        </span>
                      </button>
                    </li>
                  );
                })}
              </ul>
            </div>
          )}

          {active === 'purchase' && pricing.purchase && (
            <div className="rounded-2xl bg-white p-5 shadow-sm sm:p-6">
              <SectionHead title="عمولة الشراء" sub="كلما زادت قيمة فاتورتك قلّت نسبة العمولة." updatedAt={pricing.purchase.updatedAt} />
              <div className="mt-5">
                <Ladder stacked tiers={pricing.purchase.tiers} active={activeStep(pricing.purchase.tiers, buyAmount)} range={(i) => bracketRange(pricing.purchase!.tiers, i, money)}>
                  {(t) => <CommissionPair t={t} of="من قيمة الفاتورة" />}
                </Ladder>
              </div>
              <dl className="mt-5 flex flex-wrap gap-2 text-base">
                {pricing.purchase.minCommission > 0 && (
                  <div className="flex gap-1.5 rounded-xl bg-zinc-50 px-3.5 py-2"><dt className="text-zinc-600">أقل عمولة</dt><dd dir="ltr" className="font-bold tabular-nums text-zinc-900">{money(pricing.purchase.minCommission)}</dd></div>
                )}
                {pricing.purchase.sites.filter((s) => s.feePercent > 0).map((s) => (
                  <div key={s.key} className="flex gap-1.5 rounded-xl bg-zinc-50 px-3.5 py-2"><dt className="text-zinc-600">رسوم {s.label}</dt><dd dir="ltr" className="font-bold tabular-nums text-zinc-900">{plain(s.feePercent)}%</dd></div>
                ))}
              </dl>
              <Note text={pricing.purchase.note} />
            </div>
          )}

          {active === 'alipay' && pricing.alipay && (
            <div className="rounded-2xl bg-white p-5 shadow-sm sm:p-6">
              <SectionHead title="حوالات علي باي" sub="السعر حسب المبلغ باليوان الذي يصل لمورّدك." updatedAt={pricing.alipay.updatedAt} />
              <div className="mt-5">
                <Ladder stacked tiers={pricing.alipay.tiers} active={activeStep(pricing.alipay.tiers, yuanAmount)} range={(i) => bracketRange(pricing.alipay!.tiers, i, yuan)}>
                  {(t) => (
                    <>
                      {/* The rate and the commission side by side, each named, so neither is guessed */}
                      <span className="tier-pair">
                        <span className="tier-pair__label">سعر الصرف</span>
                        <span className="tier-pair__value"><b dir="ltr">¥{plain(t.rate || 0, 4)}</b><small>لكل 1 دولار</small></span>
                      </span>
                      <span className="tier-pair tier-pair--fee">
                        <span className="tier-pair__label">العمولة</span>
                        {t.fee
                          ? <span className="tier-pair__value"><strong dir="ltr">{money(t.fee)}</strong><small>على الحوالة</small></span>
                          : <span className="tier-pair__value"><strong>بدون عمولة</strong></span>}
                      </span>
                    </>
                  )}
                </Ladder>
              </div>
              <Note text={pricing.alipay.note} />
            </div>
          )}

          {active === 'swift' && pricing.swift && (
            <div className="rounded-2xl bg-white p-5 shadow-sm sm:p-6">
              <SectionHead title="حوالات سويفت" sub="تحويل بنكي دولي بالدولار. العمولة حسب مبلغ الحوالة." updatedAt={pricing.swift.updatedAt} />
              <div className="mt-5">
                <Ladder stacked tiers={pricing.swift.tiers} active={activeStep(pricing.swift.tiers, swiftAmount)} range={(i) => bracketRange(pricing.swift!.tiers, i, money)}>
                  {(t) => <CommissionPair t={t} of="من مبلغ الحوالة" />}
                </Ladder>
              </div>
              {(pricing.swift.minFee > 0 || pricing.swift.fixedFee > 0) && (
                <dl className="mt-5 flex flex-wrap gap-2 text-base">
                  {pricing.swift.minFee > 0 && <div className="flex gap-1.5 rounded-xl bg-zinc-50 px-3.5 py-2"><dt className="text-zinc-600">أقل عمولة</dt><dd dir="ltr" className="font-bold tabular-nums text-zinc-900">{money(pricing.swift.minFee)}</dd></div>}
                  {pricing.swift.fixedFee > 0 && <div className="flex gap-1.5 rounded-xl bg-zinc-50 px-3.5 py-2"><dt className="text-zinc-600">رسوم بنكية ثابتة</dt><dd dir="ltr" className="font-bold tabular-nums text-zinc-900">{money(pricing.swift.fixedFee)}</dd></div>}
                </dl>
              )}
              <Note text={pricing.swift.note} />
            </div>
          )}
        </section>

        {/* ---- Calculator */}
        <aside ref={calcRef} id="prices-calculator" className="grid scroll-mt-4 gap-4 lg:sticky lg:top-6 lg:col-span-5 2xl:col-span-4" aria-label="الحاسبة">
          <div className="rounded-2xl bg-white p-5 shadow-sm sm:p-6">
            <h2 className="flex items-center gap-2 text-xl font-bold text-zinc-900"><Calculator size={19} className="text-green-700" aria-hidden />احسب التكلفة</h2>
            <div className="mt-4 grid gap-4">
              {active === 'shipping' && route && (
                <>
                  {/* The route is picked from its card; here it is only shown */}
                  <div className="calc-route">
                    <span className="flag-frame"><Flag country={route.country} size={30} /></span>
                    <span className="min-w-0 flex-1">
                      <span className="flex flex-wrap items-center gap-2 font-bold text-zinc-900">
                        {route.label}
                        {route.special && <span className="calc-special"><Crown size={12} aria-hidden /> سعرك الخاص</span>}
                      </span>
                      <span className="block text-sm text-zinc-600">
                        <bdi dir="ltr">{money(category?.price || route.price)}</bdi> {perUnit(route)}{route.duration ? `، ${route.duration}` : ''}
                      </span>
                      {route.carrier && (
                        <span className="mt-1 block text-sm text-zinc-600">
                          {route.method === 'sea' ? 'الخط الملاحي' : 'شركة الطيران'}: <CarrierName name={route.carrier} className="font-bold text-zinc-900" />
                        </span>
                      )}
                    </span>
                    <button type="button" onClick={() => scrollTo(panelRef.current)} className="shrink-0 rounded-lg px-2.5 py-1.5 text-sm font-bold text-green-700 hover:bg-green-50 focus:outline-none focus-visible:ring-2 focus-visible:ring-green-700 lg:hidden">
                      غيّر الخط
                    </button>
                  </div>
                  {route.categories.length > 1 && (
                    <Chips label="نوع البضاعة" items={route.categories} value={category?.key || ''} onChange={setCategoryKey} />
                  )}
                  <Field
                    id="calc-weight"
                    label={route.unit === 'kg' ? 'وزن الشحنة' : 'حجم الشحنة'}
                    unit={route.unit === 'kg' ? 'كجم' : 'CBM'}
                    value={weight}
                    onChange={setWeight}
                  />
                  <label className="flex cursor-pointer items-center gap-3 text-base font-semibold text-zinc-700">
                    <input type="checkbox" checked={useDims} onChange={(e) => setUseDims(e.target.checked)} className="h-5 w-5 rounded border-zinc-300 text-green-700 focus:ring-green-700" />
                    {route.unit === 'kg' ? 'أعرف مقاسات الكرتون (للوزن الحجمي)' : 'احسب الحجم من مقاسات الكرتون'}
                  </label>
                  {useDims && (
                    <div className="grid gap-3 rounded-xl bg-zinc-50 p-4">
                      <div className="grid grid-cols-3 gap-2">
                        <Field id="calc-l" label="الطول" unit="سم" value={dims.length} onChange={(v) => setDims({ ...dims, length: v })} />
                        <Field id="calc-w" label="العرض" unit="سم" value={dims.width} onChange={(v) => setDims({ ...dims, width: v })} />
                        <Field id="calc-h" label="الارتفاع" unit="سم" value={dims.height} onChange={(v) => setDims({ ...dims, height: v })} />
                      </div>
                      <Field id="calc-boxes" label="عدد الكراتين" unit="كرتون" value={dims.boxes} onChange={(v) => setDims({ ...dims, boxes: v })} />
                      {route.unit === 'kg' && <p className="text-sm leading-relaxed text-zinc-600">يُحسب الشحن الجوي على الأكبر: الوزن الفعلي أو الحجمي (الطول × العرض × الارتفاع ÷ {plain(pricing.shipping?.volumetricDivisor || 6000, 0)}).</p>}
                    </div>
                  )}
                </>
              )}

              {active === 'purchase' && pricing.purchase && (
                <>
                  {pricing.purchase.sites.length > 1 && <Chips label="الموقع" items={pricing.purchase.sites} value={siteKey} onChange={setSiteKey} />}
                  <Field id="calc-buy" label="قيمة المشتريات" unit="USD" value={buyAmount} onChange={setBuyAmount} />
                </>
              )}

              {active === 'alipay' && <Field id="calc-yuan" label="المبلغ الذي يصل للمورد" unit="¥ يوان" value={yuanAmount} onChange={setYuanAmount} />}

              {active === 'swift' && <Field id="calc-swift" label="مبلغ الحوالة" unit="USD" value={swiftAmount} onChange={setSwiftAmount} />}

              {active === 'fcl' && container && (
                <>
                  {offersByType.length > 1 && (
                    <Chips
                      label="نوع الحاوية"
                      items={offersByType.map((g) => ({ key: g.label, label: g.label }))}
                      value={container.label}
                      onChange={(label) => { const first = offersByType.find((g) => g.label === label)?.list[0]; if (first) setContainerKey(first.key); }}
                    />
                  )}
                  {typeOffers.length > 1 ? (
                    <div className="grid gap-1.5">
                      <span className="text-base font-semibold text-zinc-700">الخط الملاحي</span>
                      <div className="grid gap-2" role="radiogroup" aria-label="الخط الملاحي">
                        {typeOffers.map((c) => {
                          const on = c.key === container.key;
                          return (
                            <button
                              key={c.key}
                              type="button"
                              role="radio"
                              aria-checked={on}
                              onClick={() => setContainerKey(c.key)}
                              className={`flex items-center justify-between gap-3 rounded-xl border px-3.5 py-2.5 text-start transition-colors duration-200 focus:outline-none focus-visible:ring-2 focus-visible:ring-green-700 focus-visible:ring-offset-2 ${on ? 'border-green-700 bg-green-50' : 'border-zinc-200 bg-white hover:border-zinc-300'}`}
                            >
                              <span className="grid min-w-0 gap-1">
                                {c.carrier ? <CarrierName name={c.carrier} className="font-bold text-zinc-900" /> : <span className="font-bold text-zinc-900">{c.label}</span>}
                                <Ports c={c} size={15} />
                              </span>
                              <span dir="ltr" className="shrink-0 font-extrabold tabular-nums text-zinc-900">{money(c.price)}</span>
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  ) : (
                    <div className="calc-route">
                      <span className="grid h-9 w-9 shrink-0 place-items-center rounded-lg bg-white text-green-700 shadow-sm"><ContainerIcon size={18} aria-hidden /></span>
                      <span className="grid min-w-0 flex-1 gap-1">
                        <span className="font-bold text-zinc-900">{container.label}</span>
                        {container.carrier && <span className="text-sm text-zinc-600">الخط الملاحي: <CarrierName name={container.carrier} className="font-bold text-zinc-900" /></span>}
                        <Ports c={container} size={15} />
                      </span>
                    </div>
                  )}
                  <Field id="calc-fcl" label="عدد الحاويات" unit="حاوية" value={containerCount} onChange={setContainerCount} />
                </>
              )}

              {(active === 'fcl' || generalNote) && (
                <div className="grid gap-2 rounded-xl bg-amber-50 px-4 py-3 text-amber-900">
                  {active === 'fcl' && <p className="flex items-start gap-2 text-base font-bold leading-relaxed"><Info size={16} className="mt-0.5 shrink-0" aria-hidden />{FOB_NOTICE}</p>}
                  {generalNote && <p className="bidi-text whitespace-pre-line text-base leading-relaxed" dir="auto">{generalNote}</p>}
                </div>
              )}
            </div>
          </div>

          <QuoteTicket quote={quote} offices={pricing.offices} city={account?.city} customer={customer} emptyText={emptyText} notice={active === 'fcl' ? 'غير شاملة الجمارك في ليبيا (FOB).' : undefined} />
        </aside>
      </div>

      {/* ---- Mobile dock: the services and the calculator stay one tap away while scrolling */}
      <nav className={`prices-dock lg:hidden${showDock ? ' is-visible' : ''}`} aria-label="تنقل سريع" aria-hidden={!showDock}>
        <div className="prices-dock__bar">
          {available.length > 1 && available.map((s) => (
            <button
              key={s.key}
              type="button"
              tabIndex={showDock ? 0 : -1}
              onClick={() => pickService(s.key)}
              aria-current={s.key === active && !calcInView ? 'page' : undefined}
              className={`prices-dock__item${s.key === active && !calcInView ? ' is-active' : ''}`}
            >
              {s.icon}<span>{s.label}</span>
            </button>
          ))}
          <button
            type="button"
            tabIndex={showDock ? 0 : -1}
            onClick={() => scrollTo(calcRef.current)}
            className={`prices-dock__calc${calcInView ? ' is-active' : ''}`}
          >
            <Calculator size={18} aria-hidden />
            {quote
              ? <span dir="ltr" className="tabular-nums">{money(quote.total)}</span>
              : <span>الحاسبة</span>}
          </button>
        </div>
      </nav>
    </div>
  );
};

export default PricesPage;
