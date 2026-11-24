import { KeyboardEvent, ReactNode, useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useSelector } from 'react-redux';
import { Link } from 'react-router-dom';
import {
  ArrowDownLeft, ArrowLeftRight, ArrowUpRight, BadgeCheck, Banknote, Download, FileClock, Gift, PackageCheck, Receipt, RotateCcw, Scale, Ship,
  TriangleAlert, Undo2, Wallet,
} from 'lucide-react';
import api from '../../api';
import { User } from '../../models';
import { dateText, timeText } from '../ClientOrders/orderUtils';
import { MovementKind, WalletCurrency, WalletMovement, WalletSummary } from './walletTypes';
import { CURRENCY_NAMES, DEBT_NAMES, KIND_NAMES, monthKey, monthName } from './walletFormat';
import Money from './Money';
import WalletStatementDialog from './WalletStatementDialog';
import './wallet.css';

// The customer's wallet (owner's request 2026-11-18): in each currency what is in the wallet, what
// is owed and the net of the two; what the packages on the way will cost when collected and the net
// after them; the open invoices; every movement of the wallet; and the account statement, the same
// document staff print.

const KIND_ICONS: Record<MovementKind, ReactNode> = {
  deposit: <ArrowDownLeft size={18} />,
  withdrawal: <Banknote size={18} />,
  payment: <Receipt size={18} />,
  refund: <RotateCcw size={18} />,
  compensation: <Gift size={18} />,
  cancellation: <Undo2 size={18} />,
  exchange: <ArrowLeftRight size={18} />,
  debt: <FileClock size={18} />,
  debtPayment: <BadgeCheck size={18} />,
  writeOff: <Scale size={18} />,
};
// Movements read from the server at a time (2026-11-24: not the whole history at once)
const PAGE = 30;
type MovesPage = { rows: WalletMovement[], hasMore: boolean, total: number };
// Packages on the way shown before «عرض الكل»
const UPCOMING_FIRST = 4;

const WalletPage = () => {
  const account: User = useSelector((state: any) => state.session.account);
  const [currency, setCurrency] = useState<WalletCurrency>('USD');
  const [summary, setSummary] = useState<WalletSummary | null>(null);
  const [failed, setFailed] = useState(false);
  // Oldest first, as the server sends them; older pages are put in front
  const [moves, setMoves] = useState<Record<string, MovesPage | undefined>>({});
  // Each currency loads and fails on its own
  const [movesFailed, setMovesFailed] = useState<Record<string, boolean>>({});
  const loading = useRef(new Set<string>());
  // The currency whose older movements are on their way («عرض المزيد»)
  const [loadingMore, setLoadingMore] = useState<Record<string, boolean>>({});
  const [moreFailed, setMoreFailed] = useState<Record<string, boolean>>({});
  // The entrance plays once, when the page opens. After the customer switches currency, the new
  // currency's cards only cross-fade in. (A timer used to mark the entrance done, and that added the
  // cross-fade to the cards already on screen, so they moved in a second time.)
  const [switched, setSwitched] = useState(false);
  const chooseCurrency = (c: WalletCurrency) => { setSwitched(true); setCurrency(c); };
  const [statementOpen, setStatementOpen] = useState(false);
  const [allUpcoming, setAllUpcoming] = useState(false);

  const loadSummary = useCallback(() => {
    setFailed(false);
    setSummary(null);
    api.getWallet()
      .then((res: any) => { if (res?.data?.currencies) setSummary(res.data); else setFailed(true); })
      .catch(() => setFailed(true));
  }, []);
  useEffect(() => { loadSummary(); }, [loadSummary]);

  // The newest movements of one currency (a request already on its way is not sent again)
  const loadMoves = useCallback((cur: WalletCurrency) => {
    if (loading.current.has(cur)) return;
    loading.current.add(cur);
    setMovesFailed((f) => ({ ...f, [cur]: false }));
    api.getWalletStatement(cur, { limit: PAGE })
      .then((res: any) => {
        const rows: WalletMovement[] = Array.isArray(res?.data?.rows) ? res.data.rows : [];
        setMoves((m) => ({ ...m, [cur]: { rows, hasMore: !!res?.data?.hasMore, total: Number(res?.data?.total) || rows.length } }));
      })
      .catch(() => setMovesFailed((f) => ({ ...f, [cur]: true })))
      .finally(() => loading.current.delete(cur));
  }, []);
  // Both currencies are read when the page opens, so switching shows them at once
  useEffect(() => { loadMoves('USD'); loadMoves('LYD'); }, [loadMoves]);

  // The next older page of the chosen currency, after the oldest one on screen
  const loadOlder = () => {
    const cur = currency;
    const page = moves[cur];
    const key = `more-${cur}`;
    if (!page || !page.rows.length || loading.current.has(key)) return;
    loading.current.add(key);
    setLoadingMore((l) => ({ ...l, [cur]: true }));
    setMoreFailed((f) => ({ ...f, [cur]: false }));
    api.getWalletStatement(cur, { limit: PAGE, before: page.rows[0].id })
      .then((res: any) => {
        const older: WalletMovement[] = Array.isArray(res?.data?.rows) ? res.data.rows : [];
        setMoves((m) => {
          const now = m[cur];
          if (!now) return m;
          const seen = new Set(now.rows.map((row) => row.id));
          return { ...m, [cur]: { ...now, rows: [...older.filter((row) => !seen.has(row.id)), ...now.rows], hasMore: !!res?.data?.hasMore } };
        });
      })
      .catch(() => setMoreFailed((f) => ({ ...f, [cur]: true })))
      .finally(() => { loading.current.delete(key); setLoadingMore((l) => ({ ...l, [cur]: false })); });
  };

  // Arrow keys move between the two currencies, as in any radio group
  const onSwitchKey = (event: KeyboardEvent<HTMLDivElement>) => {
    if (!['ArrowLeft', 'ArrowRight'].includes(event.key)) return;
    event.preventDefault();
    const next: WalletCurrency = currency === 'USD' ? 'LYD' : 'USD';
    chooseCurrency(next);
    (event.currentTarget.querySelector(`[data-currency="${next}"]`) as HTMLButtonElement | null)?.focus();
  };

  const page = moves[currency];
  const rows = page?.rows;
  // Newest first on the page, grouped by month
  const newest = useMemo(() => (rows ? [...rows].reverse() : []), [rows]);
  const months = useMemo(() => {
    const groups: { key: string, items: WalletMovement[] }[] = [];
    newest.forEach((row) => {
      const key = monthKey(row.at);
      const last = groups[groups.length - 1];
      if (last && last.key === key) last.items.push(row); else groups.push({ key, items: [row] });
    });
    return groups;
  }, [newest]);

  const cur = summary?.currencies[currency];
  const debts = (summary?.debts || []).filter((d) => d.currency === currency);
  const upcoming = summary?.upcoming;
  const showUpcoming = currency === 'USD' && !!upcoming && (upcoming.items.length > 0 || upcoming.unpriced > 0);

  return (
    <div dir="rtl" lang="ar" className={`wl-page w-full px-4 pb-16 pt-6 sm:px-6 lg:px-8 lg:pt-8${switched ? ' is-switched' : ''}`}>
      <div className="mx-auto max-w-3xl">
        <header className="wl-head">
          <div>
            <h1>محفظتي</h1>
            <p>رصيدك وما عليك، وكل حركة على محفظتك.</p>
          </div>
          {/* One pill slides under the chosen currency */}
          <div className="wl-switch" role="radiogroup" aria-label="العملة" style={{ ['--i' as any]: currency === 'USD' ? 0 : 1 }} onKeyDown={onSwitchKey}>
            <span className="wl-switch__thumb" aria-hidden />
            {(['USD', 'LYD'] as WalletCurrency[]).map((c) => (
              <button key={c} type="button" role="radio" data-currency={c} aria-checked={currency === c} tabIndex={currency === c ? 0 : -1}
                className={currency === c ? 'is-on' : ''} onClick={() => chooseCurrency(c)}>
                {CURRENCY_NAMES[c]} <bdi dir="ltr">{c}</bdi>
              </button>
            ))}
          </div>
        </header>

        {failed && (
          <div className="wl-card wl-state" role="alert">
            <TriangleAlert size={28} aria-hidden />
            <b>تعذّر تحميل محفظتك</b>
            <button type="button" className="wl-btn" onClick={loadSummary}>إعادة المحاولة</button>
          </div>
        )}

        {!failed && !summary && (
          <div aria-busy="true">
            <div className="wl-sk wl-sk--hero" />
            <div className="wl-sk" />
            <span className="sr-only">جاري التحميل</span>
          </div>
        )}

        {summary && cur && (
          <>
            {/* One number: the wallet's balance, the same as the last balance of the statement. Debts
                are entries in the statement, so this balance already counts them: no sum to read. */}
            {/* The block stays (its colour eases from green to red); what is inside fades to the other currency */}
            <section className={`wl-hero${cur.net < 0 ? ' is-owed' : ''}`} aria-label="رصيد المحفظة" aria-live="polite">
              <div key={currency} className="wl-hero__body wl-swap">
              <span className="wl-hero__label"><Wallet size={18} aria-hidden /> رصيد محفظتك</span>
              <p className="wl-hero__net"><Money value={cur.net} currency={currency} /></p>
              </div>
            </section>

            {/* The cards of the chosen currency: they change together, with one short fade */}
            <div key={currency} className="wl-swap">

            {debts.length > 0 && (
              <section className="wl-card" aria-labelledby="wl-debts">
                <header className="wl-card__head">
                  <div>
                    <h2 id="wl-debts">مبالغ متبقية عليك</h2>
                    <p className="wl-card__sub">طلبيات دفعت جزءاً من قيمتها، وهذا الباقي منها.</p>
                  </div>
                  <span className="wl-card__aside"><Money value={cur.debts} currency={currency} /></span>
                </header>
                <ul className="wl-list">
                  {debts.map((debt) => (
                    <li key={debt.id} className="wl-row">
                      <span className="wl-row__icon is-owed" aria-hidden><Receipt size={18} /></span>
                      <div className="wl-row__main">
                        <b>
                          {DEBT_NAMES[debt.type] || 'مبلغ متبقي'}
                          {debt.orderId && <> · <Link to={`/order/${debt.orderId}`} className="wl-link"><bdi dir="ltr">{debt.orderNumber}</bdi></Link></>}
                        </b>
                        <small>
                          منذ {dateText(debt.at)}
                          {debt.initialAmount > debt.amount && <> · دفعت <Money value={debt.initialAmount - debt.amount} currency={currency} /> من أصل <Money value={debt.initialAmount} currency={currency} /></>}
                        </small>
                      </div>
                      <div className="wl-row__side">
                        <b className="is-owed"><Money value={debt.amount} currency={currency} /></b>
                        {debt.overdue && <span className="wl-chip is-late">متأخرة</span>}
                      </div>
                    </li>
                  ))}
                </ul>
              </section>
            )}

            {showUpcoming && upcoming && (
              <section className="wl-card" aria-labelledby="wl-upcoming">
                <header className="wl-card__head">
                  <h2 id="wl-upcoming">شحنات قادمة</h2>
                  {upcoming.usd > 0 && <span className="wl-card__aside">تقريباً <Money value={upcoming.usd} currency="USD" /></span>}
                </header>
                {upcoming.items.length > 0 && (
                  <ul className="wl-list">
                    {(allUpcoming ? upcoming.items : upcoming.items.slice(0, UPCOMING_FIRST)).map((item) => (
                      <li key={item.packageId} className="wl-row">
                        <span className={`wl-row__icon${item.arrived ? ' is-ready' : ''}`} aria-hidden>{item.arrived ? <PackageCheck size={18} /> : <Ship size={18} />}</span>
                        <div className="wl-row__main">
                          <b>
                            <Link to={`/order/${item.orderId}`} className="wl-link"><bdi dir="ltr">{item.orderNumber}</bdi></Link>
                            {item.trackingNumber && <small className="wl-row__track"> · <bdi dir="ltr">{item.trackingNumber}</bdi></small>}
                          </b>
                          <small>
                            {item.arrived ? 'وصل ليبيا، جاهز للاستلام' : 'في الطريق'}
                            {item.weight > 0 && <> · <bdi dir="ltr">{item.weight} {item.unit || 'KG'}</bdi></>}
                          </small>
                        </div>
                        <div className="wl-row__side"><b><Money value={item.amount} currency="USD" /></b></div>
                      </li>
                    ))}
                  </ul>
                )}
                {upcoming.items.length > UPCOMING_FIRST && (
                  <div className="wl-more">
                    <button type="button" className="wl-btn wl-btn--outline wl-btn--sm" aria-expanded={allUpcoming} onClick={() => setAllUpcoming((v) => !v)}>
                      {allUpcoming ? 'عرض أقل' : `عرض الكل (${upcoming.items.length})`}
                    </button>
                  </div>
                )}
                {upcoming.unpriced > 0 && (
                  <p className="wl-note"><Ship size={16} aria-hidden /> {upcoming.unpriced === 1 ? 'طرد واحد' : `${upcoming.unpriced} طرود`} يتحدد سعره عند وزنه.</p>
                )}
                <p className="wl-muted">المبالغ تقديرية، وتتأكد عند التسليم.</p>
              </section>
            )}
            </div>
          </>
        )}

        <section className="wl-card" aria-labelledby="wl-moves">
          <header className="wl-card__head">
            <h2 id="wl-moves">الحركات</h2>
            <button type="button" className="wl-btn wl-btn--sm" disabled={!rows?.length} onClick={() => setStatementOpen(true)}>
              <Download size={16} aria-hidden /> كشف الحساب
            </button>
          </header>

          {/* The list of the chosen currency fades in on its own */}
          <div key={currency} className="wl-swap">
          {movesFailed[currency] && (
            <div className="wl-state" role="alert">
              <b>تعذّر تحميل الحركات</b>
              <button type="button" className="wl-btn wl-btn--outline wl-btn--sm" onClick={() => loadMoves(currency)}>إعادة المحاولة</button>
            </div>
          )}
          {!movesFailed[currency] && !rows && <div className="wl-sk" aria-busy="true" />}
          {!movesFailed[currency] && rows && !rows.length && (
            <div className="wl-state">
              <Wallet size={28} aria-hidden />
              <b>لا توجد حركات {currency === 'USD' ? 'بالدولار' : 'بالدينار'} بعد</b>
              <p className="wl-muted">تظهر هنا الإيداعات والدفعات والاستردادات.</p>
            </div>
          )}

          {months.map((month) => (
            <div key={month.key} className="wl-month">
              <h3 className="wl-month__title">{monthName(month.key)}</h3>
              <ul className="wl-list">
                {month.items.map((row) => (
                  <li key={row.id} className="wl-row">
                    <span className={`wl-row__icon ${row.kind === 'debt' ? 'is-owed' : row.direction === 'in' ? 'is-in' : 'is-out'}`} aria-hidden>{KIND_ICONS[row.kind] || <ArrowUpRight size={18} />}</span>
                    <div className="wl-row__main">
                      <b>{KIND_NAMES[row.kind] || 'حركة'}</b>
                      {row.description && <p className="wl-row__desc" dir="auto">{row.description}</p>}
                      <small><bdi dir="ltr">{dateText(row.at)} {timeText(row.at)}</bdi></small>
                    </div>
                    <div className="wl-row__side">
                      <b className={row.kind === 'debt' ? 'is-owed' : row.direction === 'in' ? 'is-in' : ''}><Money value={row.amount} currency={currency} sign={row.direction === 'out' ? 'out' : 'in'} /></b>
                      <small className={row.balance < 0 ? 'is-neg' : ''}>الرصيد <Money value={row.balance} currency={currency} /></small>
                    </div>
                  </li>
                ))}
              </ul>
            </div>
          ))}

          {page?.hasMore && (
            <div className="wl-more">
              {moreFailed[currency] && <p className="wl-muted" role="alert">تعذّر تحميل الحركات الأقدم.</p>}
              <button type="button" className="wl-btn wl-btn--outline wl-btn--sm" disabled={!!loadingMore[currency]} aria-busy={!!loadingMore[currency]} onClick={loadOlder}>
                {loadingMore[currency] ? 'جارٍ التحميل…' : moreFailed[currency] ? 'إعادة المحاولة' : `عرض المزيد (${Math.max(0, page.total - page.rows.length)})`}
              </button>
            </div>
          )}
          </div>
        </section>
      </div>

      <WalletStatementDialog open={statementOpen} onClose={() => setStatementOpen(false)} account={account} currency={currency} />
    </div>
  );
};

export default WalletPage;
