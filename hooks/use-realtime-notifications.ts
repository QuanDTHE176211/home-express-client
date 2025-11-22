"use client"

import { useEffect, useCallback } from "react"
import { useWebSocket } from "@/contexts/websocket-context"
import { useNotifications } from "./use-notifications"
import { useToast } from "./use-toast"

interface NotificationData {
  notification_id: number
  type: string
  title: string
  message: string
  action_url: string | null
}

export function useRealtimeNotifications() {
  const { subscribe, isConnected } = useWebSocket()
  const { fetchUnreadCount, fetchNotifications } = useNotifications()
  const { toast } = useToast()

  const handleNewNotification = useCallback(
    (data: NotificationData) => {
      console.log("[v0] New notification received:", data)

      // Show toast notification
      toast({
        title: data.title,
        description: data.message,
        action: data.action_url
          ? ({
            label: "View",
            onClick: () => {
              window.location.href = data.action_url!
            },
          } as any)
          : undefined,
      })

      // Refresh notification count and list
      fetchUnreadCount()
      fetchNotifications()
    },
    [toast, fetchUnreadCount, fetchNotifications],
  )

  useEffect(() => {
    if (!isConnected) return

    // Subscribe to notification events
    const unsubscribe = subscribe("NOTIFICATION", handleNewNotification)

    return () => {
      unsubscribe()
    }
  }, [isConnected, subscribe, handleNewNotification])

  return {
    isConnected,
  }
}
