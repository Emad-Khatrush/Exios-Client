import { ChangeEvent, DragEvent, FormEvent, ReactNode, useEffect, useRef, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useDispatch } from 'react-redux';
import {
  AlertCircle, ArrowLeft, ArrowRight, BadgeCheck, Building2, Camera, Check, Eye, EyeOff, FileText, ImagePlus, Loader2, Lock,
  Gift, Mail, MapPin, PackageSearch, ShieldCheck, Trash2, X,
} from 'lucide-react';
import { TbBrandWhatsapp } from 'react-icons/tb';
import api from '../../api';
import TermsPdf from '../../../public/terms.pdf';
import { TERMS_VERSION } from '../TermsAndPrivacy/terms';
import { apiErrorsTypes } from '../../constants/errorTypes';
import { libyanCities } from '../../constants/info';
import { OFFICES, officeFor, whatsappLink } from '../../constants/contact';
import { LOGIN, STATUS_SUCCESS } from '../../constants/actions';
import { addAuthInterceptor } from '../../utils/AuthInterceptor';
import PhoneField from '../../components/PhoneField/PhoneField';
import Picker from '../../components/Picker/Picker';
import { DEFAULT_COUNTRY, phoneForServer, phoneProblem } from '../../utils/phone';
import { passwordStrength as strength } from '../../utils/password';
import { cleanCode, forgetCode, savedCode, usd } from '../InvitePage/referralText';
import logo from '../../../public/images/exios-logo.png';
import '../Login/login.css';
import './register.css';

type Step = 0 | 1 | 2;
const STEPS = ['بياناتك', 'كلمة المرور', 'توثيق الهوية'];

type Field = 'firstName' | 'lastName' | 'email' | 'phone' | 'city' | 'password' | 'repeatedPassword' | 'passport' | 'terms';
type Errors = Partial<Record<Field, string>>;

const MAX_UPLOAD = 10 * 1024 * 1024; // the server's limit

const EMAIL_TAKEN = 'هذا البريد مسجّل من قبل. سجّل الدخول به، أو استعمل بريداً آخر.';
const PHONE_TAKEN = 'هذا الرقم مسجّل في حساب آخر. سجّل الدخول به، أو اكتب رقماً آخر.';

const isEmail = (v: string) => /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(v.trim());

// Common slips in email domains: offer the fix instead of letting the account be made on a typo
const DOMAIN_FIXES: Record<string, string> = {
  'gmail.con': 'gmail.com', 'gmail.co': 'gmail.com', 'gmial.com': 'gmail.com', 'gmai.com': 'gmail.com', 'gamil.com': 'gmail.com',
  'gmail.cm': 'gmail.com', 'gmail.om': 'gmail.com', 'gmaill.com': 'gmail.com', 'hotmail.con': 'hotmail.com', 'hotmal.com': 'hotmail.com',
  'hotmial.com': 'hotmail.com', 'yahoo.con': 'yahoo.com', 'yaho.com': 'yahoo.com', 'outlook.con': 'outlook.com', 'icloud.con': 'icloud.com',
};
const emailFix = (v: string) => {
  const [user, domain] = v.trim().toLowerCase().split('@');
  return user && domain && DOMAIN_FIXES[domain] ? `${user}@${DOMAIN_FIXES[domain]}` : '';
};

// Phone photos are often 5-12 MB: shrink to a sharp 2000px JPEG so it uploads fast on a slow line.
// Anything the browser cannot draw (HEIC on some browsers) is sent as it is.
const shrinkImage = (file: File): Promise<File> => new Promise((resolve) => {
  if (!file.type.startsWith('image/') || file.size < 1.5 * 1024 * 1024) { resolve(file); return; }
  const url = URL.createObjectURL(file);
  const img = new Image();
  img.onload = () => {
    const scale = Math.min(1, 2000 / Math.max(img.width, img.height));
    const canvas = document.createElement('canvas');
    canvas.width = Math.round(img.width * scale);
    canvas.height = Math.round(img.height * scale);
    canvas.getContext('2d')?.drawImage(img, 0, 0, canvas.width, canvas.height);
    canvas.toBlob((blob) => {
      URL.revokeObjectURL(url);
      resolve(blob && blob.size < file.size ? new File([blob], file.name.replace(/\.\w+$/, '') + '.jpg', { type: 'image/jpeg' }) : file);
    }, 'image/jpeg', 0.86);
  };
  img.onerror = () => { URL.revokeObjectURL(url); resolve(file); };
  img.src = url;
});

const sizeText = (b: number) => (b > 1024 * 1024 ? `${(b / 1024 / 1024).toFixed(1)} MB` : `${Math.max(1, Math.round(b / 1024))} KB`);

const Register = () => {
  const [step, setStep] = useState<Step>(0);
  const [form, setForm] = useState({ firstName: '', lastName: '', email: '', phone: '', city: '', password: '', repeatedPassword: '' });
  const [terms, setTerms] = useState(false);
  const [phoneIso, setPhoneIso] = useState(DEFAULT_COUNTRY);
  const phoneRef = useRef<HTMLInputElement>(null);
  const [showPassword, setShowPassword] = useState(false);
  const [passport, setPassport] = useState<File | null>(null);
  const [preview, setPreview] = useState('');
  const [preparing, setPreparing] = useState(false);
  const [dragging, setDragging] = useState(false);
  const [termsOpen, setTermsOpen] = useState(false);
  const [errors, setErrors] = useState<Errors>({});
  const [problem, setProblem] = useState('');
  const [busy, setBusy] = useState(false);
  const [checking, setChecking] = useState(false);

  const panelRef = useRef<HTMLDivElement>(null);
  const fileRef = useRef<HTMLInputElement>(null);
  const cameraRef = useRef<HTMLInputElement>(null);
  const navigate = useNavigate();
  const dispatch = useDispatch();
  // Invite a friend: the code a shared link brought (/r/CODE), or one typed on the last step
  const [linkCode] = useState(() => savedCode());
  const [refCode, setRefCode] = useState(linkCode);
  const [refOpen, setRefOpen] = useState(!!linkCode);
  const [refInfo, setRefInfo] = useState<{ code: string, ok: boolean, name?: string, welcomePoints?: number } | null>(null);
  useEffect(() => {
    const code = cleanCode(refCode);
    if (code.length !== 6) { setRefInfo(null); return undefined; }
    let alive = true;
    const t = window.setTimeout(() => {
      api.checkReferralCode(code)
        .then((res: any) => { if (alive) setRefInfo({ code, ok: !!res?.data?.ok, name: res?.data?.name, welcomePoints: res?.data?.welcomePoints }); })
        .catch(() => { if (alive) setRefInfo(null); });
    }, 350);
    return () => { alive = false; window.clearTimeout(t); };
  }, [refCode]);
  const refOk = !!refInfo?.ok && refInfo.code === cleanCode(refCode);

  useEffect(() => () => { if (preview) URL.revokeObjectURL(preview); }, [preview]);

  // The terms window closes with Escape, and the page behind it does not scroll
  useEffect(() => {
    if (!termsOpen) return undefined;
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') setTermsOpen(false); };
    document.addEventListener('keydown', onKey);
    const overflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => { document.removeEventListener('keydown', onKey); document.body.style.overflow = overflow; };
  }, [termsOpen]);

  // Each step starts at its first field
  useEffect(() => {
    panelRef.current?.querySelector<HTMLElement>('input:not([type="file"]):not([type="checkbox"]), .rg-drop__btn')?.focus({ preventScroll: true });
  }, [step]);

  const set = (key: keyof typeof form) => (e: ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    setForm((f) => ({ ...f, [key]: e.target.value }));
    if (errors[key as Field]) setErrors((x) => ({ ...x, [key]: undefined }));
  };

  const pickFile = async (file?: File | null) => {
    if (!file) return;
    if (!file.type.startsWith('image/')) {
      setErrors((x) => ({ ...x, passport: 'اختر صورة (JPG أو PNG)، وليس ملفاً آخر.' }));
      return;
    }
    setPreparing(true);
    const ready = await shrinkImage(file);
    setPreparing(false);
    if (ready.size > MAX_UPLOAD) {
      setErrors((x) => ({ ...x, passport: `الصورة كبيرة (${sizeText(ready.size)}). الحد 10 MB، صوّرها مرة أخرى أو اختر صورة أصغر.` }));
      return;
    }
    setPassport(ready);
    setPreview(URL.createObjectURL(ready));
    setErrors((x) => ({ ...x, passport: undefined }));
  };

  const onDrop = (e: DragEvent) => {
    e.preventDefault();
    setDragging(false);
    pickFile(e.dataTransfer.files?.[0]);
  };

  const removePassport = () => {
    setPassport(null);
    setPreview('');
    if (fileRef.current) fileRef.current.value = '';
    if (cameraRef.current) cameraRef.current.value = '';
  };

  // What is missing on a step (empty = it can go on)
  const check = (s: Step): Errors => {
    const e: Errors = {};
    if (s === 0) {
      if (!form.firstName.trim()) e.firstName = 'اكتب اسمك الأول.';
      if (!form.lastName.trim()) e.lastName = 'اكتب اسم العائلة.';
      if (!form.email.trim()) e.email = 'اكتب بريدك الإلكتروني.';
      else if (!isEmail(form.email)) e.email = 'البريد غير صحيح. اكتبه مثل name@gmail.com';
      const phoneError = phoneProblem(phoneIso, form.phone);
      if (phoneError) e.phone = phoneError;
      if (!form.city) e.city = 'اختر مدينتك.';
    }
    if (s === 1) {
      if (form.password.length < 6) e.password = 'كلمة المرور 6 أحرف على الأقل.';
      if (!form.repeatedPassword) e.repeatedPassword = 'أعد كتابة كلمة المرور.';
      else if (form.repeatedPassword !== form.password) e.repeatedPassword = 'كلمتا المرور غير متطابقتين.';
    }
    if (s === 2) {
      if (!passport) e.passport = 'ارفع صورة جواز سفرك.';
      if (!terms) e.terms = 'وافق على الشروط لإنشاء الحساب.';
    }
    return e;
  };

  const showErrors = (e: Errors) => {
    setErrors(e);
    const first = Object.keys(e)[0];
    window.setTimeout(() => {
      const el = panelRef.current?.querySelector<HTMLElement>(`[data-field="${first}"]`);
      el?.focus();
      el?.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }, 0);
  };

  const next = (e?: FormEvent) => {
    e?.preventDefault();
    const found = check(step);
    if (Object.keys(found).length) { showErrors(found); return; }
    setProblem('');
    if (step === 0) checkTaken();
    else if (step < 2) setStep((step + 1) as Step);
    else create();
  };

  // A used email or phone is reported on this step, not after the passport upload.
  // If the check cannot reach the server they go on; creating the account checks again.
  const checkTaken = async () => {
    setChecking(true);
    try {
      const res: any = await api.checkSignupAvailability({ email: form.email.trim().toLowerCase(), phone: phoneForServer(phoneIso, form.phone) });
      const taken: Errors = {};
      if (res?.data?.emailTaken) taken.email = EMAIL_TAKEN;
      if (res?.data?.phoneTaken) taken.phone = PHONE_TAKEN;
      setChecking(false);
      if (Object.keys(taken).length) { showErrors(taken); return; }
    } catch {
      setChecking(false);
    }
    setStep(1);
  };

  const create = async () => {
    setBusy(true);
    setProblem('');
    const email = form.email.trim().toLowerCase();
    try {
      const body = new FormData();
      body.append('firstName', form.firstName.trim());
      body.append('lastName', form.lastName.trim());
      body.append('email', email);
      body.append('phone', phoneForServer(phoneIso, form.phone));
      body.append('city', form.city);
      body.append('password', form.password);
      body.append('repeatedPassword', form.repeatedPassword);
      body.append('isAgreeToTermsOfCompany', 'true');
      body.append('termsVersion', TERMS_VERSION);
      body.append('passportImage', passport as File);
      if (refOk) {
        body.append('referralCode', cleanCode(refCode));
        body.append('referralSource', cleanCode(refCode) === linkCode ? 'link' : 'code');
      }
      await api.createClientAccount(body);
      forgetCode();

      const res: any = await api.login({ username: email, password: form.password, loginMethod: 'email' }, 'client');
      const data = res.data;
      addAuthInterceptor(data.token);
      localStorage.setItem('authToken', data.token);
      localStorage.setItem('user', JSON.stringify(data));
      try { localStorage.setItem('exios:last-login', JSON.stringify({ method: 'email', username: email })); } catch { /* blocked */ }
      dispatch({ payload: data, status: STATUS_SUCCESS, type: LOGIN });
      navigate('/home', { replace: true });
    } catch (err: any) {
      setBusy(false);
      const code = err?.data?.message;
      // Send them back to the field the server refused
      if (code === 'user-exist') { setStep(0); showErrors({ email: EMAIL_TAKEN }); return; }
      if (code === 'phone-exist') { setStep(0); showErrors({ phone: PHONE_TAKEN }); return; }
      if (code === 'password-not-match') { setStep(1); showErrors({ repeatedPassword: 'كلمتا المرور غير متطابقتين.' }); return; }
      if (code === 'passport-image-required' || code === 'passport-upload-failed') { showErrors({ passport: apiErrorsTypes[code] }); return; }
      if (!code && !err?.data) { setProblem('تعذر الاتصال. تأكد من الإنترنت ثم حاول مرة أخرى.'); return; }
      setProblem(apiErrorsTypes[code] || 'لم يُنشأ الحساب. حاول مرة أخرى بعد قليل، أو راسلنا على واتساب.');
    }
  };

  const office = form.city ? officeFor(form.city) : null;
  const cityLabel = libyanCities.find((c) => c.value === form.city)?.label || '';
  const cityOptions = libyanCities.map((c) => ({ value: c.value, label: c.label, hint: officeFor(c.value).name, keywords: c.value }));
  const pw = strength(form.password);
  const fix = emailFix(form.email);
  const helpLink = whatsappLink(OFFICES[0].whatsapp, 'مرحباً، عندي مشكلة في إنشاء حساب في اكسيوس');

  // Already registered: the way out is one tap away
  const err = (f: Field) => errors[f] && (
    <p className="rg-err" id={`rg-err-${f}`}>
      {errors[f]}
      {(errors[f] === EMAIL_TAKEN || errors[f] === PHONE_TAKEN) && <Link to="/login">تسجيل الدخول</Link>}
    </p>
  );
  const field = (f: Field, label: string, control: ReactNode, hint?: ReactNode) => (
    <div className="lg-field">
      <label htmlFor={`rg-${f}`}>{label}</label>
      {control}
      {err(f) || (hint && <p className="rg-hint">{hint}</p>)}
    </div>
  );
  const aria = (f: Field) => ({ 'aria-invalid': !!errors[f], 'aria-describedby': errors[f] ? `rg-err-${f}` : undefined, 'data-field': f });

  return (
    <div dir="rtl" lang="ar" className="lg rg">
      <main className="lg-side">
        <div className="lg-top">
          <Link to="/" className="lg-back"><ArrowRight size={17} aria-hidden /> الرئيسية</Link>
        </div>

        <div className="lg-box rg-box">
          <img className="lg-logo" src={logo} alt="اكسيوس" width={132} height={56} />
          <h1>أنشئ حسابك</h1>
          <p className="lg-lead">ثلاث خطوات قصيرة، وتحصل على كود عميل وعنوان باسمك في مخازننا.</p>

          {refOk && (
            <p className="rg-gift" role="status">
              <Gift size={18} aria-hidden />
              <span>دعاك <b><bdi>{refInfo?.name}</bdi></b> · تحصل على هدية {usd(refInfo?.welcomePoints || 0)} لأول فاتورة شحن أو شراء</span>
            </p>
          )}

          {/* Where they are */}
          <ol className="rg-steps" aria-label="خطوات التسجيل">
            {STEPS.map((label, i) => (
              <li key={label} className={i < step ? 'is-done' : i === step ? 'is-now' : ''} aria-current={i === step ? 'step' : undefined}>
                <button type="button" onClick={() => i < step && setStep(i as Step)} disabled={i >= step || busy} tabIndex={i < step ? 0 : -1}>
                  <span className="rg-steps__dot">{i < step ? <Check size={13} strokeWidth={3} aria-hidden /> : i + 1}</span>
                  <span className="rg-steps__label">{label}</span>
                </button>
              </li>
            ))}
          </ol>

          <form className="lg-form" onSubmit={next} noValidate>
            <div ref={panelRef} key={step} className="rg-panel">
              {step === 0 && (
                <>
                  <div className="rg-two">
                    {field('firstName', 'الاسم الأول', (
                      <div className={`lg-input ${errors.firstName ? 'is-invalid' : ''}`}>
                        <input id="rg-firstName" value={form.firstName} onChange={set('firstName')} autoComplete="given-name" {...aria('firstName')} />
                      </div>
                    ))}
                    {field('lastName', 'اسم العائلة', (
                      <div className={`lg-input ${errors.lastName ? 'is-invalid' : ''}`}>
                        <input id="rg-lastName" value={form.lastName} onChange={set('lastName')} autoComplete="family-name" {...aria('lastName')} />
                      </div>
                    ))}
                  </div>
                  <p className="rg-hint rg-hint--top">اكتب اسمك كما هو في جواز السفر.</p>

                  {field('email', 'البريد الإلكتروني', (
                    <div className={`lg-input ${errors.email ? 'is-invalid' : ''}`}>
                      <Mail size={18} className="lg-input__icon" aria-hidden />
                      <input
                        id="rg-email"
                        type="email"
                        inputMode="email"
                        autoComplete="email"
                        autoCapitalize="none"
                        spellCheck={false}
                        dir="ltr"
                        placeholder="name@example.com"
                        value={form.email}
                        onChange={set('email')}
                        {...aria('email')}
                      />
                    </div>
                  ), fix ? (
                    <button type="button" className="rg-fix" onClick={() => setForm((f) => ({ ...f, email: fix }))}>
                      هل تقصد <bdi dir="ltr">{fix}</bdi>؟ اضغط للتصحيح
                    </button>
                  ) : undefined)}

                  {field('phone', 'رقم الهاتف', (
                    <PhoneField
                      id="rg-phone"
                      iso={phoneIso}
                      number={form.phone}
                      onChange={(nextIso, nextNumber) => {
                        setPhoneIso(nextIso);
                        setForm((f) => ({ ...f, phone: nextNumber }));
                        if (errors.phone) setErrors((x) => ({ ...x, phone: undefined }));
                      }}
                      inputRef={phoneRef}
                      invalid={!!errors.phone}
                      describedBy={errors.phone ? 'rg-err-phone' : undefined}
                      dataField="phone"
                    />
                  ), phoneIso === 'LY' ? undefined : 'رقم عليه واتساب، نراسلك عليه عندما تصل شحنتك.')}

                  {field('city', 'مدينتك', (
                    <Picker
                      id="rg-city"
                      value={form.city}
                      options={cityOptions}
                      onChange={(city) => { setForm((f) => ({ ...f, city })); if (errors.city) setErrors((x) => ({ ...x, city: undefined })); }}
                      title="مدينتك"
                      placeholder="اختر المدينة"
                      searchable
                      searchPlaceholder="ابحث عن مدينتك"
                      invalid={!!errors.city}
                      describedBy={errors.city ? 'rg-err-city' : undefined}
                      dataField="city"
                      renderValue={(o) => (
                        <>
                          <MapPin size={18} className="pk-trigger__icon" aria-hidden />
                          <span className={`pk-trigger__text ${o ? '' : 'is-placeholder'}`}>{o ? o.label : 'اختر المدينة'}</span>
                        </>
                      )}
                    />
                  ), office ? (
                    // Which office looks after them, and (outside the office's city) how the goods reach them
                    <span className="rg-office">
                      <Building2 size={17} aria-hidden />
                      <span>
                        <b>متابعة شحناتك ستكون من {office.name}</b>
                        {form.city === office.key ? (
                          <small>يتابع شحناتك وعملياتك، وتستلمها من المكتب مباشرة.</small>
                        ) : (
                          <small>
                            مدينتك خارج {office.city}، و{office.name} هو الأقرب لك: يتابع شحناتك وعملياتك،
                            وعندما تصل شحنتك إليه يرسلها لك إلى {cityLabel}.
                          </small>
                        )}
                      </span>
                    </span>
                  ) : undefined)}
                </>
              )}

              {step === 1 && (
                <>
                  {field('password', 'كلمة المرور', (
                    <div className={`lg-input ${errors.password ? 'is-invalid' : ''}`}>
                      <Lock size={18} className="lg-input__icon" aria-hidden />
                      <input
                        id="rg-password"
                        type={showPassword ? 'text' : 'password'}
                        autoComplete="new-password"
                        dir="ltr"
                        value={form.password}
                        onChange={set('password')}
                        {...aria('password')}
                      />
                      <button type="button" className="lg-eye" onClick={() => setShowPassword((v) => !v)} aria-label={showPassword ? 'إخفاء كلمة المرور' : 'إظهار كلمة المرور'} aria-pressed={showPassword}>
                        {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                      </button>
                    </div>
                  ))}
                  {form.password && (
                    <div className={`rg-meter is-${pw.score}`} aria-live="polite">
                      <span className="rg-meter__bars" aria-hidden><i /><i /><i /><i /></span>
                      <span>كلمة مرور {pw.label}</span>
                    </div>
                  )}
                  <ul className="rg-rules">
                    <li className={form.password.length >= 6 ? 'is-ok' : ''}><Check size={14} aria-hidden /> 6 أحرف على الأقل</li>
                    <li className={/[a-z]/i.test(form.password) && /\d/.test(form.password) ? 'is-ok' : ''}><Check size={14} aria-hidden /> حروف وأرقام معاً</li>
                    <li className={form.password.length >= 10 ? 'is-ok' : ''}><Check size={14} aria-hidden /> 10 أحرف أو أكثر أفضل</li>
                  </ul>

                  {field('repeatedPassword', 'أعد كتابة كلمة المرور', (
                    <div className={`lg-input ${errors.repeatedPassword ? 'is-invalid' : form.repeatedPassword && form.repeatedPassword === form.password ? 'is-ok' : ''}`}>
                      <Lock size={18} className="lg-input__icon" aria-hidden />
                      <input
                        id="rg-repeatedPassword"
                        type={showPassword ? 'text' : 'password'}
                        autoComplete="new-password"
                        dir="ltr"
                        value={form.repeatedPassword}
                        onChange={set('repeatedPassword')}
                        {...aria('repeatedPassword')}
                      />
                      {form.repeatedPassword && form.repeatedPassword === form.password && <Check size={18} className="rg-match" aria-label="متطابقتان" />}
                    </div>
                  ))}
                </>
              )}

              {step === 2 && (
                <>
                  <div className="lg-field">
                    <span className="rg-label">صورة جواز السفر</span>
                    {!passport ? (
                      <div
                        className={`rg-drop ${dragging ? 'is-over' : ''} ${errors.passport ? 'is-invalid' : ''}`}
                        onDragOver={(e) => { e.preventDefault(); setDragging(true); }}
                        onDragLeave={() => setDragging(false)}
                        onDrop={onDrop}
                      >
                        {preparing ? (
                          <p className="rg-drop__busy"><Loader2 size={22} className="lg-spin" aria-hidden /> نجهّز الصورة…</p>
                        ) : (
                          <>
                            <span className="rg-drop__icon" aria-hidden><FileText size={26} /></span>
                            <p className="rg-drop__title">صفحة البيانات في جوازك، كاملة وواضحة</p>
                            <div className="rg-drop__actions">
                              <button type="button" className="rg-drop__btn rg-drop__btn--cam" onClick={() => cameraRef.current?.click()} data-field="passport">
                                <Camera size={18} aria-hidden /> صوّر الجواز
                              </button>
                              <button type="button" className="rg-drop__btn" onClick={() => fileRef.current?.click()}>
                                <ImagePlus size={18} aria-hidden /> اختر صورة
                              </button>
                            </div>
                            <p className="rg-drop__note">أو اسحب الصورة إلى هنا · حتى 10 MB</p>
                          </>
                        )}
                      </div>
                    ) : (
                      <div className="rg-file">
                        <img src={preview} alt="صورة جواز السفر التي اخترتها" />
                        <div className="rg-file__text">
                          <b><Check size={16} aria-hidden /> الصورة جاهزة</b>
                          <small>{sizeText(passport.size)} · تأكد أن البيانات مقروءة</small>
                          <div className="rg-file__actions">
                            <button type="button" onClick={() => fileRef.current?.click()}>تغيير</button>
                            <button type="button" className="is-danger" onClick={removePassport}><Trash2 size={14} aria-hidden /> حذف</button>
                          </div>
                        </div>
                      </div>
                    )}
                    <input ref={fileRef} type="file" accept="image/*" hidden onChange={(e) => pickFile(e.target.files?.[0])} />
                    <input ref={cameraRef} type="file" accept="image/*" capture="environment" hidden onChange={(e) => pickFile(e.target.files?.[0])} />
                    {err('passport')}
                    <p className="rg-private"><ShieldCheck size={16} aria-hidden /> يراها فريق التوثيق فقط، لنتأكد أن الحساب لك. نراجعها عادة خلال يوم عمل.</p>
                  </div>

                  <div className="lg-field">
                    {!refOpen ? (
                      <button type="button" className="rg-ref-open" onClick={() => setRefOpen(true)}><Gift size={16} aria-hidden /> عندك كود دعوة من صديق؟</button>
                    ) : (
                      <>
                        <label htmlFor="rg-ref" className="rg-label">كود الدعوة <small>(اختياري)</small></label>
                        <div className="lg-input">
                          <Gift size={18} className="lg-input__icon" aria-hidden />
                          <input id="rg-ref" dir="ltr" value={refCode} maxLength={8} autoCapitalize="characters" autoComplete="off" spellCheck={false}
                            onChange={(e) => setRefCode(e.target.value.toUpperCase())} placeholder="ABC234" aria-describedby="rg-ref-note" />
                        </div>
                        <p id="rg-ref-note" className="rg-hint">
                          {refOk ? <>✓ دعاك <b><bdi>{refInfo?.name}</bdi></b>، وتحصل على {usd(refInfo?.welcomePoints || 0)} هدية</>
                            : refInfo && refInfo.code === cleanCode(refCode) ? 'هذا الكود غير صحيح. تأكد منه أو اتركه فارغاً.'
                              : 'اكتب الكود الذي أرسله لك صديقك، أو اتركه فارغاً.'}
                        </p>
                      </>
                    )}
                  </div>

                  <div className="lg-field">
                    <label className={`rg-terms ${errors.terms ? 'is-invalid' : ''}`}>
                      <input
                        type="checkbox"
                        checked={terms}
                        onChange={(e) => { setTerms(e.target.checked); if (errors.terms) setErrors((x) => ({ ...x, terms: undefined })); }}
                        {...aria('terms')}
                      />
                      <span className="rg-terms__box" aria-hidden><Check size={14} strokeWidth={3} /></span>
                      <span>
                        قرأت <button type="button" className="rg-terms__link" onClick={() => setTermsOpen(true)}>شروط وسياسات اكسيوس</button> وأوافق عليها
                      </span>
                    </label>
                    {err('terms')}
                  </div>
                </>
              )}
            </div>

            {problem && (
              <div className="lg-problem" role="alert">
                <AlertCircle size={18} aria-hidden />
                <div>
                  <p>{problem}</p>
                  <a href={helpLink} target="_blank" rel="noreferrer"><TbBrandWhatsapp size={16} aria-hidden /> راسل المكتب على واتساب</a>
                </div>
              </div>
            )}

            <div className="rg-nav">
              {step > 0 && (
                <button type="button" className="rg-prev" onClick={() => setStep((step - 1) as Step)} disabled={busy}>
                  <ArrowRight size={18} aria-hidden /> رجوع
                </button>
              )}
              <button type="submit" className="lg-submit rg-next" disabled={busy || preparing || checking}>
                {busy
                  ? <><Loader2 size={19} className="lg-spin" aria-hidden /> ننشئ حسابك…</>
                  : checking ? <><Loader2 size={19} className="lg-spin" aria-hidden /> نتحقق من بياناتك…</>
                  : step < 2 ? <>التالي <ArrowLeft size={18} aria-hidden /></> : 'إنشاء الحساب'}
              </button>
            </div>
          </form>

          <p className="rg-login">لديك حساب؟ <Link to="/login">سجّل الدخول</Link></p>
        </div>
      </main>

      <aside className="lg-visual rg-visual" aria-label="ماذا تحصل عليه">
        <div className="lg-visual__inner">
          <p className="lg-visual__kicker">حساب مجاني في اكسيوس</p>
          <h2>اشترِ من الصين والإمارات، ونحن نوصلها لمدينتك.</h2>
          <ul>
            <li><span><BadgeCheck size={19} aria-hidden /></span><div><b>كود عميل خاص بك</b><small>يُكتب على طرودك، فنعرف أنها لك فور وصولها.</small></div></li>
            <li><span><MapPin size={19} aria-hidden /></span><div><b>عنوان باسمك في مخازننا</b><small>انسخه وأرسله للبائع من أول يوم.</small></div></li>
            <li><span><PackageSearch size={19} aria-hidden /></span><div><b>تتبّع حتى الاستلام</b><small>كل طرد بوزنه وصوره ورحلته.</small></div></li>
          </ul>
        </div>
      </aside>

      {/* The terms, read in place; agreeing here ticks the box */}
      {termsOpen && (
        <div className="rg-modal" role="dialog" aria-modal="true" aria-labelledby="rg-terms-title" onClick={() => setTermsOpen(false)}>
          <div className="rg-modal__card" onClick={(e) => e.stopPropagation()}>
            <div className="rg-modal__head">
              <h2 id="rg-terms-title">شروط وسياسات اكسيوس</h2>
              <button type="button" onClick={() => setTermsOpen(false)} aria-label="إغلاق"><X size={20} /></button>
            </div>
            <iframe src={TermsPdf} title="شروط وسياسات اكسيوس" />
            <div className="rg-modal__foot">
              <a href={TermsPdf} target="_blank" rel="noreferrer">فتح في صفحة كاملة</a>
              <span className="rg-grow" />
              <button type="button" className="rg-prev" onClick={() => setTermsOpen(false)}>إغلاق</button>
              <button type="button" className="lg-submit" onClick={() => { setTerms(true); setErrors((x) => ({ ...x, terms: undefined })); setTermsOpen(false); }}>
                <Check size={18} aria-hidden /> أوافق
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Register;
