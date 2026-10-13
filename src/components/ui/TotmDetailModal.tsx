import { X, Trophy } from 'lucide-react';

interface TotmRow {
  name: string;
  department: string;
  period: string;
  rawDate: string;
  employeeStatusRaw: string;
}

export default function TotmDetailModal({ row, onClose }: { row: TotmRow; onClose: () => void }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/50" onClick={onClose} />
      <div className="relative w-full max-w-sm rounded-2xl border border-[var(--border-subtle)] bg-[var(--surface)] shadow-lg">
        <div className="flex items-center justify-between px-5 py-4 border-b border-[var(--border-subtle)]">
          <div className="flex items-center gap-2">
            <span className="grid place-items-center w-8 h-8 rounded-lg bg-[var(--color-brand-500)]/10 text-[var(--color-brand-500)]">
              <Trophy size={16} />
            </span>
            <h3 className="text-sm font-semibold text-[var(--text-primary)]">Timmy of the Month</h3>
          </div>
          <button onClick={onClose} className="p-1.5 rounded-lg text-[var(--text-muted)] hover:text-[var(--text-primary)] hover:bg-[var(--canvas)]" aria-label="Close">
            <X size={18} />
          </button>
        </div>

        <div className="px-5 py-4 flex flex-col gap-3">
          <div>
            <p className="text-xs text-[var(--text-muted)]">Name</p>
            <p className="text-sm font-medium text-[var(--text-primary)]">{row.name}</p>
          </div>
          <div>
            <p className="text-xs text-[var(--text-muted)]">Department</p>
            <p className="text-sm font-medium text-[var(--text-primary)]">{row.department}</p>
          </div>
          <div>
            <p className="text-xs text-[var(--text-muted)]">Date Awarded</p>
            <p className="text-sm font-medium text-[var(--text-primary)]">
              {row.rawDate ? new Date(row.rawDate).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' }) : row.period || '—'}
            </p>
          </div>
          <div>
            <p className="text-xs text-[var(--text-muted)]">Status</p>
            <span
              className={`inline-block text-xs font-medium px-2.5 py-1 rounded-full mt-0.5 ${
                row.employeeStatusRaw === 'Active'
                  ? 'bg-[var(--color-success)]/10 text-[var(--color-success)]'
                  : 'bg-[var(--text-muted)]/10 text-[var(--text-muted)]'
              }`}
            >
              {row.employeeStatusRaw}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
