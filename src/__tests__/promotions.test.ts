import { earnRates, isActive, promotionLine, timeLeft, winningOffer } from '../containers/PointsPage/promotions';

// Libya days 2026-11-20 .. 2026-11-27 (the server's startsAt / endsAt, end exclusive)
const base = {
  id: 'p1', name: 'الجمعة البيضاء', multiplierPct: 200, state: 'active' as const,
  startsAt: '2026-11-19T22:00:00.000Z', endsAt: '2026-11-27T22:00:00.000Z',
  kinds: ['shipping'] as ('shipping' | 'purchase' | 'remittance')[], methods: ['sea'] as ('air' | 'sea')[], countries: ['china'],
};
const HOUR = 3600 * 1000;

describe('points offers: what the customer reads', () => {
  it('says what the offer covers and its last day, in Libya', () => {
    expect(promotionLine(base)).toBe('نقاطك ×2 على الشحن البحري من الصين حتى الجمعة 27 نوفمبر');
    expect(promotionLine({ ...base, multiplierPct: 150, kinds: ['purchase'] })).toBe('نقاطك ×1.5 على فواتير الشراء حتى الجمعة 27 نوفمبر');
    expect(promotionLine({ ...base, kinds: ['shipping', 'purchase', 'remittance'], methods: [], countries: [] }))
      .toBe('نقاطك ×2 على الشحن وفواتير الشراء والحوالات حتى الجمعة 27 نوفمبر');
  });

  it('counts down in days and hours, then hours, then the last hour', () => {
    const end = new Date(base.endsAt).getTime();
    expect(timeLeft(base.endsAt, new Date(end - (3 * 24 + 5) * HOUR)).text).toBe('باقي 3 أيام و5 ساعات');
    expect(timeLeft(base.endsAt, new Date(end - 5 * HOUR)).text).toBe('باقي 5 ساعات');
    expect(timeLeft(base.endsAt, new Date(end - 20 * 60 * 1000)).text).toBe('ينتهي خلال ساعة');
    expect(timeLeft(base.endsAt, new Date(end - 24 * HOUR)).text).toBe('باقي يوم واحد');
  });

  it('knows when an offer is running', () => {
    expect(isActive(base, new Date('2026-11-21T10:00:00Z'))).toBe(true);
    expect(isActive(base, new Date('2026-11-28T10:00:00Z'))).toBe(false);
    expect(isActive(base, new Date('2026-11-19T10:00:00Z'))).toBe(false);
  });
});


describe('points offers: the earning rates the page shows', () => {
  const now = new Date('2026-11-21T10:00:00Z');
  const sea = { ...base, methods: ['sea'] as ('air' | 'sea')[], countries: ['china'] };

  it('a gold customer under a ×2 shipping offer: shipping doubles, the rest stay at the level', () => {
    const [shipping, purchase, remittance] = earnRates(125, [sea], now);
    expect(shipping).toMatchObject({ kind: 'shipping', pct: 200, perTwenty: 20, levelPerTwenty: 12.5, example: 30, scope: 'البحري من الصين فقط' });
    expect(shipping.offer?.name).toBe('الجمعة البيضاء');
    expect(purchase).toMatchObject({ kind: 'purchase', pct: 125, perTwenty: 12.5, example: 18, offer: null });
    expect(remittance).toMatchObject({ kind: 'remittance', pct: 125, perTwenty: 6.25, example: 8, offer: null });
  });

  it('a level above the offer keeps the level, and no offer is shown on the rates', () => {
    const small = { ...sea, multiplierPct: 150 };
    expect(earnRates(175, [small], now)[0]).toMatchObject({ pct: 175, offer: null });
    expect(winningOffer(175, [small], now)).toEqual({ offer: base.name, pct: 150, wins: false });
    expect(winningOffer(125, [small], now)).toEqual({ offer: base.name, pct: 150, wins: true });
  });

  it('an offer on every kind with no filters has no scope note', () => {
    const all = { ...base, kinds: ['shipping', 'purchase', 'remittance'] as ('shipping' | 'purchase' | 'remittance')[], methods: [], countries: [] };
    const rates = earnRates(100, [all], now);
    expect(rates.map((r) => r.pct)).toEqual([200, 200, 200]);
    expect(rates[0].scope).toBe('');
    expect(rates[2].example).toBe(14);
  });

  it('no running offer: everything at the level', () => {
    expect(earnRates(110, [base], new Date('2026-12-05T10:00:00Z')).map((r) => r.offer)).toEqual([null, null, null]);
    expect(winningOffer(110, [], now)).toBeNull();
  });
});

describe('the offer card on home', () => {
  const { countdownParts, offerPoints } = require('../containers/PointsPage/promotions');

  it('counts down in days, hours, minutes and seconds, never below zero', () => {
    const end = new Date(base.endsAt).getTime();
    const left = ((3 * 24 + 5) * 3600 + 42 * 60 + 17) * 1000;
    expect(countdownParts(base.endsAt, new Date(end - left))).toEqual({ days: '3', hours: '05', minutes: '42', seconds: '17' });
    expect(countdownParts(base.endsAt, new Date(end + 5000))).toEqual({ days: '0', hours: '00', minutes: '00', seconds: '00' });
  });

  it('works out the points of an amount now and without the offer, as the server does', () => {
    // $200 shipping: 100 base points; gold ×1.25 → 125; offer ×2 → 200
    expect(offerPoints(200, 'shipping', 125, 200)).toEqual({ now: 200, before: 125, extra: 75 });
    // $30 Alipay: 7 base points; bronze ×1 → 7; offer ×3 → 21
    expect(offerPoints(30, 'remittance', 100, 300)).toEqual({ now: 21, before: 7, extra: 14 });
  });
});
