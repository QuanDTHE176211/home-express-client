"use client"

import { useState } from "react"
import Link from "next/link"
import useSWR from "swr"
import { DashboardLayout } from "@/components/dashboard/dashboard-layout"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"
import {
  Truck,
  Package,
  FileBarChart,
  FileText,
  Settings,
  DollarSign,
  BarChart3,
  Star,
  Search,
  MapPin,
  ArrowRight,
  Clock,
} from "lucide-react"
import { apiClient } from "@/lib/api-client"
import { formatVND, formatDate } from "@/lib/format"
import { EmptyState } from "@/components/empty-state"

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

export default function ActiveJobsPage() {
  const [searchQuery, setSearchQuery] = useState("")
  const [statusFilter, setStatusFilter] = useState<string>("all")

  const { data: jobs, isLoading } = useSWR("/transport/active-jobs", () => apiClient.getTransportActiveJobs())

  const filteredJobs = jobs?.filter((job: any) => {
    const matchesSearch =
      job.booking_id.toString().includes(searchQuery) ||
      job.pickup_address?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      job.delivery_address?.toLowerCase().includes(searchQuery.toLowerCase())
    const matchesStatus = statusFilter === "all" || job.status === statusFilter
    return matchesSearch && matchesStatus
  })

  const getStatusBadge = (status: string) => {
    const variants: Record<string, { variant: any; label: string }> = {
      CONFIRMED: { variant: "default", label: "Đã xác nhận" },
      DRIVER_ON_THE_WAY: { variant: "secondary", label: "Đang đến" },
      LOADING: { variant: "secondary", label: "Đang bốc hàng" },
      IN_TRANSIT: { variant: "default", label: "Đang vận chuyển" },
      UNLOADING: { variant: "secondary", label: "Đang dỡ hàng" },
      COMPLETED: { variant: "success", label: "Hoàn thành" },
    }
    const config = variants[status] || variants.CONFIRMED
    return <Badge variant={config.variant}>{config.label}</Badge>
  }

  return (
    <DashboardLayout navItems={navItems} title="Công việc đang thực hiện">
      <div className="space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Công việc đang thực hiện</h1>
          <p className="text-muted-foreground mt-2">Quản lý và cập nhật trạng thái các chuyến hàng đang vận chuyển</p>
        </div>

        {/* Search & Filter */}
        <Card>
          <CardContent className="pt-6">
            <div className="flex flex-col sm:flex-row gap-4">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Tìm theo mã booking, địa chỉ..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-9"
                />
              </div>
              <Tabs value={statusFilter} onValueChange={setStatusFilter} className="w-full sm:w-auto">
                <TabsList>
                  <TabsTrigger value="all">Tất cả</TabsTrigger>
                  <TabsTrigger value="DRIVER_ON_THE_WAY">Đang đến</TabsTrigger>
                  <TabsTrigger value="IN_TRANSIT">Đang chuyển</TabsTrigger>
                  <TabsTrigger value="UNLOADING">Đang dỡ</TabsTrigger>
                </TabsList>
              </Tabs>
            </div>
          </CardContent>
        </Card>

        {/* Jobs List */}
        {isLoading ? (
          <div className="grid gap-4">
            {[1, 2, 3].map((i) => (
              <Card key={i} className="animate-pulse">
                <CardContent className="p-6">
                  <div className="h-24 bg-muted rounded" />
                </CardContent>
              </Card>
            ))}
          </div>
        ) : filteredJobs && filteredJobs.length > 0 ? (
          <div className="grid gap-4">
            {filteredJobs.map((job: any) => (
              <Card key={job.booking_id} className="hover:shadow-md transition-shadow">
                <CardContent className="p-6">
                  <div className="flex items-start justify-between mb-4">
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <h3 className="font-semibold text-lg">Booking #{job.booking_id}</h3>
                        {getStatusBadge(job.status)}
                      </div>
                      <p className="text-sm text-muted-foreground">Ngày đón: {formatDate(job.preferred_date)}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-2xl font-bold text-accent-green">{formatVND(job.final_price)}</p>
                      {job.distance_km && <p className="text-sm text-muted-foreground">{job.distance_km} km</p>}
                    </div>
                  </div>

                  {/* Route */}
                  <div className="space-y-2 mb-4">
                    <div className="flex items-start gap-2">
                      <MapPin className="h-4 w-4 text-success mt-0.5" />
                      <div className="flex-1">
                        <p className="text-sm font-medium">Đón hàng</p>
                        <p className="text-sm text-muted-foreground">{job.pickup_address}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 pl-6">
                      <ArrowRight className="h-4 w-4 text-muted-foreground" />
                    </div>
                    <div className="flex items-start gap-2">
                      <MapPin className="h-4 w-4 text-destructive mt-0.5" />
                      <div className="flex-1">
                        <p className="text-sm font-medium">Giao hàng</p>
                        <p className="text-sm text-muted-foreground">{job.delivery_address}</p>
                      </div>
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex gap-2">
                    <Button asChild className="flex-1 bg-accent-green hover:bg-accent-green-dark">
                      <Link href={`/transport/active/${job.booking_id}`}>
                        <Clock className="mr-2 h-4 w-4" />
                        Cập nhật trạng thái
                      </Link>
                    </Button>
                    <Button variant="outline" asChild>
                      <Link href={`/transport/jobs/${job.booking_id}`}>Chi tiết</Link>
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        ) : (
          <EmptyState
            title="Chưa có công việc nào"
            description="Các công việc đã được chấp nhận sẽ hiển thị ở đây"
            action={
              <Button asChild>
                <Link href="/transport/jobs">Xem công việc mới</Link>
              </Button>
            }
          />
        )}
      </div>
    </DashboardLayout>
  )
}

