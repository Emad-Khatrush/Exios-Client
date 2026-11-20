import { closeMotion, dragOffset, releaseCloses } from '../components/Sidebar/useDragToClose';

describe('pulling the menu down to close it', () => {
  it('follows the finger down, never up', () => {
    expect(dragOffset(0)).toBe(0);
    expect(dragOffset(-40)).toBe(0);
    expect(dragOffset(100)).toBe(100);
  });

  it('closes when pulled far enough or flicked down', () => {
    expect(releaseCloses(130, 0.1, 800)).toBe(true); // past the threshold
    expect(releaseCloses(40, 0.8, 800)).toBe(true); // a quick flick
    expect(releaseCloses(60, 0.2, 800)).toBe(false); // a short slow pull springs back
    expect(releaseCloses(130, -0.6, 800)).toBe(false); // pulled down, then pushed back up
  });

  it('finishes faster after a fast flick, within bounds', () => {
    const slow = closeMotion(150, 0.1, 800);
    const fast = closeMotion(150, 3, 800);
    expect(fast.ms).toBeLessThan(slow.ms);
    expect(slow.ms).toBeLessThanOrEqual(380);
    expect(fast.ms).toBeGreaterThanOrEqual(180);
  });

  it('starts at the finger\'s speed: a flick starts steeper than a slow pull', () => {
    const y1 = (e: string) => Number(e.split(',')[1]);
    expect(y1(closeMotion(150, 3, 800).easing)).toBeGreaterThan(y1(closeMotion(150, 0.1, 800).easing));
  });
});
