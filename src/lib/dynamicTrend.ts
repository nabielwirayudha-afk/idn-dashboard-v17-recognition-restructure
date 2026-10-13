import type { GlobalFilters } from '@/types';

export interface Comparison {
  label: 'vs Prev Q' | 'vs Prev Year' | 'vs Contextual Quarter';
  deltaPct: number | null;
  deltaAbs: number | null;
  baseValue: number | null;
}

export interface DynamicTrendResult {
  current: number;
  comparisons: Comparison[];
}

function pctChange(current: number, base: number): number | null {
  if (base === 0) return current === 0 ? 0 : 100;
  return Math.round(((current - base) / base) * 1000) / 10;
}

function makeComparison(label: Comparison['label'], current: number, base: number | null): Comparison {
  if (base === null) return { label, deltaPct: null, deltaAbs: null, baseValue: null };
  return { label, deltaPct: pctChange(current, base), deltaAbs: current - base, baseValue: base };
}

/**
 * Implements the "Dynamic Comparison Logic" table from the v2.0 Overview
 * spec — which trend indicator(s) to show depends on the level of the Year/
 * Quarter/Month filter hierarchy the person has selected:
 *
 *   - All (nothing selected)  -> no comparison at all (hidden).
 *   - Year only               -> vs Prev Year (this year's total vs last year's).
 *   - Quarter (+ optional Year) -> vs Prev Q AND vs Prev Year (same quarter last year).
 *   - Month (+ optional Year) -> vs Contextual Quarter: this month vs the
 *     average of the OTHER months with data in the same quarter, i.e. is
 *     this month pacing above or below its quarter's typical month.
 *
 * `rows` must already be Department/Location (+ Active-only) filtered but
 * NOT Year/Quarter/Month filtered — same contract as the *NoTime filters.
 */
export function computeDynamicTrend<T>(
  rows: T[],
  fns: { yearFn: (r: T) => number; monthFn: (r: T) => number; quarterFn: (r: T) => number },
  aggFn: (rows: T[]) => number,
  filters: Pick<GlobalFilters, 'year' | 'quarter' | 'month'>
): DynamicTrendResult {
  const { yearFn, monthFn, quarterFn } = fns;
  const hasYear = filters.year !== 'All';
  const hasQuarter = filters.quarter !== 'All';
  const hasMonth = filters.month !== 'All';

  // MODE: ALL — no time filter at all. Show the all-time total, no trend.
  if (!hasYear && !hasQuarter && !hasMonth) {
    return { current: aggFn(rows), comparisons: [] };
  }

  const byYear = (y: number) => rows.filter((r) => yearFn(r) === y);
  const byYearQuarter = (y: number, q: number) => rows.filter((r) => yearFn(r) === y && quarterFn(r) === q);
  const byYearMonth = (y: number, m: number) => rows.filter((r) => yearFn(r) === y && monthFn(r) === m);

  const allYears = Array.from(new Set(rows.map(yearFn).filter((y) => y > 0))).sort((a, b) => b - a);
  const fallbackYear = allYears[0] ?? new Date().getFullYear();

  // MODE: MONTH -> vs Contextual Quarter
  if (hasMonth) {
    const targetMonth = Number(filters.month);
    const targetYear = hasYear
      ? Number(filters.year)
      : allYears.find((y) => rows.some((r) => yearFn(r) === y && monthFn(r) === targetMonth)) ?? fallbackYear;
    const targetQuarter = Math.ceil(targetMonth / 3);
    const current = aggFn(byYearMonth(targetYear, targetMonth));

    const otherMonthsInQuarter = [1, 2, 3].map((i) => (targetQuarter - 1) * 3 + i).filter((m) => m !== targetMonth);
    const otherValues = otherMonthsInQuarter
      .map((m) => byYearMonth(targetYear, m))
      .filter((rs) => rs.length > 0)
      .map((rs) => aggFn(rs));
    const otherAvg = otherValues.length > 0 ? otherValues.reduce((a, b) => a + b, 0) / otherValues.length : null;

    return { current, comparisons: [makeComparison('vs Contextual Quarter', current, otherAvg)] };
  }

  // MODE: QUARTER -> vs Prev Q + vs Prev Year (same quarter)
  if (hasQuarter) {
    const targetQuarter = Number(filters.quarter);
    const targetYear = hasYear
      ? Number(filters.year)
      : allYears.find((y) => rows.some((r) => yearFn(r) === y && quarterFn(r) === targetQuarter)) ?? fallbackYear;
    const current = aggFn(byYearQuarter(targetYear, targetQuarter));

    const prevQYear = targetQuarter === 1 ? targetYear - 1 : targetYear;
    const prevQQuarter = targetQuarter === 1 ? 4 : targetQuarter - 1;
    const prevQRows = byYearQuarter(prevQYear, prevQQuarter);
    const prevYearRows = byYearQuarter(targetYear - 1, targetQuarter);

    return {
      current,
      comparisons: [
        makeComparison('vs Prev Q', current, prevQRows.length > 0 ? aggFn(prevQRows) : null),
        makeComparison('vs Prev Year', current, prevYearRows.length > 0 ? aggFn(prevYearRows) : null),
      ],
    };
  }

  // MODE: YEAR only -> vs Prev Year
  const targetYear = Number(filters.year);
  const current = aggFn(byYear(targetYear));
  const prevYearRows = byYear(targetYear - 1);

  return { current, comparisons: [makeComparison('vs Prev Year', current, prevYearRows.length > 0 ? aggFn(prevYearRows) : null)] };
}
