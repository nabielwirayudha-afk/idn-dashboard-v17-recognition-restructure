import { useEffect, useRef, useState } from 'react';
import { useData } from '@/context/DataContext';
import { Filter as FilterIcon, ChevronDown, Check, RotateCcw } from 'lucide-react';
import type { GlobalFilters } from '@/types';

const MONTH_NAMES = ['January','February','March','April','May','June','July','August','September','October','November','December'];

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

/* ─── Custom dropdown (replaces native <select> so styling is fully
   consistent across browsers — native <select> option lists cannot be
   styled with CSS, which is why they looked inconsistent before). ─── */
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
  const [open, setOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function onClickOutside(e: MouseEvent) {
      if (rootRef.current && !rootRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    function onEscape(e: KeyboardEvent) {
      if (e.key === 'Escape') setOpen(false);
    }
    document.addEventListener('mousedown', onClickOutside);
    document.addEventListener('keydown', onEscape);
    return () => {
      document.removeEventListener('mousedown', onClickOutside);
      document.removeEventListener('keydown', onEscape);
    };
  }, []);

  const selected = options.find((o) => o.value === value);

  return (
    <div ref={rootRef} className={['group relative flex-1 min-w-0', compact ? 'px-3 py-1.5' : 'px-4 py-2'].join(' ')}>
      <span
        className={[
          'block font-bold uppercase tracking-wider text-[var(--text-muted)] leading-none',
          compact ? 'text-[8px] mb-0.5' : 'text-[10px] mb-1',
        ].join(' ')}
      >
        {label}
      </span>

      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className={[
          'flex items-center justify-between w-full gap-2 rounded-lg transition-colors',
          'hover:bg-[var(--canvas)]/70',
          open ? 'bg-[var(--canvas)]/70' : '',
        ].join(' ')}
      >
        <span className={['truncate font-semibold text-[var(--text-primary)]', compact ? 'text-xs' : 'text-sm'].join(' ')}>
          {selected?.label ?? 'All'}
        </span>
        <ChevronDown
          size={compact ? 12 : 14}
          className={['shrink-0 text-[var(--text-muted)] transition-transform', open ? 'rotate-180' : ''].join(' ')}
        />
      </button>

      {open && (
        <div
          className={[
            'absolute z-50 left-0 top-full mt-1.5',
            'w-full max-h-72 overflow-y-auto',
            'rounded-xl border border-[var(--border-subtle)] bg-[var(--surface)] shadow-lg py-1.5',
          ].join(' ')}
        >
          {options.map((o) => {
            const isSelected = o.value === value;
            return (
              <button
                key={o.value}
                type="button"
                onClick={() => {
                  onChange(o.value);
                  setOpen(false);
                }}
                className={[
                  'flex items-center justify-between w-full text-left px-3.5 py-2 text-sm transition-colors',
                  isSelected
                    ? 'bg-[var(--color-brand-500)]/10 text-[var(--color-brand-600)] font-semibold'
                    : 'text-[var(--text-primary)] hover:bg-[var(--canvas)]',
                ].join(' ')}
              >
                <span className="truncate">{o.label}</span>
                {isSelected && <Check size={14} className="shrink-0 ml-2" />}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}

export default function FilterBar({ fields = DEFAULT_FIELDS, compact = false }: { fields?: FilterField[]; compact?: boolean }) {
  const { filters, setFilters, resetFilters, options } = useData();

  const set = <K extends keyof GlobalFilters>(key: K, value: string) =>
    setFilters((f) => ({ ...f, [key]: value }));

  const has = (f: FilterField) => fields.includes(f);
  const hasActiveFilters = fields.some((f) => filters[f] !== 'All');

  return (
    <div
      className={[
        'w-full flex items-stretch',
        'rounded-full border border-[var(--border-subtle)] bg-[var(--surface)] shadow-sm',
        'divide-x divide-[var(--border-subtle)]',
        compact ? 'pl-3 pr-1.5 py-1' : 'pl-5 pr-2.5 py-1.5',
      ].join(' ')}
    >
      {/* "FILTERS" label with funnel icon */}
      <div className={['flex items-center gap-2 shrink-0', compact ? 'pr-3' : 'pr-4'].join(' ')}>
        <FilterIcon size={compact ? 12 : 14} className="text-[var(--color-brand-500)]" />
        <span className={['font-bold uppercase tracking-widest text-[var(--text-secondary)]', compact ? 'text-[9px]' : 'text-xs'].join(' ')}>
          Filters
        </span>
      </div>

      {has('year') && (
        <Select compact={compact} label="Year" value={filters.year} onChange={(v) => set('year', v)} options={[{ value: 'All', label: 'All' }, ...options.years.map((y) => ({ value: y, label: y }))]} />
      )}
      {has('quarter') && (
        <Select compact={compact} label="Quarter" value={filters.quarter} onChange={(v) => set('quarter', v)} options={[{ value: 'All', label: 'All' }, ...options.quarters.map((q) => ({ value: q, label: `Quarter ${q}` }))]} />
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
        <div className={['flex items-center shrink-0', compact ? 'pl-3' : 'pl-4'].join(' ')}>
          <button
            onClick={resetFilters}
            className={[
              'flex items-center gap-1.5 font-semibold text-[var(--color-brand-600)] dark:text-[var(--color-brand-300)]',
              'hover:opacity-70 transition-opacity rounded-full whitespace-nowrap',
              compact ? 'text-[10px] px-2 py-1' : 'text-xs px-3 py-1.5',
            ].join(' ')}
          >
            <RotateCcw size={compact ? 11 : 13} />
            Reset
          </button>
        </div>
      )}
    </div>
  );
}
