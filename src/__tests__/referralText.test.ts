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
  { friends: 3, usd: 1000, points: 1000, reached: false },
  { friends: 5, usd: 3000, points: 2000, title: 'سفير إكسيوس', reached: false },
  { friends: 10, usd: 6000, points: 5000, reached: false },
];

describe('invite a friend: what the customer reads', () => {
  it('points read as dollars', () => {
    expect(usd(1000)).toBe('10$');
    expect(usd(1015)).toBe('10.15$');
    expect(headline(1000)).toBe('اكسب 10$ عن كل صديق، ومن كل شحنة له لمدة سنة');
    expect(homeInviteText(1000).title).toBe('ادعُ صديقك واكسب 10$');
  });

  it('the WhatsApp message is the owner\'s wording, then the link', () => {
    expect(shareMessage('https://app.test/r/ABC234', 500)).toBe(
      'السلام عليكم كان تبي تشحن جوي ولا بحري من الصين وتوفر في سعر الشحن\n'
      + 'سجل من رابطي ويعطوك 500 نقطة في حسابك 5 دولار تستعملها أول فاتورة شحن او شراء لكي\n'
      + 'https://app.test/r/ABC234',
    );
  });

  it('the steps say what is missing: friends, dollars or both', () => {
    expect(nextStepText(0, 0, steps)).toBe('باقي 3 أصدقاء و1,000$ من مدفوعات أصدقائك على 1,000 نقطة إضافية');
    expect(nextStepText(3, 600, steps)).toBe('باقي 400$ من مدفوعات أصدقائك على 1,000 نقطة إضافية');
    const first = [{ ...steps[0], reached: true }, steps[1], steps[2]];
    expect(nextStepText(4, 3200, first)).toBe('باقي صديق واحد على 2,000 نقطة إضافية ولقب «سفير إكسيوس»');
    expect(nextStepText(3, 1000, first)).toBe('باقي صديقان و2,000$ من مدفوعات أصدقائك على 2,000 نقطة إضافية ولقب «سفير إكسيوس»');
    expect(nextStepText(10, 6000, steps.map((s) => ({ ...s, reached: true })))).toBeNull();
  });

  it('each friend\'s status', () => {
    const now = new Date('2026-11-20').getTime();
    const base = { id: '1', name: 'أحمد م.', joinedAt: '2026-11-01', qualifiedAt: null, shareEndsAt: null, points: 0, heldPoints: 0, paidUsd: 0, leftUsd: 200 };
    expect(friendStatusText({ ...base, status: 'joined' }, 200, now).text).toBe('سجّل · مكافأتك عندما يصل مجموع ما يدفعه 200$');
    expect(friendStatusText({ ...base, status: 'joined', paidUsd: 80, leftUsd: 120 }, 200, now).text).toBe('دفع 80$ · باقي 120$ على مكافأتك');
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

describe('the record of rewards: what each row says', () => {
  const { kindText, historyNoteText } = require('../containers/InvitePage/referralText');
  it('the kind', () => {
    expect(kindText({ kind: 'first', step: null })).toBe('مكافأة الدعوة');
    expect(kindText({ kind: 'share', step: null })).toBe('حصتك من شحنه');
    expect(kindText({ kind: 'step', step: { friends: 10, usd: 10000, title: 'سفير إكسيوس' } })).toBe('مكافأة 10 أصدقاء ولقب «سفير إكسيوس»');
  });
  it('where it stands', () => {
    const now = new Date('2026-11-20T10:00:00Z').getTime();
    expect(historyNoteText({ state: 'pending', note: 'hold', releaseAt: '2026-11-20T15:00:00Z', grantedAt: null }, 24, now)).toBe('تُضاف بعد 5 ساعات');
    expect(historyNoteText({ state: 'pending', note: 'passport', releaseAt: null, grantedAt: null }, 24, now)).toBe('تنتظر توثيق جواز صديقك');
    expect(historyNoteText({ state: 'pending', note: 'review', releaseAt: null, grantedAt: null }, 24, now)).toBe('قيد مراجعة المكتب');
    expect(historyNoteText({ state: 'canceled', note: 'عُدّلت طلبية الصديق أو أُلغيت', releaseAt: null, grantedAt: null }, 24, now)).toBe('أُلغيت: عُدّلت طلبية الصديق أو أُلغيت');
    expect(historyNoteText({ state: 'granted', note: null, releaseAt: null, grantedAt: '2026-11-18T10:00:00Z' }, 24, now)).toBe('أُضيفت لرصيدك 18 نوفمبر');
    expect(historyNoteText({ state: 'canceled', revoked: true, note: 'عُدّلت طلبية الصديق أو أُلغيت دفعتها', releaseAt: null, grantedAt: '2026-11-18T10:00:00Z' }, 24, now))
      .toBe('سُحبت من رصيدك: عُدّلت طلبية الصديق أو أُلغيت دفعتها');
  });
});

describe('months left of the share, by the calendar', () => {
  const { friendStatusText } = require('../containers/InvitePage/referralText');
  const at = (now: string, end: string) => friendStatusText({ id: '1', name: 'أ', joinedAt: now, status: 'sharing', qualifiedAt: now, shareEndsAt: end,
    points: 0, heldPoints: 0, paidUsd: 300, leftUsd: 0 }, 200, new Date(now).getTime()).text;
  it('a whole year just started: 12 months, not 13', () => {
    expect(at('2026-11-20T18:40:00Z', '2027-11-20T18:40:00Z')).toBe('تكسب من شحنه · باقي 12 شهراً');
  });
  it('part of a month counts as whole months gone by the calendar', () => {
    expect(at('2027-05-21T10:00:00Z', '2027-11-20T18:40:00Z')).toBe('تكسب من شحنه · باقي 5 أشهر');
    expect(at('2027-09-20T10:00:00Z', '2027-11-20T18:40:00Z')).toBe('تكسب من شحنه · باقي شهران');
    expect(at('2027-11-01T10:00:00Z', '2027-11-20T18:40:00Z')).toBe('تكسب من شحنه · باقي أقل من شهر');
  });
});
