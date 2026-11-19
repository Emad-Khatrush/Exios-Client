import { isActive, promotionLine, timeLeft } from '../containers/PointsPage/promotions';

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
