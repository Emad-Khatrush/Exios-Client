import { categoryLabel, hasSpecialPrices, specialCategories, withSpecialPrices } from '../utils/specialPrices';
import { shippingQuote } from '../containers/PricesPage/pricingMath';

const route = (country: string, method: 'air' | 'sea', price: number, minCharge = 20) => ({
  key: `${country}-${method}`, country, method, label: `${country} ${method}`, countryLabel: country,
  unit: method === 'air' ? 'kg' : 'cbm', price, duration: '', note: '', minCharge,
  categories: [{ key: 'normal', label: 'عادي', price }],
}) as any;

const routes = [route('china', 'air', 12), route('china', 'sea', 300), route('uae', 'air', 9)];
const special = {
  enabled: true,
  categories: [{ name: 'Normal', air: 9.5, sea: 250 }, { name: 'Medical', air: 14 }, { name: 'Empty' }],
};

describe('special prices', () => {
  it('only counts when switched on and priced', () => {
    expect(hasSpecialPrices(special)).toBe(true);
    expect(hasSpecialPrices({ ...special, enabled: false })).toBe(false);
    expect(hasSpecialPrices({ enabled: true, categories: [{ name: 'Normal' }] })).toBe(false);
    expect(specialCategories(special).map((c) => c.name)).toEqual(['Normal', 'Medical']);
  });

  it('reads prices saved in the old fixed fields', () => {
    expect(specialCategories({ enabled: true, normal: { air: 8 } } as any)).toEqual([{ name: 'Normal', air: 8, sea: 0 }]);
  });

  it('names the office categories in Arabic, others as typed', () => {
    expect(categoryLabel('Copy + Cosmetic')).toBe('تجميل، صحة وماركات');
    expect(categoryLabel('ملابس')).toBe('ملابس');
  });

  it('replaces China only, by method, keeping everyone\'s price beside it', () => {
    const [air, sea, uae] = withSpecialPrices(routes, special);
    expect(air).toMatchObject({ special: true, price: 9.5, regularPrice: 12, minCharge: 0 });
    expect(air.categories.map((c: any) => c.price)).toEqual([9.5, 14]);
    expect(sea).toMatchObject({ special: true, price: 250, regularPrice: 300, minCharge: 20 });
    expect(sea.categories).toHaveLength(1);
    expect(uae).toBe(routes[2]);
  });

  it('leaves everything as it is without special prices', () => {
    expect(withSpecialPrices(routes, undefined)).toBe(routes);
    expect(withSpecialPrices(routes, { ...special, enabled: false })).toBe(routes);
  });

  it('prices the calculator with the customer\'s own rate and says so', () => {
    const [air] = withSpecialPrices(routes, special);
    const q = shippingQuote(air, { amount: 10, categoryKey: 'special-1' }, 6000) as NonNullable<ReturnType<typeof shippingQuote>>;
    expect(q.total).toBe(140);
    expect(q.lines[0]).toMatchObject({ text: 'سعرك الخاص' });
    expect(q.summary.join('\n')).toContain('سعري الخاص');
  });
});
