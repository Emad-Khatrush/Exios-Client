// Prices, loaded a section at a time and kept for the visit: each prices page asks only for its own
// sections, and a page seen before opens at once with what was loaded, then refreshes quietly.
// Prices are the same for every customer, so nothing private is kept here.
import api from '../../api';
import type { Pricing } from './pricingMath';

export type PricingPart = 'shipping' | 'fcl' | 'purchase' | 'alipay' | 'swift';

const STORE_KEY = 'exios.pricing.v1';

// What has been loaded so far. A section not loaded yet is absent; one the office hides is null.
let memory: Partial<Pricing> = (() => {
  try { return JSON.parse(sessionStorage.getItem(STORE_KEY) || '{}') || {}; } catch { return {}; }
})();

export const hasParts = (data: Partial<Pricing> | null, parts: PricingPart[]) =>
  !!data && parts.every((p) => data[p] !== undefined);

// Everything loaded so far, or null when nothing is
export const cachedPricing = (): Partial<Pricing> | null => (Object.keys(memory).length ? memory : null);

// One request per set of sections at a time: pages opened together share it
const inFlight = new Map<string, Promise<Partial<Pricing>>>();

export const fetchPricing = (parts: PricingPart[]): Promise<Partial<Pricing>> => {
  const key = parts.slice().sort().join(',');
  const running = inFlight.get(key);
  if (running) return running;
  const request = api.getPricing(parts)
    .then((res: any) => {
      memory = { ...memory, ...(res?.data || {}) };
      try { sessionStorage.setItem(STORE_KEY, JSON.stringify(memory)); } catch { /* storage full or blocked */ }
      return memory;
    })
    .finally(() => inFlight.delete(key));
  inFlight.set(key, request);
  return request;
};
