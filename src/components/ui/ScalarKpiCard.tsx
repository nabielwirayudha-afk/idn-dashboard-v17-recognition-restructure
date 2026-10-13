import type { ReactNode } from 'react';
import { ArrowUpRight, ArrowDownRight, Minus } from 'lucide-react';
import type { Comparison } from '@/lib/dynamicTrend';

interface ScalarKpiCardProps {
  label: string;
  value: number | string;
  comparisons?: Comparison[];
  format?: 'percent' | 'absolute';
  deltaUnit?: string;
  caption?: string;
  icon?: ReactNode;
  accent?: string;
}

export default function ScalarKpiCard({
  label,
  value,
  comparisons = [],
  format = 'absolute',
  deltaUnit = '',
  caption,
  icon,
  accent = '#ED2127',
}: ScalarKpiCardProps) {
  return (
    <div
      className="rounded-2xl p-6 w-full h-full flex flex-col items-center justify-center text-center gap-3 shadow-md"
      style={{
        background: 'var(--color-dark-card-bg)',
        border: `1px solid ${accent}33`,
      }}
    >
      <div className="flex items-center gap-2">
        {icon && <span style={{ color: accent }}>{icon}</span>}
        <span
          className="text-base font-bold uppercase tracking-wide"
          style={{ color: 'var(--color-dark-card-text)' }}
        >
          {label}
        </span>
      </div>
      <div
        className="text-6xl font-bold tabular tracking-tight"
        style={{ color: 'var(--color-dark-card-text)' }}
      >
        {value}
      </div>

      {comparisons.length > 0 && (
        <div className="flex flex-wrap items-center justify-center gap-x-2 gap-y-1">
          {comparisons.map((c, i) => {
            const raw = format === 'percent' ? c.deltaPct : c.deltaAbs;
            const isFlat = raw === 0 || raw === null;
            const isUp = (raw ?? 0) > 0;
            const displayText =
              raw === null
                ? 'n/a'
                : format === 'percent'
                ? `${raw > 0 ? '+' : ''}${raw}%`
                : `${raw > 0 ? '+' : ''}${raw} ${deltaUnit}`;
            return (
              <span key={c.label} className="flex items-center gap-2">
                {i > 0 && <span style={{ color: 'var(--color-dark-card-dim)' }}>|</span>}
                <span className="inline-flex items-center gap-1 text-[13px] font-medium whitespace-nowrap">
                  {isFlat ? (
                    <Minus size={13} style={{ color: 'var(--color-dark-card-muted)' }} />
                  ) : isUp ? (
                    <ArrowUpRight size={13} className="text-[var(--color-success)]" />
                  ) : (
                    <ArrowDownRight size={13} style={{ color: accent }} />
                  )}
                  <span
                    style={
                      isFlat
                        ? { color: 'var(--color-dark-card-muted)' }
                        : !isUp
                        ? { color: accent }
                        : undefined
                    }
                    className={!isFlat && isUp ? 'text-[var(--color-success)]' : ''}
                  >
                    {displayText}
                  </span>
                  <span style={{ color: 'var(--color-dark-card-muted)' }}>{c.label}</span>
                </span>
              </span>
            );
          })}
        </div>
      )}

      {caption && (
        <p className="text-xs" style={{ color: 'var(--color-dark-card-muted)' }}>
          {caption}
        </p>
      )}
    </div>
  );
}
