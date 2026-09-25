'use client';

import React from 'react';

export interface SegmentedOption<T extends string> {
  value: T;
  label: React.ReactNode;
  icon?: React.ReactNode;
  count?: number | string;
}

export interface SegmentedControlProps<T extends string> {
  options: SegmentedOption<T>[];
  value: T;
  onChange: (value: T) => void;
  size?: 'sm' | 'md' | 'lg';
  fullWidth?: boolean;
  className?: string;
  itemClassName?: string;
  id?: string;
}

export function SegmentedControl<T extends string>({
  options,
  value,
  onChange,
  size = 'md',
  fullWidth = false,
  className = '',
  itemClassName = '',
  id,
}: SegmentedControlProps<T>) {
  const isFullWidth = fullWidth || className.includes('w-full');

  const sizeClasses = {
    sm: 'p-1 text-[11px] sm:text-xs',
    md: 'p-1 text-xs sm:text-xs md:text-[13px]',
    lg: 'p-1 sm:p-1.5 text-xs sm:text-sm',
  };

  const itemSizeClasses = {
    sm: 'px-1.5 sm:px-2 py-1.5 min-h-[34px]',
    md: 'px-2 sm:px-2.5 py-1.5 sm:py-2 min-h-[38px]',
    lg: 'px-3 sm:px-4 py-2.5 sm:py-3 min-h-[44px] sm:min-h-[48px]',
  };

  return (
    <div
      id={id}
      role="tablist"
      className={`rounded-2xl bg-slate-100 dark:bg-white/5 border border-slate-200/80 dark:border-white/5 select-none transition-all ${
        sizeClasses[size]
      } ${isFullWidth ? 'w-full flex' : 'inline-flex'} ${className}`}
    >
      {options.map((opt) => {
        const isActive = opt.value === value;
        return (
          <button
            key={opt.value}
            type="button"
            role="tab"
            aria-selected={isActive}
            tabIndex={isActive ? 0 : -1}
            onClick={() => onChange(opt.value)}
            className={`relative flex items-center justify-center gap-1 sm:gap-1.5 rounded-xl transition-all duration-200 cursor-pointer active:scale-[0.98] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#38BDF8] focus-visible:ring-offset-2 ${
              itemSizeClasses[size]
            } ${isFullWidth ? 'flex-1 min-w-0' : ''} ${
              isActive
                ? 'bg-white dark:bg-[#131929] text-slate-900 dark:text-white shadow-xs font-black border border-slate-200/80 dark:border-[#38BDF8]/30'
                : 'text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white font-bold hover:bg-slate-200/50 dark:hover:bg-white/[0.03] border border-transparent'
            } ${itemClassName}`}
          >
            {opt.icon && <span className="shrink-0">{opt.icon}</span>}
            <span className="truncate whitespace-nowrap text-center leading-tight">{opt.label}</span>
            {opt.count !== undefined && (
              <span
                className={`ml-1 px-1.5 py-0.2 rounded-full text-[10px] font-black leading-tight ${
                  isActive
                    ? 'bg-[#38BDF8]/20 text-[#0284c7] dark:text-[#38BDF8]'
                    : 'bg-slate-200 dark:bg-white/10 text-slate-600 dark:text-slate-400'
                }`}
              >
                {opt.count}
              </span>
            )}
          </button>
        );
      })}
    </div>
  );
}
