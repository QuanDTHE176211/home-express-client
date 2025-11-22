/**
 * Transport Dashboard Home Page
 *
 * Displays transport company statistics, revenue chart, and pending quotations
 */

"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { useAuth } from "@/contexts/auth-context"
import { apiClient } from "@/lib/api-client"
import { DashboardLayout } from "@/components/dashboard/dashboard-layout"
import { StatCard } from "@/components/dashboard/stat-card"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { LayoutDashboard, Truck, Package, Star, TrendingUp, DollarSign, Clock, FileText } from "lucide-react"
import { formatVND, formatDate } from "@/lib/format"
import type { Quotation, TransportStats } from "@/types"
import Link from "next/link"

const navItems = [
  { label: "Tổng quan", href: "/transport", icon: "LayoutDashboard" },
  { label: "Công việc", href: "/transport/jobs", icon: "Package" },
  { label: "Báo giá", href: "/transport/quotations", icon: "FileText" },
  { label: "Xe", href: "/transport/vehicles", icon: "Truck" },
  { label: "Giá cả", href: "/transport/pricing/categories", icon: "DollarSign" },
  { label: "Hồ sơ", href: "/transport/profile", icon: "Star" },
]

export default function TransportDashboard() {
  const { user, loading } = useAuth()
  const router = useRouter()
  const [stats, setStats] = useState<TransportStats | null>(null)
  const [quotations, setQuotations] = useState<Quotation[]>([])
  const [dataLoading, setDataLoading] = useState(true)

  useEffect(() => {
    if (!loading && (!user || user.role !== "TRANSPORT")) {
      router.push("/login")
    }
  }, [user, loading, router])

  useEffect(() => {
    const fetchData = async () => {
      if (!user || user.role !== "TRANSPORT") return

      try {
        setDataLoading(true)
        const [statsData, quotationsData] = await Promise.all([
          apiClient.getTransportStats(),
          apiClient.getTransportQuotations(),
        ])
        // Add default values for missing properties
        const fullStats: TransportStats = {
          ...statsData,
          total_income: 0,
          in_progress_bookings: 0,
          completion_rate: 0,
          pending_quotations: 0,
          monthly_revenue: [],
        }
        setStats(fullStats)
        setQuotations([])
      } catch (error) {
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
    <DashboardLayout navItems={navItems} title="Dashboard Vận chuyển">
      <div className="space-y-8">
        {/* Header */}
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Tổng quan</h1>
          <p className="text-muted-foreground mt-1">Theo dõi doanh thu và hiệu suất kinh doanh của bạn</p>
        </div>

        {/* Stats Cards - 5 cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
          <StatCard
            title="Tổng thu nhập"
            value={formatVND(stats.total_income)}
            icon={<DollarSign className="w-6 h-6" />}
            trend="+15%"
            variant="success"
          />
          <StatCard
            title="Đơn hoàn thành"
            value={stats.completed_bookings}
            icon={<Package className="w-6 h-6" />}
            variant="default"
          />
          <StatCard
            title="Đang vận chuyển"
            value={stats.in_progress_bookings}
            icon={<Truck className="w-6 h-6" />}
            variant="warning"
          />
          <StatCard
            title="Đánh giá"
            value={`${stats.average_rating}/5`}
            icon={<Star className="w-6 h-6" />}
            variant="success"
          />
          <StatCard
            title="Tỷ lệ hoàn thành"
            value={`${stats.completion_rate}%`}
            icon={<TrendingUp className="w-6 h-6" />}
            variant="success"
          />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Revenue Chart */}
          <Card className="lg:col-span-2">
            <CardHeader>
              <CardTitle>Doanh thu theo tháng</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {stats.monthly_revenue.map((item) => (
                  <div key={item.month} className="flex items-center gap-4">
                    <div className="w-12 text-sm font-medium text-muted-foreground">{item.month}</div>
                    <div className="flex-1">
                      <div className="h-8 bg-muted rounded-lg overflow-hidden">
                        <div
                          className="h-full bg-accent-green transition-all duration-300"
                          style={{
                            width: `${(item.revenue / Math.max(...stats.monthly_revenue.map((r) => r.revenue))) * 100}%`,
                          }}
                        />
                      </div>
                    </div>
                    <div className="w-32 text-sm font-semibold text-right">{formatVND(item.revenue)}</div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Quick Stats */}
          <Card>
            <CardHeader>
              <CardTitle>Thống kê nhanh</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="p-4 bg-muted/50 rounded-lg">
                <p className="text-sm text-muted-foreground mb-1">Báo giá chờ xử lý</p>
                <p className="text-2xl font-bold">{stats.pending_quotations}</p>
              </div>
              <div className="p-4 bg-muted/50 rounded-lg">
                <p className="text-sm text-muted-foreground mb-1">Tổng đơn hàng</p>
                <p className="text-2xl font-bold">{stats.completed_bookings + stats.in_progress_bookings}</p>
              </div>
              <div className="p-4 bg-muted/50 rounded-lg">
                <p className="text-sm text-muted-foreground mb-1">Doanh thu trung bình</p>
                <p className="text-2xl font-bold">
                  {formatVND(Math.round(stats.total_income / stats.completed_bookings))}
                </p>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Pending Quotations */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle>Yêu cầu báo giá mới ({quotations.length})</CardTitle>
              <Button variant="ghost" size="sm" asChild>
                <Link href="/transport/quotations">Xem tất cả</Link>
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {quotations.map((quotation) => (
                <Card key={quotation.quotation_id} className="border-2">
                  <CardContent className="p-4">
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex-1 space-y-2">
                        <div className="flex items-center gap-2">
                          <span className="font-mono text-sm text-muted-foreground">#{quotation.booking_id}</span>
                          <Badge variant="secondary">Chờ báo giá</Badge>
                        </div>
                        <p className="font-semibold">{quotation.customer_name}</p>
                        <div className="text-sm text-muted-foreground space-y-1">
                          <p>
                            <span className="font-medium">Từ:</span> {quotation.pickup_address}
                          </p>
                          <p>
                            <span className="font-medium">Đến:</span> {quotation.delivery_address}
                          </p>
                          <p className="flex items-center gap-1">
                            <Clock className="h-3 w-3" />
                            {formatDate(quotation.pickup_date)}
                          </p>
                        </div>
                      </div>
                      <div className="text-right space-y-2">
                        <p className="text-sm text-muted-foreground">Giá đề xuất</p>
                        <p className="text-xl font-bold text-accent-green">{formatVND(quotation.estimated_price)}</p>
                        <Button size="sm" className="bg-accent-green hover:bg-accent-green-dark">
                          Gửi báo giá
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  )
}

