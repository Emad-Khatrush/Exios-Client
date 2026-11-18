import { useState } from 'react';
import { useSelector } from 'react-redux';
import {
  BadgeCheck, Building2, Check, Clock3, Copy, KeyRound, LogOut, Mail, MapPin, Phone, ShieldAlert, ShieldCheck, Upload, User as UserIcon,
} from 'lucide-react';
import { TbBrandWhatsapp } from 'react-icons/tb';
import api from '../../api';
import { libyanCities } from '../../constants/info';
import { officeFor, whatsappLink } from '../../constants/contact';
import { User } from '../../models';
import { useCopy } from '../../utils/useCopy';
import { logout } from '../../utils/logout';
import './settings.css';

type PassportState = 'missing' | 'verified' | 'rejected' | 'review';

const passportState = (u?: User): PassportState => {
  const p = u?.passportVerification;
  if (!p?.imageUrl) return 'missing';
  if (p.status === 'verified') return 'verified';
  if (p.status === 'rejected') return 'rejected';
  return 'review';
};

const PASSPORT: Record<PassportState, { title: string, text: string, icon: typeof ShieldCheck }> = {
  verified: { title: 'تم توثيق جواز سفرك', text: 'حسابك موثّق، ويمكنك الشحن والاستلام بدون أي إجراء إضافي.', icon: ShieldCheck },
  review: { title: 'جواز سفرك قيد المراجعة', text: 'استلمنا الصورة ويراجعها المكتب. ستصلك النتيجة هنا عند الانتهاء.', icon: Clock3 },
  rejected: { title: 'تم رفض صورة جواز السفر', text: 'أعد رفع صورة واضحة لصفحة البيانات من النافذة التي تظهر لك في التطبيق.', icon: ShieldAlert },
  missing: { title: 'لم ترفع صورة جواز السفر بعد', text: 'ارفع صورة صفحة البيانات من النافذة التي تظهر لك في التطبيق، لتوثيق حسابك.', icon: Upload },
};

const SettingsPage = () => {
  const account: User = useSelector((state: any) => state.session.account);
  const { copied, copy } = useCopy();
  const [reset, setReset] = useState<'idle' | 'sending' | 'sent' | 'error'>('idle');

  const name = [account?.firstName, account?.lastName].filter(Boolean).join(' ');
  const initials = [account?.firstName, account?.lastName].filter(Boolean).map((n) => n.trim()[0]).join('');
  const email = account?.username || '';
  const cityLabel = libyanCities.find((c) => c.value === account?.city)?.label || '—';
  const office = officeFor(account?.city);
  const passport = passportState(account);
  const P = PASSPORT[passport];
  const rejection = account?.passportVerification?.rejectionReason;

  const editRequest = whatsappLink(
    office.whatsapp,
    `مرحباً، أنا ${name || 'عميل إكسيوس'} - كود العميل ${account?.customerId || ''}.\nأريد تعديل بياناتي في الحساب:\n`,
  );

  const sendReset = async () => {
    if (!email || reset === 'sending') return;
    setReset('sending');
    try {
      await api.getPasswordToken({ email });
      setReset('sent');
    } catch {
      setReset('error');
    }
  };

  const rows = [
    { icon: UserIcon, label: 'الاسم', value: name || '—' },
    { icon: Mail, label: 'البريد الإلكتروني', value: email || '—', ltr: true },
    { icon: Phone, label: 'رقم الهاتف', value: account?.phone ? String(account.phone) : '—', ltr: true },
    { icon: MapPin, label: 'المدينة', value: cityLabel },
    { icon: Building2, label: 'مكتبك', value: office.name },
  ];

  return (
    <div dir="rtl" lang="ar" className="st-page w-full px-4 pb-16 pt-6 sm:px-6 lg:px-8 lg:pt-8">
      <div className="mx-auto max-w-3xl">
        <h1 className="text-2xl font-extrabold text-zinc-900 sm:text-3xl">الإعدادات</h1>

        {/* Who */}
        <section className="st-profile">
          <span className="st-avatar" aria-hidden>{initials || <UserIcon size={26} />}</span>
          <div className="st-profile__text">
            <h2>{name || 'حسابي'}</h2>
            <p>
              {passport === 'verified'
                ? <span className="st-verified"><BadgeCheck size={16} aria-hidden /> حساب موثّق</span>
                : <span className="st-unverified">غير موثّق بعد</span>}
              <span className="st-dot" aria-hidden>·</span>
              {cityLabel}
            </p>
          </div>
          <div className="st-code">
            <span>كود الشحن</span>
            <bdi dir="ltr">{account?.customerId}</bdi>
            <button type="button" className={copied === 'code' ? 'is-done' : ''} onClick={() => copy('code', account?.customerId || '')} aria-label="نسخ كود الشحن">
              {copied === 'code' ? <Check size={15} aria-hidden /> : <Copy size={15} aria-hidden />}
            </button>
          </div>
        </section>

        {/* Personal details: shown here, changed by the office */}
        <section className="st-card" aria-labelledby="st-info">
          <div className="st-card__head">
            <h2 id="st-info">معلوماتك</h2>
            <p>هذه البيانات التي نتواصل بها معك ونسلّمك بها شحناتك.</p>
          </div>
          <dl className="st-rows">
            {rows.map(({ icon: Icon, label, value, ltr }) => (
              <div key={label} className="st-row">
                <dt><Icon size={18} aria-hidden /> {label}</dt>
                <dd>{ltr ? <bdi dir="ltr">{value}</bdi> : value}</dd>
              </div>
            ))}
          </dl>
          <div className="st-note">
            <p>لحماية حسابك، يتم تعديل بياناتك عن طريق المكتب. أرسل لنا ما تريد تغييره.</p>
            <a className="st-btn st-btn--wa" href={editRequest} target="_blank" rel="noreferrer">
              <TbBrandWhatsapp size={19} aria-hidden /> طلب تعديل بياناتي
            </a>
          </div>
        </section>

        {/* Passport */}
        <section className={`st-card st-passport is-${passport}`} aria-labelledby="st-passport">
          <span className="st-passport__icon" aria-hidden><P.icon size={24} /></span>
          <div>
            <h2 id="st-passport">{P.title}</h2>
            <p>{P.text}</p>
            {passport === 'rejected' && rejection && <p className="st-passport__reason">سبب الرفض: {rejection}</p>}
          </div>
        </section>

        {/* Security */}
        <section className="st-card" aria-labelledby="st-security">
          <div className="st-card__head">
            <h2 id="st-security">الأمان</h2>
          </div>
          <div className="st-action">
            <span className="st-action__icon" aria-hidden><KeyRound size={20} /></span>
            <div className="st-action__text">
              <b>تغيير كلمة المرور</b>
              <small>
                {reset === 'sent'
                  ? <>أرسلنا رابط تغيير كلمة المرور إلى <bdi dir="ltr">{email}</bdi>. إذا لم تجده تحقق من مجلد Spam أو Junk.</>
                  : reset === 'error'
                    ? 'تعذر إرسال الرابط. تحقق من اتصالك ثم حاول مرة أخرى.'
                    : <>نرسل لك رابطاً على بريدك <bdi dir="ltr">{email}</bdi> لتختار كلمة مرور جديدة.</>}
              </small>
            </div>
            <button type="button" className="st-btn st-btn--outline" onClick={sendReset} disabled={!email || reset === 'sending' || reset === 'sent'}>
              {reset === 'sending' ? 'جارٍ الإرسال…' : reset === 'sent' ? <><Check size={16} aria-hidden /> أُرسل الرابط</> : 'إرسال الرابط'}
            </button>
          </div>
          <div className="st-action">
            <span className="st-action__icon is-danger" aria-hidden><LogOut size={20} /></span>
            <div className="st-action__text">
              <b>تسجيل الخروج</b>
              <small>الخروج من حسابك على هذا الجهاز.</small>
            </div>
            <button type="button" className="st-btn st-btn--danger" onClick={logout}>تسجيل الخروج</button>
          </div>
        </section>
      </div>
    </div>
  );
};

export default SettingsPage;
