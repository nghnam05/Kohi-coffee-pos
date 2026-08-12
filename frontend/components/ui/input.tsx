import * as React from 'react';
import { cn } from '@/lib/utils';

export interface InputProps
  extends React.InputHTMLAttributes<HTMLInputElement> {}

const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ className, type, ...props }, ref) => {
    return (
      <input
        type={type}
        className={cn(
          'flex h-10 w-full rounded-xl border border-[#E2E8F0] dark:border-[#293246] bg-[#F8FAFC] dark:bg-[#0B1120] px-3 py-2 text-xs text-[#0F172A] dark:text-[#F1F5F9] placeholder:text-[#94A3B8] dark:placeholder:text-[#4B5563] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#3B82F6] disabled:cursor-not-allowed disabled:opacity-50 transition-all',
          className
        )}
        ref={ref}
        {...props}
      />
    );
  }
);
Input.displayName = 'Input';

export { Input };
