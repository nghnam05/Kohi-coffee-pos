import * as React from 'react';
import { Slot } from '@radix-ui/react-slot';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '@/lib/utils';

const buttonVariants = cva(
  'inline-flex items-center justify-center whitespace-nowrap rounded-xl text-xs font-extrabold transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#3B82F6] disabled:pointer-events-none disabled:opacity-50 active:scale-95 cursor-pointer',
  {
    variants: {
      variant: {
        default:
          'bg-[#2563EB] dark:bg-[#3B82F6] text-white dark:text-[#0B1120] hover:bg-[#1D4ED8] dark:hover:bg-[#60A5FA] shadow-md',
        destructive:
          'bg-[#DC2626] dark:bg-[#EF4444] text-white hover:bg-[#B91C1C] dark:hover:bg-[#DC2626] shadow-md',
        outline:
          'border border-[#E2E8F0] dark:border-[#293246] bg-white dark:bg-[#111827] text-[#0F172A] dark:text-[#F1F5F9] hover:bg-slate-100 dark:hover:bg-[#1A2232]',
        secondary:
          'bg-slate-100 dark:bg-[#1A2232] text-[#0F172A] dark:text-[#F1F5F9] hover:bg-slate-200 dark:hover:bg-[#293246]',
        ghost:
          'text-[#475569] dark:text-[#94A3B8] hover:bg-slate-100 dark:hover:bg-[#1A2232] hover:text-[#0F172A] dark:hover:text-white',
        link: 'text-[#2563EB] dark:text-[#3B82F6] underline-offset-4 hover:underline',
        success:
          'bg-[#16A34A] dark:bg-[#22C55E] text-white dark:text-[#052E16] hover:bg-[#15803D] dark:hover:bg-[#16A34A] shadow-md',
      },
      size: {
        default: 'h-10 px-4 py-2',
        sm: 'h-8 rounded-lg px-3 text-[11px]',
        lg: 'h-12 rounded-xl px-8 text-sm',
        icon: 'h-9 w-9 p-0',
      },
    },
    defaultVariants: {
      variant: 'default',
      size: 'default',
    },
  }
);

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean;
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, asChild = false, ...props }, ref) => {
    const Comp = asChild ? Slot : 'button';
    return (
      <Comp
        className={cn(buttonVariants({ variant, size, className }))}
        ref={ref}
        {...props}
      />
    );
  }
);
Button.displayName = 'Button';

export { Button, buttonVariants };
