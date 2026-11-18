import { purchaseQuote, swiftQuote, tierFor, toNumber } from '../containers/PricesPage/pricingMath';

describe('toNumber: what the customer types', () => {
  it('reads Arabic-Indic digits and a comma as the decimal sign', () => {
    expect(toNumber('١٢٣')).toBe(123);
    expect(toNumber('12,5')).toBe(12.5);
    expect(toNumber('$ 1500')).toBe(1500);
  });
  it('is 0 for nothing at all', () => {
    expect(toNumber('')).toBe(0);
    expect(toNumber('abc')).toBe(0);
  });
});

describe('tierFor', () => {
  const tiers = [{ upTo: 100, value: 10 }, { upTo: 1000, value: 5 }, { upTo: null, value: 3 }];
  it('picks the first bracket the amount does not pass', () => {
    expect(tierFor(tiers, 100).value).toBe(10);
    expect(tierFor(tiers, 101).value).toBe(5);
    expect(tierFor(tiers, 50000).value).toBe(3);
  });
});

describe('purchaseQuote', () => {
  const cfg: any = {
    sites: [{ key: 'alibaba', label: 'علي بابا', feePercent: 3 }, { key: 'other', label: 'مواقع أخرى', feePercent: 0 }],
    tiers: [{ upTo: 500, type: 'percent', value: 10 }, { upTo: null, type: 'percent', value: 5 }],
    minCommission: 15,
  };
  it('adds the site fee and the commission of the bracket', () => {
    expect(purchaseQuote(cfg, 1000, 'alibaba')?.total).toBe(1000 + 30 + 50);
  });
  it('never charges less than the minimum commission', () => {
    expect(purchaseQuote(cfg, 100, 'other')?.total).toBe(115);
  });
  it('has no quote without an amount', () => expect(purchaseQuote(cfg, 0, 'other')).toBeNull());
});

describe('swiftQuote', () => {
  const cfg: any = { tiers: [{ upTo: null, type: 'percent', value: 2 }], minFee: 25, fixedFee: 10 };
  it('adds the percentage and the bank fee', () => expect(swiftQuote(cfg, 5000)?.total).toBe(5000 + 100 + 10));
  it('uses the minimum when the percentage is below it', () => expect(swiftQuote(cfg, 500)?.total).toBe(500 + 25 + 10));
});
