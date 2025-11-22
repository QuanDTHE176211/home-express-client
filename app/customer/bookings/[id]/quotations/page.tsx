"use client"

import { useState } from "react"
import Image from "next/image"
import Link from "next/link"
import { useRouter, useParams } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { Skeleton } from "@/components/ui/skeleton"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import { ArrowLeft, Check, Star, TrendingDown, TrendingUp, Award, Shield, Wrench, AlertCircle, Truck, MessageSquare } from "lucide-react"
import { useQuotations, useBooking } from "@/hooks/use-bookings"
import { formatVND } from "@/lib/format"
import { apiClient } from "@/lib/api-client"
import { toast } from "sonner"
import { cn } from "@/lib/utils"
import { isQuotationExpired, getTimeUntilExpiration } from "@/lib/booking-utils"
import { DashboardLayout } from "@/components/dashboard/dashboard-layout"
import { navItems } from "@/lib/customer-nav-config"
import { useBookingEvents } from "@/hooks/use-booking-events"
import { CreateCounterOfferDialog } from "@/components/quotation/create-counter-offer-dialog"
import { CounterOfferList } from "@/components/quotation/counter-offer-list"
import type { QuotationDetail } from "@/types"

export default function QuotationsPage() {
  const params = useParams()
  const id = params.id as string
  const router = useRouter()
  const bookingId = Number.parseInt(id)
  const { quotations, summary, isLoading, isError, mutate } = useQuotations(bookingId)
  const { booking } = useBooking(bookingId)
  const [selectedQuotationId, setSelectedQuotationId] = useState<number | null>(null)
  const [isAccepting, setIsAccepting] = useState(false)
  const [showCounterOfferDialog, setShowCounterOfferDialog] = useState(false)
  const [selectedQuotationForCounterOffer, setSelectedQuotationForCounterOffer] = useState<QuotationDetail | null>(null)
  const [showCounterOfferList, setShowCounterOfferList] = useState<number | null>(null)

  // Setup real-time SSE updates for new quotations
  const { isConnected } = useBookingEvents({
    bookingId: bookingId || null,
    onNewQuotation: (event) => {
      console.log("[Quotations Page] New quotation received:", event)
      // Auto-refresh quotations list when new quotation arrives
      mutate()
    },
    onStatusChange: (event) => {
      console.log("[Quotations Page] Status changed:", event)
      // Refresh if booking status changes (might affect quotations)
      mutate()
    },
    onCounterOfferUpdate: (event) => {
      console.log("[Quotations Page] Counter-offer update:", event)
      // Refresh quotations when counter-offer is updated
      mutate()
    },
    showToasts: true,
    autoReconnect: true,
  })

  const handleAccept = async (quotationId: number) => {
    setIsAccepting(true)
    try {
      const result = await apiClient.acceptQuotation(quotationId)
      
      toast.success("Đã chấp nhận báo giá!", {
        description: "Hợp đồng sẽ được tạo tự động. Bạn có thể thanh toán đặt cọc ngay.",
        duration: 5000,
      })
      
      // Refresh quotations to show updated status
      await mutate()
      
      // Navigate to booking detail to see contract
      setTimeout(() => {
        router.push(`/customer/bookings/${bookingId}`)
      }, 1500)
    } catch (error: any) {
      console.error("Accept quotation error:", error)
      
      if (error?.status === 401) {
        toast.error("Phiên đăng nhập đã hết hạn", {
          description: "Vui lòng đăng nhập lại.",
        })
        router.push("/login")
      } else if (error?.status === 404) {
        toast.error("Không tìm thấy báo giá", {
          description: "Báo giá này có thể đã bị xóa hoặc không tồn tại.",
        })
        mutate()
      } else if (error?.status === 409) {
        toast.error("Báo giá đã được xử lý", {
          description: "Bạn đã chấp nhận báo giá khác hoặc báo giá này không còn khả dụng.",
        })
        mutate()
      } else {
        toast.error("Không thể chấp nhận báo giá", {
          description: error instanceof Error ? error.message : "Vui lòng thử lại sau ít phút.",
        })
      }
    } finally {
      setIsAccepting(false)
      setSelectedQuotationId(null)
    }
  }

  const handleReject = async (quotationId: number) => {
    try {
      await apiClient.rejectQuotation(quotationId, "Khách hàng từ chối")
      toast.success("Đã từ chối báo giá")
      mutate()
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Có lỗi xảy ra")
    }
  }

  if (isLoading) {
    return (
      <DashboardLayout navItems={navItems} title="Dang tai bao gia">
        <div className="container max-w-6xl py-10">
          <Skeleton className="h-10 w-64 mb-6" />
          <div className="grid gap-6 lg:grid-cols-3">
            <Skeleton className="h-48" />
            {[...Array(3)].map((_, i) => (
              <Skeleton key={i} className="h-96" />
            ))}
          </div>
        </div>
      </DashboardLayout>
    )
  }

  if (isError || !quotations) {
    return (
      <DashboardLayout navItems={navItems} title="Báo giá">
        <div className="container max-w-6xl py-10">
          <Card className="border-destructive">
            <CardContent className="pt-6">
              <div className="text-center py-12">
                <AlertCircle className="h-16 w-16 text-destructive mx-auto mb-4" />
                <h2 className="text-2xl font-bold mb-2">Không thể tải báo giá</h2>
                <p className="text-muted-foreground mb-6">
                  Đã có lỗi xảy ra khi tải danh sách báo giá. Vui lòng thử lại.
                </p>
                <div className="flex gap-4 justify-center">
                  <Button variant="outline" asChild>
                    <Link href={`/customer/bookings/${bookingId}`}>
                      <ArrowLeft className="h-4 w-4 mr-2" />
                      Quay lại đơn hàng
                    </Link>
                  </Button>
                  <Button onClick={() => mutate()}>Thử lại</Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </DashboardLayout>
    )
  }

  const typedQuotations = quotations as Array<any>
  const sortedQuotations = [...typedQuotations].sort(
    (a, b) => (a.total_price ?? a.totalPrice ?? 0) - (b.total_price ?? b.totalPrice ?? 0),
  )
  const lowestPrice = sortedQuotations[0]?.total_price ?? sortedQuotations[0]?.totalPrice
  const hasExpiredQuotations = typedQuotations.some((q) => isQuotationExpired(q.expires_at ?? q.expiresAt))
  const formatSummaryValue = (value: number | null | undefined) => (value != null ? formatVND(value) : "N/A")

  return (
    <DashboardLayout navItems={navItems} title={`Bao gia #${bookingId}`}>
      <div className="container max-w-7xl py-10">
        {/* Header */}
        <div className="flex items-center gap-4 mb-6">
          <Button variant="ghost" size="icon" asChild>
            <Link href={`/customer/bookings/${bookingId}`}>
              <ArrowLeft className="h-5 w-5" />
            </Link>
          </Button>
          <div>
            <h1 className="text-3xl font-bold">So sánh báo giá</h1>
            <p className="text-muted-foreground">Booking #{bookingId}</p>
          </div>
        </div>

        {hasExpiredQuotations && (
          <div className="bg-warning/10 border border-warning rounded-lg p-4 mb-6">
            <p className="text-sm text-warning-foreground">
              <AlertCircle className="inline h-4 w-4 mr-2" />
              Một số báo giá đã hết hạn. Vui lòng liên hệ đơn vị vận chuyển để gia hạn.
            </p>
          </div>
        )}

        {/* Summary Stats */}
        {summary && (
          <div className="grid gap-4 md:grid-cols-4 mb-6">
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium text-muted-foreground">Tổng báo giá</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-2xl font-bold">{summary.totalQuotations}</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium text-muted-foreground">Giá thấp nhất</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-2xl font-bold text-success">{formatSummaryValue(summary.lowestPrice)}</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium text-muted-foreground">Giá cao nhất</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-2xl font-bold text-destructive">{formatSummaryValue(summary.highestPrice)}</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium text-muted-foreground">Giá trung bình</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-2xl font-bold">{formatSummaryValue(summary.averagePrice)}</p>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Quotations Grid */}
        {typedQuotations.length === 0 ? (
          <Card>
            <CardContent className="py-16">
              <div className="text-center max-w-md mx-auto">
                <div className="bg-primary/10 w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-6">
                  <Truck className="h-10 w-10 text-primary" />
                </div>
                <h3 className="text-2xl font-bold mb-3">Đang chờ báo giá</h3>
                <p className="text-muted-foreground mb-6">
                  Đơn hàng của bạn đã được tạo thành công. Các nhà vận chuyển sẽ xem và gửi báo giá trong thời gian sớm nhất.
                </p>
                <div className="bg-muted rounded-lg p-4 mb-6 text-sm text-left">
                  <p className="font-medium mb-2">💡 Mẹo:</p>
                  <ul className="space-y-1 text-muted-foreground">
                    <li>• Thời gian nhận báo giá thường từ 15-60 phút</li>
                    <li>• Bạn sẽ nhận thông báo khi có báo giá mới</li>
                    <li>• Có thể so sánh nhiều báo giá trước khi chọn</li>
                  </ul>
                </div>
                <div className="flex gap-3 justify-center">
                  <Button variant="outline" asChild>
                    <Link href="/customer/bookings">
                      <ArrowLeft className="h-4 w-4 mr-2" />
                      Danh sách đơn hàng
                    </Link>
                  </Button>
                  <Button onClick={() => mutate()}>
                    Làm mới
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {sortedQuotations.map((quotation, index) => {
              const isLowest = quotation.total_price === lowestPrice
              const expiresAt = quotation.expires_at ?? quotation.expiresAt
              const isExpired = isQuotationExpired(expiresAt)
              const timeRemaining = getTimeUntilExpiration(expiresAt)

              return (
                <Card
                  key={quotation.quotation_id}
                  className={cn(
                    "relative transition-all hover:shadow-lg",
                    isLowest && "border-success border-2",
                    isExpired && "opacity-60",
                  )}
                >
                  {/* Best Price Badge */}
                  {isLowest && !isExpired && (
                    <div className="absolute -top-3 left-1/2 -translate-x-1/2 z-10">
                      <Badge className="bg-success hover:bg-success">
                        <Award className="mr-1 h-3 w-3" />
                        Giá tốt nhất
                      </Badge>
                    </div>
                  )}

                  <CardHeader>
                    {/* Transport Info */}
                    <div className="flex items-start gap-3">
                      <div className="h-12 w-12 rounded-full bg-muted flex items-center justify-center flex-shrink-0">
                        {quotation.transporter_avatar ? (
                          <Image
                            src={quotation.transporter_avatar || "/placeholder.svg"}
                            alt={quotation.transporter_name}
                            width={48}
                            height={48}
                            className="h-12 w-12 rounded-full object-cover"
                          />
                        ) : (
                          <span className="text-lg font-bold">{quotation.transporter_name.charAt(0)}</span>
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <CardTitle className="text-lg truncate">{quotation.transporter_name}</CardTitle>
                        <div className="flex items-center gap-2 mt-1">
                          <div className="flex items-center gap-1">
                            <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                            <span className="text-sm font-medium">{quotation.transporter_rating.toFixed(1)}</span>
                          </div>
                          <span className="text-sm text-muted-foreground">
                            • {quotation.transporter_completed_jobs} chuyến
                          </span>
                        </div>
                      </div>
                    </div>
                  </CardHeader>

                  <CardContent className="space-y-4">
                    {/* Vehicle Info */}
                    {(quotation.vehicle_model || quotation.vehicleModel) && (
                      <div className="bg-blue-50 dark:bg-blue-950 border border-blue-200 dark:border-blue-800 rounded-lg p-3">
                        <div className="flex items-center gap-2 mb-1">
                          <Truck className="h-4 w-4 text-blue-600 dark:text-blue-400" />
                          <span className="font-medium text-sm text-blue-800 dark:text-blue-200">Phương tiện vận chuyển</span>
                        </div>
                        <div className="text-sm text-blue-700 dark:text-blue-300">
                          <p className="font-semibold">{quotation.vehicle_model || quotation.vehicleModel}</p>
                          <p className="text-xs">
                            Biển số: <span className="font-mono font-bold">{quotation.vehicle_license_plate || quotation.vehicleLicensePlate}</span>
                            {(quotation.vehicle_capacity_kg || quotation.vehicleCapacityKg) && (
                              <> • Tải trọng: {quotation.vehicle_capacity_kg || quotation.vehicleCapacityKg} kg</>
                            )}
                            {(quotation.vehicle_capacity_m3 || quotation.vehicleCapacityM3) && (
                              <> • Thể tích: {quotation.vehicle_capacity_m3 || quotation.vehicleCapacityM3} m³</>
                            )}
                          </p>
                        </div>
                      </div>
                    )}

                    {/* Price Breakdown */}
                    <div className="space-y-2">
                      <div className="flex justify-between text-sm">
                        <span className="text-muted-foreground">Phí cơ bản</span>
                        <span>{formatVND(quotation.base_price)}</span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span className="text-muted-foreground">Phí khoảng cách</span>
                        <span>{formatVND(quotation.distance_price)}</span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span className="text-muted-foreground">Phí xử lý hàng</span>
                        <span>{formatVND(quotation.item_handling_price)}</span>
                      </div>
                      {quotation.additional_services_price > 0 && (
                        <div className="flex justify-between text-sm">
                          <span className="text-muted-foreground">Dịch vụ bổ sung</span>
                          <span>{formatVND(quotation.additional_services_price)}</span>
                        </div>
                      )}
                      <Separator />
                      <div className="flex justify-between items-center">
                        <span className="font-semibold">Tổng cộng</span>
                        <span className="text-2xl font-bold text-primary">{formatVND(quotation.total_price)}</span>
                      </div>

                      {/* Price Comparison */}
                      {summary?.averagePrice != null && quotation.total_price !== summary.averagePrice && (
                        <div className="flex items-center gap-1 text-sm">
                          {quotation.total_price < summary.averagePrice ? (
                            <>
                              <TrendingDown className="h-4 w-4 text-success" />
                              <span className="text-success">
                                Thấp hơn {formatVND(summary.averagePrice - quotation.total_price)}
                              </span>
                            </>
                          ) : (
                            <>
                              <TrendingUp className="h-4 w-4 text-destructive" />
                              <span className="text-destructive">
                                Cao hơn {formatVND(quotation.total_price - summary.averagePrice)}
                              </span>
                            </>
                          )}
                        </div>
                      )}
                    </div>

                    {/* Services Included */}
                    <div className="space-y-2">
                      <p className="text-sm font-medium">Dịch vụ bao gồm:</p>
                      <div className="flex flex-wrap gap-2">
                        {quotation.includes_packaging && (
                          <Badge variant="secondary">
                            <div className="h-3 w-3 mr-1 bg-muted rounded-full flex items-center justify-center">
                              <span className="text-lg font-bold">P</span>
                            </div>
                            Đóng gói
                          </Badge>
                        )}
                        {quotation.includes_disassembly && (
                          <Badge variant="secondary">
                            <Wrench className="mr-1 h-3 w-3" />
                            Tháo lắp
                          </Badge>
                        )}
                        {quotation.includes_insurance && (
                          <Badge variant="secondary">
                            <Shield className="mr-1 h-3 w-3" />
                            Bảo hiểm {quotation.insurance_value && `(${formatVND(quotation.insurance_value)})`}
                          </Badge>
                        )}
                      </div>
                    </div>

                    {/* Estimated Time */}
                    {quotation.estimated_duration_hours && (
                      <div className="text-sm">
                        <span className="text-muted-foreground">Thời gian ước tính: </span>
                        <span className="font-medium">{quotation.estimated_duration_hours} giờ</span>
                      </div>
                    )}

                    {/* Expiration */}
                    <div className="text-sm">
                      <span className="text-muted-foreground">Hết hạn: </span>
                      <span className={cn("font-medium", isExpired && "text-destructive")}>{timeRemaining}</span>
                    </div>

                    {/* Notes */}
                    {quotation.notes && (
                      <div className="text-sm bg-muted/50 p-3 rounded-lg">
                        <p className="text-muted-foreground">{quotation.notes}</p>
                      </div>
                    )}
                  </CardContent>

                  <CardFooter className="flex flex-col gap-2">
                    <div className="flex gap-2 w-full">
                      {quotation.status === "pending" && !isExpired ? (
                        <>
                          <Button
                            variant="outline"
                            className="flex-1 bg-transparent"
                            onClick={() => handleReject(quotation.quotation_id)}
                          >
                            Từ chối
                          </Button>
                          <Button
                            variant="outline"
                            className="flex-1"
                            onClick={() => {
                              setSelectedQuotationForCounterOffer(quotation)
                              setShowCounterOfferDialog(true)
                            }}
                          >
                            <MessageSquare className="mr-2 h-4 w-4" />
                            Đề xuất giá
                          </Button>
                          <Button
                            className="flex-1 bg-success hover:bg-success/90"
                            onClick={() => setSelectedQuotationId(quotation.quotation_id)}
                            disabled={isAccepting}
                          >
                            <Check className="mr-2 h-4 w-4" />
                            Chấp nhận
                          </Button>
                        </>
                      ) : quotation.status === "accepted" ? (
                        <Button className="w-full" disabled>
                          <Check className="mr-2 h-4 w-4" />
                          Đã chấp nhận
                        </Button>
                      ) : quotation.status === "rejected" ? (
                        <Button variant="outline" className="w-full bg-transparent" disabled>
                          Đã từ chối
                        </Button>
                      ) : (
                        <Button variant="outline" className="w-full bg-transparent" disabled>
                          Đã hết hạn
                        </Button>
                      )}
                    </div>

                    {/* Counter-offer list toggle */}
                    {quotation.status === "pending" && !isExpired && (
                      <Button
                        variant="ghost"
                        size="sm"
                        className="w-full"
                        onClick={() => setShowCounterOfferList(
                          showCounterOfferList === quotation.quotation_id ? null : quotation.quotation_id
                        )}
                      >
                        {showCounterOfferList === quotation.quotation_id ? "Ẩn" : "Xem"} lịch sử đề xuất giá
                      </Button>
                    )}

                    {/* Counter-offer list */}
                    {showCounterOfferList === quotation.quotation_id && (
                      <div className="w-full pt-2">
                        <CounterOfferList
                          quotationId={quotation.quotation_id}
                          onCounterOfferUpdate={() => mutate()}
                        />
                      </div>
                    )}
                  </CardFooter>
                </Card>
              )
            })}
          </div>
        )}

        {/* Accept Confirmation Dialog */}
        <AlertDialog open={selectedQuotationId !== null} onOpenChange={() => setSelectedQuotationId(null)}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Xác nhận chấp nhận báo giá</AlertDialogTitle>
              <AlertDialogDescription>
                Bạn có chắc muốn chấp nhận báo giá này không? Sau khi chấp nhận, hợp đồng sẽ được tạo và bạn không thể
                thay đổi.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel disabled={isAccepting}>Hủy</AlertDialogCancel>
              <AlertDialogAction
                onClick={() => selectedQuotationId && handleAccept(selectedQuotationId)}
                disabled={isAccepting}
                className="bg-success hover:bg-success/90"
              >
                {isAccepting ? "Đang xử lý..." : "Xác nhận"}
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>

        {/* Counter-offer Dialog */}
        {selectedQuotationForCounterOffer && (
          <CreateCounterOfferDialog
            open={showCounterOfferDialog}
            onOpenChange={setShowCounterOfferDialog}
            quotation={selectedQuotationForCounterOffer}
            onSuccess={() => {
              mutate()
              setSelectedQuotationForCounterOffer(null)
            }}
          />
        )}
      </div>
    </DashboardLayout>
  )
}
