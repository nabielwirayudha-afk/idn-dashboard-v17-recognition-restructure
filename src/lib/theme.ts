export const CHART_COLORS = [
  '#ED2127', // brand red (primary)
  '#5B7FDE', // soft blue (reference accent)
  '#8B7FE8', // soft purple (reference accent)
  '#2B2D42', // navy
  '#F4A261', // warm amber (complement)
  '#4A7C8C', // muted teal (complement)
  '#C77D92', // dusty rose (complement)
  '#8D99AF', // slate
];

export function colorAt(i: number): string {
  return CHART_COLORS[i % CHART_COLORS.length];
}

export function formatNumber(n: number): string {
  return new Intl.NumberFormat('en-US').format(Math.round(n * 10) / 10);
}

export function formatHours(n: number): string {
  return `${formatNumber(n)}h`;
}

export function formatPct(n: number): string {
  const sign = n > 0 ? '+' : '';
  return `${sign}${n}%`;
}
