import { useMemo, useState } from 'react';
import { useData } from '@/context/DataContext';
import { PageHeader, SearchInput, DataTable, SortHeader } from '@/components/ui/unified-components';
import DetailModal from '@/components/ui/DetailModal';

type SortKey = 'name' | 'department' | 'club' | 'learning' | 'kudosRec' | 'kudosSent' | 'totm';
type SortDir = 'asc' | 'desc';

interface EmployeeRow {
  name: string;
  department: string;
  club: number;
  learning: number;
  kudosRec: number;
  kudosSent: number;
  totm: number;
  clubDetails: { label: string; sub?: string; date?: string }[];
  learningDetails: { label: string; sub?: string; date?: string }[];
  kudosRecDetails: { label: string; sub?: string; date?: string }[];
  kudosSentDetails: { label: string; sub?: string; date?: string }[];
  totmDetails: { label: string; sub?: string; date?: string }[];
}

interface ModalState {
  open: boolean;
  title: string;
  subtitle: string;
  items: { label: string; sub?: string; date?: string }[];
}

export default function DepartmentAnalytics() {
  const { raw, filtered, filters } = useData();
  const [search, setSearch] = useState('');
  const [sort, setSort] = useState<{ key: SortKey; dir: SortDir }>({ key: 'department', dir: 'asc' });
  const [modal, setModal] = useState<ModalState>({ open: false, title: '', subtitle: '', items: [] });

  const activeEmployees = useMemo(() => {
    return raw.employees.filter((e) => {
      if (!e.name || e.name.trim() === '') return false;
      if (e.status !== 'Active') return false;
      if (filters.department !== 'All' && e.department !== filters.department) return false;
      if (filters.location !== 'All' && e.location !== filters.location) return false;
      return true;
    });
  }, [raw.employees, filters.department, filters.location]);

  const rows = useMemo<EmployeeRow[]>(() => {
    return activeEmployees.map((e) => {
      const email = e.email.toLowerCase().trim();

      /* ── CLUB: hitung berapa kali per club ───────────────────────────── */
      const clubAttendance = filtered.club.filter((r) => r.email?.toLowerCase().trim() === email);
      const clubCount = clubAttendance.length;

      const clubCounts = new Map<string, number>();
      clubAttendance.forEach((r) => {
        if (!r.club) return;
        clubCounts.set(r.club, (clubCounts.get(r.club) || 0) + 1);
      });
      const clubDetails = Array.from(clubCounts.entries())
        .sort(([a], [b]) => a.localeCompare(b))
        .map(([name, count]) => ({
          label: name,
          sub: `${count} time${count !== 1 ? 's' : ''}`,
        }));

      /* ── LEARNING ──────────────────────────────────────────────────────── */
      const seenSessions = new Set<string>();
      const learningDetails = filtered.inClass
        .filter((r) => r.email?.toLowerCase().trim() === email)
        .filter((r) => {
          const key = `${r.course}__${r.date}`;
          if (seenSessions.has(key)) return false;
          seenSessions.add(key);
          return true;
        })
        .map((r) => ({ label: r.course || 'Unknown Course', sub: `${r.learningHours}h` }));

      /* ── KUDOS RECEIVED ──────────────────────────────────────────────── */
      const kudosRecDetails = filtered.kudos
        .filter((r) => r.receiverEmail?.toLowerCase().trim() === email && r.workflowStatus === 'APPROVED')
        .map((r) => ({ label: `From ${r.senderName || 'Unknown'}`, sub: r.value || '' }));

      /* ── KUDOS SENT ──────────────────────────────────────────────────── */
      const kudosSentDetails = filtered.kudos
        .filter((r) => r.senderEmail?.toLowerCase().trim() === email && r.workflowStatus === 'APPROVED')
        .map((r) => ({ label: `To ${r.receiverName || 'Unknown'}`, sub: r.value || '' }));

      /* ── TOTM ────────────────────────────────────────────────────────── */
      const totmDetails = filtered.timmyOfTheMonth
        .filter((r) => r.email?.toLowerCase().trim() === email)
        .map((r) => ({ label: `Timmy of the Month`, sub: r.status || '', date: `${r.year}-${String(r.month || 1).padStart(2, '0')}` }));

      return {
        name: e.name,
        department: e.department,
        club: clubCount,
        learning: learningDetails.reduce((s, r) => s + (parseInt(r.sub?.replace('h', '') || '0')), 0),
        kudosRec: kudosRecDetails.length,
        kudosSent: kudosSentDetails.length,
        totm: totmDetails.length,
        clubDetails,
        learningDetails,
        kudosRecDetails,
        kudosSentDetails,
        totmDetails,
      };
    });
  }, [activeEmployees, filtered]);

  const { key, dir } = sort;
  const mult = dir === 'asc' ? 1 : -1;
  const sortedRows = useMemo(() => {
    const data = [...rows];
    data.sort((a, b) => {
      const av = a[key];
      const bv = b[key];
      if (typeof av === 'number' && typeof bv === 'number') {
        if (av !== bv) return (av - bv) * mult;
      }
      return String(av).localeCompare(String(bv)) * mult || String(a.name).localeCompare(String(b.name));
    });
    return data;
  }, [rows, key, mult]);

  const filteredRows = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return sortedRows;
    return sortedRows.filter((r) => r.name.toLowerCase().includes(q) || r.department.toLowerCase().includes(q));
  }, [sortedRows, search]);

  const toggleSort = (k: SortKey) => setSort((p) => ({ key: k, dir: p.key === k && p.dir === 'asc' ? 'desc' : 'asc' }));

  const openModal = (title: string, subtitle: string, items: { label: string; sub?: string; date?: string }[]) => {
    setModal({ open: true, title, subtitle, items });
  };

  const cellClass = (value: number): string => (value === 0 ? 'cell-zero' : '');

  const ClickableCell = ({ value, onClick, className }: { value: number; onClick: () => void; className?: string }) => (
    <button
      onClick={onClick}
      className={`w-full text-center font-semibold tabular hover:opacity-70 transition-opacity ${className || ''}`}
    >
      {value}
    </button>
  );

  const columns = [
    { key: 'name', header: <SortHeader label="Name" active={sort.key === 'name'} onClick={() => toggleSort('name')} />, cell: (r: EmployeeRow) => <span className="font-medium">{r.name}</span> },
    { key: 'department', header: <SortHeader label="Department" active={sort.key === 'department'} onClick={() => toggleSort('department')} />, cell: (r: EmployeeRow) => r.department },
    {
      key: 'club',
      header: <div className="text-center"><SortHeader label="IDN Club" active={sort.key === 'club'} onClick={() => toggleSort('club')} /></div>,
      cell: (r: EmployeeRow) => (
        <ClickableCell value={r.club} className={cellClass(r.club)} onClick={() => openModal(r.name, 'IDN Club Participation', r.clubDetails)} />
      ),
      className: 'cell-numeric',
    },
    {
      key: 'learning',
      header: <div className="text-center"><SortHeader label="Learning Hours" active={sort.key === 'learning'} onClick={() => toggleSort('learning')} /></div>,
      cell: (r: EmployeeRow) => (
        <ClickableCell value={r.learning} className={cellClass(r.learning)} onClick={() => openModal(r.name, 'Learning Sessions', r.learningDetails)} />
      ),
      className: 'cell-numeric',
    },
    {
      key: 'kudosRec',
      header: <div className="text-center"><SortHeader label="Kudos Received" active={sort.key === 'kudosRec'} onClick={() => toggleSort('kudosRec')} /></div>,
      cell: (r: EmployeeRow) => (
        <ClickableCell value={r.kudosRec} className={cellClass(r.kudosRec)} onClick={() => openModal(r.name, 'Kudos Received', r.kudosRecDetails)} />
      ),
      className: 'cell-numeric',
    },
    {
      key: 'kudosSent',
      header: <div className="text-center"><SortHeader label="Kudos Sent" active={sort.key === 'kudosSent'} onClick={() => toggleSort('kudosSent')} /></div>,
      cell: (r: EmployeeRow) => (
        <ClickableCell value={r.kudosSent} className={cellClass(r.kudosSent)} onClick={() => openModal(r.name, 'Kudos Sent', r.kudosSentDetails)} />
      ),
      className: 'cell-numeric',
    },
    {
      key: 'totm',
      header: <div className="text-center"><SortHeader label="TOTM" active={sort.key === 'totm'} onClick={() => toggleSort('totm')} /></div>,
      cell: (r: EmployeeRow) => (
        <ClickableCell value={r.totm} className={cellClass(r.totm)} onClick={() => openModal(r.name, 'Timmy of the Month', r.totmDetails)} />
      ),
      className: 'cell-numeric',
    },
  ];

  return (
    <div className="page-container">
      <PageHeader title="Active Timmy List" subtitle="A consolidated view of all active Timmy, including IDN Club participation, Learning Hours, and Recognition activity." />
      <div className="flex items-center gap-3 flex-wrap">
        <SearchInput value={search} onChange={setSearch} placeholder="Search name or department…" />
        <span className="text-xs text-[var(--color-text-muted)]">Showing {filteredRows.length} of {sortedRows.length} active employees</span>
      </div>
      <DataTable columns={columns} data={filteredRows} emptyMessage="No active employees match this search." />
      <DetailModal
        isOpen={modal.open}
        onClose={() => setModal((m) => ({ ...m, open: false }))}
        title={modal.title}
        subtitle={modal.subtitle}
        items={modal.items}
      />
    </div>
  );
}
