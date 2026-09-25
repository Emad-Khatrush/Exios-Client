import { useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { Link } from 'react-router-dom';
import { CircularProgress, Dialog } from '@mui/material';
import { AiOutlineCloudUpload, AiOutlineCloseCircle, AiOutlineClockCircle, AiOutlineFileImage, AiOutlineReload } from 'react-icons/ai';
import api from '../../api';
import { setAccountData } from '../../actions/session';
import { User } from '../../models';

type Mode = 'mustUpload' | 'rejected' | 'pendingReReview';

// Shared with PrivateRoute so it can suppress other blocking dialogs (popup ads)
// while this gate is up, instead of stacking two non-dismissible dialogs.
export const getPassportGateMode = (account?: User): Mode | null => {
  const passport = account?.passportVerification;
  const hasNeverUploaded = !passport?.imageUrl;
  const isRejected = passport?.status === 'rejected';
  const isPendingReReview = passport?.status === 'pending' && !!passport?.wasRejected;
  return hasNeverUploaded ? 'mustUpload' : isRejected ? 'rejected' : isPendingReReview ? 'pendingReReview' : null;
};

const STATUS_STYLE: Record<Mode, { bg: string, fg: string, icon: JSX.Element }> = {
  mustUpload: { bg: '#eaf2fe', fg: '#1d4ed8', icon: <AiOutlineCloudUpload size={26} /> },
  rejected: { bg: '#fdecea', fg: '#dc2626', icon: <AiOutlineCloseCircle size={26} /> },
  pendingReReview: { bg: '#fef3e2', fg: '#d97706', icon: <AiOutlineClockCircle size={26} /> },
};

const TITLES: Record<Mode, string> = {
  mustUpload: 'يرجى توثيق جواز سفرك',
  rejected: 'تم رفض التحقق من جواز السفر',
  pendingReReview: 'صورة جواز السفر قيد المراجعة',
};

// Blocks the whole app behind a non-dismissible dialog in three cases:
// - the account never had a passport uploaded (legacy accounts from before this feature)
// - the passport was rejected (must re-upload)
// - the re-upload is itself still pending review (wasRejected stays true through that cycle)
// A first-time pending passport (never rejected) does NOT block, customers can use the app
// while that first submission is reviewed.
const PassportVerificationGate = () => {
  const account: User = useSelector((state: any) => state.session.account);
  const session: any = useSelector((state: any) => state.session);
  const dispatch = useDispatch();

  const [file, setFile] = useState<File | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [error, setError] = useState('');

  const passport = account?.passportVerification;
  const mode = getPassportGateMode(account);
  const needsUploadAction = mode === 'mustUpload' || mode === 'rejected';

  const submitUpload = async () => {
    if (!file) return;
    try {
      setIsUploading(true);
      setError('');
      const res = await api.uploadPassport(file);
      setAccountData(res.data, session, dispatch);
      setFile(null);
    } catch (err) {
      setError('حدث خطأ اثناء رفع الصورة، الرجاء المحاولة مرة اخرى');
    }
    setIsUploading(false);
  }

  const refreshStatus = async () => {
    try {
      setIsRefreshing(true);
      const res = await api.getMyAccount();
      setAccountData(res.data, session, dispatch);
    } catch (err) {
      // ignore, the button stays available to try again
    }
    setIsRefreshing(false);
  }

  const logout = () => {
    localStorage.removeItem('user');
    localStorage.removeItem('authToken');
    window.location.replace('/login');
  }

  if (!mode) return null;
  const style = STATUS_STYLE[mode];

  return (
    <Dialog
      open
      onClose={() => {}}
      disableEscapeKeyDown
      fullWidth
      maxWidth="xs"
      PaperProps={{ sx: { borderRadius: '20px', overflow: 'hidden' } }}
    >
      <div dir="rtl" style={{ padding: '28px 28px 24px', textAlign: 'right' }}>
        <div
          style={{
            width: 52,
            height: 52,
            borderRadius: '50%',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            background: style.bg,
            color: style.fg,
            marginBottom: 18,
          }}
        >
          {style.icon}
        </div>

        <h2 style={{ margin: '0 0 10px', fontSize: '1.15rem', fontWeight: 700, color: '#111827' }}>
          {TITLES[mode]}
        </h2>

        {mode === 'mustUpload' && (
          <p style={{ margin: '0 0 18px', fontSize: '0.92rem', lineHeight: 1.7, color: '#4b5563' }}>
            حسابك لم يوثق بعد، يرجى رفع صورة واضحة لجواز سفرك للاستمرار في استخدام التطبيق.
          </p>
        )}

        {mode === 'rejected' && (
          <>
            <p
              style={{
                margin: '0 0 14px',
                fontSize: '0.88rem',
                lineHeight: 1.6,
                color: style.fg,
                background: style.bg,
                borderRadius: 10,
                padding: '10px 14px',
              }}
            >
              سبب الرفض: {passport?.rejectionReason || 'لم يتم تحديد سبب'}
            </p>
            <p style={{ margin: '0 0 18px', fontSize: '0.92rem', lineHeight: 1.7, color: '#4b5563' }}>
              لا يمكنك استخدام التطبيق حتى تقوم برفع صورة واضحة وصحيحة لجواز سفرك مرة اخرى وتتم الموافقة عليها.
            </p>
          </>
        )}

        {mode === 'pendingReReview' && (
          <p style={{ margin: '0 0 18px', fontSize: '0.92rem', lineHeight: 1.7, color: '#4b5563' }}>
            تم استلام صورة جواز سفرك الجديدة وهي الان قيد المراجعة من قبل فريقنا، لا يمكنك استخدام التطبيق حتى تتم الموافقة عليها.
          </p>
        )}

        {needsUploadAction && (
          <>
            <label
              htmlFor="passport-gate-file"
              style={{
                position: 'relative',
                display: 'flex',
                alignItems: 'center',
                gap: 10,
                border: `1.5px dashed ${file ? '#16a34a' : '#d1d5db'}`,
                background: file ? '#f0fdf4' : '#fafafa',
                borderRadius: 12,
                padding: '14px 16px',
                cursor: isUploading ? 'not-allowed' : 'pointer',
                transition: 'border-color 0.15s, background-color 0.15s',
              }}
            >
              <AiOutlineFileImage size={20} color={file ? '#16a34a' : '#6b7280'} />
              <span style={{ fontSize: '0.88rem', color: file ? '#15803d' : '#6b7280', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                {file ? file.name : 'اضغط هنا لاختيار صورة جواز السفر'}
              </span>
              {/* The input is stretched transparently over the whole box instead of being `hidden`
                  (display:none): some mobile browsers (older iOS Safari, in-app browsers like
                  Facebook/Instagram/WhatsApp) don't open the picker for a display:none input via
                  its label, so the tap must land on the real input itself. */}
              <input
                id="passport-gate-file"
                type="file"
                accept="image/*"
                disabled={isUploading}
                onClick={(e) => { e.currentTarget.value = ''; }}
                onChange={(e) => setFile(e.target.files?.[0] || null)}
                style={{
                  position: 'absolute',
                  inset: 0,
                  width: '100%',
                  height: '100%',
                  opacity: 0,
                  cursor: isUploading ? 'not-allowed' : 'pointer',
                }}
              />
            </label>

            {error && <p style={{ margin: '10px 0 0', fontSize: '0.82rem', color: '#dc2626' }}>{error}</p>}

            <button
              type="button"
              disabled={!file || isUploading}
              onClick={submitUpload}
              style={{
                width: '100%',
                marginTop: 18,
                padding: '11px 0',
                border: 0,
                borderRadius: 12,
                fontSize: '0.95rem',
                fontWeight: 700,
                color: '#ffffff',
                background: !file || isUploading ? '#9ca3af' : '#16a34a',
                cursor: !file || isUploading ? 'not-allowed' : 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: 8,
              }}
            >
              {isUploading ? <CircularProgress size={18} sx={{ color: '#ffffff' }} /> : 'رفع الصورة'}
            </button>
          </>
        )}

        {mode === 'pendingReReview' && (
          <button
            type="button"
            disabled={isRefreshing}
            onClick={refreshStatus}
            style={{
              width: '100%',
              padding: '11px 0',
              border: '1.5px solid #16a34a',
              borderRadius: 12,
              fontSize: '0.95rem',
              fontWeight: 700,
              color: '#16a34a',
              background: '#ffffff',
              cursor: isRefreshing ? 'not-allowed' : 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 8,
            }}
          >
            {isRefreshing ? <CircularProgress size={18} sx={{ color: '#16a34a' }} /> : <><AiOutlineReload size={18} /> تحديث الحالة</>}
          </button>
        )}

        <p style={{ margin: '18px 0 0', fontSize: '0.78rem', lineHeight: 1.6, color: '#9ca3af' }}>
          اذا كان لديك اي استفسار يرجى التواصل مع خدمة العملاء عبر{' '}
          <Link to="/contact-us" style={{ color: '#16a34a', fontWeight: 600 }}>صفحة تواصل معنا</Link>
          {' '}او على الرقم 0915643265.
        </p>

        {(mode === 'rejected' || mode === 'pendingReReview') && (
          <button
            type="button"
            onClick={logout}
            style={{
              display: 'block',
              margin: '14px auto 0',
              padding: 0,
              border: 0,
              background: 'transparent',
              fontSize: '0.82rem',
              fontWeight: 600,
              color: '#9ca3af',
              cursor: 'pointer',
              textDecoration: 'underline',
            }}
          >
            تسجيل الخروج
          </button>
        )}
      </div>
    </Dialog>
  )
}

export default PassportVerificationGate;
