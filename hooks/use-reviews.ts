"use client"

import { useState, useEffect, useCallback } from "react"
import { apiClient } from "@/lib/api-client"
import { useToast } from "@/hooks/use-toast"

interface Review {
  review_id: number
  booking_id: number
  reviewer_id: number
  reviewee_id: number
  reviewer_type: "CUSTOMER" | "TRANSPORT"
  rating: number
  title: string | null
  comment: string | null
  photo_urls: string[] | null
  response: string | null
  responded_at: string | null
  is_verified: boolean
  is_flagged: boolean
  created_at: string
  updated_at: string
  reviewer_name: string
  reviewer_avatar: string | null
  reviewee_name: string
  booking_pickup_location: string
  booking_delivery_location: string
  booking_completed_date: string
}

interface ReviewStats {
  total_reviews: number
  average_rating: number
  rating_distribution: {
    five_star: number
    four_star: number
    three_star: number
    two_star: number
    one_star: number
  }
  verified_reviews: number
  with_photos: number
  with_response: number
}

interface UseReviewsOptions {
  userId?: number
  autoFetch?: boolean
}

export function useReviews(options: UseReviewsOptions = {}) {
  const { userId, autoFetch = true } = options
  const { toast } = useToast()

  const [reviews, setReviews] = useState<Review[]>([])
  const [stats, setStats] = useState<ReviewStats | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [pagination, setPagination] = useState({
    currentPage: 1,
    totalPages: 1,
    totalItems: 0,
    itemsPerPage: 10,
  })

  const fetchReviews = useCallback(
    async (page = 1, filters?: { rating?: number; hasResponse?: boolean }) => {
      setLoading(true)
      setError(null)

      try {
        const response = userId
          ? await apiClient.getUserReviews(userId, { page, limit: 10 })
          : await apiClient.getMyReviews({ page, limit: 10, ...filters })

        if (response.success) {
          setReviews(response.data.reviews)
          if (response.data.stats) {
            setStats(response.data.stats)
          }
          setPagination(response.data.pagination)
        }
      } catch (err: any) {
        const errorMessage = err.message || "Failed to fetch reviews"
        setError(errorMessage)
        toast({
          title: "Error",
          description: errorMessage,
          variant: "destructive",
        })
      } finally {
        setLoading(false)
      }
    },
    [userId, toast],
  )

  const submitReview = useCallback(
    async (data: {
      bookingId: number
      rating: number
      title?: string
      comment?: string
      photoUrls?: string[]
    }) => {
      setLoading(true)
      setError(null)

      try {
        const response = await apiClient.submitReview(data)

        if (response.success) {
          toast({
            title: "Success",
            description: response.message || "Review submitted successfully",
          })
          // Refresh reviews
          await fetchReviews()
          return true
        }
        return false
      } catch (err: any) {
        const errorMessage = err.message || "Failed to submit review"
        setError(errorMessage)
        toast({
          title: "Error",
          description: errorMessage,
          variant: "destructive",
        })
        return false
      } finally {
        setLoading(false)
      }
    },
    [fetchReviews, toast],
  )

  const respondToReview = useCallback(
    async (reviewId: number, response: string) => {
      setLoading(true)
      setError(null)

      try {
        const result = await apiClient.respondToReview(reviewId, response)

        if (result.success) {
          toast({
            title: "Success",
            description: result.message || "Response submitted successfully",
          })
          // Refresh reviews
          await fetchReviews()
          return true
        }
        return false
      } catch (err: any) {
        const errorMessage = err.message || "Failed to submit response"
        setError(errorMessage)
        toast({
          title: "Error",
          description: errorMessage,
          variant: "destructive",
        })
        return false
      } finally {
        setLoading(false)
      }
    },
    [fetchReviews, toast],
  )

  const reportReview = useCallback(
    async (reviewId: number, reason: string, details?: string) => {
      setLoading(true)
      setError(null)

      try {
        const response = await apiClient.reportReview(reviewId, { reason, details })

        if (response.success) {
          toast({
            title: "Success",
            description: response.message || "Review reported successfully",
          })
          return true
        }
        return false
      } catch (err: any) {
        const errorMessage = err.message || "Failed to report review"
        setError(errorMessage)
        toast({
          title: "Error",
          description: errorMessage,
          variant: "destructive",
        })
        return false
      } finally {
        setLoading(false)
      }
    },
    [toast],
  )

  const canReviewBooking = useCallback(async (bookingId: number) => {
    try {
      const response = await apiClient.canReviewBooking(bookingId)
      return response.success ? response.data : { canReview: false, reason: "Unknown error" }
    } catch (err: any) {
      return { canReview: false, reason: err.message || "Failed to check review eligibility" }
    }
  }, [])

  useEffect(() => {
    if (autoFetch) {
      fetchReviews()
    }
  }, [autoFetch, fetchReviews])

  return {
    reviews,
    stats,
    loading,
    error,
    pagination,
    fetchReviews,
    submitReview,
    respondToReview,
    reportReview,
    canReviewBooking,
  }
}
