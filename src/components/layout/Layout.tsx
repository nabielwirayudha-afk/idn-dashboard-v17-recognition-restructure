import { ReactNode } from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import {
  LayoutDashboard,
  PartyPopper,
  GraduationCap,
  Heart,
  UserCircle,
  Users,
  Shield,
} from 'lucide-react';
import { useData } from '@/context/DataContext';
import FilterBar, { getFieldsForPath } from './FilterBar';

const navItems = [
  { to: '/', label: 'Overview', icon: LayoutDashboard },
  { to: '/idn-club', label: 'IDN Club', icon: PartyPopper },
  { to: '/idn-academy', label: 'IDN Academy', icon: GraduationCap },
  { to: '/recognition', label: 'Recognition', icon: Heart },
  { to: '/employee-journey', label: 'Timmy Journey', icon: UserCircle },
  { to: '/department-analytics', label: 'Active Timmy List', icon: Users },
];

interface LayoutProps {
  children: ReactNode;
}

export default function Layout({ children }: LayoutProps) {
  const data = useData();
  const location = useLocation();

  const { status, department, isAdmin, token } = data;

  // Token comes from app state (the real source of truth, already resolved
  // from the URL or session storage on load) rather than from the current
  // URL's query string — that way every internal link keeps carrying the
  // right token even after the browser address bar has already dropped it.
  const tokenSearch = token ? `?t=${encodeURIComponent(token)}` : '';

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

  const filterFields = getFieldsForPath(location.pathname).filter((f) => f !== 'department' || isAdmin);

  return (
    <div className="flex h-screen bg-white overflow-hidden">
      {/* SIDEBAR — logo + navigation only */}
      <aside className="w-[220px] flex-shrink-0 flex flex-col bg-white border-r border-[#E0C4B8] overflow-y-auto">
        <div className="px-5 pt-6 pb-4">
          <div className="flex items-center gap-3">
            <img src="/idn-logo.png" alt="IDN" className="h-8 w-auto object-contain" />
          </div>
          <div className="mt-3">
            <h1 className="text-sm font-bold text-[#52423D] leading-tight">Timmy Experience Dashboard</h1>
            <p className="text-xs text-[#9A6A75] mt-0.5">People & Culture IDN</p>
          </div>
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
                    to={`${item.to}${tokenSearch}`}
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

        {/* Department / role status stays anchored at the bottom of the sidebar */}
        <div className="px-4 pb-5">
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
      </aside>

      {/* MAIN AREA — top filter bar + page content */}
      <div className="flex-1 flex flex-col overflow-hidden">
        <div className="shrink-0 bg-white border-b border-[#F0E4DE] px-6 py-3">
          <FilterBar fields={filterFields} />
        </div>

        {status.kind === 'loading' && (
          <div className="shrink-0 bg-[#FFF7F3] border-b border-[#F0E4DE] px-6 py-2 flex items-center gap-2">
            <div className="h-3 w-3 rounded-full border-2 border-[#9A6A75] border-t-transparent animate-spin shrink-0" />
            <span className="text-xs text-[#9A6A75]">
              Memuat data terbaru dari server — angka dan grafik akan otomatis terisi begitu data siap.
            </span>
          </div>
        )}

        <main className="flex-1 overflow-y-auto p-6 bg-white">
          {children}
        </main>
      </div>
    </div>
  );
}
