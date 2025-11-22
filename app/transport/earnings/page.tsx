"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { useAuth } from "@/contexts/auth-context"
import { apiClient } from "@/lib/api-client"
import { DashboardLayout } from "@/components/dashboard/dashboard-layout"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import {
  LayoutDashboard,
  Truck,
  Package,
  Star,
  DollarSign,
  FileText,
  Download,
  Search,
  TrendingUp,
  Calendar,
  CreditCard,
  Clock,
  CheckCircle2,
  XCircle,
  AlertCircle,
} from "lucide-react"
import { formatVND, formatDate } from "@/lib/format"
import type { Transaction, EarningsStats } from "@/types"

const navItems = [
  { label: "Tổng quan", href: "/transport", icon: "LayoutDashboard" },
  { label: "Công việc", href: "/transport/jobs", icon: "Package" },
  { label: "Báo giá", href: "/transport/quotations", icon: "FileText" },
  { label: "Xe", href: "/transport/vehicles", icon: "Truck" },
  { label: "Thu nhập", href: "/transport/earnings", icon: "DollarSign" },
  { label: "Giá cả", href: "/transport/pricing/categories", icon: "DollarSign" },
  { label: "Hồ sơ", href: "/transport/profile", icon: "Star" },
]

export default function TransportEarningsPage() {
  const { user, loading } = useAuth()
  const router = useRouter()
  const [stats, setStats] = useState<EarningsStats | null>(null)
  const [transactions, setTransactions] = useState<Transaction[]>([])
  const [filteredTransactions, setFilteredTransactions] = useState<Transaction[]>([])
  const [dataLoading, setDataLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState("")
  const [statusFilter, setStatusFilter] = useState<string>("all")
  const [periodFilter, setPeriodFilter] = useState<string>("all")
  const [sortBy, setSortBy] = useState<string>("date-desc")

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
        const [statsData, transactionsData] = await Promise.all([
          apiClient.getEarningsStats(),
          apiClient.getTransactions(),
        ])
        setStats(statsData)
        setTransactions(transactionsData)
        setFilteredTransactions(transactionsData)
      } catch (error) {
        console.error("Error fetching earnings data:", error)
      } finally {
        setDataLoading(false)
      }
    }

    fetchData()
  }, [user])

  // Filter and sort transactions
  useEffect(() => {
    let filtered = [...transactions]

    // Search filter
    if (searchTerm) {
      filtered = filtered.filter(
        (t) =>
          t.booking_id.toString().includes(searchTerm) ||
          t.customer_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
          t.transaction_id.toLowerCase().includes(searchTerm.toLowerCase()),
      )
    }

    // Status filter
    if (statusFilter !== "all") {
      filtered = filtered.filter((t) => t.status === statusFilter)
    }

    // Period filter
    if (periodFilter !== "all") {
      const now = new Date()
      const transactionDate = new Date(filtered[0]?.created_at || now)

      switch (periodFilter) {
        case "today":
          filtered = filtered.filter((t) => {
            const date = new Date(t.created_at)
            return date.toDateString() === now.toDateString()
          })
          break
        case "week":
          const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000)
          filtered = filtered.filter((t) => new Date(t.created_at) >= weekAgo)
          break
        case "month":
          const monthAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000)
          filtered = filtered.filter((t) => new Date(t.created_at) >= monthAgo)
          break
        case "quarter":
          const quarterAgo = new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000)
          filtered = filtered.filter((t) => new Date(t.created_at) >= quarterAgo)
          break
      }
    }

    // Sort
    switch (sortBy) {
      case "date-desc":
        filtered.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
        break
      case "date-asc":
        filtered.sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime())
        break
      case "amount-desc":
        filtered.sort((a, b) => b.amount - a.amount)
        break
      case "amount-asc":
        filtered.sort((a, b) => a.amount - b.amount)
        break
    }

    setFilteredTransactions(filtered)
  }, [transactions, searchTerm, statusFilter, periodFilter, sortBy])

  const handleExportCSV = () => {
    const headers = ["Mã GD", "Mã đơn", "Khách hàng", "Số tiền", "Trạng thái", "Ngày tạo"]
    const rows = filteredTransactions.map((t) => [
      t.transaction_id,
      `#${t.booking_id}`,
      t.customer_name,
      t.amount,
      t.status,
      formatDate(t.created_at, true),
    ])

    const csvContent = [headers, ...rows].map((row) => row.join(",")).join("\n")
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" })
    const link = document.createElement("a")
    link.href = URL.createObjectURL(blob)
    link.download = `earnings_${new Date().toISOString().split("T")[0]}.csv`
    link.click()
  }

  if (loading || dataLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-accent-green" />
      </div>
    )
  }

  if (!user || !stats) return null

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "COMPLETED":
        return (
          <Badge variant="default" className="bg-accent-green">
            <CheckCircle2 className="w-3 h-3 mr-1" />
            Hoàn thành
          </Badge>
        )
      case "PENDING":
        return (
          <Badge variant="secondary">
            <Clock className="w-3 h-3 mr-1" />
            Chờ xử lý
          </Badge>
        )
      case "FAILED":
        return (
          <Badge variant="destructive">
            <XCircle className="w-3 h-3 mr-1" />
            Thất bại
          </Badge>
        )
      default:
        return <Badge variant="outline">{status}</Badge>
    }
  }

  return (
    <DashboardLayout navItems={navItems} title="Thu nhập">
      <div className="max-w-7xl mx-auto space-y-8 py-10">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Thu nhập & Giao dịch</h1>
            <p className="text-muted-foreground mt-1">Theo dõi chi tiết thu nhập và lịch sử giao dịch</p>
          </div>
          <Button onClick={handleExportCSV} variant="outline" className="gap-2 bg-transparent">
            <Download className="w-4 h-4" />
            Xuất CSV
          </Button>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <Card className="hover:shadow-md transition-shadow">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Tổng thu nhập</CardTitle>
              <DollarSign className="w-5 h-5 text-accent-green" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{formatVND(stats.total_earnings)}</div>
              <div className="flex items-center gap-1 text-sm text-accent-green mt-1">
                <TrendingUp className="w-3 h-3" />
                <span>+{stats.growth_rate}% so với tháng trước</span>
              </div>
            </CardContent>
          </Card>

          <Card className="hover:shadow-md transition-shadow">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Thu nhập tháng này</CardTitle>
              <Calendar className="w-5 h-5 text-blue-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{formatVND(stats.this_month_earnings)}</div>
              <p className="text-sm text-muted-foreground mt-1">{stats.this_month_bookings} đơn hoàn thành</p>
            </CardContent>
          </Card>

          <Card className="hover:shadow-md transition-shadow">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Chờ thanh toán</CardTitle>
              <Clock className="w-5 h-5 text-amber-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{formatVND(stats.pending_amount)}</div>
              <p className="text-sm text-muted-foreground mt-1">{stats.pending_transactions} giao dịch</p>
            </CardContent>
          </Card>

          <Card className="hover:shadow-md transition-shadow">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Thu nhập TB/đơn</CardTitle>
              <TrendingUp className="w-5 h-5 text-purple-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{formatVND(stats.average_per_booking)}</div>
              <p className="text-sm text-muted-foreground mt-1">Từ {stats.total_bookings} đơn hàng</p>
            </CardContent>
          </Card>
        </div>

        {/* Revenue Chart */}
        <Card className="hover:shadow-md transition-shadow">
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle>Biểu đồ thu nhập 6 tháng gần nhất</CardTitle>
              <Select defaultValue="6months">
                <SelectTrigger className="w-[180px]">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="3months">3 tháng</SelectItem>
                  <SelectItem value="6months">6 tháng</SelectItem>
                  <SelectItem value="12months">12 tháng</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {stats.monthly_breakdown.map((item) => (
                <div key={item.month} className="space-y-2">
                  <div className="flex items-center justify-between text-sm">
                    <span className="font-medium">{item.month}</span>
                    <div className="flex items-center gap-4">
                      <span className="text-muted-foreground">{item.bookings} đơn</span>
                      <span className="font-semibold">{formatVND(item.revenue)}</span>
                    </div>
                  </div>
                  <div className="h-3 bg-muted rounded-full overflow-hidden">
                    <div
                      className="h-full bg-accent-green transition-all duration-300"
                      style={{
                        width: `${(item.revenue / Math.max(...stats.monthly_breakdown.map((r) => r.revenue))) * 100}%`,
                      }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Transactions Table */}
        <Card className="hover:shadow-md transition-shadow">
          <CardHeader>
            <CardTitle>Lịch sử giao dịch</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Filters */}
            <div className="flex flex-col md:flex-row gap-4">
              <div className="flex-1 relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  placeholder="Tìm kiếm mã GD, mã đơn, khách hàng..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-full md:w-[180px]">
                  <SelectValue placeholder="Trạng thái" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Tất cả trạng thái</SelectItem>
                  <SelectItem value="COMPLETED">Hoàn thành</SelectItem>
                  <SelectItem value="PENDING">Chờ xử lý</SelectItem>
                  <SelectItem value="FAILED">Thất bại</SelectItem>
                </SelectContent>
              </Select>
              <Select value={periodFilter} onValueChange={setPeriodFilter}>
                <SelectTrigger className="w-full md:w-[180px]">
                  <SelectValue placeholder="Thời gian" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Tất cả</SelectItem>
                  <SelectItem value="today">Hôm nay</SelectItem>
                  <SelectItem value="week">7 ngày qua</SelectItem>
                  <SelectItem value="month">30 ngày qua</SelectItem>
                  <SelectItem value="quarter">90 ngày qua</SelectItem>
                </SelectContent>
              </Select>
              <Select value={sortBy} onValueChange={setSortBy}>
                <SelectTrigger className="w-full md:w-[180px]">
                  <SelectValue placeholder="Sắp xếp" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="date-desc">Mới nhất</SelectItem>
                  <SelectItem value="date-asc">Cũ nhất</SelectItem>
                  <SelectItem value="amount-desc">Số tiền cao nhất</SelectItem>
                  <SelectItem value="amount-asc">Số tiền thấp nhất</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Transactions List */}
            <div className="space-y-3">
              {filteredTransactions.length === 0 ? (
                <div className="text-center py-12">
                  <AlertCircle className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                  <p className="text-muted-foreground">Không tìm thấy giao dịch nào</p>
                </div>
              ) : (
                filteredTransactions.map((transaction) => (
                  <Card key={transaction.transaction_id} className="border-2">
                    <CardContent className="p-4">
                      <div className="flex items-start justify-between gap-4">
                        <div className="flex-1 space-y-2">
                          <div className="flex items-center gap-3">
                            <span className="font-mono text-sm text-muted-foreground">
                              {transaction.transaction_id}
                            </span>
                            {getStatusBadge(transaction.status)}
                          </div>
                          <div className="flex items-center gap-2">
                            <span className="font-semibold">Đơn hàng #{transaction.booking_id}</span>
                            <span className="text-muted-foreground">•</span>
                            <span className="text-muted-foreground">{transaction.customer_name}</span>
                          </div>
                          <div className="flex items-center gap-4 text-sm text-muted-foreground">
                            <div className="flex items-center gap-1">
                              <Calendar className="w-3 h-3" />
                              {formatDate(transaction.created_at, true)}
                            </div>
                            <div className="flex items-center gap-1">
                              <CreditCard className="w-3 h-3" />
                              {transaction.payment_method}
                            </div>
                          </div>
                        </div>
                        <div className="text-right space-y-1">
                          <p className="text-2xl font-bold text-accent-green">{formatVND(transaction.amount)}</p>
                          {transaction.status === "PENDING" && (
                            <p className="text-xs text-muted-foreground">
                              Dự kiến: {formatDate(transaction.expected_date)}
                            </p>
                          )}
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))
              )}
            </div>

            {/* Pagination */}
            {filteredTransactions.length > 0 && (
              <div className="flex items-center justify-between pt-4 border-t">
                <p className="text-sm text-muted-foreground">
                  Hiển thị {filteredTransactions.length} / {transactions.length} giao dịch
                </p>
                <div className="flex gap-2">
                  <Button variant="outline" size="sm" disabled>
                    Trước
                  </Button>
                  <Button variant="outline" size="sm" disabled>
                    Sau
                  </Button>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  )
}

