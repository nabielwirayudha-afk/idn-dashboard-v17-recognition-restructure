import { useId, type ReactNode } from 'react';
import { ArrowUpRight, ArrowDownRight, Minus } from 'lucide-react';

interface RadialKpiCardProps {
  label: string;
  value: string;
  percent: number; // 0-100, how much of the ring is filled
  icon?: ReactNode;
  accent?: string;
  qoqPct?: number | null; // null/undefined = no data to compare
}

const SIZE = 96;
const STROKE = 9;
const RADIUS = (SIZE - STROKE) / 2;
const CIRCUMFERENCE = 2 * Math.PI * RADIUS;

export default function RadialKpiCard({ label, value, percent, icon, accent = '#ED2127', qoqPct }: RadialKpiCardProps) {
  const gradientId = `radial-gradient-${useId()}`;
  const clamped = Math.max(0, Math.min(100, percent));
  const offset = CIRCUMFERENCE * (1 - clamped / 100);

  const isFlat = qoqPct === 0 || qoqPct === null || qoqPct === undefined;
  const isUp = (qoqPct ?? 0) > 0;

  return (
    <div className="rounded-2xl border border-[var(--border-subtle)] bg-[var(--surface)] p-5 flex items-center gap-4 shadow-sm hover:shadow-md transition-shadow duration-200">
      <div className="relative shrink-0" style={{ width: SIZE, height: SIZE }}>
        <svg width={SIZE} height={SIZE} className="-rotate-90">
          <defs>
            <linearGradient id={gradientId} x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor={accent} stopOpacity="1" />
              <stop offset="100%" stopColor={accent} stopOpacity="0.55" />
            </linearGradient>
          </defs>
          <circle cx={SIZE / 2} cy={SIZE / 2} r={RADIUS} fill="none" stroke="var(--border-subtle)" strokeWidth={STROKE} />
          <circle
            cx={SIZE / 2}
            cy={SIZE / 2}
            r={RADIUS}
            fill="none"
            stroke={`url(#${gradientId})`}
            strokeWidth={STROKE}
            strokeLinecap="round"
            strokeDasharray={CIRCUMFERENCE}
            strokeDashoffset={offset}
            style={{ transition: 'stroke-dashoffset 0.6s ease' }}
          />
        </svg>
        <div className="absolute inset-0 grid place-items-center">
          {icon ? (
            <span style={{ color: accent }}>{icon}</span>
          ) : (
            <span className="text-xs font-semibold tabular" style={{ color: accent }}>
              {clamped}%
            </span>
          )}
        </div>
      </div>

      <div className="flex flex-col gap-1 min-w-0">
        <span className="text-xs font-medium text-[var(--text-secondary)] truncate">{label}</span>
        <span className="text-2xl font-semibold tabular tracking-tight text-[var(--text-primary)]">{value}</span>
        {qoqPct !== undefined && (
          <div className="flex items-center gap-1 text-xs font-medium">
            {isFlat ? (
              <Minus size={13} className="text-[var(--text-muted)]" />
            ) : isUp ? (
              <ArrowUpRight size={13} className="text-[var(--color-success)]" />
            ) : (
              <ArrowDownRight size={13} className="text-[var(--color-danger)]" />
            )}
            <span className={isFlat ? 'text-[var(--text-muted)]' : isUp ? 'text-[var(--color-success)]' : 'text-[var(--color-danger)]'}>
              {qoqPct === null ? 'n/a' : isFlat ? 'Same' : `${isUp ? '+' : ''}${qoqPct}%`}
            </span>
            <span className="text-[var(--text-muted)]">vs prev Q</span>
          </div>
        )}
      </div>
    </div>
  );
}
