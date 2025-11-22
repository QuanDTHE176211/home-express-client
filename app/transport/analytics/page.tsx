"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { useAuth } from "@/contexts/auth-context"
import { apiClient } from "@/lib/api-client"
import { DashboardLayout } from "@/components/dashboard/dashboard-layout"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
import {
  LayoutDashboard,
  Truck,
  Package,
  Star,
  DollarSign,
  FileText,
  TrendingUp,
  TrendingDown,
  Clock,
  CheckCircle,
  Target,
  Award,
  Download,
} from "lucide-react"
import { formatVND } from "@/lib/format"
import {
  Line,
  LineChart,
  Bar,
  BarChart,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts"

const navItems = [
  { label: "Tổng quan", href: "/transport", icon: "LayoutDashboard" },
  { label: "Công việc", href: "/transport/jobs", icon: "Package" },
  { label: "Báo giá", href: "/transport/quotations", icon: "FileText" },
  { label: "Xe", href: "/transport/vehicles", icon: "Truck" },
  { label: "Thu nhập", href: "/transport/earnings", icon: "DollarSign" },
  { label: "Phân tích", href: "/transport/analytics", icon: "TrendingUp" },
  { label: "Hồ sơ", href: "/transport/profile", icon: "Star" },
]

interface PerformanceMetrics {
  acceptance_rate: number
  acceptance_rate_change: number
  avg_response_time_minutes: number
  response_time_change: number
  customer_satisfaction: number
  satisfaction_change: number
  on_time_delivery_rate: number
  on_time_change: number
  completion_rate: number
  completion_change: number
  revenue_per_job: number
  revenue_change: number
  total_jobs: number
  jobs_change: number
  active_vehicles: number
}

interface PerformanceTrend {
  date: string
  jobs_completed: number
  acceptance_rate: number
  avg_response_time: number
  revenue: number
  satisfaction_score: number
}

interface CategoryPerformance {
  category: string
  jobs: number
  revenue: number
  avg_rating: number
}

interface VehicleUtilization {
  vehicle_name: string
  utilization_rate: number
  jobs_completed: number
  revenue: number
}

const COLORS = ["#10b981", "#3b82f6", "#f59e0b", "#ef4444", "#8b5cf6", "#ec4899"]

export default function AnalyticsPage() {
  const { user, loading } = useAuth()
  const router = useRouter()
  const [metrics, setMetrics] = useState<PerformanceMetrics | null>(null)
  const [trends, setTrends] = useState<PerformanceTrend[]>([])
  const [categoryPerformance, setCategoryPerformance] = useState<CategoryPerformance[]>([])
  const [vehicleUtilization, setVehicleUtilization] = useState<VehicleUtilization[]>([])
  const [dateRange, setDateRange] = useState("30")
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
        const [metricsData, trendsData, categoryData, vehicleData] = await Promise.all([
          apiClient.getPerformanceMetrics(Number.parseInt(dateRange)),
          apiClient.getPerformanceTrends(Number.parseInt(dateRange)),
          apiClient.getCategoryPerformance(Number.parseInt(dateRange)),
          apiClient.getVehicleUtilization(Number.parseInt(dateRange)),
        ])
        setMetrics(metricsData)
        setTrends(trendsData)
        setCategoryPerformance(categoryData)
        setVehicleUtilization(vehicleData)
      } catch (error) {
        console.error("Error fetching analytics:", error)
      } finally {
        setDataLoading(false)
      }
    }

    fetchData()
  }, [user, dateRange])

  const handleExport = () => {
    // Export analytics data to CSV
    console.log("Exporting analytics data...")
  }

  if (loading || dataLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-accent-green" />
      </div>
    )
  }

  if (!user || !metrics) return null

  return (
    <DashboardLayout navItems={navItems} title="Phân tích hiệu suất">
      <div className="space-y-8">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Phân tích hiệu suất</h1>
            <p className="text-muted-foreground mt-1">Theo dõi KPIs và xu hướng kinh doanh</p>
          </div>
          <div className="flex items-center gap-4">
            <Select value={dateRange} onValueChange={setDateRange}>
              <SelectTrigger className="w-[180px]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="7">7 ngày qua</SelectItem>
                <SelectItem value="30">30 ngày qua</SelectItem>
                <SelectItem value="90">90 ngày qua</SelectItem>
                <SelectItem value="365">1 năm qua</SelectItem>
              </SelectContent>
            </Select>
            <Button onClick={handleExport} variant="outline" className="gap-2 bg-transparent">
              <Download className="h-4 w-4" />
              Xuất báo cáo
            </Button>
          </div>
        </div>

        {/* KPI Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <Card className="hover:shadow-md transition-shadow">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground mb-1">Tỷ lệ chấp nhận</p>
                  <p className="text-2xl font-bold">{metrics.acceptance_rate}%</p>
                  <div className="flex items-center gap-1 mt-2">
                    {metrics.acceptance_rate_change >= 0 ? (
                      <TrendingUp className="h-4 w-4 text-accent-green" />
                    ) : (
                      <TrendingDown className="h-4 w-4 text-red-500" />
                    )}
                    <span
                      className={`text-sm ${metrics.acceptance_rate_change >= 0 ? "text-accent-green" : "text-red-500"}`}
                    >
                      {metrics.acceptance_rate_change >= 0 ? "+" : ""}
                      {metrics.acceptance_rate_change}%
                    </span>
                  </div>
                </div>
                <div className="p-3 bg-accent-green/10 rounded-full">
                  <CheckCircle className="h-6 w-6 text-accent-green" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="hover:shadow-md transition-shadow">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground mb-1">Thời gian phản hồi TB</p>
                  <p className="text-2xl font-bold">{metrics.avg_response_time_minutes} phút</p>
                  <div className="flex items-center gap-1 mt-2">
                    {metrics.response_time_change <= 0 ? (
                      <TrendingUp className="h-4 w-4 text-accent-green" />
                    ) : (
                      <TrendingDown className="h-4 w-4 text-red-500" />
                    )}
                    <span
                      className={`text-sm ${metrics.response_time_change <= 0 ? "text-accent-green" : "text-red-500"}`}
                    >
                      {metrics.response_time_change <= 0 ? "" : "+"}
                      {metrics.response_time_change} phút
                    </span>
                  </div>
                </div>
                <div className="p-3 bg-blue-500/10 rounded-full">
                  <Clock className="h-6 w-6 text-blue-500" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="hover:shadow-md transition-shadow">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground mb-1">Hài lòng khách hàng</p>
                  <p className="text-2xl font-bold">{metrics.customer_satisfaction}/5.0</p>
                  <div className="flex items-center gap-1 mt-2">
                    {metrics.satisfaction_change >= 0 ? (
                      <TrendingUp className="h-4 w-4 text-accent-green" />
                    ) : (
                      <TrendingDown className="h-4 w-4 text-red-500" />
                    )}
                    <span
                      className={`text-sm ${metrics.satisfaction_change >= 0 ? "text-accent-green" : "text-red-500"}`}
                    >
                      {metrics.satisfaction_change >= 0 ? "+" : ""}
                      {metrics.satisfaction_change}
                    </span>
                  </div>
                </div>
                <div className="p-3 bg-amber-500/10 rounded-full">
                  <Star className="h-6 w-6 text-amber-500" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="hover:shadow-md transition-shadow">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground mb-1">Giao hàng đúng hạn</p>
                  <p className="text-2xl font-bold">{metrics.on_time_delivery_rate}%</p>
                  <div className="flex items-center gap-1 mt-2">
                    {metrics.on_time_change >= 0 ? (
                      <TrendingUp className="h-4 w-4 text-accent-green" />
                    ) : (
                      <TrendingDown className="h-4 w-4 text-red-500" />
                    )}
                    <span className={`text-sm ${metrics.on_time_change >= 0 ? "text-accent-green" : "text-red-500"}`}>
                      {metrics.on_time_change >= 0 ? "+" : ""}
                      {metrics.on_time_change}%
                    </span>
                  </div>
                </div>
                <div className="p-3 bg-purple-500/10 rounded-full">
                  <Target className="h-6 w-6 text-purple-500" />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Additional KPIs */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card className="hover:shadow-md transition-shadow">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground mb-1">Tỷ lệ hoàn thành</p>
                  <p className="text-2xl font-bold">{metrics.completion_rate}%</p>
                  <div className="flex items-center gap-1 mt-2">
                    {metrics.completion_change >= 0 ? (
                      <TrendingUp className="h-4 w-4 text-accent-green" />
                    ) : (
                      <TrendingDown className="h-4 w-4 text-red-500" />
                    )}
                    <span
                      className={`text-sm ${metrics.completion_change >= 0 ? "text-accent-green" : "text-red-500"}`}
                    >
                      {metrics.completion_change >= 0 ? "+" : ""}
                      {metrics.completion_change}%
                    </span>
                  </div>
                </div>
                <Award className="h-8 w-8 text-muted-foreground" />
              </div>
            </CardContent>
          </Card>

          <Card className="hover:shadow-md transition-shadow">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground mb-1">Doanh thu TB/đơn</p>
                  <p className="text-2xl font-bold">{formatVND(metrics.revenue_per_job)}</p>
                  <div className="flex items-center gap-1 mt-2">
                    {metrics.revenue_change >= 0 ? (
                      <TrendingUp className="h-4 w-4 text-accent-green" />
                    ) : (
                      <TrendingDown className="h-4 w-4 text-red-500" />
                    )}
                    <span className={`text-sm ${metrics.revenue_change >= 0 ? "text-accent-green" : "text-red-500"}`}>
                      {metrics.revenue_change >= 0 ? "+" : ""}
                      {metrics.revenue_change}%
                    </span>
                  </div>
                </div>
                <DollarSign className="h-8 w-8 text-muted-foreground" />
              </div>
            </CardContent>
          </Card>

          <Card className="hover:shadow-md transition-shadow">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground mb-1">Tổng công việc</p>
                  <p className="text-2xl font-bold">{metrics.total_jobs}</p>
                  <div className="flex items-center gap-1 mt-2">
                    {metrics.jobs_change >= 0 ? (
                      <TrendingUp className="h-4 w-4 text-accent-green" />
                    ) : (
                      <TrendingDown className="h-4 w-4 text-red-500" />
                    )}
                    <span className={`text-sm ${metrics.jobs_change >= 0 ? "text-accent-green" : "text-red-500"}`}>
                      {metrics.jobs_change >= 0 ? "+" : ""}
                      {metrics.jobs_change} đơn
                    </span>
                  </div>
                </div>
                <Package className="h-8 w-8 text-muted-foreground" />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Performance Trends */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Card className="hover:shadow-md transition-shadow">
            <CardHeader>
              <CardTitle>Xu hướng công việc hoàn thành</CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <LineChart data={trends}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="date" />
                  <YAxis />
                  <Tooltip />
                  <Legend />
                  <Line type="monotone" dataKey="jobs_completed" stroke="#10b981" name="Công việc" strokeWidth={2} />
                </LineChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          <Card className="hover:shadow-md transition-shadow">
            <CardHeader>
              <CardTitle>Tỷ lệ chấp nhận theo thời gian</CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <LineChart data={trends}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="date" />
                  <YAxis />
                  <Tooltip />
                  <Legend />
                  <Line type="monotone" dataKey="acceptance_rate" stroke="#3b82f6" name="Tỷ lệ (%)" strokeWidth={2} />
                </LineChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          <Card className="hover:shadow-md transition-shadow">
            <CardHeader>
              <CardTitle>Thời gian phản hồi trung bình</CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={trends}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="date" />
                  <YAxis />
                  <Tooltip />
                  <Legend />
                  <Bar dataKey="avg_response_time" fill="#f59e0b" name="Phút" />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          <Card className="hover:shadow-md transition-shadow">
            <CardHeader>
              <CardTitle>Điểm hài lòng khách hàng</CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <LineChart data={trends}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="date" />
                  <YAxis domain={[0, 5]} />
                  <Tooltip />
                  <Legend />
                  <Line type="monotone" dataKey="satisfaction_score" stroke="#8b5cf6" name="Điểm" strokeWidth={2} />
                </LineChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </div>

        {/* Category & Vehicle Performance */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Card className="hover:shadow-md transition-shadow">
            <CardHeader>
              <CardTitle>Hiệu suất theo danh mục</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {categoryPerformance.map((cat, index) => (
                  <div key={cat.category} className="space-y-2">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <div
                          className="w-3 h-3 rounded-full"
                          style={{ backgroundColor: COLORS[index % COLORS.length] }}
                        />
                        <span className="font-medium">{cat.category}</span>
                      </div>
                      <div className="flex items-center gap-4">
                        <span className="text-sm text-muted-foreground">{cat.jobs} đơn</span>
                        <span className="font-semibold">{formatVND(cat.revenue)}</span>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="flex-1 h-2 bg-muted rounded-full overflow-hidden">
                        <div
                          className="h-full transition-all duration-300"
                          style={{
                            width: `${(cat.revenue / Math.max(...categoryPerformance.map((c) => c.revenue))) * 100}%`,
                            backgroundColor: COLORS[index % COLORS.length],
                          }}
                        />
                      </div>
                      <div className="flex items-center gap-1">
                        <Star className="h-3 w-3 text-amber-500 fill-amber-500" />
                        <span className="text-sm">{cat.avg_rating}</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          <Card className="hover:shadow-md transition-shadow">
            <CardHeader>
              <CardTitle>Tỷ lệ sử dụng xe</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {vehicleUtilization.map((vehicle) => (
                  <div key={vehicle.vehicle_name} className="space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="font-medium">{vehicle.vehicle_name}</span>
                      <div className="flex items-center gap-4">
                        <span className="text-sm text-muted-foreground">{vehicle.jobs_completed} đơn</span>
                        <Badge
                          variant={vehicle.utilization_rate >= 70 ? "default" : "secondary"}
                          className="bg-accent-green"
                        >
                          {vehicle.utilization_rate}%
                        </Badge>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="flex-1 h-2 bg-muted rounded-full overflow-hidden">
                        <div
                          className="h-full bg-accent-green transition-all duration-300"
                          style={{ width: `${vehicle.utilization_rate}%` }}
                        />
                      </div>
                      <span className="text-sm font-semibold">{formatVND(vehicle.revenue)}</span>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Goals & Benchmarks */}
        <Card className="hover:shadow-md transition-shadow">
          <CardHeader>
            <CardTitle>Mục tiêu & So sánh ngành</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">Tỷ lệ chấp nhận</span>
                  <span className="text-sm font-medium">Mục tiêu: 75%</span>
                </div>
                <div className="h-2 bg-muted rounded-full overflow-hidden">
                  <div
                    className="h-full bg-accent-green"
                    style={{ width: `${(metrics.acceptance_rate / 75) * 100}%` }}
                  />
                </div>
                <div className="flex items-center justify-between text-xs">
                  <span>Hiện tại: {metrics.acceptance_rate}%</span>
                  <span className="text-muted-foreground">Trung bình ngành: 70%</span>
                </div>
              </div>

              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">Hài lòng khách hàng</span>
                  <span className="text-sm font-medium">Mục tiêu: 4.5/5</span>
                </div>
                <div className="h-2 bg-muted rounded-full overflow-hidden">
                  <div
                    className="h-full bg-accent-green"
                    style={{ width: `${(metrics.customer_satisfaction / 4.5) * 100}%` }}
                  />
                </div>
                <div className="flex items-center justify-between text-xs">
                  <span>Hiện tại: {metrics.customer_satisfaction}/5</span>
                  <span className="text-muted-foreground">Trung bình ngành: 4.2/5</span>
                </div>
              </div>

              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">Giao hàng đúng hạn</span>
                  <span className="text-sm font-medium">Mục tiêu: 95%</span>
                </div>
                <div className="h-2 bg-muted rounded-full overflow-hidden">
                  <div
                    className="h-full bg-accent-green"
                    style={{ width: `${(metrics.on_time_delivery_rate / 95) * 100}%` }}
                  />
                </div>
                <div className="flex items-center justify-between text-xs">
                  <span>Hiện tại: {metrics.on_time_delivery_rate}%</span>
                  <span className="text-muted-foreground">Trung bình ngành: 90%</span>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  )
}

