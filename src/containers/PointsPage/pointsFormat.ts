// Shared by the points page and the home card. 100 points = $1.
export const pointsText = (n: number) => Math.round(n || 0).toLocaleString('en-US');
export const usdText = (points: number) => `$${((points || 0) / 100).toFixed(2)}`;
