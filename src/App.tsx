import { BrowserRouter as Router, Navigate, Route, Routes } from 'react-router-dom';
import PrivateRoute from './components/PrivateRoute/PrivateRoute';
import LandingPage from "./containers/LandingPage/LandingPage";
import Register from './containers/Register/Register';
import Login from './containers/Login/Login';
import Home from './containers/Home/Home';
import StartShipmentPage from './containers/StartShipmentPage/StartShipmentPage';
import ClientOrders from './containers/ClientOrders/ClientOrders';
import OrderInfoPage from './containers/OrderInfoPage/OrderInfoPage';
import AddressPage from './containers/AddressPage/AddressPage';
import PricesPage from './containers/PricesPage/PricesPage';
import TermsAndPrivacy from './containers/TermsAndPrivacy/TermsAndPrivacy';
import ContactUs from './containers/ContactUs/ContactUs';
import SettingsPage from './containers/SettingsPage/SettingsPage';
import { useSelector } from 'react-redux';
import ResetPasswordPage from './containers/ResetPasswordPage/ResetPasswordPage';
import AddTrackingNumbers from './containers/AddTrackingNumbers/AddTrackingNumbers';
import SuggestionsPage from './containers/SuggestionsPage/SuggestionsPage';

import { initializeApp } from "firebase/app";
import { getAnalytics } from "firebase/analytics";

const firebaseConfig = {
  apiKey: process.env.REACT_APP_FIREBASE_ANALYTICS_KEY,
  authDomain: process.env.REACT_APP_FIREBASE_AUTH_DOMAIN,
  projectId: "exios-client",
  storageBucket: process.env.REACT_APP_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.REACT_APP_FIREBASE_MESSAGE_SENDER_ID,
  appId: process.env.REACT_APP_FIREBASE_APP_ID,
  measurementId: process.env.REACT_APP_FIREBASE_MEASUREMENT_ID
};

const App = () => {
  const isLoggedIn = useSelector((state: any) => state.session.isLoggedIn);

  // Initialize Firebase
  const app = initializeApp(firebaseConfig);
  getAnalytics(app);

  return (
      <Router>
        <Routes>
          <Route path='/' element={<LandingPage />} />
          {!isLoggedIn &&
            <>
              <Route path='/login' element={<Login />} />
              <Route path='/signup' element={<Register />} />
              <Route path='/reset-password' element={<ResetPasswordPage />} />
            </>
          }
          <Route element={<PrivateRoute />}>
            <Route path='/home' element={<Home />} />
            <Route path='/start-shipment' element={<StartShipmentPage />} />
            <Route path='/add-tracking-numbers' element={<AddTrackingNumbers />} />
            <Route path='/address' element={<AddressPage />} />
            <Route path='/prices' element={<PricesPage />} />
            <Route path='/settings' element={<SettingsPage />} />
            <Route path='/contact-us' element={<ContactUs />} />
            <Route path='/terms-privacy' element={<TermsAndPrivacy />} />
            <Route path='/orders' element={<ClientOrders />} />
            <Route path='/order/:id' element={<OrderInfoPage />} />
            <Route path='/suggestions' element={<SuggestionsPage />} />
            <Route path='*' element={<Navigate to='/home' />} />
          </Route>
        </Routes>
      </Router>
  )
}

export default App;
