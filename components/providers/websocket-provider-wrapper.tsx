"use client"

import type React from "react"

import { useAuth } from "@/contexts/auth-context"
import { WebSocketProvider } from "@/contexts/websocket-context"

export function WebSocketProviderWrapper({ children }: { children: React.ReactNode }) {
  const { user } = useAuth()

  return <WebSocketProvider userId={user?.user_id?.toString()}>{children}</WebSocketProvider>
}
