"use client"

import { use, useState, useCallback } from "react"
import { useRouter } from "next/navigation"
import useSWR from "swr"
import { DashboardLayout } from "@/components/dashboard/dashboard-layout"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Alert, AlertDescription } from "@/components/ui/alert"
import {
  Truck,
  Package,
  FileBarChart,
  FileText,
  Settings,
  DollarSign,
  BarChart3,
  Star,
  MapPin,
  ArrowDown,
  CheckCircle2,
  AlertCircle,
  ArrowLeft,
  Phone,
} from "lucide-react"
import { apiClient } from "@/lib/api-client"
import { buildApiUrl } from "@/lib/api-url"
import { formatVND, formatDate } from "@/lib/format"
import { useSSE } from "@/lib/sse"
import { toast } from "sonner"
import { http } from "@/lib/http"

const navItems = [
  { href: "/transport", label: "Tổng quan", icon: "Package" },
  { href: "/transport/jobs", label: "Công việc", icon: "Truck" },
  { href: "/transport/quotations", label: "Báo giá", icon: "FileBarChart" },
  { href: "/transport/active", label: "Đang thực hiện", icon: "Truck" },
  { href: "/transport/contracts", label: "Hợp đồng", icon: "FileText" },
  { href: "/transport/vehicles", label: "Xe", icon: "Truck" },
  { href: "/transport/earnings", label: "Thu nhập", icon: "DollarSign" },
  { href: "/transport/analytics", label: "Phân tích", icon: "BarChart3" },
  { href: "/transport/reviews", label: "Đánh giá", icon: "Star" },
  { href: "/transport/settings", label: "Cài đặt", icon: "Settings" },
]

const STATUS_FLOW = [
  { key: "CONFIRMED", label: "Đã xác nhận", icon: CheckCircle2 },
  { key: "DRIVER_ON_THE_WAY", label: "Đang đến điểm đón", icon: Truck },
  { key: "LOADING", label: "Đang bốc hàng", icon: Package },
  { key: "IN_TRANSIT", label: "Đang vận chuyển", icon: Truck },
  { key: "UNLOADING", label: "Đang dỡ hàng", icon: Package },
  { key: "COMPLETED", label: "Hoàn thành", icon: CheckCircle2 },
]

interface ActiveJobDetailPageProps {
  params: Promise<{ id: string }>
}

export default function ActiveJobDetailPage({ params }: ActiveJobDetailPageProps) {
  const { id } = use(params)
  const router = useRouter()
  const bookingId = Number.parseInt(id)

  const {
    data: job,
    error,
    isLoading,
    mutate,
  } = useSWR(`/transport/active-jobs/${bookingId}`, () => apiClient.getTransportActiveJobDetail(bookingId))

  const [isUpdating, setIsUpdating] = useState(false)

  useSSE(
    buildApiUrl(`/transport/jobs/${bookingId}/events`),
    useCallback(
      (evt: any) => {
        if (evt?.type === "JOB_STATUS") {
          mutate()
          toast.success(`Trạng thái đã cập nhật: ${evt.data.status}`)
        }
      },
      [mutate],
    ),
  )

  const handleUpdateStatus = async (nextStatus: string) => {
    setIsUpdating(true)
    try {
      await http(buildApiUrl(`/transport/jobs/${bookingId}/status`), {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: nextStatus }),
      })
      toast.success("Cập nhật trạng thái thành công")
      mutate()

      if (nextStatus === "COMPLETED") {
        setTimeout(() => router.push("/transport/active"), 1500)
      }
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Có lỗi xảy ra")
    } finally {
      setIsUpdating(false)
    }
  }

  if (isLoading) {
    return (
      <DashboardLayout navItems={navItems} title="Chi tiết công việc">
        <div className="container max-w-4xl py-10">
          <div className="animate-pulse space-y-4">
            <div className="h-8 bg-muted rounded w-1/3" />
            <div className="h-64 bg-muted rounded" />
          </div>
        </div>
      </DashboardLayout>
    )
  }

  if (error || !job) {
    return (
      <DashboardLayout navItems={navItems} title="Chi tiết công việc">
        <div className="container max-w-4xl py-10">
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>Không thể tải công việc. Vui lòng thử lại sau.</AlertDescription>
          </Alert>
        </div>
      </DashboardLayout>
    )
  }

  const currentStatusIndex = STATUS_FLOW.findIndex((s) => s.key === job.status)
  const nextStatus = STATUS_FLOW[currentStatusIndex + 1]

  return (
    <DashboardLayout navItems={navItems} title="Chi tiết công việc">
      <div className="container max-w-4xl py-10 space-y-6">
        {/* Back Button */}
        <Button variant="ghost" onClick={() => router.back()} className="gap-2">
          <ArrowLeft className="h-4 w-4" />
          Quay lại
        </Button>

        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold">Booking #{job.booking_id}</h1>
            <p className="text-muted-foreground mt-1">Ngày đón: {formatDate(job.preferred_date)}</p>
          </div>
          <div className="text-right">
            <p className="text-2xl font-bold text-accent-green">{formatVND(job.final_price)}</p>
            {job.distance_km && <p className="text-sm text-muted-foreground">{job.distance_km} km</p>}
          </div>
        </div>

        {/* Status Stepper */}
        <Card className="hover:shadow-md transition-shadow">
          <CardHeader>
            <CardTitle>Trạng thái vận chuyển</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {STATUS_FLOW.map((status, index) => {
                const Icon = status.icon
                const isCompleted = index < currentStatusIndex
                const isCurrent = index === currentStatusIndex
                const isPending = index > currentStatusIndex

                return (
                  <div key={status.key} className="flex items-start gap-4">
                    <div className="flex flex-col items-center">
                      <div
                        className={`rounded-full p-2 ${
                          isCompleted
                            ? "bg-success text-success-foreground"
                            : isCurrent
                              ? "bg-accent-green text-white"
                              : "bg-muted text-muted-foreground"
                        }`}
                      >
                        <Icon className="h-5 w-5" />
                      </div>
                      {index < STATUS_FLOW.length - 1 && (
                        <div className={`w-0.5 h-12 ${isCompleted ? "bg-success" : "bg-muted"}`} />
                      )}
                    </div>
                    <div className="flex-1 pt-1">
                      <p className={`font-medium ${isCurrent ? "text-accent-green" : ""}`}>{status.label}</p>
                      {isCurrent && (
                        <Badge variant="default" className="mt-1">
                          Đang thực hiện
                        </Badge>
                      )}
                      {isCompleted && <p className="text-sm text-muted-foreground mt-1">Đã hoàn thành</p>}
                    </div>
                  </div>
                )
              })}
            </div>

            {/* Update Button */}
            {nextStatus && (
              <div className="mt-6 pt-6 border-t">
                <Button
                  onClick={() => handleUpdateStatus(nextStatus.key)}
                  disabled={isUpdating}
                  className="w-full bg-accent-green hover:bg-accent-green-dark"
                  size="lg"
                >
                  {isUpdating ? "Đang cập nhật..." : `Cập nhật: ${nextStatus.label}`}
                </Button>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Route Info */}
        <Card className="hover:shadow-md transition-shadow">
          <CardHeader>
            <CardTitle>Thông tin lộ trình</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {/* Pickup */}
              <div className="flex items-start gap-3">
                <MapPin className="h-5 w-5 text-success mt-1" />
                <div className="flex-1">
                  <p className="font-medium mb-1">Địa chỉ đón</p>
                  <p className="text-sm text-muted-foreground">{job.pickup_address}</p>
                  <div className="flex items-center gap-4 mt-2">
                    <a
                      href={`tel:${job.pickup_contact_phone}`}
                      className="text-sm text-accent-green hover:underline flex items-center gap-1"
                    >
                      <Phone className="h-3 w-3" />
                      {job.pickup_contact_phone}
                    </a>
                    <span className="text-sm text-muted-foreground">{job.pickup_contact_name}</span>
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-2 px-4">
                <ArrowDown className="h-5 w-5 text-muted-foreground" />
                {job.distance_km && <span className="text-sm text-muted-foreground">{job.distance_km} km</span>}
              </div>

              {/* Delivery */}
              <div className="flex items-start gap-3">
                <MapPin className="h-5 w-5 text-destructive mt-1" />
                <div className="flex-1">
                  <p className="font-medium mb-1">Địa chỉ giao</p>
                  <p className="text-sm text-muted-foreground">{job.delivery_address}</p>
                  <div className="flex items-center gap-4 mt-2">
                    <a
                      href={`tel:${job.delivery_contact_phone}`}
                      className="text-sm text-accent-green hover:underline flex items-center gap-1"
                    >
                      <Phone className="h-3 w-3" />
                      {job.delivery_contact_phone}
                    </a>
                    <span className="text-sm text-muted-foreground">{job.delivery_contact_name}</span>
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Items */}
        {job.items && job.items.length > 0 && (
          <Card className="hover:shadow-md transition-shadow">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Package className="h-5 w-5" />
                Đồ đạc ({job.items.length})
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {job.items.map((item: any, index: number) => (
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
      </div>
    </DashboardLayout>
  )
}
