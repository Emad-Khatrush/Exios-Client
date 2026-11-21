// A points offer (GET /client/loyalty/promotions): orders created during it earn ×N (spec 2026-11-19)
export type LoyaltyPromotion = {
  id: string, name: string, multiplierPct: number, startsAt: string, endsAt: string, state: 'active' | 'upcoming',
  // An upcoming offer is sent only once its announcement day came (the countdown to its start)
  announceAt?: string | null,
  kinds: ('shipping' | 'purchase' | 'remittance')[], methods: ('air' | 'sea')[], countries: string[],
};
// The offer an earned or pending row was multiplied by, when it decided the multiplier
export type PromotionTag = { id: string, name: string, multiplierPct: number };
export type LoyaltyKind = 'earn' | 'add' | 'restore' | 'redeem' | 'deduct' | 'expire' | 'revoke';
export type LoyaltyPending = { orderId: string, orderNumber: string, arKey: string, points: number, waitingFor: 'payment' | 'delivery' | 'processing', promotion?: PromotionTag };
// Where an addition (or what a take-back or expiry took) came from, sent by the server
export type LoyaltySource = 'invite' | 'invite-welcome' | 'invite-step' | 'signup' | 'level' | 'rating' | 'staff' | 'reearn' | 'moved' | 'clawback' | null;
export type LoyaltyHistoryRow = { id?: string, kind: LoyaltyKind, points: number, orderId?: string, orderNumber?: string, reason?: string, source?: LoyaltySource, createdAt: string, month?: string, expiresAt?: string, balanceAfter: number, promotion?: PromotionTag };
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
// One loyalty level (GET /client/loyalty/tiers), from the first up
export type LoyaltyTier = {
  key: string, name: string, nameEn: string, color: string, rank: number, min: number,
  multiplier: number, expiryMonths: number, keepMin: number, upgradeGift: number, perks: string[],
};
// The customer's level: `points` are the points earned in the last 12 months (they decide the level)
export type LoyaltyLevel = {
  level: string, name: string, nameEn: string, rank: number, color: string, multiplier: number, expiryMonths: number, perks: string[],
  since: string | null, reviewAt: string | null, points: number,
  next: { key: string, name: string, min: number, remaining: number } | null,
  // The points that keep the level at the yearly review (70% of what it needs); null at the first level
  keep?: { min: number, remaining: number } | null,
  // Within 30 days of the yearly review: whether the level is kept, and the points still needed
  review: { at: string, keeps: boolean, needed: number } | null,
  // Raised by the office above what the points reach (so the points sit below the level)
  byOffice?: boolean,
  // The level reached and not celebrated yet in the app
  celebrate: string | null,
};
// GET /client/loyalty
export type LoyaltyResponse = LoyaltySummary & { history: LoyaltyHistory, level?: LoyaltyLevel };
// GET /client/order/:id/loyalty
export type PackagePoints = { earned: number, pending: number, waitingFor: 'payment' | 'delivery' | 'processing' | null };
export type OrderLoyalty = {
  earned: number, pending: number, redeemed: number, noPoints: { reason: string } | null, promotion?: PromotionTag,
  packages?: Record<string, PackagePoints>,
  quote: { balance: number, maxPoints: number, owedCents: number, billedCents: number, usedOnTarget: number },
};
// GET /client/loyalty/orders: the points of each order that earned some or has some on the way
export type OrderPoints = { earned: number, pending: number };
export type LoyaltyOrders = Record<string, OrderPoints>;
