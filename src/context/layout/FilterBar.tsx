import { useData } from '@/context/DataContext';
import { RotateCcw } from 'lucide-react';
import type { GlobalFilters } from '@/types';

const MONTH_NAMES = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];

export type FilterField = 'year' | 'quarter' | 'month' | 'department' | 'location' | 'employmentStatus' | 'employeeName' | 'email';

const DEFAULT_FIELDS: FilterField[] = ['year', 'quarter', 'month', 'department', 'location'];

/** Per the Filter Bar revision brief: which filters are available on each
 * tab. Overview / IDN Club / IDN Academy / Recognition keep the original
 * set; Employee Journey and Active Employee List get their own reduced set. */
export function getFieldsForPath(pathname: string): FilterField[] {
  if (pathname.startsWith('/journey')) return ['year', 'quarter', 'department'];
  if (pathname.startsWith('/departments')) return ['department'];
  return DEFAULT_FIELDS;
}

function Select({
  label,
  value,
  onChange,
  options,
  compact,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  options: { value: string; label: string }[];
  compact?: boolean;
}) {
  if (compact) {
    return (
      <label className="flex flex-col gap-0.5 min-w-[86px]">
        <span className="text-[9px] font-medium uppercase tracking-wide text-[var(--text-muted)] leading-none">{label}</span>
        <select
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className="text-xs bg-[var(--canvas)] border border-[var(--border-subtle)] rounded-md px-2 py-1 text-[var(--text-primary)] focus:outline-none focus:ring-2 focus:ring-[var(--color-brand-500)]/40 cursor-pointer"
        >
          {options.map((o) => (
            <option key={o.value} value={o.value}>
              {o.label}
            </option>
          ))}
        </select>
      </label>
    );
  }

  return (
    <label className="flex flex-col gap-1 min-w-[112px]">
      <span className="text-[10px] font-medium uppercase tracking-wide text-[var(--text-muted)]">{label}</span>
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="text-sm bg-[var(--canvas)] border border-[var(--border-subtle)] rounded-lg px-2.5 py-1.5 text-[var(--text-primary)] focus:outline-none focus:ring-2 focus:ring-[var(--color-brand-500)]/40 cursor-pointer"
      >
        {options.map((o) => (
          <option key={o.value} value={o.value}>
            {o.label}
          </option>
        ))}
      </select>
    </label>
  );
}

export default function FilterBar({ fields = DEFAULT_FIELDS, compact = false }: { fields?: FilterField[]; compact?: boolean }) {
  const { filters, setFilters, resetFilters, options } = useData();

  const set = <K extends keyof GlobalFilters>(key: K, value: string) =>
    setFilters((f) => ({ ...f, [key]: value }));

  const has = (f: FilterField) => fields.includes(f);
  const hasActiveFilters = fields.some((f) => filters[f] !== 'All');

  return (
    <div className={compact ? 'flex flex-wrap items-end gap-2' : 'flex flex-wrap items-end gap-3 p-4 rounded-2xl border border-[var(--border-subtle)] bg-[var(--surface)]'}>
      {has('year') && (
        <Select compact={compact} label="Year" value={filters.year} onChange={(v) => set('year', v)} options={[{ value: 'All', label: 'All' }, ...options.years.map((y) => ({ value: y, label: y }))]} />
      )}
      {has('quarter') && (
        <Select compact={compact} label="Quarter" value={filters.quarter} onChange={(v) => set('quarter', v)} options={[{ value: 'All', label: 'All' }, ...options.quarters.map((q) => ({ value: q, label: `Q${q}` }))]} />
      )}
      {has('month') && (
        <Select compact={compact} label="Month" value={filters.month} onChange={(v) => set('month', v)} options={[{ value: 'All', label: 'All' }, ...options.months.map((m) => ({ value: m, label: MONTH_NAMES[Number(m) - 1] }))]} />
      )}
      {has('department') && (
        <Select compact={compact} label="Department" value={filters.department} onChange={(v) => set('department', v)} options={[{ value: 'All', label: 'All' }, ...options.departments.map((d) => ({ value: d, label: d }))]} />
      )}
      {has('location') && (
        <Select compact={compact} label="Location" value={filters.location} onChange={(v) => set('location', v)} options={[{ value: 'All', label: 'All' }, ...options.locations.map((l) => ({ value: l, label: l }))]} />
      )}
      {has('employmentStatus') && (
        <Select compact={compact} label="Status" value={filters.employmentStatus} onChange={(v) => set('employmentStatus', v)} options={[{ value: 'All', label: 'All' }, ...options.employmentStatuses.map((s) => ({ value: s, label: s }))]} />
      )}
      {has('employeeName') && (
        <Select compact={compact} label="Employee" value={filters.employeeName} onChange={(v) => set('employeeName', v)} options={[{ value: 'All', label: 'All' }, ...options.employeeNames.map((n) => ({ value: n, label: n }))]} />
      )}
      {has('email') && (
        <Select compact={compact} label="Email" value={filters.email} onChange={(v) => set('email', v)} options={[{ value: 'All', label: 'All' }, ...options.emails.map((e) => ({ value: e, label: e }))]} />
      )}

      {hasActiveFilters && (
        <button
          onClick={resetFilters}
          className={`flex items-center gap-1.5 font-medium text-[var(--color-brand-600)] dark:text-[var(--color-brand-300)] hover:opacity-80 rounded-lg ${compact ? 'text-[10px] px-1.5 py-1' : 'text-xs px-2.5 py-1.5'}`}
        >
          <RotateCcw size={compact ? 11 : 13} />
          Reset
        </button>
      )}
    </div>
  );
}
