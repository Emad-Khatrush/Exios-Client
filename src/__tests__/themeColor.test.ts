import { themeColorFor } from '../utils/themeColor';

// The bar behind the phone's clock takes theme-color: it must be the colour at the top of the page
describe('the colour of the phone bar behind the clock', () => {
  it('is white on the landing, sign-in, sign-up and password pages', () => {
    for (const p of ['/', '/login', '/signup', '/reset-password']) expect(themeColorFor(p)).toBe('#ffffff');
  });
  it('is the app background on every signed-in page', () => {
    for (const p of ['/home', '/orders', '/order/abc', '/points', '/wallet']) expect(themeColorFor(p)).toBe('#f2f5f3');
  });
});
