"use client"

import { useState, useEffect, useCallback } from "react"
import type { Notification } from "@/types"
import { apiClient } from "@/lib/api-client"
import { useToast } from "@/hooks/use-toast"

interface NotificationSummary {
  total_unread: number
  by_type: Record<string, number>
  latest_notifications: Notification[]
}

export function useNotifications() {
  const { toast } = useToast()

  const [notifications, setNotifications] = useState<Notification[]>([])
  const [summary, setSummary] = useState<NotificationSummary | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [unreadCount, setUnreadCount] = useState(0)
  const [pagination, setPagination] = useState({
    currentPage: 1,
    totalPages: 1,
    totalItems: 0,
    itemsPerPage: 10,
  })

  const fetchNotifications = useCallback(
    async (page = 1, filters?: { isRead?: boolean; type?: string }) => {
      setLoading(true)
      setError(null)

      try {
        const result = await apiClient.getNotifications({ page, limit: 10, ...filters })
        setNotifications(result.notifications)
        setSummary(result.summary)
        setPagination(result.pagination)
      } catch (err) {
        const message = err instanceof Error ? err.message : "Failed to fetch notifications"
        setError(message)
      } finally {
        setLoading(false)
      }
    },
    [],
  )

  const markAsRead = useCallback(async (notificationId: number) => {
    try {
      const updated = await apiClient.markNotificationAsRead(notificationId)
      let wasUnread = false

      setNotifications((prev) =>
        prev.map((n) => {
          if (n.notification_id === notificationId) {
            wasUnread = !n.is_read
            return { ...n, ...updated }
          }
          return n
        }),
      )

      if (wasUnread) {
        setUnreadCount((prev) => Math.max(0, prev - 1))
        setSummary((prev) =>
          prev
            ? {
                ...prev,
                total_unread: Math.max(0, prev.total_unread - 1),
                latest_notifications: prev.latest_notifications.map((n) =>
                  n.notification_id === notificationId ? { ...n, ...updated } : n,
                ),
              }
            : prev,
        )
      }
    } catch (err) {
      console.error("Failed to mark notification as read:", err)
    }
  }, [])

  const markAllAsRead = useCallback(async () => {
    const unreadIds = notifications.filter((n) => !n.is_read).map((n) => n.notification_id)
    if (!unreadIds.length) return

    try {
      await apiClient.markNotificationsAsRead(unreadIds)
      const timestamp = new Date().toISOString()

      setNotifications((prev) =>
        prev.map((n) => (n.is_read ? n : { ...n, is_read: true, read_at: timestamp })),
      )
      setSummary((prev) =>
        prev
          ? {
              ...prev,
              total_unread: 0,
              latest_notifications: prev.latest_notifications.map((n) =>
                n.is_read ? n : { ...n, is_read: true, read_at: timestamp },
              ),
            }
          : prev,
      )
      setUnreadCount(0)
      toast({
        title: "Thành công",
        description: "Đã đánh dấu tất cả thông báo là đã đọc.",
      })
    } catch (err) {
      toast({
        title: "Lỗi",
        description: err instanceof Error ? err.message : "Không thể đánh dấu thông báo.",
        variant: "destructive",
      })
    }
  }, [notifications, toast])

  const deleteNotification = useCallback(
    async (notificationId: number) => {
      try {
        await apiClient.deleteNotification(notificationId)

        let wasUnread = false
        let targetType: string | null = null
        setNotifications((prev) => {
          const target = prev.find((n) => n.notification_id === notificationId)
          wasUnread = target ? !target.is_read : false
          targetType = target?.type ?? null
          return prev.filter((n) => n.notification_id !== notificationId)
        })

        setSummary((prev) =>
          prev
            ? {
                ...prev,
                total_unread: wasUnread ? Math.max(0, prev.total_unread - 1) : prev.total_unread,
                by_type: (() => {
                  if (!targetType) return prev.by_type
                  const next = { ...prev.by_type }
                  next[targetType] = Math.max(0, (next[targetType] ?? 0) - 1)
                  if (next[targetType] === 0) {
                    delete next[targetType]
                  }
                  return next
                })(),
                latest_notifications: prev.latest_notifications.filter(
                  (n) => n.notification_id !== notificationId,
                ),
              }
            : prev,
        )
        if (wasUnread) {
          setUnreadCount((prev) => Math.max(0, prev - 1))
        }

        toast({
          title: "Thành công",
          description: "Thông báo đã được xóa.",
        })
      } catch (err) {
        toast({
          title: "Lỗi",
          description: err instanceof Error ? err.message : "Không thể xóa thông báo.",
          variant: "destructive",
        })
      }
    },
    [toast],
  )

  const fetchUnreadCount = useCallback(async () => {
    try {
      const count = await apiClient.getUnreadNotificationCount()
      setUnreadCount(count)
      setSummary((prev) => (prev ? { ...prev, total_unread: count } : prev))
    } catch (err) {
      console.error("Failed to fetch unread count:", err)
    }
  }, [])

  useEffect(() => {
    fetchNotifications()
    fetchUnreadCount()
  }, [fetchNotifications, fetchUnreadCount])

  return {
    notifications,
    summary,
    loading,
    error,
    unreadCount,
    pagination,
    fetchNotifications,
    markAsRead,
    markAllAsRead,
    deleteNotification,
    fetchUnreadCount,
  }
}
