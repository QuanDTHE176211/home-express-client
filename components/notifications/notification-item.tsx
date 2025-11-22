"use client"

import type React from "react"
import { useRouter } from "next/navigation"
import { formatDistanceToNow } from "date-fns"
import { vi } from "date-fns/locale"
import { cn } from "@/lib/utils"
import { useNotifications } from "@/hooks/use-notifications"
import {
  Package,
  FileText,
  DollarSign,
  Star,
  CheckCircle,
  XCircle,
  Bell,
  Truck,
  MessageSquare,
  Trash2,
  MoreVertical,
} from "lucide-react"
import { Checkbox } from "@/components/ui/checkbox"
import { Button } from "@/components/ui/button"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"

interface Notification {
  notification_id: number
  type: string
  title: string
  message: string
  is_read: boolean
  action_url: string | null
  created_at: string
}

interface NotificationItemProps {
  notification: Notification
  isSelected?: boolean
  onSelect?: (id: number) => void
  onDelete?: () => void
}

const notificationIcons: Record<string, React.ReactNode> = {
  BOOKING_CREATED: <Package className="h-5 w-5 text-blue-500" />,
  BOOKING_UPDATED: <Package className="h-5 w-5 text-blue-500" />,
  BOOKING_CANCELLED: <XCircle className="h-5 w-5 text-red-500" />,
  QUOTATION_RECEIVED: <FileText className="h-5 w-5 text-green-500" />,
  QUOTATION_ACCEPTED: <CheckCircle className="h-5 w-5 text-green-500" />,
  QUOTATION_REJECTED: <XCircle className="h-5 w-5 text-red-500" />,
  CONTRACT_SIGNED: <FileText className="h-5 w-5 text-purple-500" />,
  PAYMENT_RECEIVED: <DollarSign className="h-5 w-5 text-green-500" />,
  JOB_STARTED: <Truck className="h-5 w-5 text-blue-500" />,
  JOB_COMPLETED: <CheckCircle className="h-5 w-5 text-green-500" />,
  REVIEW_RECEIVED: <Star className="h-5 w-5 text-yellow-500" />,
  REVIEW_RESPONSE: <MessageSquare className="h-5 w-5 text-blue-500" />,
  SYSTEM_ANNOUNCEMENT: <Bell className="h-5 w-5 text-gray-500" />,
}

export function NotificationItem({ notification, isSelected, onSelect, onDelete }: NotificationItemProps) {
  const router = useRouter()
  const { markAsRead } = useNotifications()

  const handleClick = async (e: React.MouseEvent) => {
    // Don't navigate if clicking checkbox or menu
    if ((e.target as HTMLElement).closest('[role="checkbox"]') || (e.target as HTMLElement).closest('[role="menu"]')) {
      return
    }

    if (!notification.is_read) {
      await markAsRead(notification.notification_id)
    }

    if (notification.action_url) {
      router.push(notification.action_url)
    }
  }

  const icon = notificationIcons[notification.type] || <Bell className="h-5 w-5 text-gray-500" />

  const timeAgo = formatDistanceToNow(new Date(notification.created_at), {
    addSuffix: true,
    locale: vi,
  })

  return (
    <div
      className={cn(
        "group relative flex gap-3 p-4 transition-colors hover:bg-muted/50",
        !notification.is_read && "bg-blue-50/50 dark:bg-blue-950/20",
      )}
    >
      {/* Checkbox */}
      {onSelect && (
        <div className="flex items-start pt-1">
          <Checkbox
            checked={isSelected}
            onCheckedChange={() => onSelect(notification.notification_id)}
            aria-label="Chọn thông báo"
          />
        </div>
      )}

      {/* Icon */}
      <div className="flex-shrink-0 pt-1">{icon}</div>

      {/* Content */}
      <button onClick={handleClick} className="flex-1 min-w-0 space-y-1 text-left">
        <div className="flex items-start justify-between gap-2">
          <p className={cn("text-sm font-medium", !notification.is_read && "font-semibold")}>{notification.title}</p>
          {!notification.is_read && <div className="h-2 w-2 rounded-full bg-blue-500 flex-shrink-0 mt-1" />}
        </div>

        <p className="text-sm text-muted-foreground line-clamp-2">{notification.message}</p>

        <p className="text-xs text-muted-foreground">{timeAgo}</p>
      </button>

      {/* Actions Menu */}
      <div className="flex items-start pt-1 opacity-0 group-hover:opacity-100 transition-opacity">
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon" className="h-8 w-8">
              <MoreVertical className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem onClick={() => markAsRead(notification.notification_id)}>
              {notification.is_read ? "Đánh dấu chưa đọc" : "Đánh dấu đã đọc"}
            </DropdownMenuItem>
            {onDelete && (
              <DropdownMenuItem onClick={onDelete} className="text-red-600">
                <Trash2 className="mr-2 h-4 w-4" />
                Xóa
              </DropdownMenuItem>
            )}
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </div>
  )
}
