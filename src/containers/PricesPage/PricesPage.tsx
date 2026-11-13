import { ReactNode, useEffect, useMemo, useState } from 'react';
import { useSelector } from 'react-redux';
import { Banknote, Clock, Container as ContainerIcon, Landmark, Plane, RefreshCw, Ship, ShoppingBag } from 'lucide-react';
import api from '../../api';
import QuoteTicket from './QuoteTicket';
import {
  Pricing, Quote, ShippingRoute, Tier, alipayQuote, fclQuote, money, plain, purchaseQuote, shippingQuote, swiftQuote, toNumber,
} from './pricingMath';
import './pricesPage.css';

type Service = 'shipping' | 'purchase' | 'alipay' | 'swift' | 'fcl';
const SERVICES: { key: Service, label: string, icon: ReactNode }[] = [
  { key: 'shipping', label: 'الشحن', icon: <Plane size={17} aria-hidden /> },
  { key: 'purchase', label: 'الشراء', icon: <ShoppingBag size={17} aria-hidden /> },
  { key: 'alipay', label: 'علي باي', icon: <Banknote size={17} aria-hidden /> },
  { key: 'swift', label: 'سويفت', icon: <Landmark size={17} aria-hidden /> },
  { key: 'fcl', label: 'الحاويات', icon: <ContainerIcon size={17} aria-hidden /> },
];

// "up to 200", "over 200 up to 1,000", "over 7,000"
const bracketLabel = (tiers: Tier[], i: number, unit: (n: number) => string) => {
  const tier = tiers[i];
  const prev = i > 0 ? tiers[i - 1].upTo : null;
  if (tier.upTo === null) return prev === null ? 'أي مبلغ' : `أكثر من ${unit(prev)}`;
  if (prev === null) return `حتى ${unit(tier.upTo)}`;
  return `من ${unit(prev)} إلى ${unit(tier.upTo)}`;
};
const yuan = (n: number) => `${plain(n, 0)} ¥`;

const Field = ({ id, label, unit, value, onChange, hint, autoFocus }: {
  id: string, label: string, unit: string, value: string, onChange: (v: string) => void, hint?: string, autoFocus?: boolean,
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
        autoFocus={autoFocus}
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

const Choice = ({ selected, onClick, children }: { selected: boolean, onClick: () => void, children: ReactNode }) => (
  <button
    type="button"
    role="radio"
    aria-checked={selected}
    onClick={onClick}
    className={`rounded-xl border px-3 py-2.5 text-start text-sm font-semibold transition-colors duration-200 focus:outline-none focus-visible:ring-2 focus-visible:ring-green-700 focus-visible:ring-offset-2 ${selected ? 'border-green-700 bg-green-50 text-green-800' : 'border-zinc-200 bg-white text-zinc-700 hover:border-zinc-300'}`}
  >
    {children}
  </button>
);

const Note = ({ text }: { text?: string }) => (text ? <p className="bidi-text mt-4 rounded-xl bg-amber-50 px-4 py-3 text-sm leading-relaxed text-amber-900" dir="auto">{text}</p> : null);

const PanelTitle = ({ title, sub }: { title: string, sub?: string }) => (
  <div className="mb-4">
    <h2 className="text-lg font-bold text-zinc-900">{title}</h2>
    {sub && <p className="mt-0.5 text-sm text-zinc-500">{sub}</p>}
  </div>
);

const PricesPage = () => {
  const account = useSelector((state: any) => state.session.account);
  const [pricing, setPricing] = useState<Pricing | null>(null);
  const [error, setError] = useState(false);
  const [service, setService] = useState<Service | null>(null);

  // Calculator inputs, kept per service so switching tabs does not lose them
  const [routeKey, setRouteKey] = useState('');
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

  const available = useMemo(() => SERVICES.filter((s) => pricing?.[s.key]), [pricing]);
  const active = service && available.some((s) => s.key === service) ? service : available[0]?.key;
  const route = pricing?.shipping?.routes.find((r) => r.key === routeKey) || pricing?.shipping?.routes[0];
  const container = pricing?.fcl?.containers.find((c) => c.key === containerKey) || pricing?.fcl?.containers[0];

  const quote: Quote | null = useMemo(() => {
    if (!pricing || !active) return null;
    if (active === 'shipping' && route && pricing.shipping) {
      return shippingQuote(route, {
        amount: toNumber(weight),
        ...(useDims ? { length: toNumber(dims.length), width: toNumber(dims.width), height: toNumber(dims.height), boxes: toNumber(dims.boxes) || 1 } : {}),
      }, pricing.shipping.volumetricDivisor);
    }
    if (active === 'purchase' && pricing.purchase) return purchaseQuote(pricing.purchase, toNumber(buyAmount), siteKey);
    if (active === 'alipay' && pricing.alipay) return alipayQuote(pricing.alipay, toNumber(yuanAmount));
    if (active === 'swift' && pricing.swift) return swiftQuote(pricing.swift, toNumber(swiftAmount));
    if (active === 'fcl' && container) return fclQuote(container, toNumber(containerCount));
    return null;
  }, [pricing, active, route, weight, dims, useDims, buyAmount, siteKey, yuanAmount, swiftAmount, container, containerCount]);

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
      <div dir="rtl" className="mx-auto max-w-6xl px-4 py-8 sm:px-6" aria-busy="true" aria-label="جارٍ تحميل الأسعار">
        <div className="h-8 w-40 animate-pulse rounded-lg bg-zinc-200" />
        <div className="mt-6 flex gap-2">{[0, 1, 2, 3].map((i) => <div key={i} className="h-11 w-24 animate-pulse rounded-xl bg-zinc-200" />)}</div>
        <div className="mt-6 grid gap-6 lg:grid-cols-12">
          <div className="h-96 animate-pulse rounded-2xl bg-zinc-200/70 lg:col-span-7" />
          <div className="h-80 animate-pulse rounded-2xl bg-zinc-200/70 lg:col-span-5" />
        </div>
      </div>
    );
  }

  if (!available.length) {
    return (
      <div dir="rtl" className="mx-auto max-w-xl px-4 py-16 text-center">
        <h1 className="text-xl font-bold text-zinc-900">الأسعار غير معروضة حالياً</h1>
        <p className="mt-2 text-sm text-zinc-500">تواصل مع المكتب وسنرسل لك الأسعار المحدثة.</p>
      </div>
    );
  }

  return (
    <div dir="rtl" className="mx-auto max-w-6xl px-4 pb-16 pt-6 sm:px-6 lg:pt-10">
      {/* Header */}
      <header className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold text-zinc-900 sm:text-3xl">الأسعار</h1>
          <p className="mt-1 max-w-[52ch] text-sm leading-relaxed text-zinc-500 sm:text-base">اختر الخدمة واحسب التكلفة، ثم أرسلها للمكتب على واتساب بضغطة.</p>
        </div>
        {pricing.exchangeRate && (
          <div className="rounded-xl border border-zinc-200 bg-white px-4 py-2.5">
            <p className="text-xs text-zinc-500">سعر صرف الدولار</p>
            <p className="text-lg font-bold text-zinc-900"><span dir="ltr" className="tabular-nums">1$ = {plain(pricing.exchangeRate.rate)}</span> <span className="text-sm font-semibold text-zinc-500">د.ل</span></p>
          </div>
        )}
      </header>

      {/* Services */}
      <nav className="prices-tabs -mx-4 mt-6 overflow-x-auto px-4 sm:mx-0 sm:px-0" aria-label="الخدمات">
        <div className="flex w-max gap-2 sm:w-auto sm:flex-wrap" role="tablist">
          {available.map((s) => (
            <button
              key={s.key}
              type="button"
              role="tab"
              aria-selected={s.key === active}
              onClick={() => setService(s.key)}
              className={`flex items-center gap-2 whitespace-nowrap rounded-xl px-4 py-2.5 text-sm font-bold transition-colors duration-200 focus:outline-none focus-visible:ring-2 focus-visible:ring-green-700 focus-visible:ring-offset-2 ${s.key === active ? 'bg-green-700 text-white' : 'border border-zinc-200 bg-white text-zinc-700 hover:border-zinc-300'}`}
            >
              {s.icon}{s.label}
            </button>
          ))}
        </div>
      </nav>

      <div className="mt-6 grid items-start gap-6 lg:grid-cols-12">
        {/* ---- Prices */}
        <section className="prices-panel rounded-2xl border border-zinc-200 bg-white p-5 sm:p-6 lg:col-span-7" key={active} role="tabpanel">
          {active === 'shipping' && pricing.shipping && (
            <>
              <PanelTitle title="أسعار الشحن إلى ليبيا" sub="اضغط على الخط لتحسب تكلفته." />
              <ul className="grid gap-2" role="radiogroup" aria-label="خط الشحن">
                {pricing.shipping.routes.map((r: ShippingRoute) => {
                  const on = r.key === route?.key;
                  return (
                    <li key={r.key}>
                      <button
                        type="button"
                        role="radio"
                        aria-checked={on}
                        onClick={() => setRouteKey(r.key)}
                        className={`flex w-full items-center gap-3 rounded-xl border px-4 py-3.5 text-start transition-colors duration-200 focus:outline-none focus-visible:ring-2 focus-visible:ring-green-700 ${on ? 'border-green-700 bg-green-50/60' : 'border-zinc-200 hover:border-zinc-300 hover:bg-zinc-50'}`}
                      >
                        <span className={`grid h-10 w-10 shrink-0 place-items-center rounded-lg ${on ? 'bg-green-700 text-white' : 'bg-zinc-100 text-zinc-600'}`}>
                          {r.method === 'sea' ? <Ship size={19} aria-hidden /> : <Plane size={19} aria-hidden />}
                        </span>
                        <span className="min-w-0 flex-1">
                          <span className="block font-bold text-zinc-900">{r.countryLabel}</span>
                          <span className="mt-0.5 flex flex-wrap items-center gap-x-3 gap-y-0.5 text-xs text-zinc-500">
                            <span>{r.method === 'sea' ? 'بحري' : 'جوي'}</span>
                            {r.duration && <span className="inline-flex items-center gap-1"><Clock size={12} aria-hidden />{r.duration}</span>}
                          </span>
                        </span>
                        <span className="shrink-0 text-left">
                          <span dir="ltr" className="block text-xl font-extrabold tabular-nums text-zinc-900">{money(r.price)}</span>
                          <span className="block text-xs text-zinc-500">لكل {r.unit === 'kg' ? 'كجم' : 'متر مكعب'}</span>
                        </span>
                      </button>
                      {on && r.note && <p className="bidi-text px-4 pt-2 text-xs leading-relaxed text-zinc-500" dir="auto">{r.note}</p>}
                    </li>
                  );
                })}
              </ul>
              <Note text={pricing.shipping.note} />
            </>
          )}

          {active === 'purchase' && pricing.purchase && (
            <>
              <PanelTitle title="عمولة الشراء" sub="نشتري لك من المواقع والموردين. العمولة حسب قيمة الفاتورة." />
              <ol className="overflow-hidden rounded-xl border border-zinc-200">
                {pricing.purchase.tiers.map((t, i, all) => (
                  <li key={i} className="flex items-center justify-between gap-3 px-4 py-3 [&:not(:last-child)]:border-b [&:not(:last-child)]:border-zinc-100">
                    <span className="text-sm text-zinc-600">{bracketLabel(all, i, money)}</span>
                    <span className="font-bold text-zinc-900">
                      {t.type === 'fixed' ? <><span dir="ltr" className="tabular-nums">{money(t.value || 0)}</span> <span className="text-xs font-semibold text-zinc-500">ثابتة</span></> : <span dir="ltr" className="tabular-nums">{plain(t.value || 0)}%</span>}
                    </span>
                  </li>
                ))}
              </ol>
              {pricing.purchase.minCommission > 0 && <p className="mt-3 text-sm text-zinc-500">أقل عمولة <span dir="ltr" className="font-semibold tabular-nums text-zinc-700">{money(pricing.purchase.minCommission)}</span>.</p>}
              {pricing.purchase.sites.some((s) => s.feePercent > 0) && (
                <div className="mt-5">
                  <h3 className="text-sm font-bold text-zinc-800">رسوم يضيفها الموقع نفسه</h3>
                  <ul className="mt-2 flex flex-wrap gap-2">
                    {pricing.purchase.sites.filter((s) => s.feePercent > 0).map((s) => (
                      <li key={s.key} className="rounded-lg bg-zinc-100 px-3 py-1.5 text-sm text-zinc-700">{s.label} <span dir="ltr" className="font-bold tabular-nums">{plain(s.feePercent)}%</span></li>
                    ))}
                  </ul>
                </div>
              )}
              <Note text={pricing.purchase.note} />
            </>
          )}

          {active === 'alipay' && pricing.alipay && (
            <>
              <PanelTitle title="حوالات علي باي" sub="ندفع لمورّدك في الصين باليوان، وتدفع لنا بالدولار. السعر حسب مبلغ الحوالة." />
              <ol className="overflow-hidden rounded-xl border border-zinc-200">
                {pricing.alipay.tiers.map((t, i, all) => (
                  <li key={i} className="flex flex-wrap items-center justify-between gap-x-3 gap-y-1 px-4 py-3 [&:not(:last-child)]:border-b [&:not(:last-child)]:border-zinc-100">
                    <span className="text-sm text-zinc-600">{bracketLabel(all, i, yuan)}</span>
                    <span className="text-sm text-zinc-700">
                      <span dir="ltr" className="font-bold tabular-nums text-zinc-900">{plain(t.rate || 0, 4)} ¥</span> لكل دولار
                      {t.fee ? <> + <span dir="ltr" className="font-bold tabular-nums text-zinc-900">{money(t.fee)}</span> رسوم</> : null}
                    </span>
                  </li>
                ))}
              </ol>
              <Note text={pricing.alipay.note} />
            </>
          )}

          {active === 'swift' && pricing.swift && (
            <>
              <PanelTitle title="حوالات سويفت" sub="تحويل بنكي دولي بالدولار إلى حساب مورّدك." />
              <dl className="grid grid-cols-1 gap-3 sm:grid-cols-3">
                <div className="rounded-xl bg-zinc-50 px-4 py-4">
                  <dt className="text-xs text-zinc-500">العمولة</dt>
                  <dd dir="ltr" className="mt-1 text-right text-2xl font-extrabold tabular-nums text-zinc-900">{plain(pricing.swift.percent)}%</dd>
                </div>
                {pricing.swift.minFee > 0 && (
                  <div className="rounded-xl bg-zinc-50 px-4 py-4">
                    <dt className="text-xs text-zinc-500">أقل عمولة</dt>
                    <dd dir="ltr" className="mt-1 text-right text-2xl font-extrabold tabular-nums text-zinc-900">{money(pricing.swift.minFee)}</dd>
                  </div>
                )}
                {pricing.swift.fixedFee > 0 && (
                  <div className="rounded-xl bg-zinc-50 px-4 py-4">
                    <dt className="text-xs text-zinc-500">رسوم بنكية ثابتة</dt>
                    <dd dir="ltr" className="mt-1 text-right text-2xl font-extrabold tabular-nums text-zinc-900">{money(pricing.swift.fixedFee)}</dd>
                  </div>
                )}
              </dl>
              <Note text={pricing.swift.note} />
            </>
          )}

          {active === 'fcl' && pricing.fcl && (
            <>
              <PanelTitle title="شحن حاوية كاملة" sub="حاوية لك وحدك من الصين حتى ليبيا." />
              <ul className="grid gap-2" role="radiogroup" aria-label="نوع الحاوية">
                {pricing.fcl.containers.map((c) => {
                  const on = c.key === container?.key;
                  return (
                    <li key={c.key}>
                      <button
                        type="button"
                        role="radio"
                        aria-checked={on}
                        onClick={() => setContainerKey(c.key)}
                        className={`flex w-full items-center gap-3 rounded-xl border px-4 py-3.5 text-start transition-colors duration-200 focus:outline-none focus-visible:ring-2 focus-visible:ring-green-700 ${on ? 'border-green-700 bg-green-50/60' : 'border-zinc-200 hover:border-zinc-300 hover:bg-zinc-50'}`}
                      >
                        <span className={`grid h-10 w-10 shrink-0 place-items-center rounded-lg ${on ? 'bg-green-700 text-white' : 'bg-zinc-100 text-zinc-600'}`}><ContainerIcon size={19} aria-hidden /></span>
                        <span className="min-w-0 flex-1">
                          <span className="block font-bold text-zinc-900">{c.label}</span>
                          <span className="mt-0.5 flex flex-wrap items-center gap-x-3 text-xs text-zinc-500">
                            {c.route && <span>{c.route}</span>}
                            {c.duration && <span className="inline-flex items-center gap-1"><Clock size={12} aria-hidden />{c.duration}</span>}
                          </span>
                        </span>
                        <span dir="ltr" className="shrink-0 text-xl font-extrabold tabular-nums text-zinc-900">{money(c.price)}</span>
                      </button>
                    </li>
                  );
                })}
              </ul>
              <Note text={pricing.fcl.note} />
            </>
          )}
        </section>

        {/* ---- Calculator */}
        <aside className="grid gap-4 lg:sticky lg:top-6 lg:col-span-5" aria-label="الحاسبة">
          <div className="rounded-2xl border border-zinc-200 bg-white p-5 sm:p-6">
            <h2 className="text-lg font-bold text-zinc-900">احسب التكلفة</h2>
            <div className="mt-4 grid gap-4">
              {active === 'shipping' && route && (
                <>
                  <Field
                    id="calc-weight"
                    label={route.unit === 'kg' ? 'وزن الشحنة' : 'حجم الشحنة'}
                    unit={route.unit === 'kg' ? 'كجم' : 'CBM'}
                    value={weight}
                    onChange={setWeight}
                    hint={route.label}
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
                  {pricing.purchase.sites.length > 1 && (
                    <div className="grid gap-1.5">
                      <span className="text-sm font-semibold text-zinc-700">الموقع</span>
                      <div className="grid grid-cols-2 gap-2" role="radiogroup" aria-label="الموقع">
                        {pricing.purchase.sites.map((s) => <Choice key={s.key} selected={s.key === siteKey} onClick={() => setSiteKey(s.key)}>{s.label}</Choice>)}
                      </div>
                    </div>
                  )}
                  <Field id="calc-buy" label="قيمة المشتريات" unit="USD" value={buyAmount} onChange={setBuyAmount} />
                </>
              )}

              {active === 'alipay' && <Field id="calc-yuan" label="المبلغ الذي يصل للمورد" unit="¥ يوان" value={yuanAmount} onChange={setYuanAmount} />}

              {active === 'swift' && <Field id="calc-swift" label="مبلغ الحوالة" unit="USD" value={swiftAmount} onChange={setSwiftAmount} />}

              {active === 'fcl' && container && (
                <Field id="calc-fcl" label={`عدد الحاويات (${container.label})`} unit="حاوية" value={containerCount} onChange={setContainerCount} />
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
