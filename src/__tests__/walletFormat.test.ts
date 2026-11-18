import { amountText, monthKey, monthName } from '../containers/WalletPage/walletFormat';

describe('wallet amounts and months', () => {
  it('always shows two decimals with Latin digits, without the sign', () => {
    expect(amountText(1234.5)).toBe('1,234.50');
    expect(amountText(-80)).toBe('80.00');
  });
  it('groups movements by month', () => {
    expect(monthKey('2026-11-19T10:00:00')).toBe('2026-11');
    expect(monthName('2026-11')).toBe('نوفمبر 2026');
  });
});
