import { Suspense, useLayoutEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { Navigate, Outlet, useLocation } from 'react-router-dom';
import api from '../../api';
import { setAccountData } from '../../actions/session';
import { addAuthInterceptor } from '../../utils/AuthInterceptor';
import Sidebar from '../Sidebar/Sidebar';
import PassportVerificationGate, { getPassportGateMode } from '../PassportVerificationGate/PassportVerificationGate';
import PopupAdsGate from '../PopupAdsGate/PopupAdsGate';
import PageLoader from '../PageLoader/PageLoader';
import ScrollMemory from '../ScrollMemory/ScrollMemory';
import ErrorBoundary from '../ErrorBoundary/ErrorBoundary';

const PrivateRoute = () => {
  const [show, setShow] = useState(false);
  const [token, setToken] = useState(localStorage.getItem('authToken'));
  const session = useSelector((state: any) => state.session);
  const dispatch = useDispatch();
  const location = useLocation();

  // Hooks come before any early return, so they run in the same order on every render (React's
  // rule): the redirect for a signed-out visitor used to come first, skipping this one
  useLayoutEffect(() => {
    if (session.isLoggedIn && token) {
      api.verifyToken(token)
      .then(() => {
        setToken(token);
        // Refresh the account from the server on every load/refresh so status
        // changes made by an admin (e.g. passport rejection) show up without
        // requiring the user to log out and back in.
        api.getMyAccount()
          .then((res: any) => setAccountData(res.data, session, dispatch))
          .catch(() => undefined);
      })
      .catch(() => {
        localStorage.removeItem('user');
        localStorage.removeItem('authToken');
        window.location.replace('/login');
      })
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  if (!session.isLoggedIn) {
    // remember where they were going, so signing in takes them back there
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  if (!token) {
    localStorage.removeItem('user');
    localStorage.removeItem('authToken');
    window.location.replace('/login');
  }

  addAuthInterceptor(token || '');

  // Popup ads are suppressed while the passport gate is blocking, so the
  // customer never sees two non-dismissible dialogs stacked on top of each other.
  const isPassportGateBlocking = !!getPassportGateMode(session.account);

  return (
    <div className="w-full h-full" style={{ background: '#f2f5f3' }}>
      <ScrollMemory />
      <PassportVerificationGate />
      {!isPassportGateBlocking && <PopupAdsGate />}
      {/* The sidebar comes first and the row is reversed, so it sits on the right */}
      <div className="w-full h-full flex flex-nowrap flex-row-reverse">
        <Sidebar account={session.account} open={show} setOpen={setShow} />
        <div className="app-main w-full min-w-0 overflow-auto">
          {/* While a page's file downloads, the sidebar stays and only the content area waits */}
          {/* A page that breaks shows a way out in its place; the menu and the bar keep working */}
          <ErrorBoundary page resetKey={location.pathname}>
            <Suspense fallback={<PageLoader />}>
              <Outlet />
            </Suspense>
          </ErrorBoundary>
        </div>
      </div>
    </div>
  )
}

export default PrivateRoute;
