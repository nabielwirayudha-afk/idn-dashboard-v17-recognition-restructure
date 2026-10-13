import type { ReactNode } from 'react';
import { ArrowUpRight, ArrowDownRight, Minus } from 'lucide-react';
import type { Comparison } from '@/lib/dynamicTrend';

interface SolidPieCardProps {
  label: string;
  value: number;
  percentForFill: number;
  comparisons: Comparison[];
  caption?: string;
  icon?: ReactNode;
  accent?: string;
}

const SIZE = 116;
const R = SIZE / 2;

function pieSlicePath(percent: number): string | null {
  const clamped = Math.max(0, Math.min(100, percent));
  if (clamped <= 0) return null;
  if (clamped >= 100)
    return `M ${R} ${R} m -${R} 0 a ${R} ${R} 0 1 0 ${R * 2} 0 a ${R} ${R} 0 1 0 -${R * 2} 0`;

  const angle = (clamped / 100) * 360;
  const startRad = (-90 * Math.PI) / 180;
  const endRad = ((angle - 90) * Math.PI) / 180;
  const x1 = R + R * Math.cos(startRad);
  const y1 = R + R * Math.sin(startRad);
  const x2 = R + R * Math.cos(endRad);
  const y2 = R + R * Math.sin(endRad);
  const largeArc = angle > 180 ? 1 : 0;

  return `M ${R} ${R} L ${x1} ${y1} A ${R} ${R} 0 ${largeArc} 1 ${x2} ${y2} Z`;
}

function TrendChip({ comparison, accent }: { comparison: Comparison; accent: string }) {
  const { label, deltaPct } = comparison;
  const isFlat = deltaPct === 0 || deltaPct === null;
  const isUp = (deltaPct ?? 0) > 0;

  return (
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
        {deltaPct === null ? 'n/a' : `${Math.abs(deltaPct)}%`}
      </span>
      <span style={{ color: 'var(--color-dark-card-muted)' }}>{label}</span>
    </span>
  );
}

export default function SolidPieCard({
  label,
  value,
  percentForFill,
  comparisons,
  caption,
  icon,
  accent = '#ED2127',
}: SolidPieCardProps) {
  const slice = pieSlicePath(percentForFill);

  return (
    <div
      className="rounded-2xl p-6 flex flex-col items-center text-center gap-3 shadow-md"
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

      <svg className="w-full h-auto max-w-full" width={SIZE} height={SIZE} viewBox={`0 0 ${SIZE} ${SIZE}`}>
        <circle cx={R} cy={R} r={R} fill="var(--color-dark-card-border)" />
        {slice && <path d={slice} fill={accent} />}
      </svg>

      <div
        className="text-4xl font-bold tabular tracking-tight"
        style={{ color: 'var(--color-dark-card-text)' }}
      >
        {value.toLocaleString('en-US')}
      </div>
      <p className="text-sm font-semibold tabular -mt-2" style={{ color: accent }}>
        {percentForFill}% of Active Employees
      </p>

      {comparisons.length > 0 && (
        <div className="flex flex-wrap items-center justify-center gap-x-2 gap-y-1">
          {comparisons.map((c, i) => (
            <span key={c.label} className="flex items-center gap-2">
              {i > 0 && <span style={{ color: 'var(--color-dark-card-dim)' }}>|</span>}
              <TrendChip comparison={c} accent={accent} />
            </span>
          ))}
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
