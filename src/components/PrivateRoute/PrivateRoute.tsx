import { useLayoutEffect, useState } from 'react';
import { useSelector } from 'react-redux';
import { Navigate, Outlet } from 'react-router-dom';
import api from '../../api';
import { addAuthInterceptor } from '../../utils/AuthInterceptor';
import Navbar from '../Navbar/Navbar';
import ResponsiveSidebar from '../Sidebar/ResponsiveSidebar';
import Sidebar from '../Sidebar/Sidebar';

const PrivateRoute = () => {
  const [show, setShow] = useState(false);
  const [token, setToken] = useState(localStorage.getItem('authToken'));
  const session = useSelector((state: any) => state.session);

  if (!session.isLoggedIn) {
    return <Navigate to="/login" />;
  }
  
  useLayoutEffect(() => {
    if (token) {
      api.verifyToken(token)
      .then(() => {
        setToken(token);
      })
      .catch(() => {
        localStorage.removeItem('user');
        localStorage.removeItem('authToken');
        window.location.replace('/login');
      })
    }
  }, [])
  
  if (!token) {
    localStorage.removeItem('user');
    localStorage.removeItem('authToken');
    window.location.replace('/login');
  }

  addAuthInterceptor(token || '');

  return (
    <div className="w-full h-full bg-gray-200">
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
