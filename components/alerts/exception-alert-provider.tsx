"use client"

import { ExceptionAlert } from "./exception-alert"
import { useAuth } from "@/contexts/auth-context"

export function ExceptionAlertProvider() {
  const { user } = useAuth()

  // Only show alerts for managers
  if (!user || user.role !== "MANAGER") {
    return null
  }

  return <ExceptionAlert />
}
