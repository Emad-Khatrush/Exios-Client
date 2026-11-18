import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { ArrowLeft, Receipt, Ship, Wallet } from 'lucide-react';
import api from '../../api';
import { WalletSummary } from '../WalletPage/walletTypes';
import WalletMoney from '../WalletPage/Money';

/* The wallet on the home page, linking to the wallet page: the net in dollars (what is left once
   what is owed is paid), what is in the wallet and what is owed, the dinar net when there is any,
   and a hint when invoices are open or packages on the way will cost something. Nothing is shown
   while it loads or if it fails, like the points card. */
const Money = ({ value, usd = true }: { value: number, usd?: boolean }) => (
  <WalletMoney value={value} currency={usd ? 'USD' : 'LYD'} className="hm-wallet__num" />
);

const WalletCard = () => {
  const [data, setData] = useState<WalletSummary | null>(null);

  useEffect(() => {
    let alive = true;
    api.getWallet()
      .then((res: any) => { if (alive && res?.data?.currencies) setData(res.data); })
      .catch(() => undefined);
    return () => { alive = false; };
  }, []);

  if (!data) return null;

  const usd = data.currencies.USD;
  const lyd = data.currencies.LYD;
  const showLyd = lyd.wallet !== 0 || lyd.debts !== 0;
  const owedCount = data.debts.length;
  const upcoming = data.upcoming.usd;
  const owed = usd.net < 0;

  return (
    <Link to="/wallet" className={`hm-wallet${owed ? ' is-owed' : ''}`} aria-label="محفظتي">
      <span className="hm-wallet__top">
        <span className="hm-wallet__icon" aria-hidden><Wallet size={20} /></span>
        <small>محفظتي</small>
        <ArrowLeft size={18} aria-hidden className="hm-wallet__go" />
      </span>
      <span className="hm-wallet__net">
        <span className="hm-wallet__label">{owed ? 'الصافي عليك' : 'الصافي لك'}</span>
        <b><Money value={usd.net} /></b>
      </span>
      <span className="hm-wallet__parts">
        في المحفظة <Money value={usd.wallet} />
        {usd.debts > 0 && <> · متبقي عليك <Money value={usd.debts} /></>}
        {showLyd && <> · بالدينار <Money value={lyd.net} usd={false} /></>}
      </span>
      {(owedCount > 0 || upcoming > 0) && (
        <span className="hm-wallet__hints">
          {owedCount > 0 && (
            <span className="hm-wallet__hint is-owed"><Receipt size={14} aria-hidden /> {owedCount === 1 ? 'متبقي على طلبية' : `متبقي على ${owedCount} طلبيات`}</span>
          )}
          {upcoming > 0 && (
            <span className="hm-wallet__hint">
              <Ship size={14} aria-hidden /> شحناتك القادمة <Money value={upcoming} />، {data.netAfterUpcomingUsd >= 0 ? 'يبقى لك' : 'تحتاج'} <Money value={Math.abs(data.netAfterUpcomingUsd)} />
            </span>
          )}
        </span>
      )}
    </Link>
  );
};

export default WalletCard;
