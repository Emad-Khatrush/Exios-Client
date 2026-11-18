import { FormEvent, ReactNode, useEffect, useRef, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { useSelector } from 'react-redux';
import {
  ArrowLeft, ArrowRight, Ban, Calculator, Check, ChevronDown, Clock, Clock3, PackageCheck, PackagePlus, Plane, Plus, RotateCcw, Ship, Trash2,
} from 'lucide-react';
import api from '../../api';
import Flag from '../PricesPage/Flag';
import { money, ShippingRoute } from '../PricesPage/pricingMath';
import { cachedPricing, fetchPricing } from '../PricesPage/pricingCache';
import { COUNTRIES, CountryKey } from '../AddressPage/AddressPage';
import { BuyAndShip, ChinaAddress, ShippingMark, UaeAddress } from '../AddressPage/parts';
import { libyanCities } from '../../constants/info';
import { officeFor } from '../../constants/contact';
import { Method, warehouseCode } from '../../constants/warehouses';
import { useCopy } from '../../utils/useCopy';
import '../AddressPage/address.css';
import './startShipment.css';

// Where each country ships from: China both ways, the UAE by air, the rest only buy-and-ship
const METHODS: Record<CountryKey, Method[]> = { china: ['air', 'sea'], uae: ['air'], turkey: [], usa: [], uk: [] };
const METHOD_TEXT: Record<Method, { label: string, hint: string }> = {
  air: { label: 'شحن جوي', hint: 'الأسرع، للبضائع الخفيفة والمستعجلة' },
  sea: { label: 'شحن بحري', hint: 'الأوفر، للبضائع الثقيلة والكبيرة' },
};

type StepKey = 'setup' | 'address' | 'mark' | 'tracking' | 'done';
const STEP_LABEL: Record<StepKey, string> = {
  setup: 'تفاصيل الشحنة',
  address: 'العنوان',
  mark: 'علامة الشحن',
  tracking: 'رقم التتبع',
  done: 'تم',
};
type TrackingChoice = '' | 'now' | 'later';
type Saved = { step: StepKey, used: StepKey[], tracking: TrackingChoice, added: string[], country: CountryKey, method: Method, city: string };

// Where the customer stopped, kept on this device so leaving the page loses nothing
const storeKey = (id: string) => `start-shipment:${id}`;
const readSaved = (id: string): Partial<Saved> => {
  try { return JSON.parse(localStorage.getItem(storeKey(id)) || '{}'); } catch { return {}; }
};

const StartShipmentPage = () => {
  const account = useSelector((state: any) => state.session.account);
  const id = account?.customerId || '';
  const [params, setParams] = useSearchParams();
  const { copied, copy } = useCopy();
  const saved = useRef(readSaved(id)).current;

  const fromParam = params.get('shipmentFromWhere') as CountryKey | null;
  const accountCity = account?.city && libyanCities.some((c) => c.value === account.city) ? account.city : 'tripoli';
  const [country, setCountry] = useState<CountryKey>(fromParam && METHODS[fromParam] ? fromParam : (saved.country && METHODS[saved.country] ? saved.country : 'china'));
  const [method, setMethod] = useState<Method>(saved.method === 'sea' ? 'sea' : 'air');
  const [city, setCity] = useState<string>(saved.city || accountCity);
  const [step, setStep] = useState<StepKey>(fromParam ? 'setup' : (saved.step || 'setup'));
  const [used, setUsed] = useState<StepKey[]>(saved.used || []);
  const [tracking, setTracking] = useState<TrackingChoice>(saved.tracking || '');
  const [added, setAdded] = useState<string[]>(saved.added || []);
  const [routes, setRoutes] = useState<ShippingRoute[]>(() => cachedPricing()?.shipping?.routes || []);
  const top = useRef<HTMLDivElement>(null);

  useEffect(() => {
    fetchPricing(['shipping', 'fcl']).then((data) => setRoutes(data.shipping?.routes || [])).catch(() => undefined);
  }, []);

  useEffect(() => {
    if (METHODS[country].length && !METHODS[country].includes(method)) setMethod(METHODS[country][0]);
  }, [country, method]);

  useEffect(() => {
    try { localStorage.setItem(storeKey(id), JSON.stringify({ step, used, tracking, added, country, method, city })); } catch { /* private mode */ }
  }, [id, step, used, tracking, added, country, method, city]);

  const canShip = METHODS[country].length > 0;
  const steps: StepKey[] = country === 'china' ? ['setup', 'address', 'mark', 'tracking', 'done'] : ['setup', 'address', 'tracking', 'done'];
  const at = Math.max(0, steps.indexOf(step));
  const cityCode = libyanCities.find((c) => c.value === city)?.code || 'OT';
  const cityLabel = libyanCities.find((c) => c.value === city)?.label || '';
  const countryLabel = COUNTRIES.find((c) => c.key === country)?.label || '';
  const code = warehouseCode(method, id, cityCode);
  const routeFor = (m: Method) => routes.find((r) => r.country === country && r.method === m);
  const markUsed = (k: StepKey) => setUsed((u) => (u.includes(k) ? u : [...u, k]));

  const go = (next: StepKey) => {
    setStep(next);
    top.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };
  const next = () => go(steps[Math.min(at + 1, steps.length - 1)]);
  const back = () => go(steps[Math.max(at - 1, 0)]);
  const restart = () => { setUsed([]); setTracking(''); setAdded([]); setCity(accountCity); go('setup'); };

  const pickCountry = (key: CountryKey) => {
    setCountry(key);
    setParams({ shipmentFromWhere: key }, { replace: true });
  };

  // What the primary button says on each step, so the customer knows what it does
  const nextLabel: Partial<Record<StepKey, string>> = {
    setup: 'التالي: عنوان المخزن',
    address: country === 'china' ? 'أرسلت العنوان، التالي' : 'كتبت العنوان، التالي',
    mark: 'التالي: رقم التتبع',
    tracking: 'إنهاء',
  };
  const canGoOn = step !== 'tracking' || tracking === 'later' || (tracking === 'now' && added.length > 0);

  return (
    <div dir="rtl" lang="ar" className="ad-page ss-page page-enter w-full px-4 pb-16 pt-6 sm:px-6 lg:px-8 lg:pt-8">
      <div className="mx-auto max-w-4xl" ref={top}>
        <header>
          <h1 className="text-2xl font-extrabold text-zinc-900 sm:text-3xl">ابدأ الشحن</h1>
          <p className="mt-1 max-w-[62ch] text-base leading-relaxed text-zinc-600 sm:text-lg">
            خطوات قصيرة، كل خطوة تقول لك ماذا تفعل. في النهاية تكون شحنتك جاهزة للوصول لمخزننا باسمك.
          </p>
        </header>

        {/* Where the customer is */}
        {canShip && (
          <ol className="ss-stepper" aria-label="خطوات الشحن">
            {steps.map((s, i) => {
              const state = i < at ? 'is-past' : i === at ? 'is-current' : '';
              return (
                <li key={s} className={state}>
                  <button type="button" disabled={i > at} onClick={() => go(s)} aria-current={i === at ? 'step' : undefined}>
                    <span className="ss-stepper__dot">{i < at ? <Check size={15} aria-hidden /> : i + 1}</span>
                    <span className="ss-stepper__label">{STEP_LABEL[s]}</span>
                  </button>
                </li>
              );
            })}
          </ol>
        )}

        <section key={step} className="ss-panel" aria-live="polite">
          {step === 'setup' && (
            <>
              <StepHead n={1} title="تفاصيل الشحنة" text="من أين تشتري، وكيف تريد الشحن، وفي أي مدينة تستلم." />
              <div className="ss-q">
                <h3>من أين تشحن؟</h3>
                <div className="ad-countries ss-countries" role="radiogroup" aria-label="الدولة">
                  {COUNTRIES.map((c) => (
                    <button key={c.key} type="button" role="radio" aria-checked={country === c.key} className={`ad-country ${country === c.key ? 'is-active' : ''}`} onClick={() => pickCountry(c.key)}>
                      <span className="flag-frame"><Flag country={c.key} size={26} /></span>
                      <span className="ad-country__text"><b>{c.label}</b><small>{c.note}</small></span>
                    </button>
                  ))}
                </div>
              </div>

              {!canShip ? (
                <BuyAndShip countryLabel={countryLabel} office={officeFor(account?.city)} customerName={[account?.firstName, account?.lastName].filter(Boolean).join(' ')} customerId={id} />
              ) : (
                <>
                  <div className="ss-q">
                    <h3>طريقة الشحن</h3>
                    <div className="ss-methods" role="radiogroup" aria-label="طريقة الشحن">
                      {(['air', 'sea'] as Method[]).map((m) => {
                        const available = METHODS[country].includes(m);
                        const route = routeFor(m);
                        const Icon = m === 'air' ? Plane : Ship;
                        return (
                          <button key={m} type="button" role="radio" aria-checked={method === m} disabled={!available} className={`ss-method ${method === m ? 'is-active' : ''}`} onClick={() => setMethod(m)}>
                            <span className="ss-method__icon" aria-hidden><Icon size={24} /></span>
                            <span className="ss-method__text">
                              <b>{METHOD_TEXT[m].label}</b>
                              <small>{available ? METHOD_TEXT[m].hint : `غير متاح من ${countryLabel}`}</small>
                              {available && route && (
                                <span className="ss-method__facts">
                                  {route.duration && <span><Clock size={14} aria-hidden /> {route.duration}</span>}
                                  {!!route.price && <span>{money(route.price)} لكل {route.unit === 'cbm' ? 'متر مكعب' : 'كجم'}</span>}
                                </span>
                              )}
                            </span>
                            {method === m && available && <span className="ss-method__tick" aria-hidden><Check size={16} /></span>}
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  <div className="ss-q">
                    <h3>مدينة الاستلام في ليبيا</h3>
                    <span className="ad-select ss-city">
                      <select value={city} onChange={(e) => setCity(e.target.value)} aria-label="مدينة الاستلام">
                        {libyanCities.filter((c) => c.value !== 'other').map((c) => <option key={c.value} value={c.value}>{c.label}</option>)}
                      </select>
                      <ChevronDown size={17} aria-hidden />
                    </span>
                  </div>

                  <div className="ss-tips">
                    <Link to="/prohibited-items"><Ban size={17} aria-hidden /> تأكد أن بضاعتك ليست من الممنوعات</Link>
                    <Link to="/prices/shipping"><Calculator size={17} aria-hidden /> احسب تكلفة الشحن تقريباً</Link>
                  </div>
                </>
              )}
            </>
          )}

          {step === 'address' && (
            <>
              <StepHead
                n={2}
                title={country === 'china' ? 'أرسل عنوان المخزن للبائع' : 'اكتب عنوان المخزن عند الطلب'}
                text={country === 'china'
                  ? 'انسخ العنوان كاملاً وأرسله للبائع أو المصنع في الصين. كودك داخل العنوان، فلا تعدّل فيه شيئاً.'
                  : 'عند الطلب من موقع إماراتي، اكتب كل خانة في مكانها في صفحة الدفع.'}
              />
              {country === 'china'
                ? <ChinaAddress code={code} copied={copied} copy={copy} onUsed={() => markUsed('address')} />
                : <UaeAddress customerId={id} copied={copied} copy={copy} onUsed={() => markUsed('address')} />}
            </>
          )}

          {step === 'mark' && (
            <>
              <StepHead n={3} title="علامة الشحن" text="حمّل العلامة وأرسلها للبائع، واطلب منه طباعتها ولصقها على كل كرتونة. بها نعرف في المخزن أن الطرد لك." />
              <div className="ss-mark">
                <ShippingMark customerId={id} accountId={account?._id || ''} method={method} code={code} copied={copied} copy={copy} onUsed={() => markUsed('mark')} />
              </div>
            </>
          )}

          {step === 'tracking' && (
            <TrackingStep
              n={country === 'china' ? 4 : 3}
              method={method}
              choice={tracking}
              setChoice={setTracking}
              added={added}
              onAdded={(numbers) => setAdded((a) => [...a, ...numbers])}
              seller={country === 'china' ? 'البائع' : 'الموقع'}
              warehouse={country === 'china' ? 'الصين' : 'دبي'}
            />
          )}

          {step === 'done' && (
            <div className="ss-done">
              <span className="ss-done__icon" aria-hidden><PackageCheck size={34} /></span>
              <h2>شحنتك على الطريق</h2>
              <p>هذا ما أنجزته، وما سيحدث بعده:</p>
              <ul className="ss-recap">
                <li className="is-done"><Check size={18} aria-hidden /> اخترت {METHOD_TEXT[method].label} من {countryLabel} إلى {cityLabel}</li>
                <li className={used.includes('address') ? 'is-done' : ''}><Check size={18} aria-hidden /> {country === 'china' ? 'أرسلت عنوان المخزن للبائع' : 'كتبت عنوان المخزن في الموقع'}</li>
                {country === 'china' && <li className={used.includes('mark') ? 'is-done' : ''}><Check size={18} aria-hidden /> جهّزت علامة الشحن</li>}
                <li className={added.length ? 'is-done' : 'is-wait'}>
                  {added.length ? <Check size={18} aria-hidden /> : <Clock3 size={18} aria-hidden />}
                  {added.length ? `أضفت رقم التتبع (${added.join('، ')})` : 'رقم التتبع: أضفه عندما يرسله لك البائع'}
                  {!added.length && <Link to="/add-tracking-numbers">نبّهنا بطرد قادم</Link>}
                </li>
              </ul>
              <div className="ss-next-note">
                <b>بعد ذلك</b>
                <p>عندما يصل الطرد لمخزننا في {country === 'china' ? 'الصين' : 'دبي'} يظهر في «طلبياتي»، ومنها تتابع رحلته حتى يصل {cityLabel}.</p>
              </div>
              <div className="ad-actions ss-done__actions">
                <Link className="ad-btn ad-btn--primary" to="/orders">طلبياتي</Link>
                <button type="button" className="ad-btn ad-btn--ghost" onClick={restart}><RotateCcw size={17} aria-hidden /> ابدأ شحنة أخرى</button>
              </div>
            </div>
          )}

          {/* Back and next */}
          {canShip && step !== 'done' && (
            <div className="ss-nav">
              {at > 0
                ? <button type="button" className="ss-nav__back" onClick={back}><ArrowRight size={18} aria-hidden /> رجوع</button>
                : <span />}
              <button type="button" className="ad-btn ad-btn--primary ss-nav__next" onClick={next} disabled={!canGoOn}>
                {nextLabel[step]} <ArrowLeft size={18} aria-hidden />
              </button>
            </div>
          )}
          {step === 'tracking' && !canGoOn && <p className="ss-nav__hint">اختر أحد الخيارين للمتابعة.</p>}
        </section>
      </div>
    </div>
  );
};

const StepHead = ({ n, title, text }: { n: number, title: string, text: string }) => (
  <header className="ss-head">
    <span className="ss-head__n">الخطوة {n}</span>
    <h2>{title}</h2>
    <p>{text}</p>
  </header>
);

/* Tracking: add the numbers now, or come back when the seller sends them */
const TrackingStep = ({ n, method, choice, setChoice, added, onAdded, seller, warehouse }: {
  n: number, method: Method, choice: TrackingChoice, setChoice: (c: TrackingChoice) => void,
  added: string[], onAdded: (numbers: string[]) => void, seller: string, warehouse: string,
}) => {
  const [rows, setRows] = useState<string[]>(['']);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    const numbers = rows.map((r) => r.trim()).filter(Boolean);
    if (!numbers.length) { setError('اكتب رقم التتبع أولاً'); return; }
    setBusy(true); setError('');
    try {
      await api.createTrackingNumbers(numbers.map((trackingNumber) => ({ trackingNumber, method })));
      onAdded(numbers);
      setRows(['']);
    } catch {
      setError('تعذر حفظ رقم التتبع. تحقق من اتصالك ثم حاول مرة أخرى.');
    } finally {
      setBusy(false);
    }
  };

  // A plain function, not a component, so the buttons keep focus when picked
  const option = (value: TrackingChoice, icon: ReactNode, title: string, text: string) => (
    <button key={value} type="button" role="radio" aria-checked={choice === value} className={`ss-option ${choice === value ? 'is-active' : ''}`} onClick={() => setChoice(value)}>
      <span className="ss-option__icon" aria-hidden>{icon}</span>
      <span className="ss-option__text"><b>{title}</b><small>{text}</small></span>
      <span className="ss-option__radio" aria-hidden />
    </button>
  );

  return (
    <>
      <StepHead
        n={n}
        title="رقم التتبع"
        text={`عندما يشحن ${seller} طردك داخل ${warehouse === 'الصين' ? 'الصين' : 'الإمارات'}، يعطيك رقم تتبع من شركة الشحن. بهذا الرقم نتعرّف على طردك عند وصوله لمخزننا في ${warehouse}، حتى لو وصل بدون اسم.`}
      />
      <div className="ss-options" role="radiogroup" aria-label="رقم التتبع">
        {option('now', <PackagePlus size={22} />, 'عندي رقم التتبع', `${seller} أرسل لي الرقم، أضيفه الآن`)}
        {option('later', <Clock3 size={22} />, 'سأضيفه لاحقاً', `${seller} لم يشحن بعد، سأضيف الرقم عندما يرسله لي`)}
      </div>

      {choice === 'now' && (
        <form className="ss-track" onSubmit={submit} noValidate>
          {!!added.length && (
            <ul className="ss-track__added">
              {added.map((t) => <li key={t}><Check size={16} aria-hidden /> <bdi dir="ltr">{t}</bdi> أُضيف</li>)}
            </ul>
          )}
          {rows.map((value, i) => (
            <div key={i} className="ss-track__row">
              <input
                value={value}
                onChange={(e) => setRows(rows.map((r, j) => (j === i ? e.target.value : r)))}
                placeholder="مثال: SF1234567890123"
                dir="ltr"
                aria-label={`رقم التتبع ${i + 1}`}
              />
              {rows.length > 1 && (
                <button type="button" className="ss-track__remove" aria-label="حذف هذا الرقم" onClick={() => setRows(rows.filter((_, j) => j !== i))}><Trash2 size={17} /></button>
              )}
            </div>
          ))}
          <div className="ss-track__bar">
            <button type="button" className="ss-track__more" onClick={() => setRows([...rows, ''])}><Plus size={16} aria-hidden /> رقم آخر</button>
            <button type="submit" className="ad-btn ad-btn--primary" disabled={busy}>{busy ? 'جارٍ الحفظ…' : 'حفظ رقم التتبع'}</button>
          </div>
          {error && <p className="fb-error ss-error" role="alert">{error}</p>}
          <p className="ad-hint">يُحفظ على طريقة الشحن «{method === 'air' ? 'جوي' : 'بحري'}». لكل كرتونة أو طرد رقم مختلف؟ أضف كل الأرقام.</p>
        </form>
      )}

      {choice === 'later' && (
        <div className="ss-later">
          <Clock3 size={20} aria-hidden />
          <p>لا مشكلة. عندما يرسل لك {seller} رقم التتبع، نبّهنا به من صفحة <Link to="/add-tracking-numbers">نبّهنا بطرد قادم</Link>، أو ارجع لهذه الخطوة.</p>
        </div>
      )}
    </>
  );
};

export default StartShipmentPage;
