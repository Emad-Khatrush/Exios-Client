// The Prices page calculators. Pure functions over what GET /pricing returns, all amounts in USD.
// The office confirms the final invoice; these give the customer an estimate.

export type Tier = { upTo: number | null, type?: 'fixed' | 'percent', value?: number, rate?: number, fee?: number };
export type ShippingRoute = {
  key: string, country: string, method: 'air' | 'sea', label: string, countryLabel: string,
  unit: 'kg' | 'cbm', price: number, duration: string, note: string, minCharge: number,
};
export type Container = { key: string, label: string, route: string, price: number, duration: string };
export type Office = { key: string, label: string, whatsapp: string, cities: string[] };
export type Pricing = {
  exchangeRate: { rate: number, updatedAt: string } | null,
  shipping: { note: string, volumetricDivisor: number, routes: ShippingRoute[] } | null,
  purchase: { note: string, minCommission: number, tiers: Tier[], sites: { key: string, label: string, feePercent: number }[] } | null,
  alipay: { note: string, tiers: Tier[] } | null,
  swift: { note: string, percent: number, fixedFee: number, minFee: number } | null,
  fcl: { note: string, containers: Container[] } | null,
  offices: Office[],
};

export type Line = { label: string, value: number, hint?: string, strong?: boolean };
export type Quote = { title: string, lines: Line[], total: number, totalLabel: string, summary: string[] };

const cents = (n: number) => Math.round(n * 100) / 100;
const up = (n: number) => Math.ceil(n * 100 - 1e-9) / 100;
export const toNumber = (value: string | number) => {
  // Accept Arabic-Indic digits and a comma as the decimal sign
  const text = String(value ?? '')
    .replace(/[٠-٩]/g, (d) => String(d.charCodeAt(0) - 1632))
    .replace(/[۰-۹]/g, (d) => String(d.charCodeAt(0) - 1776))
    .replace(/[٫,]/g, '.')
    .replace(/[^\d.]/g, '');
  const n = parseFloat(text);
  return Number.isFinite(n) && n > 0 ? n : 0;
};

export const money = (n: number) => `$${n.toLocaleString('en-US', { minimumFractionDigits: n % 1 ? 2 : 0, maximumFractionDigits: 2 })}`;
export const plain = (n: number, digits = 2) => n.toLocaleString('en-US', { maximumFractionDigits: digits });

// The bracket an amount falls in: the first whose upper bound it does not pass
export const tierFor = (tiers: Tier[], amount: number) => tiers.find((t) => t.upTo === null || amount <= t.upTo) || tiers[tiers.length - 1];

// ---- Shipping: air by the greater of actual and volumetric weight, sea by CBM
export const shippingQuote = (
  route: ShippingRoute,
  input: { amount: number, length?: number, width?: number, height?: number, boxes?: number },
  divisor: number,
): Quote | null => {
  const boxes = Math.max(1, Math.floor(input.boxes || 1));
  const dims = (input.length || 0) * (input.width || 0) * (input.height || 0) * boxes;
  const lines: Line[] = [];
  let charged: number;
  if (route.unit === 'kg') {
    const volumetric = dims ? dims / (divisor || 6000) : 0;
    charged = Math.max(input.amount, volumetric);
    if (!charged) return null;
    if (input.amount) lines.push({ label: 'الوزن الفعلي', value: input.amount, hint: 'كجم' });
    if (volumetric) lines.push({ label: 'الوزن الحجمي', value: cents(volumetric), hint: 'كجم' });
    lines.push({ label: 'الوزن المحسوب', value: cents(charged), hint: 'كجم', strong: true });
  } else {
    const cbmFromDims = dims ? dims / 1_000_000 : 0;
    charged = input.amount || cbmFromDims;
    if (!charged) return null;
    lines.push({ label: 'الحجم', value: cents(charged), hint: 'CBM', strong: true });
  }
  const freight = up(charged * route.price);
  const total = Math.max(freight, route.minCharge || 0);
  lines.push({ label: `السعر لكل ${route.unit === 'kg' ? 'كجم' : 'متر مكعب'}`, value: route.price, hint: 'USD' });
  if (total > freight) lines.push({ label: 'الحد الأدنى للشحنة', value: route.minCharge, hint: 'USD' });
  return {
    title: route.label,
    lines,
    total,
    totalLabel: 'تكلفة الشحن التقريبية',
    summary: [
      `${route.label}`,
      route.unit === 'kg' ? `الوزن المحسوب: ${plain(charged)} كجم` : `الحجم: ${plain(charged)} CBM`,
      `السعر: ${money(route.price)} لكل ${route.unit === 'kg' ? 'كجم' : 'CBM'}`,
      `التكلفة التقريبية: ${money(total)}`,
    ],
  };
};

// ---- Purchasing: the site's own fee, then our commission by bracket, with a minimum
export const purchaseQuote = (cfg: NonNullable<Pricing['purchase']>, amount: number, siteKey: string): Quote | null => {
  if (!amount) return null;
  const site = cfg.sites.find((s) => s.key === siteKey) || cfg.sites[0];
  const siteFee = site?.feePercent ? Math.ceil(amount * site.feePercent / 100) : 0;
  const tier = tierFor(cfg.tiers, amount);
  const raw = tier?.type === 'fixed' ? (tier.value || 0) : amount * (tier?.value || 0) / 100;
  const commission = Math.ceil(Math.max(raw, cfg.minCommission || 0));
  const total = cents(amount + siteFee + commission);
  const lines: Line[] = [{ label: 'قيمة المشتريات', value: amount, hint: 'USD' }];
  if (siteFee) lines.push({ label: `رسوم ${site.label} ${plain(site.feePercent)}%`, value: siteFee, hint: 'USD' });
  lines.push({ label: tier?.type === 'percent' ? `عمولة الشراء ${plain(tier.value || 0)}%` : 'عمولة الشراء', value: commission, hint: 'USD' });
  return {
    title: `شراء من ${site?.label || 'المواقع'}`,
    lines,
    total,
    totalLabel: 'إجمالي الفاتورة التقريبي',
    summary: [`طلب شراء من ${site?.label || 'موقع'}`, `قيمة المشتريات: ${money(amount)}`, `العمولة: ${money(commission)}`, siteFee ? `رسوم الموقع: ${money(siteFee)}` : '', `الإجمالي التقريبي: ${money(total)}`].filter(Boolean),
  };
};

// ---- Alipay: yuan the supplier must receive, at the rate of its bracket, plus the bracket's fee
export const alipayQuote = (cfg: NonNullable<Pricing['alipay']>, yuan: number): Quote | null => {
  if (!yuan) return null;
  const tier = tierFor(cfg.tiers, yuan);
  if (!tier?.rate) return null;
  const usd = up(yuan / tier.rate);
  const fee = tier.fee || 0;
  const total = cents(usd + fee);
  const lines: Line[] = [
    { label: 'المبلغ باليوان', value: yuan, hint: 'CNY' },
    { label: 'سعر اليوان لكل دولار', value: tier.rate, hint: 'CNY' },
    { label: 'قيمة الحوالة بالدولار', value: usd, hint: 'USD' },
  ];
  if (fee) lines.push({ label: 'رسوم الحوالة', value: fee, hint: 'USD' });
  return {
    title: 'حوالة علي باي',
    lines,
    total,
    totalLabel: 'تدفع بالدولار',
    summary: ['حوالة علي باي', `المبلغ: ${plain(yuan)} يوان`, `السعر: ${plain(tier.rate, 4)} يوان لكل دولار`, fee ? `الرسوم: ${money(fee)}` : '', `المطلوب: ${money(total)}`].filter(Boolean),
  };
};

// ---- SWIFT: a percentage with a minimum, plus a fixed bank fee
export const swiftQuote = (cfg: NonNullable<Pricing['swift']>, amount: number): Quote | null => {
  if (!amount) return null;
  const percentFee = up(amount * (cfg.percent || 0) / 100);
  const commission = Math.max(percentFee, cfg.minFee || 0);
  const total = cents(amount + commission + (cfg.fixedFee || 0));
  const lines: Line[] = [
    { label: 'مبلغ الحوالة', value: amount, hint: 'USD' },
    { label: commission > percentFee ? 'العمولة (الحد الأدنى)' : `العمولة ${plain(cfg.percent)}%`, value: commission, hint: 'USD' },
  ];
  if (cfg.fixedFee) lines.push({ label: 'رسوم بنكية ثابتة', value: cfg.fixedFee, hint: 'USD' });
  return {
    title: 'حوالة سويفت',
    lines,
    total,
    totalLabel: 'تدفع بالدولار',
    summary: ['حوالة سويفت', `المبلغ: ${money(amount)}`, `العمولة والرسوم: ${money(cents(commission + (cfg.fixedFee || 0)))}`, `المطلوب: ${money(total)}`],
  };
};

// ---- Full containers
export const fclQuote = (container: Container, count: number): Quote | null => {
  const n = Math.max(0, Math.floor(count));
  if (!n) return null;
  const total = cents(container.price * n);
  return {
    title: container.label,
    lines: [
      { label: 'سعر الحاوية', value: container.price, hint: 'USD' },
      { label: 'عدد الحاويات', value: n },
    ],
    total,
    totalLabel: 'تكلفة الشحن التقريبية',
    summary: [`شحن ${container.label}${container.route ? ` (${container.route})` : ''}`, `العدد: ${n}`, `التكلفة التقريبية: ${money(total)}`],
  };
};

// The office for a customer's city, else the first one
export const officeFor = (offices: Office[], city?: string) =>
  offices.find((o) => city && (o.cities || []).includes(city)) || offices[0];

export const whatsappLink = (office: Office, quote: Quote, customer?: { name?: string, customerId?: string }) => {
  const head = ['السلام عليكم، أريد إتمام هذا الطلب:'];
  const who = customer?.name ? [`الاسم: ${customer.name}${customer.customerId ? ` (كود ${customer.customerId})` : ''}`] : [];
  const text = [...head, '', ...quote.summary, '', ...who, 'تم الحساب من صفحة الأسعار في تطبيق إكسيوس'].join('\n');
  return `https://wa.me/${office.whatsapp}?text=${encodeURIComponent(text)}`;
};
