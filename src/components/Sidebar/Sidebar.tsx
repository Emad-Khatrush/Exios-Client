import { useEffect, useRef, useState } from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import { BadgeCheck, Check, Copy, House, LayoutGrid, LogOut, Package, Settings, Tags, Warehouse } from 'lucide-react';
import logo from '../../../public/images/exios-logo.png';
import api from '../../api';
import { User } from '../../models';
import { routeGroups, routes } from '../PrivateRoute/routes';
import { useCopy } from '../../utils/useCopy';
import './sidebar.css';

type Props = {
  account: User
  open: boolean
  setOpen: React.Dispatch<React.SetStateAction<boolean>>
}

const logout = () => {
  localStorage.removeItem('user');
  localStorage.removeItem('authToken');
  window.location.replace('/login');
};

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

// Phones: the logo and the customer's code on top; the pages live in the bottom bar
export const MobileTopbar = ({ account }: { account: User }) => (
  <header className="sb-topbar" dir="rtl">
    <img className="sb-topbar__logo" src={logo} alt="إكسيوس" />
    <bdi className="sb-topbar__code" dir="ltr">{account?.customerId}</bdi>
  </header>
);

const PRICE_ROUTES = routes.filter((r) => r.path.startsWith('/prices/'));

type BottomNavProps = {
  pathname: string
  badges: Record<string, number>
  drawerOpen: boolean
  setDrawerOpen: React.Dispatch<React.SetStateAction<boolean>>
}

// Phones: the pages used most, one thumb-tap away. Prices opens a small sheet with its three pages;
// "المزيد" opens the full sidebar with every page and the account.
const BottomNav = ({ pathname, badges, drawerOpen, setDrawerOpen }: BottomNavProps) => {
  const [pricesOpen, setPricesOpen] = useState(false);
  const onPrices = pathname.startsWith('/prices');

  useEffect(() => { setPricesOpen(false); }, [pathname]);
  useEffect(() => {
    if (!pricesOpen) return undefined;
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') setPricesOpen(false); };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [pricesOpen]);

  const tabClass = (active: boolean) => `bn-tab ${active && !drawerOpen && !pricesOpen ? 'is-active' : ''}`;
  const ready = badges.myOrders || 0;
  const moreDot = (badges.suggestions || 0) > 0;

  return (
    <>
      {pricesOpen && <div className="bn-veil" onClick={() => setPricesOpen(false)} aria-hidden />}
      <div className={`bn-sheet ${pricesOpen ? 'is-open' : ''}`} dir="rtl" id="bn-prices" aria-hidden={!pricesOpen}>
        {PRICE_ROUTES.map(({ value, path, label, icon: Icon }) => (
          <NavLink key={value} to={path} tabIndex={pricesOpen ? 0 : -1} className={({ isActive }) => `bn-sheet__link ${isActive ? 'is-active' : ''}`}>
            <span className="bn-sheet__icon" aria-hidden><Icon size={19} /></span>
            {label}
          </NavLink>
        ))}
      </div>

      {/* While "المزيد" is open the bar slides down out of the way; the sidebar closes from its backdrop */}
      <nav className={`bn ${drawerOpen ? 'is-hidden' : ''}`} dir="rtl" lang="ar" aria-label="التنقل السريع" aria-hidden={drawerOpen}>
        <NavLink to="/home" className={({ isActive }) => tabClass(isActive)} onClick={() => setDrawerOpen(false)}>
          <span className="bn-tab__icon"><House size={22} aria-hidden /></span>
          <span className="bn-tab__label">الرئيسية</span>
        </NavLink>
        <NavLink to="/orders" className={({ isActive }) => tabClass(isActive)} onClick={() => setDrawerOpen(false)}>
          <span className="bn-tab__icon">
            <Package size={22} aria-hidden />
            {ready > 0 && <span className="bn-badge" aria-label={`${ready} جاهزة للاستلام`}>{ready}</span>}
          </span>
          <span className="bn-tab__label">طلبياتي</span>
        </NavLink>
        <button
          type="button"
          className={tabClass(onPrices) + (pricesOpen ? ' is-active' : '')}
          onClick={() => { setDrawerOpen(false); setPricesOpen((v) => !v); }}
          aria-expanded={pricesOpen}
          aria-controls="bn-prices"
        >
          <span className="bn-tab__icon"><Tags size={22} aria-hidden /></span>
          <span className="bn-tab__label">الأسعار</span>
        </button>
        <NavLink to="/address" className={({ isActive }) => tabClass(isActive)} onClick={() => setDrawerOpen(false)}>
          <span className="bn-tab__icon"><Warehouse size={22} aria-hidden /></span>
          <span className="bn-tab__label">عناويننا</span>
        </NavLink>
        <button
          type="button"
          className={`bn-tab ${drawerOpen ? 'is-active' : ''}`}
          onClick={() => { setPricesOpen(false); setDrawerOpen((v) => !v); }}
          aria-expanded={drawerOpen}
          aria-controls="app-sidebar"
        >
          <span className="bn-tab__icon">
            <LayoutGrid size={22} aria-hidden />
            {moreDot && <span className="bn-dot" aria-label="رد جديد من المكتب" />}
          </span>
          <span className="bn-tab__label">المزيد</span>
        </button>
      </nav>
    </>
  );
};

const Sidebar = ({ account, open, setOpen }: Props) => {
  const { pathname } = useLocation();
  const { copied, copy } = useCopy();
  const badges = useBadges(pathname);
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
                {group.routes.map(({ value, path, label, icon: Icon }) => {
                  const count = badges[value] || 0;
                  return (
                    <li key={value}>
                      <NavLink to={path} className={({ isActive }) => `sb-link ${isActive ? 'is-active' : ''}`}>
                        <span className="sb-link__icon" aria-hidden><Icon size={19} strokeWidth={1.9} /></span>
                        <span className="sb-link__label">{label}</span>
                        {count > 0 && (
                          <span
                            className={`sb-badge ${value === 'myOrders' ? 'sb-badge--ready' : ''}`}
                            aria-label={value === 'myOrders' ? `${count} جاهزة للاستلام` : `${count} ردود جديدة`}
                          >
                            {count}
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

      <BottomNav pathname={pathname} badges={badges} drawerOpen={open} setDrawerOpen={setOpen} />
    </>
  );
};

export default Sidebar;
