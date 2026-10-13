import { useMemo, useState } from 'react';
import { Send, Eye, CheckCircle2, XCircle, Trophy, MailOpen } from 'lucide-react';
import { useData } from '@/context/DataContext';
import { PageHeader, ChartCard } from '@/components/ui/unified-components';
import PodiumLeaderboard from '@/components/ui/PodiumLeaderboard';
import CultureChampionsGrid from '@/components/ui/CultureChampionsGrid';
import DepartmentRankTable from '@/components/ui/DepartmentRankTable';
import ReviewKudosModal from '@/components/ui/ReviewKudosModal';
import RecognitionValuesPanel from '@/components/ui/RecognitionValuesPanel';
import TotmByDepartment from '@/components/ui/TotmByDepartment';
import TotmDeptModal from '@/components/ui/TotmDeptModal';
import { deptHeadcountMap } from '@/lib/headcount';
import { canonicalizeTimmyness, sortByTimmyness, TIMMYNESS_ORDER, parseTimmynessLabel } from '@/lib/timmyness';
import { ResponsiveContainer, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, LabelList } from 'recharts';
import { monthlyTrend } from '@/lib/aggregate';
import { computeDynamicTrend } from '@/lib/dynamicTrend';
import type { DynamicTrendResult } from '@/lib/dynamicTrend';
import type { TimmyOfTheMonthRecord } from '@/types';

const axisTick = { fontSize: 11, fill: '#52423D' };
const tooltipStyle = {
  background: '#ffffff',
  border: '1px solid #D4B4A6',
  borderRadius: 12,
  fontSize: 12,
  color: '#52423D',
};

const TIMMYNESS_CUTOFF = new Date('2024-06-01').getTime();

// Non-Active Timmy: their transactions still count in every total, but their
// NAME is never displayed anywhere on this page.
const NON_ACTIVE_LABEL = 'Non-Active Timmy';

/* ─── Unified Inner Card Shell (identical to Overview / IDN Club / IDN Academy),
     now with a color variant so the Recognition KPI row can visually group
     Send/Review/Approved/Rejected (blue), Received (gold), and TOTM (black). ─── */
const CARD_VARIANT_BG: Record<'black' | 'blue' | 'gold', string> = {
  black: 'bg-gray-950/70',
  blue: 'bg-blue-950/70',
  gold: 'bg-amber-900/70',
};

function InnerCard({
  children,
  className = '',
  variant = 'black',
}: {
  children: React.ReactNode;
  className?: string;
  variant?: 'black' | 'blue' | 'gold';
}) {
  return (
    <div
      className={[
        'flex-1 min-w-0',
        CARD_VARIANT_BG[variant],
        'backdrop-blur-md',
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

/* ─── Trend Badge (identical to Overview / IDN Club / IDN Academy) ─── */
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

/* ─── KPI Card (scalar) — same icon/label/value/trend layout as IDN Club & IDN Academy,
     with an optional caption slot underneath for the "Click here to see…" hint. ─── */
function KpiInnerCard({
  label,
  value,
  icon,
  comparisons,
  caption,
  variant = 'black',
}: {
  label: string;
  value: string;
  icon: React.ReactNode;
  comparisons?: DynamicTrendResult['comparisons'];
  caption?: string;
  variant?: 'black' | 'blue' | 'gold';
}) {
  const qComp = comparisons?.find((c) => c.label === 'vs Prev Q');
  const yComp = comparisons?.find((c) => c.label === 'vs Prev Year');

  return (
    <InnerCard className="!p-6 h-full" variant={variant}>
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

        {/* Trend badges — only when comparisons provided */}
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

        {/* Click hint — fixed-height slot so 1-line vs 2-line captions never shift icon/label/value above it */}
        <div className="h-8 mt-2 flex items-center justify-center text-center px-1">
          {caption && (
            <span className="text-[10px] text-white/50 leading-tight">{caption}</span>
          )}
        </div>
      </div>
    </InnerCard>
  );
}

/* ─── Section Divider — a horizontal rule spanning the full width with a
     bordered "pill" label sitting on top of it (classic "── LABEL ──"
     divider pattern). Makes it unmistakable that everything above belongs
     to one section and everything below belongs to the next. ─── */
function RecognitionSectionTitle({ title }: { title: string }) {
  return (
    <div style={{ position: 'relative', display: 'flex', alignItems: 'center', width: '100%', margin: '3rem 0 0.5rem' }}>
      <div
        style={{
          flex: 1,
          height: 2,
          background: 'linear-gradient(to right, rgba(237, 33, 39, 0), var(--color-brand-500))',
        }}
      />
      <div
        style={{
          display: 'inline-flex',
          width: 'fit-content',
          maxWidth: '100%',
          flexShrink: 0,
          alignItems: 'center',
          justifyContent: 'center',
          padding: '0.6rem 1.75rem',
          margin: '0 1rem',
          borderRadius: '9999px',
          border: '2px solid var(--color-brand-500)',
          background: 'var(--color-surface, #FFFFFF)',
          boxShadow: '0 2px 10px rgba(237, 33, 39, 0.18)',
        }}
      >
        <h2
          className="text-sm sm:text-base font-bold uppercase tracking-widest whitespace-nowrap"
          style={{ color: 'var(--color-brand-500)', textAlign: 'center', margin: 0 }}
        >
          {title}
        </h2>
      </div>
      <div
        style={{
          flex: 1,
          height: 2,
          background: 'linear-gradient(to left, rgba(237, 33, 39, 0), var(--color-brand-500))',
        }}
      />
    </div>
  );
}

export default function Recognition() {
  const { filtered, filteredNoTime, filters, isAdmin } = useData();
  const { kudos, timmyOfTheMonth } = filtered;
  const [showSentModal, setShowSentModal] = useState(false);
  const [showReviewModal, setShowReviewModal] = useState(false);
  const [showApprovedModal, setShowApprovedModal] = useState(false);
  const [showRejectedModal, setShowRejectedModal] = useState(false);
  const [showReceivedModal, setShowReceivedModal] = useState(false);
  const [showTotmModal, setShowTotmModal] = useState(false);
  const [selectedTotmDept, setSelectedTotmDept] = useState<{ dept: string; rows: TimmyOfTheMonthRecord[] } | null>(null);

  const deptCounts = useMemo(() => deptHeadcountMap(filtered, filters), [filtered, filters]);
  const allDepartments = useMemo(() => (filters.department !== 'All' ? [filters.department] : Array.from(deptCounts.keys())).filter((d) => d && d.trim() !== '' && d !== 'Board of Directors'), [deptCounts, filters.department]);
  const deptOk = (d?: string) => filters.department === 'All' || d === filters.department;
  const locOk = (l?: string) => filters.location === 'All' || l === filters.location;

  // ── KPI CARDS Review / Approved / Rejected: sender-side pool, every workflow
  // status, regardless of employment status (Active or Non-Active both
  // included). Send / Received cards use the Approved-only pools below. ──
  const kudosAsSender = useMemo(() => {
    return kudos.filter((r) => deptOk(r.senderDepartment) && locOk(r.senderEmployee?.location));
  }, [kudos, filters.department, filters.location]);

  // ── APPROVED-ONLY POOL for the department breakdowns, monthly trend
  // chart, Culture Champions, and Recognition Values — these only require
  // the workflow status to be Approved (col P). Employment status is NOT
  // restricted here (Active + Non-Active both count), per request. ──
  const kudosApprovedOnly = useMemo(() => {
    return kudos.filter((r) => r.workflowStatus === 'APPROVED');
  }, [kudos]);

  const kudosApprovedAsSender = useMemo(
    () => kudosApprovedOnly.filter((r) => deptOk(r.senderDepartment) && locOk(r.senderEmployee?.location)),
    [kudosApprovedOnly, filters.department, filters.location]
  );

  const kudosApprovedAsReceiver = useMemo(
    () => kudosApprovedOnly.filter((r) => deptOk(r.receiverDepartment) && locOk(r.receiverEmployee?.location)),
    [kudosApprovedOnly, filters.department, filters.location]
  );

  // ── APPROVED + RECEIVER-ACTIVE POOL: required by Top Receivers,
  // Recognition Values by Kudos, and Culture Champions — all three only
  // count Approved records where the RECEIVER is Active. Sender's
  // employment status is not checked (confirmed: sender being Non-Active
  // is fine). Everything else on this page (KPI cards, department
  // rankings, Kudos by month) intentionally does NOT apply this filter. ──
  const kudosApprovedActiveReceiverOnly = useMemo(() => {
    return kudosApprovedOnly.filter(
      (r) => r.receiverStatusRaw === 'Active' && deptOk(r.receiverDepartment) && locOk(r.receiverEmployee?.location)
    );
  }, [kudosApprovedOnly, filters.department, filters.location]);


  const statusCount = (match: 'REVIEW' | 'APPROVED' | 'REJECTED', pool: typeof kudosAsSender) =>
    pool.filter((r) => r.workflowStatus === match).length;

  // Send / Received cards count APPROVED Kudos only, so they reconcile with the
  // department tables below (both use the Approved-only pools). Non-Active
  // senders/receivers are still counted; only their names are masked.
  const sendKudosTotal = kudosApprovedAsSender.length;
  const reviewTotal = statusCount('REVIEW', kudosAsSender);
  const approvedTotal = statusCount('APPROVED', kudosAsSender);
  const rejectedTotal = statusCount('REJECTED', kudosAsSender);
  const receivedTotal = kudosApprovedAsReceiver.length;
  const totmTotal = timmyOfTheMonth.length;

  // ── APPROVED Kudos, all-time — for Q/Y trend on the "Approved" KPI card.
  // Uses filteredNoTime so the comparison isn't limited by the active
  // Year/Quarter/Month filter. Employment status is not restricted here,
  // matching the KPI cards above (Active + Non-Active both count). ──
  const approvedKudosNoTime = useMemo(() => {
    return filteredNoTime.kudos.filter((r) => {
      if (!deptOk(r.senderDepartment)) return false;
      if (!locOk(r.senderEmployee?.location)) return false;
      return r.workflowStatus === 'APPROVED';
    });
  }, [filteredNoTime.kudos, filters.department, filters.location]);

  const approvedTrend = useMemo(
    () =>
      computeDynamicTrend(
        approvedKudosNoTime,
        {
          yearFn: (r) => r.year,
          monthFn: (r) => r.month,
          quarterFn: (r) => r.quarter ?? Math.ceil(r.month / 3),
        },
        (rows) => rows.length,
        filters
      ),
    [approvedKudosNoTime, filters]
  );

  const makeKudosRows = (pool: typeof kudosAsSender) =>
    pool
      .map((r) => ({
        senderName: r.senderStatusRaw === 'Active' ? r.senderName : NON_ACTIVE_LABEL,
        senderDepartment: r.senderDepartment,
        senderManager: r.senderStatusRaw === 'Active' ? r.senderEmployee?.directReport || '' : '',
        receiverName: r.receiverStatusRaw === 'Active' ? r.receiverName : NON_ACTIVE_LABEL,
        receiverDepartment: r.receiverDepartment,
        created: r.created,
      }))
      .sort((a, b) => new Date(b.created).getTime() - new Date(a.created).getTime());

  const sentRows = useMemo(() => makeKudosRows(kudosApprovedAsSender), [kudosApprovedAsSender]);
  const reviewRows = useMemo(() => makeKudosRows(kudosAsSender.filter((r) => r.workflowStatus === 'REVIEW')), [kudosAsSender]);
  const approvedRows = useMemo(() => makeKudosRows(kudosAsSender.filter((r) => r.workflowStatus === 'APPROVED')), [kudosAsSender]);
  const rejectedRows = useMemo(() => makeKudosRows(kudosAsSender.filter((r) => r.workflowStatus === 'REJECTED')), [kudosAsSender]);
  const receivedRows = useMemo(() => makeKudosRows(kudosApprovedAsReceiver), [kudosApprovedAsReceiver]);

  const topReceivers = useMemo(() => {
    const byPerson = new Map<string, { name: string; department: string; total: number }>();
    kudosApprovedActiveReceiverOnly.forEach((r) => {
      const key = r.receiverEmail || r.receiverName;
      if (!key) return;
      if (!byPerson.has(key)) byPerson.set(key, { name: r.receiverName, department: r.receiverDepartment, total: 0 });
      byPerson.get(key)!.total += 1;
    });
    return Array.from(byPerson.values())
      .sort((a, b) => b.total - a.total)
      .slice(0, 10);
  }, [kudosApprovedActiveReceiverOnly]);

  const cultureChampions = useMemo(() => {
    const recentKudos = kudosApprovedActiveReceiverOnly.filter((r) => new Date(r.created).getTime() >= TIMMYNESS_CUTOFF);
    const rows: { name: string; department: string; timmyness: string; count: number }[] = [];
    TIMMYNESS_ORDER.forEach((category) => {
      const counts = new Map<string, { name: string; department: string; count: number }>();
      recentKudos.forEach((r) => {
        if (canonicalizeTimmyness(r.value) !== category) return;
        const key = r.receiverEmail || r.receiverName;
        if (!key) return;
        if (!counts.has(key)) counts.set(key, { name: r.receiverName, department: r.receiverDepartment, count: 0 });
        counts.get(key)!.count += 1;
      });
      if (counts.size === 0) return;
      const max = Math.max(...Array.from(counts.values()).map((v) => v.count));
      Array.from(counts.values())
        .filter((v) => v.count === max)
        .forEach((v) => rows.push({ name: v.name, department: v.department, timmyness: category, count: max }));
    });
    return rows;
  }, [kudosApprovedActiveReceiverOnly]);

  // Kudos by department — Sent (Approved only; Active + Non-Active both count)
  const byDeptSent = useMemo(() => {
    const m = new Map<string, number>();
    kudosApprovedAsSender.forEach((r) => {
      if (!r.senderDepartment) return;
      m.set(r.senderDepartment, (m.get(r.senderDepartment) || 0) + 1);
    });
    return allDepartments
      .map((department) => ({ department, value: m.get(department) || 0 }))
      .sort((a, b) => b.value - a.value);
  }, [kudosApprovedAsSender, allDepartments]);

  // Kudos by department — Received (same Approved-only pool, grouped by
  // receiver instead — totals reconcile with "Sent" by construction since
  // both are counting the same underlying rows)
  const byDeptReceived = useMemo(() => {
    const m = new Map<string, number>();
    kudosApprovedAsReceiver.forEach((r) => {
      if (!r.receiverDepartment) return;
      m.set(r.receiverDepartment, (m.get(r.receiverDepartment) || 0) + 1);
    });
    return allDepartments
      .map((department) => ({ department, value: m.get(department) || 0 }))
      .sort((a, b) => b.value - a.value);
  }, [kudosApprovedAsReceiver, allDepartments]);

  const kudosByMonth = useMemo(() => {
    const sentScoped = kudosApprovedAsSender;
    const receivedScoped = kudosApprovedAsReceiver;
    const sentTrend = monthlyTrend(sentScoped, (r) => r.year, (r) => r.month);
    const receivedTrend = monthlyTrend(receivedScoped, (r) => r.year, (r) => r.month);
    const byMonth = new Map<string, { month: string; Sent: number; Received: number }>();
    sentTrend.forEach((d) => byMonth.set(d.month, { month: d.month, Sent: d.value, Received: 0 }));
    receivedTrend.forEach((d) => {
      const existing = byMonth.get(d.month) ?? { month: d.month, Sent: 0, Received: 0 };
      existing.Received = d.value;
      byMonth.set(d.month, existing);
    });
    return Array.from(byMonth.values());
  }, [kudosApprovedAsSender, kudosApprovedAsReceiver]);

  const recognitionValuesKudos = useMemo(() => {
    const counts = new Map<string, number>();
    kudosApprovedActiveReceiverOnly.forEach((r) => {
      const label = canonicalizeTimmyness(r.value);
      counts.set(label, (counts.get(label) || 0) + 1);
    });
    return sortByTimmyness(
      Array.from(counts.entries()).map(([name, value]) => ({ name, value })),
      (e) => e.name
    );
  }, [kudosApprovedActiveReceiverOnly]);

  const recognitionValuesTotm = useMemo(() => {
    const counts = new Map<string, number>();
    timmyOfTheMonth.forEach((r) => {
      if (!r.status) return;
      r.status.split('\u00b7').forEach((piece) => {
        const label = canonicalizeTimmyness(parseTimmynessLabel(piece.trim()));
        if (!label) return;
        counts.set(label, (counts.get(label) || 0) + 1);
      });
    });
    return sortByTimmyness(
      Array.from(counts.entries()).map(([name, value]) => ({ name, value })),
      (e) => e.name
    );
  }, [timmyOfTheMonth]);

  // Format period for TOTM (e.g. "June 2024" or "Q2 2024")
  const formatPeriod = (r: TimmyOfTheMonthRecord) => {
    if (r.month && r.year) {
      const monthNames = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
      return `${monthNames[r.month - 1]} ${r.year}`;
    }
    if (r.quarter && r.year) {
      return `Q${r.quarter} ${r.year}`;
    }
    return String(r.year || '—');
  };

  return (
    <div className="page-container">
      <PageHeader
        title="Recognition"
        subtitle="An overview of recognition through IDN Kudos and Timmy of the Month, highlighting recognition patterns and the values being demonstrated."
      />
      {/* ═══════════════════════════════════════
          KPI SECTION — red box matching IDN Club / IDN Academy
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
          <div className="flex-1 min-w-0 cursor-pointer" onClick={() => setShowSentModal(true)}>
            <KpiInnerCard label="IDN Kudos: Send" value={sendKudosTotal.toString()} icon={<Send size={16} />} caption="Click here to see sent Kudos" variant="blue" />
          </div>

          <div className="flex-1 min-w-0 cursor-pointer" onClick={() => setShowReviewModal(true)}>
            <KpiInnerCard label="IDN Kudos: Review" value={reviewTotal.toString()} icon={<Eye size={16} />} caption="Click here to review pending Kudos" variant="blue" />
          </div>

          <div className="flex-1 min-w-0 cursor-pointer" onClick={() => setShowApprovedModal(true)}>
            <KpiInnerCard
              label="IDN Kudos: Approved"
              value={approvedTotal.toString()}
              icon={<CheckCircle2 size={16} />}
              caption="Click here to see approved Kudos"
              comparisons={approvedTrend.comparisons}
              variant="blue"
            />
          </div>

          <div className="flex-1 min-w-0 cursor-pointer" onClick={() => setShowRejectedModal(true)}>
            <KpiInnerCard label="IDN Kudos: Rejected" value={rejectedTotal.toString()} icon={<XCircle size={16} />} caption="Click here to see rejected Kudos" variant="blue" />
          </div>

          <div className="flex-1 min-w-0 cursor-pointer" onClick={() => setShowReceivedModal(true)}>
            <KpiInnerCard label="IDN Kudos: Received" value={receivedTotal.toString()} icon={<MailOpen size={16} />} caption="Click here to see received Kudos" variant="gold" />
          </div>

          <div className="flex-1 min-w-0 cursor-pointer" onClick={() => setShowTotmModal(true)}>
            <KpiInnerCard label="Total Timmy of the Month" value={totmTotal.toString()} icon={<Trophy size={16} />} caption="Click here to see Timmy of the Month" />
          </div>
        </div>
      </div>

      <RecognitionSectionTitle title="IDN Kudos" />
      <ChartCard title="Kudos by month" subtitle="Recognition trend over time — Sent vs. Received" height="h-80">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={kudosByMonth} margin={{ top: 20, right: 8, left: -16, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#D4B4A6" vertical={false} />
            <XAxis dataKey="month" tick={axisTick} axisLine={false} tickLine={false} />
            <YAxis tick={axisTick} axisLine={false} tickLine={false} />
            <Tooltip contentStyle={tooltipStyle} />
            <Legend wrapperStyle={{ fontSize: 11, color: '#52423D' }} />
            <Line type="monotone" dataKey="Sent" stroke="#ED2127" strokeWidth={2.5} dot={{ r: 3, fill: '#ED2127' }}>
              <LabelList dataKey="Sent" position="top" style={{ fontSize: 10, fill: '#52423D', fontWeight: 600 }} />
            </Line>
            <Line type="monotone" dataKey="Received" stroke="#3b82f6" strokeWidth={2.5} dot={{ r: 3, fill: '#3b82f6' }}>
              <LabelList dataKey="Received" position="bottom" style={{ fontSize: 10, fill: '#52423D', fontWeight: 600 }} />
            </Line>
          </LineChart>
        </ResponsiveContainer>
      </ChartCard>

      {/* KUDOS BY DEPARTMENT — SENT & RECEIVED: ADMIN ONLY */}
      {isAdmin && (
        <div className="panel-grid panel-grid--2">
          <ChartCard title="Kudos by department — Sent" subtitle="Department ranking by total IDN Kudos sent, highlighting the highest and lowest performers">
            <DepartmentRankTable rows={byDeptSent} showRate={false} valueLabel="Sent" />
          </ChartCard>
          <ChartCard title="Kudos by department — Received" subtitle="Department ranking by total Kudos received, highlighting the highest and lowest performers">
            <DepartmentRankTable rows={byDeptReceived} showRate={false} valueLabel="Received" />
          </ChartCard>
        </div>
      )}

      <div className="panel-grid panel-grid--2">
        <ChartCard title="Top Receivers" subtitle="Active employees only">
          <PodiumLeaderboard rows={topReceivers} />
        </ChartCard>
        <ChartCard title="Recognition Values by Kudos" subtitle="Recognition values ranked by IDN Kudos, based on active and approved records.">
          <RecognitionValuesPanel data={recognitionValuesKudos} title="Kudos by Timmyness" />
        </ChartCard>
      </div>

      {/* CULTURE CHAMPIONS: ADMIN ONLY */}
      {isAdmin && (
        <ChartCard title="Culture Champions" subtitle="Top receiver per category since June 2024">
          <CultureChampionsGrid rows={cultureChampions} />
        </ChartCard>
      )}

      <RecognitionSectionTitle title="Timmy of the Month" />

      <div className="panel-grid panel-grid--2">
        {/* ADMIN: TotmByDepartment with click to expand */}
        {isAdmin && (
          <ChartCard title="Timmy of the Month">
            <div className="flex items-center justify-between mb-3">
              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-[var(--color-brand-500)]/10 text-[var(--color-brand-500)] border border-[var(--color-brand-500)]/20">
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M15 15l-2 5L9 9l11 4-5 2zm0 0l5 5M7.188 2.239l.777 2.897M5.136 7.965l-2.898-.777M13.95 4.05l-2.122 2.122m-5.657 5.656l-2.12 2.122" />
                </svg>
                Click a department to see winners
              </span>
            </div>
            <TotmByDepartment rows={timmyOfTheMonth} allDepartments={allDepartments} onSelectDept={(dept, rows) => setSelectedTotmDept({ dept, rows })} />
          </ChartCard>
        )}

        {/* NON-ADMIN: Direct table Name | Period | Timmyness | Status */}
        {!isAdmin && (
          <ChartCard title="Timmy of the Month" subtitle={`${timmyOfTheMonth.length} winner(s) from your department`}>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-[#E0C4B8]">
                    <th className="text-left py-2.5 px-3 text-[10px] font-semibold uppercase tracking-wider text-[#A68E84]">#</th>
                    <th className="text-left py-2.5 px-3 text-[10px] font-semibold uppercase tracking-wider text-[#A68E84]">Name</th>
                    <th className="text-left py-2.5 px-3 text-[10px] font-semibold uppercase tracking-wider text-[#A68E84]">Period</th>
                    <th className="text-left py-2.5 px-3 text-[10px] font-semibold uppercase tracking-wider text-[#A68E84]">Timmyness</th>
                    <th className="text-left py-2.5 px-3 text-[10px] font-semibold uppercase tracking-wider text-[#A68E84]">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {timmyOfTheMonth.length === 0 ? (
                    <tr>
                      <td colSpan={5} className="py-8 text-center text-sm text-[#9A6A75]">
                        No Timmy of the Month data available.
                      </td>
                    </tr>
                  ) : (
                    timmyOfTheMonth.map((r, i) => {
                      const isActive = r.employeeStatusRaw === 'Active';
                      return (
                        <tr key={i} className="border-b border-[#F5E8E2] hover:bg-[#F5E8E2]/50 transition-colors">
                          <td className="py-2.5 px-3 text-[#52423D] font-bold">{i + 1}</td>
                          <td className="py-2.5 px-3 text-[#52423D] font-medium">{isActive ? r.name || '—' : NON_ACTIVE_LABEL}</td>
                          <td className="py-2.5 px-3 text-[#9A6A75]">{formatPeriod(r)}</td>
                          <td className="py-2.5 px-3">
                            <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-xs font-medium bg-[var(--color-brand-500)]/10 text-[var(--color-brand-500)]">
                              {r.status || '—'}
                            </span>
                          </td>
                          <td className="py-2.5 px-3">
                            <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium ${isActive ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                              {isActive ? 'Active' : 'Not Active'}
                            </span>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </ChartCard>
        )}

        <ChartCard title="Recognition Values by Timmy of the Month" subtitle="">
          <RecognitionValuesPanel data={recognitionValuesTotm} title="Timmy of the Month by Timmyness" />
        </ChartCard>
      </div>
      {showSentModal && <ReviewKudosModal rows={sentRows} onClose={() => setShowSentModal(false)} title="Sent Kudos" subtitle={`${sentRows.length} kudos sent`} />}
      {showReviewModal && <ReviewKudosModal rows={reviewRows} onClose={() => setShowReviewModal(false)} title="Kudos Awaiting Review" subtitle={`${reviewRows.length} kudos still need a decision`} />}
      {showApprovedModal && <ReviewKudosModal rows={approvedRows} onClose={() => setShowApprovedModal(false)} title="Approved Kudos" subtitle={`${approvedRows.length} kudos approved`} />}
      {showRejectedModal && <ReviewKudosModal rows={rejectedRows} onClose={() => setShowRejectedModal(false)} title="Rejected Kudos" subtitle={`${rejectedRows.length} kudos rejected`} />}
      {showReceivedModal && <ReviewKudosModal rows={receivedRows} onClose={() => setShowReceivedModal(false)} title="Received Kudos" subtitle={`${receivedRows.length} kudos received`} />}
      {showTotmModal && <TotmDeptModal dept="All Departments" rows={timmyOfTheMonth} onClose={() => setShowTotmModal(false)} />}
      {selectedTotmDept && <TotmDeptModal dept={selectedTotmDept.dept} rows={selectedTotmDept.rows} onClose={() => setSelectedTotmDept(null)} />}
    </div>
  );
}
