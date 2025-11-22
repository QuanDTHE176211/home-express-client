"use client"

import { useNotifications } from "@/hooks/use-notifications"
import { NotificationItem } from "./notification-item"
import { Button } from "@/components/ui/button"
import { Loader2, CheckCheck, Inbox } from "lucide-react"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Separator } from "@/components/ui/separator"

export function NotificationList() {
  const { notifications, loading, markAllAsRead, fetchNotifications } = useNotifications()

  const handleMarkAllRead = async () => {
    await markAllAsRead()
    fetchNotifications()
  }

  if (loading && notifications.length === 0) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-6 w-6 animate-spin" />
      </div>
    )
  }

  return (
    <div className="flex flex-col">
      <div className="flex items-center justify-between p-4 pb-2">
        <h3 className="font-semibold">Thông báo</h3>
        {notifications.some((n) => !n.is_read) && (
          <Button variant="ghost" size="sm" onClick={handleMarkAllRead}>
            <CheckCheck className="mr-2 h-4 w-4" />
            Đánh dấu đã đọc
          </Button>
        )}
      </div>

      <Separator />

      {notifications.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-12 text-center">
          <Inbox className="h-12 w-12 text-muted-foreground mb-2" />
          <p className="text-sm text-muted-foreground">Không có thông báo mới</p>
        </div>
      ) : (
        <ScrollArea className="h-96">
          <div className="divide-y">
            {notifications.map((notification) => (
              <NotificationItem key={notification.notification_id} notification={notification} />
            ))}
          </div>
        </ScrollArea>
      )}

      <Separator />

      <div className="p-2">
        <Button variant="ghost" className="w-full" asChild>
          <a href="/notifications">Xem tất cả thông báo</a>
        </Button>
      </div>
    </div>
  )
}
