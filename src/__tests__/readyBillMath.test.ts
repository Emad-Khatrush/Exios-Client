import { readyBill } from '../containers/ClientOrders/readyBillMath';

const item = (orderId: string, packageId: string, amount: number, arrived = true) =>
  ({ orderId, orderNumber: `N-${orderId}`, packageId, trackingNumber: '', weight: 1, unit: 'KG', amount, arrived });
const debt = (id: string, orderId: string | null, amount: number, currency: 'USD' | 'LYD' = 'USD') =>
  ({ id, orderId, orderNumber: orderId ? `N-${orderId}` : null, amount, initialAmount: amount, currency, type: 'invoice' as const, overdue: false, at: '' });

describe('readyBill: what collecting the orders on screen comes to', () => {
  const wallet = {
    upcoming: { usd: 0, unpriced: 0, items: [item('o1', 'p1', 36), item('o1', 'p2', 18), item('o2', 'p3', 24), item('o9', 'p9', 17, false)] },
    debts: [debt('d1', 'o1', 200), debt('d2', 'o3', 50), debt('d3', null, 10)],
  };

  it('counts only arrived packages and debts of the orders on screen', () => {
    const bill = readyBill(wallet as any, ['o1', 'o2']);
    expect(bill.lines.map((l) => l.key)).toEqual(['pp1', 'pp2', 'dd1', 'pp3']);
    expect(bill.totals).toEqual({ USD: 278, LYD: 0 });
  });

  it('follows the order of the list on screen', () => {
    const bill = readyBill(wallet as any, ['o2', 'o1']);
    expect(bill.lines.map((l) => l.orderId)).toEqual(['o2', 'o1', 'o1', 'o1']);
  });

  it('keeps dinars apart from dollars', () => {
    const bill = readyBill({ upcoming: { usd: 0, unpriced: 0, items: [item('o1', 'p1', 5)] }, debts: [debt('d1', 'o1', 105, 'LYD')] } as any, ['o1']);
    expect(bill.totals).toEqual({ USD: 5, LYD: 105 });
  });

  it('rounds the total to the cent', () => {
    const bill = readyBill({ upcoming: { usd: 0, unpriced: 0, items: [item('o1', 'p1', 0.1), item('o1', 'p2', 0.2)] }, debts: [] } as any, ['o1']);
    expect(bill.totals.USD).toBe(0.3);
  });

  it('is empty when nothing is due', () => {
    expect(readyBill(wallet as any, ['o5']).lines).toHaveLength(0);
  });
});
