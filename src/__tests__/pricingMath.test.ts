import { payAtText, purchaseQuote, withDelivery, shippingQuote, swiftQuote, tierFor, toNumber } from '../containers/PricesPage/pricingMath';

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

// 2026-11-24: a site's own commission (or none) and free shipping, and a route's least weight
describe('purchaseQuote: a site with its own terms', () => {
  const cfg: any = {
    sites: [
      { key: 'shein', label: 'شي ان', feePercent: 0, commission: 'none', commissionValue: 0, freeShipping: true },
      { key: 'amazon', label: 'أمازون', feePercent: 0, commission: 'percent', commissionValue: 2 },
      { key: 'temu', label: 'تيمو', feePercent: 0, commission: 'fixed', commissionValue: 20 },
    ],
    tiers: [{ upTo: null, type: 'percent', value: 10 }],
    minCommission: 15,
  };
  it('no commission at all, not even the minimum, and says the shipping is free', () => {
    const quote = purchaseQuote(cfg, 100, 'shein');
    expect(quote?.total).toBe(100);
    expect(quote?.lines.map((l) => l.text).filter(Boolean)).toEqual(['بدون عمولة', 'شحن مجاني']);
  });
  it("the site's own percent or fixed amount in place of the brackets, with the minimum", () => {
    expect(purchaseQuote(cfg, 2000, 'amazon')?.total).toBe(2040);
    expect(purchaseQuote(cfg, 100, 'amazon')?.total).toBe(115);
    expect(purchaseQuote(cfg, 1000, 'temu')?.total).toBe(1020);
  });
});

describe('shippingQuote: the least weight', () => {
  const route: any = { key: 'china-air', label: 'جوي', method: 'air', unit: 'kg', price: 10, minCharge: 0, minWeight: 2, categories: [{ key: 'k', label: 'عادية', price: 10 }] };
  it('bills the least weight when the parcel is lighter', () => {
    const quote = shippingQuote(route, { amount: 0.5 }, 6000);
    expect(quote?.total).toBe(20);
    expect(quote?.lines.some((l) => l.label === 'أقل وزن للشحن')).toBe(true);
  });
  it('bills the real weight above it', () => expect(shippingQuote(route, { amount: 3 }, 6000)?.total).toBe(30));
  it('works the same in CBM by sea', () => {
    expect(shippingQuote({ ...route, method: 'sea', unit: 'cbm', price: 300, minWeight: 0.5, categories: [] }, { amount: 0.2 }, 6000)?.total).toBe(150);
  });
});

// 2026-11-25: qirsh a dollar by where the customer pays, shown as dollars + dinars
describe('withDelivery', () => {
  const quote = { title: 't', lines: [], total: 100, totalLabel: '', summary: ['s'] };
  it('adds the dinars of each place: $100 at 10 qirsh is $100 + 10 LYD', () => {
    const q = withDelivery(quote, { libya: 10, turkey: 30 })!;
    expect(q.payAt).toEqual([
      { key: 'libya', label: 'تسليم في ليبيا', lyd: 10 },
      { key: 'turkey', label: 'تسليم في تركيا (عبر مكاتب الصرافة)', lyd: 30 },
    ]);
    expect(payAtText(q.total, q.payAt![0])).toBe('$100 + 10 د.ل');
    expect(q.summary).toContain('تسليم في تركيا (عبر مكاتب الصرافة): $100 + 30 د.ل');
  });
  it('a place adding nothing shows the dollars alone', () => {
    const q = withDelivery({ ...quote, total: 123.45 }, { libya: 0, turkey: 15 })!;
    expect(payAtText(q.total, q.payAt![0])).toBe('$123.45');
    expect(q.payAt![1].lyd).toBe(18.52);
  });
  it('changes nothing when neither place adds anything', () => {
    expect(withDelivery(quote, { libya: 0, turkey: 0 })).toBe(quote);
    expect(withDelivery(quote, undefined)).toBe(quote);
  });
});
