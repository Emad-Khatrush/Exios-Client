// Rating rewards (GET/POST client/ratings): 2 points for every order rated within 30 days of receiving
// it (orders from the points programme's start). The words the page, the home card and the thanks use.
export const POINTS_EACH = 2;

// "نقطتين" alone, "4 نقاط", "12 نقطة"
export const pointsText = (n: number) => (n === 2 ? 'نقطتين' : `${n} ${n >= 3 && n <= 10 ? 'نقاط' : 'نقطة'}`);

export const rateButtonText = (count: number) => (count > 0 ? `أرسل التقييم واكسب ${pointsText(count * POINTS_EACH)}` : 'اختر طلبية لتقييمها');

export const homeCardText = (count: number) => ({
  title: `قيّم خدمتنا واكسب ${pointsText(count * POINTS_EACH)}`,
  sub: count === 1 ? 'عندك طلبية استلمتها ولم تقيّمها'
    : count === 2 ? 'عندك طلبيتان استلمتهما ولم تقيّمهما'
      : `عندك ${count} ${count <= 10 ? 'طلبيات' : 'طلبية'} استلمتها ولم تقيّمها`,
});

export const rateThanksText = (points: number) => (points > 0 ? `شكراً لك! أضفنا لك ${pointsText(points)}.` : 'شكراً لك! وصلنا تقييمك.');

// An order waiting for the customer's rating (newest delivery first)
export type PendingRating = { _id: string, orderId: string, kind: 'shipping' | 'purchase' | 'remittance', trackingNumbers: string[], deliveredAt: string };
export type PendingRatings = { orders: PendingRating[], pointsEach: number, days: number, off: boolean };
