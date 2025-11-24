"use client"

import Link from "next/link"
import { useRouter, useParams } from "next/navigation"
import { DashboardLayout } from "@/components/dashboard/dashboard-layout"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Separator } from "@/components/ui/separator"
import { Badge } from "@/components/ui/badge"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Skeleton } from "@/components/ui/skeleton"
import { MapPin, ArrowDown, Package, FileText, X, AlertCircle, CreditCard, Upload, Image as ImageIcon } from "lucide-react"
import { useBooking } from "@/hooks/use-bookings"
import { BookingTimeline } from "@/components/booking/booking-timeline"
import { EvidenceGallery } from "@/components/booking/evidence-gallery"
import { EvidenceUpload } from "@/components/booking/evidence-upload"
import { formatVND, formatDate } from "@/lib/format"
import { useLocationNames } from "@/hooks/use-location-names"
import { canCancelBooking, calculateCancellationFee } from "@/lib/booking-utils"
import { apiClient } from "@/lib/api-client"
import { toast } from "sonner"
import { useState, useEffect, useCallback } from "react"
import { BookingReviewSection } from "@/components/bookings/booking-review-section"
import { navItems } from "@/lib/customer-nav-config"
import { useBookingEvents } from "@/hooks/use-booking-events"
import type { BookingEvidence, Dispute } from "@/types"
import { DisputeList } from "@/components/dispute/dispute-list"
import { DisputeDetail } from "@/components/dispute/dispute-detail"
import { FileDisputeDialog } from "@/components/dispute/file-dispute-dialog"

export default function BookingDetailPage() {
  const params = useParams()
  const id = params.id as string
  const router = useRouter()
  const bookingId = Number.parseInt(id)
  const { booking, statusHistory, isLoading, isError, mutate } = useBooking(bookingId)
  const [isCancelling, setIsCancelling] = useState(false)
  const [evidence, setEvidence] = useState<BookingEvidence[]>([])
  const [isLoadingEvidence, setIsLoadingEvidence] = useState(false)
  const [showUploadDialog, setShowUploadDialog] = useState(false)
  const [showFileDisputeDialog, setShowFileDisputeDialog] = useState(false)
  const [selectedDispute, setSelectedDispute] = useState<Dispute | null>(null)
  const [disputes, setDisputes] = useState<Dispute[]>([])
  const [isLoadingDisputes, setIsLoadingDisputes] = useState(false)

  // Load evidence
  const loadEvidence = useCallback(async () => {
    if (!bookingId) return

    setIsLoadingEvidence(true)
    try {
      const response = await apiClient.getBookingEvidence(bookingId)
      setEvidence(response.evidence)
    } catch (error) {
      console.error("Failed to load evidence:", error)
      toast.error("Không thể tải minh chứng")
    } finally {
      setIsLoadingEvidence(false)
    }
  }, [bookingId])

  // Load disputes
  const loadDisputes = useCallback(async () => {
    if (!bookingId) return

    setIsLoadingDisputes(true)
    try {
      const response = await apiClient.getBookingDisputes(bookingId)
      setDisputes(response.disputes)
    } catch (error) {
      console.error("Failed to load disputes:", error)
      toast.error("Failed to load disputes")
    } finally {
      setIsLoadingDisputes(false)
    }
  }, [bookingId])

  useEffect(() => {
    if (bookingId) {
      loadEvidence()
      loadDisputes()
    }
  }, [bookingId, loadEvidence, loadDisputes])

  // Setup real-time SSE updates
  const { isConnected } = useBookingEvents({
    bookingId: bookingId || null,
    onStatusChange: (event) => {
      console.log("[Booking Detail] Status changed:", event)
      // Refresh booking data when status changes
      mutate()
    },
    onNewQuotation: (event) => {
      console.log("[Booking Detail] New quotation:", event)
      // Refresh booking data to show new quotation
      mutate()
    },
    onPaymentUpdate: (event) => {
      console.log("[Booking Detail] Payment update:", event)
      // Refresh booking data to reflect payment
      mutate()
    },
    onTransportAssignment: (event) => {
      console.log("[Booking Detail] Transport assigned:", event)
      // Refresh booking data to show assigned transport
      mutate()
    },
    onDisputeUpdate: (event) => {
      console.log("[Booking Detail] Dispute update:", event)
      // Refresh disputes when there's an update
      loadDisputes()
    },
    showToasts: true,
    autoReconnect: true,
  })

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

  const renderStatusBadge = (status: string) => {
    const config: Record<
      string,
      {
        label: string
        className: string
      }
    > = {
      PENDING: { label: "Chờ xử lý", className: "bg-amber-100 text-amber-700 border-amber-200" },
      QUOTED: { label: "Đã báo giá", className: "bg-blue-100 text-blue-700 border-blue-200" },
      CONFIRMED: { label: "Đã xác nhận", className: "bg-indigo-100 text-indigo-700 border-indigo-200" },
      IN_PROGRESS: { label: "Đang thực hiện", className: "bg-sky-100 text-sky-700 border-sky-200" },
      COMPLETED: { label: "Hoàn thành", className: "bg-accent-green/10 text-accent-green border-accent-green" },
      CONFIRMED_BY_CUSTOMER: { label: "Đã xác nhận hoàn tất", className: "bg-green-100 text-green-700 border-green-200" },
      REVIEWED: { label: "Đã đánh giá", className: "bg-green-100 text-green-700 border-green-200" },
      CANCELLED: { label: "Đã hủy", className: "bg-red-100 text-red-700 border-red-200" },
    }

    const match = config[status] || config.PENDING

    return (
      <Badge variant="outline" className={match.className}>
        {match.label}
      </Badge>
    )
  }

  const handleCancel = async () => {
    setIsCancelling(true)
    try {
      const result = await apiClient.cancelBooking(bookingId, "Khách hàng hủy")
      toast.success(result.message)
      mutate()
      router.push("/customer/bookings")
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Có lỗi xảy ra")
    } finally {
      setIsCancelling(false)
    }
  }

  const handleEvidenceUploadSuccess = () => {
    setShowUploadDialog(false)
    loadEvidence()
    toast.success("Đã tải lên minh chứng thành công")
  }

  const handleDeleteEvidence = async (evidenceId: number) => {
    try {
      await apiClient.deleteBookingEvidence(evidenceId)
      toast.success("Đã xóa minh chứng")
      loadEvidence()
    } catch (error) {
      console.error("Failed to delete evidence:", error)
      toast.error("Không thể xóa minh chứng")
    }
  }

  const handleDisputeClick = (dispute: Dispute) => {
    setSelectedDispute(dispute)
  }

  const handleDisputeSuccess = () => {
    setShowFileDisputeDialog(false)
    loadDisputes()
    toast.success("Dispute filed successfully")
  }

  const handleBackToDisputeList = () => {
    setSelectedDispute(null)
  }

  // Check if user can upload evidence (only for certain statuses)
  const canUploadEvidence = booking && [
    "CONFIRMED",
    "IN_PROGRESS",
    "COMPLETED",
    "CONFIRMED_BY_CUSTOMER",
  ].includes(booking.status)

  if (isLoading) {
    return (
      <DashboardLayout navItems={navItems} title="Chi tiết booking">
        <div className="max-w-6xl mx-auto px-6 space-y-6">
          <Skeleton className="h-10 w-64" />
          <div className="grid gap-6 lg:grid-cols-3">
            <div className="lg:col-span-2 space-y-6">
              <Skeleton className="h-96" />
              <Skeleton className="h-64" />
            </div>
            <div className="space-y-6">
              <Skeleton className="h-48" />
              <Skeleton className="h-32" />
            </div>
          </div>
        </div>
      </DashboardLayout>
    )
  }

  if (isError || !booking) {
    return (
      <DashboardLayout navItems={navItems} title="Chi tiết booking">
        <div className="max-w-6xl mx-auto px-6">
          <div className="text-center py-12">
            <AlertCircle className="h-12 w-12 text-destructive mx-auto mb-4" />
            <h2 className="text-2xl font-bold mb-2">Không tìm thấy booking</h2>
            <p className="text-muted-foreground mb-4">Booking này không tồn tại hoặc bạn không có quyền truy cập</p>
            <Button asChild className="bg-accent-green hover:bg-accent-green-dark">
              <Link href="/customer/bookings">Quay lại danh sách</Link>
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

  const cancellationInfo = calculateCancellationFee(
    booking.status as import("@/types").BookingStatus,
    booking.final_price ?? null,
    booking.scheduled_datetime ?? null,
  )

  const transportInfo = (booking.transport || {}) as any
  const transportName =
    transportInfo.companyName || transportInfo.company_name || transportInfo.transport_name || "Nhà xe"
  const transportId =
    transportInfo.transportId ??
    (transportInfo as any)?.transport_id ??
    booking.transport_id ??
    0
  const customerName = (booking as any).customer_name || booking.pickup_contact_name || "Khách hàng"
  const customerId = booking.customer_id || 0

  return (
    <DashboardLayout navItems={navItems} title={`Booking #${booking.booking_id}`}>
      <div className="max-w-6xl mx-auto px-6 space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Booking #{booking.booking_id}</h1>
            <p className="text-muted-foreground mt-1">Tạo lúc {formatDate(booking.created_at)}</p>
          </div>
          {renderStatusBadge(booking.status)}
        </div>

        <div className="grid gap-6 lg:grid-cols-3">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-6">
            {/* Status Timeline */}
            <Card className="hover:shadow-md transition-shadow">
              <CardHeader>
                <CardTitle>Trạng thái</CardTitle>
              </CardHeader>
              <CardContent>
                <BookingTimeline currentStatus={booking.status as import("@/types").BookingStatus} history={statusHistory || []} />
              </CardContent>
            </Card>

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
                          Tầng {booking.pickup_floor} {booking.pickup_has_elevator && "• Có thang máy"}
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
                          Tầng {booking.delivery_floor} {booking.delivery_has_elevator && "• Có thang máy"}
                        </p>
                      )}
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Items */}
            {booking.items && booking.items.length > 0 && (
              <Card className="hover:shadow-md transition-shadow">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Package className="h-5 w-5" />
                    Đồ đạc ({booking.items.length})
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {booking.items.map((item: any, index: number) => (
                      <div key={index} className="flex items-start justify-between p-3 bg-muted/50 rounded-lg">
                        <div className="flex-1">
                          <p className="font-medium">{item.name}</p>
                          <p className="text-sm text-muted-foreground">
                            Số lượng: {item.quantity}
                            {item.weight && ` • ${item.weight} kg`}
                          </p>
                          <div className="flex flex-wrap gap-1 mt-2">
                            {item.is_fragile && <Badge variant="secondary">Dễ vỡ</Badge>}
                            {item.requires_disassembly && <Badge variant="secondary">Cần tháo lắp</Badge>}
                            {item.requires_packaging && <Badge variant="secondary">Cần đóng gói</Badge>}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Evidence Section */}
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold flex items-center gap-2">
                  <ImageIcon className="h-5 w-5" />
                  Minh chứng
                  {evidence.length > 0 && (
                    <Badge variant="secondary">{evidence.length}</Badge>
                  )}
                </h3>
                {canUploadEvidence && (
                  <Dialog open={showUploadDialog} onOpenChange={setShowUploadDialog}>
                    <DialogTrigger asChild>
                      <Button size="sm" className="bg-accent-green hover:bg-accent-green-dark">
                        <Upload className="h-4 w-4 mr-2" />
                        Tải lên
                      </Button>
                    </DialogTrigger>
                    <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
                      <DialogHeader>
                        <DialogTitle>Tải lên minh chứng</DialogTitle>
                      </DialogHeader>
                      <EvidenceUpload
                        bookingId={bookingId}
                        onSuccess={handleEvidenceUploadSuccess}
                        onCancel={() => setShowUploadDialog(false)}
                      />
                    </DialogContent>
                  </Dialog>
                )}
              </div>

              <EvidenceGallery
                evidence={evidence}
                isLoading={isLoadingEvidence}
                onDelete={handleDeleteEvidence}
                canDelete={true}
              />
            </div>

            {/* Disputes Section */}
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold flex items-center gap-2">
                  <AlertCircle className="h-5 w-5" />
                  Disputes
                  {disputes.length > 0 && (
                    <Badge variant="secondary">{disputes.length}</Badge>
                  )}
                </h3>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => setShowFileDisputeDialog(true)}
                >
                  <AlertCircle className="h-4 w-4 mr-2" />
                  File disputes
                </Button>
              </div>

              {selectedDispute ? (
                <div>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={handleBackToDisputeList}
                    className="mb-4"
                  >
                    ← Back to disputes
                  </Button>
                  <DisputeDetail
                    disputeId={selectedDispute.disputeId}
                    currentUserId={customerId}
                  />
                </div>
              ) : (
                <DisputeList
                  bookingId={bookingId}
                  onDisputeClick={handleDisputeClick}
                />
              )}
            </div>

            {/* File Disputes Dialog */}
            <FileDisputeDialog
              open={showFileDisputeDialog}
              onOpenChange={setShowFileDisputeDialog}
              bookingId={bookingId}
              onSuccess={handleDisputeSuccess}
            />

            {/* Review Section for Completed Bookings */}
            {(booking.status === "COMPLETED" || booking.status === "REVIEWED") && (
              <BookingReviewSection
                bookingId={booking.booking_id}
                bookingStatus={booking.status}
                customerName={customerName}
                transportName={transportName}
                customerId={customerId}
                transportId={transportId}
              />
            )}
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Summary */}
            <Card className="hover:shadow-md transition-shadow">
              <CardHeader>
                <CardTitle>Tóm tắt</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Mã booking</span>
                  <span className="font-mono">#{booking.booking_id}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Ngày tạo</span>
                  <span>{formatDate(booking.created_at)}</span>
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
                {booking.final_price && (
                  <div className="flex justify-between items-center text-success">
                    <span className="font-medium">Giá cuối cùng</span>
                    <span className="text-xl font-bold">{formatVND(booking.final_price)}</span>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Actions */}
            <Card className="hover:shadow-md transition-shadow">
              <CardHeader>
                <CardTitle>Hành động</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                {booking.status === "QUOTED" && booking.quotationsCount > 0 && (
                  <Button className="w-full bg-accent-green hover:bg-accent-green-dark" asChild>
                    <Link href={`/customer/bookings/${booking.booking_id}/quotations`}>
                      <FileText className="mr-2 h-4 w-4" />
                      Xem {booking.quotationsCount} báo giá
                    </Link>
                  </Button>
                )}

                {booking.status === "CONFIRMED" && booking.contractId && (
                  <Button variant="outline" className="w-full bg-transparent" asChild>
                    <Link href={`/customer/contracts/${booking.contractId}`}>
                      <FileText className="mr-2 h-4 w-4" />
                      Xem hợp đồng
                    </Link>
                  </Button>
                )}

                {booking.status === "COMPLETED" && (
                  <Button className="w-full bg-primary hover:bg-primary/90" asChild>
                    <Link href={`/customer/bookings/${booking.booking_id}/complete`}>
                      <CreditCard className="mr-2 h-4 w-4" />
                      Hoàn tất & Thanh toán
                    </Link>
                  </Button>
                )}

                {booking.status === "COMPLETED" && (
                  <Button className="w-full bg-accent-green hover:bg-accent-green-dark" asChild>
                    <Link href={`/customer/rate/${booking.booking_id}`}>
                      <FileText className="mr-2 h-4 w-4" />
                      Đánh giá chuyến đi
                    </Link>
                  </Button>
                )}

                {canCancelBooking(booking.status as import("@/types").BookingStatus) && (
                  <AlertDialog>
                    <AlertDialogTrigger asChild>
                      <Button variant="destructive" className="w-full" disabled={isCancelling}>
                        <X className="mr-2 h-4 w-4" />
                        Hủy chuyến
                      </Button>
                    </AlertDialogTrigger>
                    <AlertDialogContent>
                      <AlertDialogHeader>
                        <AlertDialogTitle>Xác nhận hủy chuyến</AlertDialogTitle>
                        <AlertDialogDescription>Bạn có chắc muốn hủy chuyến này không?</AlertDialogDescription>
                        {cancellationInfo.cancellationFee !== null && (
                          <span className="block mt-2 text-destructive font-medium">
                            Phí hủy: {formatVND(cancellationInfo.cancellationFee)}
                          </span>
                        )}
                      </AlertDialogHeader>
                      <AlertDialogFooter>
                        <AlertDialogCancel>Quay lại</AlertDialogCancel>
                        <AlertDialogAction onClick={handleCancel} className="bg-destructive hover:bg-destructive/90">
                          Xác nhận hủy
                        </AlertDialogAction>
                      </AlertDialogFooter>
                    </AlertDialogContent>
                  </AlertDialog>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </DashboardLayout>
  )
}
