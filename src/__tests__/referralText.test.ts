import {
  cleanCode, forgetCode, friendStatusText, headline, homeInviteText, nextStepText, saveCode, savedCode, shareMessage, usd,
} from '../containers/InvitePage/referralText';

// The tests run in Node: a small in-memory localStorage
const store = new Map<string, string>();
(globalThis as any).localStorage = {
  getItem: (k: string) => (store.has(k) ? store.get(k) : null),
  setItem: (k: string, v: string) => { store.set(k, String(v)); },
  removeItem: (k: string) => { store.delete(k); },
};

const steps = [
  { friends: 3, points: 1000, reached: false },
  { friends: 5, points: 2000, title: 'سفير Exios', reached: false },
  { friends: 10, points: 5000, reached: false },
];

describe('invite a friend: what the customer reads', () => {
  it('points read as dollars', () => {
    expect(usd(1000)).toBe('10$');
    expect(usd(1015)).toBe('10.15$');
    expect(headline(1000)).toBe('اكسب 10$ عن كل صديق، ومن كل شحنة له لمدة سنة');
    expect(homeInviteText(1000).title).toBe('ادعُ صديقك واكسب 10$');
  });

  it('the WhatsApp message carries the gift and the link', () => {
    const text = shareMessage('https://app.test/r/ABC234', 500);
    expect(text).toContain('500 نقطة (5$)');
    expect(text.endsWith('https://app.test/r/ABC234')).toBe(true);
  });

  it('the ladder says what is left to the next step', () => {
    expect(nextStepText(0, steps)).toBe('باقي 3 أصدقاء على 1,000 نقطة إضافية');
    expect(nextStepText(4, [{ ...steps[0], reached: true }, steps[1], steps[2]])).toBe('باقي صديق واحد على 2,000 نقطة إضافية ولقب «سفير Exios»');
    expect(nextStepText(3, [{ ...steps[0], reached: true }, steps[1], steps[2]])).toBe('باقي صديقان على 2,000 نقطة إضافية ولقب «سفير Exios»');
    expect(nextStepText(10, steps.map((s) => ({ ...s, reached: true })))).toBeNull();
  });

  it('each friend\'s status', () => {
    const now = new Date('2026-11-20').getTime();
    const base = { id: '1', name: 'أحمد م.', joinedAt: '2026-11-01', qualifiedAt: null, shareEndsAt: null, points: 0 };
    expect(friendStatusText({ ...base, status: 'joined' }, 50, now).text).toBe('سجّل · تكسب مكافأتك عندما يدفع 50$');
    expect(friendStatusText({ ...base, status: 'sharing', shareEndsAt: '2027-06-20' }, 50, now).text).toBe('تكسب من شحنه · باقي 7 أشهر');
    expect(friendStatusText({ ...base, status: 'ended' }, 50, now).tone).toBe('muted');
  });

  it('a shared link\'s code is kept 30 days for the sign-up page', () => {
    expect(cleanCode(' abc-234 ')).toBe('ABC234');
    saveCode('abc234', 1000);
    expect(savedCode(1000 + 1000)).toBe('ABC234');
    expect(savedCode(1000 + 31 * 24 * 3600 * 1000)).toBe('');
    saveCode('bad', 1000);
    expect(savedCode(2000)).toBe('ABC234');
    forgetCode();
    expect(savedCode(2000)).toBe('');
  });
});
