import { useMemo } from 'react';

const DARK_GOLD = '#B8860B';
const DARK_SILVER = '#71797E';
const DARK_BRONZE = '#8C5A22';

function rowStyle(
  index: number,
  total: number,
  minValue: number,
  rows: { department: string; value: number }[]
): { background?: string; color?: string } {
  const val = rows[index].value;

  // Get unique values sorted descending
  const uniqueValues = Array.from(new Set(rows.map((r) => r.value))).sort((a, b) => b - a);
  const goldValue = uniqueValues[0];
  const silverValue = uniqueValues[1];
  const bronzeValue = uniqueValues[2];

  if (goldValue !== undefined && val === goldValue) return { background: DARK_GOLD, color: '#FFFFFF' };
  if (silverValue !== undefined && val === silverValue) return { background: DARK_SILVER, color: '#FFFFFF' };
  if (bronzeValue !== undefined && val === bronzeValue) return { background: DARK_BRONZE, color: '#FFFFFF' };

  if (val === minValue && minValue > 0) return { background: 'var(--color-danger-bg)', color: 'var(--color-text-primary)' };
  if (val === 0) return { background: 'var(--color-danger-bg)', color: 'var(--color-text-primary)' };

  return {};
}

interface Props {
  rows: { department: string; value: number; count?: number; total?: number }[];
  showRate?: boolean;
  valueLabel?: string;
}

export default function DepartmentRankTable({ rows, showRate = true, valueLabel = 'Total' }: Props) {
  const { sortedRows, minValue } = useMemo(() => {
    const sorted = [...rows].sort((a, b) => b.value - a.value);
    const min = sorted.length > 0 ? sorted[sorted.length - 1].value : 0;
    return { sortedRows: sorted, minValue: min };
  }, [rows]);

  if (sortedRows.length === 0) {
    return (
      <p className="text-sm text-center py-8" style={{ color: 'var(--color-text-muted)', fontFamily: "'Poppins', sans-serif" }}>
        No data for the current filters.
      </p>
    );
  }

  return (
    <div className="overflow-x-auto" style={{ fontFamily: "'Poppins', sans-serif" }}>
      <table
        className="w-full text-sm min-w-[300px] border-separate"
        style={{ borderSpacing: '0 6px' }}
      >
        <thead>
          <tr>
            <th className="text-center px-2.5 py-2 font-semibold text-[11px] uppercase tracking-wider w-8" style={{ color: 'var(--color-text-muted)' }}>
              #
            </th>
            <th className="text-left px-2.5 py-2 font-semibold text-[11px] uppercase tracking-wider" style={{ color: 'var(--color-text-muted)' }}>
              Department
            </th>
            {showRate ? (
              <>
                <th className="text-center px-2.5 py-2 font-semibold text-[11px] uppercase tracking-wider" style={{ color: 'var(--color-text-muted)' }}>
                  Total Participation
                </th>
                <th className="text-center px-2.5 py-2 font-semibold text-[11px] uppercase tracking-wider" style={{ color: 'var(--color-text-muted)' }}>
                  Total Timmy
                </th>
                <th className="text-center px-2.5 py-2 font-semibold text-[11px] uppercase tracking-wider" style={{ color: 'var(--color-text-muted)' }}>
                  Rate
                </th>
              </>
            ) : (
              <th className="text-center px-2.5 py-2 font-semibold text-[11px] uppercase tracking-wider" style={{ color: 'var(--color-text-muted)' }}>
                {valueLabel}
              </th>
            )}
          </tr>
        </thead>
        <tbody>
          {sortedRows.map((r, i) => {
            const style = rowStyle(i, sortedRows.length, minValue, sortedRows);
            return (
              <tr
                key={r.department}
                style={{ background: style.background }}
                className="rounded-xl shadow-sm"
              >
                <td
                  className="px-2.5 py-2.5 tabular font-bold text-center rounded-l-xl text-[13px]"
                  style={{ color: style.color || 'var(--color-text-muted)' }}
                >
                  {i + 1}
                </td>
                <td
                  className="px-2.5 py-2.5 font-semibold text-left text-[13px]"
                  style={{ color: style.color || 'var(--color-text-primary)' }}
                >
                  {r.department}
                </td>
                {showRate ? (
                  <>
                    <td
                      className="px-2.5 py-2.5 tabular font-bold text-center text-[13px]"
                      style={{ color: style.color || 'var(--color-text-primary)' }}
                    >
                      {r.count ?? 0}
                    </td>
                    <td
                      className="px-2.5 py-2.5 tabular font-bold text-center text-[13px]"
                      style={{ color: style.color || 'var(--color-text-primary)' }}
                    >
                      {r.total ?? 0}
                    </td>
                    <td
                      className="px-2.5 py-2.5 tabular font-bold text-center rounded-r-xl text-[13px]"
                      style={{ color: style.color || 'var(--color-text-primary)' }}
                    >
                      {r.value}%
                    </td>
                  </>
                ) : (
                  <td
                    className="px-2.5 py-2.5 tabular font-bold text-center rounded-r-xl text-[13px]"
                    style={{ color: style.color || 'var(--color-text-primary)' }}
                  >
                    {r.value}
                  </td>
                )}
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
