import { X, Eye } from 'lucide-react';

interface ReviewRow {
  senderName: string;
  senderDepartment: string;
  senderManager: string;
  receiverName: string;
  receiverDepartment: string;
  created: string;
}

interface Props {
  rows: ReviewRow[];
  onClose: () => void;
  title?: string;
  subtitle?: string;
}

export default function ReviewKudosModal({ rows, onClose, title, subtitle }: Props) {
  const defaultTitle = 'Kudos Awaiting Review';
  const defaultSubtitle = `${rows.length} kudos still need a decision`;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/50" onClick={onClose} />
      <div className="relative w-full max-w-2xl max-h-[80vh] flex flex-col rounded-2xl border border-[var(--border-subtle)] bg-[var(--surface)] shadow-lg">
        <div className="flex items-center justify-between px-5 py-4 border-b border-[var(--border-subtle)]">
          <div className="flex items-center gap-2">
            <span className="grid place-items-center w-8 h-8 rounded-lg bg-[var(--color-brand-500)]/10 text-[var(--color-brand-500)]">
              <Eye size={16} />
            </span>
            <div>
              <h3 className="text-sm font-semibold text-[var(--text-primary)]">{title ?? defaultTitle}</h3>
              <p className="text-xs text-[var(--text-muted)]">{subtitle ?? defaultSubtitle}</p>
            </div>
          </div>
          <button onClick={onClose} className="p-1.5 rounded-lg text-[var(--text-muted)] hover:text-[var(--text-primary)] hover:bg-[var(--canvas)]" aria-label="Close">
            <X size={18} />
          </button>
        </div>

        <div className="overflow-y-auto flex-1 px-5 py-3">
          {rows.length === 0 ? (
            <p className="text-sm text-[var(--text-muted)] text-center py-10">Nothing for the current filters — all caught up.</p>
          ) : (
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-[var(--border-subtle)]">
                  <th className="text-left px-2 py-2 font-medium text-[var(--text-muted)]">Sender</th>
                  <th className="text-left px-2 py-2 font-medium text-[var(--text-muted)]">Manager</th>
                  <th className="text-left px-2 py-2 font-medium text-[var(--text-muted)]">Receiver</th>
                  <th className="text-left px-2 py-2 font-medium text-[var(--text-muted)]">Date</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((r, i) => (
                  <tr key={i} className="border-b border-[var(--border-subtle)] last:border-0">
                    <td className="px-2 py-2 text-[var(--text-primary)]">
                      {r.senderName}
                      <span className="block text-xs text-[var(--text-muted)]">{r.senderDepartment}</span>
                    </td>
                    <td className="px-2 py-2 text-[var(--text-secondary)]">{r.senderManager || '—'}</td>
                    <td className="px-2 py-2 text-[var(--text-primary)]">
                      {r.receiverName}
                      <span className="block text-xs text-[var(--text-muted)]">{r.receiverDepartment}</span>
                    </td>
                    <td className="px-2 py-2 text-[var(--text-muted)] tabular whitespace-nowrap">
                      {r.created ? new Date(r.created).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' }) : '—'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </div>
  );
}