import { RefObject, useEffect, useRef } from 'react';

/* Pull a full-screen sheet down to close it, like a phone's own sheets: from its header, or from
   anywhere once its contents are scrolled to the top. The sheet follows the finger; let go far
   enough down (a fifth of the screen, at most 120px) or with a flick, and it carries on down at the
   finger's speed and closes; otherwise it springs back. Pulling up just scrolls the contents.

   Smoothness (owner 2026-11-21): only transform and opacity change while the finger moves, written
   once per frame; the height is read once when the drag starts (reading it after a write forces a
   layout every frame); the slide down is ours from start to end, and the menu is told it closed
   only once the sheet is off screen, so the CSS class never takes over mid-way (no jump back, no
   flash of the scrim, no contents fading out on the way down). */

const START_AFTER = 6; // px: smaller moves are taps
const FLICK = 0.5; // px per ms, downwards
const MIN_SPEED = 1.6; // px per ms: a slow pull still leaves briskly
const RADIUS = '28px 28px 0 0';

// How far the sheet moves for a pull of `dy` px (never up)
export const dragOffset = (dy: number) => Math.max(0, dy);

// Whether letting go closes the sheet: pulled far enough, or flicked down (not pushed back up)
export const releaseCloses = (offset: number, velocity: number, height: number) => {
  if (velocity < -0.2) return false;
  return velocity > FLICK || offset > Math.min(120, height * 0.2);
};

// The rest of the way down: how long (ms) and the curve, so it starts at the finger's own speed
// and does not slow to a crawl at the bottom edge
export const closeMotion = (offset: number, velocity: number, height: number) => {
  const remaining = Math.max(1, height - offset);
  const speed = Math.max(MIN_SPEED, velocity);
  const ms = Math.round(Math.min(380, Math.max(180, (remaining / speed) * 1.5)));
  // A cubic-bezier's starting slope is y1/x1; match it to the finger's speed over the remaining run
  const slope = Math.min(3, Math.max(0.6, (Math.max(0, velocity) * ms) / remaining));
  const x1 = 0.3;
  const y1 = Math.min(1, +(x1 * slope).toFixed(3));
  return { ms, easing: `cubic-bezier(${x1}, ${y1}, 0.6, 1)` };
};

const BACK_MS = 380;
const BACK = 'cubic-bezier(0.2, 0.9, 0.3, 1)';

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
    let settling = false;
    let offset = 0;
    let height = 0;
    let frame = 0;
    let samples: { y: number, t: number }[] = [];

    const scrimEl = () => refs.scrim.current;
    const paint = () => {
      frame = 0;
      sheet.style.transform = `translate3d(0, ${offset}px, 0)`;
      const scrim = scrimEl();
      if (scrim) scrim.style.opacity = String(Math.max(0, 1 - offset / height));
    };
    const reset = () => {
      sheet.style.transition = '';
      sheet.style.transform = '';
      sheet.style.borderRadius = '';
      sheet.style.pointerEvents = '';
      const scrim = scrimEl();
      if (scrim) { scrim.style.transition = ''; scrim.style.opacity = ''; scrim.style.pointerEvents = ''; }
    };
    // Runs once the transition is over, or after `ms` if transitionend never comes (tab hidden etc.)
    const after = (ms: number, done: () => void) => {
      let finished = false;
      const finish = () => {
        if (finished) return;
        finished = true;
        sheet.removeEventListener('transitionend', onEndEvt);
        window.clearTimeout(timer);
        done();
      };
      const onEndEvt = (e: TransitionEvent) => { if (e.target === sheet && e.propertyName === 'transform') finish(); };
      sheet.addEventListener('transitionend', onEndEvt);
      const timer = window.setTimeout(finish, ms + 80);
    };

    const onStart = (e: TouchEvent) => {
      if (settling || e.touches.length !== 1) { can = false; return; }
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
        height = sheet.offsetHeight || window.innerHeight; // read once, before any write
        sheet.style.transition = 'none';
        sheet.style.borderRadius = RADIUS;
        const scrim = scrimEl();
        if (scrim) scrim.style.transition = 'none';
      }
      e.preventDefault();
      offset = dragOffset(y - startY);
      samples.push({ y, t: e.timeStamp });
      while (samples.length > 2 && e.timeStamp - samples[0].t > 90) samples.shift();
      if (!frame) frame = requestAnimationFrame(paint);
    };

    const onEnd = () => {
      if (!dragging) { can = false; return; }
      dragging = false;
      can = false;
      if (frame) { cancelAnimationFrame(frame); frame = 0; }
      const first = samples[0];
      const last = samples[samples.length - 1];
      const velocity = last && first && last.t > first.t ? (last.y - first.y) / (last.t - first.t) : 0;
      const scrim = scrimEl();
      settling = true;
      if (releaseCloses(offset, velocity, height)) {
        const { ms, easing } = closeMotion(offset, velocity, height);
        sheet.style.pointerEvents = 'none';
        sheet.style.transition = `transform ${ms}ms ${easing}`;
        sheet.style.transform = `translate3d(0, ${height}px, 0)`;
        if (scrim) {
          scrim.style.pointerEvents = 'none';
          scrim.style.transition = `opacity ${ms}ms ${easing}`;
          scrim.style.opacity = '0';
        }
        after(ms, () => {
          // Off screen now: the class takes over where it already is, then our styles go
          closeRef.current();
          requestAnimationFrame(() => requestAnimationFrame(() => { reset(); settling = false; }));
        });
      } else {
        sheet.style.transition = `transform ${BACK_MS}ms ${BACK}, border-radius ${BACK_MS}ms ease`;
        sheet.style.transform = 'translate3d(0, 0, 0)';
        sheet.style.borderRadius = '0';
        if (scrim) {
          scrim.style.transition = `opacity ${BACK_MS}ms ${BACK}`;
          scrim.style.opacity = '1';
        }
        after(BACK_MS, () => { reset(); settling = false; });
      }
    };

    sheet.addEventListener('touchstart', onStart, { passive: true });
    sheet.addEventListener('touchmove', onMove, { passive: false });
    sheet.addEventListener('touchend', onEnd);
    sheet.addEventListener('touchcancel', onEnd);
    return () => {
      if (frame) cancelAnimationFrame(frame);
      sheet.removeEventListener('touchstart', onStart);
      sheet.removeEventListener('touchmove', onMove);
      sheet.removeEventListener('touchend', onEnd);
      sheet.removeEventListener('touchcancel', onEnd);
    };
    // refs are stable
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);
};
