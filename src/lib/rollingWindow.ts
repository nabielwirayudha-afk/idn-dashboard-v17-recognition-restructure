import { MONTH_LABELS } from './aggregate';
import type { GlobalFilters } from '@/types';

interface RollingWindowOptions<T> {
  yearFn: (r: T) => number;
  monthFn: (r: T) => number;
  aggFn: (rows: T[]) => number;
  filters: Pick<GlobalFilters, 'year' | 'month'>;
}

function periodKey(year: number, month: number): string {
  return `${year}-${String(month).padStart(2, '0')}`;
}

function shiftPeriod(year: number, month: number, delta: number): { year: number; month: number } {
  const zeroBased = (year * 12 + (month - 1)) + delta;
  return { year: Math.floor(zeroBased / 12), month: (((zeroBased % 12) + 12) % 12) + 1 };
}

/**
 * Builds an 11-month window of {label, value} points:
 *  - If a specific Month filter is active, that month sits in the CENTER,
 *    flanked by 5 months before and 5 after (11 total).
 *  - If the Month filter is 'All', the latest 11 months present in the data
 *    are shown.
 * Months with no matching rows still appear in the window with value 0, so
 * the window is always calendar-continuous.
 */
export function buildRollingWindow<T>(rows: T[], opts: RollingWindowOptions<T>): { label: string; value: number }[] {
  const { yearFn, monthFn, aggFn, filters } = opts;
  if (rows.length === 0) return [];

  const byPeriod = new Map<string, T[]>();
  let minKey = '';
  let maxKey = '';
  for (const r of rows) {
    const y = yearFn(r);
    const m = monthFn(r);
    if (!y || !m) continue;
    const key = periodKey(y, m);
    if (!byPeriod.has(key)) byPeriod.set(key, []);
    byPeriod.get(key)!.push(r);
    if (!minKey || key < minKey) minKey = key;
    if (!maxKey || key > maxKey) maxKey = key;
  }
  if (!minKey || !maxKey) return [];

  let centerYear: number;
  let centerMonth: number;

  if (filters.month !== 'All') {
    const monthNum = Number(filters.month);
    if (filters.year !== 'All') {
      centerYear = Number(filters.year);
      centerMonth = monthNum;
    } else {
      // Most recent occurrence of that month within the data range.
      const [maxY] = maxKey.split('-').map(Number);
      let found = false;
      for (let y = maxY; y >= maxY - 6 && !found; y--) {
        const key = periodKey(y, monthNum);
        if (byPeriod.has(key)) {
          centerYear = y;
          centerMonth = monthNum;
          found = true;
        }
      }
      if (!found) {
        const [defaultY] = maxKey.split('-').map(Number);
        centerYear = defaultY;
        centerMonth = monthNum;
      }
    }
  } else {
    const [y, m] = maxKey.split('-').map(Number);
    centerYear = y;
    centerMonth = m;
  }

  const isAllMode = filters.month === 'All';
  const points: { year: number; month: number }[] = [];
  if (isAllMode) {
    // Latest 11 months ending at (and including) the most recent data point.
    for (let i = 10; i >= 0; i--) points.push(shiftPeriod(centerYear!, centerMonth!, -i));
  } else {
    for (let i = -5; i <= 5; i++) points.push(shiftPeriod(centerYear!, centerMonth!, i));
  }

  return points.map(({ year, month }) => {
    const key = periodKey(year, month);
    const periodRows = byPeriod.get(key) || [];
    return {
      label: `${MONTH_LABELS[month - 1]} '${String(year).slice(2)}`,
      value: aggFn(periodRows),
    };
  });
}

/**
 * Builds the 12 calendar-month totals (Jan-Dec) for the Monthly Grid Cards.
 * If a specific Year filter is active, only that year's data is used;
 * otherwise every year is combined per calendar month.
 */
export function buildMonthlyGrid<T>(
  rows: T[],
  opts: { yearFn: (r: T) => number; monthFn: (r: T) => number; aggFn: (rows: T[]) => number; year: string }
): { month: string; value: number }[] {
  const { yearFn, monthFn, aggFn, year } = opts;
  const byMonth = new Map<number, T[]>();
  for (const r of rows) {
    const y = yearFn(r);
    const m = monthFn(r);
    if (!m) continue;
    if (year !== 'All' && String(y) !== year) continue;
    if (!byMonth.has(m)) byMonth.set(m, []);
    byMonth.get(m)!.push(r);
  }
  return Array.from({ length: 12 }, (_, i) => {
    const m = i + 1;
    return { month: MONTH_LABELS[i], value: aggFn(byMonth.get(m) || []) };
  });
}
export function uniqueAgg<T>(idFn: (r: T) => string) {
  return (rows: T[]) => new Set(rows.map(idFn).filter(Boolean)).size;
}

export function sumAgg<T>(valueFn: (r: T) => number) {
  return (rows: T[]) => rows.reduce((s, r) => s + valueFn(r), 0);
}

/**
 * Builds a fixed window of the latest N calendar months ending at the most
 * recent data point present in `rows` — unlike buildRollingWindow, this is
 * NOT re-centered by the Month filter. Used by IDN Club's "Participation
 * trend over time" per its "Latest 12 months" spec.
 */
export function buildLatestMonths<T>(
  rows: T[],
  opts: { yearFn: (r: T) => number; monthFn: (r: T) => number; aggFn: (rows: T[]) => number },
  count = 12
): { label: string; value: number }[] {
  const { yearFn, monthFn, aggFn } = opts;
  if (rows.length === 0) return [];

  const byPeriod = new Map<string, T[]>();
  let maxKey = '';
  for (const r of rows) {
    const y = yearFn(r);
    const m = monthFn(r);
    if (!y || !m) continue;
    const key = periodKey(y, m);
    if (!byPeriod.has(key)) byPeriod.set(key, []);
    byPeriod.get(key)!.push(r);
    if (!maxKey || key > maxKey) maxKey = key;
  }
  if (!maxKey) return [];

  const [endYear, endMonth] = maxKey.split('-').map(Number);
  const points: { year: number; month: number }[] = [];
  for (let i = count - 1; i >= 0; i--) points.push(shiftPeriod(endYear, endMonth, -i));

  return points.map(({ year, month }) => {
    const key = periodKey(year, month);
    const periodRows = byPeriod.get(key) || [];
    return { label: `${MONTH_LABELS[month - 1]} '${String(year).slice(2)}`, value: aggFn(periodRows) };
  });
}
