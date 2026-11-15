import { FormEvent, useEffect, useRef, useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import {
  AlertCircle, ArrowRight, Check, CheckCircle2, Eye, EyeOff, KeyRound, Link2Off, Loader2, Lock, Mail, MailCheck, RotateCcw,
} from 'lucide-react';
import { TbBrandWhatsapp } from 'react-icons/tb';
import api from '../../api';
import { OFFICES, whatsappLink } from '../../constants/contact';
import { passwordStrength } from '../../utils/password';
import logo from '../../../public/images/exios-logo.png';
import '../Login/login.css';
import '../Register/register.css';
import './reset.css';

const isEmail = (v: string) => /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(v.trim());
const RESEND_AFTER = 60; // seconds before the link can be sent again

// The inbox to open for the common providers, so the customer goes straight to the email
const inboxFor = (email: string) => {
  const domain = email.split('@')[1]?.toLowerCase() || '';
  if (domain === 'gmail.com' || domain === 'googlemail.com') return { name: 'Gmail', url: 'https://mail.google.com/mail/u/0/#inbox' };
  if (/^(hotmail|outlook|live|msn)\./.test(domain)) return { name: 'Outlook', url: 'https://outlook.live.com/mail/' };
  if (/^yahoo\./.test(domain)) return { name: 'Yahoo', url: 'https://mail.yahoo.com/' };
  if (domain === 'icloud.com' || domain === 'me.com') return { name: 'iCloud', url: 'https://www.icloud.com/mail' };
  return null;
};

// The email this browser last signed in with, to save typing it again
const lastEmail = () => {
  try {
    const v = JSON.parse(localStorage.getItem('exios:last-login') || '{}');
    return v.method === 'email' && typeof v.username === 'string' ? v.username : '';
  } catch { return ''; }
};

const helpLink = whatsappLink(OFFICES[0].whatsapp, 'مرحباً، لا أستطيع استعادة كلمة المرور لحسابي في اكسيوس');

/* Forgotten password, two pages in one: ask for the link by email, and (opened from that link)
   choose the new password. Light: one small card, nothing around it. */
const ResetPasswordPage = () => {
  const [params] = useSearchParams();
  const token = params.get('token');
  const userId = params.get('id');
  return (
    <div dir="rtl" lang="ar" className="lg rs">
      <main className="lg-side">
        <div className="lg-top">
          <Link to="/login" className="lg-back"><ArrowRight size={17} aria-hidden /> تسجيل الدخول</Link>
        </div>
        <div className="lg-box rs-box">
          <img className="lg-logo" src={logo} alt="اكسيوس" width={104} height={44} />
          {token && userId ? <NewPassword token={token} userId={userId} /> : <AskForLink />}
        </div>
      </main>
    </div>
  );
};

/* ---------- 1. Send me a link ---------- */
const AskForLink = () => {
  const [email, setEmail] = useState(lastEmail);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [sentTo, setSentTo] = useState('');
  const [wait, setWait] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => { inputRef.current?.focus(); }, []);
  useEffect(() => {
    if (!wait) return undefined;
    const t = window.setTimeout(() => setWait((w) => w - 1), 1000);
    return () => window.clearTimeout(t);
  }, [wait]);

  const send = async (e?: FormEvent) => {
    e?.preventDefault();
    const value = email.trim();
    if (!value) { setError('اكتب بريدك الإلكتروني.'); inputRef.current?.focus(); return; }
    if (!isEmail(value)) { setError('البريد غير صحيح. اكتبه مثل name@gmail.com'); inputRef.current?.focus(); return; }
    setBusy(true);
    setError('');
    try {
      const res: any = await api.getPasswordToken({ email: value });
      if (!res) throw new Error('offline'); // the api helper returns nothing when there is no connection
      setSentTo(value);
      setWait(RESEND_AFTER);
    } catch (err: any) {
      const code = err?.data?.message;
      if (code === 'user-not-found') setError('لا يوجد حساب بهذا البريد. تأكد منه، أو أنشئ حساباً جديداً.');
      else if (code === 'too-many-requests') setError('أرسلنا عدة روابط لهذا البريد خلال الساعة الأخيرة. استعمل آخر رابط وصلك، أو حاول بعد ساعة.');
      else if (!err?.data) setError('تعذر الاتصال. تأكد من الإنترنت ثم حاول مرة أخرى.');
      else setError('لم نستطع إرسال الرابط الآن. حاول بعد قليل.');
      if (!sentTo) inputRef.current?.focus();
    } finally {
      setBusy(false);
    }
  };

  if (sentTo) {
    const inbox = inboxFor(sentTo);
    return (
      <div className="rs-done" role="status">
        <span className="rs-icon is-ok" aria-hidden><MailCheck size={26} /></span>
        <h1>تفقّد بريدك</h1>
        <p className="lg-lead">أرسلنا رابط تعيين كلمة المرور إلى<br /><bdi dir="ltr" className="rs-email">{sentTo}</bdi></p>
        <ul className="rs-tips">
          <li>الرابط صالح لمدة ساعة واحدة.</li>
          <li>لم يصل؟ انظر في مجلد Spam أو Junk.</li>
        </ul>
        {inbox && (
          <a className="lg-submit rs-btn" href={inbox.url} target="_blank" rel="noreferrer"><Mail size={18} aria-hidden /> افتح {inbox.name}</a>
        )}
        {error && <p className="rg-err rs-center" role="alert">{error}</p>}
        <div className="rs-row">
          <button type="button" className="rs-link" onClick={() => send()} disabled={busy || wait > 0}>
            {busy ? <Loader2 size={15} className="lg-spin" aria-hidden /> : <RotateCcw size={15} aria-hidden />}
            {wait > 0 ? `إعادة الإرسال بعد ${wait} ث` : 'أرسل الرابط مرة أخرى'}
          </button>
          <span aria-hidden>·</span>
          <button type="button" className="rs-link" onClick={() => { setSentTo(''); setError(''); setWait(0); }}>بريد آخر</button>
        </div>
      </div>
    );
  }

  return (
    <>
      <span className="rs-icon" aria-hidden><KeyRound size={24} /></span>
      <h1>نسيت كلمة المرور؟</h1>
      <p className="lg-lead">اكتب بريدك، ونرسل لك رابطاً تختار منه كلمة مرور جديدة.</p>

      <form className="lg-form rs-form" onSubmit={send} noValidate>
        <div className="lg-field">
          <label htmlFor="rs-email">البريد الإلكتروني</label>
          <div className={`lg-input ${error ? 'is-invalid' : ''}`}>
            <Mail size={18} className="lg-input__icon" aria-hidden />
            <input
              ref={inputRef}
              id="rs-email"
              type="email"
              inputMode="email"
              autoComplete="email"
              autoCapitalize="none"
              spellCheck={false}
              dir="ltr"
              placeholder="name@example.com"
              value={email}
              onChange={(e) => { setEmail(e.target.value); if (error) setError(''); }}
              aria-invalid={!!error}
              aria-describedby={error ? 'rs-error' : undefined}
              disabled={busy}
            />
          </div>
          {error && <p id="rs-error" className="rg-err" role="alert">{error}</p>}
        </div>
        <button type="submit" className="lg-submit" disabled={busy}>
          {busy ? <><Loader2 size={19} className="lg-spin" aria-hidden /> جارٍ الإرسال…</> : 'أرسل الرابط'}
        </button>
      </form>

      <p className="lg-help">
        سجّلت برقم الهاتف أو لا تصل لبريدك؟ <a href={helpLink} target="_blank" rel="noreferrer"><TbBrandWhatsapp size={15} aria-hidden /> راسلنا على واتساب</a>
      </p>
    </>
  );
};

/* ---------- 2. Choose the new password (opened from the emailed link) ---------- */
const NewPassword = ({ token, userId }: { token: string, userId: string }) => {
  const [password, setPassword] = useState('');
  const [repeat, setRepeat] = useState('');
  const [show, setShow] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<{ field?: 'password' | 'repeat', text: string } | null>(null);
  const [state, setState] = useState<'form' | 'done' | 'expired'>('form');
  const passRef = useRef<HTMLInputElement>(null);
  const repeatRef = useRef<HTMLInputElement>(null);
  const navigate = useNavigate();
  const pw = passwordStrength(password);

  useEffect(() => { passRef.current?.focus(); }, []);
  // Done: on to sign in by itself after a moment
  useEffect(() => {
    if (state !== 'done') return undefined;
    const t = window.setTimeout(() => navigate('/login', { replace: true }), 4000);
    return () => window.clearTimeout(t);
  }, [state, navigate]);

  const save = async (e: FormEvent) => {
    e.preventDefault();
    if (password.length < 6) { setError({ field: 'password', text: 'كلمة المرور 6 أحرف على الأقل.' }); passRef.current?.focus(); return; }
    if (repeat !== password) { setError({ field: 'repeat', text: 'كلمتا المرور غير متطابقتين.' }); repeatRef.current?.focus(); return; }
    setBusy(true);
    setError(null);
    try {
      const res: any = await api.resetNewPassword({ userId, password, token });
      if (!res) throw new Error('offline');
      setState('done');
    } catch (err: any) {
      const code = err?.data?.message;
      if (!err?.data) setError({ text: 'تعذر الاتصال. تأكد من الإنترنت ثم حاول مرة أخرى.' });
      else if (code === 'token-not-found' || code === 'invalid-token' || err?.status === 404) setState('expired');
      else setError({ text: 'لم تُحفظ كلمة المرور. حاول مرة أخرى بعد قليل.' });
    } finally {
      setBusy(false);
    }
  };

  if (state === 'done') {
    return (
      <div className="rs-done" role="status">
        <span className="rs-icon is-ok" aria-hidden><CheckCircle2 size={26} /></span>
        <h1>تم تغيير كلمة المرور</h1>
        <p className="lg-lead">ادخل الآن بكلمة المرور الجديدة. ننقلك لصفحة الدخول…</p>
        <Link to="/login" replace className="lg-submit rs-btn">تسجيل الدخول</Link>
      </div>
    );
  }

  if (state === 'expired') {
    return (
      <div className="rs-done" role="alert">
        <span className="rs-icon is-warn" aria-hidden><Link2Off size={24} /></span>
        <h1>انتهت صلاحية الرابط</h1>
        <p className="lg-lead">الرابط صالح لساعة واحدة ويُستعمل مرة واحدة. اطلب رابطاً جديداً.</p>
        <Link to="/reset-password" replace className="lg-submit rs-btn">اطلب رابطاً جديداً</Link>
      </div>
    );
  }

  return (
    <>
      <span className="rs-icon" aria-hidden><Lock size={24} /></span>
      <h1>كلمة مرور جديدة</h1>
      <p className="lg-lead">اختر كلمة مرور لم تستعملها من قبل.</p>

      <form className="lg-form rs-form" onSubmit={save} noValidate>
        <div className="lg-field">
          <label htmlFor="rs-pass">كلمة المرور الجديدة</label>
          <div className={`lg-input ${error?.field === 'password' ? 'is-invalid' : ''}`}>
            <Lock size={18} className="lg-input__icon" aria-hidden />
            <input
              ref={passRef}
              id="rs-pass"
              type={show ? 'text' : 'password'}
              autoComplete="new-password"
              dir="ltr"
              value={password}
              onChange={(e) => { setPassword(e.target.value); if (error) setError(null); }}
              aria-invalid={error?.field === 'password'}
              disabled={busy}
            />
            <button type="button" className="lg-eye" onClick={() => setShow((v) => !v)} aria-label={show ? 'إخفاء كلمة المرور' : 'إظهار كلمة المرور'} aria-pressed={show}>
              {show ? <EyeOff size={18} /> : <Eye size={18} />}
            </button>
          </div>
          {password && (
            <div className={`rg-meter is-${pw.score}`} aria-live="polite">
              <span className="rg-meter__bars" aria-hidden><i /><i /><i /><i /></span>
              <span>كلمة مرور {pw.label}</span>
            </div>
          )}
        </div>

        <div className="lg-field">
          <label htmlFor="rs-repeat">أعد كتابتها</label>
          <div className={`lg-input ${error?.field === 'repeat' ? 'is-invalid' : repeat && repeat === password ? 'is-ok' : ''}`}>
            <Lock size={18} className="lg-input__icon" aria-hidden />
            <input
              ref={repeatRef}
              id="rs-repeat"
              type={show ? 'text' : 'password'}
              autoComplete="new-password"
              dir="ltr"
              value={repeat}
              onChange={(e) => { setRepeat(e.target.value); if (error) setError(null); }}
              aria-invalid={error?.field === 'repeat'}
              disabled={busy}
            />
            {repeat && repeat === password && <Check size={18} className="rg-match" aria-label="متطابقتان" />}
          </div>
        </div>

        {error && (
          <p className={error.field ? 'rg-err' : 'lg-problem'} role="alert">
            {!error.field && <AlertCircle size={18} aria-hidden />} {error.text}
          </p>
        )}

        <button type="submit" className="lg-submit" disabled={busy}>
          {busy ? <><Loader2 size={19} className="lg-spin" aria-hidden /> جارٍ الحفظ…</> : 'حفظ كلمة المرور'}
        </button>
      </form>
    </>
  );
};

export default ResetPasswordPage;
