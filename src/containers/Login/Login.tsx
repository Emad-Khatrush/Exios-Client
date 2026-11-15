import { FormEvent, KeyboardEvent, useEffect, useRef, useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useDispatch } from 'react-redux';
import {
  AlertCircle, ArrowRight, Eye, EyeOff, Loader2, Lock, Mail, MapPin, PackageSearch, Phone, Receipt, UserPlus,
} from 'lucide-react';
import { TbBrandWhatsapp } from 'react-icons/tb';
import api from '../../api';
import { apiErrorsTypes } from '../../constants/errorTypes';
import { LOGIN, STATUS_SUCCESS } from '../../constants/actions';
import { OFFICES, whatsappLink } from '../../constants/contact';
import { addAuthInterceptor } from '../../utils/AuthInterceptor';
import PhoneField from '../../components/PhoneField/PhoneField';
import { DEFAULT_COUNTRY, countryByIso, phoneForServer, phoneProblem } from '../../utils/phone';
import logo from '../../../public/images/exios-logo.png';
import './login.css';

type Method = 'email' | 'phone';

// The last way this browser signed in, so the customer does not type it again (never the password)
const LAST_KEY = 'exios:last-login';
const readLast = (): { method: Method, username: string, iso: string } => {
  try {
    const v = JSON.parse(localStorage.getItem(LAST_KEY) || '{}');
    return {
      method: v.method === 'phone' ? 'phone' : 'email',
      username: typeof v.username === 'string' ? v.username : '',
      iso: typeof v.iso === 'string' ? countryByIso(v.iso).iso : DEFAULT_COUNTRY,
    };
  } catch {
    return { method: 'email', username: '', iso: DEFAULT_COUNTRY };
  }
};
const isEmail = (v: string) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v.trim());

type Problem = { field?: 'username' | 'password', text: string, help?: boolean, reset?: boolean } | null;

const Login = () => {
  const last = readLast();
  const [method, setMethod] = useState<Method>(last.method);
  const [username, setUsername] = useState(last.username);
  // The phone's country: Libya unless they signed in from another country's number before
  const [iso, setIso] = useState(last.iso);
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [capsLock, setCapsLock] = useState(false);
  const [busy, setBusy] = useState(false);
  const [problem, setProblem] = useState<Problem>(null);
  const [shake, setShake] = useState(0);

  const userRef = useRef<HTMLInputElement>(null);
  const passRef = useRef<HTMLInputElement>(null);
  const navigate = useNavigate();
  const location = useLocation();
  const dispatch = useDispatch();
  // Sent here from a page that needs an account: go back there afterwards
  const from = (location.state as any)?.from?.pathname as string | undefined;

  // Start where there is something left to type
  useEffect(() => {
    (username ? passRef : userRef).current?.focus();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const switchMethod = (m: Method) => {
    if (m === method) return;
    setMethod(m);
    setUsername('');
    setIso(DEFAULT_COUNTRY);
    setProblem(null);
    window.setTimeout(() => userRef.current?.focus(), 0);
  };

  const fail = (p: NonNullable<Problem>) => {
    setProblem(p);
    setShake((n) => n + 1);
    if (p.field === 'password') { passRef.current?.focus(); passRef.current?.select(); }
    if (p.field === 'username') userRef.current?.focus();
  };

  const onCaps = (e: KeyboardEvent<HTMLInputElement>) => setCapsLock(e.getModifierState?.('CapsLock') || false);

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    if (busy) return;
    const id = method === 'phone' ? phoneForServer(iso, username) : username.trim().toLowerCase();

    if (!username.trim()) {
      fail({ field: 'username', text: method === 'phone' ? 'اكتب رقم هاتفك.' : 'اكتب بريدك الإلكتروني.' });
      return;
    }
    if (method === 'phone' && phoneProblem(iso, username)) {
      fail({ field: 'username', text: phoneProblem(iso, username) });
      return;
    }
    if (method === 'email' && !isEmail(username)) {
      fail({ field: 'username', text: 'البريد الإلكتروني غير صحيح. تأكد من كتابته مثل name@gmail.com' });
      return;
    }
    if (!password) {
      fail({ field: 'password', text: 'اكتب كلمة المرور.' });
      return;
    }

    setBusy(true);
    setProblem(null);
    try {
      const res: any = await api.login({ username: id, password, loginMethod: method }, 'client');
      const data = res.data;
      addAuthInterceptor(data.token);
      localStorage.setItem('authToken', data.token);
      localStorage.setItem('user', JSON.stringify(data));
      try { localStorage.setItem(LAST_KEY, JSON.stringify({ method, username: username.trim(), iso })); } catch { /* storage full or blocked */ }
      dispatch({ payload: data, status: STATUS_SUCCESS, type: LOGIN });
      navigate(from && from !== '/login' ? from : '/home', { replace: true });
    } catch (err: any) {
      setBusy(false);
      const code = err?.data?.message;
      if (code === 'user-not-found') {
        fail({ field: 'username', text: method === 'phone' ? 'لا يوجد حساب بهذا الرقم. تأكد منه، أو جرّب الدخول بالبريد الإلكتروني.' : 'لا يوجد حساب بهذا البريد. تأكد منه، أو جرّب الدخول برقم الهاتف.' });
      } else if (code === 'invalid-credentials') {
        fail({ field: 'password', text: 'كلمة المرور غير صحيحة. حاول مرة أخرى أو اضغط «نسيت كلمة المرور؟».' });
      } else if (code === 'account-locked') {
        // 10 wrong passwords: the server pauses sign-in to this account for 15 minutes
        fail({ text: 'أدخلت كلمة مرور خاطئة 10 مرات، فأوقفنا الدخول لهذا الحساب 15 دقيقة لحمايته. حاول بعدها، أو غيّر كلمة المرور من «نسيت كلمة المرور؟» لتدخل فوراً.', reset: true });
      } else if (code === 'too-many-requests') {
        fail({ text: 'محاولات دخول كثيرة من هذا الجهاز. انتظر 10 دقائق ثم حاول مرة أخرى.' });
      } else if (code === 'user-subscription-canceled') {
        fail({ text: 'هذا الحساب موقوف. تواصل مع المكتب لمعرفة السبب وإعادة تفعيله.', help: true });
      } else if (!err?.status && !code) {
        fail({ text: 'تعذر الاتصال. تأكد من الإنترنت ثم حاول مرة أخرى.' });
      } else {
        fail({ text: apiErrorsTypes[code] || 'حدث خطأ. حاول مرة أخرى بعد قليل.', help: true });
      }
    }
  };

  const usernameInvalid = problem?.field === 'username';
  const passwordInvalid = problem?.field === 'password';
  const helpLink = whatsappLink(OFFICES[0].whatsapp, 'مرحباً، عندي مشكلة في تسجيل الدخول إلى حسابي في اكسيوس');

  return (
    <div dir="rtl" lang="ar" className="lg">
      {/* The form */}
      <main className="lg-side">
        <div className="lg-top">
          <Link to="/" className="lg-back"><ArrowRight size={17} aria-hidden /> الرئيسية</Link>
        </div>

        <div className="lg-box">
          <img className="lg-logo" src={logo} alt="اكسيوس" width={132} height={56} />
          <h1>أهلاً بعودتك</h1>
          <p className="lg-lead">سجّل الدخول لتتابع شحناتك وفواتيرك وعنوانك في مخازننا.</p>

          <div className="lg-switch" role="radiogroup" aria-label="طريقة الدخول">
            <button type="button" role="radio" aria-checked={method === 'email'} className={method === 'email' ? 'is-on' : ''} onClick={() => switchMethod('email')}>
              <Mail size={17} aria-hidden /> البريد الإلكتروني
            </button>
            <button type="button" role="radio" aria-checked={method === 'phone'} className={method === 'phone' ? 'is-on' : ''} onClick={() => switchMethod('phone')}>
              <Phone size={17} aria-hidden /> رقم الهاتف
            </button>
            <span className="lg-switch__thumb" aria-hidden />
          </div>

          <form key={shake} className={`lg-form ${shake ? 'is-shake' : ''}`} onSubmit={submit} noValidate>
            <div className="lg-field">
              <label htmlFor="lg-user">{method === 'phone' ? 'رقم الهاتف' : 'البريد الإلكتروني'}</label>
              {method === 'phone' ? (
                <PhoneField
                  id="lg-user"
                  iso={iso}
                  number={username}
                  onChange={(nextIso, nextNumber) => { setIso(nextIso); setUsername(nextNumber); if (usernameInvalid) setProblem(null); }}
                  inputRef={userRef}
                  invalid={usernameInvalid}
                  describedBy={usernameInvalid ? 'lg-problem' : undefined}
                  disabled={busy}
                />
              ) : (
                <div className={`lg-input ${usernameInvalid ? 'is-invalid' : ''}`}>
                  <Mail size={18} className="lg-input__icon" aria-hidden />
                  <input
                    ref={userRef}
                    id="lg-user"
                    type="email"
                    inputMode="email"
                    autoComplete="username"
                    autoCapitalize="none"
                    spellCheck={false}
                    dir="ltr"
                    placeholder="name@example.com"
                    value={username}
                    onChange={(e) => { setUsername(e.target.value); if (usernameInvalid) setProblem(null); }}
                    aria-invalid={usernameInvalid}
                    aria-describedby={usernameInvalid ? 'lg-problem' : undefined}
                    disabled={busy}
                  />
                </div>
              )}
            </div>

            <div className="lg-field">
              <div className="lg-field__row">
                <label htmlFor="lg-pass">كلمة المرور</label>
                <Link to="/reset-password" className="lg-link">نسيت كلمة المرور؟</Link>
              </div>
              <div className={`lg-input ${passwordInvalid ? 'is-invalid' : ''}`}>
                <Lock size={18} className="lg-input__icon" aria-hidden />
                <input
                  ref={passRef}
                  id="lg-pass"
                  type={showPassword ? 'text' : 'password'}
                  autoComplete="current-password"
                  dir="ltr"
                  value={password}
                  onChange={(e) => { setPassword(e.target.value); if (passwordInvalid) setProblem(null); }}
                  onKeyUp={onCaps}
                  onKeyDown={onCaps}
                  onBlur={() => setCapsLock(false)}
                  aria-invalid={passwordInvalid}
                  aria-describedby={passwordInvalid ? 'lg-problem' : capsLock ? 'lg-caps' : undefined}
                  disabled={busy}
                />
                <button
                  type="button"
                  className="lg-eye"
                  onClick={() => setShowPassword((v) => !v)}
                  aria-label={showPassword ? 'إخفاء كلمة المرور' : 'إظهار كلمة المرور'}
                  aria-pressed={showPassword}
                >
                  {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
              {capsLock && <p id="lg-caps" className="lg-caps">زر الأحرف الكبيرة (Caps Lock) مفعّل</p>}
            </div>

            {problem && (
              <div id="lg-problem" className="lg-problem" role="alert">
                <AlertCircle size={18} aria-hidden />
                <div>
                  <p>{problem.text}</p>
                  {problem.reset && <Link to="/reset-password">تغيير كلمة المرور الآن</Link>}
                  {problem.help && (
                    <a href={helpLink} target="_blank" rel="noreferrer"><TbBrandWhatsapp size={16} aria-hidden /> راسل المكتب على واتساب</a>
                  )}
                </div>
              </div>
            )}

            <button type="submit" className="lg-submit" disabled={busy}>
              {busy ? <><Loader2 size={19} className="lg-spin" aria-hidden /> جارٍ الدخول…</> : 'تسجيل الدخول'}
            </button>
          </form>

          <div className="lg-or"><span>جديد في اكسيوس؟</span></div>
          <Link to="/signup" className="lg-signup"><UserPlus size={18} aria-hidden /> إنشاء حساب جديد</Link>

          <p className="lg-help">
            مشكلة في الدخول؟ <a href={helpLink} target="_blank" rel="noreferrer">راسلنا على واتساب</a>
          </p>
        </div>
      </main>

      {/* What the account is for (wide screens) */}
      <aside className="lg-visual" aria-label="ماذا تجد في حسابك">
        <div className="lg-visual__inner">
          <p className="lg-visual__kicker">اكسيوس للشحن وخدمات الشراء</p>
          <h2>من مخازننا في الصين والإمارات حتى تستلمها في ليبيا.</h2>
          <ul>
            <li><span><PackageSearch size={19} aria-hidden /></span><div><b>تتبّع كل طرد</b><small>وزنه وصوره ورحلته، ومتى يصبح جاهزاً للاستلام.</small></div></li>
            <li><span><MapPin size={19} aria-hidden /></span><div><b>عنوانك في مخازننا</b><small>جاهز للنسخ والإرسال للبائع، مع علامة الشحن.</small></div></li>
            <li><span><Receipt size={19} aria-hidden /></span><div><b>فواتير الشراء</b><small>كل ما اشتريناه لك، بالمبلغ والحالة، وقابلة للطباعة.</small></div></li>
          </ul>
        </div>
      </aside>
    </div>
  );
};

export default Login;
