// Per the v2.0 spec: Key Insight narrative must systematically combine
// vs Prev Q and vs Prev Year deltas (when both are available) to give both
// a short-term and long-term perspective. Gracefully degrades to a plain
// descriptive statement when no comparison is available (All-time mode).

import type { Comparison } from '@/lib/dynamicTrend';

const STABLE_BAND = 5;

export interface Insight {
  label: string;
  text: string;
}

interface MetricInput {
  value: number;
  comparisons: Comparison[];
}

function phraseFor(c: Comparison): string | null {
  if (c.deltaPct === null) return null;
  const verb = c.deltaPct > STABLE_BAND ? 'up' : c.deltaPct < -STABLE_BAND ? 'down' : 'flat';
  const context =
    c.label === 'vs Prev Q' ? 'the previous quarter' : c.label === 'vs Prev Year' ? 'the same period last year' : "this quarter's typical monthly pace";
  return `${verb} ${Math.abs(c.deltaPct)}% vs ${context}`;
}

/** Combines whichever comparisons are available into one clause, e.g.
 * "up 27.4% vs the previous quarter and up 12.1% vs the same period last
 * year" — giving both the short-term and long-term view when both exist. */
function combinedTrendClause(comparisons: Comparison[]): string | null {
  const phrases = comparisons.map(phraseFor).filter((p): p is string => p !== null);
  if (phrases.length === 0) return null;
  return phrases.join(', and ');
}

function primaryTrend(comparisons: Comparison[]): 'up' | 'down' | 'stable' | 'none' {
  const first = comparisons.find((c) => c.deltaPct !== null);
  if (!first || first.deltaPct === null) return 'none';
  if (first.deltaPct > STABLE_BAND) return 'up';
  if (first.deltaPct < -STABLE_BAND) return 'down';
  return 'stable';
}

interface InsightInputs {
  overallPct: number;
  club: MetricInput;
  academy: MetricInput;
  kudos: MetricInput; // received + approved count
  clubPct: number;
  academyPct: number;
  kudosPct: number;
}

export function generateKeyInsights(inputs: InsightInputs): Insight[] {
  const { overallPct, club, academy, kudos, clubPct, academyPct, kudosPct } = inputs;
  const insights: Insight[] = [];

  // 0. Overall participation rate for the currently selected period
  insights.push({
    label: 'Total Participation Rate',
    text: `Reached ${overallPct}% of all Active Employees during the selected period.`,
  });

  // 1. Club Participation
  {
    const clause = combinedTrendClause(club.comparisons);
    const trend = primaryTrend(club.comparisons);
    if (!clause) {
      insights.push({ label: 'Club Engagement', text: `Club participation reached ${club.value.toLocaleString('en-US')} across the full data range.` });
    } else if (trend === 'down') {
      insights.push({ label: 'Club Engagement', text: `Club participation is ${clause}.` });
    } else if (trend === 'up') {
      insights.push({ label: 'Club Engagement', text: `Club participation is ${clause}, reflecting stronger engagement.` });
    } else {
      insights.push({ label: 'Club Engagement', text: `Club participation remained relatively stable (${clause}).` });
    }
  }

  // 2. Learning Participation (Academy)
  {
    const clause = combinedTrendClause(academy.comparisons);
    const trend = primaryTrend(academy.comparisons);
    if (!clause) {
      insights.push({ label: 'Learning Adoption', text: `Learning participation reached ${academy.value.toLocaleString('en-US')} across the full data range.` });
    } else if (trend === 'down') {
      insights.push({ label: 'Learning Adoption', text: `Learning participation is ${clause}, indicating lower training engagement.` });
    } else if (trend === 'up') {
      insights.push({ label: 'Learning Adoption', text: `Learning participation is ${clause}, reflecting stronger adoption of learning programs.` });
    } else {
      insights.push({ label: 'Learning Adoption', text: `Learning participation remained consistent (${clause}), indicating steady training engagement.` });
    }
  }

  // 3. Recognition (Kudos Received, Approved)
  {
    const clause = combinedTrendClause(kudos.comparisons);
    const trend = primaryTrend(kudos.comparisons);
    if (!clause) {
      insights.push({ label: 'Recognition Trend', text: `IDN Kudos Received reached ${kudos.value.toLocaleString('en-US')} (Approved) across the full data range.` });
    } else if (trend === 'down') {
      insights.push({ label: 'Recognition Trend', text: `Recognition (Kudos Received) is ${clause}.` });
    } else if (trend === 'up') {
      insights.push({ label: 'Recognition Trend', text: `Recognition (Kudos Received) is ${clause}.` });
    } else {
      insights.push({ label: 'Recognition Trend', text: `Recognition (Kudos Received) remained steady (${clause}).` });
    }
  }

  // 3b. Highest / Lowest metric callout for Kudos
  const maxPct = Math.max(clubPct, academyPct, kudosPct);
  const minPct = Math.min(clubPct, academyPct, kudosPct);
  if (kudosPct === maxPct && maxPct > minPct) {
    insights.push({ label: 'Recognition Highlight', text: 'Recognition remains the strongest engagement channel.' });
  } else if (kudosPct === minPct && maxPct > minPct) {
    insights.push({ label: 'Recognition Highlight', text: 'Recognition activity may require additional encouragement.' });
  }

  // 4. Overall concluding insight — worst-performing / largest-decline metric
  const trendScore = (m: MetricInput) => {
    const first = m.comparisons.find((c) => c.deltaPct !== null);
    return first?.deltaPct ?? 0;
  };
  const anyComparisonsAvailable = [club, academy, kudos].some((m) => m.comparisons.length > 0);

  if (!anyComparisonsAvailable) {
    insights.push({ label: 'Priority Focus', text: 'Select a Year, Quarter, or Month filter to see trend-based prioritization.' });
  } else {
    const deltas = [
      { key: 'club', value: trendScore(club) },
      { key: 'academy', value: trendScore(academy) },
      { key: 'kudos', value: trendScore(kudos) },
    ];
    const worst = deltas.reduce((a, b) => (b.value < a.value ? b : a));

    if (worst.value >= 0) {
      insights.push({ label: 'Priority Focus', text: 'Overall employee engagement improved across key participation metrics.' });
    } else if (worst.key === 'academy') {
      insights.push({ label: 'Priority Focus', text: 'Learning participation requires additional attention.' });
    } else if (worst.key === 'club') {
      insights.push({ label: 'Priority Focus', text: 'Club engagement should become a priority for improvement.' });
    } else {
      insights.push({ label: 'Priority Focus', text: 'Recognition initiatives should be strengthened to encourage employee appreciation.' });
    }
  }

  return insights;
}
