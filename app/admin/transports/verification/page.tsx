"use client"

import { useCallback, useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { useAuth } from "@/contexts/auth-context"
import { apiClient } from "@/lib/api-client"
import { DashboardLayout } from "@/components/dashboard/dashboard-layout"
import { AdminBreadcrumbs } from "@/components/admin/admin-breadcrumbs"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Input } from "@/components/ui/input"
import { ShieldCheck, CheckCircle, XCircle, Phone, MapPin, FileText, Search, RefreshCw } from "lucide-react"
import type { Transport, User } from "@/types"
import { useToast } from "@/hooks/use-toast"
import { adminNavItems } from "@/lib/admin-nav-config"
import { EmptyState } from "@/components/admin/empty-state"
import { logAuditAction } from "@/lib/audit-logger"
import { RejectTransportDialog } from "@/components/admin/reject-transport-dialog"
import { Pagination } from "@/components/admin/pagination"

interface TransportWithUser {
    transport: Transport
    user: Omit<User, "role">
}

export default function TransportVerificationPage() {
    const { user, loading } = useAuth()
    const router = useRouter()
    const { toast } = useToast()
    const [activeTab, setActiveTab] = useState<"pending" | "approved" | "rejected">("pending")
    const [transports, setTransports] = useState<TransportWithUser[]>([])
    const [isLoading, setIsLoading] = useState(true)
    const [searchTerm, setSearchTerm] = useState("")
    const [rejectDialogOpen, setRejectDialogOpen] = useState(false)
    const [selectedTransport, setSelectedTransport] = useState<TransportWithUser | null>(null)
    const [currentPage, setCurrentPage] = useState(1)
    const [itemsPerPage, setItemsPerPage] = useState(20)
    const [totalPages, setTotalPages] = useState(1)
    const [totalItems, setTotalItems] = useState(0)

    useEffect(() => {
        if (!loading && (!user || user.role !== "MANAGER")) {
            router.push("/login")
        }
    }, [user, loading, router])

    const fetchTransports = useCallback(async () => {
        setIsLoading(true)
        try {
            const statusMap = {
                pending: "PENDING" as const,
                approved: "APPROVED" as const,
                rejected: "REJECTED" as const,
            }
            const result = await apiClient.getTransportsByStatus(statusMap[activeTab], {
                search: searchTerm,
                page: currentPage,
                limit: itemsPerPage,
            })
            setTransports(result.data as TransportWithUser[])
            const totalItemsValue = result.total ?? result.pagination?.totalItems ?? 0
            const totalPagesValue = result.totalPages ?? result.pagination?.totalPages ?? 1
            setTotalItems(totalItemsValue)
            setTotalPages(totalPagesValue)
        } catch (error) {
            toast({
                title: "Lỗi",
                description: "Không thể tải danh sách công ty vận chuyển.",
                variant: "destructive",
            })
        } finally {
            setIsLoading(false)
        }
    }, [activeTab, searchTerm, currentPage, itemsPerPage, toast])

    useEffect(() => {
        fetchTransports()
    }, [fetchTransports])

    useEffect(() => {
        setCurrentPage(1)
    }, [activeTab, searchTerm])

    const handlePageChange = (page: number) => {
        setCurrentPage(page)
    }

    const handleItemsPerPageChange = (perPage: number) => {
        setItemsPerPage(perPage)
        setCurrentPage(1)
    }

    const handleApprove = async (transportId: number) => {
        try {
            await apiClient.verifyTransport(transportId, "APPROVED", "Approved by admin")
            await logAuditAction({
                action: "TRANSPORT_APPROVED",
                target_type: "TRANSPORT",
                target_id: transportId,
            })
            toast({
                title: "Thành công",
                description: "Đã phê duyệt công ty vận chuyển.",
            })
            fetchTransports()
        } catch (error) {
            toast({
                title: "Lỗi",
                description: "Không thể phê duyệt.",
                variant: "destructive",
            })
        }
    }

    const handleRejectClick = (transport: TransportWithUser) => {
        setSelectedTransport(transport)
        setRejectDialogOpen(true)
    }

    const handleRejectConfirm = async (reason: string) => {
        if (!selectedTransport) return

        try {
            await apiClient.verifyTransport(selectedTransport.transport.transportId, "REJECTED", reason)
            await logAuditAction({
                action: "TRANSPORT_REJECTED",
                target_type: "TRANSPORT",
                target_id: selectedTransport.transport.transportId,
                details: { reason },
            })
            toast({
                title: "Thành công",
                description: "Đã từ chối công ty vận chuyển.",
            })
            fetchTransports()
        } catch (error) {
            toast({
                title: "Lỗi",
                description: "Không thể từ chối.",
                variant: "destructive",
            })
        }
    }

    const renderTransportCard = (item: TransportWithUser, showActions = true) => {
    const { user: transportUser, transport } = item

    return (
    <Card className="border-2 hover:shadow-md transition-shadow">
                <CardContent className="p-6">
                    <div className="space-y-4">
                        {/* Header */}
                        <div className="flex items-start justify-between">
                            <div>
                                <h3 className="text-xl font-bold">{transport.companyName}</h3>
                                <p className="text-sm text-muted-foreground">{transportUser.email}</p>
                            </div>
                            <Badge
                                variant={
                                    transport.verificationStatus === "APPROVED"
                                        ? "default"
                                        : transport.verificationStatus === "REJECTED"
                                            ? "destructive"
                                            : "secondary"
                                }
                            >
                                {transport.verificationStatus === "APPROVED"
                                    ? "Đã phê duyệt"
                                    : transport.verificationStatus === "REJECTED"
                                        ? "Đã từ chối"
                                        : "Chờ xác minh"}
                            </Badge>
                        </div>

                        <Separator />

                        {/* Details Grid */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div className="space-y-3">
                                <div className="flex items-start gap-2">
                                    <FileText className="h-4 w-4 text-muted-foreground mt-0.5" />
                                    <div>
                                        <p className="text-sm font-medium">Giấy phép kinh doanh</p>
                                        <p className="text-sm text-muted-foreground">{transport.businessLicenseNumber}</p>
                                    </div>
                                </div>
                                <div className="flex items-start gap-2">
                                    <FileText className="h-4 w-4 text-muted-foreground mt-0.5" />
                                    <div>
                                        <p className="text-sm font-medium">Mã số thuế</p>
                                        <p className="text-sm text-muted-foreground">{transport.taxCode}</p>
                                    </div>
                                </div>
                                <div className="flex items-start gap-2">
                                    <Phone className="h-4 w-4 text-muted-foreground mt-0.5" />
                                    <div>
                                        <p className="text-sm font-medium">Số điện thoại</p>
                                        <p className="text-sm text-muted-foreground">{transport.phone}</p>
                                    </div>
                                </div>
                            </div>

                            <div className="space-y-3">
                                <div className="flex items-start gap-2">
                                    <MapPin className="h-4 w-4 text-muted-foreground mt-0.5" />
                                    <div>
                                        <p className="text-sm font-medium">Địa chỉ</p>
                                        <p className="text-sm text-muted-foreground">
                                            {transport.address}, {transport.district}, {transport.city}
                                        </p>
                                    </div>
                                </div>
                                {transport.nationalIdNumber && (
                                    <div className="flex items-start gap-2">
                                        <FileText className="h-4 w-4 text-muted-foreground mt-0.5" />
                                        <div>
                                            <p className="text-sm font-medium">{transport.nationalIdType}</p>
                                            <p className="text-sm text-muted-foreground">{transport.nationalIdNumber}</p>
                                        </div>
                                    </div>
                                )}
                                {transport.bankAccountNumber && (
                                    <div className="flex items-start gap-2">
                                        <FileText className="h-4 w-4 text-muted-foreground mt-0.5" />
                                        <div>
                                            <p className="text-sm font-medium">Tài khoản ngân hàng</p>
                                            <p className="text-sm text-muted-foreground">
                                                {transport.bankCode} - {transport.bankAccountNumber}
                                            </p>
                                            <p className="text-xs text-muted-foreground">{transport.bankAccountHolder}</p>
                                        </div>
                                    </div>
                                )}
                            </div>
                        </div>

                        <Separator />

                        {/* Documents */}
                        <div className="space-y-2">
                            <p className="text-sm font-medium">Tài liệu</p>
                            <div className="flex flex-wrap gap-4">
                                {transport.licensePhotoUrl ? (
                                    <a
                                        href={transport.licensePhotoUrl}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="text-sm text-accent-green hover:underline flex items-center gap-1"
                                    >
                                        <FileText className="h-4 w-4" />
                                        GPKD
                                    </a>
                                ) : (
                                    <span className="text-sm text-muted-foreground italic">Chưa có GPKD</span>
                                )}
                                {transport.insurancePhotoUrl && (
                                    <a
                                        href={transport.insurancePhotoUrl}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="text-sm text-accent-green hover:underline flex items-center gap-1"
                                    >
                                        <FileText className="h-4 w-4" />
                                        Bảo hiểm
                                    </a>
                                )}
                                {transport.nationalIdPhotoFrontUrl && (
                                    <a
                                        href={transport.nationalIdPhotoFrontUrl}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="text-sm text-accent-green hover:underline flex items-center gap-1"
                                    >
                                        <FileText className="h-4 w-4" />
                                        CCCD (Trước)
                                    </a>
                                )}
                                {transport.nationalIdPhotoBackUrl && (
                                    <a
                                        href={transport.nationalIdPhotoBackUrl}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="text-sm text-accent-green hover:underline flex items-center gap-1"
                                    >
                                        <FileText className="h-4 w-4" />
                                        CCCD (Sau)
                                    </a>
                                )}
                            </div>
                        </div>

                        {/* Show verification date and notes for approved/rejected */}
                        {(transport.verificationStatus === "APPROVED" || transport.verificationStatus === "REJECTED") && (
                            <>
                                <Separator />
                                <div className="text-sm text-muted-foreground">
                                    <p>
                                        {transport.verificationStatus === "APPROVED" ? "Phê duyệt" : "Từ chối"} lúc:{" "}
                                        {transport.verifiedAt ? new Date(transport.verifiedAt).toLocaleString("vi-VN") : "N/A"}
                                    </p>
                                    {transport.verificationNotes && (
                                        <p className="mt-1">
                                            Ghi chú: {transport.verificationNotes}
                                        </p>
                                    )}
                                </div>
                            </>
                        )}

                        {/* Actions */}
                        {showActions && (
                            <>
                                <Separator />
                                <div className="flex gap-3 justify-end">
                                    {transport.verificationStatus === "PENDING" && (
                                        <>
                                            <Button
                                                variant="outline"
                                                onClick={() => handleRejectClick(item)}
                                                className="text-error hover:text-error"
                                            >
                                                <XCircle className="mr-2 h-4 w-4" />
                                                Từ chối
                                            </Button>
                                            <Button
                                                onClick={() => handleApprove(transport.transportId)}
                                                className="bg-accent-green hover:bg-accent-green-dark"
                                            >
                                                <CheckCircle className="mr-2 h-4 w-4" />
                                                Phê duyệt
                                            </Button>
                                        </>
                                    )}
                                    {transport.verificationStatus === "REJECTED" && (
                                        <Button
                                            onClick={() => handleApprove(transport.transportId)}
                                            className="bg-accent-green hover:bg-accent-green-dark"
                                        >
                                            <RefreshCw className="mr-2 h-4 w-4" />
                                            Phê duyệt lại
                                        </Button>
                                    )}
                                </div>
                            </>
                        )}
                    </div>
                </CardContent>
            </Card>
        )
    }

    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-screen">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-accent-green" />
            </div>
        )
    }

    if (!user) return null

    return (
        <DashboardLayout navItems={adminNavItems} title="Xác minh vận chuyển">
            <div className="space-y-6">
                <AdminBreadcrumbs />

                <div>
                    <h1 className="text-3xl font-bold tracking-tight">Xác minh công ty vận chuyển</h1>
                    <p className="text-muted-foreground mt-1">Xem xét và phê duyệt các yêu cầu đăng ký.</p>
                </div>

                <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as typeof activeTab)}>
                    <TabsList className="grid w-full max-w-md grid-cols-3">
                        <TabsTrigger value="pending">Chờ xử lý</TabsTrigger>
                        <TabsTrigger value="approved">Đã phê duyệt</TabsTrigger>
                        <TabsTrigger value="rejected">Đã từ chối</TabsTrigger>
                    </TabsList>

                    <div className="mt-6">
                        <Card>
                            <CardHeader>
                                <div className="flex items-center justify-between gap-4">
                                    <CardTitle>
                                        {activeTab === "pending" && "Yêu cầu chờ xử lý"}
                                        {activeTab === "approved" && "Đã phê duyệt"}
                                        {activeTab === "rejected" && "Đã từ chối"}
                                    </CardTitle>
                                    <div className="flex items-center gap-4">
                                        <div className="relative">
                                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                                            <Input
                                                placeholder="Tìm kiếm công ty, email..."
                                                value={searchTerm}
                                                onChange={(e) => setSearchTerm(e.target.value)}
                                                className="pl-9 w-64"
                                            />
                                        </div>
                                        <Badge variant="secondary">{totalItems}</Badge>
                                    </div>
                                </div>
                            </CardHeader>
                            <CardContent>
                                {isLoading ? (
                                    <div className="flex items-center justify-center py-12">
                                        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-accent-green" />
                                    </div>
                                ) : transports.length === 0 ? (
                                    <EmptyState
                                        icon={ShieldCheck}
                                        title={
                                            activeTab === "pending"
                                                ? "Không có yêu cầu chờ xử lý"
                                                : activeTab === "approved"
                                                    ? "Chưa có công ty nào được phê duyệt"
                                                    : "Chưa có công ty nào bị từ chối"
                                        }
                                        description={
                                            activeTab === "pending"
                                                ? "Tất cả các yêu cầu xác minh đã được xử lý. Các yêu cầu mới sẽ xuất hiện ở đây."
                                                : activeTab === "approved"
                                                    ? "Các công ty đã được phê duyệt sẽ xuất hiện ở đây."
                                                    : "Các công ty bị từ chối sẽ xuất hiện ở đây. Bạn có thể phê duyệt lại nếu cần."
                                        }
                                    />
                                ) : (
                                    <>
                                        <div className="space-y-6">
                                            {transports.map((item) => (
                                                <div key={item.transport.transportId}>
                                                    {renderTransportCard(item, activeTab !== "approved")}
                                                </div>
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
                            </CardContent>
                        </Card>
                    </div>
                </Tabs>
            </div>

            <RejectTransportDialog
                open={rejectDialogOpen}
                onOpenChange={setRejectDialogOpen}
                onConfirm={handleRejectConfirm}
                companyName={selectedTransport?.transport.companyName || ""}
            />
        </DashboardLayout>
    )
}
