import * as React from 'react';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '@/lib/utils';

const badgeVariants = cva(
  'inline-flex items-center rounded-lg border px-2.5 py-0.5 text-[10px] font-extrabold uppercase tracking-wider transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2',
  {
    variants: {
      variant: {
        default:
          'border-transparent bg-[#2563EB] dark:bg-[#3B82F6] text-white dark:text-[#0B1120]',
        secondary:
          'border-transparent bg-slate-100 dark:bg-[#1A2232] text-[#0F172A] dark:text-[#F1F5F9]',
        destructive:
          'border-transparent bg-[#FEE2E2] dark:bg-[#450A0A] text-[#DC2626] dark:text-[#EF4444] border border-[#DC2626]/30',
        outline:
          'border-[#E2E8F0] dark:border-[#293246] text-[#0F172A] dark:text-[#F1F5F9]',
        success:
          'border-transparent bg-[#DCFCE7] dark:bg-[#052E16] text-[#16A34A] dark:text-[#22C55E] border border-[#16A34A]/30',
        warning:
          'border-transparent bg-[#FEF3C7] dark:bg-[#451A03] text-[#D97706] dark:text-[#F59E0B] border border-[#D97706]/30',
        info:
          'border-transparent bg-cyan-100 dark:bg-cyan-950 text-[#0891B2] dark:text-[#22D3EE] border border-[#0891B2]/30',
      },
    },
    defaultVariants: {
      variant: 'default',
    },
  }
);

export interface BadgeProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof badgeVariants> {}

function Badge({ className, variant, ...props }: BadgeProps) {
  return (
    <div className={cn(badgeVariants({ variant }), className)} {...props} />
  );
}

export { Badge, badgeVariants };
