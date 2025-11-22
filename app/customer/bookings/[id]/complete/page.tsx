"use client"

import { useState, useEffect } from "react"
import { useRouter, useParams } from "next/navigation"
import { useLanguage } from "@/contexts/language-context"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import { Separator } from "@/components/ui/separator"
import { CheckCircle2, AlertCircle, CreditCard, Smartphone, Building2, ArrowLeft, Gift } from "lucide-react"
import { apiClient } from "@/lib/api-client"
import { formatVND } from "@/lib/currency"
import { toast } from "sonner"
import type { BookingDetailResponse, PaymentMethod } from "@/types"

export default function CompletePaymentPage() {
  const router = useRouter()
  const params = useParams()
  const bookingId = Number(params.id)
  const { t } = useLanguage()

  const [booking, setBooking] = useState<BookingDetailResponse | null>(null)
  const [loading, setLoading] = useState(true)
  const [processing, setProcessing] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>("vnpay")
  const [tipAmount, setTipAmount] = useState<string>("")

  useEffect(() => {
    if (!bookingId || isNaN(bookingId)) {
      toast.error("Không tìm thấy booking ID")
      router.push("/customer/bookings")
      return
    }

    const loadData = async () => {
      try {
        const bookingData = await apiClient.getBookingDetail(bookingId)
        
        // Validate booking status
        if (bookingData.booking.status !== "COMPLETED") {
          toast.error("Booking chưa hoàn thành. Không thể thanh toán phần còn lại.")
          router.push(`/customer/bookings/${bookingId}`)
          return
        }

        setBooking(bookingData)
      } catch (err) {
        console.error("Failed to load booking data:", err)
        setError(err instanceof Error ? err.message : "Có lỗi xảy ra")
      } finally {
        setLoading(false)
      }
    }

    loadData()
  }, [bookingId, router])

  const calculateRemainingAmount = () => {
    if (!booking?.booking.final_price) return 0
    return Math.round(booking.booking.final_price * 0.7)
  }

  const calculateTotalAmount = () => {
    const remaining = calculateRemainingAmount()
    const tip = parseInt(tipAmount) || 0
    return remaining + tip
  }

  const handlePayment = async () => {
    if (!booking) return

    setProcessing(true)
    setError(null)

    try {
      const tipAmountVnd = parseInt(tipAmount) || 0
      
      const response = await apiClient.initiateRemainingPayment({
        bookingId: booking.booking.booking_id,
        method: paymentMethod,
        tipAmountVnd: tipAmountVnd > 0 ? tipAmountVnd : undefined,
        returnUrl: `${window.location.origin}/customer/bookings/${bookingId}?payment=success`,
        cancelUrl: `${window.location.origin}/customer/bookings/${bookingId}/complete?payment=cancelled`,
      })

      if (!response.success) {
        throw new Error(response.message || "Không thể khởi tạo thanh toán")
      }

      // For online payment methods, redirect to payment gateway
      if (response.paymentUrl) {
        window.location.href = response.paymentUrl
      } else {
        // For bank transfer, show success and redirect
        toast.success("Đã khởi tạo thanh toán. Vui lòng chuyển khoản theo thông tin đã cung cấp.")
        router.push(`/customer/bookings/${bookingId}`)
      }
    } catch (err) {
      console.error("Payment initiation failed:", err)
      const errorMessage = err instanceof Error ? err.message : "Có lỗi xảy ra khi khởi tạo thanh toán"
      setError(errorMessage)
      toast.error(errorMessage)
    } finally {
      setProcessing(false)
    }
  }

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-2xl mx-auto">
          <Card>
            <CardContent className="p-8">
              <div className="flex items-center justify-center">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
                <span className="ml-3">Đang tải...</span>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    )
  }

  if (error && !booking) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-2xl mx-auto">
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
          <div className="mt-4">
            <Button onClick={() => router.push("/customer/bookings")} variant="outline">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Quay lại danh sách booking
            </Button>
          </div>
        </div>
      </div>
    )
  }

  if (!booking) return null

  const remainingAmount = calculateRemainingAmount()
  const totalAmount = calculateTotalAmount()

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="max-w-2xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center gap-4">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => router.push(`/customer/bookings/${bookingId}`)}
          >
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div>
            <h1 className="text-2xl font-bold">Hoàn tất thanh toán</h1>
            <p className="text-muted-foreground">Booking #{bookingId}</p>
          </div>
        </div>

        {/* Payment Summary */}
        <Card>
          <CardHeader>
            <CardTitle>Tổng quan thanh toán</CardTitle>
            <CardDescription>
              Thanh toán phần còn lại (70%) cho dịch vụ đã hoàn thành
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Tổng giá trị booking:</span>
                <span className="font-medium">{formatVND(booking.booking.final_price || 0)}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Đã thanh toán (30%):</span>
                <span className="font-medium text-green-600">
                  {formatVND(Math.round((booking.booking.final_price || 0) * 0.3))}
                </span>
              </div>
              <Separator />
              <div className="flex justify-between">
                <span className="font-medium">Còn lại (70%):</span>
                <span className="text-lg font-bold">{formatVND(remainingAmount)}</span>
              </div>
            </div>

            {/* Tip Input */}
            <div className="space-y-2 pt-4 border-t">
              <Label htmlFor="tip" className="flex items-center gap-2">
                <Gift className="h-4 w-4" />
                Tiền tip cho tài xế (tùy chọn)
              </Label>
              <Input
                id="tip"
                type="number"
                placeholder="0"
                value={tipAmount}
                onChange={(e) => setTipAmount(e.target.value)}
                min="0"
                step="10000"
              />
              <p className="text-xs text-muted-foreground">
                Nếu bạn hài lòng với dịch vụ, hãy để lại tip cho tài xế
              </p>
            </div>

            {parseInt(tipAmount) > 0 && (
              <>
                <Separator />
                <div className="flex justify-between text-lg font-bold">
                  <span>Tổng cộng:</span>
                  <span className="text-primary">{formatVND(totalAmount)}</span>
                </div>
              </>
            )}
          </CardContent>
        </Card>

        {/* Payment Method Selection */}
        <Card>
          <CardHeader>
            <CardTitle>Phương thức thanh toán</CardTitle>
            <CardDescription>Chọn phương thức thanh toán phù hợp</CardDescription>
          </CardHeader>
          <CardContent>
            <RadioGroup value={paymentMethod} onValueChange={(value) => setPaymentMethod(value as PaymentMethod)}>
              <div className="space-y-3">
                <div className="flex items-center space-x-3 border rounded-lg p-4 cursor-pointer hover:bg-accent">
                  <RadioGroupItem value="vnpay" id="vnpay" />
                  <Label htmlFor="vnpay" className="flex items-center gap-3 cursor-pointer flex-1">
                    <CreditCard className="h-5 w-5 text-blue-600" />
                    <div>
                      <div className="font-medium">VNPay</div>
                      <div className="text-sm text-muted-foreground">Thanh toán qua VNPay</div>
                    </div>
                  </Label>
                </div>

                <div className="flex items-center space-x-3 border rounded-lg p-4 cursor-pointer hover:bg-accent">
                  <RadioGroupItem value="momo" id="momo" />
                  <Label htmlFor="momo" className="flex items-center gap-3 cursor-pointer flex-1">
                    <Smartphone className="h-5 w-5 text-pink-600" />
                    <div>
                      <div className="font-medium">MoMo</div>
                      <div className="text-sm text-muted-foreground">Thanh toán qua ví MoMo</div>
                    </div>
                  </Label>
                </div>

                <div className="flex items-center space-x-3 border rounded-lg p-4 cursor-pointer hover:bg-accent">
                  <RadioGroupItem value="bank" id="bank" />
                  <Label htmlFor="bank" className="flex items-center gap-3 cursor-pointer flex-1">
                    <Building2 className="h-5 w-5 text-green-600" />
                    <div>
                      <div className="font-medium">Chuyển khoản ngân hàng</div>
                      <div className="text-sm text-muted-foreground">Chuyển khoản trực tiếp</div>
                    </div>
                  </Label>
                </div>
              </div>
            </RadioGroup>
          </CardContent>
        </Card>

        {/* Error Alert */}
        {error && (
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        {/* Action Buttons */}
        <div className="flex gap-4">
          <Button
            variant="outline"
            onClick={() => router.push(`/customer/bookings/${bookingId}`)}
            disabled={processing}
            className="flex-1"
          >
            Hủy
          </Button>
          <Button
            onClick={handlePayment}
            disabled={processing || !booking}
            className="flex-1"
          >
            {processing ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                Đang xử lý...
              </>
            ) : (
              <>
                <CheckCircle2 className="mr-2 h-4 w-4" />
                Thanh toán {formatVND(totalAmount)}
              </>
            )}
          </Button>
        </div>
      </div>
    </div>
  )
}

