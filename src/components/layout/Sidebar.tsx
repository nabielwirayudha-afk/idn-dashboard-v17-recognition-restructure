import { NavLink } from 'react-router-dom';
import {
  LayoutGrid,
  PartyPopper,
  GraduationCap,
  Award,
  UserRoundSearch,
  Building2,
  Sparkles,
} from 'lucide-react';

const NAV_ITEMS = [
  { to: '/', label: 'Overview', icon: LayoutGrid, end: true },
  { to: '/idn-club', label: 'IDN Club', icon: PartyPopper },
  { to: '/idn-academy', label: 'IDN Academy', icon: GraduationCap },
  { to: '/recognition', label: 'Recognition', icon: Award },
  { to: '/journey', label: 'Timmy Journey', icon: UserRoundSearch },
  { to: '/departments', label: 'Active Timmy List', icon: Building2 },
];

export default function Sidebar({ onNavigate }: { onNavigate?: () => void }) {
  return (
    <div className="h-full flex flex-col bg-[var(--surface)] border-r border-[var(--border-subtle)]">
      <div className="flex items-center gap-2.5 px-5 h-16 border-b border-[var(--border-subtle)] shrink-0">
        <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-[var(--color-brand-500)] to-[var(--color-brand-700)] grid place-items-center shrink-0 shadow-sm">
          <Sparkles size={16} className="text-white" />
        </div>
        <div className="leading-tight">
          <p className="text-sm font-semibold text-[var(--text-primary)]">Employee Experience</p>
          <p className="text-[11px] text-[var(--text-muted)]">IDN · P&amp;C</p>
        </div>
      </div>

      <nav className="flex-1 overflow-y-auto py-3 px-3 flex flex-col gap-1">
        {NAV_ITEMS.map(({ to, label, icon: Icon, end }) => (
          <NavLink
            key={to}
            to={to}
            end={end}
            onClick={onNavigate}
            className={({ isActive }) =>
              `flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-colors ${
                isActive
                  ? 'bg-[var(--color-brand-500)]/10 text-[var(--color-brand-600)] dark:text-[var(--color-brand-300)]'
                  : 'text-[var(--text-secondary)] hover:bg-[var(--canvas)] hover:text-[var(--text-primary)]'
              }`
            }
          >
            <Icon size={18} strokeWidth={2} />
            {label}
          </NavLink>
        ))}
      </nav>

      <div className="p-4 border-t border-[var(--border-subtle)] text-[11px] text-[var(--text-muted)] leading-relaxed">
        Not an HRIS or training tracker — this reads Club, Academy, Internship &amp; Kudos data to
        show the full Timmy experience.
      </div>
    </div>
  );
}
