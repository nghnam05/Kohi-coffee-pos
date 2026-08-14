import * as React from "react"
import { Input as InputPrimitive } from "@base-ui/react/input"

import { cn } from "@/lib/utils"

function Input({ className, type, ...props }: React.ComponentProps<"input">) {
  return (
    <InputPrimitive
      type={type}
      data-slot="input"
      className={cn(
        "flex h-10 w-full min-w-0 rounded-xl border border-[#E2E8F0] dark:border-[#222732] bg-[#FFFFFF] dark:bg-[#0B1120] px-3.5 py-2 text-xs text-[#0F172A] dark:text-[#F1F5F9] placeholder:text-[#94A3B8] dark:placeholder:text-[#64748B] outline-none focus:border-[#3AA6FF] focus:ring-2 focus:ring-[#3AA6FF]/20 disabled:cursor-not-allowed disabled:opacity-50 transition-all font-sans",
        className
      )}
      {...props}
    />
  )
}

export { Input }
