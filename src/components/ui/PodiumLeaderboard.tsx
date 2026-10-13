import { User } from 'lucide-react';

interface TimmyRow {
  name: string;
  department: string;
  total: number;
}

const PODIUM_COLORS = ['#B8860B', '#71797E', '#8C5A22']; // gold, silver, bronze
const PODIUM_HEIGHTS = ['h-24', 'h-16', 'h-12']; // 1st tallest, 2nd, 3rd

export default function PodiumLeaderboard({ rows }: { rows: TimmyRow[] }) {
  const top3 = rows.slice(0, 3);
  const rest = rows.slice(3, 20);

  // Visual order on the podium: 2nd, 1st, 3rd (classic podium arrangement)
  const podiumOrder = [top3[1], top3[0], top3[2]];
  const podiumRankIndex = [1, 0, 2]; // maps podiumOrder position -> original rank index (0-based)

  if (rows.length === 0) {
    return (
      <p className="text-sm text-center py-8" style={{ color: 'var(--color-text-muted)' }}>
        No participation data yet.
      </p>
    );
  }

  return (
    <div className="flex flex-col gap-5">
      {/* Podium for top 3 */}
      <div className="flex items-end justify-center gap-3">
        {podiumOrder.map((person, i) => {
          if (!person) return <div key={i} className="flex-1" />;
          const rankIdx = podiumRankIndex[i];
          const color = PODIUM_COLORS[rankIdx];
          const height = PODIUM_HEIGHTS[rankIdx];
          return (
            <div key={person.name + rankIdx} className="flex-1 flex flex-col items-center gap-2">
              <span
                className="grid place-items-center w-11 h-11 rounded-full shrink-0"
                style={{ background: `${color}22`, color }}
              >
                <User size={20} />
              </span>
              <div className="text-center">
                <p
                  className="text-xs font-semibold text-center leading-tight"
                  style={{ color: 'var(--color-text-primary)' }}
                  title={person.name}
                >
                  {person.name}
                </p>
                <p
                  className="text-[10px] text-center leading-tight"
                  style={{ color: 'var(--color-text-muted)' }}
                  title={person.department}
                >
                  {person.department}
                </p>
              </div>
              <div
                className={`w-full ${height} rounded-t-lg flex items-start justify-center pt-1.5`}
                style={{ background: color }}
              >
                <span className="text-white font-bold text-sm tabular">#{rankIdx + 1}</span>
              </div>
              <p className="text-xs font-semibold tabular -mt-1" style={{ color }}>
                {person.total} total
              </p>
            </div>
          );
        })}
      </div>

      {/* 4th-20th as a full list (no scroll — grows to match the department table beside it) */}
      {rest.length > 0 && (
        <ol className="flex flex-col gap-1.5">
          {rest.map((person, i) => (
            <li
              key={person.name}
              className="flex items-center gap-2.5 px-2.5 py-2.5 rounded-lg"
              style={{ background: 'var(--color-canvas)' }}
            >
              <span
                className="w-5 text-[13px] font-semibold tabular text-center"
                style={{ color: 'var(--color-text-muted)' }}
              >
                {i + 4}
              </span>
              <span
                className="grid place-items-center w-7 h-7 rounded-full shrink-0"
                style={{ background: 'var(--color-surface-sunken)', color: 'var(--color-text-primary)' }}
              >
                <User size={14} />
              </span>
              <span className="flex-1 min-w-0 text-[13px] font-medium" style={{ color: 'var(--color-text-primary)' }}>
                {person.name}
              </span>
              <span className="text-[11px] text-right shrink-0 whitespace-nowrap" style={{ color: 'var(--color-text-muted)' }}>
                {person.department}
              </span>
              <span className="text-[13px] font-semibold tabular" style={{ color: 'var(--color-text-primary)' }}>
                {person.total}
              </span>
            </li>
          ))}
        </ol>
      )}
    </div>
  );
}
