// What the orders pages need to know about an order or a package, in the customer's words.
// The office records progress as a number (orderStatus) whose meaning depends on whether we also
// bought the goods (isPayment); everything here turns that into one shared list of stages.
import { Package, PackageDetails } from '../../models';

export const COUNTRY_KEYS = ['china', 'uae', 'turkey', 'usa', 'uk'];

export const isPurchaseInvoice = (o: Package) => !!o.isPayment && !o.isShipment;

// Stopped by the office (prohibited goods). Delivered orders are past it, so they never count.
export const isBlocked = (o: Package) => !!o.shippingBlocked && !o.isFinished && !o.isCanceled;

export const METHOD_LABEL: Record<string, string> = { air: 'شحن جوي', sea: 'شحن بحري', unknown: 'طريقة الشحن غير محددة' };

export const COUNTRY_LABEL: Record<string, string> = {
  china: 'الصين', uae: 'الإمارات', turkey: 'تركيا', usa: 'أمريكا', uk: 'بريطانيا',
};

// "-", "." or empty: the office left it unnamed
const named = (v?: string) => {
  const t = (v || '').trim();
  return t && t !== '-' && t !== '.' ? t : '';
};

// air / sea, or 'unknown' when the office has not set it yet (also when it is missing)
export const shipMethod = (o: Package): 'air' | 'sea' | 'unknown' => (
  o.shipment?.method === 'air' || o.shipment?.method === 'sea' ? o.shipment.method : 'unknown'
);
export const METHOD_SHORT = { air: 'جوي', sea: 'بحري', unknown: 'غير محددة' } as const;

export const goodsName = (o: Package) => {
  const name = named(o.productName);
  if (name) return name;
  if (isPurchaseInvoice(o)) return 'فاتورة شراء';
  if (o.unsureOrder) return 'أرقام تتبع قيد المتابعة';
  const m = shipMethod(o);
  return m === 'sea' ? 'شحنة بحرية' : m === 'air' ? 'شحنة جوية' : 'شحنة';
};

export const placeName = (v?: string) => {
  const t = named(v);
  return COUNTRY_LABEL[t] || t;
};

/* Shipment stages: one list for every shipment, so the progress bar looks the same everywhere. */
export const SHIPMENT_STAGES = [
  { key: 'waiting', label: 'بانتظار الوصول للمخزن', short: 'التجهيز' },
  { key: 'warehouse', label: 'في مخزننا الخارجي', short: 'المخزن' },
  { key: 'onTheWay', label: 'في الطريق إلى ليبيا', short: 'الطريق' },
  { key: 'ready', label: 'جاهزة للاستلام', short: 'جاهزة' },
  { key: 'delivered', label: 'تم التسليم', short: 'التسليم' },
] as const;

export type StageKey = typeof SHIPMENT_STAGES[number]['key'];

// Index into SHIPMENT_STAGES. Orders we also bought have one more step (purchase) at the start.
export const shipmentStage = (o: Package): number => {
  if (o.isFinished) return 4;
  const s = Number(o.orderStatus) || 0;
  const shifted = o.isPayment ? Math.max(0, s - 1) : s;
  return Math.min(4, shifted);
};

export const stageKey = (o: Package): StageKey => SHIPMENT_STAGES[shipmentStage(o)].key;

// For an order we bought and have not received at the warehouse yet, "waiting" reads better as bought
export const stageLabel = (o: Package) => {
  if (o.unsureOrder) return 'قيد المتابعة';
  if (isBlocked(o)) return 'موقوفة عن الشحن';
  const i = shipmentStage(o);
  if (i === 0 && o.isPayment) return Number(o.orderStatus) >= 1 ? 'تم الشراء، في الطريق للمخزن' : 'قيد الشراء';
  return SHIPMENT_STAGES[i].label;
};

// What happens next, in one sentence: the question customers actually come to this page with
export const nextStepText = (o: Package, officeName: string) => {
  if (o.isCanceled) return 'أُلغيت هذه الطلبية. إن كنت تظن أن هذا خطأ تواصل مع المكتب.';
  if (isBlocked(o)) return 'أوقفنا شحن هذه الطلبية ولن تُشحن إلى ليبيا حتى تتواصل مع المكتب. السبب مكتوب أدناه.';
  if (o.unsureOrder) return 'نتابع أرقام التتبع التي أرسلتها. عندما يصل الطرد لمخزننا تتحول هذه إلى شحنة نشطة.';
  switch (stageKey(o)) {
    case 'waiting':
      return o.isPayment
        ? 'اشترينا بضاعتك، وننتظر أن يرسلها البائع إلى مخزننا. نبلغك عند وصولها.'
        : 'ننتظر وصول طردك إلى مخزننا. عندما يصل نسجّله ونزنه ويظهر هنا.';
    case 'warehouse':
      return 'طردك في مخزننا الخارجي، ويُشحن إلى ليبيا مع أقرب رحلة.';
    case 'onTheWay':
      return 'شحنتك في الطريق إلى ليبيا. نبلغك عندما تصبح جاهزة للاستلام.';
    case 'ready':
      return `شحنتك وصلت وجاهزة للاستلام من ${officeName}.`;
    default:
      return 'استلمت شحنتك. شكراً لثقتك بإكسيوس.';
  }
};

/* Packages: each has its own flags, independent of the order's overall status */
export const PACKAGE_STAGES = ['بانتظار الوصول', 'في المخزن', 'في الطريق لليبيا', 'جاهز للاستلام', 'تم الاستلام'];

export const packageStage = (p: PackageDetails): number => {
  if (p.status?.received) return 4;
  if (p.status?.arrivedLibya) return 3;
  if (p.status?.arrived) return p.trip?.voyage ? 2 : 1;
  return 0;
};

export const visiblePackages = (o: Package) => (o.paymentList || []).filter((p) => p?.settings?.visableForClient !== false);

export const weightText = (p: PackageDetails) => {
  const w = p.deliveredPackages?.weight;
  if (!w?.total) return '';
  const unit = String(w.measureUnit || '').toLowerCase() === 'cbm' ? 'م³' : 'كجم';
  return `${w.total} ${unit}`;
};

export const unitText = (p: PackageDetails) =>
  String(p.deliveredPackages?.weight?.measureUnit || '').toLowerCase() === 'cbm' ? 'م³' : 'كجم';

// What a package costs to ship: the office's price per unit × its weight (kg) or volume (CBM).
// null until it has both a price and a weight.
export const packageCost = (p: PackageDetails): number | null => {
  const price = Number(p.deliveredPackages?.exiosPrice) || 0;
  const qty = Number(p.deliveredPackages?.weight?.total) || 0;
  return price > 0 && qty > 0 ? Math.round(price * qty * 100) / 100 : null;
};

// The shipping total of an order's packages, and how many of them are priced so far
export const shippingCost = (packages: PackageDetails[]) => {
  const costs = packages.map(packageCost).filter((c): c is number => c !== null);
  return {
    total: Math.round(costs.reduce((a, b) => a + b, 0) * 100) / 100,
    priced: costs.length,
    count: packages.length,
  };
};

export const packagesText = (n: number) =>
  n === 1 ? 'طرد واحد' : n === 2 ? 'طردان' : n <= 10 ? `${n} طرود` : `${n} طرداً`;

/* Dates: Latin digits, day first, as the rest of the app */
const pad = (n: number) => String(n).padStart(2, '0');

export const dateText = (d?: string | Date) => {
  if (!d) return '';
  const date = new Date(d);
  if (Number.isNaN(date.getTime())) return '';
  return `${pad(date.getDate())}/${pad(date.getMonth() + 1)}/${date.getFullYear()}`;
};

export const timeText = (d?: string | Date) => {
  if (!d) return '';
  const date = new Date(d);
  if (Number.isNaN(date.getTime())) return '';
  return `${pad(date.getHours())}:${pad(date.getMinutes())}`;
};

export const relativeDay = (d?: string | Date) => {
  if (!d) return '';
  const date = new Date(d);
  if (Number.isNaN(date.getTime())) return '';
  const start = (x: Date) => new Date(x.getFullYear(), x.getMonth(), x.getDate()).getTime();
  const days = Math.round((start(new Date()) - start(date)) / 86_400_000);
  if (days <= 0) return 'اليوم';
  if (days === 1) return 'أمس';
  if (days === 2) return 'قبل يومين';
  if (days <= 10) return `قبل ${days} أيام`;
  if (days < 30) return `قبل ${days} يوماً`;
  return dateText(date);
};

export const usd = (n?: number) => {
  const v = Number(n) || 0;
  return `$${v.toLocaleString('en-US', { maximumFractionDigits: 2 })}`;
};

/* Advanced filters for the orders list: all applied on the list already loaded */
export type Period = 'all' | '30' | '90' | '365';

export type OrderFilters = {
  method: 'all' | 'air' | 'sea' | 'unknown'
  country: string // 'all' or a COUNTRY_KEYS value
  note: string // 'all' | 'with' | 'without' | a theme id
  period: Period
  sort: 'new' | 'old'
};

export const DEFAULT_FILTERS: OrderFilters = { method: 'all', country: 'all', note: 'all', period: 'all', sort: 'new' };

export const activeFilterCount = (f: OrderFilters) =>
  (['method', 'country', 'note', 'period'] as const).filter((k) => f[k] !== 'all').length + (f.sort !== 'new' ? 1 : 0);

export const applyFilters = (list: Package[], f: OrderFilters) => {
  const since = f.period === 'all' ? 0 : Date.now() - Number(f.period) * 86_400_000;
  const out = list.filter((o) => {
    if (f.method !== 'all' && shipMethod(o) !== f.method) return false;
    if (f.country !== 'all' && o.shipment?.fromWhere !== f.country) return false;
    const note = !!o.customization?.note;
    if (f.note === 'with' && !note) return false;
    if (f.note === 'without' && note) return false;
    if (!['all', 'with', 'without'].includes(f.note) && !(note && (o.customization?.theme || 'emerald') === f.note)) return false;
    if (since && new Date(o.createdAt).getTime() < since) return false;
    return true;
  });
  return f.sort === 'old' ? out.slice().reverse() : out;
};
