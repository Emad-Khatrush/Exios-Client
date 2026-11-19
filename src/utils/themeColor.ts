// The colour of the phone's bar behind the clock and icons (meta theme-color): an installed app on
// iPhone (and Android) paints that bar with it, so it is the colour at the top of the page shown —
// white on the public pages (landing, sign-in on a phone), the app's background everywhere else.
const WHITE_PAGES = ['/', '/login', '/signup', '/reset-password'];
export const APP_BACKGROUND = '#f2f5f3';

export const themeColorFor = (pathname: string) => (WHITE_PAGES.includes(pathname) ? '#ffffff' : APP_BACKGROUND);
