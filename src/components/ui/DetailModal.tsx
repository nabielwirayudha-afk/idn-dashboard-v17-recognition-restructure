import { X } from 'lucide-react';

interface DetailItem {
  label: string;
  sub?: string;
  date?: string;
}

// Strip any time portion from a date string, keeping just YYYY-MM-DD (or whatever precedes it).
function formatDateOnly(date?: string): string | undefined {
  if (!date) return date;
  return date.split('T')[0].split(' ')[0];
}

interface DetailModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  subtitle?: string;
  items: DetailItem[];
}

export default function DetailModal({ isOpen, onClose, title, subtitle, items }: DetailModalProps) {
  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center"
      style={{ backgroundColor: 'rgba(0, 0, 0, 0.5)' }}
    >
      <div
        className="rounded-xl border shadow-lg w-full max-w-2xl mx-4 max-h-[80vh] flex flex-col"
        style={{
          backgroundColor: 'var(--surface, #FFFFFF)',
          borderColor: 'var(--border-default, #E0C4B8)',
        }}
      >
        {/* Header */}
        <div
          className="flex items-center justify-between px-5 py-4"
          style={{ borderBottom: '1px solid var(--border-default, #E0C4B8)' }}
        >
          <div>
            <h3 className="text-base font-semibold" style={{ color: 'var(--text-primary, #2B2D42)' }}>
              {title}
            </h3>
            {subtitle && (
              <p className="text-xs mt-0.5" style={{ color: 'var(--text-muted, #9A6A75)' }}>
                {subtitle}
              </p>
            )}
          </div>
          <button
            onClick={onClose}
            className="grid place-items-center w-8 h-8 rounded-lg transition-colors"
            style={{ color: 'var(--text-muted, #9A6A75)' }}
            onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = 'var(--canvas, #F5F0EE)')}
            onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = 'transparent')}
          >
            <X size={18} />
          </button>
        </div>

        {/* Content */}
        <div className="overflow-y-auto p-4">
          {items.length === 0 ? (
            <p className="text-sm text-center py-8" style={{ color: 'var(--text-muted, #9A6A75)' }}>
              No records found.
            </p>
          ) : (
            <ul className="space-y-2">
              {items.map((item, i) => (
                <li
                  key={i}
                  className="flex items-start justify-between gap-3 px-3 py-2.5 rounded-lg"
                  style={{ backgroundColor: 'var(--canvas, #F5F0EE)' }}
                >
                  <div className="min-w-0">
                    <p className="text-sm font-medium break-words" style={{ color: 'var(--text-primary, #2B2D42)' }}>
                      {item.label}
                    </p>
                    {item.sub && (
                      <p className="text-xs break-words mt-0.5" style={{ color: 'var(--text-muted, #9A6A75)' }}>
                        {item.sub}
                      </p>
                    )}
                  </div>
                  {item.date && (
                    <span
                      className="text-xs whitespace-nowrap tabular"
                      style={{ color: 'var(--text-muted, #9A6A75)' }}
                    >
                      {formatDateOnly(item.date)}
                    </span>
                  )}
                </li>
              ))}
            </ul>
          )}
        </div>

        {/* Footer */}
        <div
          className="px-5 py-3 text-right"
          style={{ borderTop: '1px solid var(--border-default, #E0C4B8)' }}
        >
          <span className="text-xs" style={{ color: 'var(--text-muted, #9A6A75)' }}>
            {items.length} record{items.length !== 1 ? 's' : ''}
          </span>
        </div>
      </div>
    </div>
  );
}
