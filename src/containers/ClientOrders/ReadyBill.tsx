import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { Calculator } from 'lucide-react';
import api from '../../api';
import { UpcomingPackage, WalletCurrency, WalletDebt, WalletSummary } from '../WalletPage/walletTypes';
import { DEBT_NAMES } from '../WalletPage/walletFormat';
import Money from '../WalletPage/Money';

/* "جاهزة للاستلام": what the customer pays to collect the orders on screen, worked out for them.
   One line per package that reached Libya and is not paid yet (its shipping and fees, as billed at
   delivery), one per amount still owed on those same orders, then the total. Everything comes from
   GET /client/wallet (upcoming packages and open debts, each with its order), so it follows the
   list on screen, filters included. Nothing shows while it loads, if it fails, or when there is
   nothing to pay. */

type Line =
  | { kind: 'pkg', key: string, orderId: string, orderNumber: string, item: UpcomingPackage }
  | { kind: 'debt', key: string, orderId: string, orderNumber: string, debt: WalletDebt };

const ReadyBill = ({ orderIds }: { orderIds: string[] }) => {
  const [wallet, setWallet] = useState<WalletSummary | null>(null);

  useEffect(() => {
    let alive = true;
    api.getWallet()
      .then((res: any) => { if (alive && res?.data?.upcoming) setWallet(res.data); })
      .catch(() => undefined);
    return () => { alive = false; };
  }, []);

  const bill = useMemo(() => {
    if (!wallet) return null;
    const ids = new Set(orderIds);
    const lines: Line[] = [
      ...wallet.upcoming.items
        .filter((item) => item.arrived && ids.has(item.orderId))
        .map((item): Line => ({ kind: 'pkg', key: `p${item.packageId}`, orderId: item.orderId, orderNumber: item.orderNumber, item })),
      ...wallet.debts
        .filter((debt) => debt.orderId && ids.has(debt.orderId) && debt.amount > 0)
        .map((debt): Line => ({ kind: 'debt', key: `d${debt.id}`, orderId: debt.orderId as string, orderNumber: debt.orderNumber || '', debt })),
    ];
    // Each order's lines together, in the order of the list
    const rank = new Map(orderIds.map((id, i) => [id, i]));
    lines.sort((a, b) => (rank.get(a.orderId) ?? 0) - (rank.get(b.orderId) ?? 0));
    const totals: Record<WalletCurrency, number> = { USD: 0, LYD: 0 };
    lines.forEach((l) => {
      if (l.kind === 'pkg') totals.USD += l.item.amount;
      else totals[l.debt.currency] += l.debt.amount;
    });
    return { lines, totals };
  }, [wallet, orderIds]);

  if (!bill || !bill.lines.length) return null;
  const pkgCount = bill.lines.filter((l) => l.kind === 'pkg').length;

  return (
    <section className="or-bill" aria-labelledby="or-bill-title">
      <header className="or-bill__head">
        <span className="or-bill__icon" aria-hidden><Calculator size={20} /></span>
        <div>
          <h2 id="or-bill-title">حسبتك عند الاستلام</h2>
          <p>{pkgCount === 1 ? 'طرد واحد جاهز' : pkgCount > 1 ? `${pkgCount} طرود جاهزة` : 'مبالغ متبقية على طلبياتك الجاهزة'}</p>
        </div>
      </header>

      <ul className="or-bill__lines">
        {bill.lines.map((line) => (
          <li key={line.key}>
            <div className="or-bill__what">
              <Link to={`/order/${line.orderId}`} className="or-bill__order"><bdi dir="ltr">{line.orderNumber}</bdi></Link>
              {line.kind === 'pkg' ? (
                <small>
                  شحن
                  {line.item.trackingNumber && <> · <bdi dir="ltr">{line.item.trackingNumber}</bdi></>}
                  {line.item.weight > 0 && <> · <bdi dir="ltr">{line.item.weight} {line.item.unit || 'KG'}</bdi></>}
                </small>
              ) : (
                <small className="is-owed">{DEBT_NAMES[line.debt.type] || 'مبلغ متبقي'}</small>
              )}
            </div>
            <b className="or-bill__amount">
              {line.kind === 'pkg'
                ? <Money value={line.item.amount} currency="USD" className="or-bill__num" />
                : <Money value={line.debt.amount} currency={line.debt.currency} className="or-bill__num" />}
            </b>
          </li>
        ))}
      </ul>

      <div className="or-bill__total">
        <span>الإجمالي</span>
        <b>
          {bill.totals.USD > 0 && <Money value={bill.totals.USD} currency="USD" className="or-bill__num" />}
          {bill.totals.USD > 0 && bill.totals.LYD > 0 && <span className="or-bill__plus"> + </span>}
          {bill.totals.LYD > 0 && <Money value={bill.totals.LYD} currency="LYD" className="or-bill__num" />}
        </b>
      </div>
      <p className="or-bill__note">المبالغ كما تُحسب عند التسليم، ويؤكدها المكتب.</p>
    </section>
  );
};

export default ReadyBill;
