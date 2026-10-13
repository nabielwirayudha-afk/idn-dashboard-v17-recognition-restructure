import type { Dataset, DeptHeadcount, GlobalFilters } from '@/types';

const QUARTER_LAST_MONTH: Record<string, number> = { '1': 3, '2': 6, '3': 9, '4': 12 };

/**
 * Resolves which {year, month} snapshot to read for a *single* point-in-time.
 * Used when Year, Year+Quarter, Year+Month, or nothing is selected.
 */
function resolvePeriod(
  list: DeptHeadcount[],
  filters: Pick<GlobalFilters, 'year' | 'quarter' | 'month'>
): { year: number; month: number } | null {
  const withTime = list.filter((r) => r.year !== null);
  if (withTime.length === 0) return null;

  const availableYears = new Set(withTime.map((r) => r.year as number));
  const latest = withTime.reduce(
    (acc, r) => {
      const key = (r.year as number) * 100 + (r.month ?? 0);
      return key > acc.key ? { key, year: r.year as number, month: r.month ?? 0 } : acc;
    },
    { key: -1, year: 0, month: 0 }
  );

  // 1. Month selected (with optional Year)
  if (filters.month !== 'All') {
    const month = Number(filters.month);
    if (filters.year !== 'All') return { year: Number(filters.year), month };
    const candidateYears = Array.from(availableYears).sort((a, b) => b - a);
    for (const y of candidateYears) {
      if (withTime.some((r) => r.year === y && r.month === month)) return { year: y, month };
    }
    return { year: latest.year, month };
  }

  // 2. Only Quarter selected (NO year) → handled by average logic, not here
  // 3. Only Quarter + Year selected
  if (filters.quarter !== 'All') {
    const month = QUARTER_LAST_MONTH[filters.quarter] ?? 12;
    const year = filters.year !== 'All' ? Number(filters.year) : latest.year;
    return { year, month };
  }

  // 4. Only Year selected → December of that year
  if (filters.year !== 'All') {
    return { year: Number(filters.year), month: 12 };
  }

  // 5. Nothing selected → latest period in the sheet
  return { year: latest.year, month: latest.month };
}

/** Returns true when the filter combo resolves to a single snapshot (not an average). */
function isSinglePeriod(filters: Pick<GlobalFilters, 'year' | 'quarter' | 'month'>): boolean {
  const hasYear = filters.year !== 'All';
  const hasQuarter = filters.quarter !== 'All';
  const hasMonth = filters.month !== 'All';

  // Quarter-only or Month-only → average across years
  if (!hasYear && hasQuarter && !hasMonth) return false;
  if (!hasYear && !hasQuarter && hasMonth) return false;
  return true;
}

/** Average headcount per department for Quarter-only or Month-only filters. */
function averageHeadcountMap(
  list: DeptHeadcount[],
  filters: Pick<GlobalFilters, 'quarter' | 'month'>
): Map<string, number> {
  const m = new Map<string, number>();
  const hasQuarter = filters.quarter !== 'All';
  const hasMonth = filters.month !== 'All';

  let targetMonth: number;
  if (hasQuarter) {
    targetMonth = QUARTER_LAST_MONTH[filters.quarter] ?? 12;
  } else if (hasMonth) {
    targetMonth = Number(filters.month);
  } else {
    return m;
  }

  const withTime = list.filter((r) => r.year !== null && r.month !== null);
  const years = Array.from(new Set(withTime.map((r) => r.year as number))).sort();
  if (years.length === 0) return m;

  const sumMap = new Map<string, number>();
  const countMap = new Map<string, number>();

  years.forEach((y) => {
    list
      .filter((r) => r.year === y && r.month === targetMonth)
      .forEach((r) => {
        sumMap.set(r.department, (sumMap.get(r.department) || 0) + r.activeCount);
        countMap.set(r.department, (countMap.get(r.department) || 0) + 1);
      });
  });

  sumMap.forEach((sum, dept) => {
    const count = countMap.get(dept) || years.length;
    m.set(dept, Math.round(sum / count));
  });

  return m;
}

/**
 * Department → Active Employee count for the resolved period.
 * Falls back to summing all rows if the sheet has no time dimension.
 *
 * NEW: Quarter-only → average of that quarter-end month across all years.
 * NEW: Month-only  → average of that month across all years.
 */
export function deptHeadcountMap(
  dataset: Dataset,
  filters: Pick<GlobalFilters, 'year' | 'quarter' | 'month'>
): Map<string, number> {
  const m = new Map<string, number>();

  // Average mode: Quarter-only or Month-only (no Year pinned)
  if (!isSinglePeriod(filters)) {
    const avgMap = averageHeadcountMap(dataset.deptHeadcount, filters);
    if (avgMap.size > 0) return avgMap;
    // Fallback to flat snapshot if no time data
    dataset.deptHeadcount.forEach((d) => m.set(d.department, (m.get(d.department) || 0) + d.activeCount));
    return m;
  }

  // Single-period mode: Year, Year+Q, Year+M, Year+Q+M, or All-time latest
  const period = resolvePeriod(dataset.deptHeadcount, filters);
  const rows = period
    ? dataset.deptHeadcount.filter((r) => r.year === period.year && r.month === period.month)
    : dataset.deptHeadcount;

  rows.forEach((d) => m.set(d.department, (m.get(d.department) || 0) + d.activeCount));
  return m;
}

/** Total Active Employee denominator — sourced from 'Total Employee per Dept',
 *  respecting the time-filter rules above. */
export function activeHeadcountForFilters(dataset: Dataset, filters: GlobalFilters): number {
  const map = deptHeadcountMap(dataset, filters);
  if (filters.department !== 'All') {
    return map.get(filters.department) || 0;
  }
  let total = 0;
  map.forEach((v) => (total += v));
  return total;
}
