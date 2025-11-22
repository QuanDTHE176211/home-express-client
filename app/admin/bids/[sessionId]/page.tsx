"use client"

import { useCallback, useEffect, useState } from "react"
import { useRouter, useParams } from "next/navigation"
import { useAuth } from "@/contexts/auth-context"
import { http } from "@/lib/http"
import { useSSE } from "@/lib/sse"
import { logAuditAction } from "@/lib/audit-logger"
import { DashboardLayout } from "@/components/dashboard/dashboard-layout"
import { AdminBreadcrumbs } from "@/components/admin/admin-breadcrumbs"
import { DataTable } from "@/components/dashboard/data-table"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { CheckCircle, XCircle, Clock, TrendingUp, ArrowLeft, Award, Loader2 } from "lucide-react"
import type { ColumnDef } from "@tanstack/react-table"
import { formatVND, formatDate, formatRelativeTime } from "@/lib/format"
import { useToast } from "@/hooks/use-toast"
import { adminNavItems } from "@/lib/admin-nav-config"
import { EmptyState } from "@/components/admin/empty-state"
import Link from "next/link"
import Image from "next/image"

interface Bid {
  bid_id: number
  session_id: number
  transport_id: number
  transport_name: string
  transport_avatar: string | null
  transport_rating: number
  transport_completed_jobs: number
  total_price: number
  base_price: number
  distance_price: number
  item_handling_price: number
  status: "PENDING" | "ACCEPTED" | "REJECTED"
  notes: string | null
  estimated_duration_hours: number
  created_at: string
  updated_at: string
}

interface SessionInfo {
  session_id: number
  customer_name: string
  items_count: number
  estimated_price: number
  status: string
  published_at: string
  bidding_expires_at: string
}

export default function BidsMonitorPage() {
  const { user, loading } = useAuth()
  const router = useRouter()
  const params = useParams()
  const { toast } = useToast()
  const sessionId = params.sessionId as string

  const [session, setSession] = useState<SessionInfo | null>(null)
  const [bids, setBids] = useState<Bid[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [statusFilter, setStatusFilter] = useState("ALL")
  const [isAccepting, setIsAccepting] = useState<number | null>(null)
  const [isRejecting, setIsRejecting] = useState<number | null>(null)

  // SSE for realtime bid updates
  const { data: sseData } = useSSE(`/api/v1/admin/bids/session/${sessionId}/events`)

  const fetchData = useCallback(async () => {
    try {
      setIsLoading(true)
      const response = await http<{ session: SessionInfo; bids: Bid[] }>(`/api/v1/admin/bids/session/${sessionId}`)
      setSession(response.session)
      setBids(response.bids)
    } catch (error) {
      toast({
        title: "Lỗi",
        description: "Không thể tải thông tin đấu giá",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }, [sessionId, toast])

  useEffect(() => {
    if (!loading && (!user || user.role !== "MANAGER")) {
      router.push("/login")
    }
  }, [user, loading, router])

  useEffect(() => {
    if (user?.role === "MANAGER") {
      fetchData()
    }
  }, [user, fetchData])

  useEffect(() => {
    if (sseData && sseData.type === "BID_STATUS_CHANGED") {
      // Update bid status in realtime
      setBids((prev) => prev.map((bid) => (bid.bid_id === sseData.bidId ? { ...bid, status: sseData.newStatus } : bid)))

      toast({
        title: "Cập nhật realtime",
        description: `Bid #${sseData.bidId} đã ${sseData.newStatus === "ACCEPTED" ? "được chấp nhận" : "bị từ chối"}`,
      })
    }
  }, [sseData, toast])

  const handleAcceptBid = async (bidId: number) => {
    try {
      setIsAccepting(bidId)
      await http(`/api/v1/admin/bids/${bidId}/accept`, {
        method: "POST",
      })
      await logAuditAction({
        action: "BID_ACCEPTED",
        target_type: "BID",
        target_id: bidId,
        details: { sessionId }
      })
      toast({
        title: "Thành công",
        description: "Đã chấp nhận bid",
      })
      await fetchData()
    } catch (error) {
      toast({
        title: "Lỗi",
        description: "Không thể chấp nhận bid",
        variant: "destructive",
      })
    } finally {
      setIsAccepting(null)
    }
  }

  const handleRejectBid = async (bidId: number, rejectReason?: string) => {
    try {
      setIsRejecting(bidId)
      await http(`/api/v1/admin/bids/${bidId}/reject`, {
        method: "POST",
      })
      await logAuditAction({
        action: "BID_REJECTED",
        target_type: "BID",
        target_id: bidId,
        details: { sessionId, reason: rejectReason }
      })
      toast({
        title: "Thành công",
        description: "Đã từ chối bid",
      })
      await fetchData()
    } catch (error) {
      toast({
        title: "Lỗi",
        description: "Không thể từ chối bid",
        variant: "destructive",
      })
    } finally {
      setIsRejecting(null)
    }
  }

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "ACCEPTED":
        return (
          <Badge className="bg-green-500">
            <CheckCircle className="w-3 h-3 mr-1" />
            Đã chấp nhận
          </Badge>
        )
      case "REJECTED":
        return (
          <Badge className="bg-red-500">
            <XCircle className="w-3 h-3 mr-1" />
            Đã từ chối
          </Badge>
        )
      default:
        return (
          <Badge variant="secondary">
            <Clock className="w-3 h-3 mr-1" />
            Chờ xử lý
          </Badge>
        )
    }
  }

  const filteredBids = bids.filter((bid) => (statusFilter === "ALL" ? true : bid.status === statusFilter))

  const columns: ColumnDef<Bid>[] = [
    {
      accessorKey: "transport_name",
      header: "Nhà xe",
      cell: ({ row }) => (
        <div className="flex items-center gap-3">
          {row.original.transport_avatar ? (
            <Image
              src={row.original.transport_avatar || "/placeholder.svg"}
              alt=""
              width={40}
              height={40}
              className="h-10 w-10 rounded-full object-cover"
            />
          ) : (
            <div className="w-10 h-10 rounded-full bg-muted flex items-center justify-center">
              <span className="text-sm font-medium">{row.original.transport_name[0]}</span>
            </div>
          )}
          <div>
            <p className="font-medium">{row.original.transport_name}</p>
            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              <span>⭐ {row.original.transport_rating}</span>
              <span>•</span>
              <span>{row.original.transport_completed_jobs} chuyến</span>
            </div>
          </div>
        </div>
      ),
    },
    {
      accessorKey: "total_price",
      header: "Giá đề xuất",
      cell: ({ row }) => (
        <div>
          <p className="font-bold text-lg">{formatVND(row.original.total_price)}</p>
          <p className="text-xs text-muted-foreground">
            Base: {formatVND(row.original.base_price)} + Distance: {formatVND(row.original.distance_price)}
          </p>
        </div>
      ),
    },
    {
      accessorKey: "estimated_duration_hours",
      header: "Thời gian",
      cell: ({ row }) => <span>{row.original.estimated_duration_hours}h</span>,
    },
    {
      accessorKey: "status",
      header: "Trạng thái",
      cell: ({ row }) => getStatusBadge(row.original.status),
    },
    {
      accessorKey: "created_at",
      header: "Thời gian đấu giá",
      cell: ({ row }) => (
        <div>
          <p className="text-sm">{formatDate(row.original.created_at)}</p>
          <p className="text-xs text-muted-foreground">{formatRelativeTime(row.original.created_at)}</p>
        </div>
      ),
    },
    {
      id: "actions",
      header: "Hành động",
      cell: ({ row }) => {
        const bid = row.original
        if (bid.status === "PENDING") {
          return (
            <div className="flex gap-2">
              <Button
                size="sm"
                onClick={() => handleAcceptBid(bid.bid_id)}
                disabled={isAccepting === bid.bid_id}
                className="bg-green-600 hover:bg-green-700"
              >
                {isAccepting === bid.bid_id ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <>
                    <CheckCircle className="w-4 h-4 mr-1" />
                    Chấp nhận
                  </>
                )}
              </Button>
              <Button
                size="sm"
                variant="destructive"
                onClick={() => handleRejectBid(bid.bid_id)}
                disabled={isRejecting === bid.bid_id}
              >
                {isRejecting === bid.bid_id ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <>
                    <XCircle className="w-4 h-4 mr-1" />
                    Từ chối
                  </>
                )}
              </Button>
            </div>
          )
        }
        return <span className="text-muted-foreground text-sm">Đã xử lý</span>
      },
    },
  ]

  if (loading || isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-accent-green" />
      </div>
    )
  }

  if (!user || !session) return null

  const stats = {
    total: bids.length,
    pending: bids.filter((b) => b.status === "PENDING").length,
    accepted: bids.filter((b) => b.status === "ACCEPTED").length,
    rejected: bids.filter((b) => b.status === "REJECTED").length,
    lowestPrice: bids.length > 0 ? Math.min(...bids.map((b) => b.total_price)) : 0,
    highestPrice: bids.length > 0 ? Math.max(...bids.map((b) => b.total_price)) : 0,
  }

  return (
    <DashboardLayout navItems={adminNavItems} title="Bids Monitor">
      <div className="space-y-6">
        <AdminBreadcrumbs />

        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Button variant="ghost" size="icon" asChild>
              <Link href={`/admin/sessions/${sessionId}`}>
                <ArrowLeft className="w-4 h-4" />
              </Link>
            </Button>
            <div>
              <h1 className="text-3xl font-bold tracking-tight">Theo dõi đấu giá</h1>
              <p className="text-muted-foreground mt-1">
                Session #{session.session_id} • {session.customer_name} • {session.items_count} items
              </p>
            </div>
          </div>
          <Badge variant={session.status === "PUBLISHED" ? "default" : "secondary"}>{session.status}</Badge>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Tổng bids</p>
                  <p className="text-3xl font-bold mt-2">{stats.total}</p>
                </div>
                <div className="w-12 h-12 rounded-full bg-blue-100 flex items-center justify-center">
                  <TrendingUp className="w-6 h-6 text-blue-600" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Chờ xử lý</p>
                  <p className="text-3xl font-bold mt-2">{stats.pending}</p>
                </div>
                <div className="w-12 h-12 rounded-full bg-amber-100 flex items-center justify-center">
                  <Clock className="w-6 h-6 text-amber-600" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Giá thấp nhất</p>
                  <p className="text-2xl font-bold mt-2">{formatVND(stats.lowestPrice)}</p>
                </div>
                <div className="w-12 h-12 rounded-full bg-green-100 flex items-center justify-center">
                  <Award className="w-6 h-6 text-green-600" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Giá cao nhất</p>
                  <p className="text-2xl font-bold mt-2">{formatVND(stats.highestPrice)}</p>
                </div>
                <div className="w-12 h-12 rounded-full bg-red-100 flex items-center justify-center">
                  <TrendingUp className="w-6 h-6 text-red-600" />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle>Danh sách bids</CardTitle>
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-[180px]">
                  <SelectValue placeholder="Lọc theo trạng thái" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="ALL">Tất cả</SelectItem>
                  <SelectItem value="PENDING">Chờ xử lý</SelectItem>
                  <SelectItem value="ACCEPTED">Đã chấp nhận</SelectItem>
                  <SelectItem value="REJECTED">Đã từ chối</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </CardHeader>
          <CardContent>
            {filteredBids.length === 0 ? (
              <EmptyState
                icon={Clock}
                title="Chưa có bids"
                description={
                  statusFilter === "ALL"
                    ? "Chưa có nhà xe nào đấu giá cho phiên này."
                    : "Không có bids nào phù hợp với bộ lọc."
                }
                action={
                  statusFilter !== "ALL"
                    ? {
                      label: "Xóa bộ lọc",
                      onClick: () => setStatusFilter("ALL"),
                    }
                    : undefined
                }
              />
            ) : (
              <DataTable columns={columns} data={filteredBids} />
            )}
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  )
}

