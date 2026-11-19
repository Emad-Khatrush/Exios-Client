import { dragOffset, releaseCloses } from '../components/Sidebar/useDragToClose';

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
});
