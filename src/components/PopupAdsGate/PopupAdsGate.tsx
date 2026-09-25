import { useEffect, useState } from 'react';
import { CircularProgress, Dialog } from '@mui/material';
import { Megaphone } from 'lucide-react';
import api from '../../api';
import { PopupAd } from '../../models';
import { POPUP_AD_ICON_COMPONENTS } from '../../constants/popupAdIcons';
import './PopupAdsGate.scss';

// Full-screen, non-dismissible ads set by the admin (Settings > Popup ads).
// One popup per ad, swapped in order, the customer must acknowledge each one
// (there's no skip/close) before the next one shows or the dialog goes away.
// Ads already acknowledged by this account are excluded server-side, so a
// re-login or refresh never re-shows one that was already read.
const PopupAdsGate = () => {
  const [ads, setAds] = useState<PopupAd[] | null>(null);
  const [index, setIndex] = useState(0);
  const [isAcknowledging, setIsAcknowledging] = useState(false);

  useEffect(() => {
    api.getActivePopupAds()
      .then((res: any) => setAds(res.data || []))
      .catch(() => setAds([]));
  }, []);

  if (!ads || ads.length === 0) return null;

  const current = ads[index];
  const isLast = index === ads.length - 1;
  const Icon = POPUP_AD_ICON_COMPONENTS[current.icon || 'megaphone'] || Megaphone;

  const acknowledge = async () => {
    try {
      setIsAcknowledging(true);
      await api.acknowledgePopupAd(current._id);
      if (isLast) {
        setAds([]);
      } else {
        setIndex((prev) => prev + 1);
      }
    } catch (err) {
      // Leave the dialog open on failure so the customer can try again.
    } finally {
      setIsAcknowledging(false);
    }
  };

  return (
    <Dialog
      open
      onClose={() => {}}
      disableEscapeKeyDown
      fullWidth
      maxWidth="xs"
      PaperProps={{ sx: { borderRadius: '22px', overflow: 'hidden', display: 'flex', flexDirection: 'column', maxHeight: 'calc(100% - 64px)' } }}
    >
      <div dir="rtl" className="popup-ad-card">
        {/* Only this part scrolls when the image/text don't fit; the CTA
            button below is a fixed footer that is always visible. */}
        <div className="popup-ad-card__scroll">
          <div className="popup-ad-card__media">
            {ads.length > 1 && (
              <span className="popup-ad-card__progress">{index + 1} / {ads.length}</span>
            )}

            {current.imageUrl ? (
              // object-fit: contain (in the .scss) keeps the whole photo visible, never cropped.
              <img key={current._id} src={current.imageUrl} alt="" />
            ) : (
              <div className="popup-ad-card__icon-badge">
                <Icon size={38} strokeWidth={1.6} />
              </div>
            )}
          </div>

          <div className="popup-ad-card__body">
            <p key={current._id} className="popup-ad-card__description">
              {current.description}
            </p>

            {ads.length > 1 && (
              <div className="popup-ad-card__dots">
                {ads.map((ad, i) => (
                  <span key={ad._id} className={`popup-ad-card__dot ${i === index ? 'popup-ad-card__dot--active' : ''}`} />
                ))}
              </div>
            )}
          </div>
        </div>

        <div className="popup-ad-card__footer">
          <button
            type="button"
            className="popup-ad-card__cta"
            disabled={isAcknowledging}
            onClick={acknowledge}
          >
            {isAcknowledging
              ? <CircularProgress size={18} sx={{ color: '#ffffff' }} />
              : (isLast ? 'قرأت الإعلان' : 'قرأت، التالي')}
          </button>
        </div>
      </div>
    </Dialog>
  );
};

export default PopupAdsGate;
