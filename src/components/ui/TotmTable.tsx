interface TotmRow {
  name: string;
  department: string;
  period: string;
  rawDate: string;
  employeeStatusRaw: string;
}

export default function TotmTable({ rows, onSelect }: { rows: TotmRow[]; onSelect: (row: TotmRow) => void }) {
  if (rows.length === 0) {
    return <p className="text-sm text-[var(--text-muted)] text-center py-8">No Timmy of the Month records for the current filters.</p>;
  }

  return (
    <div className="overflow-x-auto max-h-[420px] overflow-y-auto">
      <table className="w-full text-sm">
        <thead className="sticky top-0 bg-[var(--surface)]">
          <tr className="border-b border-[var(--border-subtle)]">
            <th className="text-left px-3 py-2 font-medium text-[var(--text-muted)]">Name</th>
            <th className="text-left px-3 py-2 font-medium text-[var(--text-muted)]">Department</th>
            <th className="text-left px-3 py-2 font-medium text-[var(--text-muted)]">Period</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((r, i) => (
            <tr key={i} className="border-b border-[var(--border-subtle)] last:border-0 hover:bg-[var(--canvas)]/60">
              <td className="px-3 py-2">
                <button
                  onClick={() => onSelect(r)}
                  className="font-medium text-[var(--color-brand-600)] dark:text-[var(--color-brand-300)] hover:underline text-left"
                >
                  {r.name}
                </button>
              </td>
              <td className="px-3 py-2 text-[var(--text-secondary)]">{r.department}</td>
              <td className="px-3 py-2 text-[var(--text-muted)] tabular">{r.period}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
