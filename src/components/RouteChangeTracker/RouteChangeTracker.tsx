import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import api from '../../api';
import { getVisitorSessionId } from '../../utils/analytics';

// Pings the admin analytics endpoint on every route the SPA renders, logged in
// or not (landing/login/signup included). Rendered once inside <Router>, next
// to <Routes>, so useLocation always has a router context.
const RouteChangeTracker = () => {
  const location = useLocation();

  useEffect(() => {
    api.trackVisit({
      sessionId: getVisitorSessionId(),
      path: location.pathname,
      referrer: document.referrer,
    }).catch(() => {
      // Analytics must never break the app.
    });
  }, [location.pathname]);

  return null;
};

export default RouteChangeTracker;
