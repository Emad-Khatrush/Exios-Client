import { WalletCurrency } from './walletTypes';
import { amountText } from './walletFormat';

// An amount inside Arabic text. Dollars read "$1,234.50" (the sign and "$" stay with the number,
// left to right). Dinars read "1,234.50 د.ل": only the number is left to right and "د.ل" follows it
// in the Arabic text, so it sits after the number as it is written, never before it.
// `sign`: 'auto' puts − on a negative value, 'in' / 'out' always show + / −.
type Props = { value: number, currency: WalletCurrency, sign?: 'auto' | 'in' | 'out', className?: string };

const Money = ({ value, currency, sign = 'auto', className = 'wl-num' }: Props) => {
  const mark = sign === 'in' ? '+' : sign === 'out' ? '−' : value < 0 ? '−' : '';
  if (currency === 'USD') return <bdi dir="ltr" className={className}>{mark}${amountText(value)}</bdi>;
  return <span className={className}><bdi dir="ltr">{mark}{amountText(value)}</bdi> د.ل</span>;
};

export default Money;
