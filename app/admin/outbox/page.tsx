"use client"

import { useEffect, useState, useCallback } from "react"
import { useRouter } from "next/navigation"
import { useAuth } from "@/contexts/auth-context"
import { http } from "@/lib/http"
import { DashboardLayout } from "@/components/dashboard/dashboard-layout"
import { AdminBreadcrumbs } from "@/components/admin/admin-breadcrumbs"
import { DataTable } from "@/components/dashboard/data-table"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Input } from "@/components/ui/input"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Checkbox } from "@/components/ui/checkbox"
import {
    RefreshCw,
    AlertCircle,
    CheckCircle,
    Clock,
    Loader2,
    Trash2,
    Eye,
    Download,
    Search,
    Filter,
    RotateCcw
} from "lucide-react"
import type { ColumnDef } from "@tanstack/react-table"
import { formatDate, formatRelativeTime } from "@/lib/format"
import { useToast } from "@/hooks/use-toast"
import { adminNavItems } from "@/lib/admin-nav-config"
import { EmptyState } from "@/components/admin/empty-state"
import { Pagination } from "@/components/admin/pagination"
import { logAuditAction } from "@/lib/audit-logger"

interface OutboxEvent {
    event_id: number
    type: string
    payload: any
    status: "NEW" | "PROCESSING" | "SENT" | "FAILED"
    retry_count: number
    max_retries: number
    last_error: string | null
    created_at: string
    updated_at: string
    sent_at: string | null
}

export default function OutboxPage() {
    const { user, loading } = useAuth()
    const router = useRouter()
    const { toast } = useToast()

    const [events, setEvents] = useState<OutboxEvent[]>([])
    const [isLoading, setIsLoading] = useState(true)
    const [statusFilter, setStatusFilter] = useState("ALL")
    const [typeFilter, setTypeFilter] = useState("ALL")
    const [searchQuery, setSearchQuery] = useState("")
    const [retryingIds, setRetryingIds] = useState<Set<number>>(new Set())
    const [deletingIds, setDeletingIds] = useState<Set<number>>(new Set())
    const [selectedIds, setSelectedIds] = useState<Set<number>>(new Set())
    const [detailEvent, setDetailEvent] = useState<OutboxEvent | null>(null)
    const [autoRefresh, setAutoRefresh] = useState(false)
    const [refreshInterval, setRefreshInterval] = useState(30)
    const [currentPage, setCurrentPage] = useState(1)
    const [itemsPerPage, setItemsPerPage] = useState(20)
    const [totalPages, setTotalPages] = useState(1)
    const [totalItems, setTotalItems] = useState(0)


    const fetchEvents = useCallback(async () => {
        try {
            setIsLoading(true)
            const params: any = {
                page: currentPage,
                limit: itemsPerPage,
            }
            if (statusFilter !== "ALL") params.status = statusFilter
            if (typeFilter !== "ALL") params.type = typeFilter

            const queryString = new URLSearchParams(params).toString()
            const response = await http<{ events: OutboxEvent[]; pagination?: { total_pages: number; total_items: number } }>(`/api/v1/admin/outbox${queryString ? `?${queryString}` : ""}`)
            setEvents(response.events)
            if (response.pagination) {
                setTotalPages(response.pagination.total_pages)
                setTotalItems(response.pagination.total_items)
            } else {
                setTotalPages(1)
                setTotalItems(response.events.length)
            }
        } catch (error) {
            toast({
                title: "Lỗi",
                description: "Không thể tải danh sách events",
                variant: "destructive",
            })
        } finally {
            setIsLoading(false)
        }
    }, [currentPage, itemsPerPage, statusFilter, typeFilter, toast])
    useEffect(() => {
        if (!loading && (!user || user.role !== "MANAGER")) {
            router.push("/login")
        }
    }, [user, loading, router])

    useEffect(() => {
        if (user?.role === "MANAGER") {
            fetchEvents()
        }
    }, [user, fetchEvents])

    // Auto-refresh
    useEffect(() => {
        if (!autoRefresh || !user) return

        const interval = setInterval(() => {
            fetchEvents()
        }, refreshInterval * 1000)

        return () => clearInterval(interval)
    }, [autoRefresh, refreshInterval, user, fetchEvents])


    const handleRetry = async (eventId: number) => {
        try {
            setRetryingIds((prev) => new Set(prev).add(eventId))
            await http(`/api/v1/admin/outbox/${eventId}/retry`, {
                method: "POST",
            })
            await logAuditAction({
                action: "OUTBOX_EVENT_RETRIED",
                target_type: "OUTBOX_EVENT",
                target_id: eventId,
            })
            toast({
                title: "Thành công",
                description: "Đã retry event",
            })
            await fetchEvents()
        } catch (error) {
            toast({
                title: "Lỗi",
                description: "Không thể retry event",
                variant: "destructive",
            })
        } finally {
            setRetryingIds((prev) => {
                const newSet = new Set(prev)
                newSet.delete(eventId)
                return newSet
            })
        }
    }

    const handleDelete = async (eventId: number) => {
        try {
            setDeletingIds((prev) => new Set(prev).add(eventId))
            await http(`/api/v1/admin/outbox/${eventId}`, {
                method: "DELETE",
            })
            await logAuditAction({
                action: "OUTBOX_EVENT_DELETED",
                target_type: "OUTBOX_EVENT",
                target_id: eventId,
            })
            toast({
                title: "Thành công",
                description: "Đã xóa event",
            })
            await fetchEvents()
        } catch (error) {
            toast({
                title: "Lỗi",
                description: "Không thể xóa event",
                variant: "destructive",
            })
        } finally {
            setDeletingIds((prev) => {
                const newSet = new Set(prev)
                newSet.delete(eventId)
                return newSet
            })
        }
    }

    const handleBulkRetry = async () => {
        if (selectedIds.size === 0) return

        try {
            const promises = Array.from(selectedIds).map((id) => handleRetry(id))
            await Promise.all(promises)
            setSelectedIds(new Set())
            toast({
                title: "Thành công",
                description: `Đã retry ${selectedIds.size} events`,
            })
        } catch (error) {
            toast({
                title: "Lỗi",
                description: "Không thể retry một số events",
                variant: "destructive",
            })
        }
    }

    const handleBulkDelete = async () => {
        if (selectedIds.size === 0) return

        try {
            const promises = Array.from(selectedIds).map((id) => handleDelete(id))
            await Promise.all(promises)
            setSelectedIds(new Set())
            toast({
                title: "Thành công",
                description: `Đã xóa ${selectedIds.size} events`,
            })
        } catch (error) {
            toast({
                title: "Lỗi",
                description: "Không thể xóa một số events",
                variant: "destructive",
            })
        }
    }

    const handleExport = () => {
        const csv = [
            ["ID", "Type", "Status", "Retry Count", "Error", "Created At", "Sent At"].join(","),
            ...filteredEvents.map((e) =>
                [
                    e.event_id,
                    e.type,
                    e.status,
                    `${e.retry_count}/${e.max_retries}`,
                    e.last_error || "",
                    e.created_at,
                    e.sent_at || "",
                ].join(","),
            ),
        ].join("\n")

        const blob = new Blob([csv], { type: "text/csv" })
        const url = URL.createObjectURL(blob)
        const a = document.createElement("a")
        a.href = url
        a.download = `outbox-events-${new Date().toISOString()}.csv`
        a.click()
        URL.revokeObjectURL(url)
    }

    const getStatusBadge = (status: string) => {
        switch (status) {
            case "SENT":
                return (
                    <Badge className="bg-green-500">
                        <CheckCircle className="w-3 h-3 mr-1" />
                        Đã gửi
                    </Badge>
                )
            case "FAILED":
                return (
                    <Badge className="bg-red-500">
                        <AlertCircle className="w-3 h-3 mr-1" />
                        Thất bại
                    </Badge>
                )
            case "PROCESSING":
                return (
                    <Badge className="bg-blue-500">
                        <Loader2 className="w-3 h-3 mr-1 animate-spin" />
                        Đang xử lý
                    </Badge>
                )
            default:
                return (
                    <Badge variant="secondary">
                        <Clock className="w-3 h-3 mr-1" />
                        Mới
                    </Badge>
                )
        }
    }

    const columns: ColumnDef<OutboxEvent>[] = [
        {
            id: "select",
            header: ({ table }) => (
                <Checkbox
                    checked={table.getIsAllPageRowsSelected()}
                    onCheckedChange={(value) => {
                        table.toggleAllPageRowsSelected(!!value)
                        if (value) {
                            setSelectedIds(new Set(filteredEvents.map((e) => e.event_id)))
                        } else {
                            setSelectedIds(new Set())
                        }
                    }}
                />
            ),
            cell: ({ row }) => (
                <Checkbox
                    checked={selectedIds.has(row.original.event_id)}
                    onCheckedChange={(value) => {
                        const newSet = new Set(selectedIds)
                        if (value) {
                            newSet.add(row.original.event_id)
                        } else {
                            newSet.delete(row.original.event_id)
                        }
                        setSelectedIds(newSet)
                    }}
                />
            ),
        },
        {
            accessorKey: "event_id",
            header: "ID",
            cell: ({ row }) => <span className="font-mono text-sm">#{row.original.event_id}</span>,
        },
        {
            accessorKey: "type",
            header: "Loại event",
            cell: ({ row }) => <Badge variant="outline">{row.original.type}</Badge>,
        },
        {
            accessorKey: "status",
            header: "Trạng thái",
            cell: ({ row }) => getStatusBadge(row.original.status),
        },
        {
            accessorKey: "retry_count",
            header: "Retry",
            cell: ({ row }) => (
                <span className={row.original.retry_count > 0 ? "text-amber-600 font-medium" : ""}>
                    {row.original.retry_count}/{row.original.max_retries}
                </span>
            ),
        },
        {
            accessorKey: "last_error",
            header: "Lỗi",
            cell: ({ row }) =>
                row.original.last_error ? (
                    <span className="text-xs text-red-600 truncate max-w-[200px] block" title={row.original.last_error}>
                        {row.original.last_error}
                    </span>
                ) : (
                    <span className="text-muted-foreground text-xs">-</span>
                ),
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
            header: "Hành động",
            cell: ({ row }) => {
                const event = row.original
                const canRetry = event.status === "FAILED" && event.retry_count < event.max_retries

                return (
                    <div className="flex gap-2">
                        <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => setDetailEvent(event)}
                            title="Xem chi tiết"
                        >
                            <Eye className="w-4 h-4" />
                        </Button>
                        {canRetry && (
                            <Button
                                size="sm"
                                variant="outline"
                                onClick={() => handleRetry(event.event_id)}
                                disabled={retryingIds.has(event.event_id)}
                                title="Retry"
                            >
                                {retryingIds.has(event.event_id) ? (
                                    <Loader2 className="w-4 h-4 animate-spin" />
                                ) : (
                                    <RefreshCw className="w-4 h-4" />
                                )}
                            </Button>
                        )}
                        {(event.status === "SENT" || event.status === "FAILED") && (
                            <Button
                                size="sm"
                                variant="ghost"
                                onClick={() => handleDelete(event.event_id)}
                                disabled={deletingIds.has(event.event_id)}
                                className="text-red-500 hover:text-red-700"
                                title="Xóa"
                            >
                                {deletingIds.has(event.event_id) ? (
                                    <Loader2 className="w-4 h-4 animate-spin" />
                                ) : (
                                    <Trash2 className="w-4 h-4" />
                                )}
                            </Button>
                        )}
                    </div>
                )
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

    if (!user) return null

    // Filter events
    const filteredEvents = events.filter((event) => {
        const matchesSearch = searchQuery
            ? event.type.toLowerCase().includes(searchQuery.toLowerCase()) ||
            event.event_id.toString().includes(searchQuery) ||
            (event.last_error && event.last_error.toLowerCase().includes(searchQuery.toLowerCase()))
            : true

        return matchesSearch
    })

    const stats = {
        total: events.length,
        new: events.filter((e) => e.status === "NEW").length,
        processing: events.filter((e) => e.status === "PROCESSING").length,
        sent: events.filter((e) => e.status === "SENT").length,
        failed: events.filter((e) => e.status === "FAILED").length,
    }

    // Get unique event types for filter
    const eventTypes = Array.from(new Set(events.map((e) => e.type)))

    return (
        <DashboardLayout navItems={adminNavItems} title="Outbox">
            <div className="space-y-6">
                <AdminBreadcrumbs />

                <div>
                    <h1 className="text-3xl font-bold tracking-tight">Outbox Events</h1>
                    <p className="text-muted-foreground mt-1">Quản lý hàng đợi sự kiện gửi đến Member 3/4</p>
                </div>

                {/* Stats Cards */}
                <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
                    <Card>
                        <CardContent className="p-6">
                            <div className="flex items-center justify-between">
                                <div>
                                    <p className="text-sm font-medium text-muted-foreground">Tổng</p>
                                    <p className="text-3xl font-bold mt-2">{stats.total}</p>
                                </div>
                                <div className="w-12 h-12 rounded-full bg-blue-100 flex items-center justify-center">
                                    <Clock className="w-6 h-6 text-blue-600" />
                                </div>
                            </div>
                        </CardContent>
                    </Card>

                    <Card>
                        <CardContent className="p-6">
                            <div className="flex items-center justify-between">
                                <div>
                                    <p className="text-sm font-medium text-muted-foreground">Mới</p>
                                    <p className="text-3xl font-bold mt-2">{stats.new}</p>
                                </div>
                                <div className="w-12 h-12 rounded-full bg-gray-100 flex items-center justify-center">
                                    <Clock className="w-6 h-6 text-gray-600" />
                                </div>
                            </div>
                        </CardContent>
                    </Card>

                    <Card>
                        <CardContent className="p-6">
                            <div className="flex items-center justify-between">
                                <div>
                                    <p className="text-sm font-medium text-muted-foreground">Đang xử lý</p>
                                    <p className="text-3xl font-bold mt-2">{stats.processing}</p>
                                </div>
                                <div className="w-12 h-12 rounded-full bg-blue-100 flex items-center justify-center">
                                    <Loader2 className="w-6 h-6 text-blue-600 animate-spin" />
                                </div>
                            </div>
                        </CardContent>
                    </Card>

                    <Card>
                        <CardContent className="p-6">
                            <div className="flex items-center justify-between">
                                <div>
                                    <p className="text-sm font-medium text-muted-foreground">Đã gửi</p>
                                    <p className="text-3xl font-bold mt-2">{stats.sent}</p>
                                </div>
                                <div className="w-12 h-12 rounded-full bg-green-100 flex items-center justify-center">
                                    <CheckCircle className="w-6 h-6 text-green-600" />
                                </div>
                            </div>
                        </CardContent>
                    </Card>

                    <Card>
                        <CardContent className="p-6">
                            <div className="flex items-center justify-between">
                                <div>
                                    <p className="text-sm font-medium text-muted-foreground">Thất bại</p>
                                    <p className="text-3xl font-bold mt-2">{stats.failed}</p>
                                </div>
                                <div className="w-12 h-12 rounded-full bg-red-100 flex items-center justify-center">
                                    <AlertCircle className="w-6 h-6 text-red-600" />
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                </div>

                {/* Filters & Actions */}
                <Card>
                    <CardHeader>
                        <div className="flex flex-col gap-4">
                            <div className="flex items-center justify-between">
                                <CardTitle>Danh sách events</CardTitle>
                                <div className="flex gap-2">
                                    <Button onClick={handleExport} variant="outline" size="sm" disabled={filteredEvents.length === 0}>
                                        <Download className="w-4 h-4 mr-2" />
                                        Export CSV
                                    </Button>
                                    <Button onClick={fetchEvents} variant="outline" size="sm">
                                        <RefreshCw className="w-4 h-4 mr-2" />
                                        Làm mới
                                    </Button>
                                </div>
                            </div>

                            {/* Search & Filters */}
                            <div className="flex flex-wrap gap-2">
                                <div className="relative flex-1 min-w-[200px]">
                                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                                    <Input
                                        placeholder="Tìm kiếm theo ID, type, error..."
                                        value={searchQuery}
                                        onChange={(e) => setSearchQuery(e.target.value)}
                                        className="pl-9"
                                    />
                                </div>

                                <Select value={statusFilter} onValueChange={setStatusFilter}>
                                    <SelectTrigger className="w-[160px]">
                                        <SelectValue placeholder="Trạng thái" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="ALL">Tất cả trạng thái</SelectItem>
                                        <SelectItem value="NEW">Mới</SelectItem>
                                        <SelectItem value="PROCESSING">Đang xử lý</SelectItem>
                                        <SelectItem value="SENT">Đã gửi</SelectItem>
                                        <SelectItem value="FAILED">Thất bại</SelectItem>
                                    </SelectContent>
                                </Select>

                                <Select value={typeFilter} onValueChange={setTypeFilter}>
                                    <SelectTrigger className="w-[180px]">
                                        <SelectValue placeholder="Loại event" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="ALL">Tất cả loại</SelectItem>
                                        {eventTypes.map((type) => (
                                            <SelectItem key={type} value={type}>
                                                {type}
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>

                                <div className="flex items-center gap-2 border rounded-md px-3">
                                    <Checkbox checked={autoRefresh} onCheckedChange={(checked) => setAutoRefresh(!!checked)} />
                                    <span className="text-sm">Auto-refresh ({refreshInterval}s)</span>
                                </div>
                            </div>

                            {/* Bulk Actions */}
                            {selectedIds.size > 0 && (
                                <div className="flex items-center gap-2 p-3 bg-muted rounded-lg">
                                    <span className="text-sm font-medium">{selectedIds.size} events đã chọn</span>
                                    <div className="flex gap-2 ml-auto">
                                        <Button size="sm" variant="outline" onClick={handleBulkRetry}>
                                            <RotateCcw className="w-4 h-4 mr-2" />
                                            Retry tất cả
                                        </Button>
                                        <Button size="sm" variant="destructive" onClick={handleBulkDelete}>
                                            <Trash2 className="w-4 h-4 mr-2" />
                                            Xóa tất cả
                                        </Button>
                                    </div>
                                </div>
                            )}
                        </div>
                    </CardHeader>
                    <CardContent>
                        {filteredEvents.length === 0 ? (
                            <EmptyState
                                icon={Clock}
                                title="Không có events"
                                description={
                                    searchQuery || statusFilter !== "ALL" || typeFilter !== "ALL"
                                        ? "Không có events nào phù hợp với bộ lọc."
                                        : "Chưa có events nào trong outbox."
                                }
                                action={
                                    searchQuery || statusFilter !== "ALL" || typeFilter !== "ALL"
                                        ? {
                                            label: "Xóa bộ lọc",
                                            onClick: () => {
                                                setSearchQuery("")
                                                setStatusFilter("ALL")
                                                setTypeFilter("ALL")
                                            },
                                        }
                                        : undefined
                                }
                            />
                        ) : (
                            <>
                                <DataTable columns={columns} data={filteredEvents} />
                                {totalPages > 1 && (
                                    <Pagination
                                        currentPage={currentPage}
                                        totalPages={totalPages}
                                        totalItems={totalItems}
                                        itemsPerPage={itemsPerPage}
                                        onPageChange={setCurrentPage}
                                        onItemsPerPageChange={(newItemsPerPage) => {
                                            setItemsPerPage(newItemsPerPage)
                                            setCurrentPage(1)
                                        }}
                                    />
                                )}
                            </>
                        )}
                    </CardContent>
                </Card>

                {/* Detail Dialog */}
                <Dialog open={!!detailEvent} onOpenChange={(open) => !open && setDetailEvent(null)}>
                    <DialogContent className="max-w-3xl max-h-[80vh] overflow-y-auto">
                        <DialogHeader>
                            <DialogTitle>Chi tiết Event #{detailEvent?.event_id}</DialogTitle>
                            <DialogDescription>Thông tin chi tiết về outbox event</DialogDescription>
                        </DialogHeader>

                        {detailEvent && (
                            <div className="space-y-4">
                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <label className="text-sm font-medium text-muted-foreground">Event ID</label>
                                        <p className="font-mono">#{detailEvent.event_id}</p>
                                    </div>
                                    <div>
                                        <label className="text-sm font-medium text-muted-foreground">Type</label>
                                        <p>
                                            <Badge variant="outline">{detailEvent.type}</Badge>
                                        </p>
                                    </div>
                                    <div>
                                        <label className="text-sm font-medium text-muted-foreground">Status</label>
                                        <p>{getStatusBadge(detailEvent.status)}</p>
                                    </div>
                                    <div>
                                        <label className="text-sm font-medium text-muted-foreground">Retry Count</label>
                                        <p>
                                            {detailEvent.retry_count}/{detailEvent.max_retries}
                                        </p>
                                    </div>
                                    <div>
                                        <label className="text-sm font-medium text-muted-foreground">Created At</label>
                                        <p className="text-sm">{formatDate(detailEvent.created_at, true)}</p>
                                        <p className="text-xs text-muted-foreground">{formatRelativeTime(detailEvent.created_at)}</p>
                                    </div>
                                    <div>
                                        <label className="text-sm font-medium text-muted-foreground">Updated At</label>
                                        <p className="text-sm">{formatDate(detailEvent.updated_at, true)}</p>
                                        <p className="text-xs text-muted-foreground">{formatRelativeTime(detailEvent.updated_at)}</p>
                                    </div>
                                    {detailEvent.sent_at && (
                                        <div>
                                            <label className="text-sm font-medium text-muted-foreground">Sent At</label>
                                            <p className="text-sm">{formatDate(detailEvent.sent_at, true)}</p>
                                            <p className="text-xs text-muted-foreground">{formatRelativeTime(detailEvent.sent_at)}</p>
                                        </div>
                                    )}
                                </div>

                                {detailEvent.last_error && (
                                    <div>
                                        <label className="text-sm font-medium text-muted-foreground">Error Message</label>
                                        <div className="mt-1 p-3 bg-red-50 border border-red-200 rounded-md">
                                            <p className="text-sm text-red-800">{detailEvent.last_error}</p>
                                        </div>
                                    </div>
                                )}

                                <div>
                                    <label className="text-sm font-medium text-muted-foreground">Payload</label>
                                    <pre className="mt-1 p-3 bg-muted rounded-md text-xs overflow-x-auto">
                                        {JSON.stringify(detailEvent.payload, null, 2)}
                                    </pre>
                                </div>

                                <div className="flex gap-2 justify-end">
                                    {detailEvent.status === "FAILED" && detailEvent.retry_count < detailEvent.max_retries && (
                                        <Button onClick={() => handleRetry(detailEvent.event_id)} disabled={retryingIds.has(detailEvent.event_id)}>
                                            <RefreshCw className="w-4 h-4 mr-2" />
                                            Retry Event
                                        </Button>
                                    )}
                                    {(detailEvent.status === "SENT" || detailEvent.status === "FAILED") && (
                                        <Button
                                            variant="destructive"
                                            onClick={() => {
                                                handleDelete(detailEvent.event_id)
                                                setDetailEvent(null)
                                            }}
                                            disabled={deletingIds.has(detailEvent.event_id)}
                                        >
                                            <Trash2 className="w-4 h-4 mr-2" />
                                            Xóa Event
                                        </Button>
                                    )}
                                </div>
                            </div>
                        )}
                    </DialogContent>
                </Dialog>
            </div>
        </DashboardLayout>
    )
}







