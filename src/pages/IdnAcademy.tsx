import { useMemo, useState } from 'react';
import { GraduationCap, Clock, Briefcase, BookOpen, Percent } from 'lucide-react';
import { useData } from '@/context/DataContext';
import { PageHeader, ChartCard } from '@/components/ui/unified-components';
import { computeDynamicTrend } from '@/lib/dynamicTrend';
import { uniqueAgg } from '@/lib/rollingWindow';
import type { DynamicTrendResult } from '@/lib/dynamicTrend';
import DepartmentRankTable from '@/components/ui/DepartmentRankTable';
import PodiumLeaderboard from '@/components/ui/PodiumLeaderboard';
import InternshipDetailModal from '@/components/ui/InternshipDetailModal';
import { activeHeadcountForFilters, deptHeadcountMap } from '@/lib/headcount';
import { ResponsiveContainer, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, LabelList, Legend } from 'recharts';

const axisTick = { fontSize: 11, fill: '#52423D' };
const tooltipStyle = {
  background: '#ffffff',
  border: '1px solid #D4B4A6',
  borderRadius: 12,
  fontSize: 12,
  color: '#52423D',
};

const MONTH_NAMES = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];

/* ─── Unified Inner Card Shell (same as Overview / IDN Club) ─── */
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

        {/* Trend badges — only when comparisons provided (% of Total Active Employee) */}
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

export default function IdnAcademy() {
  const { filtered, filteredNoTime, filters, isAdmin } = useData();
  const { inClass, internship } = filtered;

  const deptCounts = useMemo(() => deptHeadcountMap(filtered, filters), [filtered, filters]);
  const totalActiveEmployees = activeHeadcountForFilters(filtered, filters);

  // ── Total Participation (unique Timmy from inClass + internship) ──
  const totalParticipation = useMemo(() => {
    const emails = new Set<string>();
    inClass.forEach((r) => r.email && emails.add(r.email));
    internship.forEach((r) => r.email && emails.add(r.email));
    return emails.size;
  }, [inClass, internship]);

  // ── % of Total Active Employee ──
  const academyPct = totalActiveEmployees > 0 ? Math.round((totalParticipation / totalActiveEmployees) * 1000) / 10 : 0;

  // ── Total Learning Sessions (unique by course+date) ──
  const totalLearningSessions = useMemo(() => {
    const sessionKeys = new Set<string>();
    inClass.forEach((r) => {
      if (r.course && r.date) {
        sessionKeys.add(`${r.course}__${r.date}`);
      }
    });
    return sessionKeys.size;
  }, [inClass]);

  // ── Total Learning Hours (de-duplicated by course+date) ──
  const totalLearningHours = useMemo(() => {
    const sessions = new Map<string, number>();
    inClass.forEach((r) => {
      const key = `${r.course}__${r.date}`;
      if (!sessions.has(key)) sessions.set(key, r.learningHours);
    });
    let total = 0;
    sessions.forEach((h) => (total += h));
    return total;
  }, [inClass]);

  // ── Internal Internship Participants ──
  const internshipParticipants = useMemo(() => new Set(internship.map((r) => r.email).filter(Boolean)).size, [internship]);

  // ── Trend for % of Total Active Employee (from ALL time data, not filtered) ──
  const academyCombinedNoTime = useMemo(
    () => [
      ...filteredNoTime.inClass.map((r) => ({ email: r.email, year: r.year, month: r.month, quarter: r.quarter })),
      ...filteredNoTime.internship.map((r) => ({ email: r.email, year: r.year, month: r.month, quarter: r.quarter })),
    ],
    [filteredNoTime.inClass, filteredNoTime.internship]
  );

  const participationTrend = useMemo(
    () =>
      computeDynamicTrend(
        academyCombinedNoTime,
        {
          yearFn: (r) => r.year,
          monthFn: (r) => r.month,
          quarterFn: (r) => r.quarter ?? Math.ceil(r.month / 3),
        },
        uniqueAgg((r) => r.email),
        filters
      ),
    [academyCombinedNoTime, filters]
  );

  const byDeptTable = useMemo(() => {
    const participants = new Map<string, Set<string>>();
    const add = (dept: string | undefined, email: string) => {
      if (!dept || !email) return;
      if (!participants.has(dept)) participants.set(dept, new Set());
      participants.get(dept)!.add(email);
    };
    inClass.forEach((r) => add(r.department, r.email));
    internship.forEach((r) => add(r.homeDepartment, r.email));
    const allDepartments = (filters.department !== 'All' ? [filters.department] : Array.from(deptCounts.keys()))
      .filter((d) => d && d.trim() !== '' && d !== 'Board of Directors');
    return allDepartments.map((department) => {
      const set = participants.get(department);
      const total = deptCounts.get(department) || 0;
      const uniqueCount = set?.size ?? 0;
      const rate = total > 0 ? Math.round((uniqueCount / total) * 1000) / 10 : 0;
      return { department, value: rate, count: uniqueCount, total };
    }).sort((a, b) => b.value - a.value);
  }, [inClass, internship, deptCounts, filters.department]);

  const topActiveTimmy = useMemo(() => {
    const byEmail = new Map<string, { name: string; department: string; hours: number; seenSessions: Set<string> }>();

    inClass.forEach((r) => {
      if (!r.email) return;
      if (!byEmail.has(r.email)) byEmail.set(r.email, { name: r.name, department: r.department, hours: 0, seenSessions: new Set() });
      const entry = byEmail.get(r.email)!;
      const sessionKey = `${r.course}__${r.date}`;
      if (!entry.seenSessions.has(sessionKey)) {
        entry.seenSessions.add(sessionKey);
        entry.hours += r.learningHours || 0;
      }
    });

    // Internship-only participants still show up (with 0 hours), ranked naturally at the bottom
    internship.forEach((r) => {
      if (!r.email) return;
      if (!byEmail.has(r.email)) byEmail.set(r.email, { name: r.name, department: r.homeDepartment, hours: 0, seenSessions: new Set() });
    });

    return Array.from(byEmail.values())
      .sort((a, b) => b.hours - a.hours)
      .slice(0, 20)
      .map((e) => ({ name: e.name, department: e.department, total: Math.round(e.hours * 10) / 10 }));
  }, [inClass, internship]);

  // TREND: Unique Participants + Total Participants (dual line chart)
  const trendData = useMemo(() => {
    const combined = [
      ...inClass.map((r) => ({ email: r.email, year: r.year, month: r.month })),
      ...internship.map((r) => ({ email: r.email, year: r.year, month: r.month })),
    ];

    const byMonth = new Map<string, { label: string; sortKey: string; emails: Set<string>; total: number }>();

    combined.forEach((r) => {
      if (!r.year || !r.month) return;
      const sortKey = `${r.year}-${String(r.month).padStart(2, '0')}`;
      const label = `${MONTH_NAMES[r.month - 1]} ${r.year}`;

      if (!byMonth.has(sortKey)) {
        byMonth.set(sortKey, { label, sortKey, emails: new Set(), total: 0 });
      }
      const monthData = byMonth.get(sortKey)!;
      monthData.total += 1;
      if (r.email) monthData.emails.add(r.email);
    });

    return Array.from(byMonth.values())
      .sort((a, b) => a.sortKey.localeCompare(b.sortKey))
      .map((d) => ({ label: d.label, unique: d.emails.size, total: d.total }));
  }, [inClass, internship]);

  // Internship detail rows for modal
  const [showInternshipModal, setShowInternshipModal] = useState(false);
  const internshipDetailRows = useMemo(() => {
    return internship.map((r) => ({
      name: r.name,
      homeDepartment: r.homeDepartment,
      hostDepartment: r.hostDepartment,
      year: r.year,
      quarter: r.quarter,
    }));
  }, [internship]);

  return (
    <div className="page-container" style={{ fontFamily: "'Poppins', sans-serif" }}>
      <PageHeader title="IDN Academy" subtitle="Interactive In-Class Learning and Internal Internship, counted by unique Timmy and de-duplicated session hours." />

      {/* ═══════════════════════════════════════
          KPI SECTION — red box matching IDN Club
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
          {/* 1. Total Participation */}
          <KpiInnerCard label="Total Participation" value={totalParticipation.toString()} icon={<GraduationCap size={16} />} />

          {/* 2. % of Total Active Employee (with Q/Y trend) */}
          <KpiInnerCard label="% of Total Active Employee" value={`${academyPct}%`} icon={<Percent size={16} />} comparisons={participationTrend.comparisons} />

          {/* 3. Total Learning Sessions */}
          <KpiInnerCard label="Total Learning Sessions" value={totalLearningSessions.toString()} icon={<BookOpen size={16} />} />

          {/* 4. Total Learning Hours */}
          {isAdmin && (
            <KpiInnerCard label="Total Learning Hours" value={`${Math.round(totalLearningHours)}h`} icon={<Clock size={16} />} />
          )}

          {/* 5. Internal Internship */}
          <div className="flex-1 min-w-0 cursor-pointer" onClick={() => setShowInternshipModal(true)}>
            <InnerCard className="!p-6 h-full">
              <div className="flex flex-col items-center w-full h-full justify-center">
                <div className="h-6 flex items-center justify-center mb-3 text-white/70">
                  <Briefcase size={16} />
                </div>
                <div className="h-10 flex items-center justify-center text-center mb-4">
                  <span className="text-[11px] font-bold uppercase tracking-widest text-white/80 leading-tight">
                    Internal Internship
                  </span>
                </div>
                <div className="h-14 flex items-center justify-center">
                  <span className="text-4xl sm:text-5xl font-extrabold text-white tracking-tight">{internshipParticipants}</span>
                </div>
                <div className="h-5 mt-2" aria-hidden="true" />
              </div>
            </InnerCard>
          </div>
        </div>
      </div>

      <ChartCard title="Monthly learning trend" subtitle="Unique Participants vs Total Participant — filtered by selected time period" height="h-80">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={trendData} margin={{ top: 20, right: 8, left: -16, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#D4B4A6" vertical={false} />
            <XAxis dataKey="label" tick={axisTick} axisLine={false} tickLine={false} />
            <YAxis tick={axisTick} axisLine={false} tickLine={false} />
            <Tooltip contentStyle={tooltipStyle} />
            <Legend wrapperStyle={{ fontSize: 11, color: '#52423D' }} />
            <Line type="monotone" dataKey="unique" stroke="#ED2127" strokeWidth={2.5} dot={{ r: 3, fill: '#ED2127' }} name="Unique Participants">
              <LabelList dataKey="unique" position="top" style={{ fontSize: 11, fill: '#52423D', fontWeight: 600 }} />
            </Line>
            <Line type="monotone" dataKey="total" stroke="#3b82f6" strokeWidth={2.5} dot={{ r: 3, fill: '#3b82f6' }} name="Total Participant">
              <LabelList dataKey="total" position="bottom" style={{ fontSize: 11, fill: '#52423D', fontWeight: 600 }} />
            </Line>
          </LineChart>
        </ResponsiveContainer>
      </ChartCard>

      {/* Department ranking + Top 10 */}
      <div className={`panel-grid ${isAdmin ? 'panel-grid--2' : 'panel-grid--1'}`}>
        {isAdmin && (
          <ChartCard title="IDN Academy participation by department" subtitle="Department ranking based on learning participation rate.">
            <DepartmentRankTable rows={byDeptTable} />
          </ChartCard>
        )}
        <ChartCard title="Top 20 Active Timmy" subtitle="Ranked by total Learning Hours across Interactive In-Class Learning and Internal Internship Programs">
          <PodiumLeaderboard rows={topActiveTimmy} />
        </ChartCard>
      </div>

      {showInternshipModal && (
        <InternshipDetailModal
          rows={internshipDetailRows}
          onClose={() => setShowInternshipModal(false)}
        />
      )}
    </div>
  );
}
