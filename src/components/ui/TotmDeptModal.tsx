import { X, Trophy } from 'lucide-react';
import type { TimmyOfTheMonthRecord } from '@/types';

interface Props {
  dept: string;
  rows: TimmyOfTheMonthRecord[];
  onClose: () => void;
}

function formatPeriod(r: TimmyOfTheMonthRecord): string {
  if (r.rawDate) {
    return new Date(r.rawDate).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' });
  }
  if (r.month) {
    const months = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
    return `${months[r.month - 1]} ${r.year}`;
  }
  return String(r.year || '');
}

export default function TotmDeptModal({ dept, rows, onClose }: Props) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/50" onClick={onClose} />

      <div
        className="relative w-full max-w-lg flex flex-col rounded-2xl border border-[var(--border-subtle)] bg-[var(--surface)] shadow-lg"
        style={{ maxHeight: '80vh' }}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-[var(--border-subtle)] shrink-0 bg-[var(--surface)] rounded-t-2xl">
          <div className="flex items-center gap-2">
            <span className="grid place-items-center w-8 h-8 rounded-lg bg-[var(--color-brand-500)]/10 text-[var(--color-brand-500)]">
              <Trophy size={16} />
            </span>
            <div>
              <h3 className="text-sm font-semibold text-[var(--text-primary)]">Timmy of the Month</h3>
              <p className="text-xs text-[var(--text-muted)]">{dept} · {rows.length} winner{rows.length !== 1 ? 's' : ''}</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-[var(--text-muted)] hover:text-[var(--text-primary)] hover:bg-[var(--canvas)]"
            aria-label="Close"
          >
            <X size={18} />
          </button>
        </div>

        {/* Column Headers */}
        <div
          className="grid grid-cols-[1fr_110px_90px] gap-2 px-5 py-2.5 border-b border-[var(--border-subtle)] text-xs font-semibold text-[var(--text-muted)] uppercase tracking-wider shrink-0"
          style={{ backgroundColor: 'var(--surface)' }}
        >
          <div>Name</div>
          <div>Period</div>
          <div>Status</div>
        </div>

        {/* Scrollable body */}
        <div className="overflow-y-auto flex-1 px-5 py-0">
          {rows.length === 0 ? (
            <p className="text-sm text-[var(--text-muted)] text-center py-10">No TOTM records for this department.</p>
          ) : (
            <div className="min-w-[300px]">
              {rows.map((r, i) => {
                // Status comes from the loader (email lookup against the Timmy
                // Active master; "Team" rows are always Active).
                const isActive = r.employeeStatusRaw === 'Active';
                const text = isActive ? 'Active' : 'Not-Active';
                return (
                  <div
                    key={i}
                    className="grid grid-cols-[1fr_110px_90px] gap-2 px-0 py-2.5 border-b border-[var(--border-subtle)] last:border-0 hover:bg-[var(--canvas)]/60 items-center"
                  >
                    <div className="font-medium text-[var(--text-primary)] text-sm truncate">{isActive ? r.name : 'Non-Active Timmy'}</div>
                    <div className="text-[var(--text-secondary)] text-sm tabular">{formatPeriod(r)}</div>
                    <div>
                      <span
                        className={`inline-block text-[11px] font-semibold px-2 py-0.5 rounded-full whitespace-nowrap ${
                          isActive
                            ? 'bg-emerald-100 text-emerald-700'
                            : 'bg-red-100 text-red-700'
                        }`}
                      >
                        {text}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
