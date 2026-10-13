import { useMemo, useState } from 'react';
import { useData } from '@/context/DataContext';
import { PageHeader, KpiCard, SearchInput, Badge } from '@/components/ui/unified-components';
import DetailModal from '@/components/ui/DetailModal';
import {
  UserPlus, GraduationCap, Briefcase, Heart, Send, Trophy, PartyPopper, Clock,
} from 'lucide-react';
import type { JourneyEvent } from '@/types';

const ICONS: Record<Exclude<JourneyEvent['type'], 'club'>, React.ComponentType<{ size?: number }>> = {
  joined: UserPlus,
  learning: GraduationCap,
  internship: Briefcase,
  kudos_received: Heart,
  kudos_sent: Send,
  timmy_of_the_month: Trophy,
};

const COLORS: Record<Exclude<JourneyEvent['type'], 'club'>, string> = {
  joined: 'var(--color-brand-500)',
  learning: 'var(--color-success)',
  internship: 'var(--color-warning)',
  kudos_received: 'var(--color-brand-600)',
  kudos_sent: 'var(--color-text-muted)',
  timmy_of_the_month: 'var(--color-info)',
};

// Counterpart names (the other side of a Kudos) are always shown,
// regardless of whether that person is still an Active Timmy.
const displayName = (name: string | undefined, _status?: string) =>
  name?.trim() || 'Unknown';

function formatTimelineDate(dateStr: string): string {
  if (!dateStr) return '';
  if (/^\d{4}\s*,?\s*Q[1-4]$/i.test(dateStr.trim())) return dateStr.trim().replace(/\s*,\s*/, ' ');
  const d = new Date(dateStr);
  if (!Number.isNaN(d.getTime())) return d.toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' });
  return dateStr;
}

function toSortTimestamp(dateStr: string): number {
  if (!dateStr) return 0;
  const qm = dateStr.trim().match(/^(\d{4})\s*,?\s*Q([1-4])$/i);
  if (qm) {
    const year = Number(qm[1]);
    const quarter = Number(qm[2]);
    const month = (quarter - 1) * 3 + 1;
    return new Date(`${year}-${String(month).padStart(2, '0')}-01`).getTime();
  }
  const d = new Date(dateStr);
  if (!Number.isNaN(d.getTime())) return d.getTime();
  return 0;
}

/* Empty-state timeline row — same alternating left/right structure and
   connector as the real timeline events, but every field is a neutral
   placeholder bar instead of real text/icon. */
function TimelineSkeletonRow({ isLeft }: { isLeft: boolean }) {
  const bars = (
    <div className={`flex flex-col gap-1.5 max-w-[240px] w-full ${isLeft ? 'items-end' : 'items-start'}`}>
      <div className="h-2.5 w-16 rounded-full bg-[var(--color-surface-sunken)]" />
      <div className="h-3.5 w-40 rounded-full bg-[var(--color-surface-sunken)]" />
    </div>
  );
  return (
    <div className="relative flex items-start min-h-[80px]">
      <div className={`hidden sm:flex flex-1 ${isLeft ? 'justify-end pr-8' : 'justify-start pl-8'}`}>
        {isLeft && bars}
      </div>
      <div className="relative z-10 flex items-center justify-center w-12 shrink-0">
        <div className="w-9 h-9 rounded-full ring-4 ring-[var(--color-surface)] shrink-0 bg-[var(--color-surface-sunken)]" />
      </div>
      <div className={`hidden sm:flex flex-1 ${!isLeft ? 'justify-start pl-8' : 'justify-end pr-8'}`}>
        {!isLeft && bars}
      </div>
      <div className="sm:hidden flex-1 pl-4">{bars}</div>
    </div>
  );
}

interface ModalState {
  open: boolean;
  title: string;
  subtitle: string;
  items: { label: string; sub?: string; date?: string }[];
}

export default function EmployeeJourney() {
  const { filtered } = useData();
  const [search, setSearch] = useState('');
  const activeEmployees = filtered.employees;
  const [selectedEmail, setSelectedEmail] = useState<string>('');
  const [clubModal, setClubModal] = useState<ModalState>({ open: false, title: '', subtitle: '', items: [] });
  const [learningModal, setLearningModal] = useState<ModalState>({ open: false, title: '', subtitle: '', items: [] });
  const [kudosRecModal, setKudosRecModal] = useState<ModalState>({ open: false, title: '', subtitle: '', items: [] });
  const [kudosSentModal, setKudosSentModal] = useState<ModalState>({ open: false, title: '', subtitle: '', items: [] });
  const [totmModal, setTotmModal] = useState<ModalState>({ open: false, title: '', subtitle: '', items: [] });
  const effectiveEmail = selectedEmail;

  const matchingEmployees = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return activeEmployees;
    return activeEmployees.filter((e) => e.name.toLowerCase().includes(q) || e.email.toLowerCase().includes(q));
  }, [activeEmployees, search]);

  const employee = activeEmployees.find((e) => e.email === effectiveEmail);

  /* ── CLUB DATA ─────────────────────────────────────────────── */
  const clubData = useMemo(() => {
    if (!employee) return [];
    const clubs = filtered.club.filter((r) => r.email === employee.email);
    const clubCounts = new Map<string, number>();
    clubs.forEach((r) => {
      if (!r.club) return;
      clubCounts.set(r.club, (clubCounts.get(r.club) || 0) + 1);
    });
    return Array.from(clubCounts.entries())
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([name, count]) => ({ label: name, sub: `${count} time${count !== 1 ? 's' : ''}` }));
  }, [employee, filtered.club]);
  const clubParticipations = useMemo(() => {
    if (!employee) return 0;
    return filtered.club.filter((r) => r.email === employee.email).length;
  }, [employee, filtered.club]);

  /* ── LEARNING DATA ─────────────────────────────────────────── */
  const learningData = useMemo(() => {
    if (!employee) return [];
    const seenSessions = new Set<string>();
    return filtered.inClass
      .filter((r) => r.email === employee.email)
      .filter((r) => {
        const key = `${r.course}__${r.date}`;
        if (seenSessions.has(key)) return false;
        seenSessions.add(key);
        return true;
      })
      .map((r) => ({ label: r.course || 'Unknown Course', sub: `${r.learningHours}h`, date: r.date }));
  }, [employee, filtered.inClass]);
  const learningHours = useMemo(() => {
    if (!employee) return 0;
    return filtered.inClass.filter((r) => r.email === employee.email).reduce((s, r) => s + r.learningHours, 0);
  }, [employee, filtered.inClass]);

  /* ── KUDOS RECEIVED DATA ─────────────────────────────────── */
  const kudosRecData = useMemo(() => {
    if (!employee) return [];
    return filtered.kudos
      .filter((r) => r.receiverEmail === employee.email && r.workflowStatus === 'APPROVED')
      .map((r) => ({ label: `From ${displayName(r.senderName, r.senderStatusRaw)}`, sub: r.value || '', date: r.created }));
  }, [employee, filtered.kudos]);
  const kudosReceived = useMemo(() => (employee ? filtered.kudos.filter((r) => r.receiverEmail === employee.email && r.workflowStatus === 'APPROVED').length : 0), [employee, filtered.kudos]);

  /* ── KUDOS SENT DATA ─────────────────────────────────────── */
  const kudosSentData = useMemo(() => {
    if (!employee) return [];
    return filtered.kudos
      .filter((r) => r.senderEmail === employee.email && r.workflowStatus === 'APPROVED')
      .map((r) => ({ label: `To ${displayName(r.receiverName, r.receiverStatusRaw)}`, sub: r.value || '', date: r.created }));
  }, [employee, filtered.kudos]);
  const kudosSent = useMemo(() => (employee ? filtered.kudos.filter((r) => r.senderEmail === employee.email && r.workflowStatus === 'APPROVED').length : 0), [employee, filtered.kudos]);

  /* ── TOTM DATA ───────────────────────────────────────────── */
  const totmData = useMemo(() => {
    if (!employee) return [];
    return filtered.timmyOfTheMonth
      .filter((r) => r.email === employee.email)
      .map((r) => ({ label: 'Timmy of the Month', sub: r.status || '', date: r.rawDate || `${r.year}-${String(r.month || 1).padStart(2, '0')}-01` }));
  }, [employee, filtered.timmyOfTheMonth]);
  const totmCount = useMemo(() => (employee ? filtered.timmyOfTheMonth.filter((r) => r.email === employee.email).length : 0), [employee, filtered.timmyOfTheMonth]);

  const joinedEvent = useMemo<JourneyEvent | null>(() => {
    if (!employee) return null;
    return { type: 'joined', date: employee.joinDateIDN, title: 'Joined IDN', detail: '' };
  }, [employee]);

  const academyEvents = useMemo<JourneyEvent[]>(() => {
    if (!employee) return [];
    const ev: JourneyEvent[] = [];
    filtered.inClass.filter((r) => r.email === employee.email).forEach((r) => ev.push({ type: 'learning', date: r.date, title: r.course, detail: `${r.learningHours}h · ${r.status}` }));
    filtered.internship.filter((r) => r.email === employee.email).forEach((r) => ev.push({ type: 'internship', date: r.date || '', title: `Internship in ${r.hostDepartment}`, detail: `${r.learningHours}h · ${r.status}` }));
    return ev.sort((a, b) => toSortTimestamp(a.date) - toSortTimestamp(b.date));
  }, [employee, filtered]);

  const recognitionEvents = useMemo<JourneyEvent[]>(() => {
    if (!employee) return [];
    const ev: JourneyEvent[] = [];
    filtered.kudos.filter((r) => r.receiverEmail === employee.email && r.workflowStatus === 'APPROVED').forEach((r) => ev.push({ type: 'kudos_received', date: r.created, title: `Kudos from ${displayName(r.senderName, r.senderStatusRaw)}`, detail: r.value }));
    filtered.kudos.filter((r) => r.senderEmail === employee.email && r.workflowStatus === 'APPROVED').forEach((r) => ev.push({ type: 'kudos_sent', date: r.created, title: `Kudos to ${displayName(r.receiverName, r.receiverStatusRaw)}`, detail: r.value }));
    filtered.timmyOfTheMonth.filter((r) => r.email === employee.email).forEach((r) => ev.push({ type: 'timmy_of_the_month', date: r.rawDate || `${r.year}-${String(r.month || 1).padStart(2, '0')}-01`, title: 'Timmy of the Month', detail: r.status || '' }));
    return ev.sort((a, b) => toSortTimestamp(a.date) - toSortTimestamp(b.date));
  }, [employee, filtered]);

  return (
    <div className="page-container">
      <PageHeader title="Timmy Journey" subtitle="Pick an active Timmy to see their complete experience profile" />

      <div className="rounded-xl border border-[var(--color-border-subtle)] bg-[var(--color-surface)] p-4 flex flex-col gap-2">
        <SearchInput value={search} onChange={setSearch} placeholder="Search name or email…" />

        {search.trim() !== '' && (
          <div className="max-h-[360px] overflow-y-auto flex flex-col gap-1">
            {matchingEmployees.length === 0 ? (
              <p className="text-xs text-[var(--color-text-muted)] text-center py-3">No matches found.</p>
            ) : (
              matchingEmployees.slice(0, 60).map((e) => (
                <button
                  key={e.email}
                  onClick={() => {
                    setSelectedEmail(e.email);
                    setSearch('');
                  }}
                  className="text-left px-3 py-2 rounded-lg text-sm text-[var(--color-text-secondary)] hover:bg-[var(--color-surface-sunken)] transition-colors"
                >
                  <p className="truncate">{e.name}</p>
                  <p className="text-xs text-[var(--color-text-muted)] truncate">{e.department}</p>
                </button>
              ))
            )}
          </div>
        )}

        {employee && search.trim() === '' && (
          <div className="px-3 py-2 rounded-lg text-sm bg-[var(--color-brand-500)]/10 text-[var(--color-brand-500)] font-medium">
            <p className="truncate">{employee.name}</p>
            <p className="text-xs text-[var(--color-text-muted)] font-normal truncate">{employee.department}</p>
          </div>
        )}
      </div>

      <div className="flex flex-col gap-6">
        {employee ? (
          <>
            <div className="rounded-xl border border-[var(--color-border-subtle)] bg-[var(--color-surface)] p-6">
              <div className="flex items-center justify-between flex-wrap gap-3">
                <div>
                  <h2 className="text-lg font-semibold text-[var(--color-text-primary)]">{employee.name}</h2>
                  <p className="text-sm text-[var(--color-text-secondary)]">{employee.positionName} · {employee.department} · {employee.location}</p>
                  </div>
                  <Badge variant="success">Active</Badge>
                </div>
              </div>
              <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
                <KpiCard label="IDN Club" value={clubParticipations.toString()} subLabel="Click to see clubs joined" icon={<PartyPopper size={17} />} onClick={() => setClubModal({ open: true, title: `${employee?.name} — IDN Club Participation`, subtitle: 'Clubs participated', items: clubData })} />
                <KpiCard label="Learning Hours" value={`${Math.round(learningHours)}h`} subLabel="Click to see learning sessions" icon={<Clock size={17} />} onClick={() => setLearningModal({ open: true, title: `${employee?.name} — Learning Sessions`, subtitle: 'Sessions attended', items: learningData })} />
                <KpiCard label="IDN Kudos: Received" value={kudosReceived.toString()} subLabel="Click to see kudos received" icon={<Heart size={17} />} onClick={() => setKudosRecModal({ open: true, title: `${employee?.name} — Kudos Received`, subtitle: 'Kudos from colleagues', items: kudosRecData })} />
                <KpiCard label="IDN Kudos: Sent" value={kudosSent.toString()} subLabel="Click to see kudos sent" icon={<Send size={17} />} onClick={() => setKudosSentModal({ open: true, title: `${employee?.name} — Kudos Sent`, subtitle: 'Kudos to colleagues', items: kudosSentData })} />
                <KpiCard label="Timmy of The Month" value={totmCount.toString()} subLabel="Click to see TOTM awards" icon={<Trophy size={17} />} onClick={() => setTotmModal({ open: true, title: `${employee?.name} — Timmy of the Month`, subtitle: 'Awards received', items: totmData })} />
              </div>

              {/* ═══════════════════════════════════════════════════════
                  LEARNING TIMELINE
                  ═══════════════════════════════════════════════════════ */}
              <div className="rounded-xl border border-[var(--color-border-subtle)] bg-[var(--color-surface)] p-6">
                <h3 className="text-sm font-semibold text-[var(--color-text-primary)] mb-6">Learning Timeline</h3>

                {/* Joined IDN */}
                {joinedEvent && (
                  <div className="relative flex flex-col gap-0 mb-8">
                    <div className="absolute left-6 sm:left-1/2 sm:-translate-x-1/2 top-0 bottom-0 w-px bg-[var(--color-border-default)]" />
                    <div className="relative flex items-start min-h-[60px]">
                      <div className="hidden sm:flex flex-1 justify-end pr-8">
                        <div className="text-right max-w-[240px]">
                          <p className="text-[11px] text-[var(--color-text-muted)] tabular">{formatTimelineDate(joinedEvent.date)}</p>
                          <p className="text-sm font-medium text-[var(--color-text-primary)]">{joinedEvent.title}</p>
                        </div>
                      </div>
                      <div className="relative z-10 flex items-center justify-center w-12 shrink-0">
                        <div className="hidden sm:block absolute top-1/2 -translate-y-1/2 w-3 h-px bg-[var(--color-border-default)] left-1/2" style={{ marginLeft: '20px' }} />
                        <div className="hidden sm:block absolute top-1/2 -translate-y-1/2 w-0 h-0" style={{ left: 'calc(50% + 20px)', borderTop: '3px solid transparent', borderBottom: '3px solid transparent', borderRight: '4px solid var(--color-border-default)' }} />
                        <div className="grid place-items-center w-9 h-9 rounded-full ring-4 ring-[var(--color-surface)] shrink-0" style={{ background: `${COLORS.joined}20`, color: COLORS.joined }}>
                          <UserPlus size={16} />
                        </div>
                      </div>
                      <div className="hidden sm:flex flex-1" />
                      <div className="sm:hidden flex-1 pl-4">
                        <p className="text-[11px] text-[var(--color-text-muted)] tabular">{formatTimelineDate(joinedEvent.date)}</p>
                        <p className="text-sm font-medium text-[var(--color-text-primary)]">{joinedEvent.title}</p>
                      </div>
                    </div>
                  </div>
                )}

                {/* Academy Events */}
                {academyEvents.length > 0 && (
                  <div className="relative flex flex-col gap-0">
                    <div className="absolute left-6 sm:left-1/2 sm:-translate-x-1/2 top-0 bottom-0 w-px bg-[var(--color-border-default)]" />
                    {academyEvents.map((ev, i) => {
                      const Icon = ICONS[ev.type as Exclude<JourneyEvent['type'], 'club'>];
                      const color = COLORS[ev.type as Exclude<JourneyEvent['type'], 'club'>];
                      const isLeft = i % 2 === 0;
                      return (
                        <div key={`acad-${i}`} className="relative flex items-start min-h-[80px]">
                          <div className={`hidden sm:flex flex-1 ${isLeft ? 'justify-end pr-8' : 'justify-start pl-8'}`}>
                            {isLeft && (
                              <div className="text-right max-w-[240px]">
                                <p className="text-[11px] text-[var(--color-text-muted)] tabular">{formatTimelineDate(ev.date)}</p>
                                <p className="text-sm font-medium text-[var(--color-text-primary)]">{ev.title}</p>
                                {ev.detail && <p className="text-xs text-[var(--color-text-secondary)]">{ev.detail}</p>}
                              </div>
                            )}
                          </div>
                          <div className="relative z-10 flex items-center justify-center w-12 shrink-0">
                            <div className={`hidden sm:block absolute top-1/2 -translate-y-1/2 w-3 h-px bg-[var(--color-border-default)] ${isLeft ? 'left-1/2' : 'right-1/2'}`} style={{ [isLeft ? 'marginLeft' : 'marginRight']: '20px' }} />
                            <div className="hidden sm:block absolute top-1/2 -translate-y-1/2 w-0 h-0" style={{ [isLeft ? 'left' : 'right']: 'calc(50% + 20px)', borderTop: '3px solid transparent', borderBottom: '3px solid transparent', [isLeft ? 'borderRight' : 'borderLeft']: '4px solid var(--color-border-default)' }} />
                            <div className="grid place-items-center w-9 h-9 rounded-full ring-4 ring-[var(--color-surface)] shrink-0" style={{ background: `${color}20`, color }}>
                              <Icon size={16} />
                            </div>
                          </div>
                          <div className={`hidden sm:flex flex-1 ${!isLeft ? 'justify-start pl-8' : 'justify-end pr-8'}`}>
                            {!isLeft && (
                              <div className="text-left max-w-[240px]">
                                <p className="text-[11px] text-[var(--color-text-muted)] tabular">{formatTimelineDate(ev.date)}</p>
                                <p className="text-sm font-medium text-[var(--color-text-primary)]">{ev.title}</p>
                                {ev.detail && <p className="text-xs text-[var(--color-text-secondary)]">{ev.detail}</p>}
                              </div>
                            )}
                          </div>
                          <div className="sm:hidden flex-1 pl-4">
                            <p className="text-[11px] text-[var(--color-text-muted)] tabular">{formatTimelineDate(ev.date)}</p>
                            <p className="text-sm font-medium text-[var(--color-text-primary)]">{ev.title}</p>
                            {ev.detail && <p className="text-xs text-[var(--color-text-secondary)]">{ev.detail}</p>}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}

                {academyEvents.length === 0 && (
                  <p className="text-sm text-[var(--color-text-muted)] text-center py-10">No learning events for this employee.</p>
                )}
              </div>

              {/* ═══════════════════════════════════════════════════════
                  RECOGNITION TIMELINE
                  ═══════════════════════════════════════════════════════ */}
              <div className="rounded-xl border border-[var(--color-border-subtle)] bg-[var(--color-surface)] p-6">
                <h3 className="text-sm font-semibold text-[var(--color-text-primary)] mb-6">Recognition Timeline</h3>

                {recognitionEvents.length > 0 ? (
                  <div className="relative flex flex-col gap-0">
                    <div className="absolute left-6 sm:left-1/2 sm:-translate-x-1/2 top-0 bottom-0 w-px bg-[var(--color-border-default)]" />
                    {recognitionEvents.map((ev, i) => {
                      const Icon = ICONS[ev.type as Exclude<JourneyEvent['type'], 'club'>];
                      const color = COLORS[ev.type as Exclude<JourneyEvent['type'], 'club'>];
                      const isLeft = i % 2 === 0;
                      return (
                        <div key={`recog-${i}`} className="relative flex items-start min-h-[80px]">
                          <div className={`hidden sm:flex flex-1 ${isLeft ? 'justify-end pr-8' : 'justify-start pl-8'}`}>
                            {isLeft && (
                              <div className="text-right max-w-[240px]">
                                <p className="text-[11px] text-[var(--color-text-muted)] tabular">{formatTimelineDate(ev.date)}</p>
                                <p className="text-sm font-medium text-[var(--color-text-primary)]">{ev.title}</p>
                                {ev.detail && <p className="text-xs text-[var(--color-text-secondary)]">{ev.detail}</p>}
                              </div>
                            )}
                          </div>
                          <div className="relative z-10 flex items-center justify-center w-12 shrink-0">
                            <div className={`hidden sm:block absolute top-1/2 -translate-y-1/2 w-3 h-px bg-[var(--color-border-default)] ${isLeft ? 'left-1/2' : 'right-1/2'}`} style={{ [isLeft ? 'marginLeft' : 'marginRight']: '20px' }} />
                            <div className="hidden sm:block absolute top-1/2 -translate-y-1/2 w-0 h-0" style={{ [isLeft ? 'left' : 'right']: 'calc(50% + 20px)', borderTop: '3px solid transparent', borderBottom: '3px solid transparent', [isLeft ? 'borderRight' : 'borderLeft']: '4px solid var(--color-border-default)' }} />
                            <div className="grid place-items-center w-9 h-9 rounded-full ring-4 ring-[var(--color-surface)] shrink-0" style={{ background: `${color}20`, color }}>
                              <Icon size={16} />
                            </div>
                          </div>
                          <div className={`hidden sm:flex flex-1 ${!isLeft ? 'justify-start pl-8' : 'justify-end pr-8'}`}>
                            {!isLeft && (
                              <div className="text-left max-w-[240px]">
                                <p className="text-[11px] text-[var(--color-text-muted)] tabular">{formatTimelineDate(ev.date)}</p>
                                <p className="text-sm font-medium text-[var(--color-text-primary)]">{ev.title}</p>
                                {ev.detail && <p className="text-xs text-[var(--color-text-secondary)]">{ev.detail}</p>}
                              </div>
                            )}
                          </div>
                          <div className="sm:hidden flex-1 pl-4">
                            <p className="text-[11px] text-[var(--color-text-muted)] tabular">{formatTimelineDate(ev.date)}</p>
                            <p className="text-sm font-medium text-[var(--color-text-primary)]">{ev.title}</p>
                            {ev.detail && <p className="text-xs text-[var(--color-text-secondary)]">{ev.detail}</p>}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  <p className="text-sm text-[var(--color-text-muted)] text-center py-10">No recognition events for this employee.</p>
                )}
              </div>
            </>
          ) : (
            <>
              {/* Profile header — same shell, readable placeholder text instead of a real name/dept/status */}
              <div className="rounded-xl border border-[var(--color-border-subtle)] bg-[var(--color-surface)] p-6">
                <div className="flex items-center justify-between flex-wrap gap-3">
                  <div>
                    <h2 className="text-lg font-semibold text-[var(--color-text-muted)]">Timmy</h2>
                    <p className="text-sm text-[var(--color-text-muted)]">Position Name · Dept · Location</p>
                  </div>
                  <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-[var(--color-surface-sunken)] text-[var(--color-text-muted)]">
                    Status
                  </span>
                </div>
              </div>

              {/* KPI grid — same labels/icons as the real cards, value blanked out and non-clickable */}
              <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
                <KpiCard label="IDN Club" value="–" icon={<PartyPopper size={17} />} />
                <KpiCard label="Learning Hours" value="–" icon={<Clock size={17} />} />
                <KpiCard label="IDN Kudos: Received" value="–" icon={<Heart size={17} />} />
                <KpiCard label="IDN Kudos: Sent" value="–" icon={<Send size={17} />} />
                <KpiCard label="Timmy of The Month" value="–" icon={<Trophy size={17} />} />
              </div>

              {/* Learning Timeline — same card + connector line, placeholder rows */}
              <div className="rounded-xl border border-[var(--color-border-subtle)] bg-[var(--color-surface)] p-6">
                <h3 className="text-sm font-semibold text-[var(--color-text-primary)] mb-6">Learning Timeline</h3>
                <div className="relative flex flex-col gap-0">
                  <div className="absolute left-6 sm:left-1/2 sm:-translate-x-1/2 top-0 bottom-0 w-px bg-[var(--color-border-default)]" />
                  <TimelineSkeletonRow isLeft />
                  <TimelineSkeletonRow isLeft={false} />
                  <TimelineSkeletonRow isLeft />
                </div>
              </div>

              {/* Recognition Timeline — same card + connector line, placeholder rows */}
              <div className="rounded-xl border border-[var(--color-border-subtle)] bg-[var(--color-surface)] p-6">
                <h3 className="text-sm font-semibold text-[var(--color-text-primary)] mb-6">Recognition Timeline</h3>
                <div className="relative flex flex-col gap-0">
                  <div className="absolute left-6 sm:left-1/2 sm:-translate-x-1/2 top-0 bottom-0 w-px bg-[var(--color-border-default)]" />
                  <TimelineSkeletonRow isLeft={false} />
                  <TimelineSkeletonRow isLeft />
                </div>
              </div>
            </>
          )}
      </div>

      {/* Modals */}
      <DetailModal isOpen={clubModal.open} onClose={() => setClubModal((m) => ({ ...m, open: false }))} title={clubModal.title} subtitle={clubModal.subtitle} items={clubModal.items} />
      <DetailModal isOpen={learningModal.open} onClose={() => setLearningModal((m) => ({ ...m, open: false }))} title={learningModal.title} subtitle={learningModal.subtitle} items={learningModal.items} />
      <DetailModal isOpen={kudosRecModal.open} onClose={() => setKudosRecModal((m) => ({ ...m, open: false }))} title={kudosRecModal.title} subtitle={kudosRecModal.subtitle} items={kudosRecModal.items} />
      <DetailModal isOpen={kudosSentModal.open} onClose={() => setKudosSentModal((m) => ({ ...m, open: false }))} title={kudosSentModal.title} subtitle={kudosSentModal.subtitle} items={kudosSentModal.items} />
      <DetailModal isOpen={totmModal.open} onClose={() => setTotmModal((m) => ({ ...m, open: false }))} title={totmModal.title} subtitle={totmModal.subtitle} items={totmModal.items} />
    </div>
  );
}