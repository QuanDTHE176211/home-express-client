"use client"

import { useState, useEffect } from "react"
import { useRouter, useParams } from "next/navigation"
import { useLanguage } from "@/contexts/language-context"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { CheckCircle2, AlertCircle, Clock, MapPin, Phone, Truck, Package, Star, MessageCircle } from "lucide-react"

type BookingStatus = "DEPOSIT_PAID" | "DRIVER_ON_THE_WAY" | "LOADING" | "IN_TRANSIT" | "UNLOADING" | "COMPLETED"

interface TimelineStep {
  status: BookingStatus
  label: string
  timestamp?: string
  completed: boolean
}

interface BookingDetails {
  id: string
  status: BookingStatus
  transporterName: string
  transporterPhone: string
  transporterAvatar?: string
  transporterRating: number
  driverName?: string
  driverPhone?: string
  vehicleType: string
  vehiclePlate?: string
  pickupAddress: string
  deliveryAddress: string
  scheduledDate: string
  totalAmount: number
  depositPaid: number
  remainingAmount: number
  timeline: TimelineStep[]
}

// Timeline component
function BookingTimeline({ steps, currentStatus }: { steps: TimelineStep[]; currentStatus: BookingStatus }) {
  return (
    <div className="space-y-4">
      {steps.map((step, index) => {
        const isActive = step.status === currentStatus
        const isCompleted = step.completed

        return (
          <div key={step.status} className="flex gap-4">
            {/* Icon */}
            <div className="flex flex-col items-center">
              <div
                className={`flex h-10 w-10 items-center justify-center rounded-full ${
                  isCompleted
                    ? "bg-accent-green text-white"
                    : isActive
                      ? "bg-primary text-primary-foreground"
                      : "bg-muted text-muted-foreground"
                }`}
              >
                {isCompleted ? <CheckCircle2 className="h-5 w-5" /> : <Clock className="h-5 w-5" />}
              </div>
              {index < steps.length - 1 && (
                <div className={`w-0.5 h-12 ${isCompleted ? "bg-accent-green" : "bg-muted"}`} />
              )}
            </div>

            {/* Content */}
            <div className="flex-1 pb-8">
              <div className="flex items-center justify-between">
                <h3 className={`font-semibold ${isActive ? "text-primary" : ""}`}>{step.label}</h3>
                {step.timestamp && <span className="text-sm text-muted-foreground">{step.timestamp}</span>}
              </div>
              {isActive && (
                <Badge variant="outline" className="mt-2">
                  Đang thực hiện
                </Badge>
              )}
            </div>
          </div>
        )
      })}
    </div>
  )
}

export default function BookingPage() {
  const router = useRouter()
  const params = useParams()
  const bookingId = params.id as string
  const { t } = useLanguage()

  const [booking, setBooking] = useState<BookingDetails | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // Load booking details and setup SSE
  useEffect(() => {
    if (!bookingId) {
      router.push("/scan")
      return
    }

    const loadBooking = async () => {
      try {
        const response = await fetch(`/api/bookings/${bookingId}`)
        if (!response.ok) throw new Error("Không thể tải thông tin đơn hàng")

        const data = await response.json()
        setBooking(data.booking)
      } catch (err) {
        setError(err instanceof Error ? err.message : "Có lỗi xảy ra")
      } finally {
        setLoading(false)
      }
    }

    loadBooking()

    // Setup SSE for real-time status updates
    const eventSource = new EventSource(`/api/bookings/${bookingId}/events`)

    eventSource.onmessage = (event) => {
      const data = JSON.parse(event.data)
      console.log("[v0] SSE event received:", data)

      if (data.type === "JOB_STATUS") {
        setBooking((prev) => (prev ? { ...prev, status: data.value } : null))
      }
    }

    eventSource.onerror = () => {
      console.log("[v0] SSE connection closed")
      eventSource.close()
    }

    return () => {
      eventSource.close()
    }
  }, [bookingId, router])

  // Format currency
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("vi-VN", {
      style: "currency",
      currency: "VND",
    }).format(amount)
  }

  // Navigate to rating
  const handleRate = () => {
    router.push(`/rate/${bookingId}`)
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-background to-muted/20 py-8 px-4">
        <div className="max-w-5xl mx-auto">
          <Card>
            <CardContent className="p-12 text-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4" />
              <p className="text-muted-foreground">Đang tải...</p>
            </CardContent>
          </Card>
        </div>
      </div>
    )
  }

  if (error || !booking) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-background to-muted/20 py-8 px-4">
        <div className="max-w-5xl mx-auto">
          <Card>
            <CardContent className="p-12 text-center space-y-4">
              <AlertCircle className="h-12 w-12 text-destructive mx-auto" />
              <p className="text-lg font-semibold">Không tìm thấy thông tin đơn hàng</p>
              <p className="text-muted-foreground">{error}</p>
              <Button onClick={() => router.push("/scan")}>Quay lại</Button>
            </CardContent>
          </Card>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-background to-muted/20 py-8 px-4">
      <div className="max-w-5xl mx-auto space-y-6">
        {/* Header */}
        <Card>
          <CardHeader>
            <div className="flex items-start justify-between">
              <div>
                <CardTitle>Đơn hàng #{booking.id}</CardTitle>
                <CardDescription>Theo dõi tiến độ chuyển nhà của bạn</CardDescription>
              </div>
              {booking.status === "COMPLETED" && (
                <Button onClick={handleRate}>
                  <Star className="h-4 w-4 mr-2" />
                  Đánh giá
                </Button>
              )}
            </div>
          </CardHeader>
        </Card>

        <div className="grid lg:grid-cols-3 gap-6">
          {/* Left column - Timeline */}
          <div className="lg:col-span-2 space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Package className="h-5 w-5" />
                  Tiến độ đơn hàng
                </CardTitle>
              </CardHeader>
              <CardContent>
                <BookingTimeline steps={booking.timeline} currentStatus={booking.status} />
              </CardContent>
            </Card>

            {/* Addresses */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-base">
                  <MapPin className="h-4 w-4" />
                  Địa chỉ
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <p className="text-sm text-muted-foreground mb-1">Điểm đón</p>
                  <p className="font-medium">{booking.pickupAddress}</p>
                </div>
                <Separator />
                <div>
                  <p className="text-sm text-muted-foreground mb-1">Điểm trả</p>
                  <p className="font-medium">{booking.deliveryAddress}</p>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Right column - Contact & Details */}
          <div className="space-y-6">
            {/* Transporter info */}
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Thông tin nhà xe</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center gap-3">
                  <Avatar className="h-12 w-12">
                    <AvatarImage src={booking.transporterAvatar || "/placeholder.svg"} alt={booking.transporterName} />
                    <AvatarFallback>{booking.transporterName.charAt(0)}</AvatarFallback>
                  </Avatar>
                  <div className="flex-1">
                    <p className="font-semibold">{booking.transporterName}</p>
                    <div className="flex items-center gap-1 text-sm text-muted-foreground">
                      <Star className="h-3 w-3 fill-current text-yellow-500" />
                      <span>{booking.transporterRating.toFixed(1)}</span>
                    </div>
                  </div>
                </div>

                <Separator />

                {/* Contact buttons */}
                <div className="space-y-2">
                  <Button variant="outline" className="w-full justify-start bg-transparent" asChild>
                    <a href={`tel:${booking.transporterPhone}`}>
                      <Phone className="h-4 w-4 mr-2" />
                      {booking.transporterPhone}
                    </a>
                  </Button>
                  <Button variant="outline" className="w-full justify-start bg-transparent">
                    <MessageCircle className="h-4 w-4 mr-2" />
                    Nhắn tin
                  </Button>
                </div>

                {/* Driver info */}
                {booking.driverName && (
                  <>
                    <Separator />
                    <div>
                      <p className="text-sm text-muted-foreground mb-2">Tài xế</p>
                      <p className="font-semibold">{booking.driverName}</p>
                      {booking.driverPhone && (
                        <Button variant="link" className="p-0 h-auto" asChild>
                          <a href={`tel:${booking.driverPhone}`}>{booking.driverPhone}</a>
                        </Button>
                      )}
                    </div>
                  </>
                )}
              </CardContent>
            </Card>

            {/* Vehicle info */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-base">
                  <Truck className="h-4 w-4" />
                  Phương tiện
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div>
                  <p className="text-sm text-muted-foreground">Loại xe</p>
                  <p className="font-semibold">{booking.vehicleType}</p>
                </div>
                {booking.vehiclePlate && (
                  <>
                    <Separator />
                    <div>
                      <p className="text-sm text-muted-foreground">Biển số</p>
                      <p className="font-semibold">{booking.vehiclePlate}</p>
                    </div>
                  </>
                )}
                <Separator />
                <div>
                  <p className="text-sm text-muted-foreground">Thời gian</p>
                  <p className="font-semibold">{booking.scheduledDate}</p>
                </div>
              </CardContent>
            </Card>

            {/* Payment info */}
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Thanh toán</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex justify-between">
                  <span className="text-sm text-muted-foreground">Tổng tiền</span>
                  <span className="font-medium">{formatCurrency(booking.totalAmount)}</span>
                </div>
                <Separator />
                <div className="flex justify-between">
                  <span className="text-sm text-muted-foreground">Đã đặt cọc</span>
                  <span className="font-medium text-accent-green">{formatCurrency(booking.depositPaid)}</span>
                </div>
                <Separator />
                <div className="flex justify-between items-center pt-2 border-t-2">
                  <span className="font-semibold">Còn lại</span>
                  <span className="text-lg font-bold text-primary">{formatCurrency(booking.remainingAmount)}</span>
                </div>

                {booking.status === "COMPLETED" && (
                  <Alert>
                    <CheckCircle2 className="h-4 w-4" />
                    <AlertDescription className="text-xs">Thanh toán số tiền còn lại cho tài xế</AlertDescription>
                  </Alert>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  )
}
