interface MonthlyGridCardsProps {
  data: { month: string; value: number }[];
}

export default function MonthlyGridCards({ data }: MonthlyGridCardsProps) {
  const max = Math.max(1, ...data.map((d) => d.value));
  return (
    <div className="grid grid-cols-3 sm:grid-cols-4 lg:grid-cols-6 gap-3">
      {data.map((d, i) => (
        <div
          key={d.month}
          className="rounded-xl border border-[var(--border-subtle)] bg-[var(--canvas)] p-3 flex flex-col gap-1"
        >
          <p className="text-[10px] font-medium text-[var(--text-muted)]">
            {String(i + 1).padStart(2, '0')}. {d.month}
          </p>
          <p className="text-xl font-semibold tabular text-[var(--text-primary)]">{d.value}</p>
          <div className="h-1 rounded-full bg-[var(--border-subtle)] overflow-hidden mt-1">
            <div
              className="h-full rounded-full bg-[var(--color-brand-500)]"
              style={{ width: `${(d.value / max) * 100}%` }}
            />
          </div>
        </div>
      ))}
    </div>
  );
}
