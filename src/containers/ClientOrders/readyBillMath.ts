import { UpcomingPackage, WalletCurrency, WalletDebt, WalletSummary } from '../WalletPage/walletTypes';

/* "حسبتك عند الاستلام" worked out (ReadyBill shows it): for the orders on screen, one line per
   package that reached Libya and is not paid yet, one per amount still owed on those orders, and
   the total of each currency, rounded to the cent. Kept apart from the component so it is tested. */

export type BillLine =
  | { kind: 'pkg', key: string, orderId: string, orderNumber: string, item: UpcomingPackage }
  | { kind: 'debt', key: string, orderId: string, orderNumber: string, debt: WalletDebt };

export type Bill = { lines: BillLine[], totals: Record<WalletCurrency, number> };

const cents = (n: number) => Math.round(n * 100) / 100;

export const readyBill = (wallet: Pick<WalletSummary, 'upcoming' | 'debts'>, orderIds: string[]): Bill => {
  const ids = new Set(orderIds);
  const lines: BillLine[] = [
    ...wallet.upcoming.items
      .filter((item) => item.arrived && ids.has(item.orderId))
      .map((item): BillLine => ({ kind: 'pkg', key: `p${item.packageId}`, orderId: item.orderId, orderNumber: item.orderNumber, item })),
    ...wallet.debts
      .filter((debt) => debt.orderId && ids.has(debt.orderId) && debt.amount > 0)
      .map((debt): BillLine => ({ kind: 'debt', key: `d${debt.id}`, orderId: debt.orderId as string, orderNumber: debt.orderNumber || '', debt })),
  ];
  // Each order's lines together, in the order of the list (a stable sort keeps packages before debts)
  const rank = new Map(orderIds.map((id, i) => [id, i]));
  lines.sort((a, b) => (rank.get(a.orderId) ?? 0) - (rank.get(b.orderId) ?? 0));
  const totals: Record<WalletCurrency, number> = { USD: 0, LYD: 0 };
  lines.forEach((l) => {
    if (l.kind === 'pkg') totals.USD += l.item.amount;
    else totals[l.debt.currency] += l.debt.amount;
  });
  return { lines, totals: { USD: cents(totals.USD), LYD: cents(totals.LYD) } };
};
