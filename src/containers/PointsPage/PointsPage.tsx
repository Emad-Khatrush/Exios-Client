import { useCallback, useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { ChevronDown, CircleMinus, Clock, Coins, Gift, LucideIcon, Plus, Rocket, ShoppingBag, TriangleAlert, Undo2 } from 'lucide-react';
import api from '../../api';
import { dateText, relativeDay } from '../ClientOrders/orderUtils';
import { LoyaltyHistoryRow, LoyaltyKind, LoyaltyResponse } from './loyaltyTypes';
import { pointsTerms } from './pointsTerms';
import { pointsText, usdText } from './pointsFormat';
import './points.css';

// Each movement in the history: its icon, its tone and its title (with the order number when it has one)
const KIND: Record<LoyaltyKind, { icon: LucideIcon, tone: 'gain' | 'spend' | 'loss', title: string, withOrder?: boolean }> = {
  earn: { icon: Plus, tone: 'gain', title: 'كسب من طلبية', withOrder: true },
  add: { icon: Gift, tone: 'gain', title: 'إضافة من المكتب' },
  restore: { icon: Undo2, tone: 'gain', title: 'إرجاع نقاط طلبية ملغاة' },
  redeem: { icon: ShoppingBag, tone: 'spend', title: 'استعمال على طلبية', withOrder: true },
  deduct: { icon: CircleMinus, tone: 'spend', title: 'خصم من المكتب' },
  expire: { icon: Clock, tone: 'loss', title: 'انتهت صلاحية النقاط' },
  revoke: { icon: CircleMinus, tone: 'loss', title: 'سحب نقاط طلبية ملغاة' },
};

// "اليوم", "أمس", else the date
const dayLabel = (d: string) => {
  const rel = relativeDay(d);
  return rel === 'اليوم' || rel === 'أمس' ? rel : dateText(d);
};

// The history in days, newest first (rows already come newest first)
const byDay = (rows: LoyaltyHistoryRow[]) => {
  const days: { label: string, rows: LoyaltyHistoryRow[] }[] = [];
  rows.forEach((r) => {
    const label = dayLabel(r.createdAt);
    const last = days[days.length - 1];
    if (last && last.label === label) last.rows.push(r);
    else days.push({ label, rows: [r] });
  });
  return days;
};

const GAINS: LoyaltyKind[] = ['earn', 'add', 'restore'];

const RATES = [
  { what: 'الشحن', rate: '10 نقاط لكل 20$', example: 'شحن بـ 30$ = 15 نقطة' },
  { what: 'فواتير الشراء وسويفت', rate: '10 نقاط لكل 20$', example: 'فاتورة بـ 30$ = 15 نقطة' },
  { what: 'علي باي', rate: '5 نقاط لكل 20$', example: 'حوالة بـ 30$ = 7 نقاط' },
];

const WAITING = { payment: 'بانتظار الدفع', delivery: 'بانتظار التسليم', processing: 'تُضاف خلال ساعة' };

const PointsPage = () => {
  const [data, setData] = useState<LoyaltyResponse | null>(null);
  const [failed, setFailed] = useState(false);
  const [rows, setRows] = useState<LoyaltyHistoryRow[]>([]);
  const [page, setPage] = useState(1);
  const [moreBusy, setMoreBusy] = useState(false);
  const [moreFailed, setMoreFailed] = useState(false);

  const load = useCallback(() => {
    setFailed(false);
    setData(null);
    api.getLoyalty()
      .then((res: any) => {
        const body = res?.data;
        if (typeof body?.points !== 'number') { setFailed(true); return; }
        setData(body);
        setRows(Array.isArray(body.history?.rows) ? body.history.rows : []);
        setPage(1);
      })
      .catch(() => setFailed(true));
  }, []);

  useEffect(() => { load(); }, [load]);

  const total = data?.history?.total || 0;

  // The first page comes with the summary; each tap adds the next one
  const loadMore = () => {
    setMoreBusy(true);
    setMoreFailed(false);
    api.getLoyaltyHistory(page + 1)
      .then((res: any) => {
        const next = res?.data?.rows;
        if (!Array.isArray(next)) { setMoreFailed(true); return; }
        setRows((cur) => [...cur, ...next]);
        setPage((p) => p + 1);
      })
      .catch(() => setMoreFailed(true))
      .finally(() => setMoreBusy(false));
  };

  const pending = data?.pending || [];
  const empty = !!data && data.points <= 0 && !pending.length && !rows.length;

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
            <section className="pt-balance" aria-label="رصيدك">
              <span className="pt-balance__label"><Gift size={18} aria-hidden /> رصيدك الآن</span>
              <p className="pt-balance__value">
                <bdi dir="ltr"><b>{pointsText(data.points)}</b></bdi>
                <span>نقطة</span>
                <bdi dir="ltr" className="pt-balance__usd">= {usdText(data.points)}</bdi>
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

            {empty && (
              <section className="pt-card pt-empty">
                <h2>لا نقاط بعد</h2>
                <p>تكسب 10 نقاط عن كل 20$ تدفعها على الشحن أو الشراء، فشحنة بـ 30$ تعطيك 15 نقطة بعد دفعها واستلامها.</p>
                <Link to="/start-shipment" className="pt-btn"><Rocket size={18} aria-hidden /> ابدأ الشحن</Link>
              </section>
            )}

            {pending.length > 0 && (
              <section className="pt-card" aria-labelledby="pt-pending">
                <h2 id="pt-pending">نقاط في الطريق</h2>
                <ul className="pt-list">
                  {pending.map((p) => (
                    <li key={`${p.orderId}-${p.arKey}`} className="pt-row">
                      <span className="pt-row__main">
                        <Link to={`/order/${p.orderId}`} className="pt-link">طلبية <bdi dir="ltr">{p.orderNumber}</bdi></Link>
                        <small>{WAITING[p.waitingFor] || ''}</small>
                      </span>
                      <bdi dir="ltr" className="pt-pts is-gain">+{pointsText(p.points)}</bdi>
                    </li>
                  ))}
                </ul>
              </section>
            )}

            <section className="pt-card" aria-labelledby="pt-earn">
              <h2 id="pt-earn">كيف تكسب النقاط</h2>
              <ul className="pt-list">
                {RATES.map((r) => (
                  <li key={r.what} className="pt-row">
                    <span className="pt-row__main"><b>{r.what}</b><small>{r.example}</small></span>
                    <span className="pt-rate">{r.rate}</span>
                  </li>
                ))}
              </ul>
            </section>

            {!empty && (
              <section className="pt-card" aria-labelledby="pt-history">
                <h2 id="pt-history">السجل</h2>
                {!rows.length ? <p className="pt-muted">لا توجد حركات بعد.</p> : (
                  <div className="pt-days">
                    {byDay(rows).map((day) => (
                      <section key={day.label} className="pt-day" aria-label={day.label}>
                        <h3 className="pt-day__head">{day.label}</h3>
                        <ul className="pt-moves">
                          {day.rows.map((r, i) => {
                            const kind = KIND[r.kind] || { icon: Plus, tone: 'gain', title: r.kind };
                            const Icon = kind.icon;
                            const gain = GAINS.includes(r.kind);
                            const order = r.orderId && r.orderNumber
                              ? <Link to={`/order/${r.orderId}`} className="pt-link">طلبية <bdi dir="ltr">{r.orderNumber}</bdi></Link>
                              : null;
                            const details = [r.reason, r.expiresAt && gain ? `تنتهي ${dateText(r.expiresAt)}` : ''].filter(Boolean).join(' · ');
                            return (
                              <li key={`${r.createdAt}-${i}`} className="pt-move">
                                <span className={`pt-move__icon is-${kind.tone}`} aria-hidden><Icon size={17} strokeWidth={2.4} /></span>
                                <span className="pt-move__main">
                                  <b className="pt-move__title">
                                    {kind.withOrder && order
                                      ? <>{kind.title} <Link to={`/order/${r.orderId}`} className="pt-link"><bdi dir="ltr">{r.orderNumber}</bdi></Link></>
                                      : kind.title}
                                  </b>
                                  {!kind.withOrder && order && <small>{order}</small>}
                                  {details && <small className="bidi-text" dir="auto">{details}</small>}
                                </span>
                                <span className="pt-move__end">
                                  <bdi dir="ltr" className={`pt-pts ${gain ? 'is-gain' : 'is-loss'}`}>{gain ? '+' : '−'}{pointsText(Math.abs(r.points))}</bdi>
                                  {typeof r.balanceAfter === 'number' && (
                                    <small>الرصيد: <bdi dir="ltr">{pointsText(r.balanceAfter)}</bdi></small>
                                  )}
                                </span>
                              </li>
                            );
                          })}
                        </ul>
                      </section>
                    ))}
                  </div>
                )}
                {rows.length < total && (
                  <div className="pt-more">
                    {moreFailed && <p className="pt-muted" role="alert">تعذّر تحميل المزيد</p>}
                    <button type="button" className="pt-btn pt-btn--outline" onClick={loadMore} disabled={moreBusy}>
                      {moreBusy ? 'جاري التحميل...' : 'عرض المزيد'}
                    </button>
                  </div>
                )}
              </section>
            )}

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
    </div>
  );
};

export default PointsPage;
