import { useMemo, useState } from 'react';
import { PartyPopper, GraduationCap, Heart, Trophy, Zap } from 'lucide-react';
import { useData } from '@/context/DataContext';
import { PageHeader } from '@/components/ui/unified-components';
import TotmDeptModal from '@/components/ui/TotmDeptModal';
import { computeDynamicTrend } from '@/lib/dynamicTrend';
import { uniqueAgg } from '@/lib/rollingWindow';
import { filterKudosReceivedNoTime } from '@/lib/filters';
import { activeHeadcountForFilters } from '@/lib/headcount';
import type { DynamicTrendResult } from '@/lib/dynamicTrend';

type TrendDirection = 'up' | 'down' | 'stable';

function getDelta(trend: DynamicTrendResult, labelMatch: string): number | null {
  const comp = trend.comparisons.find((c) => c.label.toLowerCase().includes(labelMatch.toLowerCase()));
  if (!comp || comp.deltaPct === null || comp.deltaPct === undefined) return null;
  return comp.deltaPct;
}

function classifyDelta(delta: number | null): { pct: number | null; direction: TrendDirection } {
  if (delta === null || delta === undefined || Number.isNaN(delta)) {
    return { pct: null, direction: 'stable' };
  }
  const direction: TrendDirection = delta > 1 ? 'up' : delta < -1 ? 'down' : 'stable';
  return { pct: Math.round(delta * 10) / 10, direction };
}

interface KpiInsight {
  label: string;
  current: number;
  prevQ: { pct: number | null; direction: TrendDirection };
  prevYear: { pct: number | null; direction: TrendDirection };
  description: string;
}

function buildInsight(
  name: string,
  current: number,
  trend: DynamicTrendResult,
  upText: string,
  downText: string,
  stableText: string
): KpiInsight {
  const prevQ = classifyDelta(getDelta(trend, 'Prev Q'));
  const prevYear = classifyDelta(getDelta(trend, 'Prev Year'));

  let description = '';
  const qDir = prevQ.direction;
  const yDir = prevYear.direction;

  if (qDir === 'down' || yDir === 'down') {
    description = downText;
  } else if (qDir === 'up' || yDir === 'up') {
    description = upText;
  } else {
    description = stableText;
  }

  return { label: name, current, prevQ, prevYear, description };
}

function buildNextAction(insights: KpiInsight[]): string {
  const scored = insights.map((ins) => {
    let score = 0;
    const qPct = ins.prevQ.pct ?? 0;
    const yPct = ins.prevYear.pct ?? 0;

    if (ins.prevQ.direction === 'down' && qPct < -10) score += 40;
    else if (ins.prevQ.direction === 'down') score += 30;
    else if (ins.prevQ.direction === 'stable') score += 10;

    if (ins.prevYear.direction === 'down' && yPct < -10) score += 20;
    else if (ins.prevYear.direction === 'down') score += 15;

    return { ...ins, score };
  });

  scored.sort((a, b) => b.score - a.score);
  const focus = scored[0];

  if (!focus || focus.score === 0) {
    return 'Maintain positive momentum across all engagement pillars. Prioritize outreach to non-participating employees through targeted communications and department-led initiatives.';
  }

  const name = focus.label;

  if (focus.prevQ.direction === 'down' || focus.prevYear.direction === 'down') {
    return `Investigate the decline in ${name} through department-level segmentation analysis. Develop targeted intervention strategies to re-engage underperforming segments.`;
  }

  if (focus.prevQ.direction === 'stable' && focus.prevYear.direction === 'stable') {
    return `Sustain current ${name} performance while identifying expansion opportunities. Focus on converting non-participants through awareness campaigns and manager-led encouragement.`;
  }

  return `Leverage positive momentum in ${name} to scale successful activities. Use high-performing departments as benchmarks to drive participation among inactive employee segments.`;
}

/* ─── Trend Badge ─── */
function TrendBadge({ deltaPct }: { deltaPct: number | null | undefined }) {
  if (deltaPct === null || deltaPct === undefined || Number.isNaN(deltaPct)) {
    return <span className="text-xs text-white/30 ml-1">—</span>;
  }
  const direction = deltaPct > 1 ? 'up' : deltaPct < -1 ? 'down' : 'stable';
  const arrow = direction === 'up' ? '↑' : direction === 'down' ? '↓' : '→';
  const color = direction === 'up' ? 'text-emerald-400' : direction === 'down' ? 'text-rose-400' : 'text-amber-400';
  const pct = Math.round(deltaPct * 10) / 10;
  return (
    <span className={`text-xs font-bold ${color} ml-1`}>
      {arrow} {Math.abs(pct)}%
    </span>
  );
}

/* ─── Unified Card Shell ─── */
function KpiCard({
  children,
  className = '',
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div
      className={[
        'flex-1 min-w-0',
        'bg-gray-950/60 backdrop-blur-sm',
        'rounded-2xl',
        'border border-white/10',
        'p-6 sm:p-8',
        'flex flex-col items-center',
        'transition-all duration-200 hover:scale-[1.02] hover:bg-gray-950/70',
        className,
      ].join(' ')}
    >
      {children}
    </div>
  );
}

/* ─── Participation Card ─── */
function ParticipationCard({
  label,
  value,
  percentForFill,
  icon,
  comparisons,
}: {
  label: string;
  value: number;
  percentForFill: number;
  icon: React.ReactNode;
  comparisons: DynamicTrendResult['comparisons'];
}) {
  const prevQ = classifyDelta(getDelta({ comparisons } as DynamicTrendResult, 'Prev Q'));
  const prevYear = classifyDelta(getDelta({ comparisons } as DynamicTrendResult, 'Prev Year'));

  return (
    <KpiCard>
      {/* Icon */}
      <div className="flex items-center justify-center w-12 h-12 rounded-full bg-[#ED2127]/10 text-[#ED2127] mb-5">
        {icon}
      </div>

      {/* Label */}
      <div className="h-6 flex items-center justify-center mb-5">
        <span className="text-xs font-bold uppercase tracking-[0.15em] text-white/80">
          {label}
        </span>
      </div>

      {/* Big number */}
      <div className="h-16 flex items-center justify-center mb-2">
        <span className="text-5xl sm:text-6xl font-extrabold text-white tracking-tight">{value}</span>
      </div>

      {/* Red horizontal line */}
      <div className="w-full max-w-[140px] mb-2">
        <div className="h-1.5 w-full bg-white/10 rounded-full overflow-hidden">
          <div
            className="h-full bg-[#ED2127] rounded-full"
            style={{ width: `${Math.max(0, Math.min(100, percentForFill))}%` }}
          />
        </div>
      </div>

      {/* Percentage */}
      <div className="h-6 flex items-center justify-center mb-0.5">
        <span className="text-base font-bold text-[#ED2127]">{percentForFill}%</span>
      </div>

      {/* Subtitle */}
      <div className="h-5 flex items-start justify-center mb-5">
        <span className="text-xs text-white/50">of Active Employees</span>
      </div>

      {/* Trend badges — always present */}
      <div className="h-5 flex items-center justify-center gap-5">
        <div className="flex items-center text-xs text-white/50">
          <span className="font-semibold">Q</span>
          <TrendBadge deltaPct={prevQ.pct} />
        </div>
        <div className="flex items-center text-xs text-white/50">
          <span className="font-semibold">Y</span>
          <TrendBadge deltaPct={prevYear.pct} />
        </div>
      </div>
    </KpiCard>
  );
}

/* ─── Recognition Card ─── */
function RecognitionCard({
  label,
  value,
  icon,
  caption,
  comparisons,
}: {
  label: string;
  value: number;
  icon: React.ReactNode;
  caption?: string;
  comparisons?: DynamicTrendResult['comparisons'];
}) {
  const prevQ = comparisons ? classifyDelta(getDelta({ comparisons } as DynamicTrendResult, 'Prev Q')) : null;
  const prevYear = comparisons ? classifyDelta(getDelta({ comparisons } as DynamicTrendResult, 'Prev Year')) : null;

  return (
    <KpiCard>
      {/* Icon */}
      <div className="flex items-center justify-center w-12 h-12 rounded-full bg-white/10 text-white/70 mb-5">
        {icon}
      </div>

      {/* Label */}
      <div className="h-6 flex items-center justify-center mb-5">
        <span className="text-xs font-bold uppercase tracking-[0.15em] text-white/80">
          {label}
        </span>
      </div>

      {/* Big number */}
      <div className="h-16 flex items-center justify-center mb-2">
        <span className="text-5xl sm:text-6xl font-extrabold text-white tracking-tight">{value}</span>
      </div>

      {/* Spacer (same height as red line + percentage + subtitle in ParticipationCard) */}
      <div className="w-full max-w-[140px] mb-2">
        <div className="h-1.5 w-full rounded-full" />
      </div>
      <div className="h-6 flex items-center justify-center mb-0.5">
        <span className="invisible text-base font-bold">0%</span>
      </div>
      <div className="h-5 flex items-start justify-center mb-5">
        {caption ? (
          <span className="text-xs text-white/50">{caption}</span>
        ) : (
          <span className="invisible text-xs">placeholder</span>
        )}
      </div>

      {/* Trend badges — always present */}
      <div className="h-5 flex items-center justify-center gap-5">
        <div className="flex items-center text-xs text-white/50">
          <span className="font-semibold">Q</span>
          <TrendBadge deltaPct={prevQ?.pct} />
        </div>
        <div className="flex items-center text-xs text-white/50">
          <span className="font-semibold">Y</span>
          <TrendBadge deltaPct={prevYear?.pct} />
        </div>
      </div>
    </KpiCard>
  );
}

/* ─── Main Page ─── */
export default function Overview() {
  const { filtered, filteredNoTime, filters, raw } = useData();
  const [showTotmModal, setShowTotmModal] = useState(false);

  const totalActiveEmployees = activeHeadcountForFilters(filtered, filters);
  const pct = (n: number) =>
    totalActiveEmployees > 0 ? Math.min(100, Math.round((n / totalActiveEmployees) * 1000) / 10) : 0;

  const clubTrend = useMemo(
    () =>
      computeDynamicTrend(
        filteredNoTime.club,
        { yearFn: (r) => r.year, monthFn: (r) => r.month, quarterFn: (r) => r.quarter },
        uniqueAgg((r: (typeof filteredNoTime.club)[number]) => r.email),
        filters
      ),
    [filteredNoTime.club, filters]
  );

  const academyCombined = useMemo(
    () => [
      ...filteredNoTime.inClass.map((r) => ({
        email: r.email,
        year: r.year,
        month: r.month,
        quarter: r.quarter,
      })),
      ...filteredNoTime.internship.map((r) => ({
        email: r.email,
        year: r.year,
        month: r.month,
        quarter: r.quarter,
      })),
    ],
    [filteredNoTime.inClass, filteredNoTime.internship]
  );
  const academyTrend = useMemo(
    () =>
      computeDynamicTrend(
        academyCombined,
        { yearFn: (r) => r.year, monthFn: (r) => r.month, quarterFn: (r) => r.quarter },
        uniqueAgg((r) => r.email),
        filters
      ),
    [academyCombined, filters]
  );

  const kudosReceivedApprovedNoTime = useMemo(
    () => filterKudosReceivedNoTime(raw.kudos, filters).filter((r) => r.workflowStatus === 'APPROVED'),
    [raw.kudos, filters]
  );
  const kudosTrend = useMemo(
    () =>
      computeDynamicTrend(
        kudosReceivedApprovedNoTime,
        { yearFn: (r) => r.year, monthFn: (r) => r.month, quarterFn: (r) => r.quarter },
        (rows) => rows.length,
        filters
      ),
    [kudosReceivedApprovedNoTime, filters]
  );

  const totmTotal = filtered.timmyOfTheMonth.length;

  const clubPct = pct(clubTrend.current);
  const academyPct = pct(academyTrend.current);

  const kpiInsights = useMemo(() => {
    const club = buildInsight(
      'IDN Club',
      clubTrend.current,
      clubTrend,
      'IDN Club participation is trending upward, reflecting stronger employee engagement and community involvement across the organization.',
      'IDN Club participation has declined. Recommend analyzing department-level data and employee feedback to identify root causes and design targeted re-engagement initiatives.',
      'IDN Club participation remains stable, indicating sustained employee engagement. Consider exploring opportunities to expand reach to non-participating employees.'
    );

    const academy = buildInsight(
      'IDN Academy',
      academyTrend.current,
      academyTrend,
      'IDN Academy participation is on the rise, signaling growing employee interest in upskilling and professional development opportunities.',
      'IDN Academy participation has declined. Suggest reviewing course relevance, scheduling conflicts, and departmental barriers to re-ignite learning engagement.',
      'IDN Academy participation holds steady, reflecting consistent commitment to employee development. Opportunity exists to introduce new learning formats or topics to boost engagement further.'
    );

    const kudos = buildInsight(
      'IDN Kudos',
      kudosTrend.current,
      kudosTrend,
      'IDN Kudos activity is increasing, indicating a strengthening culture of peer recognition and appreciation across teams.',
      'IDN Kudos activity has declined. Recommend investigating potential barriers to recognition behavior and reinforcing the value of peer appreciation through internal communications.',
      'IDN Kudos activity remains consistent, reflecting a stable recognition culture. Consider campaigns or leaderboards to encourage broader participation across departments.'
    );

    return [club, academy, kudos];
  }, [clubTrend, academyTrend, kudosTrend]);

  const nextAction = useMemo(() => buildNextAction(kpiInsights), [kpiInsights]);

  const insights = useMemo(() => {
    const items = kpiInsights.map((kpi) => ({
      label: kpi.label,
      text: kpi.description,
    }));
    items.push({ label: 'Next Action', text: nextAction });
    return items;
  }, [kpiInsights, nextAction]);

  return (
    <div className="page-container" style={{ fontFamily: "'Poppins', sans-serif" }}>
      <PageHeader
        title="Overview"
        subtitle="A consolidated overview of participation, learning, and recognition through IDN Club, IDN Academy, IDN Kudos, and Timmy of the Month."
      />

      {/* ═══════════════════════════════════════
          ROW 1: Participation + Recognition
          ═══════════════════════════════════════ */}
      <div className="flex flex-col lg:flex-row gap-5 items-stretch">
        {/* ── Participation ── */}
        <div
          className="flex-1 rounded-3xl border border-white/10 p-6 sm:p-7 min-w-0 flex flex-col relative overflow-hidden shadow-2xl"
          style={{
            backgroundImage: 'url(/bg-overview.jpg)',
            backgroundSize: 'cover',
            backgroundPosition: 'center',
          }}
        >
          <div className="absolute inset-0 bg-black/20 pointer-events-none" />

          <h3 className="relative z-10 text-sm font-bold uppercase tracking-[0.2em] text-white/90 mb-6 text-center">
            Participation
          </h3>

          <div className="relative z-10 flex-1 flex flex-col sm:flex-row gap-4 items-stretch">
            <ParticipationCard
              label="IDN Club"
              value={clubTrend.current}
              percentForFill={clubPct}
              icon={<PartyPopper size={20} />}
              comparisons={clubTrend.comparisons}
            />
            <ParticipationCard
              label="IDN Academy"
              value={academyTrend.current}
              percentForFill={academyPct}
              icon={<GraduationCap size={20} />}
              comparisons={academyTrend.comparisons}
            />
          </div>
        </div>

        {/* ── Recognition ── */}
        <div
          className="flex-1 rounded-3xl border border-white/10 p-6 sm:p-7 min-w-0 flex flex-col relative overflow-hidden shadow-2xl"
          style={{
            backgroundImage: 'url(/bg-overview.jpg)',
            backgroundSize: 'cover',
            backgroundPosition: 'center',
          }}
        >
          <div className="absolute inset-0 bg-black/20 pointer-events-none" />

          <h3 className="relative z-10 text-sm font-bold uppercase tracking-[0.2em] text-white/90 mb-6 text-center">
            Recognition
          </h3>

          <div className="relative z-10 flex-1 flex flex-col sm:flex-row gap-4 items-stretch">
            <RecognitionCard
              label="IDN Kudos Received"
              value={kudosTrend.current}
              icon={<Heart size={20} />}
              caption="Approved Only"
              comparisons={kudosTrend.comparisons}
            />
            <RecognitionCard
              label="Timmy of the Month"
              value={totmTotal}
              icon={<Trophy size={20} />}
            />
          </div>
        </div>
      </div>

      {/* ═══════════════════════════════════════
          ROW 2: Key Insight
          ═══════════════════════════════════════ */}
      <div className="rounded-2xl border border-[#E0C4B8]/60 bg-[#FDF8F5] p-6 sm:p-7 shadow-sm">
        <div className="flex items-center gap-2.5 mb-5">
          <Zap size={18} className="text-[#ED2127]" fill="#ED2127" />
          <span className="text-base font-bold text-gray-900 tracking-tight">Key Insight</span>
        </div>
        <ul className="space-y-3">
          {insights.map((insight) => (
            <li key={insight.label} className="flex items-start gap-3">
              <span className="mt-2 w-1.5 h-1.5 rounded-full bg-[#ED2127] shrink-0" />
              <div>
                <span className="text-sm font-semibold text-gray-900">{insight.label}: </span>
                <span className="text-sm text-gray-600 leading-relaxed">{insight.text}</span>
              </div>
            </li>
          ))}
        </ul>
      </div>

      {showTotmModal && (
        <TotmDeptModal
          dept={filters.department === 'All' ? 'All Departments' : filters.department}
          rows={filtered.timmyOfTheMonth}
          onClose={() => setShowTotmModal(false)}
        />
      )}
    </div>
  );
}
