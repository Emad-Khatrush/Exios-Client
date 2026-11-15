import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useSelector } from 'react-redux';
import { Ban, Check, Copy, ExternalLink, Mail, MapPin, MessageSquareWarning, Navigation, PackageSearch, Phone, Tags, Warehouse } from 'lucide-react';
import { TbBrandFacebook, TbBrandTiktok, TbBrandWhatsapp } from 'react-icons/tb';
import { EMAIL, FACEBOOK_URL, OFFICES, Office, TIKTOK_URL, officeFor, whatsappLink } from '../../constants/contact';
import './contact.css';

// Copies a value and says so on the button itself for a moment
const useCopy = () => {
  const [copied, setCopied] = useState('');
  const copy = async (value: string) => {
    try {
      await navigator.clipboard.writeText(value);
    } catch {
      // Older browsers: a hidden field and the copy command
      const field = document.createElement('textarea');
      field.value = value;
      document.body.appendChild(field);
      field.select();
      document.execCommand('copy');
      field.remove();
    }
    setCopied(value);
    window.setTimeout(() => setCopied((v) => (v === value ? '' : v)), 1600);
  };
  return { copied, copy };
};

// The things customers most often ask about, answered without waiting for a reply
const SHORTCUTS = [
  { to: '/address', icon: Warehouse, title: 'عنوان المخزن في الصين', text: 'العنوان مع كودك، جاهز للنسخ' },
  { to: '/orders', icon: PackageSearch, title: 'حالة طلبياتي', text: 'أين وصلت شحنتك الآن' },
  { to: '/prices/shipping', icon: Tags, title: 'أسعار الشحن', text: 'آخر الأسعار والحاسبة' },
  { to: '/prohibited-items', icon: Ban, title: 'ممنوعات الشحن', text: 'ما لا يمكن شحنه جواً أو بحراً' },
  { to: '/suggestions', icon: MessageSquareWarning, title: 'شكوى أو اقتراح', text: 'تابعها والرد عليها من التطبيق' },
];

const OfficeCard = ({ office, nearest, greeting, copied, copy }: {
  office: Office, nearest: boolean, greeting: string, copied: string, copy: (v: string) => void,
}) => (
  <article className={`ct-office ${nearest ? 'is-nearest' : ''}`} aria-labelledby={`ct-${office.key}`}>
    <header className="ct-office__head">
      <span className="ct-office__pin" aria-hidden><MapPin size={22} /></span>
      <div>
        <h2 id={`ct-${office.key}`}>{office.name}</h2>
        {nearest && <span className="ct-office__badge">الأقرب لك</span>}
      </div>
    </header>

    <p className="ct-office__address">{office.address}</p>
    {office.directions && <p className="ct-office__directions">{office.directions}</p>}

    <ul className="ct-phones" aria-label={`أرقام ${office.name}`}>
      {office.phones.map((phone) => (
        <li key={phone}>
          <a href={`tel:${phone}`} className="ct-phone">
            <Phone size={17} aria-hidden />
            <bdi dir="ltr">{phone}</bdi>
          </a>
          <button type="button" className={`ct-copy ${copied === phone ? 'is-done' : ''}`} onClick={() => copy(phone)} aria-label={`نسخ الرقم ${phone}`}>
            {copied === phone ? <><Check size={15} aria-hidden /> نُسخ</> : <><Copy size={15} aria-hidden /> نسخ</>}
          </button>
        </li>
      ))}
    </ul>

    <div className="ct-office__actions">
      <a className="ct-btn ct-btn--wa" href={whatsappLink(office.whatsapp, greeting)} target="_blank" rel="noreferrer">
        <TbBrandWhatsapp size={19} aria-hidden />
        راسل {office.name} على واتساب
      </a>
      <a className="ct-btn ct-btn--ghost" href={office.mapsUrl} target="_blank" rel="noreferrer">
        <Navigation size={16} aria-hidden />
        الاتجاهات
      </a>
    </div>
  </article>
);

const ContactUs = () => {
  const account = useSelector((state: any) => state.session.account);
  const { copied, copy } = useCopy();
  const nearest = officeFor(account?.city);
  // The nearest office first; the map opens on it too
  const offices = [nearest, ...OFFICES.filter((o) => o.key !== nearest.key)];
  const [mapKey, setMapKey] = useState(nearest.key);
  const mapOffice = OFFICES.find((o) => o.key === mapKey) || nearest;

  const name = [account?.firstName, account?.lastName].filter(Boolean).join(' ');
  const code = account?.customerId || '';
  // WhatsApp opens with who is writing, so the office finds the customer without asking
  const greeting = `مرحباً، أنا ${name || 'عميل إكسيوس'}${code ? ` - كود العميل ${code}` : ''}.\n`;

  return (
    <div dir="rtl" lang="ar" className="ct-page w-full px-4 pb-16 pt-6 sm:px-6 lg:px-8 lg:pt-8">
      <div className="mx-auto max-w-6xl">
        <header className="ct-hero">
          <div>
            <h1 className="text-2xl font-extrabold text-zinc-900 sm:text-3xl">تواصل معنا</h1>
            <p className="mt-1 max-w-[56ch] text-base leading-relaxed text-zinc-600 sm:text-lg">
              زورنا في أحد مكاتبنا، أو راسل المكتب الأقرب لك على واتساب. الرسالة تفتح جاهزة باسمك وكودك.
            </p>
          </div>
          {code && (
            <div className="ct-code">
              <span className="ct-code__label">كود العميل</span>
              <bdi className="ct-code__value" dir="ltr">{code}</bdi>
              <button type="button" className={`ct-copy ${copied === code ? 'is-done' : ''}`} onClick={() => copy(code)} aria-label="نسخ كود العميل">
                {copied === code ? <><Check size={15} aria-hidden /> نُسخ</> : <><Copy size={15} aria-hidden /> نسخ</>}
              </button>
              <span className="ct-code__hint">اذكره عند التواصل لنصل لطلبياتك أسرع</span>
            </div>
          )}
        </header>

        <div className="ct-offices">
          {offices.map((office) => (
            <OfficeCard key={office.key} office={office} nearest={office.key === nearest.key && !!account?.city} greeting={greeting} copied={copied} copy={copy} />
          ))}
        </div>

        {/* One map at a time: the office picked above it */}
        <section className="ct-map" aria-labelledby="ct-map-title">
          <div className="ct-map__bar">
            <h2 id="ct-map-title">الموقع على الخريطة</h2>
            <div className="ct-tabs" role="tablist" aria-label="المكتب">
              {OFFICES.map((o) => (
                <button key={o.key} type="button" role="tab" aria-selected={mapKey === o.key} className={mapKey === o.key ? 'is-active' : ''} onClick={() => setMapKey(o.key)}>
                  {o.city}
                </button>
              ))}
            </div>
          </div>
          <div className="ct-map__frame">
            <iframe key={mapOffice.key} title={`خريطة ${mapOffice.name}`} src={mapOffice.mapEmbed} loading="lazy" referrerPolicy="no-referrer-when-downgrade" allowFullScreen />
          </div>
          <a className="ct-map__open" href={mapOffice.mapsUrl} target="_blank" rel="noreferrer">
            افتح {mapOffice.name} في خرائط Google <ExternalLink size={15} aria-hidden />
          </a>
        </section>

        <section className="ct-shortcuts" aria-labelledby="ct-short-title">
          <h2 id="ct-short-title">قبل أن تراسلنا</h2>
          <p>قد تجد جوابك هنا مباشرة.</p>
          <ul>
            {SHORTCUTS.map(({ to, icon: Icon, title, text }) => (
              <li key={to}>
                <Link to={to} className="ct-short">
                  <span className="ct-short__icon" aria-hidden><Icon size={20} /></span>
                  <span className="ct-short__text"><b>{title}</b><small>{text}</small></span>
                </Link>
              </li>
            ))}
          </ul>
        </section>

        <footer className="ct-more">
          <span>راسلنا أو تابعنا على</span>
          <a href={`mailto:${EMAIL}`} className="ct-chip"><Mail size={17} aria-hidden /> البريد الإلكتروني</a>
          <a href={FACEBOOK_URL} target="_blank" rel="noreferrer" className="ct-chip"><TbBrandFacebook size={18} aria-hidden /> فيسبوك</a>
          <a href={TIKTOK_URL} target="_blank" rel="noreferrer" className="ct-chip"><TbBrandTiktok size={18} aria-hidden /> تيك توك</a>
        </footer>
      </div>
    </div>
  );
};

export default ContactUs;
