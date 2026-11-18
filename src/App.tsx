import { Suspense } from 'react';
import { lazyPage } from './utils/appUpdate';
import { BrowserRouter as Router, Navigate, Route, Routes } from 'react-router-dom';
import { useSelector } from 'react-redux';
import { initializeApp } from 'firebase/app';
import { getAnalytics } from 'firebase/analytics';
import LandingPage from './containers/LandingPage/LandingPage';
import RouteChangeTracker from './components/RouteChangeTracker/RouteChangeTracker';
import SeoManager from './components/SeoManager/SeoManager';
import PageLoader from './components/PageLoader/PageLoader';
import ErrorBoundary from './components/ErrorBoundary/ErrorBoundary';
import OfflineBar from './components/OfflineBar/OfflineBar';

// Every page except the landing page is its own file, downloaded the first time it is opened.
// Visitors to the landing page no longer download the whole app, and each page opens with only
// what it needs.
// The signed-in shell (sidebar, passport gate, popup ads) too: landing page visitors never need it
const PrivateRoute = lazyPage(() => import('./components/PrivateRoute/PrivateRoute'));
const Register = lazyPage(() => import('./containers/Register/Register'));
const Login = lazyPage(() => import('./containers/Login/Login'));
const ResetPasswordPage = lazyPage(() => import('./containers/ResetPasswordPage/ResetPasswordPage'));
const Home = lazyPage(() => import('./containers/Home/Home'));
const StartShipmentPage = lazyPage(() => import('./containers/StartShipmentPage/StartShipmentPage'));
const ClientOrders = lazyPage(() => import('./containers/ClientOrders/ClientOrders'));
const OrderInfoPage = lazyPage(() => import('./containers/OrderInfoPage/OrderInfoPage'));
const AddressPage = lazyPage(() => import('./containers/AddressPage/AddressPage'));
const PricesPage = lazyPage(() => import('./containers/PricesPage/PricesPage'));
const TermsAndPrivacy = lazyPage(() => import('./containers/TermsAndPrivacy/TermsAndPrivacy'));
const ContactUs = lazyPage(() => import('./containers/ContactUs/ContactUs'));
const SettingsPage = lazyPage(() => import('./containers/SettingsPage/SettingsPage'));
const AddTrackingNumbers = lazyPage(() => import('./containers/AddTrackingNumbers/AddTrackingNumbers'));
const SuggestionsPage = lazyPage(() => import('./containers/SuggestionsPage/SuggestionsPage'));
const ProhibitedItemsPage = lazyPage(() => import('./containers/ProhibitedItemsPage/ProhibitedItemsPage'));
const PointsPage = lazyPage(() => import('./containers/PointsPage/PointsPage'));
const WalletPage = lazyPage(() => import('./containers/WalletPage/WalletPage'));
const Announcements = lazyPage(() => import('./containers/Announcements/Announcements'));

declare const process: {
  env: Record<string, string | undefined>;
};

const firebaseConfig = {
  apiKey: process.env.REACT_APP_FIREBASE_ANALYTICS_KEY,
  authDomain: process.env.REACT_APP_FIREBASE_AUTH_DOMAIN,
  projectId: "exios-client",
  storageBucket: process.env.REACT_APP_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.REACT_APP_FIREBASE_MESSAGE_SENDER_ID,
  appId: process.env.REACT_APP_FIREBASE_APP_ID,
  measurementId: process.env.REACT_APP_FIREBASE_MEASUREMENT_ID
};

// Once, when the app loads (it used to run again on every render of App)
getAnalytics(initializeApp(firebaseConfig));

const App = () => {
  const isLoggedIn = useSelector((state: any) => state.session.isLoggedIn);

  return (
    <ErrorBoundary>
      <OfflineBar />
      <Router>
        <RouteChangeTracker />
        <SeoManager />
        <Suspense fallback={<PageLoader fullScreen />}>
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
              {/* The old link (home page shortcut, bookmarks) opens shipping prices */}
              <Route path='/prices' element={<Navigate to='/prices/shipping' replace />} />
              <Route path='/prices/shipping' element={<PricesPage group='shipping' />} />
              <Route path='/prices/purchase' element={<PricesPage group='purchase' />} />
              <Route path='/prices/transfers' element={<PricesPage group='transfers' />} />
              <Route path='/wallet' element={<WalletPage />} />
              <Route path='/points' element={<PointsPage />} />
              <Route path='/announcements' element={<Announcements />} />
              <Route path='/settings' element={<SettingsPage />} />
              <Route path='/contact-us' element={<ContactUs />} />
              <Route path='/terms-privacy' element={<TermsAndPrivacy />} />
              <Route path='/orders' element={<ClientOrders />} />
              <Route path='/order/:id' element={<OrderInfoPage />} />
              <Route path='/suggestions' element={<SuggestionsPage />} />
              <Route path='/prohibited-items' element={<ProhibitedItemsPage />} />
              <Route path='*' element={<Navigate to='/home' />} />
            </Route>
          </Routes>
        </Suspense>
      </Router>
    </ErrorBoundary>
  )
}

export default App;
