// Invite a friend (GET client/referrals, spec 2026-11-20 in Exios-Api): the words the invite page,
// the home card and the sign-up page use, and the code a shared link brings to the sign-up page.

export type FriendStatus = 'joined' | 'sharing' | 'ended' | 'canceled';
export type Friend = {
  id: string, name: string, joinedAt: string, status: FriendStatus, qualifiedAt: string | null, shareEndsAt: string | null, points: number,
  // What the friend paid in total, and what is left before the inviter's big reward
  paidUsd: number, leftUsd: number,
  // Rewards from this friend still waiting their 24 hours
  heldPoints: number,
  // Why its rewards wait beyond the 24 hours: the friend's passport not verified yet, or the office's review
  waiting?: 'passport' | 'review' | null,
};
// A step needs both: that many friends who reached the big reward, and that much paid by all friends
export type Step = { friends: number, usd: number, points: number, title?: string, ambassador?: boolean, reached: boolean };
export type Referrals = {
  off: false, code: string, path: string, welcomePoints: number, firstPoints: number, qualifyUsd: number,
  sharePoints: number, sharePerUsd: number, ambassadorSharePoints: number, ambassadorTitle: string, ambassadorAt: string | null, months: number, qualified: number, friendsPaidUsd: number, steps: Step[], friends: Friend[], totalPoints: number, heldPoints: number, holdHours: number,
} | { off: true };

// Every new account without an inviter gets this at sign-up (invited: the welcome gift instead, never both)
export const SIGNUP_GIFT_POINTS = 100;
// The inviter's reward per friend (shown on the home card; the invite page reads it from the server)
export const INVITE_REWARD_POINTS = 500;

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
// (owner's wording, 2026-11-20)
export const shareMessage = (link: string, welcomePoints: number) => [
  'السلام عليكم كان تبي تشحن جوي ولا بحري من الصين وتوفر في سعر الشحن',
  `سجل من رابطي ويعطوك ${pointsNum(welcomePoints)} نقطة في حسابك ${(Number(welcomePoints) || 0) / 100} دولار تستعملها أول فاتورة شحن او شراء لكي`,
  link,
].join('\n');

const friendsWord = (n: number) => (n === 1 ? 'صديق واحد' : n === 2 ? 'صديقان' : `${n} أصدقاء`);

// The next step: what is still missing (friends, dollars or both), or null when all are reached
export function nextStepText(qualified: number, paidUsd: number, steps: Step[]) {
  const next = steps.find((s) => !s.reached);
  if (!next) return null;
  const friendsLeft = Math.max(next.friends - qualified, 0);
  const usdLeft = Math.max(next.usd - paidUsd, 0);
  const missing = [friendsLeft && friendsWord(friendsLeft), usdLeft && `${pointsNum(usdLeft)}$ من مدفوعات أصدقائك`].filter(Boolean).join(' و');
  return `باقي ${missing} على ${pointsNum(next.points)} نقطة إضافية${next.title ? ` ولقب «${next.title}»` : ''}`;
}

// Whole calendar months from now until the share ends: 20 Nov to 20 Nov next year is 12 (dividing
// the 365 days by an average month gave 13)
function monthsLeft(until: string, now: number) {
  const a = new Date(now);
  const b = new Date(until);
  let months = (b.getUTCFullYear() - a.getUTCFullYear()) * 12 + (b.getUTCMonth() - a.getUTCMonth());
  const dayOf = (d: Date) => ((d.getUTCDate() * 24 + d.getUTCHours()) * 60 + d.getUTCMinutes()) * 60 + d.getUTCSeconds();
  if (dayOf(b) < dayOf(a)) months -= 1;
  return Math.max(months, 0);
}
const monthsText = (m: number) => (m < 1 ? 'أقل من شهر' : m === 1 ? 'شهر واحد' : m === 2 ? 'شهران' : m <= 10 ? `${m} أشهر` : `${m} شهراً`);

export function friendStatusText(f: Friend, qualifyUsd: number, now = Date.now()) {
  if (f.status === 'canceled') return { text: 'أُلغيت الدعوة', tone: 'muted' };
  if (f.status === 'joined') {
    return { text: f.paidUsd > 0 ? `دفع ${pointsNum(f.paidUsd)}$ · باقي ${pointsNum(f.leftUsd)}$ على مكافأتك` : `سجّل · مكافأتك عندما يصل مجموع ما يدفعه ${qualifyUsd}$`, tone: 'wait' };
  }
  if (f.status === 'ended') return { text: 'انتهت سنة الحصة', tone: 'muted' };
  return { text: `تكسب من شحنه · باقي ${monthsText(monthsLeft(f.shareEndsAt as string, now))}`, tone: 'live' };
}

// Why a friend's rewards wait (shown under their status), or null
export const waitingText = (waiting?: Friend['waiting']) => (waiting === 'passport' ? 'مكافآتك منه تنتظر توثيق جوازه'
  : waiting === 'review' ? 'مكافآتك منه قيد مراجعة المكتب' : null);

// ---- The record of rewards (GET client/referrals/history) ----
export type HistoryItem = {
  id: string, kind: 'first' | 'share' | 'step', points: number, countsForLevel: boolean,
  state: 'granted' | 'pending' | 'canceled',
  // canceled after it was given: taken back from the balance
  revoked?: boolean,
  // pending: 'hold' (its 24 hours), 'passport', 'review', 'soon'; canceled: the reason in words
  note: string | null, releaseAt: string | null, at: string, grantedAt: string | null, canceledAt: string | null,
  friend: { id: string, name: string } | null, orderNumber: string | null, paidUsd: number | null,
  step: { friends: number, usd: number, title: string | null } | null,
};
export type HistoryFriend = {
  id: string, name: string, joinedAt: string, status: FriendStatus, paidUsd: number, leftUsd: number,
  qualifiedAt: string | null, shareEndsAt: string | null, orders: number, waiting: 'passport' | 'review' | null,
};
export type HistoryResponse = {
  off: boolean, items: HistoryItem[], page: number, pages: number, total: number,
  totals: { granted: number, pending: number, canceled: number }, friend: HistoryFriend | null, holdHours: number, qualifyUsd: number,
};

// What a reward is
export const kindText = (i: Pick<HistoryItem, 'kind' | 'step'>) => (i.kind === 'first' ? 'مكافأة الدعوة'
  : i.kind === 'share' ? 'حصتك من شحنه'
    : `مكافأة ${i.step?.friends ?? ''} أصدقاء${i.step?.title ? ` ولقب «${i.step.title}»` : ''}`);

const hoursLeft = (until: string, now: number) => Math.max(Math.ceil((new Date(until).getTime() - now) / 3600000), 1);
const hoursText = (h: number) => (h === 1 ? 'ساعة' : h === 2 ? 'ساعتين' : h <= 10 ? `${h} ساعات` : `${h} ساعة`);
const shortDay = (d: string) => new Date(d).toLocaleDateString('ar-LY-u-nu-latn', { day: 'numeric', month: 'long' });

// Where a reward stands, in words
export function historyNoteText(i: Pick<HistoryItem, 'state' | 'note' | 'releaseAt' | 'grantedAt' | 'revoked'>, holdHours: number, now = Date.now()) {
  if (i.state === 'granted') return i.grantedAt ? `أُضيفت لرصيدك ${shortDay(i.grantedAt)}` : 'أُضيفت لرصيدك';
  if (i.state === 'canceled' && i.revoked) return i.note ? `سُحبت من رصيدك: ${i.note}` : 'سُحبت من رصيدك';
  if (i.state === 'canceled') return i.note ? `أُلغيت: ${i.note}` : 'أُلغيت';
  if (i.note === 'hold' && i.releaseAt) return `تُضاف بعد ${hoursText(hoursLeft(i.releaseAt, now))}`;
  if (i.note === 'passport') return 'تنتظر توثيق جواز صديقك';
  if (i.note === 'review') return 'قيد مراجعة المكتب';
  return `تُضاف خلال ساعة (بعد مهلة ${holdHours} ساعة)`;
}

export const homeInviteText = (firstPoints: number) => ({
  title: `ادعُ صديقك واكسب ${usd(firstPoints)}`,
  sub: 'وتكسب من كل شحنة له لمدة سنة كاملة',
});
