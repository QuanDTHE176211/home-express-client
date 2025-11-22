"use client"

import { useEffect, useState, useRef } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { CheckCircle2, Clock, AlertCircle } from "lucide-react"
import { apiClient } from "@/lib/api-client"
import { Button } from "@/components/ui/button"
import type { PaymentStatus } from "@/types"

export default function PaymentWatcher() {
  const params = useSearchParams()
  const bookingId = Number(params.get("bookingId"))
  const paymentId = params.get("paymentId") || undefined
  const router = useRouter()

  const [status, setStatus] = useState<PaymentStatus>("PENDING")
  const [error, setError] = useState<string | null>(null)
  const [refreshKey, setRefreshKey] = useState(0)
  const redirectTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  useEffect(() => {
    if (!bookingId || isNaN(bookingId)) return

    let active = true
    let intervalId: ReturnType<typeof setInterval> | null = null

    const checkStatus = async () => {
      try {
        const response = await apiClient.getPaymentStatus({ bookingId, paymentId })
        if (!active) return
        setStatus(response.status)
        setError(null)

        if (response.status === "DEPOSIT_PAID" || response.status === "FULL_PAID") {
          if (intervalId) clearInterval(intervalId)
          if (redirectTimerRef.current) clearTimeout(redirectTimerRef.current)
          redirectTimerRef.current = setTimeout(() => {
            router.replace(`/customer/bookings/${bookingId}`)
          }, 1500)
        }
      } catch (err) {
        if (!active) return
        console.error("Failed to check payment status:", err)
        setError(err instanceof Error ? err.message : "Có lỗi xảy ra")
      }
    }

    void checkStatus()
    intervalId = setInterval(() => {
      if (!document.hidden) void checkStatus()
    }, 8000)

    return () => {
      active = false
      if (intervalId) clearInterval(intervalId)
    }
  }, [bookingId, paymentId, router, refreshKey])

  if (!bookingId || isNaN(bookingId)) {
    return (
      <Alert variant="destructive">
        <AlertCircle className="h-4 w-4" />
        <AlertDescription>
          <div className="flex items-center justify-between">
            <span>Không tìm thấy booking ID</span>
            <Button
              variant="outline"
              size="sm"
              onClick={() => router.refresh()}
            >
              Thử lại
            </Button>
          </div>
        </AlertDescription>
      </Alert>
    )
  }

  if (status === "DEPOSIT_PAID" || status === "FULL_PAID") {
    return (
      <Alert className="border-green-200 bg-green-50">
        <CheckCircle2 className="h-4 w-4 text-green-600" />
        <AlertDescription className="text-green-800">
          <b>Thanh toán thành công!</b> Đang chuyển đến trang theo dõi đơn hàng...
        </AlertDescription>
      </Alert>
    )
  }

  if (error) {
    return (
      <Alert variant="destructive">
        <AlertCircle className="h-4 w-4" />
        <AlertDescription>
          <div className="flex items-center justify-between">
            <span>Lỗi kiểm tra trạng thái: {error}</span>
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                setError(null)
                setRefreshKey((k) => k + 1)
              }}
            >
              Thử lại
            </Button>
          </div>
        </AlertDescription>
      </Alert>
    )
  }

  return (
    <Alert>
      <Clock className="h-4 w-4" />
      <AlertDescription>
        <div className="space-y-1">
          <div>
            Trạng thái thanh toán: <b>{status}</b>
          </div>
          <div className="text-sm text-muted-foreground">
            Vui lòng không đóng trang cho đến khi hệ thống xác nhận đặt cọc thành công.
          </div>
          <div className="text-xs text-muted-foreground mt-2">
            Sau khi chuyển khoản, hệ thống sẽ tự động cập nhật (khoảng 1-2 phút).
          </div>
        </div>
      </AlertDescription>
    </Alert>
  )
}
