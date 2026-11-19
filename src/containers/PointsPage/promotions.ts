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
