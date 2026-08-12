import * as React from 'react';
import { cn } from '@/lib/utils';

interface TabsContextValue {
  value: string;
  onValueChange: (value: string) => void;
}

const TabsContext = React.createContext<TabsContextValue | undefined>(
  undefined
);

interface TabsProps extends React.HTMLAttributes<HTMLDivElement> {
  value: string;
  onValueChange: (value: string) => void;
  children: React.ReactNode;
}

const Tabs: React.FC<TabsProps> = ({
  value,
  onValueChange,
  children,
  className,
  ...props
}) => {
  return (
    <TabsContext.Provider value={{ value, onValueChange }}>
      <div className={cn('w-full', className)} {...props}>
        {children}
      </div>
    </TabsContext.Provider>
  );
};

const TabsList = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div
    ref={ref}
    className={cn(
      'inline-flex items-center justify-center rounded-xl bg-slate-100 dark:bg-[#1A2232] p-1 text-[#475569] dark:text-[#94A3B8]',
      className
    )}
    {...props}
  />
));
TabsList.displayName = 'TabsList';

interface TabsTriggerProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  value: string;
}

const TabsTrigger = React.forwardRef<HTMLButtonElement, TabsTriggerProps>(
  ({ className, value, children, ...props }, ref) => {
    const context = React.useContext(TabsContext);
    if (!context) throw new Error('TabsTrigger must be used within Tabs');
    const isSelected = context.value === value;

    return (
      <button
        ref={ref}
        type="button"
        onClick={() => context.onValueChange(value)}
        className={cn(
          'inline-flex items-center justify-center whitespace-nowrap rounded-lg px-3 py-1.5 text-xs font-extrabold transition-all focus-visible:outline-none disabled:pointer-events-none disabled:opacity-50 cursor-pointer',
          isSelected
            ? 'bg-[#2563EB] dark:bg-[#3B82F6] text-white dark:text-[#0B1120] shadow-sm'
            : 'hover:text-[#0F172A] dark:hover:text-white',
          className
        )}
        {...props}
      >
        {children}
      </button>
    );
  }
);
TabsTrigger.displayName = 'TabsTrigger';

interface TabsContentProps extends React.HTMLAttributes<HTMLDivElement> {
  value: string;
}

const TabsContent = React.forwardRef<HTMLDivElement, TabsContentProps>(
  ({ className, value, children, ...props }, ref) => {
    const context = React.useContext(TabsContext);
    if (!context) throw new Error('TabsContent must be used within Tabs');
    if (context.value !== value) return null;

    return (
      <div
        ref={ref}
        className={cn('mt-2 focus-visible:outline-none', className)}
        {...props}
      >
        {children}
      </div>
    );
  }
);
TabsContent.displayName = 'TabsContent';

export { Tabs, TabsList, TabsTrigger, TabsContent };
