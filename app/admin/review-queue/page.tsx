"use client"

import { useCallback, useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { useAuth } from "@/contexts/auth-context"
import { http } from "@/lib/http"
import { DashboardLayout } from "@/components/dashboard/dashboard-layout"
import { AdminBreadcrumbs } from "@/components/admin/admin-breadcrumbs"
import { DataTable } from "@/components/dashboard/data-table"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Search, Eye, AlertCircle, ImageIcon, Clock } from "lucide-react"
import type { ColumnDef } from "@tanstack/react-table"
import { formatDate, formatRelativeTime } from "@/lib/format"
import type { ScanSessionWithCustomer } from "@/types"
import { useToast } from "@/hooks/use-toast"
import { adminNavItems } from "@/lib/admin-nav-config"
import { EmptyState } from "@/components/admin/empty-state"
import { TableSkeleton } from "@/components/admin/table-skeleton"
import { useDebounce } from "@/hooks/use-debounce"
import Link from "next/link"
import Image from "next/image"

export default function ReviewQueuePage() {
  const { user, loading } = useAuth()
  const router = useRouter()
  const { toast } = useToast()
  const [search, setSearch] = useState("")
  const [sessions, setSessions] = useState<ScanSessionWithCustomer[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [stats, setStats] = useState({
    total: 0,
    avgConfidence: 0,
    oldestWaitTime: 0,
  })

  const debouncedSearch = useDebounce(search, 500)

  const fetchSessions = useCallback(async () => {
    try {
      setIsLoading(true)
      const params: any = { status: "NEEDS_REVIEW" }
      if (debouncedSearch) params.search = debouncedSearch

      const queryString = new URLSearchParams(params).toString()
      const response = await http<{ sessions: ScanSessionWithCustomer[]; stats: any }>(
        `/api/v1/admin/review-queue${queryString ? `?${queryString}` : ""}`,
      )

      setSessions(response.sessions)
      setStats(response.stats)
    } catch (error) {
      toast({
        title: "Lỗi",
        description: "Không thể tải danh sách phiên scan",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }, [debouncedSearch, toast])
  useEffect(() => {
    if (!loading && (!user || user.role !== "MANAGER")) {
      router.push("/login")
    }
  }, [user, loading, router])

  useEffect(() => {
    if (user?.role === "MANAGER") {
      fetchSessions()
    }
  }, [user, fetchSessions])


  const getConfidenceBadge = (confidence: number | null) => {
    if (!confidence) return <Badge variant="secondary">N/A</Badge>

    const percent = Math.round(confidence * 100)
    if (percent >= 80) return <Badge className="bg-green-500">Cao {percent}%</Badge>
    if (percent >= 60) return <Badge className="bg-yellow-500">TB {percent}%</Badge>
    return <Badge className="bg-red-500">Thấp {percent}%</Badge>
  }

  const columns: ColumnDef<ScanSessionWithCustomer>[] = [
    {
      accessorKey: "session_id",
      header: "Session ID",
      cell: ({ row }) => <span className="font-mono text-sm">#{row.original.session_id}</span>,
    },
    {
      accessorKey: "customer_name",
      header: "Khách hàng",
      cell: ({ row }) => (
        <div className="flex items-center gap-2">
          {row.original.customer_avatar ? (
            <Image
              src={row.original.customer_avatar || "/placeholder.svg"}
              alt=""
              width={32}
              height={32}
              className="w-8 h-8 rounded-full object-cover"
            />
          ) : (
            <div className="w-8 h-8 rounded-full bg-muted flex items-center justify-center">
              <span className="text-xs font-medium">{row.original.customer_name[0]}</span>
            </div>
          )}
          <div>
            <p className="font-medium">{row.original.customer_name}</p>
            <p className="text-xs text-muted-foreground">{row.original.customer_email}</p>
          </div>
        </div>
      ),
    },
    {
      accessorKey: "image_count",
      header: "Ảnh",
      cell: ({ row }) => (
        <div className="flex items-center gap-1">
          <ImageIcon className="w-4 h-4 text-muted-foreground" />
          <span>{row.original.image_count}</span>
        </div>
      ),
    },
    {
      accessorKey: "average_confidence",
      header: "Độ tin cậy",
      cell: ({ row }) => getConfidenceBadge(row.original.average_confidence),
    },
    {
      accessorKey: "items",
      header: "Items",
      cell: ({ row }) => <span>{row.original.items?.length || 0} items</span>,
    },
    {
      accessorKey: "created_at",
      header: "Thời gian",
      cell: ({ row }) => (
        <div>
          <p className="text-sm">{formatDate(row.original.created_at)}</p>
          <p className="text-xs text-muted-foreground">{formatRelativeTime(row.original.created_at)}</p>
        </div>
      ),
    },
    {
      id: "actions",
      header: "",
      cell: ({ row }) => (
        <Button asChild size="sm">
          <Link href={`/admin/sessions/${row.original.session_id}`}>
            <Eye className="w-4 h-4 mr-2" />
            Xử lý
          </Link>
        </Button>
      ),
    },
  ]

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-accent-green" />
      </div>
    )
  }

  if (!user) return null

  return (
    <DashboardLayout navItems={adminNavItems} title="Review Queue">
      <div className="space-y-6">
        <AdminBreadcrumbs />

        <div>
          <h1 className="text-3xl font-bold tracking-tight">Hàng đợi Review</h1>
          <p className="text-muted-foreground mt-1">Các phiên scan cần được admin xem xét và xử lý</p>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Tổng phiên chờ</p>
                  <p className="text-3xl font-bold mt-2">{stats.total}</p>
                </div>
                <div className="w-12 h-12 rounded-full bg-amber-100 flex items-center justify-center">
                  <AlertCircle className="w-6 h-6 text-amber-600" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Độ tin cậy TB</p>
                  <p className="text-3xl font-bold mt-2">{Math.round(stats.avgConfidence * 100)}%</p>
                </div>
                <div className="w-12 h-12 rounded-full bg-blue-100 flex items-center justify-center">
                  <ImageIcon className="w-6 h-6 text-blue-600" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Chờ lâu nhất</p>
                  <p className="text-3xl font-bold mt-2">{Math.round(stats.oldestWaitTime / 60)}h</p>
                </div>
                <div className="w-12 h-12 rounded-full bg-red-100 flex items-center justify-center">
                  <Clock className="w-6 h-6 text-red-600" />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Danh sách phiên scan</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Search */}
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Tìm kiếm theo tên khách hàng, email, session ID..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-9 h-11"
              />
            </div>

            {/* Table */}
            {isLoading ? (
              <TableSkeleton rows={5} columns={7} />
            ) : sessions.length === 0 ? (
              <EmptyState
                icon={AlertCircle}
                title="Không có phiên nào cần review"
                description={
                  debouncedSearch
                    ? "Không tìm thấy phiên nào phù hợp với tìm kiếm của bạn."
                    : "Tất cả các phiên scan đã được xử lý. Tuyệt vời!"
                }
                action={
                  debouncedSearch
                    ? {
                        label: "Xóa tìm kiếm",
                        onClick: () => setSearch(""),
                      }
                    : undefined
                }
              />
            ) : (
              <DataTable columns={columns} data={sessions} />
            )}
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  )
}


