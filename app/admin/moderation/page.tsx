"use client"

import { useEffect, useState, useMemo } from "react"
import { DashboardLayout } from "@/components/dashboard/dashboard-layout"
import { AdminBreadcrumbs } from "@/components/admin/admin-breadcrumbs"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { ReportedReviewCard } from "@/components/admin/reported-review-card"
import { useAdminModeration } from "@/hooks/use-admin-moderation"
import { Loader2, AlertTriangle, CheckCircle, XCircle, Clock, Flag, Search } from "lucide-react"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { adminNavItems } from "@/lib/admin-nav-config"
import { EmptyState } from "@/components/admin/empty-state"
import { SortableHeader } from "@/components/admin/sortable-header"
import { Pagination } from "@/components/admin/pagination"
import { Input } from "@/components/ui/input"
import { useDebounce } from "@/hooks/use-debounce"
import { logAuditAction } from "@/lib/audit-logger"
import React from "react"

export default function ModerationPage() {
    const { reportedReviews, loading, error, fetchReportedReviews, moderateReview, updateReportStatus } =
        useAdminModeration()
    const [activeTab, setActiveTab] = useState("pending")
    const [sortConfig, setSortConfig] = useState<{ key: string; direction: "asc" | "desc" } | null>(null)
    const [currentPage, setCurrentPage] = useState(1)
    const [itemsPerPage, setItemsPerPage] = useState(20)
    const [searchQuery, setSearchQuery] = useState("")
    const debouncedSearch = useDebounce(searchQuery, 500)

    useEffect(() => {
        fetchReportedReviews(activeTab === "all" ? undefined : activeTab)
    }, [activeTab, fetchReportedReviews])

    useEffect(() => {
        fetchReportedReviews(activeTab === "all" ? undefined : activeTab)
    }, [debouncedSearch, activeTab, fetchReportedReviews])

    const handleRefresh = () => {
        fetchReportedReviews(activeTab === "all" ? undefined : activeTab)
    }

    const handleSort = (key: string) => {
        let direction: "asc" | "desc" = "asc"
        if (sortConfig && sortConfig.key === key && sortConfig.direction === "asc") {
            direction = "desc"
        }
        setSortConfig({ key, direction })
    }

    const filteredAndSortedReviews = React.useMemo(() => {
        let filtered = reportedReviews

        if (debouncedSearch) {
            const query = debouncedSearch.toLowerCase()
            filtered = reportedReviews.filter(
                (report) =>
                    report.review.reviewer_name.toLowerCase().includes(query) ||
                    report.review.comment?.toLowerCase().includes(query) ||
                    report.reporter_name.toLowerCase().includes(query) ||
                    report.reason.toLowerCase().includes(query),
            )
        }

        if (!sortConfig) return filtered

        const sorted = [...filtered].sort((a, b) => {
            let aValue: any
            let bValue: any

            switch (sortConfig.key) {
                case "created_at":
                    aValue = new Date(a.created_at).getTime()
                    bValue = new Date(b.created_at).getTime()
                    break
                case "status":
                    aValue = a.status
                    bValue = b.status
                    break
                default:
                    return 0
            }

            if (aValue < bValue) return sortConfig.direction === "asc" ? -1 : 1
            if (aValue > bValue) return sortConfig.direction === "asc" ? 1 : -1
            return 0
        })

        return sorted
    }, [reportedReviews, sortConfig, debouncedSearch])

    const totalItems = filteredAndSortedReviews.length
    const totalPages = Math.ceil(totalItems / itemsPerPage)
    const startIndex = (currentPage - 1) * itemsPerPage
    const endIndex = startIndex + itemsPerPage
    const paginatedReviews = filteredAndSortedReviews.slice(startIndex, endIndex)

    const handlePageChange = (page: number) => {
        setCurrentPage(page)
    }

    const handleItemsPerPageChange = (perPage: number) => {
        setItemsPerPage(perPage)
        setCurrentPage(1)
    }

    const handleModerateWithAudit = async (reviewId: number, action: any) => {
        const success = await moderateReview(reviewId, action)
        if (success) {
            if (action.action === "approve") {
                await logAuditAction({
                    action: "REVIEW_APPROVED",
                    target_type: "REVIEW",
                    target_id: reviewId,
                })
            } else if (action.action === "hide" || action.action === "delete") {
                await logAuditAction({
                    action: "REVIEW_REJECTED",
                    target_type: "REVIEW",
                    target_id: reviewId,
                    details: { reason: action.reason, action_type: action.action },
                })
            }
        }
        return success
    }

    const stats = {
        pending: reportedReviews.filter((r) => r.status === "pending").length,
        reviewed: reportedReviews.filter((r) => r.status === "reviewed").length,
        resolved: reportedReviews.filter((r) => r.status === "resolved").length,
        dismissed: reportedReviews.filter((r) => r.status === "dismissed").length,
    }

    return (
        <DashboardLayout navItems={adminNavItems} title="Kiểm duyệt">
            <div className="space-y-6">
                <AdminBreadcrumbs />

                <div>
                    <h1 className="text-2xl font-bold">Kiểm duyệt nội dung</h1>
                    <p className="text-muted-foreground">Quản lý các báo cáo và nội dung vi phạm</p>
                </div>

                <div className="grid gap-4 md:grid-cols-4">
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
                            <CardTitle className="text-sm font-medium">Đã xem</CardTitle>
                            <AlertTriangle className="h-4 w-4 text-muted-foreground" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold">{stats.reviewed}</div>
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium">Đã giải quyết</CardTitle>
                            <CheckCircle className="h-4 w-4 text-muted-foreground" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold">{stats.resolved}</div>
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium">Đã bỏ qua</CardTitle>
                            <XCircle className="h-4 w-4 text-muted-foreground" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold">{stats.dismissed}</div>
                        </CardContent>
                    </Card>
                </div>

                <Tabs value={activeTab} onValueChange={(value) => { setActiveTab(value); setCurrentPage(1); }}>
                    <TabsList>
                        <TabsTrigger value="pending">Chờ xử lý ({stats.pending})</TabsTrigger>
                        <TabsTrigger value="reviewed">Đã xem ({stats.reviewed})</TabsTrigger>
                        <TabsTrigger value="resolved">Đã giải quyết ({stats.resolved})</TabsTrigger>
                        <TabsTrigger value="dismissed">Đã bỏ qua ({stats.dismissed})</TabsTrigger>
                        <TabsTrigger value="all">Tất cả</TabsTrigger>
                    </TabsList>

                    <TabsContent value={activeTab} className="mt-6">
                        <div className="mb-4 flex items-center justify-between gap-4">
                            <div className="relative flex-1 max-w-md">
                                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                                <Input
                                    placeholder="Tìm kiếm theo tên khách hàng, nội dung đánh giá, lý do báo cáo..."
                                    value={searchQuery}
                                    onChange={(e) => {
                                        setSearchQuery(e.target.value)
                                        setCurrentPage(1)
                                    }}
                                    className="pl-9"
                                />
                            </div>
                            {!loading && !error && filteredAndSortedReviews.length > 0 && (
                                <div className="flex items-center gap-4">
                                    <span className="text-sm text-muted-foreground">Sắp xếp:</span>
                                    <SortableHeader label="Ngày tạo" sortKey="created_at" currentSort={sortConfig} onSort={handleSort} />
                                    <SortableHeader label="Trạng thái" sortKey="status" currentSort={sortConfig} onSort={handleSort} />
                                </div>
                            )}
                        </div>

                        {loading && reportedReviews.length === 0 ? (
                            <div className="flex items-center justify-center py-12">
                                <Loader2 className="h-8 w-8 animate-spin" />
                            </div>
                        ) : error ? (
                            <Alert variant="destructive">
                                <AlertDescription>{error}</AlertDescription>
                            </Alert>
                        ) : filteredAndSortedReviews.length === 0 ? (
                            <EmptyState
                                icon={Flag}
                                title={debouncedSearch ? "Không tìm thấy kết quả" : "Không có báo cáo nào"}
                                description={
                                    debouncedSearch
                                        ? "Thử thay đổi từ khóa tìm kiếm hoặc xóa bộ lọc."
                                        : activeTab === "pending"
                                            ? "Không có báo cáo nào đang chờ xử lý. Các báo cáo mới sẽ xuất hiện ở đây."
                                            : `Không có báo cáo nào trong trạng thái "${activeTab}".`
                                }
                                action={
                                    debouncedSearch
                                        ? {
                                            label: "Xóa tìm kiếm",
                                            onClick: () => setSearchQuery(""),
                                        }
                                        : activeTab !== "pending"
                                            ? {
                                                label: "Xem tất cả",
                                                onClick: () => setActiveTab("all"),
                                            }
                                            : undefined
                                }
                            />
                        ) : (
                            <>
                                <div className="space-y-4">
                                    {paginatedReviews.map((report) => (
                                        <ReportedReviewCard
                                            key={report.report_id}
                                            report={report}
                                            onModerate={handleModerateWithAudit}
                                            onUpdateStatus={updateReportStatus}
                                            onRefresh={handleRefresh}
                                        />
                                    ))}
                                </div>

                                {totalPages > 1 && (
                                    <Pagination
                                        currentPage={currentPage}
                                        totalPages={totalPages}
                                        totalItems={totalItems}
                                        itemsPerPage={itemsPerPage}
                                        onPageChange={handlePageChange}
                                        onItemsPerPageChange={handleItemsPerPageChange}
                                    />
                                )}
                            </>
                        )}
                    </TabsContent>
                </Tabs>
            </div>
        </DashboardLayout>
    )
}
