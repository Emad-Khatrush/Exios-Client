// The pieces of a warehouse address shared by "Our addresses" and "Start a shipment": the China
// address block, the UAE address fields, the shipping mark picture and the buy-and-ship card.
// Styled by address.css (the page root carries .ad-page).
import { useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import QRCode from 'qrcode.react';
import { Check, Copy, Download, ImageOff, PackageCheck, Share2, ShoppingBag, Truck } from 'lucide-react';
import { TbBrandWhatsapp } from 'react-icons/tb';
import { Office, whatsappLink } from '../../constants/contact';
import { chinaAddressText, Method, UAE_WAREHOUSE, uaeAddressLine, uaeAddressText } from '../../constants/warehouses';
import { createShippingMarkImage, shareableMarkFile, ShippingMarkImage } from '../../utils/shippingMarkImage';
import ExiosLogo from '../../../public/images/exios-logo.png';
import './address.css';

type CopyFn = (id: string, value: string) => void;

const canShareText = () => typeof navigator !== 'undefined' && !!(navigator as any).share;
const shareText = (text: string) => (navigator as any).share({ text }).catch(() => undefined);

export const CopyBtn = ({ id, value, copied, copy, label = 'نسخ' }: { id: string, value: string, copied: string, copy: CopyFn, label?: string }) => (
  <button type="button" className={`ad-copy ${copied === id ? 'is-done' : ''}`} onClick={() => copy(id, value)}>
    {copied === id ? <><Check size={15} aria-hidden /> نُسخ</> : <><Copy size={15} aria-hidden /> {label}</>}
  </button>
);

/* One line of an address: what it is in Arabic, the value as the seller types it, a copy button */
export const Field = ({ id, label, value, copied, copy, big }: { id: string, label: string, value: string, copied: string, copy: CopyFn, big?: boolean }) => (
  <div className={`ad-field ${big ? 'is-big' : ''}`}>
    <span className="ad-field__label">{label}</span>
    <bdi className="ad-field__value" dir="ltr">{value}</bdi>
    <CopyBtn id={id} value={value} copied={copied} copy={copy} />
  </div>
);

/* China: the full address in one block, copied or shared as it is shown */
export const ChinaAddress = ({ code, copied, copy, onUsed }: { code: string, copied: string, copy: CopyFn, onUsed?: () => void }) => {
  const text = chinaAddressText(code);
  return (
    <>
      <div className="ad-full">
        <span className="ad-label">العنوان كاملاً</span>
        <pre dir="ltr" lang="zh">{text}</pre>
      </div>
      <div className="ad-actions">
        <button type="button" className={`ad-btn ad-btn--primary ${copied === 'cn-all' ? 'is-done' : ''}`} onClick={() => { copy('cn-all', text); onUsed?.(); }}>
          {copied === 'cn-all' ? <Check size={19} aria-hidden /> : <Copy size={19} aria-hidden />}
          {copied === 'cn-all' ? 'نُسخ العنوان كاملاً' : 'انسخ العنوان كاملاً للبائع'}
        </button>
        {canShareText() && (
          <button type="button" className="ad-btn ad-btn--ghost" onClick={() => { shareText(text); onUsed?.(); }}><Share2 size={18} aria-hidden /> مشاركة</button>
        )}
      </div>
      <p className="ad-hint">ينسخ العنوان كاملاً كما هو فوق، مع كودك واسم المستلم والهاتف وتعليمات المخزن، جاهزاً لإرساله للبائع.</p>
    </>
  );
};

/* UAE: one field per box of a shop's checkout form */
export const UaeAddress = ({ customerId, copied, copy, onUsed }: { customerId: string, copied: string, copy: CopyFn, onUsed?: () => void }) => {
  const text = uaeAddressText(customerId);
  const tracked: CopyFn = (id, value) => { copy(id, value); onUsed?.(); };
  return (
    <>
      <div className="ad-fields">
        <Field id="ae-first" label="الاسم الأول" value={UAE_WAREHOUSE.firstName} copied={copied} copy={tracked} />
        <Field id="ae-last" label="اسم العائلة" value={UAE_WAREHOUSE.lastName} copied={copied} copy={tracked} />
        <Field id="ae-phone" label="الهاتف" value={UAE_WAREHOUSE.phone} copied={copied} copy={tracked} />
        <Field id="ae-line" label="العنوان" value={uaeAddressLine(customerId)} copied={copied} copy={tracked} big />
        <Field id="ae-city" label="المدينة" value={UAE_WAREHOUSE.city} copied={copied} copy={tracked} />
        <Field id="ae-country" label="الدولة" value={UAE_WAREHOUSE.country} copied={copied} copy={tracked} />
      </div>
      <div className="ad-actions">
        <button type="button" className={`ad-btn ad-btn--primary ${copied === 'ae-all' ? 'is-done' : ''}`} onClick={() => tracked('ae-all', text)}>
          {copied === 'ae-all' ? <Check size={19} aria-hidden /> : <Copy size={19} aria-hidden />}
          {copied === 'ae-all' ? 'نُسخ العنوان كاملاً' : 'انسخ العنوان كاملاً'}
        </button>
        {canShareText() && <button type="button" className="ad-btn ad-btn--ghost" onClick={() => { shareText(text); onUsed?.(); }}><Share2 size={18} aria-hidden /> مشاركة</button>}
      </div>
      <p className="ad-hint">كودك <bdi dir="ltr">{customerId}</bdi> في آخر سطر العنوان: لا تحذفه، فهو ما يربط الطرد بحسابك.</p>
    </>
  );
};

/* The shipping mark as a picture, drawn like the office's: preview, download and share */
export const ShippingMark = ({ customerId, accountId, method, code, copied, copy, onUsed }: {
  customerId: string, accountId: string, method: Method, code: string, copied: string, copy: CopyFn, onUsed?: () => void,
}) => {
  const qrBox = useRef<HTMLDivElement>(null);
  const [image, setImage] = useState<(ShippingMarkImage & { url: string }) | null>(null);
  const [state, setState] = useState<'loading' | 'ready' | 'error'>('loading');
  const [attempt, setAttempt] = useState(0);
  const [sharing, setSharing] = useState(false);

  useEffect(() => {
    let active = true;
    let url = '';
    setState('loading');
    const qr = qrBox.current?.querySelector('canvas');
    if (!qr || !customerId) { setState('error'); return undefined; }
    createShippingMarkImage({ customerCode: customerId, method, inspection: false, qr, logoSrc: ExiosLogo })
      .then((made) => {
        if (!active) return;
        url = URL.createObjectURL(made.blob);
        setImage({ ...made, url });
        setState('ready');
      })
      .catch(() => { if (active) setState('error'); });
    return () => { active = false; if (url) { const old = url; window.setTimeout(() => URL.revokeObjectURL(old), 60000); } };
  }, [customerId, accountId, method, attempt]);

  const file = image ? shareableMarkFile(image) : null;
  const share = async () => {
    if (!file || sharing) return;
    setSharing(true);
    try { await (navigator as any).share({ files: [file], title: `Exios ${customerId} · ${method}` }); onUsed?.(); } catch { /* closed or not allowed */ }
    setSharing(false);
  };

  return (
    <>
      {/* Hidden: the QR the picture is drawn from (the office's link to this customer) */}
      <div ref={qrBox} className="ad-qr-source" aria-hidden>
        <QRCode value={`https://exios-admin-frontend.web.app/shouldAllowToAccessApp?id=${accountId}`} size={256} includeMargin level="M" />
      </div>
      <div className="ad-mark-preview">
        {state === 'ready' && image && <img src={image.url} alt={`علامة شحن ${method === 'air' ? 'جوي' : 'بحري'} للعميل ${customerId}`} />}
        {state === 'loading' && <div className="ad-mark-wait" role="status"><span className="ad-spinner" aria-hidden />جارٍ تجهيز العلامة…</div>}
        {state === 'error' && (
          <div className="ad-mark-wait">
            <ImageOff size={26} aria-hidden />
            تعذر تجهيز العلامة.
            <button type="button" className="ad-copy" onClick={() => setAttempt((n) => n + 1)}>إعادة المحاولة</button>
          </div>
        )}
      </div>
      <div className="ad-actions ad-actions--tight">
        {state === 'ready' && image ? (
          <a className="ad-btn ad-btn--primary" href={image.url} download={image.filename} onClick={() => onUsed?.()}>
            <Download size={18} aria-hidden /> تحميل العلامة
          </a>
        ) : (
          <button type="button" className="ad-btn ad-btn--primary" disabled><Download size={18} aria-hidden /> تحميل العلامة</button>
        )}
        {file && (
          <button type="button" className="ad-btn ad-btn--ghost" onClick={share} disabled={sharing}>
            <Share2 size={18} aria-hidden /> {sharing ? 'جارٍ المشاركة…' : 'مشاركة'}
          </button>
        )}
      </div>
      <p className="ad-hint">على الهاتف يمكنك أيضاً الضغط مطولاً على الصورة واختيار «حفظ الصورة».</p>
      <div className="ad-fallback">
        <span>إذا لم يستطع الطباعة، يكتب على الكرتونة:</span>
        <bdi dir="ltr">Exios - by {code}</bdi>
        <CopyBtn id="mark-text" value={`Exios - by ${code}`} copied={copied} copy={copy} />
      </div>
    </>
  );
};

/* Countries with no warehouse: we buy for the customer and ship */
export const BuyAndShip = ({ countryLabel, office, customerName, customerId }: { countryLabel: string, office: Office, customerName: string, customerId: string }) => (
  <section className="ad-card ad-buy" aria-labelledby="ad-buy">
    <span className="ad-buy__icon" aria-hidden><ShoppingBag size={28} /></span>
    <div>
      <h2 id="ad-buy" className="ad-card__title">من {countryLabel}: نشتري لك ونشحن</h2>
      <p className="ad-muted">
        لا يوجد عنوان شحن مباشر من {countryLabel}. أرسل لنا رابط المنتج، فنشتريه ونشحنه لك إلى ليبيا في خطوة واحدة.
      </p>
      <ul className="ad-buy__steps">
        <li><PackageCheck size={18} aria-hidden /> أرسل رابط المنتج والمقاس والكمية</li>
        <li><Truck size={18} aria-hidden /> نرسل لك السعر شاملاً الشراء والشحن</li>
      </ul>
      <div className="ad-actions">
        <a
          className="ad-btn ad-btn--wa"
          href={whatsappLink(office.whatsapp, `مرحباً، أنا ${customerName} - كود العميل ${customerId}.\nأريد شراء منتج من ${countryLabel} وشحنه:\n`)}
          target="_blank"
          rel="noreferrer"
        >
          <TbBrandWhatsapp size={20} aria-hidden /> أرسل الرابط لـ{office.name}
        </a>
        <Link className="ad-btn ad-btn--ghost" to="/prices/purchase">أسعار الشراء</Link>
      </div>
    </div>
  </section>
);
