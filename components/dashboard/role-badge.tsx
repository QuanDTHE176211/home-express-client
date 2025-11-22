/**
 * RoleBadge Component
 *
 * Displays user role with appropriate styling
 * Used in admin user management tables
 */

"use client"

import { Badge } from "@/components/ui/badge"

interface RoleBadgeProps {
  role: "CUSTOMER" | "TRANSPORT" | "MANAGER"
}

export function RoleBadge({ role }: RoleBadgeProps) {
  const config = {
    CUSTOMER: {
      label: "Khách hàng",
      className: "bg-blue-100 text-blue-700 border-blue-200",
    },
    TRANSPORT: {
      label: "Vận chuyển",
      className: "bg-green-100 text-green-700 border-green-200",
    },
    MANAGER: {
      label: "Quản trị",
      className: "bg-purple-100 text-purple-700 border-purple-200",
    },
  }

  const { label, className } = config[role]

  return (
    <Badge variant="outline" className={className}>
      {label}
    </Badge>
  )
}
