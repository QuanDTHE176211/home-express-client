"use client"

import Link from "next/link"
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { MapPin, ArrowDown, Calendar, FileText, Eye, Star, Truck } from "lucide-react"
import { formatVND } from "@/lib/format"
import type { BookingListItem, BookingStatus } from "@/types"
import { cn } from "@/lib/utils"

interface BookingCardProps {
  booking: BookingListItem
}

const getBookingStatusBadge = (status: BookingStatus) => {
  const statusConfig: Record<BookingStatus, { label: string; className: string }> = {
    PENDING: { label: "Chờ xử lý", className: "bg-amber-100 text-amber-700 border-amber-200" },
    QUOTED: { label: "Đã báo giá", className: "bg-blue-100 text-blue-700 border-blue-200" },
    CONFIRMED: { label: "Đã xác nhận", className: "bg-indigo-100 text-indigo-700 border-indigo-200" },
    IN_PROGRESS: { label: "Đang thực hiện", className: "bg-sky-100 text-sky-700 border-sky-200" },
    COMPLETED: { label: "Hoàn thành", className: "bg-accent-green/10 text-accent-green border-accent-green" },
    REVIEWED: { label: "Đã đánh giá", className: "bg-green-100 text-green-700 border-green-200" },
    CANCELLED: { label: "Đã hủy", className: "bg-red-100 text-red-700 border-red-200" },
  }
  const config = statusConfig[status] || statusConfig.PENDING
  return (
    <Badge variant="outline" className={cn(config.className)}>
      {config.label}
    </Badge>
  )
}

export function BookingCard({ booking }: BookingCardProps) {
  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    return date.toLocaleDateString("vi-VN", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
    })
  }

  const getActionButton = () => {
    switch (booking.status) {
      case "QUOTED":
        if (booking.quotationsCount > 0) {
          return (
            <Button className="w-full bg-accent-green hover:bg-accent-green-dark" asChild>
              <Link href={`/customer/bookings/${booking.bookingId}/quotations`}>
                <FileText className="mr-2 h-4 w-4" />
                Xem {booking.quotationsCount} báo giá
              </Link>
            </Button>
          )
        }
        break
      case "CONFIRMED":
      case "IN_PROGRESS":
        return (
          <Button className="w-full bg-accent-green hover:bg-accent-green-dark" asChild>
            <Link href={`/customer/bookings/${booking.bookingId}`}>
              <Truck className="mr-2 h-4 w-4" />
              Theo dõi chuyến đi
            </Link>
          </Button>
        )
      case "COMPLETED":
        return (
          <Button className="w-full bg-accent-green hover:bg-accent-green-dark" asChild>
            <Link href={`/customer/rate/${booking.bookingId}`}>
              <Star className="mr-2 h-4 w-4" />
              Đánh giá ngay
            </Link>
          </Button>
        )
      case "REVIEWED":
        return (
          <Button variant="outline" className="w-full bg-transparent" asChild>
            <Link href={`/customer/bookings/${booking.bookingId}`}>
              <Eye className="mr-2 h-4 w-4" />
              Xem chi tiết
            </Link>
          </Button>
        )
      default:
        return (
          <Button variant="outline" className="w-full bg-transparent" asChild>
            <Link href={`/customer/bookings/${booking.bookingId}`}>
              <Eye className="mr-2 h-4 w-4" />
              Xem chi tiết
            </Link>
          </Button>
        )
    }
  }

  return (
    <Card className="hover:shadow-lg transition-shadow">
      <CardHeader>
        <div className="flex justify-between items-start">
          <CardTitle className="text-lg">#{booking.bookingId}</CardTitle>
          {getBookingStatusBadge(booking.status)}
        </div>
      </CardHeader>

      <CardContent className="space-y-3">
        {/* Route */}
        <div className="flex items-start gap-2">
          <MapPin className="h-4 w-4 text-success mt-1 flex-shrink-0" />
          <div className="flex-1 space-y-1 min-w-0">
            <p className="text-sm font-medium truncate">{booking.pickupLocation}</p>
            <ArrowDown className="h-3 w-3 text-muted-foreground" />
            <p className="text-sm font-medium truncate">{booking.deliveryLocation}</p>
          </div>
        </div>

        {/* Date */}
        <div className="flex items-center gap-2 text-sm">
          <Calendar className="h-4 w-4 text-muted-foreground" />
          <span>{formatDate(booking.preferredDate)}</span>
        </div>

        {/* Distance & Items */}
        <div className="flex items-center gap-4 text-sm text-muted-foreground">
          <span>{booking.distanceKm} km</span>
          <span>•</span>
          <span>{booking.itemsCount} món đồ</span>
        </div>

        {/* Price */}
        <div className="flex justify-between items-center pt-2 border-t">
          <span className="text-sm text-muted-foreground">{booking.finalPrice ? "Giá cuối" : "Ước tính"}</span>
          <span className="font-bold text-lg">{formatVND(booking.finalPrice || booking.estimatedPrice)}</span>
        </div>

        {/* Quotations Badge */}
        {booking.status === "QUOTED" && booking.quotationsCount > 0 && (
          <Badge variant="secondary" className="w-full justify-center">
            <FileText className="mr-1 h-3 w-3" />
            {booking.quotationsCount} báo giá mới
          </Badge>
        )}
      </CardContent>

      <CardFooter>{getActionButton()}</CardFooter>
    </Card>
  )
}
