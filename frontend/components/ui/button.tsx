import { Button as ButtonPrimitive } from "@base-ui/react/button"
import { cva, type VariantProps } from "class-variance-authority"

import { cn } from "@/lib/utils"

const buttonVariants = cva(
  "group/button inline-flex shrink-0 items-center justify-center rounded-xl border border-transparent bg-clip-padding text-xs font-bold tracking-wider whitespace-nowrap uppercase transition-all outline-none select-none focus-visible:ring-2 focus-visible:ring-[#3AA6FF]/40 active:translate-y-0.5 disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg:not([class*='size-'])]:size-3.5",
  {
    variants: {
      variant: {
        default: "bg-[#3AA6FF] text-white hover:bg-[#2B96EF] shadow-md shadow-[#3AA6FF]/25",
        outline:
          "border-[#E2E8F0] dark:border-[#222732] bg-transparent text-[var(--text-primary)] hover:bg-[#3AA6FF]/10 hover:border-[#3AA6FF]",
        secondary:
          "bg-[#F1F5F9] dark:bg-[#181B21] text-[var(--text-primary)] hover:bg-[#E2E8F0] dark:hover:bg-[#222732]",
        ghost:
          "text-[var(--text-secondary)] hover:bg-[#3AA6FF]/10 hover:text-[var(--text-primary)]",
        destructive:
          "bg-red-500/10 text-red-500 border border-red-500/20 hover:bg-red-500/20 focus-visible:ring-red-500/30",
        link: "text-[#3AA6FF] underline-offset-4 hover:underline",
      },
      size: {
        default:
          "h-10 gap-1.5 px-5",
        xs: "h-7 gap-1 px-2.5 text-[10px]",
        sm: "h-8.5 gap-1 px-3.5 text-[11px]",
        lg: "h-12 gap-2 px-7 text-sm font-extrabold",
        icon: "size-10 rounded-xl",
        "icon-xs": "size-7 rounded-lg",
        "icon-sm": "size-8.5 rounded-xl",
        "icon-lg": "size-12 rounded-2xl",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
)

function Button({
  className,
  variant = "default",
  size = "default",
  ...props
}: ButtonPrimitive.Props & VariantProps<typeof buttonVariants>) {
  return (
    <ButtonPrimitive
      data-slot="button"
      className={cn(buttonVariants({ variant, size, className }))}
      {...props}
    />
  )
}

export { Button, buttonVariants }
