import { useMemo, useState } from 'react';
import { Layers, X, User } from 'lucide-react';

interface Employee {
  name?: string;
  email?: string;
  department?: string;
}

interface Props {
  totalEmployees: number;
  employees: Employee[];
  clubEmails: Set<string>;
  academyEmails: Set<string>;
  kudosEmails: Set<string>;
}

interface ModalState {
  open: boolean;
  title: string;
  people: { name: string; department: string }[];
}

interface FunnelStage {
  label: string;
  count: number;
  color: string;
  segment: 'none' | 'any' | 'twoPlus' | 'allThree';
}

export default function EngagementFunnel({
  totalEmployees,
  employees,
  clubEmails,
  academyEmails,
  kudosEmails,
}: Props) {
  const [modal, setModal] = useState<ModalState>({ open: false, title: '', people: [] });

  const employeeMap = useMemo(() => {
    const map = new Map<string, Employee>();
    employees.forEach((e) => {
      const email = e.email?.toLowerCase?.().trim();
      if (email) map.set(email, e);
    });
    return map;
  }, [employees]);

  const segments = useMemo(() => {
    const allEmails = Array.from(new Set([
      ...Array.from(clubEmails),
      ...Array.from(academyEmails),
      ...Array.from(kudosEmails),
    ]));

    const segmentMap = new Map<string, string[]>();

    allEmails.forEach((email) => {
      if (!email) return;
      const programs: string[] = [];
      if (clubEmails.has(email)) programs.push('IDN Club');
      if (academyEmails.has(email)) programs.push('IDN Academy');
      if (kudosEmails.has(email)) programs.push('IDN Kudos');

      const key = programs.sort().join(' + ');
      if (!segmentMap.has(key)) segmentMap.set(key, []);
      segmentMap.get(key)!.push(email);
    });

    return Array.from(segmentMap.entries())
      .map(([key, emails]) => ({ programs: key.split(' + '), count: emails.length, label: key, emails }))
      .sort((a, b) => b.count - a.count);
  }, [clubEmails, academyEmails, kudosEmails]);

  const anySet = useMemo(() => {
    const set = new Set<string>();
    clubEmails.forEach((e) => e && set.add(e));
    academyEmails.forEach((e) => e && set.add(e));
    kudosEmails.forEach((e) => e && set.add(e));
    return set;
  }, [clubEmails, academyEmails, kudosEmails]);

  const atLeast1 = anySet.size;
  const atLeast2 = segments.filter((s) => s.programs.length >= 2).reduce((sum, s) => sum + s.count, 0);
  const all3 = segments.find((s) => s.programs.length === 3)?.count || 0;
  const noProgram = Math.max(0, totalEmployees - atLeast1);

  const funnelStages: FunnelStage[] = [
    { label: 'Total Active Employees', count: totalEmployees, color: '#8D99AF', segment: 'none' },
    { label: 'In Any Program', count: atLeast1, color: '#60A5FA', segment: 'any' },
    { label: 'In 2+ Programs', count: atLeast2, color: '#3B82F6', segment: 'twoPlus' },
    { label: 'In All 3 Programs', count: all3, color: '#2563EB', segment: 'allThree' },
  ];

  function getPeopleForSegment(segment: 'none' | 'any' | 'twoPlus' | 'allThree'): { name: string; department: string }[] {
    let emails: string[] = [];

    switch (segment) {
      case 'none':
        emails = employees
          .filter((e) => {
            const email = e.email?.toLowerCase?.().trim();
            return email && !anySet.has(email);
          })
          .map((e) => e.email!.toLowerCase().trim());
        break;
      case 'any':
        emails = Array.from(anySet);
        break;
      case 'twoPlus':
        emails = segments
          .filter((s) => s.programs.length >= 2)
          .flatMap((s) => s.emails);
        break;
      case 'allThree':
        emails = segments
          .find((s) => s.programs.length === 3)?.emails || [];
        break;
    }

    return emails
      .map((email) => employeeMap.get(email))
      .filter((e): e is Employee => !!e && !!e.name)
      .map((e) => ({ name: e.name || 'Unknown', department: e.department || '—' }))
      .sort((a, b) => a.name.localeCompare(b.name));
  }

  function openModal(label: string, segment: 'none' | 'any' | 'twoPlus' | 'allThree') {
    const people = getPeopleForSegment(segment);
    setModal({ open: true, title: label, people });
  }

  const maxVal = totalEmployees || 1;
  const stageHeight = 76;
  const gap = 6;

  const getInsets = (count: number) => {
    const ratio = count / maxVal;
    const inset = ((1 - ratio) / 2) * 100;
    return { left: inset, right: 100 - inset };
  };

  return (
    <div className="flex flex-col gap-8">
      <div className="flex flex-col lg:flex-row gap-6 items-start">
        <div className="flex-1 w-full min-w-0">
          <div className="relative w-full" style={{ maxWidth: 520, margin: '0 auto' }}>
            {funnelStages.map((stage, i) => {
              const topInsets = getInsets(stage.count);
              const bottomCount = i < funnelStages.length - 1 ? funnelStages[i + 1].count : Math.round(stage.count * 0.7);
              const bottomInsets = getInsets(bottomCount);

              const clipPath = `polygon(${topInsets.left}% 0%, ${topInsets.right}% 0%, ${bottomInsets.right}% 100%, ${bottomInsets.left}% 100%)`;
              const pct = totalEmployees > 0 ? Math.round((stage.count / totalEmployees) * 1000) / 10 : 0;

              return (
                <div key={stage.label} className="relative" style={{ height: stageHeight, marginBottom: gap }}>
                  <div
                    className="absolute inset-0 rounded-sm transition-all duration-300 hover:brightness-110 cursor-pointer"
                    style={{ clipPath, backgroundColor: stage.color }}
                    onClick={() => openModal(stage.label, stage.segment)}
                  />
                  <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                    <div className="text-center px-4">
                      <div className="text-white text-xs font-semibold uppercase tracking-wider opacity-90">
                        {stage.label}
                      </div>
                      <div className="text-white text-xl font-bold tabular leading-tight mt-0.5">
                        {stage.count.toLocaleString()}
                      </div>
                      <div className="text-white/80 text-[11px] font-medium tabular">
                        {pct}% of Total
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        <div className="w-full lg:w-64 shrink-0 flex flex-col gap-3">
          <div className="rounded-xl border border-[var(--color-border-subtle)] bg-[var(--color-surface)] p-4">
            <h4 className="text-xs font-bold uppercase tracking-wider text-[var(--color-brand-500)] mb-3 flex items-center gap-1.5">
              <User size={13} />
              Summary
            </h4>
            <div className="flex flex-col gap-3">
              {funnelStages.map((stage) => (
                <button
                  key={stage.label}
                  onClick={() => openModal(stage.label, stage.segment)}
                  className="flex items-center gap-3 text-left w-full group hover:opacity-80 transition-opacity"
                >
                  <span className="w-3 h-3 rounded-full shrink-0" style={{ backgroundColor: stage.color }} />
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-medium text-[var(--color-text-secondary)] truncate">{stage.label}</p>
                    <p className="text-sm font-bold tabular text-[var(--color-text-primary)]">{stage.count.toLocaleString()}</p>
                  </div>
                </button>
              ))}

              <div className="pt-2 border-t border-[var(--color-border-subtle)]">
                <button
                  onClick={() => openModal('In No Program', 'none')}
                  className="flex items-center gap-3 text-left w-full hover:opacity-80 transition-opacity"
                >
                  <span className="w-3 h-3 rounded-full shrink-0 bg-[#9CA3AF]" />
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-medium text-[var(--color-text-secondary)]">In No Program</p>
                    <p className="text-sm font-bold tabular text-[var(--color-text-primary)]">
                      {noProgram.toLocaleString()}
                      <span className="text-xs font-normal text-[var(--color-text-muted)] ml-1">
                        ({totalEmployees > 0 ? Math.round((noProgram / totalEmployees) * 1000) / 10 : 0}%)
                      </span>
                    </p>
                  </div>
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {segments.length > 0 && (
        <div>
          <h4 className="text-xs font-bold uppercase tracking-wider text-[var(--color-brand-500)] mb-3 flex items-center gap-1.5">
            <Layers size={13} />
            Program Combination Breakdown
          </h4>
          <div className="flex flex-col gap-2">
            {segments.map((seg) => (
              <button
                key={seg.label}
                onClick={() => {
                  const people = seg.emails
                    .map((email) => employeeMap.get(email))
                    .filter((e): e is Employee => !!e && !!e.name)
                    .map((e) => ({ name: e.name || 'Unknown', department: e.department || '—' }))
                    .sort((a, b) => a.name.localeCompare(b.name));
                  setModal({ open: true, title: seg.label, people });
                }}
                className="flex items-center justify-between px-3 py-2.5 rounded-lg hover:opacity-80 transition-opacity text-left w-full cursor-pointer border border-transparent hover:border-[var(--color-border-subtle)]"
                style={{ background: `${seg.programs.length >= 3 ? '#2563EB' : seg.programs.length === 2 ? '#3B82F6' : '#8D99AF'}08` }}
              >
                <div className="flex items-center gap-1.5 flex-wrap">
                  {seg.programs.map((p) => (
                    <span
                      key={p}
                      className="text-[10px] font-semibold px-2 py-0.5 rounded-full border"
                      style={{
                        background: p === 'IDN Club' ? '#ED212710' : p === 'IDN Academy' ? '#3B82F610' : '#F59E0B10',
                        borderColor: p === 'IDN Club' ? '#ED212730' : p === 'IDN Academy' ? '#3B82F630' : '#F59E0B30',
                        color: p === 'IDN Club' ? '#ED2127' : p === 'IDN Academy' ? '#3B82F6' : '#D97706',
                      }}
                    >
                      {p}
                    </span>
                  ))}
                </div>
                <span className="text-xs font-bold tabular text-[var(--color-text-primary)]">{seg.count}</span>
              </button>
            ))}
          </div>
        </div>
      )}

      {modal.open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/50" onClick={() => setModal((m) => ({ ...m, open: false }))} />
          <div className="relative w-full max-w-lg flex flex-col rounded-2xl border border-[var(--color-border-subtle)] bg-[var(--color-surface)] shadow-lg" style={{ maxHeight: '80vh' }}>
            <div className="flex items-center justify-between px-5 py-4 border-b border-[var(--color-border-subtle)] shrink-0">
              <div>
                <h3 className="text-sm font-semibold text-[var(--color-text-primary)]">{modal.title}</h3>
                <p className="text-xs text-[var(--color-text-muted)]">{modal.people.length} employee{modal.people.length !== 1 ? 's' : ''}</p>
              </div>
              <button onClick={() => setModal((m) => ({ ...m, open: false }))} className="p-1.5 rounded-lg text-[var(--color-text-muted)] hover:text-[var(--color-text-primary)] hover:bg-[var(--color-canvas)]">
                <X size={18} />
              </button>
            </div>
            <div className="overflow-y-auto flex-1 px-5 py-0">
              {modal.people.length === 0 ? (
                <p className="text-sm text-[var(--color-text-muted)] text-center py-10">No employees for this segment.</p>
              ) : (
                <div className="min-w-[300px]">
                  {modal.people.map((person, i) => (
                    <div key={person.name + i} className="grid grid-cols-[1fr_140px] gap-2 px-0 py-2.5 border-b border-[var(--color-border-subtle)] last:border-0 hover:bg-[var(--color-canvas)]/60 items-center">
                      <div className="flex items-center gap-2">
                        <span className="grid place-items-center w-6 h-6 rounded-full shrink-0 bg-[var(--color-surface-sunken)] text-[var(--color-text-muted)]">
                          <User size={12} />
                        </span>
                        <span className="font-medium text-[var(--color-text-primary)] text-sm">{person.name}</span>
                      </div>
                      <div className="text-[var(--color-text-secondary)] text-sm text-right">{person.department}</div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
