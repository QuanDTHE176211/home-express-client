"use client"

import type React from "react"

import { RoleGuard } from "@/components/admin/role-guard"

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return (
    <RoleGuard allowedRoles={["MANAGER"]}>
      {children}
    </RoleGuard>
  )
}
