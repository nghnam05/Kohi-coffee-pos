'use client';

import React from 'react';
import { cn } from '@/lib/utils';

export type AlertSeverity = 'info' | 'warning' | 'error' | 'success';

/**
 * Inline Alert vs. Callout vs. Banner — NameThatUI Pattern: /web/alert-callout-banner
 * Specification: In-page notices named by where they sit (Inline Alert, Callout box, Full-width Banner).
 */
export interface InlineAlertProps extends Omit<React.HTMLAttributes<HTMLDivElement>, 'title'> {
  severity?: AlertSeverity;
  title?: React.ReactNode;
  icon?: React.ReactNode;
  dismissible?: boolean;
  onDismiss?: () => void;
  children: React.ReactNode;
}

export const InlineAlert: React.FC<InlineAlertProps> = ({
  severity = 'info',
  title,
  icon,
  dismissible = false,
  onDismiss,
  children,
  className,
  ...props
}) => {
  const severityStyles: Record<AlertSeverity, { container: string; border: string; title: string; iconColor: string }> = {
    info: {
      container: 'bg-sky-500/10 dark:bg-sky-950/30 text-sky-900 dark:text-sky-200',
      border: 'border-l-4 border-l-[#38BDF8] border-slate-200/60 dark:border-white/10',
      title: 'text-[#0284c7] dark:text-[#38BDF8]',
      iconColor: 'text-[#38BDF8]',
    },
    warning: {
      container: 'bg-amber-500/10 dark:bg-amber-950/30 text-amber-900 dark:text-amber-200',
      border: 'border-l-4 border-l-amber-500 border-slate-200/60 dark:border-white/10',
      title: 'text-amber-600 dark:text-amber-400',
      iconColor: 'text-amber-500',
    },
    error: {
      container: 'bg-rose-500/10 dark:bg-rose-950/30 text-rose-900 dark:text-rose-200',
      border: 'border-l-4 border-l-rose-500 border-slate-200/60 dark:border-white/10',
      title: 'text-rose-600 dark:text-rose-400',
      iconColor: 'text-rose-500',
    },
    success: {
      container: 'bg-emerald-500/10 dark:bg-emerald-950/30 text-emerald-900 dark:text-emerald-200',
      border: 'border-l-4 border-l-emerald-500 border-slate-200/60 dark:border-white/10',
      title: 'text-emerald-600 dark:text-emerald-400',
      iconColor: 'text-emerald-500',
    },
  };

  const current = severityStyles[severity];

  return (
    <div
      role="alert"
      className={cn(
        'rounded-xl p-3.5 sm:p-4 border transition-all text-xs font-normal relative flex items-start gap-3',
        current.container,
        current.border,
        className
      )}
      {...props}
    >
      {icon && <div className={cn('shrink-0 mt-0.5 text-base', current.iconColor)}>{icon}</div>}
      <div className="flex-1 min-w-0">
        {title && (
          <h4 className={cn('text-xs font-extrabold tracking-wide mb-1 leading-snug', current.title)}>
            {title}
          </h4>
        )}
        <div className="leading-relaxed opacity-95">{children}</div>
      </div>
      {dismissible && onDismiss && (
        <button
          type="button"
          onClick={onDismiss}
          aria-label="Dismiss alert"
          className="shrink-0 p-1 -mr-1 -mt-1 text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 rounded-lg cursor-pointer transition-colors"
        >
          ✕
        </button>
      )}
    </div>
  );
};
