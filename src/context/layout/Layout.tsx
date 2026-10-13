import { ReactNode } from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import {
  LayoutDashboard,
  PartyPopper,
  GraduationCap,
  Heart,
  UserCircle,
  Users,
  ChevronDown,
  Shield,
} from 'lucide-react';
import { useData } from '@/context/DataContext';

const navItems = [
  { to: '/', label: 'Overview', icon: LayoutDashboard },
  { to: '/idn-club', label: 'IDN Club', icon: PartyPopper },
  { to: '/idn-academy', label: 'IDN Academy', icon: GraduationCap },
  { to: '/recognition', label: 'Recognition', icon: Heart },
  { to: '/employee-journey', label: 'Timmy Journey', icon: UserCircle },
  { to: '/department-analytics', label: 'Active Timmy List', icon: Users },
];

const MONTH_NAMES: Record<string, string> = {
  '1': 'January', '2': 'February', '3': 'March', '4': 'April',
  '5': 'May', '6': 'June', '7': 'July', '8': 'August',
  '9': 'September', '10': 'October', '11': 'November', '12': 'December',
};

const QUARTER_NAMES: Record<string, string> = {
  '1': 'Q1', '2': 'Q2', '3': 'Q3', '4': 'Q4',
};

interface LayoutProps {
  children: ReactNode;
}

export default function Layout({ children }: LayoutProps) {
  const data = useData();
  const location = useLocation();

  const { filters, setFilters, options, status, department, isAdmin } = data;

  if (status.kind === 'loading') {
    return (
      <div className="flex h-screen items-center justify-center bg-[#F5E8E2]">
        <div className="text-center">
          <div className="mb-4 h-10 w-10 animate-spin rounded-full border-4 border-[#9A6A75] border-t-transparent mx-auto" />
          <p className="text-lg font-semibold text-[#52423D]">Memuat data dashboard...</p>
          <p className="text-sm text-[#9A6A75] mt-1">Mengambil data dari server</p>
        </div>
      </div>
    );
  }

  if (status.kind === 'sample' && status.reason?.includes('Token')) {
    return (
      <div className="flex h-screen items-center justify-center bg-[#F5E8E2]">
        <div className="text-center max-w-md p-8 rounded-2xl border border-red-300 bg-white shadow-lg">
          <div className="text-5xl mb-4">🔒</div>
          <h2 className="text-xl font-bold text-red-600 mb-2">Akses Ditolak</h2>
          <p className="text-[#52423D] mb-4">{status.reason}</p>
          <p className="text-sm text-[#9A6A75]">
            Pastikan URL kamu benar dengan format:<br/>
            <code className="text-[#9A6A75] font-mono bg-[#F5E8E2] px-2 py-1 rounded">
              ?t=TOKEN_KAMU
            </code>
          </p>
        </div>
      </div>
    );
  }

  const handleChange = (key: string, value: string) => {
    setFilters((prev) => ({ ...prev, [key]: value }));
  };

  const FilterSelect = ({ label, value, options: opts, onChange, formatLabel }: {
    label: string;
    value: string;
    options: string[];
    onChange: (v: string) => void;
    formatLabel?: (v: string) => string;
  }) => (
    <div className="relative">
      <label className="text-[10px] font-semibold uppercase tracking-wider text-[#A68E84] mb-1 block">{label}</label>
      <select
        value={value ?? 'All'}
        onChange={(e) => onChange(e.target.value)}
        className="w-full appearance-none bg-[#F5E8E2] border border-[#E0C4B8] rounded-lg px-3 py-2 text-sm text-[#52423D] focus:outline-none focus:border-[#9A6A75]"
      >
        {opts.map((opt) => (
          <option key={opt} value={opt}>{formatLabel ? formatLabel(opt) : opt}</option>
        ))}
      </select>
      <ChevronDown size={14} className="absolute right-3 top-[26px] text-[#A68E84] pointer-events-none" />
    </div>
  );

  return (
    <div className="flex h-screen bg-white overflow-hidden">
      <aside className="w-[260px] flex-shrink-0 flex flex-col bg-white border-r border-[#E0C4B8] overflow-y-auto">
        <div className="px-5 pt-6 pb-4">
          <div className="flex items-center gap-3">
            <img src="/idn-logo.png" alt="IDN" className="h-8 w-auto object-contain" />
          </div>
          <div className="mt-3">
            <h1 className="text-sm font-bold text-[#52423D] leading-tight">Employee Experience Dashboard</h1>
            <p className="text-xs text-[#9A6A75] mt-0.5">People & Culture IDN</p>
          </div>
        </div>

        <div className="px-4 pb-3">
          <div className="rounded-lg bg-[#F5E8E2] border border-[#E0C4B8] p-3">
            <div className="flex items-center gap-2">
              <div className={`h-2 w-2 rounded-full ${status.kind === 'live' ? 'bg-green-500' : 'bg-yellow-500'}`} />
              <span className="text-xs font-medium text-[#9A6A75] uppercase tracking-wider">Departemen</span>
            </div>
            <p className="text-sm font-bold text-[#52423D] mt-1">
              {department || '—'}
            </p>
            {isAdmin && (
              <div className="mt-1 flex items-center gap-1 text-xs text-[#9A6A75]">
                <Shield size={12} />
                <span>Administrator</span>
              </div>
            )}
          </div>
        </div>

        <div className="px-4 pb-4 space-y-2">
          <FilterSelect
            label="Year"
            value={filters.year}
            options={['All', ...options.years]}
            onChange={(v) => handleChange('year', v)}
          />
          <FilterSelect
            label="Quarter"
            value={filters.quarter}
            options={['All', ...options.quarters]}
            onChange={(v) => handleChange('quarter', v)}
            formatLabel={(v) => v === 'All' ? 'All' : QUARTER_NAMES[v] ?? v}
          />
          <FilterSelect
            label="Month"
            value={filters.month}
            options={['All', ...options.months]}
            onChange={(v) => handleChange('month', v)}
            formatLabel={(v) => v === 'All' ? 'All' : MONTH_NAMES[v] ?? v}
          />

          {/* FILTER DEPARTMENT: HANYA MUNCUL KALAU ADMIN */}
          {isAdmin && (
            <FilterSelect
              label="Department"
              value={filters.department}
              options={['All', ...options.departments]}
              onChange={(v) => handleChange('department', v)}
            />
          )}

          <FilterSelect
            label="Location"
            value={filters.location}
            options={['All', ...options.locations]}
            onChange={(v) => handleChange('location', v)}
          />
        </div>

        <nav className="flex-1 px-3 pb-4">
          <div className="text-[10px] font-semibold uppercase tracking-wider text-[#A68E84] px-3 mb-2">Menu</div>
          <ul className="space-y-1">
            {navItems.map((item) => {
              const isActive = location.pathname === item.to || (item.to !== '/' && location.pathname.startsWith(item.to));
              const Icon = item.icon;
              return (
                <li key={item.to}>
                  <NavLink
                    to={item.to}
                    end={item.to === '/'}
                    className={({ isActive: active }) =>
                      `flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                        active || isActive
                          ? 'bg-[#9A6A75]/10 text-[#9A6A75]'
                          : 'text-[#9A6A75] hover:bg-[#F5E8E2] hover:text-[#52423D]'
                      }`
                    }
                  >
                    <Icon size={18} />
                    {item.label}
                  </NavLink>
                </li>
              );
            })}
          </ul>
        </nav>
      </aside>

      <main className="flex-1 overflow-y-auto p-6 bg-white">
        {children}
      </main>
    </div>
  );
}
