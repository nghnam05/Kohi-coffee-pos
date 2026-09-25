'use client';

import React from 'react';
import { cn } from '@/lib/utils';

/**
 * Timeline — NameThatUI Pattern: /web/timeline
 * Specification: A vertical line of dots with one dated event beside each, in the order things happened.
 */
export interface TimelineProps extends React.HTMLAttributes<HTMLOListElement> {
  children: React.ReactNode;
}

export const Timeline: React.FC<TimelineProps> = ({ children, className, ...props }) => {
  return (
    <ol
      role="list"
      className={cn('relative border-l-2 border-slate-200 dark:border-white/10 ml-3 space-y-4 my-2', className)}
      {...props}
    >
      {children}
    </ol>
  );
};

export interface TimelineItemProps extends React.HTMLAttributes<HTMLLIElement> {
  children: React.ReactNode;
  active?: boolean;
  completed?: boolean;
}

export const TimelineItem: React.FC<TimelineItemProps> = ({
  children,
  active = false,
  completed = false,
  className,
  ...props
}) => {
  return (
    <li className={cn('relative pl-5 group', className)} {...props}>
      {children}
    </li>
  );
};

export interface TimelinePointProps extends React.HTMLAttributes<HTMLSpanElement> {
  icon?: React.ReactNode;
  active?: boolean;
  completed?: boolean;
}

export const TimelinePoint: React.FC<TimelinePointProps> = ({
  icon,
  active = false,
  completed = false,
  className,
  ...props
}) => {
  return (
    <span
      className={cn(
        'absolute -left-[9px] top-1 flex items-center justify-center w-4 h-4 rounded-full ring-4 ring-white dark:ring-[#090D16] transition-all',
        completed
          ? 'bg-emerald-500 text-white'
          : active
          ? 'bg-[#38BDF8] ring-[#38BDF8]/30 animate-pulse'
          : 'bg-slate-300 dark:bg-slate-700',
        className
      )}
      {...props}
    >
      {icon || <span className="w-1.5 h-1.5 rounded-full bg-white dark:bg-[#090D16]" />}
    </span>
  );
};

export interface TimelineContentProps extends Omit<React.HTMLAttributes<HTMLDivElement>, 'title'> {
  title: React.ReactNode;
  time?: React.ReactNode;
  description?: React.ReactNode;
}

export const TimelineContent: React.FC<TimelineContentProps> = ({
  title,
  time,
  description,
  children,
  className,
  ...props
}) => {
  return (
    <div className={cn('flex flex-col', className)} {...props}>
      <div className="flex items-center justify-between gap-2">
        <span className="text-xs font-extrabold text-slate-900 dark:text-white leading-tight">
          {title}
        </span>
        {time && (
          <time className="text-[11px] font-normal text-slate-400 dark:text-slate-500 font-mono">
            {time}
          </time>
        )}
      </div>
      {description && (
        <p className="text-[11.5px] font-normal text-slate-500 dark:text-slate-400 mt-0.5">
          {description}
        </p>
      )}
      {children}
    </div>
  );
};
