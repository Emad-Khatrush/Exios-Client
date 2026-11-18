import { useLayoutEffect } from 'react';
import { useLocation, useNavigationType } from 'react-router-dom';

/* Going back (the phone's swipe from the edge, its back button, the browser's back) should feel
   like a native app: the page you came from is just there, where you left it.
   Every signed-in page scrolls inside one shared .app-main, which the browser cannot remember per
   page, so this does it:
   - each history entry keeps its own scroll position;
   - a new page opens at the top (it used to open wherever the previous page had been scrolled to);
   - back or forward returns to the saved position, and while the page is shown again its entrance
     animations are skipped (html.nav-back): the phone has just slid that page in already, so
     replaying them looked like a glitch. The class stays until the next new page is opened. */

const positions = new Map<string, number>();
// A page whose content is still loading is too short at first: keep restoring for a moment
const RESTORE_FOR_MS = 1500;

// While a position is being put back the page scrolls on its own: the bottom bar must not take that
// for the customer scrolling down and slide away (Sidebar's useBarAway asks this)
let restoring = false;
export const isRestoringScroll = () => restoring;
// Opening the app (or reloading it) is a POP too, but nothing was shown before: that first page
// plays its entrance as usual
let firstPage = true;

const ScrollMemory = () => {
  const location = useLocation();
  const navType = useNavigationType();

  useLayoutEffect(() => {
    const el = document.querySelector<HTMLElement>('.app-main');
    if (!el) return undefined;
    const { key } = location;
    const root = document.documentElement;
    let raf = 0;
    let stopped = false;

    const back = navType === 'POP' && !firstPage;
    firstPage = false;

    if (back) {
      root.classList.add('nav-back');
      const target = positions.get(key) || 0;
      const start = performance.now();
      const restore = () => {
        if (stopped) return;
        restoring = true;
        el.scrollTop = target;
        const reached = el.scrollHeight - el.clientHeight >= target;
        if (!reached && performance.now() - start < RESTORE_FOR_MS) raf = requestAnimationFrame(restore);
        // The scroll event of the last step arrives in the next frame
        else raf = requestAnimationFrame(() => { restoring = false; });
      };
      restore();
    } else {
      root.classList.remove('nav-back');
      el.scrollTop = 0;
    }

    // The customer scrolling themselves ends any restoring still going on
    const stop = () => { stopped = true; restoring = false; cancelAnimationFrame(raf); };
    const save = () => positions.set(key, el.scrollTop);
    el.addEventListener('scroll', save, { passive: true });
    el.addEventListener('touchstart', stop, { passive: true });
    el.addEventListener('wheel', stop, { passive: true });
    return () => {
      stop();
      el.removeEventListener('scroll', save);
      el.removeEventListener('touchstart', stop);
      el.removeEventListener('wheel', stop);
    };
    // A new history entry (or a return to one) is a new location key
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [location.key]);

  return null;
};

export default ScrollMemory;
