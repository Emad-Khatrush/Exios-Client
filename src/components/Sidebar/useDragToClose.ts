import { RefObject, useEffect, useRef } from 'react';

/* Pull a full-screen sheet down to close it, like a phone's own sheets: from its header, or from
   anywhere once its contents are scrolled to the top. The sheet follows the finger; let go far
   enough down (a fifth of the screen, at most 120px) or with a flick, and it carries on down and
   closes; otherwise it springs back. Pulling up just scrolls the contents. */

const START_AFTER = 6; // px: smaller moves are taps
const FLICK = 0.5; // px per ms, downwards

// How far the sheet moves for a pull of `dy` px (never up)
export const dragOffset = (dy: number) => Math.max(0, dy);

// Whether letting go closes the sheet: pulled far enough, or flicked down (not pushed back up)
export const releaseCloses = (offset: number, velocity: number, height: number) => {
  if (velocity < -0.2) return false;
  return velocity > FLICK || offset > Math.min(120, height * 0.2);
};

const CLOSE = 'transform 0.3s cubic-bezier(0.2, 0.8, 0.3, 1), visibility 0s linear 0.3s';
const BACK = 'transform 0.42s cubic-bezier(0.2, 0.9, 0.3, 1)';

export const useDragToClose = (
  open: boolean,
  onClose: () => void,
  refs: { sheet: RefObject<HTMLElement>, body: RefObject<HTMLElement>, head: RefObject<HTMLElement>, scrim: RefObject<HTMLElement> },
) => {
  const closeRef = useRef(onClose);
  closeRef.current = onClose;

  useEffect(() => {
    const sheet = refs.sheet.current;
    if (!open || !sheet) return undefined;
    let startY = 0;
    let can = false;
    let dragging = false;
    let offset = 0;
    let samples: { y: number, t: number }[] = [];
    let timer: number | undefined;

    const style = (transform: string, transition: string, opacity: string, radius: string) => {
      sheet.style.transition = transition;
      sheet.style.transform = transform;
      sheet.style.borderRadius = radius;
      const scrim = refs.scrim.current;
      if (scrim) {
        scrim.style.transition = transition ? 'opacity 0.3s ease' : 'none';
        scrim.style.opacity = opacity;
      }
    };
    const clearLater = (ms: number) => {
      window.clearTimeout(timer);
      timer = window.setTimeout(() => style('', '', '', ''), ms);
    };

    const onStart = (e: TouchEvent) => {
      if (e.touches.length !== 1) { can = false; return; }
      const fromHead = !!refs.head.current?.contains(e.target as Node);
      can = fromHead || (refs.body.current?.scrollTop ?? 0) <= 0;
      dragging = false;
      offset = 0;
      startY = e.touches[0].clientY;
      samples = [{ y: startY, t: e.timeStamp }];
    };

    const onMove = (e: TouchEvent) => {
      if (!can) return;
      const y = e.touches[0].clientY;
      const dy = y - startY;
      if (!dragging) {
        if (dy < -START_AFTER) { can = false; return; } // scrolling the contents up
        if (dy < START_AFTER) return;
        dragging = true;
        startY = y; // no jump when the drag takes over
        window.clearTimeout(timer);
      }
      e.preventDefault();
      offset = dragOffset(y - startY);
      samples = [...samples.filter((s) => e.timeStamp - s.t < 90), { y, t: e.timeStamp }];
      const fade = Math.max(0, 1 - offset / sheet.offsetHeight);
      style(`translate3d(0, ${offset}px, 0)`, 'none', String(fade), '28px 28px 0 0');
    };

    const onEnd = () => {
      if (!dragging) { can = false; return; }
      dragging = false;
      can = false;
      const first = samples[0];
      const last = samples[samples.length - 1];
      const velocity = last && first && last.t > first.t ? (last.y - first.y) / (last.t - first.t) : 0;
      if (releaseCloses(offset, velocity, sheet.offsetHeight)) {
        // The class change takes it from where the finger left it the rest of the way down
        style('', CLOSE, '', '28px 28px 0 0');
        closeRef.current();
        clearLater(340);
      } else {
        style('', BACK, '', '');
        clearLater(440);
      }
    };

    sheet.addEventListener('touchstart', onStart, { passive: true });
    sheet.addEventListener('touchmove', onMove, { passive: false });
    sheet.addEventListener('touchend', onEnd);
    sheet.addEventListener('touchcancel', onEnd);
    return () => {
      sheet.removeEventListener('touchstart', onStart);
      sheet.removeEventListener('touchmove', onMove);
      sheet.removeEventListener('touchend', onEnd);
      sheet.removeEventListener('touchcancel', onEnd);
    };
    // refs are stable
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);
};
