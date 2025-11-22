"use client"

import { useState, useCallback } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import {
  Search,
  FileText,
  Clock,
  CheckCircle,
  XCircle,
  Eye,
  LayoutDashboard,
  Truck,
  Package,
  Star,
  DollarSign,
} from "lucide-react"
import { DashboardLayout } from "@/components/dashboard/dashboard-layout"
import { formatVND, formatDate } from "@/lib/format"
import { Skeleton } from "@/components/ui/skeleton"
import useSWR from "swr"
import { apiClient } from "@/lib/api-client"
import { buildApiUrl } from "@/lib/api-url"
import { useDebounce } from "@/hooks/use-debounce"
import { useSSE } from "@/lib/sse"
import { toast } from "sonner"

const navItems = [
  { label: "Tổng quan", href: "/transport", icon: "LayoutDashboard" },
  { label: "Công việc", href: "/transport/jobs", icon: "Package" },
  { label: "Báo giá", href: "/transport/quotations", icon: "FileText" },
  { label: "Xe", href: "/transport/vehicles", icon: "Truck" },
  { label: "Giá cả", href: "/transport/pricing/categories", icon: "DollarSign" },
  { label: "Hồ sơ", href: "/transport/profile", icon: "Star" },
]

export default function TransportQuotationsPage() {
  const router = useRouter()
  const [searchQuery, setSearchQuery] = useState("")
  const [statusFilter, setStatusFilter] = useState<string>("all")
  const debouncedSearch = useDebounce(searchQuery, 300)

  const {
    data: quotations,
    isLoading,
    mutate,
  } = useSWR("/transport/quotations", () => apiClient.getTransportQuotations(), {
    refreshInterval: 30000,
  })

  useSSE(
    buildApiUrl("/transport/events"),
    useCallback(
      (evt: any) => {
        if (evt?.type === "BID_STATUS_CHANGED") {
          const { quotationId, status, bookingId } = evt.data

          mutate()

          if (status === "ACCEPTED") {
            toast.success(`Báo giá #${quotationId} đã được chấp nhận!`, {
              action: {
                label: "Xem chi tiết",
                onClick: () => router.push(`/transport/active/${bookingId}`),
              },
            })
          } else if (status === "REJECTED") {
            toast.error(`Báo giá #${quotationId} đã bị từ chối`, {
              action: {
                label: "Xem công việc khác",
                onClick: () => router.push("/transport/jobs"),
              },
            })
          }
        }
      },
      [mutate, router],
    ),
  )

  const filteredQuotations =
    quotations?.filter((q: any) => {
      const matchesSearch =
        debouncedSearch === "" ||
        q.booking_id?.toString().includes(debouncedSearch) ||
        q.quotation_id?.toString().includes(debouncedSearch)

      const matchesStatus = statusFilter === "all" || q.status === statusFilter

      return matchesSearch && matchesStatus
    }) || []

  const statusCounts = {
    all: quotations?.length || 0,
    PENDING: quotations?.filter((q: any) => q.status === "PENDING").length || 0,
    ACCEPTED: quotations?.filter((q: any) => q.status === "ACCEPTED").length || 0,
    REJECTED: quotations?.filter((q: any) => q.status === "REJECTED").length || 0,
  }

  const getStatusBadge = (status: string) => {
    const variants: Record<string, { variant: any; icon: any; label: string }> = {
      PENDING: { variant: "secondary", icon: "Clock", label: "Chờ duyệt" },
      ACCEPTED: { variant: "default", icon: "CheckCircle", label: "Đã chấp nhận" },
      REJECTED: { variant: "destructive", icon: "XCircle", label: "Đã từ chối" },
    }
    const config = variants[status] || variants.PENDING
    const Icon = config.icon
    return (
      <Badge variant={config.variant} className="gap-1">
        <Icon className="h-3 w-3" />
        {config.label}
      </Badge>
    )
  }

  return (
    <DashboardLayout navItems={navItems} title="Báo giá của tôi">
      <div className="max-w-7xl mx-auto px-6 py-10 space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold">Báo giá của tôi</h1>
            <p className="text-muted-foreground">Quản lý tất cả báo giá đã gửi</p>
          </div>
        </div>

        <Tabs value={statusFilter} onValueChange={setStatusFilter} className="space-y-6">
          <div className="flex items-center justify-between gap-4">
            <TabsList>
              <TabsTrigger value="all">Tất cả ({statusCounts.all})</TabsTrigger>
              <TabsTrigger value="PENDING">Chờ duyệt ({statusCounts.PENDING})</TabsTrigger>
              <TabsTrigger value="ACCEPTED">Đã chấp nhận ({statusCounts.ACCEPTED})</TabsTrigger>
              <TabsTrigger value="REJECTED">Đã từ chối ({statusCounts.REJECTED})</TabsTrigger>
            </TabsList>

            <div className="relative w-64">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Tìm theo mã booking..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9"
              />
            </div>
          </div>

          <TabsContent value={statusFilter} className="space-y-4">
            {isLoading ? (
              <div className="space-y-4">
                {[1, 2, 3].map((i) => (
                  <Card key={i}>
                    <CardContent className="p-6">
                      <Skeleton className="h-24 w-full" />
                    </CardContent>
                  </Card>
                ))}
              </div>
            ) : filteredQuotations.length === 0 ? (
              <Card>
                <CardContent className="flex flex-col items-center justify-center py-12">
                  <FileText className="h-12 w-12 text-muted-foreground mb-4" />
                  <h3 className="text-lg font-semibold mb-2">Chưa có báo giá</h3>
                  <p className="text-muted-foreground text-center mb-4">
                    {searchQuery ? "Không tìm thấy báo giá phù hợp" : "Bạn chưa gửi báo giá nào"}
                  </p>
                  {!searchQuery && (
                    <Button asChild>
                      <Link href="/transport/jobs">Xem công việc khả dụng</Link>
                    </Button>
                  )}
                </CardContent>
              </Card>
            ) : (
              <div className="space-y-4">
                {filteredQuotations.map((quotation: any) => (
                  <Card key={quotation.quotation_id} className="hover:shadow-md transition-shadow">
                    <CardContent className="p-6">
                      <div className="flex items-start justify-between gap-4">
                        <div className="flex-1 space-y-3">
                          <div className="flex items-center gap-3">
                            <h3 className="text-lg font-semibold">Booking #{quotation.booking_id}</h3>
                            {getStatusBadge(quotation.status)}
                          </div>

                          <div className="grid grid-cols-2 gap-4 text-sm">
                            <div>
                              <p className="text-muted-foreground">Giá báo</p>
                              <p className="font-semibold text-lg">{formatVND(quotation.total_price)}</p>
                            </div>
                            <div>
                              <p className="text-muted-foreground">Thời gian hoàn thành</p>
                              <p className="font-medium">{quotation.estimated_duration} giờ</p>
                            </div>
                            <div>
                              <p className="text-muted-foreground">Ngày gửi</p>
                              <p className="font-medium">{formatDate(quotation.created_at)}</p>
                            </div>
                            <div>
                              <p className="text-muted-foreground">Hết hạn</p>
                              <p className="font-medium">
                                {quotation.expires_at ? formatDate(quotation.expires_at) : "Không xác định"}
                              </p>
                            </div>
                          </div>

                          {quotation.notes && (
                            <div className="pt-2 border-t">
                              <p className="text-sm text-muted-foreground">Ghi chú: {quotation.notes}</p>
                            </div>
                          )}
                        </div>

                        <Button variant="outline" size="sm" asChild>
                          <Link href={`/transport/jobs/${quotation.booking_id}`}>
                            <Eye className="h-4 w-4 mr-2" />
                            Chi tiết
                          </Link>
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </TabsContent>
        </Tabs>
      </div>
    </DashboardLayout>
  )
}
