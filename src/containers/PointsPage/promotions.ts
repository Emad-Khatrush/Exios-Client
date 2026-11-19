// Points offers (GET /client/loyalty/promotions): what an offer covers and how long it has left, in
// the customer's words. The same wording as the notification the API sends when an offer starts.
import { LoyaltyPromotion } from './loyaltyTypes';

const COUNTRIES: Record<string, string> = { china: 'الصين', uae: 'الإمارات', turkey: 'تركيا', usa: 'أمريكا', uk: 'بريطانيا' };
const DAYS = ['الأحد', 'الاثنين', 'الثلاثاء', 'الأربعاء', 'الخميس', 'الجمعة', 'السبت'];
const MONTHS = ['يناير', 'فبراير', 'مارس', 'أبريل', 'مايو', 'يونيو', 'يوليو', 'أغسطس', 'سبتمبر', 'أكتوبر', 'نوفمبر', 'ديسمبر'];
const WEEKDAY: Record<string, number> = { Sun: 0, Mon: 1, Tue: 2, Wed: 3, Thu: 4, Fri: 5, Sat: 6 };

export const timesText = (pct: number) => `×${Number((pct / 100).toFixed(2))}`;

// "الشحن البحري من الصين"، "فواتير الشراء"، "الشحن وفواتير الشراء والحوالات"
export const coverText = (p: Pick<LoyaltyPromotion, 'kinds' | 'methods' | 'countries'>) => {
  const parts: string[] = [];
  if (p.kinds.includes('shipping')) {
    const method = p.methods.length === 1 ? (p.methods[0] === 'air' ? ' الجوي' : ' البحري') : '';
    const countries = p.countries.map((c) => COUNTRIES[c] || c);
    parts.push(`الشحن${method}${countries.length ? ` من ${countries.join(' و')}` : ''}`);
  }
  if (p.kinds.includes('purchase')) parts.push('فواتير الشراء');
  if (p.kinds.includes('remittance')) parts.push('الحوالات');
  return parts.join(' و');
};

// The last day an offer covers, in Libya (endsAt is the midnight after it): "الجمعة 27 نوفمبر"
export const lastDayText = (endsAt: string) => {
  const parts = Object.fromEntries(new Intl.DateTimeFormat('en-US', { timeZone: 'Africa/Tripoli', weekday: 'short', day: 'numeric', month: 'numeric' })
    .formatToParts(new Date(new Date(endsAt).getTime() - 1)).map((x) => [x.type, x.value]));
  return `${DAYS[WEEKDAY[parts.weekday]]} ${Number(parts.day)} ${MONTHS[Number(parts.month) - 1]}`;
};

export const promotionLine = (p: LoyaltyPromotion) => `نقاطك ${timesText(p.multiplierPct)} على ${coverText(p)} حتى ${lastDayText(p.endsAt)}`;

export const isActive = (p: Pick<LoyaltyPromotion, 'startsAt' | 'endsAt'>, now = new Date()) =>
  new Date(p.startsAt).getTime() <= now.getTime() && now.getTime() < new Date(p.endsAt).getTime();

const daysWord = (n: number) => (n === 1 ? 'يوم واحد' : n === 2 ? 'يومان' : n <= 10 ? `${n} أيام` : `${n} يوماً`);
const hoursWord = (n: number) => (n === 1 ? 'ساعة' : n === 2 ? 'ساعتان' : n <= 10 ? `${n} ساعات` : `${n} ساعة`);

// How long an offer has left: "باقي 3 أيام و5 ساعات"، "باقي 5 ساعات"، "ينتهي خلال ساعة"
export const timeLeft = (endsAt: string, now = new Date()) => {
  const ms = Math.max(new Date(endsAt).getTime() - now.getTime(), 0);
  const days = Math.floor(ms / 86400000);
  const hours = Math.floor((ms % 86400000) / 3600000);
  let text = 'ينتهي خلال ساعة';
  if (days > 0) text = `باقي ${daysWord(days)}${hours > 0 ? ` و${hoursWord(hours)}` : ''}`;
  else if (hours > 0) text = `باقي ${hoursWord(hours)}`;
  return { days, hours, text };
};

// "يبدأ غداً"، "يبدأ بعد 3 أيام"
export const startsInText = (startsAt: string, now = new Date()) => {
  const days = Math.ceil((new Date(startsAt).getTime() - now.getTime()) / 86400000);
  return days <= 1 ? 'يبدأ غداً' : days === 2 ? 'يبدأ بعد يومين' : `يبدأ بعد ${daysWord(days)}`;
};

/* ---- The earning rates with a running offer (the points page shows the effective ones) ---- */
export type EarnKind = 'shipping' | 'purchase' | 'remittance';
// Points per $20 before any multiplier: shipping, purchase invoices and SWIFT 10, Alipay 5
const BASE_PER_TWENTY: Record<EarnKind, number> = { shipping: 10, purchase: 10, remittance: 5 };
const round2 = (n: number) => Math.round(n * 100) / 100;

// What an offer is limited to on shipping: "البحري من الصين فقط", or '' when it covers all shipping
const shippingScope = (p: LoyaltyPromotion) => {
  const method = p.methods.length === 1 ? (p.methods[0] === 'air' ? 'الجوي' : 'البحري') : '';
  const from = p.countries.length ? `من ${p.countries.map((c) => COUNTRIES[c] || c).join(' و')}` : '';
  return method || from ? `${[method, from].filter(Boolean).join(' ')} فقط` : '';
};

export type EarnRate = {
  kind: EarnKind, pct: number, perTwenty: number, levelPerTwenty: number,
  // Points of a $30 order at this rate (the base rounded down, then the multiplier, rounded down)
  example: number, offer: LoyaltyPromotion | null, scope: string,
};

// Each kind of order at the higher of the level and the best running offer on it (never both)
export const earnRates = (levelPct: number, promotions: LoyaltyPromotion[], now = new Date()): EarnRate[] =>
  (['shipping', 'purchase', 'remittance'] as EarnKind[]).map((kind) => {
    const best = promotions.filter((p) => isActive(p, now) && p.kinds.includes(kind) && p.multiplierPct > levelPct)
      .sort((a, b) => b.multiplierPct - a.multiplierPct)[0] || null;
    const pct = best ? best.multiplierPct : levelPct;
    const base = BASE_PER_TWENTY[kind];
    return {
      kind, pct, offer: best,
      perTwenty: round2((base * pct) / 100),
      levelPerTwenty: round2((base * levelPct) / 100),
      example: Math.floor((Math.floor(3000 / (kind === 'remittance' ? 400 : 200)) * pct) / 100),
      scope: best && kind === 'shipping' ? shippingScope(best) : '',
    };
  });

// The highest running offer against the membership: does it beat the level for this customer?
export const winningOffer = (levelPct: number, promotions: LoyaltyPromotion[], now = new Date()) => {
  const best = promotions.filter((p) => isActive(p, now)).sort((a, b) => b.multiplierPct - a.multiplierPct)[0];
  return best ? { offer: best.name, pct: best.multiplierPct, wins: best.multiplierPct > levelPct } : null;
};

/* ---- The offer card on home: its live countdown and its points calculator ---- */
const two = (n: number) => String(n).padStart(2, '0');
export const countdownParts = (endsAt: string, now = new Date()) => {
  const s = Math.max(Math.floor((new Date(endsAt).getTime() - now.getTime()) / 1000), 0);
  return { days: String(Math.floor(s / 86400)), hours: two(Math.floor((s % 86400) / 3600)), minutes: two(Math.floor((s % 3600) / 60)), seconds: two(s % 60) };
};

// The points of an order of `usd` dollars with the offer and without it (the level alone), rounded as
// the server does: the base points down, then the multiplier down
export const offerPoints = (usd: number, kind: EarnKind, levelPct: number, offerPct: number) => {
  const basePoints = Math.floor(Math.round(usd * 100) / (kind === 'remittance' ? 400 : 200));
  const now = Math.floor((basePoints * Math.max(levelPct, offerPct)) / 100);
  const before = Math.floor((basePoints * levelPct) / 100);
  return { now, before, extra: now - before };
};

/* ---- An announced offer, before it starts ---- */
// Its first day in Libya: "الجمعة 27 نوفمبر"
export const startDayText = (startsAt: string) => lastDayText(new Date(new Date(startsAt).getTime() + 1).toISOString());

// After «خلال» the dual takes its genitive form (يومين، ساعتين)
const daysAfter = (n: number) => (n === 1 ? 'يوم' : n === 2 ? 'يومين' : n <= 10 ? `${n} أيام` : `${n} يوماً`);
const hoursAfter = (n: number) => (n === 1 ? 'ساعة' : n === 2 ? 'ساعتين' : n <= 10 ? `${n} ساعات` : `${n} ساعة`);

// "يبدأ خلال يومين و14 ساعة"، "يبدأ خلال 3 ساعات"، "يبدأ خلال دقائق"
export const startsCountdownText = (startsAt: string, now = new Date()) => {
  const { days, hours } = timeLeft(startsAt, now);
  if (days > 0) return `يبدأ خلال ${daysAfter(days)}${hours > 0 ? ` و${hoursAfter(hours)}` : ''}`;
  if (hours > 0) return `يبدأ خلال ${hoursAfter(hours)}`;
  return 'يبدأ خلال دقائق';
};
