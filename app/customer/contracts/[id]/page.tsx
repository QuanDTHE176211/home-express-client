"use client"

import { use } from "react"
import { useRouter } from "next/navigation"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Download, CheckCircle2, Clock, AlertCircle } from "lucide-react"
import { formatVND, formatDate } from "@/lib/format"
import { apiClient } from "@/lib/api-client"
import useSWR from "swr"
import { DashboardLayout } from "@/components/dashboard/dashboard-layout"
import { FileTextIcon } from "lucide-react"
import { navItems } from "@/lib/customer-nav-config"

interface ContractPageProps {
  params: Promise<{ id: string }>
}

export default function ContractPage({ params }: ContractPageProps) {
  const { id } = use(params)
  const router = useRouter()

  const {
    data: contract,
    error,
    isLoading,
  } = useSWR(`/contracts/${id}`, () => apiClient.getContract(Number.parseInt(id)))

  if (isLoading) {
    return (
      <DashboardLayout navItems={navItems} title="Contract Detail">
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
      <DashboardLayout navItems={navItems} title="Contract Detail">
        <div className="container max-w-4xl py-10">
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>KhÃ´ng thá»ƒ táº£i há»£p Ä‘á»“ng. Vui lÃ²ng thá»­ láº¡i sau.</AlertDescription>
          </Alert>
        </div>
      </DashboardLayout>
    )
  }

  const getStatusBadge = (status: string) => {
    const variants: Record<string, { variant: any; label: string }> = {
      draft: { variant: "secondary", label: "NhÃ¡p" },
      active: { variant: "default", label: "Äang hiá»‡u lá»±c" },
      completed: { variant: "success", label: "HoÃ n thÃ nh" },
      cancelled: { variant: "destructive", label: "ÄÃ£ há»§y" },
      disputed: { variant: "warning", label: "Tranh cháº¥p" },
    }
    const config = variants[status] || variants.draft
    return <Badge variant={config.variant}>{config.label}</Badge>
  }

  const handleDownloadPDF = async () => {
    if (contract.contractPdfUrl) {
      window.open(contract.contractPdfUrl, "_blank")
    }
  }

  return (
    <DashboardLayout navItems={navItems} title="Contract Detail">
      <div className="container max-w-4xl py-10">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-3xl font-bold mb-2">Há»£p Ä‘á»“ng váº­n chuyá»ƒn</h1>
            <p className="text-muted-foreground">
              MÃ£ há»£p Ä‘á»“ng: <span className="font-mono font-semibold">{contract.contractNumber}</span>
            </p>
          </div>
          {getStatusBadge(contract.status)}
        </div>

        {/* Contract Info */}
        <div className="space-y-6">
          {/* Parties */}
          <Card>
            <CardHeader>
              <CardTitle>CÃ¡c bÃªn tham gia</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid md:grid-cols-2 gap-6">
                {/* Customer */}
                <div>
                  <h3 className="font-semibold mb-2">BÃªn A - KhÃ¡ch hÃ ng</h3>
                  <div className="space-y-1 text-sm">
                    <p>
                      <span className="text-muted-foreground">Há» tÃªn:</span> {contract.customer.name}
                    </p>
                    <p>
                      <span className="text-muted-foreground">Email:</span> {contract.customer.email}
                    </p>
                    <p>
                      <span className="text-muted-foreground">Äiá»‡n thoáº¡i:</span> {contract.customer.phone}
                    </p>
                  </div>
                </div>

                {/* Transport */}
                <div>
                  <h3 className="font-semibold mb-2">BÃªn B - ÄÆ¡n vá»‹ váº­n chuyá»ƒn</h3>
                  <div className="space-y-1 text-sm">
                    <p>
                      <span className="text-muted-foreground">CÃ´ng ty:</span> {contract.transport.companyName}
                    </p>
                    <p>
                      <span className="text-muted-foreground">Email:</span> {contract.transport.email}
                    </p>
                    <p>
                      <span className="text-muted-foreground">Äiá»‡n thoáº¡i:</span> {contract.transport.phone}
                    </p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Financial */}
          <Card>
            <CardHeader>
              <CardTitle>ThÃ´ng tin tÃ i chÃ­nh</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex justify-between items-center p-4 bg-muted rounded-lg">
                <span className="text-lg font-medium">Tá»•ng giÃ¡ trá»‹ há»£p Ä‘á»“ng</span>
                <span className="text-2xl font-bold text-primary">{formatVND(contract.totalAmount)}</span>
              </div>
            </CardContent>
          </Card>

          {/* Terms */}
          <Card>
            <CardHeader>
              <CardTitle>Äiá»u khoáº£n há»£p Ä‘á»“ng</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {contract.termsAndConditions && (
                <div>
                  <h4 className="font-semibold mb-2">Äiá»u khoáº£n vÃ  Ä‘iá»u kiá»‡n</h4>
                  <p className="text-sm text-muted-foreground whitespace-pre-wrap">{contract.termsAndConditions}</p>
                </div>
              )}

              {contract.paymentTerms && (
                <div>
                  <h4 className="font-semibold mb-2">Äiá»u khoáº£n thanh toÃ¡n</h4>
                  <p className="text-sm text-muted-foreground whitespace-pre-wrap">{contract.paymentTerms}</p>
                </div>
              )}

              {contract.cancellationPolicy && (
                <div>
                  <h4 className="font-semibold mb-2">ChÃ­nh sÃ¡ch há»§y</h4>
                  <p className="text-sm text-muted-foreground whitespace-pre-wrap">{contract.cancellationPolicy}</p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Signatures */}
          <Card>
            <CardHeader>
              <CardTitle>Chá»¯ kÃ½ Ä‘iá»‡n tá»­</CardTitle>
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
                    <span className="font-medium">KhÃ¡ch hÃ ng</span>
                  </div>
                  {contract.customerSigned && contract.customerSignedAt ? (
                    <p className="text-sm text-muted-foreground">ÄÃ£ kÃ½ vÃ o {formatDate(contract.customerSignedAt)}</p>
                  ) : (
                    <p className="text-sm text-muted-foreground">ChÆ°a kÃ½</p>
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
                    <span className="font-medium">ÄÆ¡n vá»‹ váº­n chuyá»ƒn</span>
                  </div>
                  {contract.transportSigned && contract.transportSignedAt ? (
                    <p className="text-sm text-muted-foreground">ÄÃ£ kÃ½ vÃ o {formatDate(contract.transportSignedAt)}</p>
                  ) : (
                    <p className="text-sm text-muted-foreground">ChÆ°a kÃ½</p>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Dates */}
          <Card>
            <CardHeader>
              <CardTitle>Thá»i gian</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-muted-foreground">NgÃ y táº¡o</span>
                <span className="font-medium">{formatDate(contract.createdAt)}</span>
              </div>
              {contract.effectiveDate && (
                <div className="flex justify-between">
                  <span className="text-muted-foreground">NgÃ y hiá»‡u lá»±c</span>
                  <span className="font-medium">{formatDate(contract.effectiveDate)}</span>
                </div>
              )}
              {contract.completionDate && (
                <div className="flex justify-between">
                  <span className="text-muted-foreground">NgÃ y hoÃ n thÃ nh</span>
                  <span className="font-medium">{formatDate(contract.completionDate)}</span>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Actions */}
          <div className="flex gap-4">
            <Button onClick={handleDownloadPDF} disabled={!contract.contractPdfUrl} className="flex-1">
              <Download className="mr-2 h-4 w-4" />
              Táº£i xuá»‘ng PDF
            </Button>
            <Button
              variant="outline"
              onClick={() => router.push(`/customer/bookings/${contract.bookingId}`)}
              className="flex-1"
            >
              <FileTextIcon className="mr-2 h-4 w-4" />
              Xem booking
            </Button>
          </div>
        </div>
      </div>
    </DashboardLayout>
  )
}

