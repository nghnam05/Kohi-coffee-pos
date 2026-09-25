'use client';

import React from 'react';
import { cn } from '@/lib/utils';
import { motion, HTMLMotionProps } from 'framer-motion';

/**
 * Bento Grid — NameThatUI Pattern: /web/bento-grid
 * Specification: One grid, mixed tile sizes — a layout packed like a bento box.
 */
export interface BentoGridProps extends React.HTMLAttributes<HTMLDivElement> {
  children: React.ReactNode;
  columns?: 2 | 3 | 4 | 6 | 12;
}

export const BentoGrid: React.FC<BentoGridProps> = ({
  children,
  columns = 12,
  className,
  ...props
}) => {
  const colMap = {
    2: 'grid-cols-1 md:grid-cols-2',
    3: 'grid-cols-1 md:grid-cols-3',
    4: 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-4',
    6: 'grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-6',
    12: 'grid-cols-1 sm:grid-cols-2 md:grid-cols-4 lg:grid-cols-12',
  };

  return (
    <div
      className={cn(
        'grid gap-3.5 sm:gap-4.5',
        colMap[columns] || 'grid-cols-1 md:grid-cols-12',
        className
      )}
      {...props}
    >
      {children}
    </div>
  );
};

export interface BentoCardProps extends Omit<HTMLMotionProps<'div'>, 'title'> {
  colSpan?: 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9 | 10 | 11 | 12;
  rowSpan?: 1 | 2 | 3;
  header?: React.ReactNode;
  icon?: React.ReactNode;
  title?: React.ReactNode;
  subtitle?: React.ReactNode;
  footer?: React.ReactNode;
  highlight?: boolean;
}

export const BentoCard: React.FC<BentoCardProps> = ({
  colSpan = 4,
  rowSpan = 1,
  header,
  icon,
  title,
  subtitle,
  footer,
  highlight = false,
  children,
  className,
  ...props
}) => {
  const spanMap: Record<number, string> = {
    1: 'col-span-1',
    2: 'col-span-1 sm:col-span-2',
    3: 'col-span-1 sm:col-span-3',
    4: 'col-span-1 sm:col-span-2 lg:col-span-4',
    5: 'col-span-1 sm:col-span-3 lg:col-span-5',
    6: 'col-span-1 sm:col-span-2 lg:col-span-6',
    7: 'col-span-1 sm:col-span-3 lg:col-span-7',
    8: 'col-span-1 sm:col-span-2 lg:col-span-8',
    9: 'col-span-1 sm:col-span-3 lg:col-span-9',
    10: 'col-span-1 sm:col-span-3 lg:col-span-10',
    11: 'col-span-1 sm:col-span-3 lg:col-span-11',
    12: 'col-span-1 sm:col-span-2 lg:col-span-12',
  };

  const rowMap: Record<number, string> = {
    1: 'row-span-1',
    2: 'row-span-2',
    3: 'row-span-3',
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.25, ease: 'easeOut' }}
      className={cn(
        'group relative rounded-2xl p-4 sm:p-5 flex flex-col justify-between overflow-hidden transition-all duration-200',
        'bg-white dark:bg-[#090D16] border border-slate-200/80 dark:border-white/10 shadow-xs hover:shadow-md hover:border-[#38BDF8]/40 dark:hover:border-[#38BDF8]/50',
        highlight && 'ring-1 ring-[#38BDF8]/30 dark:ring-[#38BDF8]/40 bg-gradient-to-br from-white via-white to-sky-50/40 dark:from-[#090D16] dark:via-[#090D16] dark:to-sky-950/20',
        spanMap[colSpan] || 'col-span-4',
        rowMap[rowSpan] || 'row-span-1',
        className
      )}
      {...props}
    >
      {/* Glow accent */}
      <div className="absolute top-0 right-0 w-32 h-32 bg-[#38BDF8]/5 rounded-full blur-2xl pointer-events-none group-hover:bg-[#38BDF8]/10 transition-colors" />

      {/* Top Header/Meta */}
      {(icon || title || header) && (
        <div className="flex items-start justify-between gap-3 mb-3 relative z-10">
          <div className="flex items-center gap-2.5">
            {icon && (
              <div className="w-9 h-9 rounded-xl flex items-center justify-center bg-sky-500/10 text-[#38BDF8] border border-sky-500/20">
                {icon}
              </div>
            )}
            <div>
              {title && (
                <h3 className="text-sm font-extrabold text-slate-900 dark:text-white tracking-tight">
                  {title}
                </h3>
              )}
              {subtitle && (
                <p className="text-xs font-normal text-slate-500 dark:text-slate-400 mt-0.5">
                  {subtitle}
                </p>
              )}
            </div>
          </div>
          {header && <div className="shrink-0">{header}</div>}
        </div>
      )}

      {/* Main Body Content */}
      <div className="flex-1 relative z-10">{children as React.ReactNode}</div>

      {/* Bottom Footer */}
      {footer && (
        <div className="mt-3 pt-3 border-t border-slate-100 dark:border-white/10 relative z-10">
          {footer}
        </div>
      )}
    </motion.div>
  );
};
