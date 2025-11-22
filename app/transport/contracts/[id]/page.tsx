"use client"

import { use } from "react"
import { useRouter } from "next/navigation"
import useSWR from "swr"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Alert, AlertDescription } from "@/components/ui/alert"
import {
  Download,
  FileText,
  CheckCircle2,
  Clock,
  AlertCircle,
  ArrowLeft,
  Phone,
  Mail,
  BarChart3,
  Star,
} from "lucide-react"
import { formatVND, formatDate } from "@/lib/format"
import { apiClient } from "@/lib/api-client"
import { DashboardLayout } from "@/components/dashboard/dashboard-layout"
import { Truck, Package, FileBarChart, Settings, DollarSign } from "lucide-react"

const navItems = [
  { href: "/transport", label: "Tổng quan", icon: "Package" },
  { href: "/transport/jobs", label: "Công việc", icon: "Truck" },
  { href: "/transport/quotations", label: "Báo giá", icon: "FileText" },
  { href: "/transport/contracts", label: "Hợp đồng", icon: "FileText" },
  { href: "/transport/vehicles", label: "Xe", icon: "Truck" },
  { href: "/transport/earnings", label: "Thu nhập", icon: "DollarSign" },
  { href: "/transport/analytics", label: "Phân tích", icon: "TrendingUp" },
  { href: "/transport/reviews", label: "Đánh giá", icon: "Star" },
  { href: "/transport/settings", label: "Cài đặt", icon: "Settings" },
]

interface ContractDetailPageProps {
  params: Promise<{ id: string }>
}

export default function TransportContractDetailPage({ params }: ContractDetailPageProps) {
  const { id } = use(params)
  const router = useRouter()

  const {
    data: contract,
    error,
    isLoading,
  } = useSWR(`/contracts/${id}`, () => apiClient.getContract(Number.parseInt(id)))

  if (isLoading) {
    return (
      <DashboardLayout navItems={navItems} title="Hợp đồng">
        <div className="container max-w-4xl py-10">
          <div className="animate-pulse space-y-4">
            <div className="h-8 bg-muted rounded w-1/3" />
            <div className="h-64 bg-muted rounded" />
          </div>
        </div>
      </DashboardLayout>
    )
  }

  if (error || !contract) {
    return (
      <DashboardLayout navItems={navItems} title="Hợp đồng">
        <div className="container max-w-4xl py-10">
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>Không thể tải hợp đồng. Vui lòng thử lại sau.</AlertDescription>
          </Alert>
        </div>
      </DashboardLayout>
    )
  }

  const getStatusBadge = (status: string) => {
    const variants: Record<string, { variant: any; label: string }> = {
      ACTIVE: { variant: "default", label: "Đang hiệu lực" },
      COMPLETED: { variant: "success", label: "Hoàn thành" },
      CANCELLED: { variant: "destructive", label: "Đã hủy" },
      EXPIRED: { variant: "secondary", label: "Hết hạn" },
    }
    const config = variants[status] || variants.ACTIVE
    return <Badge variant={config.variant}>{config.label}</Badge>
  }

  const handleDownloadPDF = async () => {
    if (contract.contractPdfUrl) {
      window.open(contract.contractPdfUrl, "_blank")
    }
  }

  return (
    <DashboardLayout navItems={navItems} title="Hợp đồng">
      <div className="container max-w-4xl py-10">
        {/* Back Button */}
        <Button variant="ghost" onClick={() => router.back()} className="mb-6 gap-2">
          <ArrowLeft className="h-4 w-4" />
          Quay lại
        </Button>

        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-3xl font-bold mb-2">Hợp đồng vận chuyển</h1>
            <p className="text-muted-foreground">
              Mã hợp đồng: <span className="font-mono font-semibold">{contract.contractNumber}</span>
            </p>
          </div>
          {getStatusBadge(contract.status)}
        </div>

        {/* Contract Info */}
        <div className="space-y-6">
          {/* Parties */}
          <Card className="hover:shadow-md transition-shadow">
            <CardHeader>
              <CardTitle>Thông tin khách hàng</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground">Họ tên:</span>
                <span className="font-medium">{contract.customer.name}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground">Email:</span>
                <a
                  href={`mailto:${contract.customer.email}`}
                  className="font-medium hover:underline flex items-center gap-2"
                >
                  <Mail className="h-4 w-4" />
                  {contract.customer.email}
                </a>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground">Điện thoại:</span>
                <a
                  href={`tel:${contract.customer.phone}`}
                  className="font-medium hover:underline flex items-center gap-2"
                >
                  <Phone className="h-4 w-4" />
                  {contract.customer.phone}
                </a>
              </div>
            </CardContent>
          </Card>

          {/* Financial */}
          <Card className="hover:shadow-md transition-shadow">
            <CardHeader>
              <CardTitle>Thông tin tài chính</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex justify-between items-center p-4 bg-muted rounded-lg">
                <span className="text-lg font-medium">Tổng giá trị hợp đồng</span>
                <span className="text-2xl font-bold text-accent-green">{formatVND(contract.totalAmount)}</span>
              </div>
            </CardContent>
          </Card>

          {/* Terms */}
          <Card className="hover:shadow-md transition-shadow">
            <CardHeader>
              <CardTitle>Điều khoản hợp đồng</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {contract.termsAndConditions && (
                <div>
                  <h4 className="font-semibold mb-2">Điều khoản và điều kiện</h4>
                  <p className="text-sm text-muted-foreground whitespace-pre-wrap">{contract.termsAndConditions}</p>
                </div>
              )}

              {contract.paymentTerms && (
                <div>
                  <h4 className="font-semibold mb-2">Điều khoản thanh toán</h4>
                  <p className="text-sm text-muted-foreground whitespace-pre-wrap">{contract.paymentTerms}</p>
                </div>
              )}

              {contract.cancellationPolicy && (
                <div>
                  <h4 className="font-semibold mb-2">Chính sách hủy</h4>
                  <p className="text-sm text-muted-foreground whitespace-pre-wrap">{contract.cancellationPolicy}</p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Signatures */}
          <Card className="hover:shadow-md transition-shadow">
            <CardHeader>
              <CardTitle>Chữ ký điện tử</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid md:grid-cols-2 gap-6">
                {/* Customer Signature */}
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    {contract.customerSigned ? (
                      <CheckCircle2 className="h-5 w-5 text-success" />
                    ) : (
                      <Clock className="h-5 w-5 text-muted-foreground" />
                    )}
                    <span className="font-medium">Khách hàng</span>
                  </div>
                  {contract.customerSigned && contract.customerSignedAt ? (
                    <p className="text-sm text-muted-foreground">Đã ký vào {formatDate(contract.customerSignedAt)}</p>
                  ) : (
                    <p className="text-sm text-muted-foreground">Chưa ký</p>
                  )}
                </div>

                {/* Transport Signature */}
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    {contract.transportSigned ? (
                      <CheckCircle2 className="h-5 w-5 text-success" />
                    ) : (
                      <Clock className="h-5 w-5 text-muted-foreground" />
                    )}
                    <span className="font-medium">Đơn vị vận chuyển</span>
                  </div>
                  {contract.transportSigned && contract.transportSignedAt ? (
                    <p className="text-sm text-muted-foreground">Đã ký vào {formatDate(contract.transportSignedAt)}</p>
                  ) : (
                    <p className="text-sm text-muted-foreground">Chưa ký</p>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Dates */}
          <Card className="hover:shadow-md transition-shadow">
            <CardHeader>
              <CardTitle>Thời gian</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Ngày tạo</span>
                <span className="font-medium">{formatDate(contract.createdAt)}</span>
              </div>
              {contract.effectiveDate && (
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Ngày hiệu lực</span>
                  <span className="font-medium">{formatDate(contract.effectiveDate)}</span>
                </div>
              )}
              {contract.completionDate && (
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Ngày hoàn thành</span>
                  <span className="font-medium">{formatDate(contract.completionDate)}</span>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Actions */}
          <div className="flex gap-4">
            <Button
              onClick={handleDownloadPDF}
              disabled={!contract.contractPdfUrl}
              className="flex-1 bg-accent-green hover:bg-accent-green/90"
            >
              <Download className="mr-2 h-4 w-4" />
              Tải xuống PDF
            </Button>
            <Button
              variant="outline"
              onClick={() => router.push(`/transport/jobs/${contract.bookingId}`)}
              className="flex-1"
            >
              <FileText className="mr-2 h-4 w-4" />
              Xem booking
            </Button>
          </div>
        </div>
      </div>
    </DashboardLayout>
  )
}
