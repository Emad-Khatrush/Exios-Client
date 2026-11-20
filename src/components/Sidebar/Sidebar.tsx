import { useEffect, useRef, useState } from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import { Award, BadgeCheck, Check, Copy, House, LogOut, Package, Settings, Tags, Warehouse } from 'lucide-react';
import logo from '../../../public/images/exios-logo.png';
import api from '../../api';
import { User } from '../../models';
import { routeGroups, routes } from '../PrivateRoute/routes';
import { useCopy } from '../../utils/useCopy';
import { logout } from '../../utils/logout';
import MobileMenu, { MenuAvatar } from './MobileMenu';
import { isRestoringScroll } from '../ScrollMemory/ScrollMemory';
import { unreadText, useUnreadNotifications } from '../../utils/unreadNotifications';
import './sidebar.css';

type Props = {
  account: User
  open: boolean
  setOpen: React.Dispatch<React.SetStateAction<boolean>>
}

const fullName = (account: User) => [account?.firstName, account?.lastName].filter(Boolean).join(' ');

// One letter: two Arabic initials side by side join up and read like a word
const initials = (account: User) => (account?.firstName || account?.lastName || '').trim().charAt(0) || '؟';

const Avatar = ({ account }: { account: User }) => {
  const [broken, setBroken] = useState(false);
  if (account?.imgUrl && !broken) {
    return <img className="sb-avatar" src={account.imgUrl} alt="" onError={() => setBroken(true)} />;
  }
  return <span className="sb-avatar sb-avatar--letters" aria-hidden>{initials(account)}</span>;
};

// Numbers worth a glance in the menu: orders waiting at the office, and office replies not read yet.
// Fetched once, then again at most once a minute as the customer moves between pages.
const useBadges = (pathname: string) => {
  const [badges, setBadges] = useState<Record<string, number>>({});
  const lastFetch = useRef(0);

  useEffect(() => {
    if (Date.now() - lastFetch.current < 60_000) return;
    lastFetch.current = Date.now();
    api.getHomeData()
      .then((res: any) => {
        const ready = res.data?.results?.countList?.readyForReceivement || 0;
        setBadges((b) => ({ ...b, myOrders: ready }));
      })
      .catch(() => undefined);
    api.get('client/feedback')
      .then((res: any) => {
        const unread = Array.isArray(res?.data) ? res.data.filter((f: any) => f.unread).length : 0;
        setBadges((b) => ({ ...b, suggestions: unread }));
      })
      .catch(() => undefined);
  }, [pathname]);

  return badges;
};

// Phones, like Facebook: the bar slides away while the page is scrolled down and comes back when it
// is scrolled up (or reaches the top). The page scrolls inside .app-main, not the window.
// The distance moved in one direction is added up, so the bar only moves on a deliberate scroll:
// a finger's small jitter or a flick's bounce no longer makes it flicker in and out.
const HIDE_AFTER = 56;
const SHOW_AFTER = 28;
const SETTLE_MS = 350;

const useBarAway = (pathname: string, keepShown: boolean) => {
  const [away, setAway] = useState(false);
  useEffect(() => {
    setAway(false);
    const el = document.querySelector('.app-main');
    if (!el) return undefined;
    let last = el.scrollTop;
    let run = 0;
    let ticking = false;
    const onScroll = () => {
      if (ticking) return;
      ticking = true;
      requestAnimationFrame(() => {
        ticking = false;
        const y = el.scrollTop;
        const dy = y - last;
        last = y;
        // Near the top it always shows, at once
        if (y < 60) { run = 0; isAway = false; setAway(false); return; }
        // Going back puts the page where it was left: that is not the customer scrolling
        if (isRestoringScroll()) { run = 0; return; }
        // The bounce at the bottom of the page is not a scroll up
        if (y + el.clientHeight >= el.scrollHeight - 4) return;
        if (dy === 0) return;
        if ((dy > 0) !== (run > 0)) run = 0;
        run += dy;
        if (run > HIDE_AFTER) move(true);
        else if (run < -SHOW_AFTER) move(false);
      });
    };
    // Once the bar has started moving it finishes before it may turn back: an uneven scroll report
    // (iPhone during a flick) can no longer make it go and come back
    let isAway = false;
    let changedAt = 0;
    const move = (next: boolean) => {
      if (next === isAway || performance.now() - changedAt < SETTLE_MS) return;
      isAway = next;
      changedAt = performance.now();
      setAway(next);
    };
    el.addEventListener('scroll', onScroll, { passive: true });
    return () => el.removeEventListener('scroll', onScroll);
  }, [pathname]);
  return away && !keepShown;
};

const PRICE_ROUTES = routes.filter((r) => r.path.startsWith('/prices/'));

type BottomNavProps = {
  pathname: string
  badges: Record<string, number>
  account: User
}

// Phones, like Facebook's bar: the pages used most, one thumb-tap away. Prices opens a small sheet
// with its three pages; "القائمة" (the customer's photo) opens the menu screen with every page and
// the account. The side panel is for wider screens only.
const BottomNav = ({ pathname, badges, account }: BottomNavProps) => {
  const [pricesOpen, setPricesOpen] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const onPrices = pathname.startsWith('/prices');

  useEffect(() => { setPricesOpen(false); setMenuOpen(false); }, [pathname]);
  const away = useBarAway(pathname, pricesOpen || menuOpen);
  useEffect(() => {
    if (!pricesOpen) return undefined;
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') setPricesOpen(false); };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [pricesOpen]);

  const tabClass = (active: boolean) => `bn-tab ${active && !menuOpen && !pricesOpen ? 'is-active' : ''}`;
  const ready = badges.myOrders || 0;
  // A reply from the office or notifications not seen yet: a dot on the menu tab
  const moreDot = (badges.suggestions || 0) > 0 || (badges.notifications || 0) > 0;

  return (
    <>
      {/* Always there, so it can fade in and out with the sheet */}
      <div className={`bn-veil ${pricesOpen ? 'is-open' : ''}`} onClick={() => setPricesOpen(false)} aria-hidden />
      <div className={`bn-sheet ${pricesOpen ? 'is-open' : ''}`} dir="rtl" id="bn-prices" aria-hidden={!pricesOpen}>
        {PRICE_ROUTES.map(({ value, path, label, icon: Icon }) => (
          <NavLink key={value} to={path} tabIndex={pricesOpen ? 0 : -1} className={({ isActive }) => `bn-sheet__link ${isActive ? 'is-active' : ''}`}>
            <span className="bn-sheet__icon" aria-hidden><Icon size={19} /></span>
            {label}
          </NavLink>
        ))}
      </div>

      <MobileMenu open={menuOpen} onClose={() => setMenuOpen(false)} account={account} badges={badges} />

      <nav className={`bn ${away ? 'is-away' : ''}`} dir="rtl" lang="ar" aria-label="التنقل السريع">
        <NavLink to="/home" className={({ isActive }) => tabClass(isActive)} onClick={() => setMenuOpen(false)}>
          <span className="bn-tab__icon"><House size={22} aria-hidden /></span>
          <span className="bn-tab__label">الرئيسية</span>
        </NavLink>
        <NavLink to="/orders" className={({ isActive }) => tabClass(isActive)} onClick={() => setMenuOpen(false)}>
          <span className="bn-tab__icon">
            <Package size={22} aria-hidden />
            {ready > 0 && <span className="bn-badge" aria-label={`${ready} جاهزة للاستلام`}>{ready}</span>}
          </span>
          <span className="bn-tab__label">طلبياتي</span>
        </NavLink>
        <button
          type="button"
          className={tabClass(onPrices) + (pricesOpen ? ' is-active' : '')}
          onClick={() => { setMenuOpen(false); setPricesOpen((v) => !v); }}
          aria-expanded={pricesOpen}
          aria-controls="bn-prices"
        >
          <span className="bn-tab__icon"><Tags size={22} aria-hidden /></span>
          <span className="bn-tab__label">الأسعار</span>
        </button>
        <NavLink to="/address" className={({ isActive }) => tabClass(isActive)} onClick={() => setMenuOpen(false)}>
          <span className="bn-tab__icon"><Warehouse size={22} aria-hidden /></span>
          <span className="bn-tab__label">عناويننا</span>
        </NavLink>
        <button
          type="button"
          className={`bn-tab bn-tab--menu ${menuOpen ? 'is-active' : ''}`}
          onClick={() => { setPricesOpen(false); setMenuOpen((v) => !v); }}
          aria-expanded={menuOpen}
        >
          <span className="bn-tab__icon">
            <MenuAvatar account={account} size={26} />
            {moreDot && <span className="bn-dot" aria-label="جديد في القائمة" />}
          </span>
          <span className="bn-tab__label">القائمة</span>
        </button>
      </nav>
    </>
  );
};

const Sidebar = ({ account, open, setOpen }: Props) => {
  const { pathname } = useLocation();
  const { copied, copy } = useCopy();
  const officeBadges = useBadges(pathname);
  const unread = useUnreadNotifications(pathname);
  const badges: Record<string, number> = { ...officeBadges, notifications: unread };
  const id = account?.customerId || '';
  const verified = account?.passportVerification?.status === 'verified';

  // The drawer closes when a page is picked
  useEffect(() => { setOpen(false); }, [pathname, setOpen]);

  // While the drawer is open on a phone: Escape closes it and the page behind does not scroll
  useEffect(() => {
    if (!open) return undefined;
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') setOpen(false); };
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    window.addEventListener('keydown', onKey);
    return () => {
      document.body.style.overflow = prevOverflow;
      window.removeEventListener('keydown', onKey);
    };
  }, [open, setOpen]);

  return (
    <>
      <div className={`sb-scrim ${open ? 'is-open' : ''}`} onClick={() => setOpen(false)} aria-hidden />

      <aside id="app-sidebar" className={`sb ${open ? 'is-open' : ''}`} dir="rtl" lang="ar" aria-label="القائمة الرئيسية">
        <div className="sb-brand">
          <NavLink to="/home" className="sb-brand__link" aria-label="الصفحة الرئيسية">
            <img src={logo} alt="إكسيوس" />
          </NavLink>
        </div>

        <nav className="sb-nav">
          {routeGroups.map((group, i) => (
            <div className="sb-group" key={group.title || i}>
              {group.title && <p className="sb-group__title">{group.title}</p>}
              <ul>
                {group.routes.filter((route) => !(['points', 'invite'].includes(route.value) && account?.loyaltyOff)).map(({ value, path, label, icon: Icon }) => {
                  const count = badges[value] || 0;
                  return (
                    <li key={value}>
                      <NavLink to={path} className={({ isActive }) => `sb-link ${isActive ? 'is-active' : ''}`}>
                        <span className="sb-link__icon" aria-hidden><Icon size={19} strokeWidth={1.9} /></span>
                        <span className="sb-link__label">{label}</span>
                        {count > 0 && (
                          <span
                            className={`sb-badge ${value === 'myOrders' ? 'sb-badge--ready' : ''}`}
                            aria-label={value === 'myOrders' ? `${count} جاهزة للاستلام` : value === 'notifications' ? `${count} إشعارات جديدة` : `${count} ردود جديدة`}
                          >
                            {unreadText(count)}
                          </span>
                        )}
                      </NavLink>
                    </li>
                  );
                })}
              </ul>
            </div>
          ))}
        </nav>

        {/* The account: who is signed in, their code, settings and sign-out */}
        <section className="sb-account" aria-label="حسابي">
          <div className="sb-account__who">
            <Avatar account={account} />
            <div className="sb-account__name">
              <b>{fullName(account) || 'حسابي'}</b>
              {verified
                ? <span className="sb-account__verified"><BadgeCheck size={14} aria-hidden /> حساب موثّق</span>
                : account?.city && <span>{account.city}</span>}
              {account?.referral?.ambassadorAt && !account?.loyaltyOff && <span className="sb-account__amb"><Award size={14} aria-hidden /> سفير Exios</span>}
            </div>
          </div>

          <button
            type="button"
            className={`sb-code ${copied === 'sb-code' ? 'is-done' : ''}`}
            onClick={() => copy('sb-code', id)}
            aria-label={`نسخ كود الشحن ${id}`}
          >
            <span className="sb-code__label">كود الشحن</span>
            <bdi className="sb-code__value" dir="ltr">{id}</bdi>
            <span className="sb-code__icon" aria-hidden>
              {copied === 'sb-code' ? <Check size={15} /> : <Copy size={15} />}
            </span>
            <span className="sb-code__toast" role="status">{copied === 'sb-code' ? 'نُسخ' : ''}</span>
          </button>

          <div className="sb-account__actions">
            <NavLink to="/settings" className={({ isActive }) => `sb-act ${isActive ? 'is-active' : ''}`}>
              <Settings size={17} aria-hidden /> الإعدادات
            </NavLink>
            <button type="button" className="sb-act sb-act--out" onClick={logout}>
              <LogOut size={17} aria-hidden /> خروج
            </button>
          </div>
        </section>
      </aside>

      <BottomNav pathname={pathname} badges={badges} account={account} />
    </>
  );
};

export default Sidebar;
