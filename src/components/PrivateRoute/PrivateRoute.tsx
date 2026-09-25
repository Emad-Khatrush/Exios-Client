import { useLayoutEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { Navigate, Outlet } from 'react-router-dom';
import api from '../../api';
import { setAccountData } from '../../actions/session';
import { addAuthInterceptor } from '../../utils/AuthInterceptor';
import Navbar from '../Navbar/Navbar';
import ResponsiveSidebar from '../Sidebar/ResponsiveSidebar';
import Sidebar from '../Sidebar/Sidebar';
import PassportVerificationGate, { getPassportGateMode } from '../PassportVerificationGate/PassportVerificationGate';
import PopupAdsGate from '../PopupAdsGate/PopupAdsGate';

const PrivateRoute = () => {
  const [show, setShow] = useState(false);
  const [token, setToken] = useState(localStorage.getItem('authToken'));
  const session = useSelector((state: any) => state.session);
  const dispatch = useDispatch();

  if (!session.isLoggedIn) {
    return <Navigate to="/login" />;
  }

  useLayoutEffect(() => {
    if (token) {
      api.verifyToken(token)
      .then(() => {
        setToken(token);
        // Refresh the account from the server on every load/refresh so status
        // changes made by an admin (e.g. passport rejection) show up without
        // requiring the user to log out and back in.
        api.getMyAccount()
          .then((res: any) => setAccountData(res.data, session, dispatch))
          .catch(() => {});
      })
      .catch(() => {
        localStorage.removeItem('user');
        localStorage.removeItem('authToken');
        window.location.replace('/login');
      })
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])
  
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
    <div className="w-full h-full bg-gray-200">
      <PassportVerificationGate />
      {!isPassportGateBlocking && <PopupAdsGate />}
      <div className="w-full h-full flex flex-no-wrap flex-row-reverse">
        <Sidebar account={session.account} />
        <ResponsiveSidebar 
          show={show}
          setShow={setShow}
          account={session.account}
        />
        <div className="w-full overflow-auto">
          <Navbar
            show={show}
            setShow={setShow}
            account={session.account}
          />

          <Outlet />
          
        </div>
      </div>
    </div>
  )
}

export default PrivateRoute;
