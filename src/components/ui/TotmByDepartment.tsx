import { useMemo } from 'react';
import type { TimmyOfTheMonthRecord } from '@/types';

const DARK_GOLD = '#B8860B';
const DARK_SILVER = '#71797E';
const DARK_BRONZE = '#8C5A22';

function rowStyle(
  index: number,
  minValue: number,
  rows: { department: string; value: number }[]
): { background?: string; color?: string } {
  if (index === 0) return { background: DARK_GOLD, color: '#FFFFFF' };
  if (index === 1) return { background: DARK_SILVER, color: '#FFFFFF' };
  if (index === 2) return { background: DARK_BRONZE, color: '#FFFFFF' };
  if (rows[index].value === minValue) return { background: 'var(--color-danger-bg)', color: 'var(--color-text-primary)' };
  return {};
}

interface Props {
  rows: TimmyOfTheMonthRecord[];
  allDepartments: string[];
  onSelectDept: (dept: string, names: TimmyOfTheMonthRecord[]) => void;
}

export default function TotmByDepartment({ rows, allDepartments, onSelectDept }: Props) {
  const deptRows = useMemo(() => {
    const map = new Map<string, { count: number; names: TimmyOfTheMonthRecord[] }>();
    for (const r of rows) {
      const dept = r.currentDepartment || r.employee?.department || 'Unknown';
      if (dept === 'Board of Directors') continue;
      const existing = map.get(dept) || { count: 0, names: [] };
      existing.count += 1;
      existing.names.push(r);
      map.set(dept, existing);
    }

    const result = allDepartments.map((department) => ({
      department,
      value: map.get(department)?.count || 0,
      names: map.get(department)?.names || [],
    }));

    return result.sort((a, b) => b.value - a.value);
  }, [rows, allDepartments]);

  const minValue = useMemo(() => {
    if (deptRows.length === 0) return 0;
    return deptRows[deptRows.length - 1].value;
  }, [deptRows]);

  if (deptRows.length === 0) {
    return (
      <p className="text-sm text-center py-8" style={{ color: 'var(--color-text-muted)' }}>
        No departments with active employees for the current filters.
      </p>
    );
  }

  return (
    <div className="overflow-x-auto">
      <table
        className="w-full text-sm min-w-[300px]"
        style={{ borderCollapse: 'separate', borderSpacing: '0 6px' }}
      >
        <thead>
          <tr style={{ borderBottom: '1px solid var(--color-border-default)' }}>
            <th className="text-left px-2.5 py-1.5 font-medium w-8" style={{ color: 'var(--color-text-muted)' }}>
              #
            </th>
            <th className="text-left px-2.5 py-1.5 font-medium" style={{ color: 'var(--color-text-muted)' }}>
              Department
            </th>
            <th className="text-right px-2.5 py-1.5 font-medium" style={{ color: 'var(--color-text-muted)' }}>
              Total
            </th>
          </tr>
        </thead>
        <tbody>
          {deptRows.map((r, i) => {
            const style = rowStyle(i, minValue, deptRows);
            return (
              <tr
                key={r.department}
                style={{ background: style.background }}
                className="rounded-lg cursor-pointer hover:opacity-90 transition-opacity"
                onClick={() => onSelectDept(r.department, r.names)}
              >
                <td
                  className="px-2.5 py-1.5 tabular font-semibold rounded-l-lg"
                  style={{ color: style.color || 'var(--color-text-muted)' }}
                >
                  {i + 1}
                </td>
                <td
                  className="px-2.5 py-1.5 font-medium"
                  style={{ color: style.color || 'var(--color-text-primary)' }}
                >
                  {r.department}
                </td>
                <td
                  className="px-2.5 py-1.5 text-right tabular font-semibold rounded-r-lg"
                  style={{ color: style.color || 'var(--color-text-primary)' }}
                >
                  {r.value}
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
