'use client';

import React from 'react';
import { cn } from '@/lib/utils';

/**
 * Form Field — NameThatUI Pattern: /web/form-field
 * Specification: Every part of a labeled input — label, placeholder, helper text, and the red error line.
 */
export interface FormFieldProps extends React.HTMLAttributes<HTMLDivElement> {
  id?: string;
  htmlFor?: string;
  label?: React.ReactNode;
  required?: boolean;
  optional?: boolean;
  helperText?: React.ReactNode;
  error?: React.ReactNode;
  children: React.ReactNode;
}

export const FormField: React.FC<FormFieldProps> = ({
  id,
  htmlFor,
  label,
  required = false,
  optional = false,
  helperText,
  error,
  children,
  className,
  ...props
}) => {
  const targetId = id || htmlFor;
  const helperId = targetId ? `${targetId}-helper` : undefined;
  const errorId = targetId ? `${targetId}-error` : undefined;

  return (
    <div className={cn('flex flex-col gap-1.5 w-full', className)} {...props}>
      {label && (
        <div className="flex items-center justify-between min-h-[18px]">
          <label
            htmlFor={targetId}
            className="text-[11px] sm:text-xs font-extrabold uppercase tracking-wider text-slate-700 dark:text-slate-300 whitespace-nowrap"
          >
            {label}
            {required && <span className="text-rose-500 ml-1 font-bold">*</span>}
          </label>
          {optional && (
            <span className="text-[10px] font-normal text-slate-400 dark:text-slate-500">
              (Không bắt buộc)
            </span>
          )}
        </div>
      )}

      <div className="relative">
        {React.Children.map(children, (child) => {
          if (!React.isValidElement(child)) return child;
          return React.cloneElement(child as React.ReactElement<any>, {
            id: id || (child.props as any)?.id,
            'aria-describedby': error ? errorId : helperText ? helperId : undefined,
            'aria-invalid': Boolean(error),
            className: cn(
              (child.props as any)?.className,
              error && 'border-rose-500 focus-visible:ring-rose-500/30 dark:border-rose-500'
            ),
          });
        })}
      </div>

      {error ? (
        <p
          id={errorId}
          role="alert"
          className="text-[11.5px] font-normal text-rose-500 dark:text-rose-400 flex items-center gap-1 mt-0.5"
        >
          <span className="font-bold leading-none">!</span>
          {error}
        </p>
      ) : helperText ? (
        <p
          id={helperId}
          className="text-[11.5px] font-normal text-slate-400 dark:text-slate-500 mt-0.5"
        >
          {helperText}
        </p>
      ) : null}
    </div>
  );
};
