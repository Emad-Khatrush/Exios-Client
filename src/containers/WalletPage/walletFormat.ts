import { MovementKind, WalletCurrency } from './walletTypes';

// 1,234.50 (always two decimals, Latin digits)
export const amountText = (value: number) => Math.abs(Number(value || 0)).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });

// An amount with its currency in a page: Money.tsx (it keeps "د.ل" after the number in Arabic text)

export const CURRENCY_NAMES: Record<WalletCurrency, string> = { USD: 'دولار', LYD: 'دينار' };

// What each kind of movement is called (the same names as the admin's statement)
export const KIND_NAMES: Record<MovementKind, string> = {
  deposit: 'إيداع رصيد',
  withdrawal: 'سحب نقدي',
  payment: 'دفع من المحفظة',
  refund: 'استرداد للمحفظة',
  compensation: 'تعويض',
  cancellation: 'إلغاء / عكس عملية',
  exchange: 'صرافة داخلية',
  debt: 'متبقي للدفع',
  debtPayment: 'سداد المتبقي',
  writeOff: 'تسوية المتبقي',
};

// What is left to pay on an order: the part of its value not paid yet
export const DEBT_NAMES: Record<string, string> = { invoice: 'متبقي من قيمة الشراء', receivedGoods: 'متبقي من قيمة الشحن', general: 'مبلغ متبقي' };

const MONTHS = ['يناير', 'فبراير', 'مارس', 'أبريل', 'مايو', 'يونيو', 'يوليو', 'أغسطس', 'سبتمبر', 'أكتوبر', 'نوفمبر', 'ديسمبر'];
export const monthKey = (d: string) => { const date = new Date(d); return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`; };
export const monthName = (key: string) => { const [y, m] = key.split('-'); return `${MONTHS[Number(m) - 1] || ''} ${y}`; };

// "YYYY-MM-DD" of a date, in the device's time
export const dayKey = (d: string | Date) => {
  const date = new Date(d);
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
};
