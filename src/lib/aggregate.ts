export const MONTH_LABELS = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];

export function groupCount<T>(rows: T[], keyFn: (r: T) => string): { name: string; value: number }[] {
  const m = new Map<string, number>();
  for (const r of rows) {
    const k = keyFn(r);
    m.set(k, (m.get(k) || 0) + 1);
  }
  return Array.from(m.entries())
    .map(([name, value]) => ({ name, value }))
    .sort((a, b) => b.value - a.value);
}

export function groupSum<T>(rows: T[], keyFn: (r: T) => string, valFn: (r: T) => number): { name: string; value: number }[] {
  const m = new Map<string, number>();
  for (const r of rows) {
    const k = keyFn(r);
    m.set(k, (m.get(k) || 0) + valFn(r));
  }
  return Array.from(m.entries())
    .map(([name, value]) => ({ name, value: Math.round(value * 10) / 10 }))
    .sort((a, b) => b.value - a.value);
}

export function monthlyTrend<T>(
  rows: T[],
  yearFn: (r: T) => number,
  monthFn: (r: T) => number,
  aggFn?: (rows: T[]) => number
): { month: string; value: number }[] {
  const m = new Map<string, T[]>();
  for (const r of rows) {
    const k = `${yearFn(r)}-${String(monthFn(r)).padStart(2, '0')}`;
    if (!m.has(k)) m.set(k, []);
    m.get(k)!.push(r);
  }
  return Array.from(m.entries())
    .sort(([a], [b]) => (a < b ? -1 : 1))
    .map(([k, items]) => {
      const [y, mo] = k.split('-');
      const label = `${MONTH_LABELS[Number(mo) - 1]} '${y.slice(2)}`;
      return { month: label, value: aggFn ? aggFn(items) : items.length };
    });
}

export function quarterlyTrend<T>(
  rows: T[],
  yearFn: (r: T) => number,
  quarterFn: (r: T) => number,
  aggFn?: (rows: T[]) => number
): { quarter: string; value: number }[] {
  const m = new Map<string, T[]>();
  for (const r of rows) {
    const k = `${yearFn(r)}-Q${quarterFn(r)}`;
    if (!m.has(k)) m.set(k, []);
    m.get(k)!.push(r);
  }
  return Array.from(m.entries())
    .sort(([a], [b]) => (a < b ? -1 : 1))
    .map(([k, items]) => ({ quarter: k, value: aggFn ? aggFn(items) : items.length }));
}

/** % change of the most recent period vs the one before it, from a trend series. */
export function trendDeltaPct(series: { value: number }[]): number | null {
  if (series.length < 2) return null;
  const curr = series[series.length - 1].value;
  const prev = series[series.length - 2].value;
  if (prev === 0) return curr === 0 ? 0 : 100;
  return Math.round(((curr - prev) / prev) * 1000) / 10;
}

export function topN<T>(
  rows: T[],
  keyFn: (r: T) => string,
  n: number,
  countFn?: (rows: T[]) => number
): { name: string; value: number }[] {
  const m = new Map<string, T[]>();
  for (const r of rows) {
    const k = keyFn(r);
    if (!m.has(k)) m.set(k, []);
    m.get(k)!.push(r);
  }
  return Array.from(m.entries())
    .map(([name, items]) => ({ name, value: countFn ? countFn(items) : items.length }))
    .sort((a, b) => b.value - a.value)
    .slice(0, n);
}

export function uniqueCountBy<T>(rows: T[], groupFn: (r: T) => string, idFn: (r: T) => string): Map<string, Set<string>> {
  const m = new Map<string, Set<string>>();
  for (const r of rows) {
    const g = groupFn(r);
    const id = idFn(r);
    if (!id) continue;
    if (!m.has(g)) m.set(g, new Set());
    m.get(g)!.add(id);
  }
  return m;
}

export function uniqueSetBy<T>(rows: T[], idFn: (r: T) => string): Set<string> {
  const s = new Set<string>();
  for (const r of rows) {
    const id = idFn(r);
    if (id) s.add(id);
  }
  return s;
}

export function uniqueEmails<T>(rows: T[], emailFn: (r: T) => string): number {
  return new Set(rows.map(emailFn).filter(Boolean)).size;
}
