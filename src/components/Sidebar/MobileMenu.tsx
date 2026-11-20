import { useEffect, useRef } from 'react';
import { NavLink } from 'react-router-dom';
import { Award, BadgeCheck, Check, ChevronLeft, Copy, LogOut, Settings, X } from 'lucide-react';
import { User } from '../../models';
import { routeGroups } from '../PrivateRoute/routes';
import { useCopy } from '../../utils/useCopy';
import { logout } from '../../utils/logout';
import { useDragToClose } from './useDragToClose';
import './mobileMenu.css';

/* Phones: the "القائمة" screen of the bottom bar, like Facebook's menu. It slides up over the page:
   the account card (the one bold thing: who is signed in, their shipping code to copy), the
   account's pages as tiles, the prices as a row of small tiles, help as a list, then settings and
   sign-out. The side panel stays for wider screens only. */

type Props = {
  open: boolean
  onClose: () => void
  account: User
  badges: Record<string, number>
}

// Each tile's colour, so the eye finds a page by colour as well as by its name
const HUE: Record<string, string> = {
  myOrders: 'teal', wallet: 'amber', points: 'violet', startShip: 'green', address: 'blue', notifications: 'rose', invite: 'green',
  shippingPrices: 'green', purchasePrices: 'rose', transferPrices: 'blue',
};

const [mainGroup, pricesGroup, helpGroup] = routeGroups;

const initials = (account: User) => (account?.firstName || account?.lastName || '').trim().charAt(0) || '؟';

export const MenuAvatar = ({ account, size = 28 }: { account: User, size?: number }) => (
  account?.imgUrl
    ? <img className="mm-avatar" src={account.imgUrl} alt="" width={size} height={size} style={{ width: size, height: size }} />
    : <span className="mm-avatar mm-avatar--letters" style={{ width: size, height: size, fontSize: size * 0.45 }} aria-hidden>{initials(account)}</span>
);

const MobileMenu = ({ open, onClose, account, badges }: Props) => {
  const { copied, copy } = useCopy();
  const id = account?.customerId || '';
  const verified = account?.passportVerification?.status === 'verified';
  const name = [account?.firstName, account?.lastName].filter(Boolean).join(' ') || 'حسابي';

  // While open: Escape closes it and the page behind does not scroll
  useEffect(() => {
    if (!open) return undefined;
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    window.addEventListener('keydown', onKey);
    return () => { document.body.style.overflow = prev; window.removeEventListener('keydown', onKey); };
  }, [open, onClose]);

  // Pulled down from the top, it goes back down (see useDragToClose)
  const sheetRef = useRef<HTMLDivElement>(null);
  const bodyRef = useRef<HTMLDivElement>(null);
  const headRef = useRef<HTMLElement>(null);
  const scrimRef = useRef<HTMLDivElement>(null);
  useDragToClose(open, onClose, { sheet: sheetRef, body: bodyRef, head: headRef, scrim: scrimRef });

  const tiles = mainGroup.routes.filter((r) => r.value !== 'home' && !(['points', 'invite'].includes(r.value) && account?.loyaltyOff));

  return (
    <>
    {/* Dims the page while the menu rises over it and while it goes back down */}
    <div ref={scrimRef} className={`mm-scrim ${open ? 'is-open' : ''}`} onClick={onClose} aria-hidden />
    <div ref={sheetRef} className={`mm ${open ? 'is-open' : ''}`} dir="rtl" lang="ar" role="dialog" aria-modal="true" aria-label="القائمة" aria-hidden={!open}>
      <span className="mm-grab" aria-hidden />
      <header ref={headRef} className="mm-head">
        <h2>القائمة</h2>
        <button type="button" className="mm-close" onClick={onClose} aria-label="إغلاق القائمة" tabIndex={open ? 0 : -1}><X size={22} /></button>
      </header>

      <div ref={bodyRef} className="mm-body">
        {/* Who is signed in: tapping the card opens the settings; the code copies on its own */}
        <div className="mm-profile">
          <NavLink to="/settings" className="mm-profile__who" tabIndex={open ? 0 : -1}>
            <MenuAvatar account={account} size={52} />
            <span className="mm-profile__name">
              <b>{name}</b>
              {verified ? <small><BadgeCheck size={14} aria-hidden /> حساب موثّق</small> : <small>إعدادات الحساب</small>}
              {account?.referral?.ambassadorAt && !account?.loyaltyOff && <small className="mm-amb"><Award size={14} aria-hidden /> سفير Exios</small>}
            </span>
            <ChevronLeft size={20} aria-hidden className="mm-profile__go" />
          </NavLink>
          <button type="button" className={`mm-code ${copied === 'mm-code' ? 'is-done' : ''}`} onClick={() => copy('mm-code', id)} tabIndex={open ? 0 : -1} aria-label={`نسخ كود الشحن ${id}`}>
            <span>كود الشحن</span>
            <bdi dir="ltr">{id}</bdi>
            {copied === 'mm-code' ? <><Check size={16} aria-hidden /> <em role="status">نُسخ</em></> : <Copy size={16} aria-hidden />}
          </button>
        </div>

        <section className="mm-section" aria-labelledby="mm-account">
          <h3 id="mm-account">حسابي</h3>
          <div className="mm-tiles">
            {tiles.map(({ value, path, label, icon: Icon }) => {
              const count = badges[value] || 0;
              return (
                <NavLink key={value} to={path} tabIndex={open ? 0 : -1} className={({ isActive }) => `mm-tile hue-${HUE[value] || 'green'} ${isActive ? 'is-active' : ''}`}>
                  <span className="mm-tile__icon" aria-hidden><Icon size={22} /></span>
                  <span className="mm-tile__label">{label}</span>
                  {count > 0 && <span className="mm-count" aria-label={value === 'myOrders' ? `${count} جاهزة للاستلام` : `${count} جديد`}>{count > 99 ? '99+' : count}</span>}
                </NavLink>
              );
            })}
          </div>
        </section>

        <section className="mm-section" aria-labelledby="mm-prices">
          <h3 id="mm-prices">{pricesGroup.title}</h3>
          <div className="mm-tiles mm-tiles--three">
            {pricesGroup.routes.map(({ value, path, label, icon: Icon }) => (
              <NavLink key={value} to={path} tabIndex={open ? 0 : -1} className={({ isActive }) => `mm-tile mm-tile--small hue-${HUE[value] || 'green'} ${isActive ? 'is-active' : ''}`}>
                <span className="mm-tile__icon" aria-hidden><Icon size={20} /></span>
                <span className="mm-tile__label">{label}</span>
              </NavLink>
            ))}
          </div>
        </section>

        <section className="mm-section" aria-labelledby="mm-help">
          <h3 id="mm-help">{helpGroup.title}</h3>
          <ul className="mm-list">
            {helpGroup.routes.map(({ value, path, label, icon: Icon }) => {
              const count = badges[value] || 0;
              return (
                <li key={value}>
                  <NavLink to={path} tabIndex={open ? 0 : -1} className={({ isActive }) => `mm-row ${isActive ? 'is-active' : ''}`}>
                    <span className="mm-row__icon" aria-hidden><Icon size={19} /></span>
                    <span className="mm-row__label">{label}</span>
                    {count > 0 && <span className="mm-count" aria-label={`${count} ردود جديدة`}>{count}</span>}
                    <ChevronLeft size={18} aria-hidden className="mm-row__go" />
                  </NavLink>
                </li>
              );
            })}
          </ul>
        </section>

        <div className="mm-foot">
          <NavLink to="/settings" tabIndex={open ? 0 : -1} className="mm-row">
            <span className="mm-row__icon" aria-hidden><Settings size={19} /></span>
            <span className="mm-row__label">الإعدادات</span>
            <ChevronLeft size={18} aria-hidden className="mm-row__go" />
          </NavLink>
          <button type="button" className="mm-row mm-row--out" onClick={logout} tabIndex={open ? 0 : -1}>
            <span className="mm-row__icon" aria-hidden><LogOut size={19} /></span>
            <span className="mm-row__label">تسجيل الخروج</span>
          </button>
        </div>
      </div>
    </div>
    </>
  );
};

export default MobileMenu;
