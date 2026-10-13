import { colorAt } from '@/lib/theme';

interface RankingListProps {
  items: { name: string; value: number }[];
  unit?: string;
  max?: number;
}

export default function RankingList({ items, unit = '', max }: RankingListProps) {
  const top = max ? items.slice(0, max) : items;
  const maxVal = Math.max(1, ...top.map((i) => i.value));

  if (top.length === 0) {
    return <p className="text-sm text-[var(--text-muted)] py-6 text-center">No data for the current filters.</p>;
  }

  return (
    <ol className="flex flex-col gap-3">
      {top.map((item, i) => (
        <li key={item.name} className="flex items-center gap-3">
          <span className="w-5 text-xs font-semibold text-[var(--text-muted)] tabular shrink-0">{i + 1}</span>
          <div className="flex-1 min-w-0">
            <div className="flex items-center justify-between gap-2 mb-1">
              <span className="text-sm text-[var(--text-primary)] truncate">{item.name}</span>
              <span className="text-sm font-semibold tabular text-[var(--text-primary)] shrink-0">
                {item.value}
                {unit}
              </span>
            </div>
            <div className="h-1.5 rounded-full bg-[var(--canvas)] overflow-hidden">
              <div
                className="h-full rounded-full"
                style={{ width: `${(item.value / maxVal) * 100}%`, background: colorAt(i) }}
              />
            </div>
          </div>
        </li>
      ))}
    </ol>
  );
}
