'use client';

import React from 'react';

export interface ChoiceChipItem<T extends string | number> {
  value: T;
  label: React.ReactNode;
  icon?: React.ReactNode;
  description?: string;
}

export interface ChoiceChipsProps<T extends string | number> {
  items: ChoiceChipItem<T>[];
  value?: T;
  onSelect: (value: T) => void;
  size?: 'sm' | 'md';
  className?: string;
}

export function ChoiceChips<T extends string | number>({
  items,
  value,
  onSelect,
  size = 'md',
  className = '',
}: ChoiceChipsProps<T>) {
  const sizeClasses = {
    sm: 'px-3 py-1.5 min-h-[38px] sm:min-h-[36px] text-xs',
    md: 'px-3.5 py-2 min-h-[44px] sm:min-h-[40px] text-xs sm:text-sm',
  };

  return (
    <div role="radiogroup" className={`flex flex-wrap gap-2 sm:gap-2.5 ${className}`}>
      {items.map((item) => {
        const isSelected = item.value === value;
        return (
          <button
            key={String(item.value)}
            type="button"
            role="radio"
            aria-checked={isSelected}
            onClick={() => onSelect(item.value)}
            className={`inline-flex items-center justify-center gap-1.5 rounded-2xl font-extrabold transition-all duration-150 cursor-pointer select-none active:scale-[0.97] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#38BDF8] focus-visible:ring-offset-2 ${
              sizeClasses[size]
            } ${
              isSelected
                ? 'bg-[#38BDF8]/15 text-[#0284c7] dark:text-[#38BDF8] border border-[#38BDF8]/50 shadow-xs font-black'
                : 'bg-slate-100/80 hover:bg-slate-200/90 dark:bg-white/5 dark:hover:bg-white/10 text-slate-700 dark:text-slate-300 border border-slate-200/60 dark:border-white/5 hover:border-slate-300 dark:hover:border-white/15'
            }`}
          >
            {item.icon && <span className="shrink-0">{item.icon}</span>}
            <span>{item.label}</span>
          </button>
        );
      })}
    </div>
  );
}
