"use client"

import { useState, useEffect, Suspense } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { useLanguage } from "@/contexts/language-context"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { Label } from "@/components/ui/label"
import { Separator } from "@/components/ui/separator"
import { CheckCircle2, AlertCircle, CreditCard, Smartphone, Building2, Copy, Check, RefreshCw } from "lucide-react"
import { BookingFlowBreadcrumb } from "@/components/customer/booking-flow-breadcrumb"
import PaymentWatcher from "./payment-watcher"
import { apiClient } from "@/lib/api-client"
import { formatVND } from "@/lib/currency"
import { toast } from "sonner"
import type { BookingDetailResponse, BankInfo, PaymentMethod } from "@/types"

function CheckoutPageContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const bookingId = Number(searchParams.get("bookingId"))
  const { t } = useLanguage()

  const [booking, setBooking] = useState<BookingDetailResponse | null>(null)
  const [bankInfo, setBankInfo] = useState<BankInfo | null>(null)
  const [loading, setLoading] = useState(true)
  const [processing, setProcessing] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>("vnpay")
  const [copied, setCopied] = useState(false)
  const [paymentInitiated, setPaymentInitiated] = useState(false)

  useEffect(() => {
    if (!bookingId || isNaN(bookingId)) {
      toast.error("Không tìm thấy booking ID")
      router.push("/customer/bookings/create")
      return
    }

    const loadData = async () => {
      try {
        const [bookingData, bankData] = await Promise.all([
          apiClient.getBookingDetail(bookingId),
          apiClient.getBankInfo(),
        ])

        setBooking(bookingData)
        setBankInfo(bankData)
      } catch (err) {
        console.error("Failed to load checkout data:", err)
        setError(err instanceof Error ? err.message : "Có lỗi xảy ra")
      } finally {
        setLoading(false)
      }
    }

    loadData()
  }, [bookingId, router])

  const handleRetryLoad = () => {
    setError(null)
    setLoading(true)
    
    const loadData = async () => {
      try {
        const [bookingData, bankData] = await Promise.all([
          apiClient.getBookingDetail(bookingId),
          apiClient.getBankInfo(),
        ])
        setBooking(bookingData)
        setBankInfo(bankData)
      } catch (err) {
        console.error("Failed to load checkout data:", err)
        setError(err instanceof Error ? err.message : "Có lỗi xảy ra")
      } finally {
        setLoading(false)
      }
    }
    loadData()
  }

  const handleCopy = (text: string) => {
    navigator.clipboard.writeText(text)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
    toast.success("Đã sao chép!")
  }

  const handlePayment = async () => {
    if (!booking) return

    setProcessing(true)
    setError(null)

    try {
      const response = await apiClient.initiateDeposit({
        bookingId: booking.booking.booking_id,
        method: paymentMethod,
      })

      if (paymentMethod === "vnpay" || paymentMethod === "momo") {
        if (response.paymentUrl) {
          window.location.href = response.paymentUrl
        } else if (response.bookingId) {
          toast.success("Thanh toán thành công!")
          router.replace(`/customer/bookings/${response.bookingId}`)
        }
      } else {
        setPaymentInitiated(true)
        toast.success("Vui lòng chuyển khoản theo thông tin bên dưới")
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "Có lỗi xảy ra"
      setError(errorMessage)
      toast.error(errorMessage)
      setProcessing(false)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-background to-muted/20 py-8 px-4">
        <div className="max-w-5xl mx-auto">
          <BookingFlowBreadcrumb currentStep={5} />
          <Card>
            <CardContent className="p-12 text-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4" />
              <p className="text-muted-foreground">Đang tải...</p>
            </CardContent>
          </Card>
        </div>
      </div>
    )
  }

  if (!booking || !bankInfo) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-background to-muted/20 py-8 px-4">
        <div className="max-w-5xl mx-auto">
          <BookingFlowBreadcrumb currentStep={5} />
          <Card>
            <CardContent className="p-12 text-center space-y-4">
              <AlertCircle className="h-12 w-12 text-destructive mx-auto" />
              <p className="text-lg font-semibold">Không tìm thấy thông tin đơn hàng</p>
              {error && <p className="text-sm text-muted-foreground">{error}</p>}
              <div className="flex gap-3 justify-center">
                <Button variant="outline" onClick={handleRetryLoad}>
                  <RefreshCw className="h-4 w-4 mr-2" />
                  Thử lại
                </Button>
                <Button onClick={() => router.push("/customer/bookings/create")}>Quay lại</Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    )
  }

  const depositAmount = Math.round((booking.booking.final_price || 0) * 0.3)
  const transferContent = `HOMEEXPRESS ${bookingId}`

  return (
    <div className="min-h-screen bg-gradient-to-b from-background to-muted/20 py-8 px-4">
      <div className="max-w-5xl mx-auto">
        <BookingFlowBreadcrumb currentStep={5} />
        <div className="grid lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <CreditCard className="h-5 w-5" />
                  Phương thức thanh toán
                </CardTitle>
                <CardDescription>Chọn phương thức thanh toán đặt cọc 30%</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <RadioGroup value={paymentMethod} onValueChange={(value: any) => setPaymentMethod(value)}>
                  <div className="flex items-center space-x-3 border rounded-lg p-4 cursor-pointer hover:bg-muted/50 transition-colors">
                    <RadioGroupItem value="vnpay" id="vnpay" />
                    <Label htmlFor="vnpay" className="flex items-center gap-3 cursor-pointer flex-1">
                      <div className="h-10 w-10 rounded bg-primary/10 flex items-center justify-center">
                        <CreditCard className="h-5 w-5 text-primary" />
                      </div>
                      <div>
                        <p className="font-semibold">VNPay</p>
                        <p className="text-sm text-muted-foreground">Thanh toán qua VNPay</p>
                      </div>
                    </Label>
                  </div>

                  <div className="flex items-center space-x-3 border rounded-lg p-4 cursor-pointer hover:bg-muted/50 transition-colors">
                    <RadioGroupItem value="momo" id="momo" />
                    <Label htmlFor="momo" className="flex items-center gap-3 cursor-pointer flex-1">
                      <div className="h-10 w-10 rounded bg-pink-100 flex items-center justify-center">
                        <Smartphone className="h-5 w-5 text-pink-600" />
                      </div>
                      <div>
                        <p className="font-semibold">MoMo</p>
                        <p className="text-sm text-muted-foreground">Ví điện tử MoMo</p>
                      </div>
                    </Label>
                  </div>

                  <div className="flex items-center space-x-3 border rounded-lg p-4 cursor-pointer hover:bg-muted/50 transition-colors">
                    <RadioGroupItem value="bank" id="bank" />
                    <Label htmlFor="bank" className="flex items-center gap-3 cursor-pointer flex-1">
                      <div className="h-10 w-10 rounded bg-blue-100 flex items-center justify-center">
                        <Building2 className="h-5 w-5 text-blue-600" />
                      </div>
                      <div>
                        <p className="font-semibold">Chuyển khoản ngân hàng</p>
                        <p className="text-sm text-muted-foreground">Chuyển khoản trực tiếp</p>
                      </div>
                    </Label>
                  </div>
                </RadioGroup>

                {paymentMethod === "bank" && (
                  <Alert>
                    <Building2 className="h-4 w-4" />
                    <AlertDescription>
                      <div className="space-y-2 mt-2">
                        <div className="flex justify-between items-center">
                          <span className="text-sm text-muted-foreground">Ngân hàng:</span>
                          <span className="font-semibold">{bankInfo.bank}</span>
                        </div>
                        <Separator />
                        <div className="flex justify-between items-center">
                          <span className="text-sm text-muted-foreground">Số tài khoản:</span>
                          <div className="flex items-center gap-2">
                            <span className="font-semibold">{bankInfo.accountNumber}</span>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-6 w-6"
                              onClick={() => handleCopy(bankInfo.accountNumber || "")}
                            >
                              {copied ? <Check className="h-3 w-3" /> : <Copy className="h-3 w-3" />}
                            </Button>
                          </div>
                        </div>
                        <Separator />
                        <div className="flex justify-between items-center">
                          <span className="text-sm text-muted-foreground">Chủ tài khoản:</span>
                          <span className="font-semibold">{bankInfo.accountName}</span>
                        </div>
                        {bankInfo.branch && (
                          <>
                            <Separator />
                            <div className="flex justify-between items-center">
                              <span className="text-sm text-muted-foreground">Chi nhánh:</span>
                              <span className="font-semibold">{bankInfo.branch}</span>
                            </div>
                          </>
                        )}
                        <Separator />
                        <div className="flex justify-between items-center">
                          <span className="text-sm text-muted-foreground">Nội dung:</span>
                          <div className="flex items-center gap-2">
                            <span className="font-semibold">{transferContent}</span>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-6 w-6"
                              onClick={() => handleCopy(transferContent)}
                            >
                              {copied ? <Check className="h-3 w-3" /> : <Copy className="h-3 w-3" />}
                            </Button>
                          </div>
                        </div>
                      </div>
                    </AlertDescription>
                  </Alert>
                )}

                {error && (
                  <Alert variant="destructive">
                    <AlertCircle className="h-4 w-4" />
                    <AlertDescription>
                      <div className="flex items-center justify-between gap-4">
                        <span>{error}</span>
                        <Button 
                          variant="outline" 
                          size="sm" 
                          onClick={() => {
                            setError(null)
                            setProcessing(false)
                          }}
                        >
                          Đóng
                        </Button>
                      </div>
                    </AlertDescription>
                  </Alert>
                )}

                <Button onClick={handlePayment} disabled={processing} size="lg" className="w-full">
                  {processing ? "Đang xử lý..." : `Thanh toán ${formatVND(depositAmount)}`}
                </Button>
              </CardContent>
            </Card>
            {paymentInitiated && <PaymentWatcher />}
          </div>

          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Tóm tắt đơn hàng</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <p className="text-sm text-muted-foreground">Mã đơn hàng</p>
                  <p className="font-semibold">#{booking.booking.booking_id}</p>
                </div>
                <Separator />

                <div>
                  <p className="text-sm text-muted-foreground">Điểm đón</p>
                  <p className="font-medium text-sm">{booking.booking.pickup_address_line}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Điểm trả</p>
                  <p className="font-medium text-sm">{booking.booking.delivery_address_line}</p>
                </div>
                <Separator />

                <div>
                  <p className="text-sm text-muted-foreground">Thời gian</p>
                  <p className="font-semibold">{booking.booking.preferred_date}</p>
                </div>
                <Separator />

                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span className="text-sm text-muted-foreground">Tổng tiền</span>
                    <span className="font-medium">{formatVND(booking.booking.final_price || 0)}</span>
                  </div>
                  <div className="flex justify-between items-center pt-2 border-t-2">
                    <span className="font-semibold">Đặt cọc 30%</span>
                    <span className="text-xl font-bold text-primary">{formatVND(depositAmount)}</span>
                  </div>
                </div>

                <Alert>
                  <CheckCircle2 className="h-4 w-4" />
                  <AlertDescription className="text-xs">
                    Số tiền còn lại sẽ thanh toán sau khi hoàn tất dịch vụ
                  </AlertDescription>
                </Alert>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  )
}

export default function CheckoutPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-gradient-to-b from-background to-muted/20 py-8 px-4">
          <div className="max-w-5xl mx-auto">
            <Card>
              <CardContent className="p-12 text-center">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4" />
                <p className="text-muted-foreground">Đang tải...</p>
              </CardContent>
            </Card>
          </div>
        </div>
      }
    >
      <CheckoutPageContent />
    </Suspense>
  )
}
