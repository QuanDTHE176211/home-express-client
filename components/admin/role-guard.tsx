"use client"

import type React from "react"

import { useEffect } from "react"
import { useRouter } from "next/navigation"
import { useAuth } from "@/contexts/auth-context"

interface RoleGuardProps {
  children: React.ReactNode
  allowedRoles: Array<"CUSTOMER" | "TRANSPORT" | "MANAGER">
  redirectTo?: string
}

/**
 * Role Guard Component
 *
 * Protects routes by checking user role.
 * Redirects unauthorized users to login or specified page.
 *
 * @example
 * <RoleGuard allowedRoles={["MANAGER"]}>
 *   <AdminDashboard />
 * </RoleGuard>
 */
export function RoleGuard({ children, allowedRoles, redirectTo = "/login" }: RoleGuardProps) {
  const { user, loading } = useAuth()
  const router = useRouter()

  useEffect(() => {
    if (!loading) {
      if (!user) {
        router.push(redirectTo)
      } else if (!allowedRoles.includes(user.role)) {
        // Redirect to appropriate dashboard based on role
        const roleRedirects = {
          CUSTOMER: "/customer",
          TRANSPORT: "/transport",
          MANAGER: "/admin",
        }
        router.push(roleRedirects[user.role])
      }
    }
  }, [user, loading, router, allowedRoles, redirectTo])

  if (loading) {
    return null
  }

  if (!user || !allowedRoles.includes(user.role)) {
    return null
  }

  return <>{children}</>
}
