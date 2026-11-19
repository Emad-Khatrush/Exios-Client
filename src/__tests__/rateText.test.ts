import { homeCardText, rateButtonText, rateThanksText } from '../containers/RatePage/rateText';

describe('rating rewards: what the customer reads (2 points per order)', () => {
  it('the button names the points for the orders ticked', () => {
    expect(rateButtonText(1)).toBe('أرسل التقييم واكسب نقطتين');
    expect(rateButtonText(4)).toBe('أرسل التقييم واكسب 8 نقاط');
    expect(rateButtonText(6)).toBe('أرسل التقييم واكسب 12 نقطة');
    expect(rateButtonText(0)).toBe('اختر طلبية لتقييمها');
  });

  it('the home card says how many orders wait and what they earn', () => {
    expect(homeCardText(1)).toEqual({ title: 'قيّم خدمتنا واكسب نقطتين', sub: 'عندك طلبية استلمتها ولم تقيّمها' });
    expect(homeCardText(2)).toEqual({ title: 'قيّم خدمتنا واكسب 4 نقاط', sub: 'عندك طلبيتان استلمتهما ولم تقيّمهما' });
    expect(homeCardText(5)).toEqual({ title: 'قيّم خدمتنا واكسب 10 نقاط', sub: 'عندك 5 طلبيات استلمتها ولم تقيّمها' });
  });

  it('the thanks names the points added, or none', () => {
    expect(rateThanksText(2)).toBe('شكراً لك! أضفنا لك نقطتين.');
    expect(rateThanksText(8)).toBe('شكراً لك! أضفنا لك 8 نقاط.');
    expect(rateThanksText(0)).toBe('شكراً لك! وصلنا تقييمك.');
  });
});
