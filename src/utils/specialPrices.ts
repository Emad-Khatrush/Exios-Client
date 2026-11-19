// A customer's own shipping prices, set by staff in the admin (Customer > Special prices). They arrive
// with the account (GET /account/me): air per KG, sea per CBM, by kind of goods. The office applies
// them to shipments from China, so the app shows them there in place of everyone's prices.
// Keep in step with exios-admin/src/utils/specialPrices.ts. The staff note is never shown here.
import type { Category, ShippingRoute } from '../containers/PricesPage/pricingMath';

export type SpecialPriceCategory = { name: string, air?: number, sea?: number };
export type SpecialPrices = { enabled?: boolean, categories?: SpecialPriceCategory[], updatedAt?: string };

// Prices saved before the categories became editable used three fixed fields
const LEGACY_FIELDS = [
  { key: 'normal', name: 'Normal' },
  { key: 'copyCosmetic', name: 'Copy + Cosmetic' },
  { key: 'medical', name: 'Medical' },
];

// The office's category names, as customers read them; any other name is shown as typed
const LABELS: Record<string, string> = {
  normal: 'بضائع عادية',
  'copy + cosmetic': 'تجميل، صحة وماركات',
  medical: 'بضائع طبية',
};
export const categoryLabel = (name: string) => LABELS[name.trim().toLowerCase()] || name;

const price = (v: unknown) => (Number.isFinite(Number(v)) && Number(v) > 0 ? Number(v) : 0);

export const specialCategories = (sp?: SpecialPrices | null): SpecialPriceCategory[] => {
  if (!sp?.enabled) return [];
  const list = Array.isArray(sp.categories)
    ? sp.categories
    : LEGACY_FIELDS.map(({ key, name }) => ({ name, air: (sp as any)?.[key]?.air, sea: (sp as any)?.[key]?.sea }));
  return list
    .map((c) => ({ name: String(c?.name || '').trim(), air: price(c?.air), sea: price(c?.sea) }))
    .filter((c) => c.name && (c.air || c.sea));
};

export const hasSpecialPrices = (sp?: SpecialPrices | null) => specialCategories(sp).length > 0;

// The country the special prices apply to (the owner's choice, 2026-11-19)
export const SPECIAL_COUNTRY = 'china';

/* The shipping routes with this customer's prices in place of everyone's, on the routes from China
   whose method the customer has a price for. Such a route is marked `special`, keeps everyone's
   price in `regularPrice` (to show what they save), and its kinds of goods become the customer's. */
export const withSpecialPrices = (routes: ShippingRoute[], sp?: SpecialPrices | null): ShippingRoute[] => {
  const cats = specialCategories(sp);
  if (!cats.length) return routes;
  return routes.map((r) => {
    if (r.country !== SPECIAL_COUNTRY) return r;
    const mode = r.method; // air is per KG, sea per CBM, as the routes themselves
    const priced: Category[] = cats
      .filter((c) => c[mode])
      .map((c, i) => ({ key: `special-${i}`, label: categoryLabel(c.name), price: c[mode] as number }));
    if (!priced.length) return r;
    return {
      ...r,
      special: true,
      regularPrice: r.categories?.[0]?.price || r.price,
      price: priced[0].price,
      categories: priced,
      // The office's special air prices from China have no minimum charge
      minCharge: mode === 'air' ? 0 : r.minCharge,
    };
  });
};
