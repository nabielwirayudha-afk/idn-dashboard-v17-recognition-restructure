import { ShieldAlert, Lock, Mail, ArrowLeft } from 'lucide-react';

interface DeptAccessUnavailableProps {
  reason?: 'invalid' | 'missing' | 'error';
  message?: string;
  onBack?: () => void;
}

export default function DeptAccessUnavailable({
  reason = 'invalid',
  message,
  onBack,
}: DeptAccessUnavailableProps) {
  const config = {
    invalid: {
      icon: ShieldAlert,
      title: 'Access Unavailable',
      description:
        message ||
        'The access link you used is invalid or has expired. Please contact your administrator to request a new department access link.',
      action: 'Contact your HR or Admin team for a valid link.',
    },
    missing: {
      icon: Lock,
      title: 'Access Token Required',
      description:
        message ||
        'This page requires a department access token. Please use the link provided by your administrator.',
      action: 'Check your email for the department report link.',
    },
    error: {
      icon: ShieldAlert,
      title: 'Something Went Wrong',
      description:
        message ||
        'We could not verify your access at this time. Please try again later or contact support.',
      action: 'Refresh the page or contact your administrator.',
    },
  };

  const { icon: Icon, title, description, action } = config[reason];

  return (
    <div className="min-h-screen flex items-center justify-center bg-[var(--color-canvas)] p-6">
      <div className="max-w-md w-full text-center space-y-6">
        <div className="mx-auto w-20 h-20 rounded-full bg-[var(--color-surface)] border border-[var(--color-border-subtle)] flex items-center justify-center">
          <Icon className="w-10 h-10 text-[var(--color-accent)]" />
        </div>

        <div className="space-y-2">
          <h1 className="text-2xl font-bold text-[var(--color-text-primary)]">{title}</h1>
          <p className="text-[var(--color-text-secondary)] leading-relaxed">{description}</p>
        </div>

        <div className="p-4 rounded-xl bg-[var(--color-surface)] border border-[var(--color-border-subtle)]">
          <p className="text-sm text-[var(--color-text-muted)] flex items-center justify-center gap-2">
            <Mail className="w-4 h-4" />
            {action}
          </p>
        </div>

        {onBack && (
          <button
            onClick={onBack}
            className="inline-flex items-center gap-2 text-sm text-[var(--color-accent)] hover:underline transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to Dashboard
          </button>
        )}

        <p className="text-xs text-[var(--color-text-muted)]">
          If you believe this is an error, please contact your system administrator.
        </p>
      </div>
    </div>
  );
}
