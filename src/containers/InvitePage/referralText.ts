// Invite a friend (GET client/referrals, spec 2026-11-20 in Exios-Api): the words the invite page,
// the home card and the sign-up page use, and the code a shared link brings to the sign-up page.

export type FriendStatus = 'joined' | 'sharing' | 'ended' | 'canceled';
export type Friend = { id: string, name: string, joinedAt: string, status: FriendStatus, qualifiedAt: string | null, shareEndsAt: string | null, points: number };
export type Step = { friends: number, points: number, title?: string, reached: boolean };
export type Referrals = {
  off: false, code: string, path: string, welcomePoints: number, firstPoints: number, qualifyUsd: number,
  sharePerTwenty: number, months: number, qualified: number, steps: Step[], friends: Friend[], totalPoints: number,
} | { off: true };

// 100 points = $1
export const usd = (points: number) => {
  const v = (Number(points) || 0) / 100;
  return `${Number.isInteger(v) ? v : v.toFixed(2)}$`;
};
export const pointsNum = (n: number) => Math.round(Number(n) || 0).toLocaleString('en-US');

// ---- The code a shared link carries (/r/CODE), kept for the sign-up page ----
const KEY = 'exios:referral';
const KEEP_MS = 30 * 24 * 60 * 60 * 1000;
export const cleanCode = (code: string) => String(code || '').trim().toUpperCase().replace(/[^A-Z0-9]/g, '').slice(0, 6);

export function saveCode(code: string, now = Date.now()) {
  const clean = cleanCode(code);
  if (clean.length !== 6) return;
  try { localStorage.setItem(KEY, JSON.stringify({ code: clean, at: now })); } catch { /* blocked */ }
}
export function savedCode(now = Date.now()): string {
  try {
    const saved = JSON.parse(localStorage.getItem(KEY) || 'null');
    if (saved?.code && now - Number(saved.at) < KEEP_MS) return cleanCode(saved.code);
  } catch { /* blocked or broken */ }
  return '';
}
export function forgetCode() {
  try { localStorage.removeItem(KEY); } catch { /* blocked */ }
}

// ---- The words ----
export const headline = (firstPoints: number) => `اكسب ${usd(firstPoints)} عن كل صديق، ومن كل شحنة له لمدة سنة`;

// What the friend receives on WhatsApp
export const shareMessage = (link: string, welcomePoints: number) =>
  `أشحن وأشتري من الصين إلى ليبيا مع Exios 📦\nسجّل من رابطي وخذ هدية ${pointsNum(welcomePoints)} نقطة (${usd(welcomePoints)}) على أول فاتورة شحن:\n${link}`;

// The next step of the ladder, or null when all are reached
export function nextStepText(qualified: number, steps: Step[]) {
  const next = steps.find((s) => !s.reached);
  if (!next) return null;
  const left = next.friends - qualified;
  const who = left === 1 ? 'صديق واحد' : left === 2 ? 'صديقان' : `${left} أصدقاء`;
  return `باقي ${who} على ${pointsNum(next.points)} نقطة إضافية${next.title ? ` ولقب «${next.title}»` : ''}`;
}

const monthsLeft = (until: string, now: number) => Math.max(Math.ceil((new Date(until).getTime() - now) / (30.4 * 24 * 3600 * 1000)), 0);
const monthsText = (m: number) => (m <= 1 ? 'أقل من شهر' : m === 2 ? 'شهران' : m <= 10 ? `${m} أشهر` : `${m} شهراً`);

export function friendStatusText(f: Friend, qualifyUsd: number, now = Date.now()) {
  if (f.status === 'canceled') return { text: 'أُلغيت الدعوة', tone: 'muted' };
  if (f.status === 'joined') return { text: `سجّل · تكسب مكافأتك عندما يدفع ${qualifyUsd}$`, tone: 'wait' };
  if (f.status === 'ended') return { text: 'انتهت سنة الحصة', tone: 'muted' };
  return { text: `تكسب من شحنه · باقي ${monthsText(monthsLeft(f.shareEndsAt as string, now))}`, tone: 'live' };
}

export const homeInviteText = (firstPoints: number) => ({
  title: `ادعُ صديقك واكسب ${usd(firstPoints)}`,
  sub: 'وتكسب من كل شحنة له لمدة سنة كاملة',
});
