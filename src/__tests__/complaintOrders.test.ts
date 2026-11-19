import { orderMatches, toggleOrder } from '../containers/SuggestionsPage/complaintOrders';

const order = { _id: 'o1', orderId: '1339-4980', trackingNumbers: ['SF1234567', 'YT88'], createdAt: '', kind: 'shipping' as const, method: 'air', finished: false };

describe('picking the orders of a complaint', () => {
  it('finds an order by its number or any of its tracking numbers', () => {
    expect(orderMatches(order, '4980')).toBe(true);
    expect(orderMatches(order, 'sf123')).toBe(true);
    expect(orderMatches(order, 'yt88')).toBe(true);
    expect(orderMatches(order, 'شيء')).toBe(false);
    expect(orderMatches(order, '')).toBe(true);
  });

  it('adds and removes orders, keeping the order they were picked in', () => {
    expect(toggleOrder([], 'a')).toEqual(['a']);
    expect(toggleOrder(['a'], 'b')).toEqual(['a', 'b']);
    expect(toggleOrder(['a', 'b'], 'a')).toEqual(['b']);
  });

  it('stops at 10 orders', () => {
    const ten = Array.from({ length: 10 }, (_, i) => `o${i}`);
    expect(toggleOrder(ten, 'x')).toEqual(ten);
  });
});
