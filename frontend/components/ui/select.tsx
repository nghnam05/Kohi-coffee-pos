import * as React from 'react';
import { cn } from '@/lib/utils';

export interface SelectProps
  extends React.SelectHTMLAttributes<HTMLSelectElement> {}

const Select = React.forwardRef<HTMLSelectElement, SelectProps>(
  ({ className, children, ...props }, ref) => {
    return (
      <select
        className={cn(
          'flex h-10 w-full rounded-xl border border-[#E2E8F0] dark:border-[#293246] bg-[#F8FAFC] dark:bg-[#0B1120] px-3 py-2 text-xs font-bold text-[#0F172A] dark:text-[#F1F5F9] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#3B82F6] disabled:cursor-not-allowed disabled:opacity-50 cursor-pointer transition-all',
          className
        )}
        ref={ref}
        {...props}
      >
        {children}
      </select>
    );
  }
);
Select.displayName = 'Select';

export { Select };
