import { Link } from 'react-router-dom';
import { Receipt } from 'lucide-react';
import { WalletDebt } from '../WalletPage/walletTypes';
import Money from '../WalletPage/Money';

/* What the customer still owes on this order: a purchase or shipping invoice not paid in full.
   It comes from the wallet's open debts (GET /client/wallet), each linked to its order.
   - on the purchase invoice it sits under the invoice's amount, and is printed with it;
   - on a shipment it is a notice above the status. */

const WHAT: Record<string, string> = { invoice: 'من قيمة الشراء', receivedGoods: 'من قيمة الشحن' };

type Props = { debts: WalletDebt[], variant: 'bill' | 'notice' };

const OrderDebt = ({ debts, variant }: Props) => {
  if (!debts.length) return null;
  return (
    <div className={`oi-debt is-${variant}`} role="status">
      <span className="oi-debt__icon" aria-hidden><Receipt size={19} /></span>
      <div className="oi-debt__text">
        {debts.map((debt) => {
          const paid = debt.initialAmount - debt.amount;
          return (
            <p key={debt.id}>
              <b>
                متبقي عليك <Money value={debt.amount} currency={debt.currency} className="oi-debt__num" />
                {' '}{WHAT[debt.type] || 'على هذه الطلبية'}
              </b>
              {debt.overdue && <span className="oi-debt__late">متأخر</span>}
              {paid > 0 && (
                <small>
                  دفعت <Money value={paid} currency={debt.currency} className="oi-debt__part" /> من أصل <Money value={debt.initialAmount} currency={debt.currency} className="oi-debt__part" />
                </small>
              )}
            </p>
          );
        })}
      </div>
      <Link to="/wallet" className="oi-btn oi-btn--small oi-noprint">محفظتي</Link>
    </div>
  );
};

export default OrderDebt;
