// Curated background themes a customer can pick for their order note (OrderInfoPage
// "customize" widget, displayed on the order card in ClientOrders). Kept to a fixed
// palette instead of a raw color picker so every combination still looks intentional
// next to the app's white cards and green accent, whichever theme the customer picks.
export type OrderTheme = {
  id: string,
  label: string,
  gradient: string,
  accent: string,
  text: string,
}

export const ORDER_THEMES: OrderTheme[] = [
  { id: 'emerald', label: 'اخضر', gradient: 'linear-gradient(135deg, #34d399, #059669)', accent: '#059669', text: '#ffffff' },
  { id: 'ocean', label: 'ازرق', gradient: 'linear-gradient(135deg, #38bdf8, #2563eb)', accent: '#2563eb', text: '#ffffff' },
  { id: 'sunset', label: 'برتقالي', gradient: 'linear-gradient(135deg, #fb923c, #ea580c)', accent: '#ea580c', text: '#ffffff' },
  { id: 'rose', label: 'وردي', gradient: 'linear-gradient(135deg, #fb7185, #e11d48)', accent: '#e11d48', text: '#ffffff' },
  { id: 'violet', label: 'بنفسجي', gradient: 'linear-gradient(135deg, #a78bfa, #7c3aed)', accent: '#7c3aed', text: '#ffffff' },
  { id: 'amber', label: 'ذهبي', gradient: 'linear-gradient(135deg, #fbbf24, #d97706)', accent: '#d97706', text: '#ffffff' },
  { id: 'slate', label: 'رمادي', gradient: 'linear-gradient(135deg, #94a3b8, #475569)', accent: '#475569', text: '#ffffff' },
  { id: 'ink', label: 'اسود', gradient: 'linear-gradient(135deg, #4b5563, #111827)', accent: '#111827', text: '#ffffff' },
];

export const DEFAULT_ORDER_THEME = ORDER_THEMES[0];

export const getOrderTheme = (themeId?: string): OrderTheme => {
  return ORDER_THEMES.find(theme => theme.id === themeId) || DEFAULT_ORDER_THEME;
}
