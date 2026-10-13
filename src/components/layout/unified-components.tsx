/* ============================================================
   Unified UI Components
   Single source of truth for all reusable UI elements.
   Copy these into your src/components/ui/ folder.
   ============================================================ */

import React from 'react';
import { ArrowUpDown } from 'lucide-react';

/* ----------------------------------------------------------
   1. PAGE HEADER
   ---------------------------------------------------------- */
interface PageHeaderProps {
  title: string;
  subtitle?: string;
}

export function PageHeader({ title, subtitle }: PageHeaderProps) {
  return (
    <div className="page-header">
      <h1 className="page-header__title">{title}</h1>
      {subtitle && <p className="page-header__subtitle">{subtitle}</p>}
    </div>
  );
}

/* ----------------------------------------------------------
   2. SECTION HEADER
   For sub-sections within a page (e.g. "IDN Kudos", "Timmy of the Month")
   ---------------------------------------------------------- */
interface SectionHeaderProps {
  title: string;
}

export function SectionHeader({ title }: SectionHeaderProps) {
  return <h2 className="section-header">{title}</h2>;
}

/* ----------------------------------------------------------
   3. KPI CARD (Dark theme — for stat cards at top of pages)
   ---------------------------------------------------------- */
interface KpiCardProps {
  label: string;
  value: string;
  subLabel?: string;
  icon: React.ReactNode;
  accent?: string;        /* default: var(--color-brand-500) */
  onClick?: () => void;
}

export function KpiCard({ label, value, subLabel, icon, accent, onClick }: KpiCardProps) {
  const accentColor = accent || 'var(--color-brand-500)';
  return (
    <div
      onClick={onClick}
      className={`
        relative overflow-hidden rounded-xl p-5
        bg-[var(--color-kpi-bg)] text-[var(--color-kpi-text)]
        transition-all duration-200 ease-out
        ${onClick ? 'cursor-pointer hover:shadow-lg hover:-translate-y-0.5' : ''}
      `}
    >
      {/* Accent top line */}
      <div
        className="absolute top-0 left-0 right-0 h-1"
        style={{ backgroundColor: accentColor }}
      />

      <div className="flex items-start justify-between mb-3">
        <span className="text-xs font-medium uppercase tracking-wider text-[var(--color-text-muted)]">
          {label}
        </span>
        <span
          className="grid place-items-center w-8 h-8 rounded-lg"
          style={{ backgroundColor: `${accentColor}20`, color: accentColor }}
        >
          {icon}
        </span>
      </div>

      <div className="text-3xl font-bold tracking-tight tabular">
        {value}
      </div>

      {subLabel && (
        <p className="mt-1 text-xs text-[var(--color-text-muted)]">
          {subLabel}
        </p>
      )}
    </div>
  );
}

/* ----------------------------------------------------------
   4. CHART CARD (Light panel — for charts, tables, grids)
   ---------------------------------------------------------- */
interface ChartCardProps {
  title: string;
  subtitle?: string;
  children: React.ReactNode;
  className?: string;
  height?: string;   /* e.g. "h-80" */
}

export function ChartCard({ title, subtitle, children, className = '', height }: ChartCardProps) {
  return (
    <div
      className={`
        rounded-xl border border-[var(--color-border-default)]
        bg-[var(--color-panel-bg)] text-[var(--color-panel-text)]
        p-5 flex flex-col
        ${className}
      `}
    >
      <div className="mb-4">
        <h3 className="text-sm font-semibold text-[var(--color-panel-text)]">
          {title}
        </h3>
        {subtitle && (
          <p className="text-xs text-[var(--color-text-muted)] mt-0.5">
            {subtitle}
          </p>
        )}
      </div>
      <div className={`flex-1 min-h-0 ${height || ''}`}>
        {children}
      </div>
    </div>
  );
}

/* ----------------------------------------------------------
   5. INSIGHT CARD (Key Insight section)
   ---------------------------------------------------------- */
interface InsightItem {
  label: string;
  text: string;
}

interface InsightCardProps {
  title?: string;
  icon?: React.ReactNode;
  insights: InsightItem[];
}

export function InsightCard({
  title = 'Key Insight',
  icon,
  insights,
}: InsightCardProps) {
  return (
    <div className="insight-card">
      <div className="insight-card__header">
        <span className="insight-card__icon-box">
          {icon || (
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2" />
            </svg>
          )}
        </span>
        <h3 className="insight-card__title">{title}</h3>
      </div>
      <ul className="insight-card__list">
        {insights.map((insight, i) => (
          <li key={i} className="insight-card__item">
            <span className="insight-card__bullet" />
            <p className="insight-card__text">
              <span className="insight-card__label">{insight.label}:</span>{' '}
              {insight.text}
            </p>
          </li>
        ))}
      </ul>
    </div>
  );
}

/* ----------------------------------------------------------
   6. SEARCH INPUT
   ---------------------------------------------------------- */
interface SearchInputProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  icon?: React.ReactNode;
}

export function SearchInput({
  value,
  onChange,
  placeholder = 'Search…',
  icon,
}: SearchInputProps) {
  return (
    <div className="search-input">
      <span className="search-input__icon">
        {icon || (
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="11" cy="11" r="8" />
            <path d="m21 21-4.3-4.3" />
          </svg>
        )}
      </span>
      <input
        type="text"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="search-input__field"
      />
    </div>
  );
}

/* ----------------------------------------------------------
   7. DATA TABLE
   ---------------------------------------------------------- */
interface Column<T> {
  key: string;
  header: React.ReactNode;
  cell: (row: T, index: number) => React.ReactNode;
  className?: string;
}

interface DataTableProps<T> {
  columns: Column<T>[];
  data: T[];
  emptyMessage?: string;
}

export function DataTable<T>({
  columns,
  data,
  emptyMessage = 'No data available.',
}: DataTableProps<T>) {
  return (
    <div className="table-container">
      <div className="table-container__scroll">
        <table>
          <thead>
            <tr>
              {columns.map((col) => (
                <th key={col.key} className={col.className || ''}>
                  {col.header}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {data.length === 0 ? (
              <tr>
                <td
                  colSpan={columns.length}
                  className="text-center py-10 text-sm text-[var(--color-text-muted)]"
                >
                  {emptyMessage}
                </td>
              </tr>
            ) : (
              data.map((row, i) => (
                <tr key={i}>
                  {columns.map((col) => (
                    <td key={col.key} className={col.className || ''}>
                      {col.cell(row, i)}
                    </td>
                  ))}
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

/* ----------------------------------------------------------
   8. SORT HEADER BUTTON (for table columns)
   ---------------------------------------------------------- */
interface SortHeaderProps {
  label: string;
  active?: boolean;
  onClick?: () => void;
}

export function SortHeader({ label, active, onClick }: SortHeaderProps) {
  return (
    <button onClick={onClick} className="sort-header">
      {label}
      <ArrowUpDown
        size={12}
        className={active ? 'sort-header__icon--active' : 'sort-header__icon'}
      />
    </button>
  );
}

/* ----------------------------------------------------------
   9. BADGE
   ---------------------------------------------------------- */
interface BadgeProps {
  children: React.ReactNode;
  variant?: 'success' | 'warning' | 'danger' | 'info' | 'default';
}

export function Badge({ children, variant = 'default' }: BadgeProps) {
  const variants = {
    success: 'bg-[var(--color-success-bg)] text-[var(--color-success)]',
    warning: 'bg-[var(--color-warning-bg)] text-[var(--color-warning)]',
    danger: 'bg-[var(--color-danger-bg)] text-[var(--color-danger)]',
    info: 'bg-[var(--color-info-bg)] text-[var(--color-info)]',
    default: 'bg-[var(--color-surface-sunken)] text-[var(--color-text-secondary)]',
  };

  return (
    <span
      className={`
        inline-flex items-center px-2.5 py-0.5 rounded-full
        text-xs font-medium
        ${variants[variant]}
      `}
    >
      {children}
    </span>
  );
}
