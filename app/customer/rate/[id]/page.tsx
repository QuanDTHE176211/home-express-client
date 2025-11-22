"use client"

import { useState, useEffect } from "react"
import { useRouter, useParams } from "next/navigation"
import { useLanguage } from "@/contexts/language-context"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import { Separator } from "@/components/ui/separator"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { CheckCircle2, AlertCircle, Star, Heart, DollarSign } from "lucide-react"

interface BookingInfo {
  id: string
  transporterName: string
  transporterAvatar?: string
  driverName?: string
  completedDate: string
  totalAmount: number
}

// Star rating component
function StarRating({ rating, onRatingChange }: { rating: number; onRatingChange: (rating: number) => void }) {
  const [hoverRating, setHoverRating] = useState(0)

  return (
    <div className="flex gap-2">
      {[1, 2, 3, 4, 5].map((star) => (
        <button
          key={star}
          type="button"
          onClick={() => onRatingChange(star)}
          onMouseEnter={() => setHoverRating(star)}
          onMouseLeave={() => setHoverRating(0)}
          className="transition-transform hover:scale-110"
        >
          <Star
            className={`h-10 w-10 ${
              star <= (hoverRating || rating) ? "fill-yellow-400 text-yellow-400" : "fill-none text-muted-foreground"
            }`}
          />
        </button>
      ))}
    </div>
  )
}

// Rating criteria component
function RatingCriteria({
  label,
  rating,
  onRatingChange,
}: {
  label: string
  rating: number
  onRatingChange: (rating: number) => void
}) {
  return (
    <div className="space-y-2">
      <Label className="text-sm font-medium">{label}</Label>
      <div className="flex gap-1">
        {[1, 2, 3, 4, 5].map((star) => (
          <button
            key={star}
            type="button"
            onClick={() => onRatingChange(star)}
            className="transition-transform hover:scale-110"
          >
            <Star
              className={`h-6 w-6 ${
                star <= rating ? "fill-yellow-400 text-yellow-400" : "fill-none text-muted-foreground"
              }`}
            />
          </button>
        ))}
      </div>
    </div>
  )
}

export default function RatePage() {
  const router = useRouter()
  const params = useParams()
  const bookingId = params.id as string
  const { t } = useLanguage()

  const [booking, setBooking] = useState<BookingInfo | null>(null)
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)

  // Rating state
  const [overallRating, setOverallRating] = useState(0)
  const [professionalismRating, setProfessionalismRating] = useState(0)
  const [punctualityRating, setPunctualityRating] = useState(0)
  const [careRating, setCareRating] = useState(0)
  const [comment, setComment] = useState("")
  const [tipAmount, setTipAmount] = useState("")

  // Load booking info
  useEffect(() => {
    if (!bookingId) {
      router.push("/scan")
      return
    }

    const loadBooking = async () => {
      try {
        const response = await fetch(`/api/bookings/${bookingId}/info`)
        if (!response.ok) throw new Error("Không thể tải thông tin đơn hàng")

        const data = await response.json()
        setBooking(data.booking)
      } catch (err) {
        setError(err instanceof Error ? err.message : "Có lỗi xảy ra")
      } finally {
        setLoading(false)
      }
    }

    loadBooking()
  }, [bookingId, router])

  // Format currency
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("vi-VN", {
      style: "currency",
      currency: "VND",
    }).format(amount)
  }

  // Submit rating
  const handleSubmit = async () => {
    if (overallRating === 0) {
      setError("Vui lòng chọn đánh giá tổng thể")
      return
    }

    setSubmitting(true)
    setError(null)

    try {
      const response = await fetch(`/api/bookings/${bookingId}/rate`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          overallRating,
          professionalismRating,
          punctualityRating,
          careRating,
          comment,
          tipAmount: tipAmount ? Number.parseFloat(tipAmount) : 0,
        }),
      })

      if (!response.ok) throw new Error("Không thể gửi đánh giá")

      setSuccess(true)

      // Redirect after 2 seconds
      setTimeout(() => {
        router.push("/customer")
      }, 2000)
    } catch (err) {
      setError(err instanceof Error ? err.message : "Có lỗi xảy ra")
      setSubmitting(false)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-background to-muted/20 py-8 px-4">
        <div className="max-w-3xl mx-auto">
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

  if (error && !booking) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-background to-muted/20 py-8 px-4">
        <div className="max-w-3xl mx-auto">
          <Card>
            <CardContent className="p-12 text-center space-y-4">
              <AlertCircle className="h-12 w-12 text-destructive mx-auto" />
              <p className="text-lg font-semibold">Không tìm thấy thông tin đơn hàng</p>
              <p className="text-muted-foreground">{error}</p>
              <Button onClick={() => router.push("/customer")}>Quay lại</Button>
            </CardContent>
          </Card>
        </div>
      </div>
    )
  }

  if (success) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-background to-muted/20 py-8 px-4">
        <div className="max-w-3xl mx-auto">
          <Card>
            <CardContent className="p-12 text-center space-y-4">
              <div className="rounded-full bg-accent-green/10 p-6 w-fit mx-auto">
                <CheckCircle2 className="h-12 w-12 text-accent-green" />
              </div>
              <h2 className="text-2xl font-bold">Cảm ơn bạn đã đánh giá!</h2>
              <p className="text-muted-foreground">Đánh giá của bạn giúp chúng tôi cải thiện dịch vụ tốt hơn.</p>
              <Button onClick={() => router.push("/customer")}>Về trang chủ</Button>
            </CardContent>
          </Card>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-background to-muted/20 py-8 px-4">
      <div className="max-w-3xl mx-auto space-y-6">
        {/* Header */}
        <Card>
          <CardHeader>
            <CardTitle>Đánh giá dịch vụ</CardTitle>
            <CardDescription>Chia sẻ trải nghiệm của bạn với chúng tôi</CardDescription>
          </CardHeader>
        </Card>

        {/* Booking info */}
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-4">
              <Avatar className="h-16 w-16">
                <AvatarImage src={booking?.transporterAvatar || "/placeholder.svg"} alt={booking?.transporterName} />
                <AvatarFallback>{booking?.transporterName?.charAt(0)}</AvatarFallback>
              </Avatar>
              <div className="flex-1">
                <h3 className="font-semibold text-lg">{booking?.transporterName}</h3>
                {booking?.driverName && <p className="text-sm text-muted-foreground">Tài xế: {booking.driverName}</p>}
                <p className="text-sm text-muted-foreground">Hoàn thành: {booking?.completedDate}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Rating form */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Đánh giá tổng thể</CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Overall rating */}
            <div className="flex flex-col items-center gap-3 py-4">
              <StarRating rating={overallRating} onRatingChange={setOverallRating} />
              <p className="text-sm text-muted-foreground">
                {overallRating === 0
                  ? "Chọn số sao"
                  : overallRating === 1
                    ? "Rất tệ"
                    : overallRating === 2
                      ? "Tệ"
                      : overallRating === 3
                        ? "Bình thường"
                        : overallRating === 4
                          ? "Tốt"
                          : "Xuất sắc"}
              </p>
            </div>

            <Separator />

            {/* Detailed ratings */}
            <div className="space-y-4">
              <h4 className="font-semibold">Đánh giá chi tiết</h4>
              <RatingCriteria
                label="Chuyên nghiệp"
                rating={professionalismRating}
                onRatingChange={setProfessionalismRating}
              />
              <RatingCriteria label="Đúng giờ" rating={punctualityRating} onRatingChange={setPunctualityRating} />
              <RatingCriteria label="Cẩn thận với đồ đạc" rating={careRating} onRatingChange={setCareRating} />
            </div>

            <Separator />

            {/* Comment */}
            <div className="space-y-2">
              <Label htmlFor="comment">Nhận xét (tuỳ chọn)</Label>
              <Textarea
                id="comment"
                placeholder="Chia sẻ trải nghiệm của bạn..."
                value={comment}
                onChange={(e) => setComment(e.target.value)}
                rows={4}
              />
            </div>

            <Separator />

            {/* Tip */}
            <div className="space-y-2">
              <Label htmlFor="tip" className="flex items-center gap-2">
                <Heart className="h-4 w-4" />
                Tip cho tài xế (tuỳ chọn)
              </Label>
              <div className="flex gap-2">
                <div className="relative flex-1">
                  <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="tip"
                    type="number"
                    placeholder="0"
                    value={tipAmount}
                    onChange={(e) => setTipAmount(e.target.value)}
                    className="pl-9"
                  />
                </div>
                <div className="flex gap-2">
                  {[20000, 50000, 100000].map((amount) => (
                    <Button
                      key={amount}
                      type="button"
                      variant="outline"
                      onClick={() => setTipAmount(amount.toString())}
                      className="bg-transparent"
                    >
                      {formatCurrency(amount)}
                    </Button>
                  ))}
                </div>
              </div>
              <p className="text-xs text-muted-foreground">
                Tip sẽ được chuyển trực tiếp cho tài xế để ghi nhận sự tận tâm của họ
              </p>
            </div>

            {/* Error */}
            {error && (
              <Alert variant="destructive">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}

            {/* Submit button */}
            <Button onClick={handleSubmit} disabled={submitting || overallRating === 0} size="lg" className="w-full">
              {submitting ? "Đang gửi..." : "Gửi đánh giá"}
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
