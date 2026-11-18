// GET /client/wallet and GET /client/wallet/statement (Exios-Api/controllers/clientWallet.js)
export type WalletCurrency = 'USD' | 'LYD';
export type CurrencySummary = { wallet: number, debts: number, net: number };
export type WalletDebt = {
  id: string, orderId: string | null, orderNumber: string | null, amount: number, initialAmount: number,
  currency: WalletCurrency, type: 'invoice' | 'receivedGoods' | 'general', overdue: boolean, at: string,
};
export type UpcomingPackage = {
  orderId: string, orderNumber: string, packageId: string, trackingNumber: string, weight: number, unit: string, amount: number, arrived: boolean,
};
export type WalletSummary = {
  currencies: Record<WalletCurrency, CurrencySummary>,
  debts: WalletDebt[],
  // Dollars: what the packages not collected yet will cost when collected (an estimate)
  upcoming: { usd: number, items: UpcomingPackage[], unpriced: number },
  netAfterUpcomingUsd: number,
};
// The wallet's own movements, and the debts of the currency (an invoice left on credit, a payment
// on it, a remainder closed by hand): the statement's balance is the net, below zero when owed
export type MovementKind = 'deposit' | 'withdrawal' | 'payment' | 'refund' | 'compensation' | 'cancellation' | 'exchange'
  | 'debt' | 'debtPayment' | 'writeOff';
export type WalletMovement = {
  id: string, at: string, description: string, amount: number, direction: 'in' | 'out', kind: MovementKind, balance: number,
};
export type WalletStatement = { currency: WalletCurrency, rows: WalletMovement[] };
