export type LoyaltyKind = 'earn' | 'add' | 'restore' | 'redeem' | 'deduct' | 'expire' | 'revoke';
export type LoyaltyPending = { orderId: string, orderNumber: string, arKey: string, points: number, waitingFor: 'payment' | 'delivery' };
export type LoyaltyHistoryRow = { kind: LoyaltyKind, points: number, orderId?: string, orderNumber?: string, reason?: string, createdAt: string, expiresAt?: string };
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
