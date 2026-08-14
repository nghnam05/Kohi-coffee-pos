import { mergeProps } from "@base-ui/react/merge-props"
import { useRender } from "@base-ui/react/use-render"
import { cva, type VariantProps } from "class-variance-authority"

import { cn } from "@/lib/utils"

const badgeVariants = cva(
  "group/badge inline-flex w-fit shrink-0 items-center justify-center gap-1.5 overflow-hidden rounded-full border px-2.5 py-0.5 text-[10px] font-extrabold tracking-widest whitespace-nowrap uppercase transition-colors [&>svg]:pointer-events-none [&>svg]:size-3",
  {
    variants: {
      variant: {
        default: "bg-[#3AA6FF]/10 text-[#3AA6FF] border-[#3AA6FF]/30",
        secondary: "bg-[#F1F5F9] dark:bg-[#181B21] text-[var(--text-secondary)] border-[#E2E8F0] dark:border-[#222732]",
        destructive:
          "bg-red-500/10 text-red-500 border-red-500/30",
        outline: "bg-transparent text-[var(--text-primary)] border-[#E2E8F0] dark:border-[#222732]",
        ghost: "bg-transparent text-[var(--text-secondary)] border-transparent",
        link: "text-[#3AA6FF] underline-offset-4 hover:underline border-transparent",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  }
)

function Badge({
  className,
  variant = "default",
  render,
  ...props
}: useRender.ComponentProps<"span"> & VariantProps<typeof badgeVariants>) {
  return useRender({
    defaultTagName: "span",
    props: mergeProps<"span">(
      {
        className: cn(badgeVariants({ variant }), className),
      },
      props
    ),
    render,
    state: {
      slot: "badge",
      variant,
    },
  })
}

export { Badge, badgeVariants }
