/**
 * Customer Dashboard Home Page
 *
 * Displays customer statistics and recent bookings.
 */

"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { Truck, Clock, CheckCircle, DollarSign, Plus, Package } from "lucide-react"
import type { ColumnDef } from "@tanstack/react-table"

import { useAuth } from "@/contexts/auth-context"
import { apiClient } from "@/lib/api-client"
import { navItems } from "@/lib/customer-nav-config"
import { DashboardLayout } from "@/components/dashboard/dashboard-layout"
import { StatCard } from "@/components/dashboard/stat-card"
import { DataTable } from "@/components/dashboard/data-table"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { formatVND, formatDate } from "@/lib/format"
import type { Booking, CustomerStats } from "@/types"

const bookingColumns: ColumnDef<Booking>[] = [
  {
    accessorKey: "booking_id",
    header: "Mã đơn",
    cell: ({ row }) => <span className="font-mono">#{row.original.booking_id}</span>,
  },
  {
    accessorKey: "pickup_address",
    header: "Điểm đón",
    cell: ({ row }) => (
      <div className="max-w-[200px] truncate" title={row.original.pickup_address}>
        {row.original.pickup_address}
      </div>
    ),
  },
  {
    accessorKey: "delivery_address",
    header: "Điểm đến",
    cell: ({ row }) => (
      <div className="max-w-[200px] truncate" title={row.original.delivery_address}>
        {row.original.delivery_address}
      </div>
    ),
  },
  {
    accessorKey: "status",
    header: "Trạng thái",
    cell: ({ row }) => {
      const statusMap: Record<
        Booking["status"],
        { label: string; variant: "default" | "secondary" | "destructive" }
      > = {
        PENDING: { label: "Chờ xử lý", variant: "secondary" },
        QUOTED: { label: "Đã báo giá", variant: "default" },
        CONFIRMED: { label: "Đã xác nhận", variant: "default" },
        IN_PROGRESS: { label: "Đang vận chuyển", variant: "default" },
        COMPLETED: { label: "Hoàn thành", variant: "default" },
        REVIEWED: { label: "Đã đánh giá", variant: "default" },
        CANCELLED: { label: "Đã hủy", variant: "destructive" },
      }

      const status = statusMap[row.original.status]

      return (
        <Badge
          variant={status.variant}
          className={
            row.original.status === "COMPLETED" ? "bg-accent-green/10 text-accent-green border-accent-green" : ""
          }
        >
          {status.label}
        </Badge>
      )
    },
  },
  {
    accessorKey: "final_price",
    header: "Giá",
    cell: ({ row }) => {
      const price = row.original.final_price || row.original.estimated_price
      return price ? formatVND(price) : <span className="text-muted-foreground">Chưa có</span>
    },
  },
  {
    accessorKey: "created_at",
    header: "Ngày tạo",
    cell: ({ row }) => formatDate(row.original.created_at),
  },
]

export default function CustomerDashboard() {
  const { user, loading } = useAuth()
  const router = useRouter()
  const [stats, setStats] = useState<CustomerStats | null>(null)
  const [bookings, setBookings] = useState<Booking[]>([])
  const [dataLoading, setDataLoading] = useState(true)

  useEffect(() => {
    if (!loading && (!user || user.role !== "CUSTOMER")) {
      router.push("/login")
    }
  }, [user, loading, router])

  useEffect(() => {
    const fetchData = async () => {
      if (!user || user.role !== "CUSTOMER") return

      try {
        setDataLoading(true)
        const [statsData, bookingsData] = await Promise.all([
          apiClient.getCustomerStats(),
          apiClient.getCustomerBookings(),
        ])
        setStats(statsData)
        setBookings(bookingsData as unknown as Booking[])
      } catch (error) {
        // Intentionally swallow errors here; UI shows empty state with fallback copy.
        console.error("Failed to load customer dashboard data", error)
      } finally {
        setDataLoading(false)
      }
    }

    fetchData()
  }, [user])

  if (loading || dataLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-accent-green" />
      </div>
    )
  }

  if (!user || !stats) return null

  return (
    <DashboardLayout navItems={navItems} title="Dashboard Khách hàng">
      <div className="max-w-7xl mx-auto px-6 py-10 space-y-8">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Tổng quan</h1>
            <p className="text-muted-foreground mt-1">
              Chào mừng trở lại! Đây là tổng quan về các chuyến đi của bạn.
            </p>
          </div>
          {bookings.length > 0 && (
            <Button asChild size="lg" className="bg-accent-green hover:bg-accent-green-dark">
              <Link href="/customer/bookings/create">
                <Plus className="mr-2 h-4 w-4" />
                Đặt chuyến mới
              </Link>
            </Button>
          )}
        </div>

        {/* Quick Actions Section when no bookings */}
        {bookings.length === 0 && !dataLoading && (
          <Card className="border-dashed border-2">
            <CardContent className="flex flex-col items-center justify-center py-12 text-center">
              <div className="rounded-full bg-accent-green/10 p-6 mb-4">
                <Package className="h-12 w-12 text-accent-green" />
              </div>
              <h3 className="text-xl font-semibold mb-2">Bắt đầu chuyến đi đầu tiên</h3>
              <p className="text-muted-foreground mb-6 max-w-md">
                Tại đây bạn có thể đặt lệnh, AI sẽ tự động nhận diện và báo giá. Sau đó bạn chọn nhà xe phù hợp.
              </p>
              <div className="flex gap-3">
                <Button asChild size="lg" className="bg-accent-green hover:bg-accent-green-dark">
                  <Link href="/customer/bookings/create">
                    <Plus className="mr-2 h-4 w-4" />
                    Tạo đơn mới
                  </Link>
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Stats Cards */}
        {bookings.length > 0 && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <StatCard title="Tổng chuyến đi" value={stats.total_bookings} icon={<Truck className="w-6 h-6" />} trend="+12%" />
            <StatCard title="Đang xử lý" value={stats.pending_bookings} icon={<Clock className="w-6 h-6" />} variant="warning" />
            <StatCard title="Hoàn thành" value={stats.completed_bookings} icon={<CheckCircle className="w-6 h-6" />} variant="success" />
            <StatCard
              title="Tổng chi tiêu"
              value={formatVND(stats.total_spent)}
              icon={<DollarSign className="w-6 h-6" />}
            />
          </div>
        )}

        {/* Recent Bookings */}
        {bookings.length > 0 && (
          <Card className="transition-shadow hover:shadow-md">
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle>Chuyến đi gần đây</CardTitle>
                <Button variant="ghost" size="sm" asChild>
                  <Link href="/customer/bookings">Xem tất cả</Link>
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <DataTable columns={bookingColumns} data={bookings} />
            </CardContent>
          </Card>
        )}
      </div>
    </DashboardLayout>
  )
}

