"use client"

import type React from "react"

import { RoleGuard } from "@/components/admin/role-guard"

export default function TransportLayout({ children }: { children: React.ReactNode }) {
  return (
    <RoleGuard allowedRoles={["TRANSPORT"]}>
      {children}
    </RoleGuard>
  )
}

