import { Fragment } from 'react';

interface HeatmapGridProps {
  rows: string[];
  cols: string[];
  values: Record<string, Record<string, number>>; // values[row][col]
  valueSuffix?: string;
}

export default function HeatmapGrid({ rows, cols, values, valueSuffix = '' }: HeatmapGridProps) {
  const max = Math.max(
    1,
    ...rows.flatMap((r) => cols.map((c) => values[r]?.[c] ?? 0))
  );

  return (
    <div className="overflow-x-auto">
      <div className="min-w-[560px]">
        <div className="grid gap-1" style={{ gridTemplateColumns: `140px repeat(${cols.length}, minmax(0,1fr))` }}>
          <div />
          {cols.map((c) => (
            <div key={c} className="text-[10px] text-[var(--text-muted)] text-center pb-1 truncate">
              {c}
            </div>
          ))}
          {rows.map((r) => (
            <Fragment key={r}>
              <div className="text-xs text-[var(--text-secondary)] flex items-center truncate pr-2">
                {r}
              </div>
              {cols.map((c) => {
                const v = values[r]?.[c] ?? 0;
                const intensity = v / max;
                return (
                  <div
                    key={`${r}-${c}`}
                    title={`${r} · ${c}: ${v}${valueSuffix}`}
                    className="aspect-square rounded-md flex items-center justify-center text-[10px] font-medium"
                    style={{
                      background: `rgba(108, 99, 255, ${0.08 + intensity * 0.72})`,
                      color: intensity > 0.5 ? '#fff' : 'var(--text-secondary)',
                    }}
                  >
                    {v > 0 ? Math.round(v) : ''}
                  </div>
                );
              })}
            </Fragment>
          ))}
        </div>
      </div>
    </div>
  );
}
