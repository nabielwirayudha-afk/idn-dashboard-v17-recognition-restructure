interface Column {
  key: string;
  label: string;
  align?: 'left' | 'right';
}

interface DataTableProps {
  columns: Column[];
  rows: Record<string, string | number>[];
  rankColumn?: boolean;
  emptyMessage?: string;
  /** Shows a small gold/silver/bronze-style badge next to the rank for the
   * first N rows. Rows must already be sorted by the relevant metric. */
  badgeTopN?: number;
  compact?: boolean;
}

const BADGE_STYLES = [
  { bg: 'bg-[#F4C430]/15', text: 'text-[#B8860B]', label: '1st' },
  { bg: 'bg-[#C0C0C0]/20', text: 'text-[#6b6b6b]', label: '2nd' },
  { bg: 'bg-[#CD7F32]/15', text: 'text-[#A0522D]', label: '3rd' },
];

export default function DataTable({ columns, rows, rankColumn = true, emptyMessage = 'No data for the current filters.', badgeTopN = 0, compact = false }: DataTableProps) {
  const cellPad = compact ? 'px-2.5 py-1.5' : 'px-3 py-2.5';
  return (
    <div className="overflow-x-auto">
      <table className={`w-full text-sm ${compact ? 'min-w-[380px]' : 'min-w-[520px]'}`}>
        <thead>
          <tr className="border-b border-[var(--border-subtle)]">
            {rankColumn && <th className={`text-left ${cellPad} font-medium text-[var(--text-muted)] whitespace-nowrap w-10`}>#</th>}
            {columns.map((c) => (
              <th
                key={c.key}
                className={`${cellPad} font-medium text-[var(--text-muted)] whitespace-nowrap ${c.align === 'right' ? 'text-right' : 'text-left'}`}
              >
                {c.label}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((row, i) => (
            <tr key={i} className="border-b border-[var(--border-subtle)] last:border-0 hover:bg-[var(--canvas)]/60">
              {rankColumn && (
                <td className={`${cellPad} text-[var(--text-muted)] tabular`}>
                  <span className="flex items-center gap-1.5">
                    {i + 1}
                    {i < badgeTopN && (
                      <span className={`text-[9px] font-semibold px-1.5 py-0.5 rounded-full ${BADGE_STYLES[i].bg} ${BADGE_STYLES[i].text}`}>
                        {BADGE_STYLES[i].label}
                      </span>
                    )}
                  </span>
                </td>
              )}
              {columns.map((c) => (
                <td
                  key={c.key}
                  className={`${cellPad} tabular text-[var(--text-primary)] ${c.align === 'right' ? 'text-right' : 'text-left'}`}
                >
                  {row[c.key]}
                </td>
              ))}
            </tr>
          ))}
          {rows.length === 0 && (
            <tr>
              <td colSpan={columns.length + (rankColumn ? 1 : 0)} className={`${cellPad} py-8 text-center text-[var(--text-muted)]`}>
                {emptyMessage}
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );
}
