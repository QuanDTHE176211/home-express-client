"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { DashboardLayout } from "@/components/dashboard/dashboard-layout"
import { AdminBreadcrumbs } from "@/components/admin/admin-breadcrumbs"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { AlertTriangle, Clock, CheckCircle2, AlertCircle, Search } from "lucide-react"
import { apiClient } from "@/lib/api-client"
import { useAuth } from "@/contexts/auth-context"
import { adminNavItems } from "@/lib/admin-nav-config"
import { EmptyState } from "@/components/admin/empty-state"
import { Skeleton } from "@/components/ui/skeleton"
import type { ExceptionWithDetails, ExceptionPriority, ExceptionStatus } from "@/types"

const PRIORITY_CONFIG: Record<ExceptionPriority, { label: string; color: string; icon: typeof AlertTriangle }> = {
  URGENT: { label: "Khẩn cấp", color: "destructive", icon: AlertTriangle },
  HIGH: { label: "Cao", color: "destructive", icon: AlertCircle },
  MEDIUM: { label: "Trung bình", color: "default", icon: Clock },
  LOW: { label: "Thấp", color: "secondary", icon: Clock },
}

const STATUS_CONFIG: Record<ExceptionStatus, { label: string; color: string }> = {
  PENDING: { label: "Chờ xử lý", color: "default" },
  IN_PROGRESS: { label: "Đang xử lý", color: "default" },
  RESOLVED: { label: "Đã giải quyết", color: "default" },
  ESCALATED: { label: "Đã leo thang", color: "destructive" },
}

export default function AdminExceptionsPage() {
  const router = useRouter()
  const { user, loading: authLoading } = useAuth()
  const [loading, setLoading] = useState(true)
  const [exceptions, setExceptions] = useState<ExceptionWithDetails[]>([])
  const [stats, setStats] = useState<any>(null)
  const [statusFilter, setStatusFilter] = useState<string>("all")
  const [priorityFilter, setPriorityFilter] = useState<string>("all")
  const [searchQuery, setSearchQuery] = useState("")
  const [currentPage, setCurrentPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)

  // Redirect if not manager
  useEffect(() => {
    if (!authLoading && (!user || user.role !== "MANAGER")) {
      router.push("/login")
    }
  }, [user, authLoading, router])

  // Fetch exceptions
  useEffect(() => {
    if (!user || user.role !== "MANAGER") return

    const fetchExceptions = async () => {
      try {
        setLoading(true)
        const response = await apiClient.getExceptions({
          page: currentPage,
          limit: 20,
          status: statusFilter !== "all" ? statusFilter : undefined,
          priority: priorityFilter !== "all" ? priorityFilter : undefined,
        })

        setExceptions(response.data.exceptions)
        setStats(response.data.stats)
        setTotalPages(response.data.pagination.totalPages)
      } catch (error) {
        console.error("Failed to fetch exceptions:", error)
      } finally {
        setLoading(false)
      }
    }

    fetchExceptions()
  }, [user, currentPage, statusFilter, priorityFilter])

  const handleExceptionClick = (exceptionId: number) => {
    router.push(`/admin/exceptions/${exceptionId}`)
  }

  if (authLoading || !user) {
    return null
  }

  return (
    <DashboardLayout navItems={adminNavItems} title="Quản lý Ngoại lệ">
      <div className="space-y-6">
        <AdminBreadcrumbs />

        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold">Quản lý Ngoại lệ</h1>
            <p className="text-muted-foreground">Theo dõi và xử lý các ngoại lệ trong hệ thống</p>
          </div>
        </div>

        {/* Stats Cards */}
        {stats && (
          <div className="grid gap-4 md:grid-cols-4">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Tổng ngoại lệ</CardTitle>
                <AlertTriangle className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stats.total}</div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Chờ xử lý</CardTitle>
                <Clock className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stats.pending}</div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Đang xử lý</CardTitle>
                <AlertCircle className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stats.in_progress}</div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Khẩn cấp</CardTitle>
                <AlertTriangle className="h-4 w-4 text-destructive" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-destructive">{stats.by_priority.urgent}</div>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Filters */}
        <Card>
          <CardHeader>
            <CardTitle>Bộ lọc</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-col gap-4 md:flex-row">
              <div className="flex-1">
                <div className="relative">
                  <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Tìm kiếm ngoại lệ..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-8"
                  />
                </div>
              </div>

              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-full md:w-[200px]">
                  <SelectValue placeholder="Trạng thái" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Tất cả trạng thái</SelectItem>
                  <SelectItem value="PENDING">Chờ xử lý</SelectItem>
                  <SelectItem value="IN_PROGRESS">Đang xử lý</SelectItem>
                  <SelectItem value="RESOLVED">Đã giải quyết</SelectItem>
                  <SelectItem value="ESCALATED">Đã leo thang</SelectItem>
                </SelectContent>
              </Select>

              <Select value={priorityFilter} onValueChange={setPriorityFilter}>
                <SelectTrigger className="w-full md:w-[200px]">
                  <SelectValue placeholder="Mức độ ưu tiên" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Tất cả mức độ</SelectItem>
                  <SelectItem value="URGENT">Khẩn cấp</SelectItem>
                  <SelectItem value="HIGH">Cao</SelectItem>
                  <SelectItem value="MEDIUM">Trung bình</SelectItem>
                  <SelectItem value="LOW">Thấp</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>

        {/* Exceptions List */}
        <Card>
          <CardHeader>
            <CardTitle>Danh sách Ngoại lệ</CardTitle>
            <CardDescription>{exceptions.length} ngoại lệ được tìm thấy</CardDescription>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="space-y-4">
                {[...Array(5)].map((_, i) => (
                  <Skeleton key={i} className="h-24 w-full" />
                ))}
              </div>
            ) : exceptions.length === 0 ? (
              <EmptyState
                icon={CheckCircle2}
                title="Không có ngoại lệ"
                description="Hiện tại không có ngoại lệ nào cần xử lý"
              />
            ) : (
              <div className="space-y-4">
                {exceptions.map((exception) => {
                  const priorityConfig = PRIORITY_CONFIG[exception.priority]
                  const statusConfig = STATUS_CONFIG[exception.status]
                  const PriorityIcon = priorityConfig.icon

                  return (
                    <div
                      key={exception.exception_id}
                      className="flex items-start gap-4 rounded-lg border p-4 hover:bg-accent cursor-pointer transition-colors"
                      onClick={() => handleExceptionClick(exception.exception_id)}
                    >
                      <div
                        className={`rounded-full p-2 ${exception.priority === "URGENT" || exception.priority === "HIGH" ? "bg-destructive/10" : "bg-muted"}`}
                      >
                        <PriorityIcon
                          className={`h-5 w-5 ${exception.priority === "URGENT" || exception.priority === "HIGH" ? "text-destructive" : "text-muted-foreground"}`}
                        />
                      </div>

                      <div className="flex-1 space-y-2">
                        <div className="flex items-start justify-between gap-2">
                          <div>
                            <h3 className="font-semibold">{exception.title}</h3>
                            <p className="text-sm text-muted-foreground line-clamp-2">{exception.description}</p>
                          </div>
                          <div className="flex gap-2">
                            <Badge variant={priorityConfig.color as any}>{priorityConfig.label}</Badge>
                            <Badge variant={statusConfig.color as any}>{statusConfig.label}</Badge>
                          </div>
                        </div>

                        {exception.booking_info && (
                          <div className="text-sm text-muted-foreground">
                            <span className="font-medium">Booking #{exception.booking_info.booking_id}</span>
                            {" • "}
                            {exception.booking_info.customer_name}
                            {exception.booking_info.transport_name && (
                              <>
                                {" → "}
                                {exception.booking_info.transport_name}
                              </>
                            )}
                          </div>
                        )}

                        <div className="flex items-center gap-4 text-xs text-muted-foreground">
                          <span>Tạo: {new Date(exception.created_at).toLocaleDateString("vi-VN")}</span>
                          {exception.assigned_to_name && <span>Phụ trách: {exception.assigned_to_name}</span>}
                        </div>
                      </div>
                    </div>
                  )
                })}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex justify-center gap-2">
            <Button
              variant="outline"
              onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
              disabled={currentPage === 1}
            >
              Trước
            </Button>
            <span className="flex items-center px-4">
              Trang {currentPage} / {totalPages}
            </span>
            <Button
              variant="outline"
              onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
              disabled={currentPage === totalPages}
            >
              Sau
            </Button>
          </div>
        )}
      </div>
    </DashboardLayout>
  )
}
