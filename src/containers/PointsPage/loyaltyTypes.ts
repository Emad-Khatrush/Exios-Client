export type LoyaltyKind = 'earn' | 'add' | 'restore' | 'redeem' | 'deduct' | 'expire' | 'revoke';
export type LoyaltyPending = { orderId: string, orderNumber: string, arKey: string, points: number, waitingFor: 'payment' | 'delivery' | 'processing' };
export type LoyaltyHistoryRow = { id?: string, kind: LoyaltyKind, points: number, orderId?: string, orderNumber?: string, reason?: string, createdAt: string, month?: string, expiresAt?: string, balanceAfter: number };
// What a month gained and spent over all its movements of the selected type ('YYYY-MM')
export type LoyaltyMonth = { month: string, gained: number, spent: number };
export type LoyaltyHistory = { rows: LoyaltyHistoryRow[], total: number, months?: LoyaltyMonth[] };
// The history's filters (GET /client/loyalty/history?type=)
export type LoyaltyHistoryType = 'all' | 'earn' | 'spend' | 'expire' | 'staff' | 'returned';
export type LoyaltySummary = {
  points: number, usd: number,
  expiringSoon: { points: number, at: string } | null,
  pending: LoyaltyPending[],
  earnedTotal: number, redeemedTotal: number,
};
// GET /client/loyalty
export type LoyaltyResponse = LoyaltySummary & { history: LoyaltyHistory };
// GET /client/order/:id/loyalty
export type PackagePoints = { earned: number, pending: number, waitingFor: 'payment' | 'delivery' | 'processing' | null };
export type OrderLoyalty = {
  earned: number, pending: number, redeemed: number, noPoints: { reason: string } | null,
  packages?: Record<string, PackagePoints>,
  quote: { balance: number, maxPoints: number, owedCents: number, billedCents: number, usedOnTarget: number },
};
// GET /client/loyalty/orders: the points of each order that earned some or has some on the way
export type OrderPoints = { earned: number, pending: number };
export type LoyaltyOrders = Record<string, OrderPoints>;
