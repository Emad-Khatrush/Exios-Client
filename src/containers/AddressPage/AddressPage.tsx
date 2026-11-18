import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useSelector } from 'react-redux';
import { ChevronDown, Plane, Ship } from 'lucide-react';
import Flag from '../PricesPage/Flag';
import { libyanCities } from '../../constants/info';
import { officeFor } from '../../constants/contact';
import { Method, warehouseCode } from '../../constants/warehouses';
import { useCopy } from '../../utils/useCopy';
import { BuyAndShip, ChinaAddress, CopyBtn, ShippingMark, UaeAddress } from './parts';
import './address.css';

export type CountryKey = 'china' | 'uae' | 'usa' | 'turkey' | 'uk';

export const COUNTRIES: { key: CountryKey, label: string, note: string }[] = [
  { key: 'china', label: 'الصين', note: 'جوي وبحري' },
  { key: 'uae', label: 'الإمارات', note: 'جوي' },
  { key: 'turkey', label: 'تركيا', note: 'شراء وشحن' },
  { key: 'usa', label: 'أمريكا', note: 'شراء وشحن' },
  { key: 'uk', label: 'بريطانيا', note: 'شراء وشحن' },
];

const AddressPage = () => {
  const account = useSelector((state: any) => state.session.account);
  const { copied, copy } = useCopy();
  const [country, setCountry] = useState<CountryKey>('china');
  const [method, setMethod] = useState<Method>('air');
  const [city, setCity] = useState<string>(account?.city && libyanCities.some((c) => c.value === account.city) ? account.city : 'tripoli');

  const id = account?.customerId || '';
  const cityCode = libyanCities.find((c) => c.value === city)?.code || 'OT';
  const cityLabel = libyanCities.find((c) => c.value === city)?.label || '';
  const code = warehouseCode(method, id, cityCode);
  const current = COUNTRIES.find((c) => c.key === country)!;

  return (
    <div dir="rtl" lang="ar" className="ad-page page-enter w-full px-4 pb-16 pt-6 sm:px-6 lg:px-8 lg:pt-8">
      <div className="mx-auto max-w-6xl">
        <header>
          <h1 className="text-2xl font-extrabold text-zinc-900 sm:text-3xl">عناويننا</h1>
          <p className="mt-1 max-w-[60ch] text-base leading-relaxed text-zinc-600 sm:text-lg">
            انسخ عنوان المخزن وأرسله للبائع. العنوان يحمل كودك، فيصل الطرد باسمك ونسجّله في طلبياتك.
          </p>
        </header>

        {/* Countries */}
        <div className="ad-countries" role="tablist" aria-label="الدولة">
          {COUNTRIES.map((c) => (
            <button key={c.key} type="button" role="tab" aria-selected={country === c.key} className={`ad-country ${country === c.key ? 'is-active' : ''}`} onClick={() => setCountry(c.key)}>
              <span className="flag-frame"><Flag country={c.key} size={26} /></span>
              <span className="ad-country__text"><b>{c.label}</b><small>{c.note}</small></span>
            </button>
          ))}
        </div>

        {country === 'china' && (
          <div className="ad-grid">
            <section className="ad-card" aria-labelledby="ad-china">
              <h2 id="ad-china" className="ad-card__title">عنوان المخزن في الصين</h2>

              {/* The two choices that change the address */}
              <div className="ad-choices">
                <div>
                  <span className="ad-label">طريقة الشحن</span>
                  <div className="ad-seg" role="radiogroup" aria-label="طريقة الشحن">
                    <button type="button" role="radio" aria-checked={method === 'air'} className={method === 'air' ? 'is-active' : ''} onClick={() => setMethod('air')}><Plane size={17} aria-hidden /> جوي</button>
                    <button type="button" role="radio" aria-checked={method === 'sea'} className={method === 'sea' ? 'is-active' : ''} onClick={() => setMethod('sea')}><Ship size={17} aria-hidden /> بحري</button>
                  </div>
                </div>
                <label>
                  <span className="ad-label">مدينة الاستلام في ليبيا</span>
                  <span className="ad-select">
                    <select value={city} onChange={(e) => setCity(e.target.value)}>
                      {libyanCities.filter((c) => c.value !== 'other').map((c) => <option key={c.value} value={c.value}>{c.label}</option>)}
                    </select>
                    <ChevronDown size={17} aria-hidden />
                  </span>
                </label>
              </div>

              {/* The line the warehouse reads first */}
              <div className="ad-mark">
                <span>كودك في المخزن</span>
                <bdi dir="ltr">{code}</bdi>
                <CopyBtn id="mark" value={code} copied={copied} copy={copy} />
                <small>{method === 'air' ? 'جوي' : 'بحري'} · العميل {id} · الاستلام في {cityLabel}</small>
              </div>

              <ChinaAddress code={code} copied={copied} copy={copy} />
            </section>

            <aside className="ad-side">
              <section className="ad-card" aria-labelledby="ad-label-title">
                <h2 id="ad-label-title" className="ad-card__title">علامة الشحن</h2>
                <p className="ad-muted">اطلب من البائع طباعتها ولصقها على كل كرتونة، حتى نعرف أن الطرد لك. تتغير مع طريقة الشحن التي اخترتها.</p>
                <ShippingMark customerId={id} accountId={account?._id || ''} method={method} code={code} copied={copied} copy={copy} />
              </section>

              <section className="ad-card" aria-labelledby="ad-next">
                <h2 id="ad-next" className="ad-card__title">بعد أن يشحن البائع</h2>
                <ol className="ad-steps">
                  <li><span>1</span><div><b>نبّهنا بالطرد</b><small>أرسل رقم التتبع الذي أعطاك البائع، لنربط الطرد بكودك عند وصوله.</small><Link to="/add-tracking-numbers">نبّهنا بطرد قادم</Link></div></li>
                  <li><span>2</span><div><b>نستلم الطرد في المخزن</b><small>يظهر الطرد في طلبياتك عند وصوله للمخزن.</small><Link to="/orders">طلبياتي</Link></div></li>
                  <li><span>3</span><div><b>يُشحن إلى {cityLabel || 'ليبيا'}</b><small>تتابع الرحلة من الطلبية حتى الاستلام.</small></div></li>
                </ol>
              </section>
            </aside>
          </div>
        )}

        {country === 'uae' && (
          <div className="ad-grid">
            <section className="ad-card" aria-labelledby="ad-uae">
              <h2 id="ad-uae" className="ad-card__title">عنوان المخزن في الإمارات</h2>
              <p className="ad-muted">الشحن من الإمارات جوي فقط. اكتب كل خانة في مكانها عند الطلب من المواقع.</p>
              <UaeAddress customerId={id} copied={copied} copy={copy} />
            </section>
            <aside className="ad-side">
              <section className="ad-card">
                <h2 className="ad-card__title">بعد أن يشحن الموقع</h2>
                <ol className="ad-steps">
                  <li><span>1</span><div><b>نبّهنا بالطرد</b><small>أرسل رقم التتبع لنربط الطرد بكودك عند وصوله مخزن دبي.</small><Link to="/add-tracking-numbers">نبّهنا بطرد قادم</Link></div></li>
                  <li><span>2</span><div><b>تابع طلبيتك</b><small>يظهر الطرد في طلبياتك عند وصوله.</small><Link to="/orders">طلبياتي</Link></div></li>
                </ol>
              </section>
            </aside>
          </div>
        )}

        {['turkey', 'usa', 'uk'].includes(country) && (
          <BuyAndShip countryLabel={current.label} office={officeFor(account?.city)} customerName={[account?.firstName, account?.lastName].filter(Boolean).join(' ')} customerId={id} />
        )}

        {(country === 'china' || country === 'uae') && <p className="ad-start">
          جاهز؟ <Link to={`/start-shipment?shipmentFromWhere=${country}`}>ابدأ الشحن خطوة بخطوة</Link>
        </p>}
      </div>
    </div>
  );
};

export default AddressPage;
