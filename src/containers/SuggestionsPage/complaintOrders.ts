// The customer's orders as the complaint form offers them (GET client/feedback/orders): known by their
// order number and their packages' tracking numbers, never the goods' name. Several can be picked.
export type MyOrder = {
  _id: string;
  orderId: string;
  trackingNumbers: string[];
  createdAt: string;
  kind: 'shipping' | 'purchase' | 'remittance';
  method: string;
  finished: boolean;
};

// The server keeps up to 10 orders on a complaint
export const MAX_ORDERS = 10;

// A search by the order number or any tracking number, ignoring case and spaces
export const orderMatches = (o: Pick<MyOrder, 'orderId' | 'trackingNumbers'>, query: string) => {
  const q = query.trim().toLowerCase().replace(/\s+/g, '');
  if (!q) return true;
  return [o.orderId, ...(o.trackingNumbers || [])].some((v) => String(v || '').toLowerCase().replace(/\s+/g, '').includes(q));
};

// Picks an order or lets it go, in the order they were picked; no more than MAX_ORDERS
export const toggleOrder = (picked: string[], id: string) => {
  if (picked.includes(id)) return picked.filter((p) => p !== id);
  return picked.length >= MAX_ORDERS ? picked : [...picked, id];
};
