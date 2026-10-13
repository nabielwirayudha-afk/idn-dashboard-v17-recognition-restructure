import { useMemo, useState } from 'react';
import { Users2, UserCheck, Percent, CalendarDays } from 'lucide-react';
import { useData } from '@/context/DataContext';
import { PageHeader, ChartCard } from '@/components/ui/unified-components';
import { computeDynamicTrend } from '@/lib/dynamicTrend';
import { uniqueAgg } from '@/lib/rollingWindow';
import type { DynamicTrendResult } from '@/lib/dynamicTrend';
import DepartmentRankTable from '@/components/ui/DepartmentRankTable';
import PodiumLeaderboard from '@/components/ui/PodiumLeaderboard';
import ClubGrid from '@/components/ui/ClubGrid';
import type { ClubMetricRow } from '@/components/ui/ClubGrid';
import { activeHeadcountForFilters, deptHeadcountMap } from '@/lib/headcount';
import { ResponsiveContainer, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, LabelList } from 'recharts';

const RETIRED_CLUBS = new Set(['idn hiking']);

const axisTick = { fontSize: 11, fill: 'var(--color-text-secondary)' };
const tooltipStyle = {
  background: 'var(--color-surface)',
  border: '1px solid var(--color-border-subtle)',
  borderRadius: 12,
  fontSize: 12,
  color: 'var(--color-text-primary)',
};

const MONTH_NAMES = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];

/* ─── Unified Inner Card Shell (same as Overview) ─── */
function InnerCard({ children, className = '' }: { children: React.ReactNode; className?: string }) {
  return (
    <div
      className={[
        'flex-1 min-w-0',
        'bg-gray-950/70 backdrop-blur-md',
        'rounded-2xl',
        'shadow-2xl shadow-black/40',
        'border border-white/5',
        'p-5',
        'flex flex-col items-center justify-center',
        'transition-transform duration-200 hover:scale-[1.01]',
        className,
      ].join(' ')}
    >
      {children}
    </div>
  );
}

/* ─── Trend Badge (exact same logic as Overview) ─── */
function TrendBadge({ deltaPct }: { deltaPct: number | null | undefined }) {
  if (deltaPct === null || deltaPct === undefined || Number.isNaN(deltaPct)) {
    return <span className="text-[10px] text-white/30 ml-1">—</span>;
  }
  const direction = deltaPct > 1 ? 'up' : deltaPct < -1 ? 'down' : 'stable';
  const arrow = direction === 'up' ? '↑' : direction === 'down' ? '↓' : '→';
  const color = direction === 'up' ? 'text-emerald-400' : direction === 'down' ? 'text-rose-400' : 'text-amber-400';
  const pct = Math.round(deltaPct * 10) / 10;
  return (
    <span className={`text-[10px] font-bold ${color} ml-1`}>
      {arrow} {Math.abs(pct)}%
    </span>
  );
}

/* ─── KPI Card (scalar, no pie) ─── */
function KpiInnerCard({
  label,
  value,
  icon,
  comparisons,
}: {
  label: string;
  value: string;
  icon: React.ReactNode;
  comparisons?: DynamicTrendResult['comparisons'];
}) {
  const qComp = comparisons?.find((c) => c.label === 'vs Prev Q');
  const yComp = comparisons?.find((c) => c.label === 'vs Prev Year');

  return (
    <InnerCard className="!p-6">
      <div className="flex flex-col items-center w-full h-full justify-center">
        {/* Icon */}
        <div className="h-6 flex items-center justify-center mb-3 text-white/70">
          {icon}
        </div>

        {/* Label */}
        <div className="h-10 flex items-center justify-center text-center mb-4">
          <span className="text-[11px] font-bold uppercase tracking-widest text-white/80 leading-tight">
            {label}
          </span>
        </div>

        {/* Big number */}
        <div className="h-14 flex items-center justify-center">
          <span className="text-4xl sm:text-5xl font-extrabold text-white tracking-tight">{value}</span>
        </div>

        {/* Trend badges — only when comparisons provided (Participation Percentage) */}
        {comparisons && comparisons.length > 0 ? (
          <div className="h-5 flex items-center justify-center gap-3 mt-2">
            <div className="flex items-center text-[10px] text-white/60">
              <span className="font-semibold">Q</span>
              <TrendBadge deltaPct={qComp?.deltaPct} />
            </div>
            <div className="flex items-center text-[10px] text-white/60">
              <span className="font-semibold">Y</span>
              <TrendBadge deltaPct={yComp?.deltaPct} />
            </div>
          </div>
        ) : (
          <div className="h-5 mt-2" aria-hidden="true" />
        )}
      </div>
    </InnerCard>
  );
}

export default function IdnClub() {
  const { filtered, filteredNoTime, filters, isAdmin } = useData();
  const club = useMemo(() => filtered.club.filter((r) => !RETIRED_CLUBS.has((r.club || '').trim().toLowerCase())), [filtered.club]);

  const totalActiveEmployees = activeHeadcountForFilters(filtered, filters);
  const deptCounts = useMemo(() => deptHeadcountMap(filtered, filters), [filtered, filters]);

  const totalParticipation = club.length;
  const uniqueParticipants = useMemo(() => new Set(club.map((r) => r.email).filter(Boolean)).size, [club]);
  const participationPct = totalActiveEmployees > 0 ? Math.round((uniqueParticipants / totalActiveEmployees) * 1000) / 10 : 0;

  // ── Total Sessions (unique dates across all clubs) ─────────────────────
  const totalSessions = useMemo(() => {
    const dateSets = new Map<string, Set<string>>();
    club.forEach((r) => {
      if (!r.club) return;
      if (!dateSets.has(r.club)) dateSets.set(r.club, new Set());
      const dateKey = r.date || (r.year && r.month ? `${r.year}-${String(r.month).padStart(2, '0')}` : '');
      if (dateKey) dateSets.get(r.club)!.add(dateKey);
    });
    let total = 0;
    dateSets.forEach((set) => (total += set.size));
    return total;
  }, [club]);

  // ── Trend for Participation Percentage (computed from ALL time data) ──
  // Use filteredNoTime.club directly (like Overview) and compute quarter from month
  // because club data may not have r.quarter populated
  const participationTrend = useMemo(
    () =>
      computeDynamicTrend(
        filteredNoTime.club,
        {
          yearFn: (r) => r.year,
          monthFn: (r) => r.month,
          quarterFn: (r) => r.quarter ?? Math.ceil(r.month / 3),
        },
        uniqueAgg((r: (typeof filteredNoTime.club)[number]) => r.email),
        filters
      ),
    [filteredNoTime.club, filters]
  );

  const byDeptTable = useMemo(() => {
    const participants = new Map<string, Set<string>>();
    club.forEach((r) => {
      if (!r.department || !r.email) return;
      if (!participants.has(r.department)) participants.set(r.department, new Set());
      participants.get(r.department)!.add(r.email);
    });
    const allDepartments = (filters.department !== 'All' ? [filters.department] : Array.from(deptCounts.keys()))
      .filter((d) => d && d.trim() !== '' && d !== 'Board of Directors');
    return allDepartments.map((department) => {
      const set = participants.get(department);
      const total = deptCounts.get(department) || 0;
      const uniqueCount = set?.size ?? 0;
      const rate = total > 0 ? Math.round((uniqueCount / total) * 1000) / 10 : 0;
      return { department, value: rate, count: uniqueCount, total };
    }).sort((a, b) => b.value - a.value);
  }, [club, deptCounts, filters.department]);

  const topActiveTimmy = useMemo(() => {
    const byEmail = new Map<string, { name: string; department: string; count: number }>();
    club.forEach((r) => {
      if (!r.email) return;
      if (!byEmail.has(r.email)) byEmail.set(r.email, { name: r.name, department: r.department, count: 0 });
      byEmail.get(r.email)!.count += 1;
    });
    return Array.from(byEmail.values()).sort((a, b) => b.count - a.count).slice(0, 20).map((e) => ({ name: e.name, department: e.department, total: e.count }));
  }, [club]);

  // ── Metrics per Club (responsive to filters) ───────────────────────────
  const clubMetrics: ClubMetricRow[] = useMemo(() => {
    const participants = new Map<string, Set<string>>();
    const totalRecords = new Map<string, number>();
    const dateSets = new Map<string, Set<string>>();

    club.forEach((r) => {
      if (!r.club) return;
      totalRecords.set(r.club, (totalRecords.get(r.club) || 0) + 1);
      if (!dateSets.has(r.club)) dateSets.set(r.club, new Set());
      const dateKey = r.date || (r.year && r.month ? `${r.year}-${String(r.month).padStart(2, '0')}` : '');
      if (dateKey) dateSets.get(r.club)!.add(dateKey);
      if (r.email) {
        if (!participants.has(r.club)) participants.set(r.club, new Set());
        participants.get(r.club)!.add(r.email);
      }
    });

    const clubNames = Array.from(totalRecords.keys()).sort((a, b) => {
      const ua = participants.get(a)?.size || 0;
      const ub = participants.get(b)?.size || 0;
      return ub - ua;
    });

    return clubNames.map((clubName) => {
      const uniqueTimmy = participants.get(clubName)?.size || 0;
      const totalParticipants = totalRecords.get(clubName) || 0;
      const totalSessions = dateSets.get(clubName)?.size || 0;
      const averageParticipants = totalSessions > 0 ? Math.round((totalParticipants / totalSessions) * 10) / 10 : 0;
      return { club: clubName, uniqueTimmy, totalSessions, averageParticipants };
    });
  }, [club]);

  // TREND: Unique Timmy only, follows active time filters + the trend chart's own Club selector
  const [trendClub, setTrendClub] = useState<string>('All');

  const trendClubOptions = useMemo(
    () => Array.from(new Set(club.map((r) => r.club).filter(Boolean) as string[])).sort(),
    [club]
  );

  const trendData = useMemo(() => {
    const source = trendClub === 'All' ? club : club.filter((r) => r.club === trendClub);
    const byMonth = new Map<string, { label: string; sortKey: string; emails: Set<string> }>();

    source.forEach((r) => {
      if (!r.year || !r.month) return;
      const sortKey = `${r.year}-${String(r.month).padStart(2, '0')}`;
      const label = `${MONTH_NAMES[r.month - 1]} ${r.year}`;

      if (!byMonth.has(sortKey)) {
        byMonth.set(sortKey, { label, sortKey, emails: new Set() });
      }
      if (r.email) byMonth.get(sortKey)!.emails.add(r.email);
    });

    return Array.from(byMonth.values())
      .sort((a, b) => a.sortKey.localeCompare(b.sortKey))
      .map((d) => ({ label: d.label, unique: d.emails.size }));
  }, [club, trendClub]);

  return (
    <div className="page-container" style={{ fontFamily: "'Poppins', sans-serif" }}>
      <PageHeader title="IDN Club" subtitle="Overview of Club participation across departments and participation trends, based on unique Timmy." />

      {/* ═══════════════════════════════════════
          KPI SECTION — red box matching Overview
          ═══════════════════════════════════════ */}
      <div
        className="rounded-3xl border border-white/10 p-6 sm:p-7 min-w-0 flex flex-col relative overflow-hidden shadow-2xl"
        style={{
          backgroundImage: 'url(/bg-overview.jpg)',
          backgroundSize: 'cover',
          backgroundPosition: 'center',
        }}
      >
        <div className="absolute inset-0 bg-black/20 pointer-events-none" />

        <h3 className="relative z-10 text-xs font-bold uppercase tracking-[0.2em] text-white/90 mb-6 text-center">
          Key Metrics
        </h3>

        <div className="relative z-10 flex-1 flex gap-4 items-stretch">
          <KpiInnerCard label="Total Participants" value={totalParticipation.toString()} icon={<Users2 size={16} />} />
          <KpiInnerCard label="Unique Participants" value={uniqueParticipants.toString()} icon={<UserCheck size={16} />} />
          <KpiInnerCard label="Participation Percentage" value={`${participationPct}%`} icon={<Percent size={16} />} comparisons={participationTrend.comparisons} />
          {isAdmin && (
            <KpiInnerCard label="Total Sessions" value={totalSessions.toString()} icon={<CalendarDays size={16} />} />
          )}
        </div>
      </div>

      <ChartCard
        title="Participation trend over time"
        subtitle={trendClub === 'All' ? 'Monthly unique Timmy trend filtered by selected time period' : `Monthly unique Timmy trend — ${trendClub}`}
        height="h-80"
        headerRight={
          <select
            value={trendClub}
            onChange={(e) => setTrendClub(e.target.value)}
            className="text-xs font-medium rounded-lg border border-[var(--color-border-subtle)] bg-[var(--color-surface)] text-[var(--color-text-primary)] pl-2.5 pr-6 py-1.5 cursor-pointer focus:outline-none focus:ring-2 focus:ring-[var(--color-brand-500)]/30"
          >
            <option value="All">All Clubs</option>
            {trendClubOptions.map((c) => (
              <option key={c} value={c}>{c}</option>
            ))}
          </select>
        }
      >
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={trendData} margin={{ top: 20, right: 8, left: -16, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="var(--color-chart-grid)" vertical={false} />
            <XAxis dataKey="label" tick={axisTick} axisLine={false} tickLine={false} />
            <YAxis tick={axisTick} axisLine={false} tickLine={false} />
            <Tooltip contentStyle={tooltipStyle} />
            <Line type="monotone" dataKey="unique" stroke="var(--color-brand-500)" strokeWidth={2.5} dot={{ r: 3, fill: 'var(--color-brand-500)' }} name="Unique Timmy">
              <LabelList dataKey="unique" position="top" style={{ fontSize: 11, fill: 'var(--color-text-secondary)', fontWeight: 600 }} />
            </Line>
          </LineChart>
        </ResponsiveContainer>
      </ChartCard>

      {/* Club Metrics — full width */}
      <ChartCard title="Club Metrics" subtitle="Unique Timmy · Total Sessions · Average Participants per Session">
        <ClubGrid rows={clubMetrics} isAdmin={isAdmin} />
      </ChartCard>

      {/* Department + Top 10 */}
      <div className={`panel-grid ${isAdmin ? 'panel-grid--2' : 'panel-grid--1'}`}>
        {isAdmin && (
          <ChartCard title="Club participation by department" subtitle="Department ranking based on Club participation rate.">
            <DepartmentRankTable rows={byDeptTable} />
          </ChartCard>
        )}
        <ChartCard title="Top 20 Active Timmy" subtitle="Total participation">
          <PodiumLeaderboard rows={topActiveTimmy} />
        </ChartCard>
      </div>
    </div>
  );
}
