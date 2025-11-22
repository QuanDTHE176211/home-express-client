/**
 * StatusBadge Component
 *
 * Displays active/inactive status with appropriate styling
 * Used in user management tables
 */

"use client"

import { Badge } from "@/components/ui/badge"
import { cn } from "@/lib/utils"

interface StatusBadgeProps {
  active: boolean
  className?: string
}

export function StatusBadge({ active, className }: StatusBadgeProps) {
  return (
    <Badge
      variant="outline"
      className={cn(
        active ? "bg-success/10 text-success border-success" : "bg-gray-100 text-gray-600 border-gray-200",
        className,
      )}
    >
      {active ? "Hoạt động" : "Vô hiệu hóa"}
    </Badge>
  )
}
