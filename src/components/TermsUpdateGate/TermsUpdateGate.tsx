import { useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { CircularProgress, Dialog } from '@mui/material';
import { FileText } from 'lucide-react';
import api from '../../api';
import { setAccountData } from '../../actions/session';
import { User } from '../../models';
import { logout } from '../../utils/logout';
import { shouldAskForTerms } from '../../utils/termsGate';
import { TERMS_UPDATE_SUMMARY, TERMS_VERSION } from '../../containers/TermsAndPrivacy/terms';
import TermsPdf from '../../../public/terms.pdf';

// After the terms change, every customer agrees to the new version once before using the app again.
// The agreement (version, time, device) is recorded on the server, so it can be shown later who agreed
// to what. The only other way out is signing out.
const TermsUpdateGate = () => {
  const session: any = useSelector((state: any) => state.session);
  const account: User = session.account;
  const dispatch = useDispatch();
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  if (!shouldAskForTerms(account, TERMS_VERSION)) return null;

  const agree = async () => {
    setSaving(true);
    setError('');
    try {
      const res = await api.acceptTerms(TERMS_VERSION);
      setAccountData(res.data, session, dispatch);
    } catch (err: any) {
      // The server moved to other terms meanwhile: reload to get them
      if (err?.response?.data?.message === 'terms-version-outdated') { window.location.reload(); return; }
      setError('لم نتمكن من حفظ موافقتك، تأكد من الاتصال وحاول مرة أخرى.');
    }
    setSaving(false);
  };

  return (
    <Dialog open onClose={() => undefined} disableEscapeKeyDown fullWidth maxWidth="xs" aria-labelledby="terms-gate-title"
      // The text scrolls inside the window and the buttons stay at its bottom: on a small phone the whole
      // window was taller than the screen and the agree button was cut off (2026-11-27, Android)
      PaperProps={{ sx: { borderRadius: '20px', overflow: 'hidden', display: 'flex', flexDirection: 'column', m: 2, width: 'calc(100% - 32px)', maxHeight: 'calc(100dvh - 32px)' } }}>
      <div dir="rtl" lang="ar" style={{ flex: '1 1 auto', minHeight: 0, overflowY: 'auto', padding: '26px 24px 12px', textAlign: 'right' }}>
        <div style={{ width: 52, height: 52, borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#e8f5ee', color: '#0f8a5f', marginBottom: 16 }}>
          <FileText size={26} aria-hidden />
        </div>
        <h2 id="terms-gate-title" style={{ margin: '0 0 8px', fontSize: '1.15rem', fontWeight: 700, color: '#111827' }}>
          حدّثنا الشروط والسياسات
        </h2>
        <p style={{ margin: '0 0 12px', fontSize: '0.92rem', lineHeight: 1.7, color: '#4b5563' }}>
          للاستمرار في استخدام التطبيق، اقرأ الشروط الجديدة ووافق عليها. أهم ما تغيّر:
        </p>
        <ul style={{ margin: '0 0 14px', paddingRight: 18, fontSize: '0.88rem', lineHeight: 1.75, color: '#374151' }}>
          {TERMS_UPDATE_SUMMARY.map((line) => <li key={line}>{line}</li>)}
        </ul>
        <a href={TermsPdf} target="_blank" rel="noopener noreferrer"
          style={{ display: 'inline-flex', alignItems: 'center', gap: 6, fontSize: '0.9rem', fontWeight: 700, color: '#0f8a5f', textDecoration: 'underline' }}>
          اقرأ الشروط كاملة
        </a>

      </div>
      <div dir="rtl" lang="ar" style={{ flex: 'none', padding: '12px 24px 16px', borderTop: '1px solid #eef0f2', background: '#fff', textAlign: 'right' }}>
        {error && <p role="alert" style={{ margin: '0 0 10px', fontSize: '0.84rem', color: '#dc2626' }}>{error}</p>}

        <button type="button" disabled={saving} onClick={agree}
          style={{ width: '100%', marginTop: 0, padding: '12px 0', border: 0, borderRadius: 12, fontSize: '0.98rem', fontWeight: 700, color: '#fff', background: saving ? '#9ca3af' : '#16a34a', cursor: saving ? 'not-allowed' : 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: 46 }}>
          {saving ? <CircularProgress size={18} sx={{ color: '#fff' }} /> : 'قرأت الشروط وأوافق عليها'}
        </button>
        <button type="button" onClick={logout}
          style={{ display: 'block', margin: '8px auto 0', padding: '6px 10px', border: 0, background: 'transparent', fontSize: '0.84rem', fontWeight: 600, color: '#6b7280', cursor: 'pointer', textDecoration: 'underline' }}>
          تسجيل الخروج
        </button>
      </div>
    </Dialog>
  );
};

export default TermsUpdateGate;
