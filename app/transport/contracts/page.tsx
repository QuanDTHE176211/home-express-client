"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import useSWR from "swr"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { FileText, Search, Download, Eye, TrendingUp, FileCheck, Clock, DollarSign } from "lucide-react"
import { formatVND, formatDate } from "@/lib/format"
import { apiClient } from "@/lib/api-client"
import { DashboardLayout } from "@/components/dashboard/dashboard-layout"
import { Truck, Package, FileBarChart, Settings, DollarSignIcon } from "lucide-react"

const navItems = [
  { href: "/transport", label: "Tổng quan", icon: "Package" },
  { href: "/transport/jobs", label: "Công việc", icon: "Truck" },
  { href: "/transport/quotations", label: "Báo giá", icon: "FileText" },
  { href: "/transport/contracts", label: "Hợp đồng", icon: "FileText" },
  { href: "/transport/earnings", label: "Thu nhập", icon: "DollarSign" },
  { href: "/transport/settings", label: "Cài đặt", icon: "Settings" },
]

export default function TransportContractsPage() {
  const router = useRouter()
  const [searchTerm, setSearchTerm] = useState("")
  const [statusFilter, setStatusFilter] = useState<string>("all")
  const [currentPage, setCurrentPage] = useState(1)
  const itemsPerPage = 10

  const {
    data: contractsData,
    error,
    isLoading,
  } = useSWR(
    `/transport/contracts?status=${statusFilter}&search=${searchTerm}&page=${currentPage}&limit=${itemsPerPage}`,
    () =>
      apiClient.getTransportContracts({
        status: statusFilter === "all" ? undefined : statusFilter,
        search: searchTerm || undefined,
        page: currentPage,
        limit: itemsPerPage,
      }),
  )

  const contracts = contractsData?.contracts || []
  const stats = contractsData?.stats || {
    total_contracts: 0,
    active_contracts: 0,
    total_value: 0,
    average_value: 0,
  }
  const pagination = contractsData?.pagination || {
    currentPage: 1,
    totalPages: 1,
    totalItems: 0,
    itemsPerPage: 10,
  }

  const getStatusBadge = (status: string) => {
    const variants: Record<string, { variant: any; label: string; icon: any }> = {
      ACTIVE: { variant: "default", label: "Đang hiệu lực", icon: Clock },
      COMPLETED: { variant: "success", label: "Hoàn thành", icon: FileCheck },
      CANCELLED: { variant: "destructive", label: "Đã hủy", icon: FileText },
      EXPIRED: { variant: "secondary", label: "Hết hạn", icon: Clock },
    }
    const config = variants[status] || variants.ACTIVE
    const Icon = config.icon
    return (
      <Badge variant={config.variant} className="gap-1">
        <Icon className="h-3 w-3" />
        {config.label}
      </Badge>
    )
  }

  const handleExportCSV = () => {
    const csvContent = [
      ["Mã hợp đồng", "Khách hàng", "Giá trị", "Trạng thái", "Ngày tạo"].join(","),
      ...contracts.map((contract: any) =>
        [
          contract.contractNumber,
          contract.customerName,
          contract.totalAmount,
          contract.status,
          formatDate(contract.createdAt),
        ].join(","),
      ),
    ].join("\n")

    const blob = new Blob(["\uFEFF" + csvContent], { type: "text/csv;charset=utf-8;" })
    const link = document.createElement("a")
    link.href = URL.createObjectURL(blob)
    link.download = `contracts_${new Date().toISOString().split("T")[0]}.csv`
    link.click()
  }

  return (
    <DashboardLayout navItems={navItems} title="Hợp đồng">
      <div className="max-w-7xl mx-auto px-6 py-10">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-2">Quản lý hợp đồng</h1>
          <p className="text-muted-foreground">Xem và quản lý tất cả hợp đồng đã ký</p>
        </div>

        {/* Stats Cards */}
        <div className="grid gap-4 md:grid-cols-4 mb-8">
          <Card className="hover:shadow-md transition-shadow">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Tổng hợp đồng</CardTitle>
              <FileText className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.total_contracts}</div>
              <p className="text-xs text-muted-foreground">Tất cả hợp đồng</p>
            </CardContent>
          </Card>

          <Card className="hover:shadow-md transition-shadow">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Đang hiệu lực</CardTitle>
              <FileCheck className="h-4 w-4 text-accent-green" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-accent-green">{stats.active_contracts}</div>
              <p className="text-xs text-muted-foreground">Hợp đồng đang hoạt động</p>
            </CardContent>
          </Card>

          <Card className="hover:shadow-md transition-shadow">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Tổng giá trị</CardTitle>
              <DollarSign className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{formatVND(stats.total_value)}</div>
              <p className="text-xs text-muted-foreground">Tổng giá trị hợp đồng</p>
            </CardContent>
          </Card>

          <Card className="hover:shadow-md transition-shadow">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Giá trị TB</CardTitle>
              <TrendingUp className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{formatVND(stats.average_value)}</div>
              <p className="text-xs text-muted-foreground">Trung bình mỗi hợp đồng</p>
            </CardContent>
          </Card>
        </div>

        {/* Filters */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle>Danh sách hợp đồng</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-col md:flex-row gap-4 mb-6">
              <div className="flex-1 relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Tìm kiếm mã hợp đồng, khách hàng..."
                  value={searchTerm}
                  onChange={(e) => {
                    setSearchTerm(e.target.value)
                    setCurrentPage(1)
                  }}
                  className="pl-10"
                />
              </div>

              <Select
                value={statusFilter}
                onValueChange={(value) => {
                  setStatusFilter(value)
                  setCurrentPage(1)
                }}
              >
                <SelectTrigger className="w-full md:w-[200px]">
                  <SelectValue placeholder="Trạng thái" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Tất cả</SelectItem>
                  <SelectItem value="ACTIVE">Đang hiệu lực</SelectItem>
                  <SelectItem value="COMPLETED">Hoàn thành</SelectItem>
                  <SelectItem value="CANCELLED">Đã hủy</SelectItem>
                  <SelectItem value="EXPIRED">Hết hạn</SelectItem>
                </SelectContent>
              </Select>

              <Button onClick={handleExportCSV} variant="outline" className="gap-2 bg-transparent">
                <Download className="h-4 w-4" />
                Xuất CSV
              </Button>
            </div>

            {/* Contracts Table */}
            {isLoading ? (
              <div className="space-y-4">
                {[...Array(5)].map((_, i) => (
                  <div key={i} className="h-20 bg-muted animate-pulse rounded-lg" />
                ))}
              </div>
            ) : error ? (
              <div className="text-center py-12">
                <FileText className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <p className="text-muted-foreground">Không thể tải danh sách hợp đồng</p>
              </div>
            ) : contracts.length === 0 ? (
              <div className="text-center py-12">
                <FileText className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <p className="text-muted-foreground">Chưa có hợp đồng nào</p>
              </div>
            ) : (
              <div className="space-y-4">
                {contracts.map((contract: any) => (
                  <Card
                    key={contract.contractId}
                    className="hover:shadow-md transition-shadow cursor-pointer"
                    onClick={() => router.push(`/transport/contracts/${contract.contractId}`)}
                  >
                    <CardContent className="p-6">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center gap-3 mb-2">
                            <h3 className="font-semibold text-lg">{contract.contractNumber}</h3>
                            {getStatusBadge(contract.status)}
                          </div>
                          <div className="space-y-1 text-sm text-muted-foreground">
                            <p>
                              <span className="font-medium">Khách hàng:</span> {contract.customerName}
                            </p>
                            <p>
                              <span className="font-medium">Booking:</span> #{contract.bookingId}
                            </p>
                            <p>
                              <span className="font-medium">Ngày tạo:</span> {formatDate(contract.createdAt)}
                            </p>
                            {contract.effectiveDate && (
                              <p>
                                <span className="font-medium">Ngày hiệu lực:</span> {formatDate(contract.effectiveDate)}
                              </p>
                            )}
                          </div>
                        </div>
                        <div className="text-right">
                          <div className="text-2xl font-bold text-accent-green mb-2">
                            {formatVND(contract.totalAmount)}
                          </div>
                          <Button variant="outline" size="sm" className="gap-2 bg-transparent">
                            <Eye className="h-4 w-4" />
                            Xem chi tiết
                          </Button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}

            {/* Pagination */}
            {pagination.totalPages > 1 && (
              <div className="flex items-center justify-between mt-6">
                <p className="text-sm text-muted-foreground">
                  Hiển thị {(currentPage - 1) * itemsPerPage + 1} -{" "}
                  {Math.min(currentPage * itemsPerPage, pagination.totalItems)} trong tổng số {pagination.totalItems}{" "}
                  hợp đồng
                </p>
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                    disabled={currentPage === 1}
                  >
                    Trước
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setCurrentPage((p) => Math.min(pagination.totalPages, p + 1))}
                    disabled={currentPage === pagination.totalPages}
                  >
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

