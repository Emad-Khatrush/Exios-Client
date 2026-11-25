// The Prices page calculators. Pure functions over what GET /pricing returns, all amounts in USD.
// The office confirms the final invoice; these give the customer an estimate.

export type Tier = { upTo: number | null, type?: 'fixed' | 'percent', value?: number, rate?: number, fee?: number };
export type ShippingRoute = {
  key: string, country: string, method: 'air' | 'sea', label: string, countryLabel: string,
  unit: 'kg' | 'cbm', price: number, duration: string, note: string, minCharge: number,
  // The least weight (kg) or volume (CBM) billed for a shipment; 0 or absent = none
  minWeight?: number,
  // Price by kind of goods; the first is the base price
  categories: Category[],
  // When a price of this route last changed
  updatedAt?: string | null,
  // The shipping line (sea) or airline (air) of this shared shipping
  carrier?: string,
  // This customer's own prices (utils/specialPrices.ts), and everyone's base price beside them
  special?: boolean,
  regularPrice?: number,
};

// Carriers the office types in English, as customers read them. Anything else is shown as typed.
const CARRIER_NAMES: Record<string, string> = {
  cosco: 'كوسكو', msc: 'إم إس سي', maersk: 'ميرسك', 'cma cgm': 'سي إم إيه سي جي إم', 'hapag-lloyd': 'هاباغ لويد', 'hapag lloyd': 'هاباغ لويد',
  one: 'أوشن نتورك (ONE)', evergreen: 'إيفرغرين', 'yang ming': 'يانغ مينغ', zim: 'زيم', arkas: 'أركاس',
  'turkish airlines': 'الخطوط الجوية التركية', emirates: 'طيران الإمارات', 'qatar airways': 'الخطوط الجوية القطرية', etihad: 'الاتحاد للطيران',
  egyptair: 'مصر للطيران', 'libyan airlines': 'الخطوط الجوية الليبية', 'china southern': 'طيران الصين الجنوبية', 'china eastern': 'طيران الصين الشرقية',
};
// { ar: the Arabic name, latin: the typed name when it was translated }
export const carrierName = (name?: string) => {
  const typed = (name || '').trim();
  const ar = CARRIER_NAMES[typed.toLowerCase()];
  return ar ? { ar, latin: typed } : { ar: typed, latin: '' };
};
export type Category = { key: string, label: string, price: number };
// A full-container offer: a container type (label) on a shipping line between two ports
export type Container = {
  key: string, label: string, carrier?: string, fromPort?: string, toPort?: string,
  route: string, price: number, duration: string, updatedAt?: string | null,
};
// A shopping site: its own fee, and its own commission in place of the brackets when the office set
// one ('none' = no commission). freeShipping is shown beside it.
export type Site = {
  key: string, label: string, feePercent: number,
  commission?: 'default' | 'none' | 'percent' | 'fixed', commissionValue?: number, freeShipping?: boolean,
};
export type Office = { key: string, label: string, whatsapp: string, cities: string[] };
// What is paid on top, in qirsh (1/100 dinar) for each dollar of the total, by where the customer pays
export type Delivery = { libya: number, turkey: number };
type Dated = { updatedAt?: string | null, delivery?: Delivery };
export type Pricing = {
  exchangeRate: { rate: number, updatedAt: string } | null,
  shipping: Dated & { note: string, volumetricDivisor: number, routes: ShippingRoute[] } | null,
  purchase: Dated & { note: string, minCommission: number, tiers: Tier[], sites: Site[] } | null,
  alipay: Dated & { note: string, tiers: Tier[] } | null,
  swift: Dated & { note: string, tiers: Tier[], fixedFee: number, minFee: number } | null,
  fcl: Dated & { note: string, containers: Container[] } | null,
  offices: Office[],
};

export type Line = { label: string, value: number, hint?: string, strong?: boolean, text?: string };
// payAt: what the customer pays by where they pay, the total in dollars plus dinars (0 = nothing added)
export type PayAt = { key: 'libya' | 'turkey', label: string, lyd: number };
export type Quote = { title: string, lines: Line[], total: number, totalLabel: string, summary: string[], payAt?: PayAt[] };

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
// Numbers inside Arabic text: isolated left-to-right, so "$200 - $1,000" and "3%" are not flipped
export const ltr = (text: string) => `⁦${text}⁩`;

// The bracket an amount falls in: the first whose upper bound it does not pass
export const tierFor = (tiers: Tier[], amount: number) => tiers.find((t) => t.upTo === null || amount <= t.upTo) || tiers[tiers.length - 1];

// ---- Shipping: air by the greater of actual and volumetric weight, sea by CBM
export const shippingQuote = (
  route: ShippingRoute,
  input: { amount: number, length?: number, width?: number, height?: number, boxes?: number, categoryKey?: string },
  divisor: number,
): Quote | null => {
  const category = route.categories?.find((c) => c.key === input.categoryKey) || route.categories?.[0];
  const unitPrice = category?.price || route.price;
  const kind = route.categories?.length > 1 && category ? category.label : '';
  const boxes = Math.max(1, Math.floor(input.boxes || 1));
  const dims = (input.length || 0) * (input.width || 0) * (input.height || 0) * boxes;
  const lines: Line[] = [];
  const minWeight = route.minWeight || 0;
  let charged: number;
  if (route.unit === 'kg') {
    const volumetric = dims ? dims / (divisor || 6000) : 0;
    const weighed = Math.max(input.amount, volumetric);
    if (!weighed) return null;
    charged = Math.max(weighed, minWeight);
    if (input.amount) lines.push({ label: 'الوزن الفعلي', value: input.amount, hint: 'كجم' });
    if (volumetric) lines.push({ label: 'الوزن الحجمي', value: cents(volumetric), hint: 'كجم' });
    if (charged > weighed) lines.push({ label: 'أقل وزن للشحن', value: minWeight, hint: 'كجم' });
    lines.push({ label: 'الوزن المحسوب', value: cents(charged), hint: 'كجم', strong: true });
  } else {
    const cbmFromDims = dims ? dims / 1_000_000 : 0;
    const measured = input.amount || cbmFromDims;
    if (!measured) return null;
    charged = Math.max(measured, minWeight);
    if (charged > measured) {
      lines.push({ label: 'الحجم', value: cents(measured), hint: 'CBM' }, { label: 'أقل حجم للشحن', value: minWeight, hint: 'CBM' });
      lines.push({ label: 'الحجم المحسوب', value: cents(charged), hint: 'CBM', strong: true });
    } else lines.push({ label: 'الحجم', value: cents(charged), hint: 'CBM', strong: true });
  }
  const freight = up(charged * unitPrice);
  const total = Math.max(freight, route.minCharge || 0);
  if (kind) lines.unshift({ label: 'نوع البضاعة', value: 0, text: kind });
  if (route.special) lines.unshift({ label: 'التسعير', value: 0, text: 'سعرك الخاص' });
  const carrier = carrierName(route.carrier).ar;
  const carrierLabel = route.method === 'sea' ? 'الخط الملاحي' : 'شركة الطيران';
  if (carrier) lines.unshift({ label: carrierLabel, value: 0, text: carrier });
  lines.push({ label: `السعر لكل ${route.unit === 'kg' ? 'كجم' : 'متر مكعب'}`, value: unitPrice, hint: 'USD' });
  if (total > freight) lines.push({ label: 'الحد الأدنى للشحنة', value: route.minCharge, hint: 'USD' });
  return {
    title: kind ? `${route.label} (${kind})` : route.label,
    lines,
    total,
    totalLabel: 'تكلفة الشحن التقريبية',
    summary: [
      kind ? `${route.label} - ${kind}` : route.label,
      carrier ? `${carrierLabel}: ${carrier}` : '',
      route.unit === 'kg' ? `الوزن المحسوب: ${plain(charged)} كجم` : `الحجم: ${plain(charged)} CBM`,
      `السعر: ${money(unitPrice)} لكل ${route.unit === 'kg' ? 'كجم' : 'CBM'}${route.special ? ' (سعري الخاص)' : ''}`,
      `التكلفة التقريبية: ${money(total)}`,
    ].filter(Boolean),
  };
};

// The commission of a site, as the customer reads it: "بدون عمولة", "عمولة 2%", "عمولة $5"; '' = the brackets
export const siteCommissionText = (site?: Site) => {
  if (!site || !site.commission || site.commission === 'default') return '';
  if (site.commission === 'none') return 'بدون عمولة';
  return site.commission === 'fixed' ? `عمولة ${ltr(money(site.commissionValue || 0))}` : `عمولة ${ltr(`${plain(site.commissionValue || 0)}%`)}`;
};

// ---- Purchasing: the site's own fee, then our commission (the site's own, or by bracket) with a minimum
export const purchaseQuote = (cfg: NonNullable<Pricing['purchase']>, amount: number, siteKey: string): Quote | null => {
  if (!amount) return null;
  const site = cfg.sites.find((s) => s.key === siteKey) || cfg.sites[0];
  const siteFee = site?.feePercent ? Math.ceil(amount * site.feePercent / 100) : 0;
  const own = site?.commission && site.commission !== 'default' ? site.commission : null;
  const tier = own ? null : tierFor(cfg.tiers, amount);
  const type = own || tier?.type || 'percent';
  const rate = own ? (site.commissionValue || 0) : (tier?.value || 0);
  const raw = type === 'none' ? 0 : type === 'fixed' ? rate : amount * rate / 100;
  // No commission is none at all; any other commission has the minimum
  const commission = type === 'none' ? 0 : Math.ceil(Math.max(raw, cfg.minCommission || 0));
  const total = cents(amount + siteFee + commission);
  const lines: Line[] = [{ label: 'قيمة المشتريات', value: amount, hint: 'USD' }];
  if (siteFee) lines.push({ label: `رسوم ${site.label} ${ltr(`${plain(site.feePercent)}%`)}`, value: siteFee, hint: 'USD' });
  lines.push(type === 'none'
    ? { label: 'عمولة الشراء', value: 0, text: 'بدون عمولة' }
    : { label: type === 'percent' ? `عمولة الشراء ${ltr(`${plain(rate)}%`)}` : 'عمولة الشراء', value: commission, hint: 'USD' });
  if (site?.freeShipping) lines.push({ label: 'الشحن', value: 0, text: 'شحن مجاني' });
  return {
    title: `شراء من ${site?.label || 'المواقع'}`,
    lines,
    total,
    totalLabel: 'إجمالي الفاتورة التقريبي',
    summary: [
      `طلب شراء من ${site?.label || 'موقع'}`, `قيمة المشتريات: ${money(amount)}`,
      `العمولة: ${commission ? money(commission) : 'بدون عمولة'}`, siteFee ? `رسوم الموقع: ${money(siteFee)}` : '',
      site?.freeShipping ? 'الشحن: مجاني' : '', `الإجمالي التقريبي: ${money(total)}`,
    ].filter(Boolean),
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
    { label: 'سعر الصرف (يوان لكل 1 دولار)', value: tier.rate, hint: 'CNY' },
    { label: 'قيمة الحوالة بالدولار', value: usd, hint: 'USD' },
  ];
  lines.push(fee ? { label: 'العمولة', value: fee, hint: 'USD' } : { label: 'العمولة', value: 0, text: 'بدون عمولة' });
  return {
    title: 'حوالة علي باي',
    lines,
    total,
    totalLabel: 'تدفع بالدولار',
    summary: ['حوالة علي باي', `المبلغ: ${plain(yuan)} يوان`, `سعر الصرف: ${plain(tier.rate, 4)} يوان لكل 1 دولار`, `العمولة: ${fee ? money(fee) : 'بدون عمولة'}`, `المطلوب: ${money(total)}`].filter(Boolean),
  };
};

// ---- SWIFT: the bracket's commission (a percentage or a fixed amount) with a minimum, plus a fixed bank fee
export const swiftQuote = (cfg: NonNullable<Pricing['swift']>, amount: number): Quote | null => {
  if (!amount) return null;
  const tier = tierFor(cfg.tiers, amount);
  const percentFee = tier?.type === 'fixed' ? (tier.value || 0) : up(amount * (tier?.value || 0) / 100);
  const commission = Math.max(percentFee, cfg.minFee || 0);
  const total = cents(amount + commission + (cfg.fixedFee || 0));
  const lines: Line[] = [
    { label: 'مبلغ الحوالة', value: amount, hint: 'USD' },
    { label: commission > percentFee ? 'العمولة (الحد الأدنى)' : tier?.type === 'fixed' ? 'العمولة' : `العمولة ${ltr(`${plain(tier?.value || 0)}%`)}`, value: commission, hint: 'USD' },
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

// ---- Where the customer pays: the section's qirsh for each dollar of the total, in dinars.
// $100 at 10 qirsh = $100 + 10 LYD. Nothing changes when neither place adds anything.
export const lydText = (n: number) => `${n.toLocaleString('en-US', { maximumFractionDigits: 2 })} د.ل`;
export const payAtText = (total: number, p: PayAt) => (p.lyd ? `${money(total)} + ${lydText(p.lyd)}` : money(total));
export const withDelivery = (quote: Quote | null, delivery?: Delivery | null): Quote | null => {
  if (!quote || !delivery || !(delivery.libya > 0 || delivery.turkey > 0)) return quote;
  const payAt: PayAt[] = [
    { key: 'libya', label: 'الدفع في ليبيا', lyd: up(quote.total * (delivery.libya || 0) / 100) },
    { key: 'turkey', label: 'الدفع في تركيا', lyd: up(quote.total * (delivery.turkey || 0) / 100) },
  ];
  return { ...quote, payAt, summary: [...quote.summary, ...payAt.map((p) => `${p.label}: ${payAtText(quote.total, p)}`)] };
};

// ---- Full containers
// "from Shanghai to Tripoli", or the older free-text route
export const portsText = (c: Container) => (c.fromPort && c.toPort ? `من ${c.fromPort} إلى ${c.toPort}` : c.fromPort ? `من ${c.fromPort}` : c.toPort ? `إلى ${c.toPort}` : c.route || '');

export const fclQuote = (container: Container, count: number): Quote | null => {
  const n = Math.max(0, Math.floor(count));
  if (!n) return null;
  const total = cents(container.price * n);
  const ports = portsText(container);
  const lines: Line[] = [];
  const carrier = carrierName(container.carrier).ar;
  if (carrier) lines.push({ label: 'الخط الملاحي', value: 0, text: carrier });
  if (ports) lines.push({ label: 'المسار', value: 0, text: ports });
  lines.push({ label: 'سعر الحاوية', value: container.price, hint: 'USD' }, { label: 'عدد الحاويات', value: n });
  return {
    title: carrier ? `${container.label} - ${carrier}` : container.label,
    lines,
    total,
    totalLabel: 'تكلفة الشحن التقريبية',
    summary: [
      `شحن ${container.label}`,
      carrier ? `الخط الملاحي: ${carrier}` : '',
      ports ? `المسار: ${ports}` : '',
      `العدد: ${n}`,
      `التكلفة التقريبية: ${money(total)} (FOB، غير شاملة الجمارك في ليبيا)`,
    ].filter(Boolean),
  };
};

// ---- "Updated" labels: today, yesterday, N days ago, then the date
const DAY = 24 * 60 * 60 * 1000;
const fullDate = new Intl.DateTimeFormat('ar-LY-u-nu-latn', { day: 'numeric', month: 'long', year: 'numeric' });
const daysAgo = (n: number) => (n === 2 ? 'منذ يومين' : n <= 10 ? `منذ ${n} أيام` : `منذ ${n} يوماً`);
export const updatedLabel = (value?: string | null, now = new Date()) => {
  if (!value) return null;
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return null;
  const startOf = (d: Date) => new Date(d.getFullYear(), d.getMonth(), d.getDate()).getTime();
  const days = Math.round((startOf(now) - startOf(date)) / DAY);
  const full = fullDate.format(date);
  const short = days <= 0 ? 'اليوم' : days === 1 ? 'أمس' : days < 14 ? daysAgo(days) : full;
  return { short, full, iso: date.toISOString(), fresh: days <= 7 };
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
