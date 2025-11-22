"use client"

import type * as React from "react"
import { cn } from "@/lib/utils"
import { sanitizeString } from "@/lib/sanitize"

function Input({
  className,
  type,
  onChange,
  "aria-label": ariaLabel,
  placeholder,
  ...props
}: React.ComponentProps<"input">) {
  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (onChange) {
      // This allows users to type spaces and other whitespace naturally
      const sanitized = sanitizeString(e.target.value)
      e.target.value = sanitized
      onChange(e)
    }
  }

  return (
    <input
      type={type}
      data-slot="input"
      aria-label={ariaLabel || placeholder}
      className={cn(
        "file:text-foreground placeholder:text-muted-foreground selection:bg-primary selection:text-primary-foreground dark:bg-input/30 border-input h-9 w-full min-w-0 rounded-md border bg-transparent px-3 py-1 text-base shadow-xs transition-[color,box-shadow] outline-none file:inline-flex file:h-7 file:border-0 file:bg-transparent file:text-sm file:font-medium disabled:pointer-events-none disabled:cursor-not-allowed disabled:opacity-50 md:text-sm",
        "focus-visible:border-ring focus-visible:ring-ring/50 focus-visible:ring-[3px]",
        "aria-invalid:ring-destructive/20 dark:aria-invalid:ring-destructive/40 aria-invalid:border-destructive",
        className,
      )}
      onChange={handleChange}
      placeholder={placeholder}
      {...props}
    />
  )
}

export { Input }
