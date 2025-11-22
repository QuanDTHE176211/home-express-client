"use client"

import type React from "react"
import { RoleGuard } from "@/components/admin/role-guard"

export default function CustomerLayout({ children }: { children: React.ReactNode }) {
  return (
    <RoleGuard allowedRoles={["CUSTOMER"]}>
      {children}
    </RoleGuard>
  )
}
