import { useMemo } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Building2, Users, BookOpen, Heart, Trophy, Calendar, TrendingUp, BarChart3 } from 'lucide-react';
import { DeptDataProvider, useDeptDataContext } from '@/context/DeptDataProvider';
import DeptAccessUnavailable from '@/components/DeptAccessUnavailable';
import { PageHeader } from '@/components/ui/unified-components';

// ─────────────────────────────────────────────────────────────────────────
// KPI Card Component
// ─────────────────────────────────────────────────────────────────────────
function KpiCard({
  icon: Icon,
  label,
  value,
  sub,
  color = 'accent',
}: {
  icon: React.ElementType;
  label: string;
  value: string | number;
  sub?: string;
  color?: 'accent' | 'success' | 'warning' | 'danger';
}) {
  const colorMap = {
    accent: 'text-[var(--color-accent)] bg-[var(--color-accent)]/10',
    success: 'text-emerald-600 bg-emerald-50',
    warning: 'text-amber-600 bg-amber-50',
    danger: 'text-rose-600 bg-rose-50',
  };

  return (
    <div className="rounded-2xl bg-[var(--color-surface)] border border-[var(--color-border-subtle)] p-5 shadow-sm hover:shadow-md transition-shadow">
      <div className="flex items-start justify-between">
        <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${colorMap[color]}`}>
          <Icon className="w-5 h-5" />
        </div>
      </div>
      <div className="mt-4">
        <p className="text-3xl font-bold text-[var(--color-text-primary)] tabular">{value}</p>
        <p className="text-sm font-medium text-[var(--color-text-secondary)] mt-1">{label}</p>
        {sub && <p className="text-xs text-[var(--color-text-muted)] mt-1">{sub}</p>}
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────
// Section Header
// ─────────────────────────────────────────────────────────────────────────
function SectionHeader({ icon: Icon, title }: { icon: React.ElementType; title: string }) {
  return (
    <div className="flex items-center gap-2 mb-4">
      <Icon className="w-5 h-5 text-[var(--color-accent)]" />
      <h2 className="text-lg font-semibold text-[var(--color-text-primary)]">{title}</h2>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────
// Simple Table
// ─────────────────────────────────────────────────────────────────────────
function SimpleTable({
  headers,
  rows,
  emptyMsg = 'No data available.',
}: {
  headers: string[];
  rows: (string | number)[][];
  emptyMsg?: string;
}) {
  if (rows.length === 0) {
    return (
      <div className="text-center py-8 text-sm text-[var(--color-text-muted)] bg-[var(--color-surface)] rounded-xl border border-[var(--color-border-subtle)]">
        {emptyMsg}
      </div>
    );
  }

  return (
    <div className="overflow-x-auto rounded-xl border border-[var(--color-border-subtle)] bg-[var(--color-surface)]">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-[var(--color-border-subtle)] bg-[var(--color-canvas)]">
            {headers.map((h, i) => (
              <th key={i} className="text-left px-4 py-3 font-semibold text-[var(--color-text-secondary)]">
                {h}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((row, ri) => (
            <tr key={ri} className="border-b border-[var(--color-border-subtle)] last:border-0 hover:bg-[var(--color-canvas)]/50 transition-colors">
              {row.map((cell, ci) => (
                <td key={ci} className="px-4 py-3 text-[var(--color-text-primary)]">
                  {cell}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────
// Report Content (renders after token validated & data loaded)
// ─────────────────────────────────────────────────────────────────────────
function ReportContent() {
  const { department, data, isAdmin } = useDeptDataContext();

  const metrics = useMemo(() => {
    if (!data) return null;

    const activeCount = data.employees?.length || 0;
    const nonActiveCount = data.nonActiveEmployees?.length || 0;
    const totalEmployees = activeCount + nonActiveCount;

    // Learning hours
    const learningHours = (data.inClass || []).reduce((sum: number, r: any) => {
      const h = parseFloat(r['Learning Hours'] || r['learningHours'] || 0);
      return sum + (isNaN(h) ? 0 : h);
    }, 0);

    // Kudos
    const kudosApproved = (data.kudos || []).filter(
      (r: any) => String(r['Workflow Status'] || r['workflowStatus'] || '').toUpperCase() === 'APPROVED'
    ).length;

    // Club participants (unique emails)
    const clubEmails = new Set(
      (data.club || []).map((r: any) => String(r['Email'] || r['email'] || '').toLowerCase().trim()).filter(Boolean)
    );
    const clubParticipants = clubEmails.size;
    const clubRate = activeCount > 0 ? Math.round((clubParticipants / activeCount) * 100) : 0;

    // TOTM count
    const totmCount = (data.timmyOfTheMonth || []).length;

    // Recent club attendance (last 10)
    const recentClub = (data.club || [])
      .slice(-10)
      .reverse()
      .map((r: any) => [
        r['Name'] || r['name'] || 'Unknown',
        r['Club'] || r['club'] || 'Unknown',
        r['Date'] || r['date'] || '-',
      ]);

    // Recent learning (last 10)
    const recentLearning = (data.inClass || [])
      .slice(-10)
      .reverse()
      .map((r: any) => [
        r['Name'] || r['name'] || 'Unknown',
        r['Course'] || r['course'] || 'Unknown',
        `${r['Learning Hours'] || r['learningHours'] || 0}h`,
        r['Date'] || r['date'] || '-',
      ]);

    // Recent kudos (last 10 approved)
    const recentKudos = (data.kudos || [])
      .filter((r: any) => String(r['Workflow Status'] || r['workflowStatus'] || '').toUpperCase() === 'APPROVED')
      .slice(-10)
      .reverse()
      .map((r: any) => [
        r['Receiver Name'] || r['receiverName'] || 'Unknown',
        r['Sender Name'] || r['senderName'] || 'Unknown',
        r['Value'] || r['value'] || '-',
        r['Date'] || r['date'] || '-',
      ]);

    return {
      activeCount,
      nonActiveCount,
      totalEmployees,
      learningHours,
      kudosApproved,
      clubParticipants,
      clubRate,
      totmCount,
      recentClub,
      recentLearning,
      recentKudos,
    };
  }, [data]);

  if (!metrics) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[var(--color-accent)]" />
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto p-6 space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-[var(--color-accent)]/10 flex items-center justify-center">
              <Building2 className="w-6 h-6 text-[var(--color-accent)]" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-[var(--color-text-primary)]">
                {department === 'ALL' ? 'Organization Overview' : `${department} Report`}
              </h1>
              <p className="text-sm text-[var(--color-text-muted)]">
                {isAdmin ? 'Full administrative access' : 'Department-specific view'}
              </p>
            </div>
          </div>
        </div>
        <div className="text-right">
          <p className="text-xs text-[var(--color-text-muted)]">Report generated</p>
          <p className="text-sm font-medium text-[var(--color-text-secondary)]">
            {new Date().toLocaleDateString('id-ID', {
              weekday: 'long',
              year: 'numeric',
              month: 'long',
              day: 'numeric',
            })}
          </p>
        </div>
      </div>

      {/* KPI Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <KpiCard
          icon={Users}
          label="Active Employees"
          value={metrics.activeCount}
          sub={`${metrics.totalEmployees} total (incl. non-active)`}
          color="accent"
        />
        <KpiCard
          icon={BookOpen}
          label="Learning Hours"
          value={metrics.learningHours}
          sub="In-class sessions"
          color="success"
        />
        <KpiCard
          icon={Heart}
          label="Kudos Received"
          value={metrics.kudosApproved}
          sub="Approved only"
          color="warning"
        />
        <KpiCard
          icon={Trophy}
          label="Club Participation"
          value={`${metrics.clubRate}%`}
          sub={`${metrics.clubParticipants} of ${metrics.activeCount} employees`}
          color="accent"
        />
      </div>

      {/* TOTM Banner */}
      {metrics.totmCount > 0 && (
        <div className="rounded-2xl bg-gradient-to-r from-amber-50 to-orange-50 border border-amber-200 p-5 flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-amber-100 flex items-center justify-center">
            <Trophy className="w-6 h-6 text-amber-600" />
          </div>
          <div>
            <p className="text-lg font-bold text-amber-800">{metrics.totmCount} Timmy of the Month</p>
            <p className="text-sm text-amber-700">
              Your department has {metrics.totmCount} TOTM award{metrics.totmCount !== 1 ? 's' : ''} this period.
            </p>
          </div>
        </div>
      )}

      {/* Recent Activity Tables */}
      <div className="space-y-6">
        <SectionHeader icon={Calendar} title="Recent Club Attendance" />
        <SimpleTable
          headers={['Name', 'Club', 'Date']}
          rows={metrics.recentClub}
          emptyMsg="No recent club attendance recorded."
        />

        <SectionHeader icon={TrendingUp} title="Recent Learning Activity" />
        <SimpleTable
          headers={['Name', 'Course', 'Hours', 'Date']}
          rows={metrics.recentLearning}
          emptyMsg="No recent learning activity recorded."
        />

        <SectionHeader icon={Heart} title="Recent Kudos (Approved)" />
        <SimpleTable
          headers={['Receiver', 'Sender', 'Value', 'Date']}
          rows={metrics.recentKudos}
          emptyMsg="No approved kudos recorded."
        />
      </div>

      {/* Footer */}
      <div className="pt-8 border-t border-[var(--color-border-subtle)] text-center">
        <p className="text-xs text-[var(--color-text-muted)]">
          This report is generated automatically from the IDN Employee Experience Dashboard.
          Data is filtered server-side for your department only.
        </p>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────
// Loading State
// ─────────────────────────────────────────────────────────────────────────
function LoadingState() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-[var(--color-canvas)]">
      <div className="text-center space-y-4">
        <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-[var(--color-accent)] mx-auto" />
        <p className="text-sm text-[var(--color-text-muted)]">Verifying access & loading report...</p>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────
// Main Page Component
// ─────────────────────────────────────────────────────────────────────────
export default function DeptReportPage() {
  const [searchParams] = useSearchParams();
  const token = searchParams.get('t') || searchParams.get('token');

  // No token in URL
  if (!token) {
    return <DeptAccessUnavailable reason="missing" />;
  }

  return (
    <DeptDataProvider token={token}>
      <DeptReportInner />
    </DeptDataProvider>
  );
}

function DeptReportInner() {
  const { status, error, loading } = useDeptDataContext();

  if (status === 'resolving' || loading) {
    return <LoadingState />;
  }

  if (status === 'invalid') {
    return <DeptAccessUnavailable reason="invalid" message={error || undefined} />;
  }

  if (status === 'error') {
    return <DeptAccessUnavailable reason="error" message={error || undefined} />;
  }

  if (status === 'valid') {
    return <ReportContent />;
  }

  return <DeptAccessUnavailable reason="error" message="Unexpected state." />;
}
