"use client"

import { useEffect, useState } from "react"
import { ReviewPromptCard } from "@/components/reviews/review-prompt-card"
import { ReviewDisplayCard } from "@/components/reviews/review-display-card"
import { ReviewResponseForm } from "@/components/reviews/review-response-form"
import { Card, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { CheckCircle2 } from "lucide-react"
import { apiClient } from "@/lib/api-client"
import { useAuth } from "@/contexts/auth-context"
import type { ReviewWithDetails } from "@/types"

interface BookingReviewSectionProps {
  bookingId: number
  bookingStatus: string
  customerName: string
  transportName: string
  customerId: number
  transportId: number
}

export function BookingReviewSection({
  bookingId,
  bookingStatus,
  customerName,
  transportName,
  customerId,
  transportId,
}: BookingReviewSectionProps) {
  const { user } = useAuth()
  const [loading, setLoading] = useState(true)
  const [customerReview, setCustomerReview] = useState<ReviewWithDetails | null>(null)
  const [transportReview, setTransportReview] = useState<ReviewWithDetails | null>(null)
  const [canReview, setCanReview] = useState(false)

  const isCustomer = user?.role === "CUSTOMER"
  const isTransport = user?.role === "TRANSPORT"

  useEffect(() => {
    const fetchReviews = async () => {
      try {
        setLoading(true)

        // Check if user can review
        const canReviewResponse = await apiClient.canReviewBooking(bookingId)
        setCanReview(canReviewResponse.data.canReview)

        // Fetch existing reviews (in production, this would be a specific endpoint)
        // For now, we'll simulate this
        // const reviews = await apiClient.getBookingReviews(bookingId)
        // setCustomerReview(reviews.customerReview)
        // setTransportReview(reviews.transportReview)
      } catch (error) {
        console.error("Failed to fetch reviews:", error)
      } finally {
        setLoading(false)
      }
    }

    if (bookingStatus === "COMPLETED" || bookingStatus === "REVIEWED") {
      fetchReviews()
    }
  }, [bookingId, bookingStatus])

  // Only show review section for completed or reviewed bookings
  if (bookingStatus !== "COMPLETED" && bookingStatus !== "REVIEWED") {
    return null
  }

  const handleReviewSubmitted = () => {
    // Refresh reviews
    window.location.reload()
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold mb-2">Đánh giá</h2>
        <p className="text-muted-foreground">Đánh giá và phản hồi về chuyến đi</p>
      </div>

      {/* Customer's review of transport */}
      {isCustomer && !customerReview && canReview && (
        <ReviewPromptCard
          bookingId={bookingId}
          revieweeName={transportName}
          revieweeType="transport"
          onReviewSubmitted={handleReviewSubmitted}
        />
      )}

      {customerReview && (
        <div className="space-y-4">
          <h3 className="font-semibold">Đánh giá từ khách hàng</h3>
          <ReviewDisplayCard review={customerReview} />
          {isTransport && !customerReview.response && (
            <ReviewResponseForm
              reviewId={customerReview.review_id}
              reviewerName={customerName}
              onSuccess={handleReviewSubmitted}
            />
          )}
        </div>
      )}

      {/* Transport's review of customer */}
      {isTransport && !transportReview && canReview && (
        <ReviewPromptCard
          bookingId={bookingId}
          revieweeName={customerName}
          revieweeType="customer"
          onReviewSubmitted={handleReviewSubmitted}
        />
      )}

      {transportReview && (
        <div className="space-y-4">
          <h3 className="font-semibold">Đánh giá từ vận chuyển</h3>
          <ReviewDisplayCard review={transportReview} />
          {isCustomer && !transportReview.response && (
            <ReviewResponseForm
              reviewId={transportReview.review_id}
              reviewerName={transportName}
              onSuccess={handleReviewSubmitted}
            />
          )}
        </div>
      )}

      {/* Both reviewed - show completion message */}
      {bookingStatus === "REVIEWED" && (
        <Card className="border-green-500/50 bg-green-500/5">
          <CardHeader>
            <div className="flex items-center gap-2">
              <CheckCircle2 className="h-5 w-5 text-green-600" />
              <CardTitle className="text-green-600">Đã hoàn tất đánh giá</CardTitle>
            </div>
            <CardDescription>Cả hai bên đã hoàn thành đánh giá cho chuyến đi này</CardDescription>
          </CardHeader>
        </Card>
      )}
    </div>
  )
}
