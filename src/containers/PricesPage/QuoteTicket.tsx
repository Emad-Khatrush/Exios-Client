import { useEffect, useState } from 'react';
import { FaWhatsapp } from 'react-icons/fa';
import { Line, Office, Quote, money, plain, officeFor, whatsappLink } from './pricingMath';

type Props = {
  quote: Quote | null,
  offices: Office[],
  city?: string,
  customer?: { name?: string, customerId?: string },
  emptyText: string,
  // What the total does not include (shipping: FOB, no Libyan customs), shown under the total
  notice?: string,
};

const lineValue = (line: Line) => line.text ?? (line.hint === 'USD' ? money(line.value) : `${plain(line.value, 4)}${line.hint ? ` ${line.hint === 'كجم' ? 'كجم' : line.hint}` : ''}`);

// The result of a calculation, drawn as a shipping waybill: what was counted, the total, and the
// button that sends it to the office on WhatsApp
const QuoteTicket = ({ quote, offices, city, customer, emptyText, notice }: Props) => {
  const [officeKey, setOfficeKey] = useState(() => officeFor(offices, city)?.key);
  useEffect(() => { setOfficeKey(officeFor(offices, city)?.key); }, [offices, city]);
  const office = offices.find((o) => o.key === officeKey) || offices[0];

  if (!quote) {
    return (
      <div className="ticket ticket--empty" aria-live="polite">
        <p className="text-base text-zinc-600 leading-relaxed">{emptyText}</p>
      </div>
    );
  }

  return (
    <div className="ticket" aria-live="polite" key={quote.title}>
      <div className="px-5 pt-5 pb-4">
        <p className="text-sm font-semibold text-green-700">تقدير التكلفة</p>
        <h3 className="mt-0.5 text-lg font-bold text-zinc-900">{quote.title}</h3>
        <dl className="mt-4 space-y-2.5">
          {quote.lines.map((line) => (
            <div key={line.label} className="flex items-baseline justify-between gap-3 text-base">
              <dt className={line.strong ? 'font-semibold text-zinc-800' : 'text-zinc-600'}>{line.label}</dt>
              {/* Text (a carrier, a route) finds its own direction and may wrap; numbers stay one LTR run */}
              <dd dir={line.text ? 'auto' : 'ltr'} className={`tabular-nums ${line.text ? 'min-w-0 text-end' : 'whitespace-nowrap'} ${line.strong ? 'font-bold text-zinc-900' : 'font-medium text-zinc-700'}`}>{lineValue(line)}</dd>
            </div>
          ))}
        </dl>
      </div>

      <div className="ticket__tear" aria-hidden />

      <div className="px-5 pt-4 pb-5">
        <div className="flex items-end justify-between gap-3">
          <span className="text-base font-semibold text-zinc-600">{quote.totalLabel}</span>
          <span dir="ltr" className="ticket__total text-3xl font-extrabold tabular-nums text-zinc-900" key={quote.total}>{money(quote.total)}</span>
        </div>
        {notice && <p className="mt-3 rounded-lg bg-amber-50 px-3 py-2 text-sm font-semibold leading-relaxed text-amber-900">{notice}</p>}
        <p className="mt-2 text-sm leading-relaxed text-zinc-600">هذا تقدير. يؤكد المكتب الفاتورة النهائية قبل البدء.</p>

        {offices.length > 0 && office && (
          <div className="mt-5">
            {offices.length > 1 && (
              <div className="mb-3" role="radiogroup" aria-label="المكتب">
                <p className="mb-2 text-sm font-semibold text-zinc-600">أرسل إلى</p>
                <div className="grid grid-cols-2 gap-2">
                  {offices.map((o) => (
                    <button
                      key={o.key}
                      type="button"
                      role="radio"
                      aria-checked={o.key === office.key}
                      onClick={() => setOfficeKey(o.key)}
                      className={`rounded-xl border px-3 py-2.5 text-base font-semibold transition-colors duration-200 focus:outline-none focus-visible:ring-2 focus-visible:ring-green-700 focus-visible:ring-offset-2 ${o.key === office.key ? 'border-green-700 bg-green-50 text-green-800' : 'border-zinc-200 bg-white text-zinc-600 hover:border-zinc-300'}`}
                    >
                      {o.label}
                    </button>
                  ))}
                </div>
              </div>
            )}
            <a
              href={whatsappLink(office, quote, customer)}
              target="_blank"
              rel="noopener noreferrer"
              className="flex w-full items-center justify-center gap-2 rounded-xl bg-green-700 px-4 py-3.5 text-lg font-bold text-white shadow-[0_8px_20px_-8px_rgba(21,128,61,0.65)] transition-all duration-200 hover:bg-green-800 active:scale-[0.98] focus:outline-none focus-visible:ring-2 focus-visible:ring-green-700 focus-visible:ring-offset-2"
            >
              <FaWhatsapp size={20} aria-hidden />
              أرسل الحساب على واتساب
            </a>
          </div>
        )}
      </div>
    </div>
  );
};

export default QuoteTicket;
