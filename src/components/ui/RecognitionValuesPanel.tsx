import { TIMMYNESS_ORDER, TIMMYNESS_COLOR } from '@/lib/timmyness';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from 'recharts';

interface Props {
  data: { name: string; value: number }[]; // must already contain all 10 categories, in canonical order
  title: string;
  subtitle?: string;
}

export default function RecognitionValuesPanel({ data, title, subtitle }: Props) {
  const total = data.reduce((s, d) => s + d.value, 0);

  const rows = TIMMYNESS_ORDER.map((category) => ({
    category,
    value: data.find((d) => d.name === category)?.value ?? 0,
  })).sort((a, b) => b.value - a.value);

  // Recharts Pie renders zero-value slices poorly (a stray thin line), so
  // only feed non-zero categories to the donut. The legend still lists all 10.
  const pieData = rows.filter((r) => r.value > 0);

  return (
    <div className="w-full h-full flex flex-col">
      <div className="mb-4">
        <h4 className="text-sm font-semibold text-[var(--text-primary)]">{title}</h4>
        {subtitle && <p className="text-xs text-[var(--text-muted)]">{subtitle}</p>}
      </div>

      {/* Donut — fixed height, centered, on top */}
      <div className="w-full h-40 shrink-0 mb-4">
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie
              data={pieData}
              dataKey="value"
              nameKey="category"
              innerRadius="60%"
              outerRadius="100%"
              paddingAngle={2}
              stroke="none"
              isAnimationActive={false}
            >
              {pieData.map((entry) => (
                <Cell key={entry.category} fill={TIMMYNESS_COLOR[entry.category] || '#8D99AF'} />
              ))}
            </Pie>
            <Tooltip
              formatter={(value, name) => {
                if (typeof value !== 'number') return [`${value ?? ''}`, name ?? ''];
                return [
                  `${value} (${total > 0 ? Math.round((value / total) * 100) : 0}%)`,
                  name ?? '',
                ];
              }}
              contentStyle={{ borderRadius: 8, fontSize: 12 }}
            />
          </PieChart>
        </ResponsiveContainer>
      </div>

      {/* Values below the donut — rows stretch to fill whatever height is
          left, so this panel matches the height of whatever it's paired
          with in the grid instead of leaving empty space. */}
      <ul className="flex-1 min-h-0 flex flex-col justify-between gap-2">
        {rows.map(({ category, value }) => {
          const color = TIMMYNESS_COLOR[category] || '#8D99AF';
          const pct = total > 0 ? Math.round((value / total) * 100) : 0;
          return (
            <li key={category} className="flex-1 flex items-center gap-2.5 text-sm min-h-[20px]">
              <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ background: color }} />
              <span className="flex-1 min-w-0 truncate font-medium text-[var(--text-secondary)]">
                {category}
              </span>
              <span className="shrink-0 font-semibold tabular text-[var(--text-primary)]">{value}</span>
              <span className="w-10 shrink-0 text-right text-xs tabular text-[var(--text-muted)]">{pct}%</span>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
