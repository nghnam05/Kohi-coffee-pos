'use client';

import React from 'react';
import { cn } from '@/lib/utils';

export type StatusDotVariant = 'available' | 'serving' | 'reserved' | 'cancelled' | 'offline' | 'warning';

export interface StatusDotProps extends React.HTMLAttributes<HTMLSpanElement> {
  status: StatusDotVariant;
  size?: 'sm' | 'md' | 'lg';
  ping?: boolean;
  label?: string;
}

/**
 * Status Dot (Presence Indicator) — NameThatUI Pattern: /web/status-dot
 * Specification: The tiny colored circle on an avatar or row that says online, away, busy or live.
 */
export const StatusDot: React.FC<StatusDotProps> = ({
  status = 'available',
  size = 'md',
  ping = true,
  label,
  className,
  ...props
}) => {
  const sizeMap = {
    sm: 'w-2 h-2',
    md: 'w-2.5 h-2.5',
    lg: 'w-3 h-3',
  };

  const colorConfig: Record<StatusDotVariant, { bg: string; ring: string; text: string }> = {
    available: {
      bg: 'bg-emerald-500',
      ring: 'bg-emerald-400',
      text: 'text-emerald-600 dark:text-emerald-400',
    },
    serving: {
      bg: 'bg-[#38BDF8]',
      ring: 'bg-[#38BDF8]',
      text: 'text-[#38BDF8]',
    },
    reserved: {
      bg: 'bg-amber-500',
      ring: 'bg-amber-400',
      text: 'text-amber-600 dark:text-amber-400',
    },
    cancelled: {
      bg: 'bg-rose-500',
      ring: 'bg-rose-400',
      text: 'text-rose-600 dark:text-rose-400',
    },
    offline: {
      bg: 'bg-slate-400',
      ring: 'bg-slate-300',
      text: 'text-slate-500 dark:text-slate-400',
    },
    warning: {
      bg: 'bg-orange-500',
      ring: 'bg-orange-400',
      text: 'text-orange-500',
    },
  };

  const current = colorConfig[status] || colorConfig.available;

  return (
    <span
      role="status"
      aria-label={label || status}
      className={cn('inline-flex items-center gap-2 font-normal', className)}
      {...props}
    >
      <span className={cn('relative flex items-center justify-center', sizeMap[size])}>
        {ping && status !== 'offline' && (
          <span
            className={cn(
              'animate-ping absolute inline-flex h-full w-full rounded-full opacity-75',
              current.ring
            )}
          />
        )}
        <span className={cn('relative inline-flex rounded-full', sizeMap[size], current.bg)} />
      </span>
      {label && (
        <span className={cn('text-xs font-extrabold uppercase tracking-wider', current.text)}>
          {label}
        </span>
      )}
    </span>
  );
};
