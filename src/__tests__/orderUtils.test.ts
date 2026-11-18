import { countryKey, orderTitle, packageCost, shipmentStage, shippingCost, stageKey } from '../containers/ClientOrders/orderUtils';

const order = (o: any) => o;
const pkg = (price: number, weight: number) => ({ deliveredPackages: { exiosPrice: price, weight: { total: weight } } }) as any;

describe('orderTitle: what the order is, never the goods', () => {
  it('names a purchase invoice', () => expect(orderTitle(order({ isPayment: true, isShipment: false, productName: 'ملابس' }))).toBe('فاتورة شراء'));
  it('names a parcel the customer told us about', () => expect(orderTitle(order({ unsureOrder: true }))).toBe('طرد منتظر'));
  it('names a shipment by how it travels', () => {
    expect(orderTitle(order({ isShipment: true, productName: 'أحذية', shipment: { method: 'air' } }))).toBe('شحن جوي');
    expect(orderTitle(order({ isShipment: true, shipment: { method: 'sea' } }))).toBe('شحن بحري');
    expect(orderTitle(order({ isShipment: true }))).toBe('شحن غير محدد');
  });
});

describe('shipmentStage', () => {
  it('a delivered order is at the last stage', () => expect(shipmentStage(order({ isFinished: true, orderStatus: 1 }))).toBe(4));
  it('an order we bought has one more step at the start', () => {
    expect(shipmentStage(order({ isPayment: true, orderStatus: 4 }))).toBe(3);
    expect(shipmentStage(order({ isPayment: false, orderStatus: 3 }))).toBe(3);
    expect(stageKey(order({ isPayment: false, orderStatus: 3 }))).toBe(stageKey(order({ isPayment: true, orderStatus: 4 })));
  });
  it('never goes past the last stage or below the first', () => {
    expect(shipmentStage(order({ orderStatus: 9 }))).toBe(4);
    expect(shipmentStage(order({ isPayment: true, orderStatus: 0 }))).toBe(0);
  });
});

describe('shipping cost', () => {
  it('is price × weight, to the cent', () => expect(packageCost(pkg(12.5, 1.3))).toBe(16.25));
  it('is unknown until there is a price and a weight', () => {
    expect(packageCost(pkg(0, 2))).toBeNull();
    expect(packageCost(pkg(10, 0))).toBeNull();
  });
  it('adds up the priced packages and counts them', () => {
    expect(shippingCost([pkg(10, 1.1), pkg(10, 2.2), pkg(0, 1)])).toEqual({ total: 33, priced: 2, count: 3 });
  });
});

describe('countryKey', () => {
  it('reads Arabic and English names', () => {
    expect(countryKey('الصين')).toBe('china');
    expect(countryKey(' China ')).toBe('china');
  });
  it('is empty for a blank or unknown place', () => {
    expect(countryKey('-')).toBe('');
    expect(countryKey('Narnia')).toBe('');
  });
});
