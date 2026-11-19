import { useCallback, useEffect, useRef, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { ChevronDown, CircleMinus, Clock, Coins, Gift, LucideIcon, Plus, Rocket, ShoppingBag, TriangleAlert, Undo2 } from 'lucide-react';
import api from '../../api';
import { dateText, relativeDay, timeText } from '../ClientOrders/orderUtils';
import { LoyaltyHistory, LoyaltyHistoryRow, LoyaltyHistoryType, LoyaltyKind, LoyaltyMonth, LoyaltyPending, LoyaltyResponse, LoyaltyTier } from './loyaltyTypes';
import { LevelCard, LevelCelebration, LevelRoute } from './LevelSection';
import { pointsTerms } from './pointsTerms';
import { pointsText, usdText } from './pointsFormat';
import PromotionBanner, { usePromotions } from './PromotionBanner';
import { timesText } from './promotions';
import './points.css';

// Each movement in the history: its icon, its tone and its title (with the order number when it has one)
const KIND: Record<LoyaltyKind, { icon: LucideIcon, tone: 'gain' | 'spend' | 'loss', title: string }> = {
  earn: { icon: Plus, tone: 'gain', title: 'كسب من طلبية' },
  add: { icon: Gift, tone: 'gain', title: 'إضافة من المكتب' },
  restore: { icon: Undo2, tone: 'gain', title: 'إرجاع نقاط طلبية ملغاة' },
  redeem: { icon: ShoppingBag, tone: 'spend', title: 'استعمال على طلبية' },
  deduct: { icon: CircleMinus, tone: 'spend', title: 'خصم من المكتب' },
  expire: { icon: Clock, tone: 'loss', title: 'انتهت صلاحية النقاط' },
  revoke: { icon: CircleMinus, tone: 'loss', title: 'سحب نقاط طلبية ملغاة' },
};

// When a movement happened, short: "اليوم", "أمس", else "dd/mm", and the time
const whenText = (d: string) => {
  const rel = relativeDay(d);
  return { day: rel === 'اليوم' || rel === 'أمس' ? rel : dateText(d).slice(0, 5), time: timeText(d) };
};

const MONTHS = ['يناير', 'فبراير', 'مارس', 'أبريل', 'مايو', 'يونيو', 'يوليو', 'أغسطس', 'سبتمبر', 'أكتوبر', 'نوفمبر', 'ديسمبر'];
const pad2 = (n: number) => String(n).padStart(2, '0');
// The month of a row: the server's (Libya time, the same as its totals), else the device's
const monthOf = (r: LoyaltyHistoryRow) => {
  if (r.month) return r.month;
  const d = new Date(r.createdAt);
  return `${d.getFullYear()}-${pad2(d.getMonth() + 1)}`;
};
const monthTitle = (key: string) => {
  const [y, m] = key.split('-').map(Number);
  return { name: MONTHS[(m || 1) - 1] || key, year: y };
};

// The history in months, newest first. Rows come newest first, so a month that goes on over the
// next page stays one group.
const byMonth = (rows: LoyaltyHistoryRow[]) => {
  const months: { key: string, rows: { row: LoyaltyHistoryRow, index: number }[] }[] = [];
  rows.forEach((row, index) => {
    const key = monthOf(row);
    const last = months[months.length - 1];
    if (last && last.key === key) last.rows.push({ row, index });
    else months.push({ key, rows: [{ row, index }] });
  });
  return months;
};

const monthsMap = (list?: LoyaltyMonth[]) => {
  const map: Record<string, LoyaltyMonth> = {};
  (list || []).forEach((m) => { if (m?.month) map[m.month] = m; });
  return map;
};

// Add a page, never showing a movement twice (rows that slid down when new ones arrived)
const appendRows = (cur: LoyaltyHistoryRow[], next: LoyaltyHistoryRow[]) => {
  const seen = new Set(cur.map((r) => r.id).filter(Boolean));
  return [...cur, ...next.filter((r) => !r.id || !seen.has(r.id))];
};

const HISTORY_TYPES: { type: LoyaltyHistoryType, label: string }[] = [
  { type: 'all', label: 'الكل' },
  { type: 'earn', label: 'كسب' },
  { type: 'spend', label: 'استعمال' },
  { type: 'expire', label: 'انتهاء' },
  { type: 'staff', label: 'تعديلات الموظف' },
  { type: 'returned', label: 'إرجاع' },
];

const GAINS: LoyaltyKind[] = ['earn', 'add', 'restore'];

const RATES = [
  { what: 'الشحن', rate: '10 نقاط لكل 20$', example: 'شحن بـ 30$ = 15 نقطة' },
  { what: 'فواتير الشراء وسويفت', rate: '10 نقاط لكل 20$', example: 'فاتورة بـ 30$ = 15 نقطة' },
  { what: 'علي باي', rate: '5 نقاط لكل 20$', example: 'حوالة بـ 30$ = 7 نقاط' },
];

const WAITING = { payment: 'بانتظار الدفع', delivery: 'بانتظار التسليم', processing: 'تُضاف خلال ساعة' };
type PendingFilter = 'all' | LoyaltyPending['waitingFor'];
const PENDING_FILTERS: PendingFilter[] = ['all', 'payment', 'delivery', 'processing'];
const PENDING_FIRST = 5;

// "طلبية"، "طلبيتان"، "3 طلبيات"، "11 طلبية"
const ordersWord = (n: number) => (n === 2 ? 'طلبيتان' : n >= 3 && n <= 10 ? 'طلبيات' : 'طلبية');

// Points on the way: one summary line, filters by what each claim waits for, the first rows and the rest on demand
const PendingSection = ({ pending }: { pending: LoyaltyPending[] }) => {
  const [filter, setFilter] = useState<PendingFilter>('all');
  const [expanded, setExpanded] = useState(false);
  const orders = new Set(pending.map((p) => String(p.orderId))).size;
  const points = pending.reduce((sum, p) => sum + (p.points || 0), 0);
  const chips = PENDING_FILTERS
    .map((f) => ({ f, n: f === 'all' ? pending.length : pending.filter((p) => p.waitingFor === f).length, label: f === 'all' ? 'الكل' : WAITING[f] }))
    .filter((c) => c.f === 'all' || c.n > 0);
  const active = chips.some((c) => c.f === filter) ? filter : 'all';
  const rows = active === 'all' ? pending : pending.filter((p) => p.waitingFor === active);
  const shown = expanded ? rows : rows.slice(0, PENDING_FIRST);
  return (
    <section className="pt-card" aria-labelledby="pt-pending">
      <h2 id="pt-pending">نقاط في الطريق</h2>
      <p className="pt-summary">
        <bdi dir="ltr" className="pt-num">{pointsText(orders)}</bdi> {ordersWord(orders)}
        <span aria-hidden> · </span>
        <bdi dir="ltr" className="pt-num">{pointsText(points)}</bdi> نقطة في الطريق
      </p>
      <div className="pt-chips" role="group" aria-label="تصفية النقاط في الطريق">
        {chips.map((c) => (
          <button key={c.f} type="button" className="pt-chip" aria-pressed={active === c.f} onClick={() => setFilter(c.f)}>
            {c.label} <bdi dir="ltr" className="pt-num">{pointsText(c.n)}</bdi>
          </button>
        ))}
      </div>
      <ul className="pt-pending">
        {shown.map((p) => (
          <li key={`${p.orderId}-${p.arKey}`} className="pt-pending__row">
            <Link to={`/order/${p.orderId}`} className="pt-link pt-pending__order">طلبية <bdi dir="ltr">{p.orderNumber}</bdi></Link>
            <bdi dir="ltr" className="pt-pts pt-num is-gain">+{pointsText(p.points)}</bdi>
            {p.promotion && <span className="pr-tag" title={p.promotion.name}>🔥 <bdi dir="ltr">{timesText(p.promotion.multiplierPct)}</bdi></span>}
            <span className={`pt-state is-${p.waitingFor}`}>{WAITING[p.waitingFor] || ''}</span>
          </li>
        ))}
      </ul>
      {rows.length > PENDING_FIRST && (
        <div className="pt-more">
          <button type="button" className="pt-btn pt-btn--outline pt-btn--sm" aria-expanded={expanded} onClick={() => setExpanded((v) => !v)}>
            {expanded ? 'عرض أقل' : <>عرض الكل (<bdi dir="ltr" className="pt-num">{pointsText(rows.length)}</bdi>)</>}
          </button>
        </div>
      )}
    </section>
  );
};

type Busy = '' | 'filter' | 'more';

// The history: filters by kind, months with their totals, and "عرض المزيد" for the next page of the same filter
const HistorySection = ({ initial }: { initial: LoyaltyHistory }) => {
  const [type, setType] = useState<LoyaltyHistoryType>('all');
  const [rows, setRows] = useState<LoyaltyHistoryRow[]>(() => (Array.isArray(initial?.rows) ? initial.rows : []));
  const [months, setMonths] = useState<Record<string, LoyaltyMonth>>(() => monthsMap(initial?.months));
  const [total, setTotal] = useState(initial?.total || 0);
  const [page, setPage] = useState(1);
  const [busy, setBusy] = useState<Busy>('');
  const [failed, setFailed] = useState<Busy>('');
  // Rows from this index on came with the last page added: only they fade in
  const [freshFrom, setFreshFrom] = useState(Infinity);
  // Every request takes a number; any answer but the latest one is ignored
  const ticket = useRef(0);

  const fetchPage = (nextType: LoyaltyHistoryType, nextPage: number) => {
    const mine = ++ticket.current;
    const kind: Busy = nextPage > 1 ? 'more' : 'filter';
    setBusy(kind);
    setFailed('');
    api.getLoyaltyHistory(nextPage, nextType)
      .then((res: any) => {
        if (mine !== ticket.current) return;
        const body = res?.data;
        if (!Array.isArray(body?.rows)) { setFailed(kind); return; }
        if (kind === 'more') {
          setFreshFrom(rows.length);
          setRows((cur) => appendRows(cur, body.rows));
          setMonths((cur) => ({ ...cur, ...monthsMap(body.months) }));
        } else {
          setFreshFrom(Infinity);
          setRows(body.rows);
          setMonths(monthsMap(body.months));
        }
        setTotal(body.total || 0);
        setPage(nextPage);
      })
      .catch(() => { if (mine === ticket.current) setFailed(kind); })
      .finally(() => { if (mine === ticket.current) setBusy(''); });
  };

  const choose = (next: LoyaltyHistoryType) => {
    if (next === type) return;
    setType(next);
    setRows([]);
    setMonths({});
    setTotal(0);
    setPage(1);
    setFreshFrom(Infinity);
    fetchPage(next, 1);
  };

  return (
    <section className="pt-card" aria-labelledby="pt-history">
      <h2 id="pt-history">السجل</h2>
      <div className="pt-chips" role="group" aria-label="تصفية السجل">
        {HISTORY_TYPES.map((t) => (
          <button key={t.type} type="button" className="pt-chip" aria-pressed={type === t.type} onClick={() => choose(t.type)}>{t.label}</button>
        ))}
      </div>
      <div aria-live="polite" aria-busy={busy === 'filter'}>
        {busy === 'filter' && <p className="pt-muted">جاري التحميل...</p>}
        {failed === 'filter' && (
          <div className="pt-more">
            <p className="pt-muted" role="alert">تعذّر تحميل السجل</p>
            <button type="button" className="pt-btn pt-btn--outline pt-btn--sm" onClick={() => fetchPage(type, 1)}>إعادة المحاولة</button>
          </div>
        )}
        {!busy && failed !== 'filter' && !rows.length && (
          <p className="pt-muted">{type === 'all' ? 'لا توجد حركات بعد.' : 'لا توجد حركات من هذا النوع.'}</p>
        )}
      </div>
      {rows.length > 0 && (
        <div className="pt-months">
          {byMonth(rows).map((month) => {
            const title = monthTitle(month.key);
            const sums = months[month.key];
            return (
              <section key={month.key} className="pt-month" aria-label={`${title.name} ${title.year}`}>
                <h3 className="pt-month__head">
                  <span>{title.name} <bdi dir="ltr" className="pt-num">{title.year}</bdi></span>
                  {sums && (sums.gained > 0 || sums.spent > 0) && (
                    <span className="pt-month__sums">
                      {sums.gained > 0 && <bdi dir="ltr" className="pt-num is-gain">+{pointsText(sums.gained)}</bdi>}
                      {sums.spent > 0 && <bdi dir="ltr" className="pt-num is-muted">−{pointsText(sums.spent)}</bdi>}
                    </span>
                  )}
                </h3>
                <ul className="pt-moves">
                  {month.rows.map(({ row: r, index }) => {
                    const kind = KIND[r.kind] || { icon: Plus, tone: 'gain', title: r.kind };
                    const Icon = kind.icon;
                    const gain = GAINS.includes(r.kind);
                    const when = whenText(r.createdAt);
                    const details = [r.reason, r.expiresAt && gain ? `تنتهي ${dateText(r.expiresAt)}` : ''].filter(Boolean).join(' · ');
                    return (
                      <li key={r.id || `${r.createdAt}-${index}`} className={`pt-move${index >= freshFrom ? ' is-fresh' : ''}`}>
                        <span className={`pt-move__icon is-${kind.tone}`} aria-hidden><Icon size={15} strokeWidth={2.4} /></span>
                        <span className="pt-move__main">
                          <b className="pt-move__title">
                            {kind.title}
                            {r.orderId && r.orderNumber && <> <Link to={`/order/${r.orderId}`} className="pt-link"><bdi dir="ltr">{r.orderNumber}</bdi></Link></>}
                            {r.promotion && <span className="pr-tag">🔥 {r.promotion.name} <bdi dir="ltr">{timesText(r.promotion.multiplierPct)}</bdi></span>}
                          </b>
                          <small className="pt-move__meta">
                            <span className="pt-move__when">{when.day} <bdi dir="ltr" className="pt-num">{when.time}</bdi></span>
                            {details && <span className="pt-move__why" dir="auto" title={details}>{details}</span>}
                          </small>
                        </span>
                        <span className="pt-move__end">
                          <bdi dir="ltr" className={`pt-pts pt-num ${gain ? 'is-gain' : 'is-loss'}`}>{gain ? '+' : '−'}{pointsText(Math.abs(r.points))}</bdi>
                          {typeof r.balanceAfter === 'number' && (
                            <small>الرصيد <bdi dir="ltr" className="pt-num">{pointsText(r.balanceAfter)}</bdi></small>
                          )}
                        </span>
                      </li>
                    );
                  })}
                </ul>
              </section>
            );
          })}
        </div>
      )}
      {rows.length > 0 && rows.length < total && (
        <div className="pt-more">
          {failed === 'more' && <p className="pt-muted" role="alert">تعذّر تحميل المزيد</p>}
          <button type="button" className="pt-btn pt-btn--outline" onClick={() => fetchPage(type, page + 1)} disabled={!!busy}>
            {busy === 'more' ? 'جاري التحميل...' : 'عرض المزيد'}
          </button>
        </div>
      )}
    </section>
  );
};

const PointsPage = () => {
  const [data, setData] = useState<LoyaltyResponse | null>(null);
  const [failed, setFailed] = useState(false);
  // Bumped on every summary that lands, so the history starts over from it
  const [loads, setLoads] = useState(0);
  // The levels and their perks (the page works without them)
  const [tiers, setTiers] = useState<LoyaltyTier[]>([]);
  const [celebrating, setCelebrating] = useState(false);
  const navigate = useNavigate();
  const promotions = usePromotions();

  const load = useCallback(() => {
    setFailed(false);
    setData(null);
    api.getLoyalty()
      .then((res: any) => {
        const body = res?.data;
        // Points switched off for this customer: the page is not for them
        if (body?.off) { navigate('/home', { replace: true }); return; }
        if (typeof body?.points !== 'number') { setFailed(true); return; }
        setData(body);
        setLoads((n) => n + 1);
        if (body.level?.celebrate) setCelebrating(true);
      })
      .catch(() => setFailed(true));
  }, [navigate]);

  useEffect(() => { load(); }, [load]);
  useEffect(() => {
    api.getLoyaltyTiers()
      .then((res: any) => { if (Array.isArray(res?.data?.tiers)) setTiers(res.data.tiers); })
      .catch(() => undefined);
  }, []);

  const pending = data?.pending || [];
  const empty = !!data && data.points <= 0 && !pending.length && !data.history?.rows?.length;

  return (
    <div dir="rtl" lang="ar" className="pt-page w-full px-4 pb-16 pt-6 sm:px-6 lg:px-8 lg:pt-8">
      <div className="mx-auto max-w-3xl">
        <header className="pt-head">
          <h1>نقاطي</h1>
          <p>مكافأة على تعاملك معنا، تدفع بها جزءاً من فواتيرك.</p>
        </header>

        {failed && (
          <div className="pt-card pt-error" role="alert">
            <TriangleAlert size={28} aria-hidden />
            <b>تعذّر تحميل نقاطك</b>
            <button type="button" className="pt-btn" onClick={load}>إعادة المحاولة</button>
          </div>
        )}

        {!failed && !data && (
          <div className="pt-card" aria-busy="true"><span className="pt-sk" /><span className="sr-only">جاري التحميل</span></div>
        )}

        {data && (
          <>
            <PromotionBanner promotions={promotions} />

            <section className="pt-balance" aria-label="رصيدك">
              <span className="pt-balance__label"><Gift size={18} aria-hidden /> رصيدك الآن</span>
              <p className="pt-balance__value">
                <bdi dir="ltr"><b>{pointsText(data.points)}</b></bdi>
                <span>نقطة</span>
                {/* "=" stays in the Arabic run, beside "نقطة"; only the amount is left-to-right */}
                <span className="pt-balance__usd">= <bdi dir="ltr">{usdText(data.points)}</bdi></span>
              </p>
              {/* What a point is worth, said once where the balance is read */}
              <p className="pt-rate-chip">
                <Coins size={16} aria-hidden />
                <span>كل <bdi dir="ltr"><b>100</b></bdi> نقطة تساوي <bdi dir="ltr"><b>$1</b></bdi></span>
              </p>
              {data.expiringSoon && data.expiringSoon.points > 0 && (
                <p className="pt-balance__soon"><Clock size={16} aria-hidden /> تنتهي {pointsText(data.expiringSoon.points)} نقطة في {dateText(data.expiringSoon.at)}</p>
              )}
            </section>

            {data.level && <LevelCard level={data.level} tiers={tiers} />}

            {empty && (
              <section className="pt-card pt-empty">
                <h2>لا نقاط بعد</h2>
                <p>تكسب 10 نقاط عن كل 20$ تدفعها على الشحن أو الشراء، فشحنة بـ 30$ تعطيك 15 نقطة بعد دفعها واستلامها.</p>
                <Link to="/start-shipment" className="pt-btn"><Rocket size={18} aria-hidden /> ابدأ الشحن</Link>
              </section>
            )}

            {pending.length > 0 && <PendingSection pending={pending} />}

            <section className="pt-card" aria-labelledby="pt-earn">
              <h2 id="pt-earn">كيف تكسب النقاط</h2>
              {data.level && data.level.multiplier > 1 && (
                <p className="pt-earn__boost">مستوى {data.level.name}: تكسب <bdi dir="ltr">×{data.level.multiplier}</bdi> من هذه النقاط</p>
              )}
              <ul className="pt-list">
                {RATES.map((r) => (
                  <li key={r.what} className="pt-row">
                    <span className="pt-row__main"><b>{r.what}</b><small>{r.example}</small></span>
                    <span className="pt-rate">{r.rate}</span>
                  </li>
                ))}
              </ul>
            </section>

            {data.level && tiers.length > 0 && <LevelRoute tiers={tiers} level={data.level} />}

            {!empty && <HistorySection key={loads} initial={data.history} />}

            <section className="pt-card" aria-labelledby="pt-use">
              <h2 id="pt-use">كيف تستعمل نقاطك</h2>
              <p>اطلب استعمالها من موظف المكتب عند استلام شحنتك أو دفع فاتورتك، وهو يخصمها لك.</p>
              <p>تدفع بالنقاط حتى 20% من قيمة الفاتورة. مثال: فاتورة 200$، تدفع حتى 40$ (4000 نقطة) بنقاطك والباقي بالطريقة المعتادة.</p>
            </section>

            <section className="pt-card">
              <details className="pt-terms">
                <summary><h2 id="pt-terms">الشروط</h2><ChevronDown size={20} aria-hidden /></summary>
                {pointsTerms.map((s) => (
                  <div key={s.title} className="pt-terms__section">
                    <h3>{s.title}</h3>
                    {s.list
                      ? <ul>{s.lines.map((l) => <li key={l}>{l}</li>)}</ul>
                      : s.lines.map((l) => <p key={l}>{l}</p>)}
                  </div>
                ))}
              </details>
            </section>
          </>
        )}
      </div>
      {celebrating && data?.level && (
        <LevelCelebration level={data.level} tier={tiers.find((t) => t.key === data.level?.level)} onClose={() => setCelebrating(false)} />
      )}
    </div>
  );
};

export default PointsPage;
