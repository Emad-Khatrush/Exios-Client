import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';

const SITE_URL = 'https://www.exioslibya.com';
const DEFAULT_TITLE = 'اكسيوس | شحن من الصين إلى ليبيا وخدمات الشراء من الصين';

// Public pages Google should index. Every other route is the logged-in app,
// which gets noindex so search results only show the landing/sign-up pages.
const PUBLIC_PAGES: Record<string, string> = {
  '/': DEFAULT_TITLE,
  '/signup': 'افتح حساب | اكسيوس للشحن من الصين إلى ليبيا',
  '/login': 'تسجيل الدخول | اكسيوس',
};

const setMeta = (selector: string, create: () => HTMLElement, attr: string, value: string) => {
  let el = document.head.querySelector(selector) as HTMLElement | null;
  if (!el) {
    el = create();
    document.head.appendChild(el);
  }
  el.setAttribute(attr, value);
};

// Keeps <title>, canonical and robots in sync with the current route.
// Rendered once inside <Router>, next to <Routes>.
const SeoManager = () => {
  const { pathname } = useLocation();

  useEffect(() => {
    const publicTitle = PUBLIC_PAGES[pathname];
    document.title = publicTitle || 'اكسيوس';

    setMeta(
      'link[rel="canonical"]',
      () => Object.assign(document.createElement('link'), { rel: 'canonical' }),
      'href',
      `${SITE_URL}${publicTitle ? pathname : '/'}`
    );

    setMeta(
      'meta[name="robots"]',
      () => Object.assign(document.createElement('meta'), { name: 'robots' }),
      'content',
      publicTitle && pathname !== '/login' ? 'index, follow, max-image-preview:large' : 'noindex, follow'
    );
  }, [pathname]);

  return null;
};

export default SeoManager;
