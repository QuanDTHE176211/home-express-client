"use client"

import { Check, Circle, X } from "lucide-react"
import { cn } from "@/lib/utils"
import { getStatusOrder } from "@/lib/booking-utils"
import { formatDate } from "@/lib/format"
import type { BookingStatus, BookingStatusHistory } from "@/types"

interface BookingTimelineProps {
  currentStatus: BookingStatus
  history: BookingStatusHistory[]
}

const STATUS_CONFIG = [
  { key: "PENDING" as BookingStatus, label: "Đã tạo" },
  { key: "QUOTED" as BookingStatus, label: "Đã báo giá" },
  { key: "CONFIRMED" as BookingStatus, label: "Xác nhận" },
  { key: "IN_PROGRESS" as BookingStatus, label: "Đang vận chuyển" },
  { key: "COMPLETED" as BookingStatus, label: "Hoàn thành" },
]

export function BookingTimeline({ currentStatus, history }: BookingTimelineProps) {
  const currentOrder = getStatusOrder(currentStatus)

  return (
    <div className="relative">
      {STATUS_CONFIG.map((status, index) => {
        const statusOrder = getStatusOrder(status.key)
        const isCompleted = statusOrder <= currentOrder && currentStatus !== "CANCELLED"
        const isCurrent = status.key === currentStatus
        const historyItem = history.find((h) => h.new_status === status.key)

        return (
          <div key={status.key} className="flex gap-4 pb-8 last:pb-0">
            {/* Icon */}
            <div
              className={cn(
                "relative z-10 flex h-10 w-10 items-center justify-center rounded-full border-2 transition-colors",
                isCompleted
                  ? "bg-success border-success text-white"
                  : isCurrent
                    ? "bg-primary border-primary text-white"
                    : "bg-background border-muted-foreground text-muted-foreground",
              )}
            >
              {isCompleted ? <Check className="h-5 w-5" /> : <Circle className="h-5 w-5" />}
            </div>

            {/* Content */}
            <div className="flex-1 pt-1">
              <p className={cn("font-medium", isCompleted || isCurrent ? "text-foreground" : "text-muted-foreground")}>
                {status.label}
              </p>
              {historyItem && <p className="text-sm text-muted-foreground">{formatDate(historyItem.changed_at)}</p>}
            </div>

            {/* Connector Line */}
            {index < STATUS_CONFIG.length - 1 && (
              <div
                className={cn(
                  "absolute left-5 top-10 w-0.5 h-8 -translate-x-1/2 transition-colors",
                  isCompleted ? "bg-success" : "bg-muted-foreground/30",
                )}
                style={{ top: `${(index + 1) * 2.5}rem` }}
              />
            )}
          </div>
        )
      })}

      {/* Cancelled Status */}
      {currentStatus === "CANCELLED" && (
        <div className="flex gap-4 pt-4 border-t">
          <div className="relative z-10 flex h-10 w-10 items-center justify-center rounded-full border-2 bg-destructive border-destructive text-white">
            <X className="h-5 w-5" />
          </div>
          <div className="flex-1 pt-1">
            <p className="font-medium text-destructive">Đã hủy</p>
            {history.find((h) => h.new_status === "CANCELLED") && (
              <p className="text-sm text-muted-foreground">
                {formatDate(history.find((h) => h.new_status === "CANCELLED")!.changed_at)}
              </p>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
