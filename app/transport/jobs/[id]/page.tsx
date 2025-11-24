"use client"

import { useState } from "react"
import Link from "next/link"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { Skeleton } from "@/components/ui/skeleton"
import { ArrowLeft, MapPin, ArrowDown, Package, AlertCircle } from "lucide-react"
import { useBooking } from "@/hooks/use-bookings"
import { formatVND, formatDate } from "@/lib/format"
import { useLocationNames } from "@/hooks/use-location-names"
import { QuotationForm } from "@/components/quotation/quotation-form"
import { useParams } from "next/navigation"
import { DashboardLayout } from "@/components/dashboard/dashboard-layout"
import { PackageIcon, Truck, DollarSign, Settings, FileText, BarChart3, Star } from "lucide-react"
import { BookingReviewSection } from "@/components/bookings/booking-review-section"
import { BookingItemsDisplay } from "@/components/transport/booking-items-display"

const navItems = [
  { href: "/transport", label: "Tổng quan", icon: "Package" },
  { href: "/transport/jobs", label: "Công việc", icon: "Truck" },
  { href: "/transport/quotations", label: "Báo giá", icon: "FileText" },
  { href: "/transport/contracts", label: "Hợp đồng", icon: "FileText" },
  { href: "/transport/vehicles", label: "Xe", icon: "Truck" },
  { href: "/transport/earnings", label: "Thu nhập", icon: "DollarSign" },
  { href: "/transport/analytics", label: "Phân tích", icon: "TrendingUp" },
  { href: "/transport/reviews", label: "Đánh giá", icon: "Star" },
  { href: "/transport/settings", label: "Cài đặt", icon: "Settings" },
]

export default function JobDetailPage() {
  const params = useParams()
  const id = params.id as string
  const bookingId = Number.parseInt(id)
  const { booking, isLoading, isError } = useBooking(bookingId)
  const [showQuotationForm, setShowQuotationForm] = useState(false)

  const rawBooking = (booking as Record<string, any>) || null

  const pickupNames = useLocationNames({
    provinceCode: rawBooking?.pickup_province_code ?? rawBooking?.pickupProvinceCode ?? null,
    districtCode: rawBooking?.pickup_district_code ?? rawBooking?.pickupDistrictCode ?? null,
    wardCode: rawBooking?.pickup_ward_code ?? rawBooking?.pickupWardCode ?? null,
  })

  const deliveryNames = useLocationNames({
    provinceCode: rawBooking?.delivery_province_code ?? rawBooking?.deliveryProvinceCode ?? null,
    districtCode: rawBooking?.delivery_district_code ?? rawBooking?.deliveryDistrictCode ?? null,
    wardCode: rawBooking?.delivery_ward_code ?? rawBooking?.deliveryWardCode ?? null,
  })

  if (isLoading) {
    return (
      <DashboardLayout navItems={navItems} title="Chi tiết công việc">
        <div className="container max-w-7xl py-10">
          <Skeleton className="h-10 w-64 mb-6" />
          <div className="grid gap-6 lg:grid-cols-3">
            <div className="lg:col-span-2 space-y-6">
              <Skeleton className="h-96" />
            </div>
            <div className="space-y-6">
              <Skeleton className="h-48" />
            </div>
          </div>
        </div>
      </DashboardLayout>
    )
  }

  if (isError || !booking) {
    return (
      <DashboardLayout navItems={navItems} title="Chi tiết công việc">
        <div className="container max-w-7xl py-10">
          <div className="text-center py-12">
            <AlertCircle className="h-12 w-12 text-destructive mx-auto mb-4" />
            <h2 className="text-2xl font-bold mb-2">Không tìm thấy công việc</h2>
            <p className="text-muted-foreground mb-4">Công việc này không tồn tại hoặc không còn khả dụng</p>
            <Button asChild>
              <Link href="/transport/jobs">Quay lại danh sách</Link>
            </Button>
          </div>
        </div>
      </DashboardLayout>
    )
  }

  const formatAddress = (type: "pickup" | "delivery") => {
    const names = type === "pickup" ? pickupNames : deliveryNames
    const prefix = type === "pickup" ? "pickup" : "delivery"

    const addressLine =
      rawBooking?.[`${prefix}_address_line`] ??
      rawBooking?.[`${prefix}AddressLine`] ??
      ""

    const wardCode =
      rawBooking?.[`${prefix}_ward_code`] ??
      rawBooking?.[`${prefix}WardCode`] ??
      ""

    const districtCode =
      rawBooking?.[`${prefix}_district_code`] ??
      rawBooking?.[`${prefix}DistrictCode`] ??
      ""

    const provinceCode =
      rawBooking?.[`${prefix}_province_code`] ??
      rawBooking?.[`${prefix}ProvinceCode`] ??
      ""

    const parts = [
      addressLine,
      names.wardName || (!names.isLoading ? wardCode : ""),
      names.districtName || (!names.isLoading ? districtCode : ""),
      names.provinceName || (!names.isLoading ? provinceCode : ""),
    ].filter(Boolean)

    if (!parts.length) {
      return names.isLoading ? "Đang tải địa chỉ..." : ""
    }

    return parts.join(", ")
  }

  const transportInfo = (booking.transport || {}) as any
  const transportName =
    transportInfo.companyName || transportInfo.company_name || transportInfo.transport_name || "Nhà xe"
  const transportId =
    transportInfo.transportId ??
    (transportInfo as any)?.transport_id ??
    booking.transport_id ??
    0
  const customerName = booking.pickup_contact_name || "Khách hàng"
  const customerId = booking.customer_id || 0

  return (
    <DashboardLayout navItems={navItems} title="Chi tiết công việc">
      <div className="container max-w-7xl py-10">
        {/* Header */}
        <div className="flex items-center gap-4 mb-6">
          <Button variant="ghost" size="icon" asChild className="hover:bg-accent transition-colors">
            <Link href="/transport/jobs">
              <ArrowLeft className="h-5 w-5" />
            </Link>
          </Button>
          <div>
            <h1 className="text-3xl font-bold">Chi tiết công việc #{booking.booking_id}</h1>
            <p className="text-muted-foreground">Xem thông tin và gửi báo giá</p>
          </div>
        </div>

        <div className="grid gap-6 lg:grid-cols-3">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-6">
            {showQuotationForm ? (
              <QuotationForm
                bookingId={booking.booking_id}
                onCancel={() => setShowQuotationForm(false)}
                onSuccess={() => setShowQuotationForm(false)}
              />
            ) : (
              <>
                {/* Route */}
                <Card className="hover:shadow-md transition-shadow">
                  <CardHeader>
                    <CardTitle>Lộ trình</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      {/* Pickup */}
                      <div className="flex items-start gap-3">
                        <MapPin className="h-5 w-5 text-success mt-1" />
                        <div className="flex-1">
                          <p className="font-medium mb-1">Địa chỉ đón</p>
                          <p className="text-sm text-muted-foreground">{formatAddress("pickup")}</p>
                          <p className="text-sm text-muted-foreground mt-1">
                            Liên hệ: {booking.pickup_contact_name} - {booking.pickup_contact_phone}
                          </p>
                          {booking.pickup_floor !== null && (
                            <p className="text-sm text-muted-foreground">
                              Tầng {booking.pickup_floor} {booking.pickup_has_elevator && "có thang máy"}
                            </p>
                          )}
                        </div>
                      </div>

                      <div className="flex items-center gap-2 px-4">
                        <ArrowDown className="h-5 w-5 text-muted-foreground" />
                        {booking.distance_km && (
                          <span className="text-sm text-muted-foreground">{booking.distance_km} km</span>
                        )}
                      </div>

                      {/* Delivery */}
                      <div className="flex items-start gap-3">
                        <MapPin className="h-5 w-5 text-destructive mt-1" />
                        <div className="flex-1">
                          <p className="font-medium mb-1">Địa chỉ giao</p>
                          <p className="text-sm text-muted-foreground">{formatAddress("delivery")}</p>
                          <p className="text-sm text-muted-foreground mt-1">
                            Liên hệ: {booking.delivery_contact_name} - {booking.delivery_contact_phone}
                          </p>
                          {booking.delivery_floor !== null && (
                            <p className="text-sm text-muted-foreground">
                              Tầng {booking.delivery_floor} {booking.delivery_has_elevator && "có thang máy"}
                            </p>
                          )}
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {/* Items */}
                <BookingItemsDisplay items={booking.items || []} />

                {/* Special Requirements */}
                {(booking.special_requirements || booking.notes) && (
                  <Card className="hover:shadow-md transition-shadow">
                    <CardHeader>
                      <CardTitle>Yêu cầu đặc biệt</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-3">
                      {booking.special_requirements && (
                        <div>
                          <p className="text-sm font-medium text-muted-foreground mb-1">Yêu cầu</p>
                          <p className="text-sm">{booking.special_requirements}</p>
                        </div>
                      )}
                      {booking.notes && (
                        <div>
                          <p className="text-sm font-medium text-muted-foreground mb-1">Ghi chú</p>
                          <p className="text-sm">{booking.notes}</p>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                )}

                {/* Review Section for Completed Jobs */}
                {!showQuotationForm && (booking.status === "COMPLETED" || booking.status === "REVIEWED") && (
                  <BookingReviewSection
                    bookingId={booking.booking_id}
                    bookingStatus={booking.status}
                    customerName={customerName}
                    transportName={transportName}
                    customerId={customerId}
                    transportId={transportId}
                  />
                )}
              </>
            )}
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Summary */}
            <Card className="hover:shadow-md transition-shadow">
              <CardHeader>
                <CardTitle>Thông tin</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Mã booking</span>
                  <span className="font-mono">#{booking.booking_id}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Ngày đón</span>
                  <span>{formatDate(booking.preferred_date)}</span>
                </div>
                {booking.distance_km && (
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Khoảng cách</span>
                    <span>{booking.distance_km} km</span>
                  </div>
                )}
                <Separator />
                {booking.estimated_price && (
                  <div className="flex justify-between items-center">
                    <span className="font-medium">Giá ước tính</span>
                    <span className="text-xl font-bold">{formatVND(booking.estimated_price)}</span>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Action */}
            {!showQuotationForm && (
              <Card className="hover:shadow-md transition-shadow">
                <CardHeader>
                  <CardTitle>Hành động</CardTitle>
                </CardHeader>
                <CardContent>
                  <Button
                    className="w-full bg-accent-green hover:bg-accent-green/90"
                    onClick={() => setShowQuotationForm(true)}
                  >
                    Gửi báo giá
                  </Button>
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      </div>
    </DashboardLayout>
  )
}
