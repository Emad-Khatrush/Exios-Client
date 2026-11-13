import { ReactNode, useEffect, useMemo, useState } from 'react';
import { useSelector } from 'react-redux';
import { Banknote, Clock, Container as ContainerIcon, Landmark, Plane, RefreshCw, Ship } from 'lucide-react';
import api from '../../api';
import QuoteTicket from './QuoteTicket';
import {
  Pricing, Quote, ShippingRoute, Tier, alipayQuote, fclQuote, ltr, money, plain, purchaseQuote, shippingQuote, swiftQuote, tierFor, toNumber,
} from './pricingMath';
import './pricesPage.css';

type Service = 'shipping' | 'fcl' | 'purchase' | 'alipay' | 'swift';
export type PriceGroup = 'shipping' | 'purchase' | 'transfers';

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
    services: [{ key: 'purchase', label: 'الشراء', icon: null }],
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

// "up to 200", "200 to 1,000", "over 7,000"
const bracketRange = (tiers: Tier[], i: number, unit: (n: number) => string) => {
  const tier = tiers[i];
  const prev = i > 0 ? tiers[i - 1].upTo : null;
  if (tier.upTo === null) return prev === null ? 'أي مبلغ' : `أكثر من ${ltr(unit(prev))}`;
  if (prev === null) return `حتى ${ltr(unit(tier.upTo))}`;
  return ltr(`${unit(prev)} - ${unit(tier.upTo)}`);
};
const yuan = (n: number) => `¥${plain(n, 0)}`;
const perUnit = (r: ShippingRoute) => (r.unit === 'kg' ? 'كجم' : 'CBM');

const Field = ({ id, label, unit, value, onChange, hint }: {
  id: string, label: string, unit: string, value: string, onChange: (v: string) => void, hint?: string,
}) => (
  <div className="grid gap-1.5">
    <label htmlFor={id} className="text-sm font-semibold text-zinc-700">{label}</label>
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
        className="!rounded-xl !border-zinc-300 !bg-white !py-3 !pl-16 !pr-4 text-right text-lg font-bold tabular-nums !text-zinc-900 !shadow-none placeholder:font-normal placeholder:text-zinc-300 focus:!border-green-700 focus:!ring-2 focus:!ring-green-700/20"
      />
      {/* Above the input: the app's base input style raises a focused input's z-index */}
      <span className="pointer-events-none absolute inset-y-0 left-3 z-20 flex items-center text-sm font-semibold text-zinc-500">{unit}</span>
    </div>
    {hint && <p className="text-xs text-zinc-500">{hint}</p>}
  </div>
);

const Chips = ({ label, items, value, onChange }: { label: string, items: { key: string, label: string }[], value: string, onChange: (k: string) => void }) => (
  <div className="grid gap-1.5">
    <span className="text-sm font-semibold text-zinc-700">{label}</span>
    <div className="flex flex-wrap gap-2" role="radiogroup" aria-label={label}>
      {items.map((item) => (
        <button
          key={item.key}
          type="button"
          role="radio"
          aria-checked={item.key === value}
          onClick={() => onChange(item.key)}
          className={`rounded-xl border px-3.5 py-2 text-sm font-semibold transition-colors duration-200 focus:outline-none focus-visible:ring-2 focus-visible:ring-green-700 focus-visible:ring-offset-2 ${item.key === value ? 'border-green-700 bg-green-50 text-green-800' : 'border-zinc-200 bg-white text-zinc-700 hover:border-zinc-300'}`}
        >
          {item.label}
        </button>
      ))}
    </div>
  </div>
);

const Note = ({ text }: { text?: string }) => (text ? <p className="bidi-text mt-5 rounded-xl bg-amber-50 px-4 py-3 text-sm leading-relaxed text-amber-900" dir="auto">{text}</p> : null);

// Brackets as steps from small to large amounts; the step the customer's amount falls in lights up
const Ladder = ({ tiers, active, range, children }: {
  tiers: Tier[], active: number, range: (i: number) => string, children: (t: Tier, i: number) => ReactNode,
}) => (
  <ol className="tier-ladder" style={{ ['--n' as any]: Math.min(tiers.length, 5) }}>
    {tiers.map((t, i) => (
      <li key={i} className={`tier-step${i === active ? ' is-active' : ''}`} aria-current={i === active ? 'step' : undefined}>
        <span className="tier-step__range" dir="rtl">{range(i)}</span>
        <div className="tier-step__value">{children(t, i)}</div>
        {i === active && <span className="tier-step__here">مبلغك هنا</span>}
      </li>
    ))}
  </ol>
);

const PricesPage = ({ group = 'shipping' }: { group?: PriceGroup }) => {
  const account = useSelector((state: any) => state.session.account);
  const [pricing, setPricing] = useState<Pricing | null>(null);
  const [error, setError] = useState(false);
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

  const load = async () => {
    setError(false);
    try {
      const res = await api.getPricing();
      const data: Pricing = res.data;
      setPricing(data);
      setRouteKey((k) => k || data.shipping?.routes[0]?.key || '');
      setSiteKey((k) => k || data.purchase?.sites[0]?.key || '');
      setContainerKey((k) => k || data.fcl?.containers[0]?.key || '');
    } catch (e) {
      setError(true);
    }
  };
  useEffect(() => { void load(); }, []);
  useEffect(() => { setService(null); }, [group]);

  const page = GROUPS[group] || GROUPS.shipping;
  const available = useMemo(() => page.services.filter((s) => pricing?.[s.key]), [pricing, page]);
  const active = service && available.some((s) => s.key === service) ? service : available[0]?.key;
  const route = pricing?.shipping?.routes.find((r) => r.key === routeKey) || pricing?.shipping?.routes[0];
  const category = route?.categories.find((c) => c.key === categoryKey) || route?.categories[0];
  const container = pricing?.fcl?.containers.find((c) => c.key === containerKey) || pricing?.fcl?.containers[0];

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
    fcl: 'اختر نوع الحاوية وعددها.',
  }[active || 'shipping'];

  // ---- States
  if (error) {
    return (
      <div dir="rtl" className="mx-auto max-w-xl px-4 py-16 text-center">
        <h1 className="text-xl font-bold text-zinc-900">تعذر تحميل الأسعار</h1>
        <p className="mt-2 text-sm text-zinc-500">تحقق من اتصالك بالإنترنت ثم أعد المحاولة.</p>
        <button type="button" onClick={load} className="mt-6 inline-flex items-center gap-2 rounded-xl bg-green-700 px-5 py-3 font-bold text-white hover:bg-green-800 active:scale-[0.98]">
          <RefreshCw size={16} aria-hidden /> أعد المحاولة
        </button>
      </div>
    );
  }

  if (!pricing) {
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
      <div dir="rtl" className="mx-auto max-w-xl px-4 py-16 text-center">
        <h1 className="text-xl font-bold text-zinc-900">{page.title}</h1>
        <p className="mt-2 text-sm text-zinc-500">هذه الأسعار غير معروضة حالياً. تواصل مع المكتب وسنرسلها لك.</p>
      </div>
    );
  }

  const routes = pricing.shipping?.routes || [];
  const byMethod = [
    { method: 'air', title: 'شحن جوي', icon: <Plane size={18} aria-hidden />, list: routes.filter((r) => r.method === 'air') },
    { method: 'sea', title: 'شحن بحري', icon: <Ship size={18} aria-hidden />, list: routes.filter((r) => r.method === 'sea') },
  ].filter((g) => g.list.length);

  return (
    <div dir="rtl" className="w-full px-4 pb-16 pt-6 sm:px-6 lg:px-8 lg:pt-8">
      {/* Header */}
      <header className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold text-zinc-900 sm:text-3xl">{page.title}</h1>
          <p className="mt-1 max-w-[60ch] text-sm leading-relaxed text-zinc-600 sm:text-base">{page.sub}</p>
        </div>
        {pricing.exchangeRate && (
          <div className="rounded-xl bg-white px-4 py-2.5 shadow-sm">
            <p className="text-xs text-zinc-500">سعر صرف الدولار</p>
            <p className="text-lg font-bold text-zinc-900"><span dir="ltr" className="tabular-nums">1$ = {plain(pricing.exchangeRate.rate)}</span> <span className="text-sm font-semibold text-zinc-500">د.ل</span></p>
          </div>
        )}
      </header>

      {available.length > 1 && (
        <nav className="prices-tabs -mx-4 mt-6 flex overflow-x-auto px-4 sm:mx-0 sm:px-0" aria-label="الخدمات">
          <div className="inline-flex w-max gap-1 rounded-2xl bg-white p-1 shadow-sm" role="tablist">
            {available.map((s) => (
              <button
                key={s.key}
                type="button"
                role="tab"
                aria-selected={s.key === active}
                onClick={() => setService(s.key)}
                className={`flex items-center gap-2 whitespace-nowrap rounded-xl px-4 py-2.5 text-sm font-bold transition-colors duration-200 focus:outline-none focus-visible:ring-2 focus-visible:ring-green-700 ${s.key === active ? 'bg-green-700 text-white' : 'text-zinc-600 hover:bg-zinc-100'}`}
              >
                {s.icon}{s.label}
              </button>
            ))}
          </div>
        </nav>
      )}

      <div className="mt-6 grid items-start gap-6 lg:grid-cols-12">
        {/* ---- Prices */}
        <section className="prices-panel min-w-0 lg:col-span-7 2xl:col-span-8" key={active} role="tabpanel">
          {active === 'shipping' && pricing.shipping && (
            <div className="grid gap-8">
              {byMethod.map((g) => (
                <div key={g.method}>
                  <h2 className="mb-3 flex items-center gap-2 text-lg font-bold text-zinc-900">
                    <span className="grid h-8 w-8 place-items-center rounded-lg bg-white text-green-700 shadow-sm">{g.icon}</span>{g.title}
                  </h2>
                  <ul className="grid gap-3 sm:grid-cols-2 2xl:grid-cols-3" role="radiogroup" aria-label={g.title}>
                    {g.list.map((r) => {
                      const on = r.key === route?.key;
                      return (
                        <li key={r.key} className="contents">
                          <button
                            type="button"
                            role="radio"
                            aria-checked={on}
                            onClick={() => selectRoute(r)}
                            className={`route-card flex flex-col rounded-2xl bg-white p-5 text-start shadow-sm ring-1 transition-all duration-200 focus:outline-none focus-visible:ring-2 focus-visible:ring-green-700 ${on ? 'ring-2 ring-green-700' : 'ring-zinc-200 hover:ring-zinc-300'}`}
                          >
                            <span className="flex items-start justify-between gap-3">
                              <span>
                                <span className="block text-lg font-extrabold text-zinc-900">{r.countryLabel}</span>
                                {r.duration && <span className="mt-1 inline-flex items-center gap-1 text-xs font-medium text-zinc-500"><Clock size={13} aria-hidden />{r.duration}</span>}
                              </span>
                              {on && <span className="rounded-lg bg-green-700 px-2 py-1 text-[11px] font-bold text-white">في الحاسبة</span>}
                            </span>
                            {r.categories.length > 1 ? (
                              <span className="mt-4 grid gap-2">
                                {r.categories.map((c) => (
                                  <span key={c.key} className="flex items-baseline justify-between gap-3 rounded-xl bg-zinc-50 px-3 py-2.5">
                                    <span className="text-sm font-medium text-zinc-700">{c.label}</span>
                                    <span className="whitespace-nowrap"><span dir="ltr" className="text-lg font-extrabold tabular-nums text-zinc-900">{money(c.price)}</span> <span className="text-xs text-zinc-500">/ {perUnit(r)}</span></span>
                                  </span>
                                ))}
                              </span>
                            ) : (
                              <span className="mt-auto block pt-4">
                                <span dir="ltr" className="text-3xl font-extrabold tabular-nums text-zinc-900">{money(r.price)}</span>
                                <span className="mr-1 text-sm text-zinc-500">لكل {r.unit === 'kg' ? 'كيلو' : 'متر مكعب'}</span>
                              </span>
                            )}
                          </button>
                        </li>
                      );
                    })}
                  </ul>
                </div>
              ))}
              {route?.note && (
                <div className="rounded-2xl bg-white p-5 shadow-sm">
                  <h3 className="text-sm font-bold text-zinc-900">ملاحظات {route.label}</h3>
                  <p className="bidi-text mt-2 text-sm leading-relaxed text-zinc-600" dir="auto">{route.note}</p>
                </div>
              )}
              <Note text={pricing.shipping.note} />
            </div>
          )}

          {active === 'fcl' && pricing.fcl && (
            <div className="rounded-2xl bg-white p-5 shadow-sm sm:p-6">
              <h2 className="text-lg font-bold text-zinc-900">حاوية لك وحدك</h2>
              <p className="mt-0.5 text-sm text-zinc-500">من الصين حتى ليبيا، مناسبة للكميات الكبيرة.</p>
              <ul className="mt-5 grid gap-3 sm:grid-cols-2 2xl:grid-cols-3" role="radiogroup" aria-label="نوع الحاوية">
                {pricing.fcl.containers.map((c) => {
                  const on = c.key === container?.key;
                  return (
                    <li key={c.key} className="contents">
                      <button
                        type="button"
                        role="radio"
                        aria-checked={on}
                        onClick={() => setContainerKey(c.key)}
                        className={`flex flex-col rounded-2xl p-5 text-start ring-1 transition-all duration-200 focus:outline-none focus-visible:ring-2 focus-visible:ring-green-700 ${on ? 'bg-green-50/60 ring-2 ring-green-700' : 'bg-zinc-50 ring-zinc-200 hover:ring-zinc-300'}`}
                      >
                        <span className="font-bold text-zinc-900">{c.label}</span>
                        <span dir="ltr" className="mt-3 text-right text-3xl font-extrabold tabular-nums text-zinc-900">{money(c.price)}</span>
                        <span className="mt-2 grid gap-0.5 text-xs text-zinc-500">
                          {c.route && <span>{c.route}</span>}
                          {c.duration && <span className="inline-flex items-center gap-1"><Clock size={12} aria-hidden />{c.duration}</span>}
                        </span>
                      </button>
                    </li>
                  );
                })}
              </ul>
              <Note text={pricing.fcl.note} />
            </div>
          )}

          {active === 'purchase' && pricing.purchase && (
            <div className="rounded-2xl bg-white p-5 shadow-sm sm:p-6">
              <h2 className="text-lg font-bold text-zinc-900">عمولة الشراء</h2>
              <p className="mt-0.5 text-sm text-zinc-500">كلما زادت قيمة فاتورتك قلّت نسبة العمولة.</p>
              <div className="mt-5">
                <Ladder tiers={pricing.purchase.tiers} active={activeStep(pricing.purchase.tiers, buyAmount)} range={(i) => bracketRange(pricing.purchase!.tiers, i, money)}>
                  {(t) => (t.type === 'fixed'
                    ? <><b dir="ltr">{money(t.value || 0)}</b><small>عمولة ثابتة</small></>
                    : <><b dir="ltr">{plain(t.value || 0)}%</b><small>من الفاتورة</small></>)}
                </Ladder>
              </div>
              <dl className="mt-5 flex flex-wrap gap-2 text-sm">
                {pricing.purchase.minCommission > 0 && (
                  <div className="rounded-xl bg-zinc-50 px-3.5 py-2"><dt className="inline text-zinc-500">أقل عمولة </dt><dd dir="ltr" className="inline font-bold tabular-nums text-zinc-900">{money(pricing.purchase.minCommission)}</dd></div>
                )}
                {pricing.purchase.sites.filter((s) => s.feePercent > 0).map((s) => (
                  <div key={s.key} className="rounded-xl bg-zinc-50 px-3.5 py-2"><dt className="inline text-zinc-500">رسوم {s.label} </dt><dd dir="ltr" className="inline font-bold tabular-nums text-zinc-900">{plain(s.feePercent)}%</dd></div>
                ))}
              </dl>
              <Note text={pricing.purchase.note} />
            </div>
          )}

          {active === 'alipay' && pricing.alipay && (
            <div className="rounded-2xl bg-white p-5 shadow-sm sm:p-6">
              <h2 className="text-lg font-bold text-zinc-900">حوالات علي باي</h2>
              <p className="mt-0.5 text-sm text-zinc-500">السعر حسب المبلغ باليوان الذي يصل لمورّدك.</p>
              <div className="mt-5">
                <Ladder tiers={pricing.alipay.tiers} active={activeStep(pricing.alipay.tiers, yuanAmount)} range={(i) => bracketRange(pricing.alipay!.tiers, i, yuan)}>
                  {(t) => <><b dir="ltr">¥{plain(t.rate || 0, 4)}</b><small>لكل دولار{t.fee ? ` + ${money(t.fee)} رسوم` : ''}</small></>}
                </Ladder>
              </div>
              <Note text={pricing.alipay.note} />
            </div>
          )}

          {active === 'swift' && pricing.swift && (
            <div className="rounded-2xl bg-white p-5 shadow-sm sm:p-6">
              <h2 className="text-lg font-bold text-zinc-900">حوالات سويفت</h2>
              <p className="mt-0.5 text-sm text-zinc-500">تحويل بنكي دولي بالدولار. العمولة حسب مبلغ الحوالة.</p>
              <div className="mt-5">
                <Ladder tiers={pricing.swift.tiers} active={activeStep(pricing.swift.tiers, swiftAmount)} range={(i) => bracketRange(pricing.swift!.tiers, i, money)}>
                  {(t) => (t.type === 'fixed'
                    ? <><b dir="ltr">{money(t.value || 0)}</b><small>عمولة ثابتة</small></>
                    : <><b dir="ltr">{plain(t.value || 0)}%</b><small>من المبلغ</small></>)}
                </Ladder>
              </div>
              {(pricing.swift.minFee > 0 || pricing.swift.fixedFee > 0) && (
                <dl className="mt-5 flex flex-wrap gap-2 text-sm">
                  {pricing.swift.minFee > 0 && <div className="rounded-xl bg-zinc-50 px-3.5 py-2"><dt className="inline text-zinc-500">أقل عمولة </dt><dd dir="ltr" className="inline font-bold tabular-nums text-zinc-900">{money(pricing.swift.minFee)}</dd></div>}
                  {pricing.swift.fixedFee > 0 && <div className="rounded-xl bg-zinc-50 px-3.5 py-2"><dt className="inline text-zinc-500">رسوم بنكية ثابتة </dt><dd dir="ltr" className="inline font-bold tabular-nums text-zinc-900">{money(pricing.swift.fixedFee)}</dd></div>}
                </dl>
              )}
              <Note text={pricing.swift.note} />
            </div>
          )}
        </section>

        {/* ---- Calculator */}
        <aside className="grid gap-4 lg:sticky lg:top-6 lg:col-span-5 2xl:col-span-4" aria-label="الحاسبة">
          <div className="rounded-2xl bg-white p-5 shadow-sm sm:p-6">
            <h2 className="text-lg font-bold text-zinc-900">احسب التكلفة</h2>
            <div className="mt-4 grid gap-4">
              {active === 'shipping' && route && (
                <>
                  <Chips label="خط الشحن" items={routes.map((r) => ({ key: r.key, label: r.label }))} value={route.key} onChange={(k) => { const r = routes.find((x) => x.key === k); if (r) selectRoute(r); }} />
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
                  <label className="flex cursor-pointer items-center gap-3 text-sm font-semibold text-zinc-700">
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
                      {route.unit === 'kg' && <p className="text-xs leading-relaxed text-zinc-500">يُحسب الشحن الجوي على الأكبر: الوزن الفعلي أو الحجمي (الطول × العرض × الارتفاع ÷ {plain(pricing.shipping?.volumetricDivisor || 6000, 0)}).</p>}
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
                  <Chips label="نوع الحاوية" items={pricing.fcl?.containers || []} value={container.key} onChange={setContainerKey} />
                  <Field id="calc-fcl" label="عدد الحاويات" unit="حاوية" value={containerCount} onChange={setContainerCount} />
                </>
              )}
            </div>
          </div>

          <QuoteTicket quote={quote} offices={pricing.offices} city={account?.city} customer={customer} emptyText={emptyText} />
        </aside>
      </div>
    </div>
  );
};

export default PricesPage;
