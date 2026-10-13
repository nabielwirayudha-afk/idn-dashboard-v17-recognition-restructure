import { X, Briefcase } from 'lucide-react';

interface InternshipRow {
  name: string;
  homeDepartment: string;
  hostDepartment: string;
  year: number;
  quarter: number;
}

interface Props {
  rows: InternshipRow[];
  onClose: () => void;
}

export default function InternshipDetailModal({ rows, onClose }: Props) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/50" onClick={onClose} />

      <div
        className="relative w-full max-w-3xl flex flex-col rounded-2xl border border-[var(--border-subtle)] bg-[var(--surface)] shadow-lg"
        style={{ maxHeight: '80vh' }}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-[var(--border-subtle)] shrink-0 bg-[var(--surface)] rounded-t-2xl">
          <div className="flex items-center gap-2">
            <span className="grid place-items-center w-8 h-8 rounded-lg bg-[var(--color-brand-500)]/10 text-[var(--color-brand-500)]">
              <Briefcase size={16} />
            </span>
            <div>
              <h3 className="text-sm font-semibold text-[var(--text-primary)]">Internal Internship Detail</h3>
              <p className="text-xs text-[var(--text-muted)]">{rows.length} participant{rows.length !== 1 ? 's' : ''}</p>
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

        {/* Table with sticky header */}
        <div className="overflow-auto flex-1">
          <table className="w-full text-sm min-w-[640px]">
            <thead className="sticky top-0 bg-[var(--surface)] z-10">
              <tr className="border-b border-[var(--border-subtle)]">
                <th className="text-center px-3 py-2.5 font-semibold text-xs text-[var(--text-muted)] uppercase tracking-wider w-12">No</th>
                <th className="text-left px-3 py-2.5 font-semibold text-xs text-[var(--text-muted)] uppercase tracking-wider">Nama</th>
                <th className="text-left px-3 py-2.5 font-semibold text-xs text-[var(--text-muted)] uppercase tracking-wider">Home Department</th>
                <th className="text-left px-3 py-2.5 font-semibold text-xs text-[var(--text-muted)] uppercase tracking-wider">Host Department</th>
                <th className="text-center px-3 py-2.5 font-semibold text-xs text-[var(--text-muted)] uppercase tracking-wider w-28">Year, Quarter</th>
              </tr>
            </thead>
            <tbody>
              {rows.length === 0 ? (
                <tr>
                  <td colSpan={5} className="text-center py-10 text-sm text-[var(--text-muted)]">
                    No internship records for the current filters.
                  </td>
                </tr>
              ) : (
                rows.map((r, i) => (
                  <tr key={i} className="border-b border-[var(--border-subtle)] last:border-0 hover:bg-[var(--canvas)]/60">
                    <td className="text-center px-3 py-2.5 text-[var(--text-muted)] tabular">{i + 1}</td>
                    <td className="px-3 py-2.5 font-medium text-[var(--text-primary)]">{r.name}</td>
                    <td className="px-3 py-2.5 text-[var(--text-secondary)]">{r.homeDepartment}</td>
                    <td className="px-3 py-2.5 text-[var(--text-secondary)]">{r.hostDepartment}</td>
                    <td className="text-center px-3 py-2.5 text-[var(--text-secondary)] tabular">{r.year}, Q{r.quarter}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
