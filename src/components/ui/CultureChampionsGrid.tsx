import { useState } from 'react';
import {
  Shield,
  HeartHandshake,
  Smile,
  Flame,
  Zap,
  Compass,
  Sprout,
  Banknote,
  Mountain,
  Globe,
  type LucideIcon,
} from 'lucide-react';
import { TIMMYNESS_ORDER } from '@/lib/timmyness';

const ICON_BY_CATEGORY: Record<string, { src: string; fallback: LucideIcon }> = {
  'Integrity': { src: '/icons/IDN_Icons_Final_Red-01.png', fallback: Shield },
  'Inclusion': { src: '/icons/IDN_Icons_Final_Red-02.png', fallback: HeartHandshake },
  'Customer Obsessed': { src: '/icons/IDN_Icons_Final_Red-03.png', fallback: Smile },
  'Strong Work-Ethic': { src: '/icons/IDN_Icons_Final_Red-04.png', fallback: Flame },
  'Focus and Speed': { src: '/icons/IDN_Icons_Final_Red-05.png', fallback: Zap },
  'Long-Term Thinking': { src: '/icons/IDN_Icons_Final_Red-06.png', fallback: Compass },
  'Growth Mindset': { src: '/icons/IDN_Icons_Final_Red-07.png', fallback: Sprout },
  'Cost Conscious': { src: '/icons/IDN_Icons_Final_Red-08.png', fallback: Banknote },
  'Grit and Resilience': { src: '/icons/IDN_Icons_Final_Red-09.png', fallback: Mountain },
  'One IDN': { src: '/icons/IDN_Icons_Final_Red-10.png', fallback: Globe },
};

interface ChampionRow {
  timmyness: string;
  name: string;
  department: string;
  count: number;
}

function CategoryIcon({ category, size = 16 }: { category: string; size?: number }) {
  const [imgError, setImgError] = useState(false);
  const iconData = ICON_BY_CATEGORY[category];

  if (imgError || !iconData) {
    const FallbackIcon = iconData?.fallback || Shield;
    return <FallbackIcon size={size} style={{ color: 'var(--color-brand-500)' }} />;
  }

  return (
    <img
      src={iconData.src}
      alt={category}
      style={{ width: size, height: size }}
      className="object-contain"
      onError={() => setImgError(true)}
    />
  );
}

export default function CultureChampionsGrid({ rows }: { rows: ChampionRow[] }) {
  // Group winners by category, preserving TIMMYNESS_ORDER so every category
  // still shows up in the table even with zero winners (same contract as before).
  const byCategory = new Map<string, ChampionRow[]>();
  rows.forEach((r) => {
    if (!byCategory.has(r.timmyness)) byCategory.set(r.timmyness, []);
    byCategory.get(r.timmyness)!.push(r);
  });
  byCategory.forEach((list) => list.sort((a, b) => a.name.localeCompare(b.name)));

  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm border-collapse">
        <thead>
          <tr style={{ borderBottom: '1px solid var(--color-border-subtle)' }}>
            <th
              className="text-left py-2.5 px-3 text-[10px] font-semibold uppercase tracking-wider w-[220px]"
              style={{ color: 'var(--color-text-muted)' }}
            >
              Category
            </th>
            <th
              className="text-left py-2.5 px-3 text-[10px] font-semibold uppercase tracking-wider"
              style={{ color: 'var(--color-text-muted)' }}
            >
              Champion(s)
            </th>
            <th
              className="text-right py-2.5 px-3 text-[10px] font-semibold uppercase tracking-wider w-[110px]"
              style={{ color: 'var(--color-text-muted)' }}
            >
              Total Kudos
            </th>
          </tr>
        </thead>
        <tbody>
          {TIMMYNESS_ORDER.map((category, i) => {
            const champions = byCategory.get(category) || [];
            const total = champions[0]?.count ?? 0;
            return (
              <tr
                key={category}
                className="transition-colors"
                style={{
                  borderBottom: '1px solid var(--color-border-subtle)',
                  background: i % 2 === 1 ? 'var(--color-canvas)' : 'transparent',
                }}
              >
                {/* Category — same icon-in-circle treatment as before, just sized for a row */}
                <td className="py-3 px-3 align-top">
                  <div className="flex items-center gap-2.5">
                    <span
                      className="grid place-items-center w-8 h-8 rounded-full shrink-0"
                      style={{ background: 'rgba(var(--color-brand-rgb), 0.13)' }}
                    >
                      <CategoryIcon category={category} size={16} />
                    </span>
                    <span className="font-semibold leading-tight" style={{ color: 'var(--color-text-primary)' }}>
                      {category}
                    </span>
                  </div>
                </td>

                {/* Champions — wrapping chips instead of a stacked bullet list, so ties stay compact */}
                <td className="py-3 px-3 align-top">
                  {champions.length === 0 ? (
                    <span className="text-sm italic" style={{ color: 'var(--color-text-muted)' }}>
                      No champion yet
                    </span>
                  ) : (
                    <div className="flex flex-wrap gap-1.5">
                      {champions.map((c) => (
                        <span
                          key={c.name}
                          title={c.department}
                          className="inline-flex items-center rounded-full px-2.5 py-1 text-xs font-medium whitespace-nowrap"
                          style={{ background: 'rgba(var(--color-brand-rgb), 0.1)', color: 'var(--color-brand-500)' }}
                        >
                          {c.name}
                        </span>
                      ))}
                    </div>
                  )}
                </td>

                {/* Total Kudos — right aligned, easy to scan down the column */}
                <td className="py-3 px-3 align-top text-right">
                  {champions.length > 0 && (
                    <span
                      className="inline-flex items-center justify-center min-w-[30px] px-2 py-0.5 rounded-full text-xs font-bold"
                      style={{ background: 'var(--color-canvas)', color: 'var(--color-text-primary)' }}
                    >
                      {total}
                    </span>
                  )}
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
