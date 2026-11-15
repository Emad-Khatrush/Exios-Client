import { ClipboardEvent, FormEvent, useState } from 'react';
import { Link } from 'react-router-dom';
import { ArrowLeft, Check, PackageSearch, Plane, Plus, Ship, Trash2 } from 'lucide-react';
import api from '../../api';
import { Method } from '../../constants/warehouses';
import '../AddressPage/address.css';
import '../StartShipmentPage/startShipment.css';

const METHOD_TEXT: Record<Method, { label: string, hint: string }> = {
  air: { label: 'شحن جوي', hint: 'الطرد سيُشحن بالطائرة' },
  sea: { label: 'شحن بحري', hint: 'الطرد سيُشحن في حاوية' },
};

// Several numbers pasted at once (one per line, or separated by commas or spaces) become several rows
const splitNumbers = (text: string) => text.split(/[\s,،;]+/).map((t) => t.trim()).filter(Boolean);

/* Add tracking numbers: the seller's courier number, so we know the parcel when it reaches our
   warehouse even if it arrives without a name. Same form as the tracking step of "start shipping". */
const AddTrackingNumbers = () => {
  const [method, setMethod] = useState<Method | ''>('');
  const [rows, setRows] = useState<string[]>(['']);
  const [added, setAdded] = useState<{ number: string, method: Method }[]>([]);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');

  const setRow = (i: number, value: string) => setRows(rows.map((r, j) => (j === i ? value : r)));

  const onPaste = (i: number) => (e: ClipboardEvent<HTMLInputElement>) => {
    const parts = splitNumbers(e.clipboardData.getData('text'));
    if (parts.length < 2) return;
    e.preventDefault();
    const next = [...rows];
    next.splice(i, 1, ...parts);
    setRows(next);
  };

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    const numbers = Array.from(new Set(rows.map((r) => r.trim()).filter(Boolean)));
    if (!method) { setError('اختر طريقة الشحن أولاً: جوي أم بحري.'); return; }
    if (!numbers.length) { setError('اكتب رقم التتبع أولاً.'); return; }
    setBusy(true);
    setError('');
    try {
      await api.createTrackingNumbers(numbers.map((trackingNumber) => ({ trackingNumber, method })));
      setAdded((prev) => [...numbers.map((number) => ({ number, method })), ...prev]);
      setRows(['']);
    } catch {
      setError('تعذر حفظ رقم التتبع. تحقق من اتصالك ثم حاول مرة أخرى.');
    } finally {
      setBusy(false);
    }
  };

  const count = rows.filter((r) => r.trim()).length;

  return (
    <div dir="rtl" lang="ar" className="ad-page ss-page page-enter w-full px-4 pb-16 pt-6 sm:px-6 lg:px-8 lg:pt-8">
      <div className="mx-auto max-w-4xl">
        <header>
          <h1 className="text-2xl font-extrabold text-zinc-900 sm:text-3xl">إضافة رقم تتبع</h1>
          <p className="mt-1 max-w-[62ch] text-base leading-relaxed text-zinc-600 sm:text-lg">
            عندما يشحن البائع طردك إلى مخزننا، يعطيك رقم تتبع من شركة الشحن. أضفه هنا لنتعرّف على طردك عند وصوله، حتى لو وصل بدون اسم.
          </p>
        </header>

        <section className="ss-panel">
          <form onSubmit={submit} noValidate>
            <div className="ss-q">
              <h3>طريقة شحن هذه الطرود</h3>
              <div className="ss-methods" role="radiogroup" aria-label="طريقة الشحن">
                {(['air', 'sea'] as Method[]).map((m) => {
                  const Icon = m === 'air' ? Plane : Ship;
                  return (
                    <button
                      key={m}
                      type="button"
                      role="radio"
                      aria-checked={method === m}
                      className={`ss-method ${method === m ? 'is-active' : ''}`}
                      onClick={() => { setMethod(m); setError(''); }}
                    >
                      <span className="ss-method__icon" aria-hidden><Icon size={24} /></span>
                      <span className="ss-method__text">
                        <b>{METHOD_TEXT[m].label}</b>
                        <small>{METHOD_TEXT[m].hint}</small>
                      </span>
                      {method === m && <span className="ss-method__tick" aria-hidden><Check size={16} /></span>}
                    </button>
                  );
                })}
              </div>
            </div>

            <div className="ss-track">
              <h3 className="ss-track__title">أرقام التتبع</h3>
              {rows.map((value, i) => (
                <div key={i} className="ss-track__row">
                  <input
                    value={value}
                    onChange={(e) => setRow(i, e.target.value)}
                    onPaste={onPaste(i)}
                    placeholder="مثال: SF1234567890123"
                    dir="ltr"
                    autoComplete="off"
                    spellCheck={false}
                    aria-label={`رقم التتبع ${i + 1}`}
                  />
                  {rows.length > 1 && (
                    <button type="button" className="ss-track__remove" aria-label="حذف هذا الرقم" onClick={() => setRows(rows.filter((_, j) => j !== i))}>
                      <Trash2 size={17} />
                    </button>
                  )}
                </div>
              ))}
              <div className="ss-track__bar">
                <button type="button" className="ss-track__more" onClick={() => setRows([...rows, ''])}><Plus size={16} aria-hidden /> رقم آخر</button>
                <button type="submit" className="ad-btn ad-btn--primary" disabled={busy}>
                  {busy ? 'جارٍ الحفظ…' : count > 1 ? `حفظ ${count} أرقام` : 'حفظ رقم التتبع'}
                </button>
              </div>
              {error && <p className="ss-error" role="alert">{error}</p>}
              <p className="ad-hint">لكل كرتونة أو طرد رقم مختلف؟ أضف كل الأرقام. يمكنك لصق عدة أرقام معاً وستُقسَّم تلقائياً.</p>
            </div>
          </form>

          {!!added.length && (
            <div className="at-done" role="status">
              <p className="at-done__title"><Check size={18} aria-hidden /> أرسلنا الأرقام للمكتب ليتابعها</p>
              <ul className="ss-track__added">
                {added.map((a) => (
                  <li key={`${a.number}:${a.method}`}>
                    <Check size={16} aria-hidden /> <bdi dir="ltr">{a.number}</bdi>
                    <span className="at-done__method">{a.method === 'air' ? 'جوي' : 'بحري'}</span>
                  </li>
                ))}
              </ul>
              <Link to="/orders?tab=unsure" className="at-done__link">
                <PackageSearch size={17} aria-hidden /> تابعها في طلبياتي، قسم «أرقام قيد المتابعة» <ArrowLeft size={16} aria-hidden />
              </Link>
            </div>
          )}
        </section>
      </div>
    </div>
  );
};

export default AddTrackingNumbers;
