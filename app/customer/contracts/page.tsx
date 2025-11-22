"use client"

import { useState } from "react"
import Link from "next/link"
import { DashboardLayout } from "@/components/dashboard/dashboard-layout"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Search, FileText, Download, Eye, CheckCircle2, Clock } from "lucide-react"
import { customerNavItems } from "@/lib/customer-nav-config"
import { useDebounce } from "@/lib/debounce"
import useSWR from "swr"
import { apiClient } from "@/lib/api-client"
import { formatVND, formatDate } from "@/lib/format"

export default function ContractsPage() {
  const [searchQuery, setSearchQuery] = useState("")
  const debouncedSearch = useDebounce(searchQuery, 300)

  const { data: contracts, isLoading } = useSWR("/customer/contracts", () => apiClient.getCustomerContracts())

  const filteredContracts = (contracts || []).filter((contract) => {
    if (!debouncedSearch) return true
    const query = debouncedSearch.toLowerCase()
    return (
      contract.contractNumber.toLowerCase().includes(query) ||
      contract.transport.companyName.toLowerCase().includes(query)
    )
  })

  const getStatusBadge = (status: string) => {
    const variants: Record<string, { variant: any; label: string }> = {
      draft: { variant: "secondary", label: "Nháp" },
      active: { variant: "default", label: "Đang hiệu lực" },
      completed: { variant: "default", label: "Hoàn thành" },
      cancelled: { variant: "destructive", label: "Đã hủy" },
      disputed: { variant: "warning", label: "Tranh chấp" },
    }
    const config = variants[status] || variants.draft
    return (
      <Badge
        variant={config.variant}
        className={status === "completed" ? "bg-accent-green/10 text-accent-green border-accent-green" : ""}
      >
        {config.label}
      </Badge>
    )
  }

  return (
    <DashboardLayout navItems={customerNavItems} title="Hợp đồng">
      <div className="max-w-7xl mx-auto px-6 py-10 space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Hợp đồng của tôi</h1>
          <p className="text-muted-foreground mt-1">Quản lý tất cả các hợp đồng vận chuyển đã ký</p>
        </div>

        {/* Search */}
        <div className="relative max-w-md">
          <Search
            className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground"
            aria-hidden="true"
          />
          <Input
            placeholder="Tìm theo mã hợp đồng hoặc công ty..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10 h-11"
            aria-label="Tìm kiếm hợp đồng"
          />
        </div>

        {/* Contracts List */}
        {isLoading ? (
          <div className="space-y-4">
            {[...Array(3)].map((_, i) => (
              <Card key={i} className="animate-pulse">
                <CardContent className="p-6">
                  <div className="h-32 bg-muted rounded" />
                </CardContent>
              </Card>
            ))}
          </div>
        ) : filteredContracts.length === 0 ? (
          <Card>
            <CardContent className="flex flex-col items-center justify-center py-12">
              <FileText className="h-12 w-12 text-muted-foreground mb-4" />
              <p className="text-lg font-medium mb-2">Chưa có hợp đồng</p>
              <p className="text-sm text-muted-foreground mb-4">
                {searchQuery ? "Không tìm thấy hợp đồng nào" : "Bạn chưa có hợp đồng nào"}
              </p>
              {!searchQuery && (
                <Button asChild className="bg-accent-green hover:bg-accent-green-dark">
                  <Link href="/customer/bookings/create">Tạo chuyến đi mới</Link>
                </Button>
              )}
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-4">
            {filteredContracts.map((contract) => (
              <Card key={contract.contractId} className="hover:shadow-md transition-shadow">
                <CardContent className="p-6">
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1 space-y-3">
                      {/* Header */}
                      <div className="flex items-center gap-3">
                        <FileText className="h-5 w-5 text-muted-foreground" />
                        <div>
                          <p className="font-mono font-semibold">{contract.contractNumber}</p>
                          <p className="text-sm text-muted-foreground">{contract.transport.companyName}</p>
                        </div>
                        {getStatusBadge(contract.status)}
                      </div>

                      {/* Details */}
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                        <div>
                          <p className="text-muted-foreground">Ngày tạo</p>
                          <p className="font-medium">{formatDate(contract.createdAt)}</p>
                        </div>
                        {contract.effectiveDate && (
                          <div>
                            <p className="text-muted-foreground">Ngày hiệu lực</p>
                            <p className="font-medium">{formatDate(contract.effectiveDate)}</p>
                          </div>
                        )}
                        <div>
                          <p className="text-muted-foreground">Giá trị</p>
                          <p className="font-semibold text-accent-green">{formatVND(contract.totalAmount)}</p>
                        </div>
                        <div>
                          <p className="text-muted-foreground">Booking</p>
                          <Link
                            href={`/customer/bookings/${contract.bookingId}`}
                            className="font-mono text-sm text-accent-green hover:underline"
                          >
                            #{contract.bookingId}
                          </Link>
                        </div>
                      </div>

                      {/* Signatures */}
                      <div className="flex items-center gap-6 pt-2 border-t">
                        <div className="flex items-center gap-2 text-sm">
                          {contract.customerSigned ? (
                            <CheckCircle2 className="h-4 w-4 text-success" />
                          ) : (
                            <Clock className="h-4 w-4 text-muted-foreground" />
                          )}
                          <span className={contract.customerSigned ? "text-success" : "text-muted-foreground"}>
                            Khách hàng {contract.customerSigned ? "đã ký" : "chưa ký"}
                          </span>
                        </div>
                        <div className="flex items-center gap-2 text-sm">
                          {contract.transportSigned ? (
                            <CheckCircle2 className="h-4 w-4 text-success" />
                          ) : (
                            <Clock className="h-4 w-4 text-muted-foreground" />
                          )}
                          <span className={contract.transportSigned ? "text-success" : "text-muted-foreground"}>
                            Vận chuyển {contract.transportSigned ? "đã ký" : "chưa ký"}
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Actions */}
                    <div className="flex flex-col gap-2">
                      <Button variant="outline" size="sm" asChild>
                        <Link href={`/customer/contracts/${contract.contractId}`}>
                          <Eye className="mr-2 h-4 w-4" />
                          Xem
                        </Link>
                      </Button>
                      {contract.contractPdfUrl && (
                        <Button variant="outline" size="sm" asChild>
                          <a href={contract.contractPdfUrl} target="_blank" rel="noopener noreferrer">
                            <Download className="mr-2 h-4 w-4" />
                            PDF
                          </a>
                        </Button>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </DashboardLayout>
  )
}
