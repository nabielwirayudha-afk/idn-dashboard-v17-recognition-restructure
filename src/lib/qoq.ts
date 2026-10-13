import type { GlobalFilters } from '@/types';

function prevQuarter(year: number, quarter: number): { year: number; quarter: number } {
  return quarter === 1 ? { year: year - 1, quarter: 4 } : { year, quarter: quarter - 1 };
}

interface QoQOptions<T> {
  yearFn: (r: T) => number;
  quarterFn: (r: T) => number;
  aggFn: (rows: T[]) => number;
  // Logic Issue #1 fix: Month is now considered when resolving the target
  // quarter — previously only Year+Quarter were read, so picking a Month
  // filter left every Overview KPI frozen/unchanged.
  filters: Pick<GlobalFilters, 'year' | 'quarter' | 'month'>;
}

export interface QoQResult {
  current: number;
  previous: number;
  deltaPct: number | null;
}

/** Resolves which {year, quarter} to treat as "current", from whatever
 * combination of Year/Quarter/Month is selected:
 *   1. Month selected -> quarter is derived from it (Jan-Mar=Q1, ...).
 *      Year = the filter's Year if set, else the latest year in the data
 *      that actually has that quarter.
 *   2. Only Quarter selected -> Year = filter's Year if set, else latest
 *      year in the data that has that quarter.
 *   3. Only Year selected -> the latest quarter within that year present
 *      in the data.
 *   4. Nothing selected -> the latest {year, quarter} present in the data.
 */
function resolveTargetQuarter<T>(
  rows: T[],
  yearFn: (r: T) => number,
  quarterFn: (r: T) => number,
  filters: Pick<GlobalFilters, 'year' | 'quarter' | 'month'>
): { year: number; quarter: number } | null {
  const pairs = rows.map((r) => ({ year: yearFn(r), quarter: quarterFn(r) })).filter((p) => p.year && p.quarter);
  if (pairs.length === 0) return null;

  const latestOverall = pairs.reduce<{ key: number; year: number; quarter: number }>((acc, p) => {
    const key = p.year * 10 + p.quarter;
    return key > acc.key ? { key, year: p.year, quarter: p.quarter } : acc;
  }, { key: -1, year: 0, quarter: 0 });

  const derivedQuarter = filters.month !== 'All' ? Math.ceil(Number(filters.month) / 3) : null;
  const wantedQuarter = filters.quarter !== 'All' ? Number(filters.quarter) : derivedQuarter;

  if (filters.year !== 'All' && wantedQuarter !== null) {
    return { year: Number(filters.year), quarter: wantedQuarter };
  }

  if (wantedQuarter !== null) {
    // Year not pinned — use the latest year that actually has this quarter.
    const years = Array.from(new Set(pairs.map((p) => p.year))).sort((a, b) => b - a);
    for (const y of years) {
      if (pairs.some((p) => p.year === y && p.quarter === wantedQuarter)) return { year: y, quarter: wantedQuarter };
    }
    return { year: latestOverall.year, quarter: wantedQuarter };
  }

  if (filters.year !== 'All') {
    // Year pinned, no Quarter/Month — use the latest quarter within that year.
    const y = Number(filters.year);
    const quartersInYear = pairs.filter((p) => p.year === y).map((p) => p.quarter);
    if (quartersInYear.length > 0) return { year: y, quarter: Math.max(...quartersInYear) };
    return { year: y, quarter: 4 };
  }

  // Nothing selected — latest period in the data.
  return { year: latestOverall.year, quarter: latestOverall.quarter };
}

/** Compares the resolved target quarter (see resolveTargetQuarter above)
 * against the immediately preceding quarter. */
export function computeQoQ<T>(rows: T[], opts: QoQOptions<T>): QoQResult {
  const { yearFn, quarterFn, aggFn, filters } = opts;
  if (rows.length === 0) return { current: 0, previous: 0, deltaPct: null };

  const target = resolveTargetQuarter(rows, yearFn, quarterFn, filters);
  if (!target) return { current: 0, previous: 0, deltaPct: null };

  const prev = prevQuarter(target.year, target.quarter);
  const currentRows = rows.filter((r) => yearFn(r) === target.year && quarterFn(r) === target.quarter);
  const previousRows = rows.filter((r) => yearFn(r) === prev.year && quarterFn(r) === prev.quarter);

  const current = aggFn(currentRows);
  const previous = aggFn(previousRows);
  const deltaPct = previous === 0 ? (current === 0 ? 0 : 100) : Math.round(((current - previous) / previous) * 1000) / 10;

  return { current, previous, deltaPct };
}
