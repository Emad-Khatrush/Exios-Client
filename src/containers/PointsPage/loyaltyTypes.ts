export type LoyaltyKind = 'earn' | 'add' | 'restore' | 'redeem' | 'deduct' | 'expire' | 'revoke';
export type LoyaltyPending = { orderId: string, orderNumber: string, arKey: string, points: number, waitingFor: 'payment' | 'delivery' | 'processing' };
export type LoyaltyHistoryRow = { kind: LoyaltyKind, points: number, orderId?: string, orderNumber?: string, reason?: string, createdAt: string, expiresAt?: string, balanceAfter: number };
export type LoyaltyHistory = { rows: LoyaltyHistoryRow[], total: number };
export type LoyaltySummary = {
  points: number, usd: number,
  expiringSoon: { points: number, at: string } | null,
  pending: LoyaltyPending[],
  earnedTotal: number, redeemedTotal: number,
};
// GET /client/loyalty
export type LoyaltyResponse = LoyaltySummary & { history: LoyaltyHistory };
// GET /client/order/:id/loyalty
export type OrderLoyalty = {
  earned: number, pending: number, redeemed: number, noPoints: { reason: string } | null,
  quote: { balance: number, maxPoints: number, owedCents: number, billedCents: number, usedOnTarget: number },
};
// GET /client/loyalty/orders: the points of each order that earned some or has some on the way
export type OrderPoints = { earned: number, pending: number };
export type LoyaltyOrders = Record<string, OrderPoints>;
