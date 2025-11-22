"use client"

import { useState, useCallback } from "react"
import { apiClient } from "@/lib/api-client"
import { useToast } from "./use-toast"

interface ReportedReview {
  report_id: number
  review_id: number
  reporter_id: number
  reporter_name: string
  reason: string
  description: string | null
  status: "pending" | "reviewed" | "resolved" | "dismissed"
  created_at: string
  review: {
    rating: number
    title: string | null
    comment: string | null
    reviewer_name: string
    booking_id: number
  }
}

interface ModerationAction {
  action: "approve" | "hide" | "delete"
  reason?: string
  notifyUser?: boolean
}

export function useAdminModeration() {
  const { toast } = useToast()
  const [reportedReviews, setReportedReviews] = useState<ReportedReview[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const fetchReportedReviews = useCallback(
    async (status?: string) => {
      setLoading(true)
      setError(null)

      try {
        const response = await apiClient.getReportedReviews(status) as any
        if (response.success) {
          setReportedReviews(response.data)
        } else {
          setError(response.error || "Không thể tải danh sách báo cáo")
        }
      } catch (err: any) {
        setError(err.message || "Đã xảy ra lỗi")
        toast({
          title: "Lỗi",
          description: err.message || "Không thể tải danh sách báo cáo",
          variant: "destructive",
        })
      } finally {
        setLoading(false)
      }
    },
    [toast],
  )

  const moderateReview = useCallback(
    async (reviewId: number, action: ModerationAction) => {
      setLoading(true)

      try {
        const response = await apiClient.moderateReview(reviewId, action) as any
        if (response.success) {
          toast({
            title: "Thành công",
            description: "Đã xử lý đánh giá",
          })
          return true
        } else {
          toast({
            title: "Lỗi",
            description: response.error || "Không thể xử lý đánh giá",
            variant: "destructive",
          })
          return false
        }
      } catch (err: any) {
        toast({
          title: "Lỗi",
          description: err.message || "Đã xảy ra lỗi",
          variant: "destructive",
        })
        return false
      } finally {
        setLoading(false)
      }
    },
    [toast],
  )

  const updateReportStatus = useCallback(
    async (reportId: number, status: string, adminNotes?: string) => {
      setLoading(true)

      try {
        const response = await apiClient.updateReportStatus(reportId, status, adminNotes) as any
        if (response.success) {
          toast({
            title: "Thành công",
            description: "Đã cập nhật trạng thái báo cáo",
          })
          return true
        } else {
          toast({
            title: "Lỗi",
            description: response.error || "Không thể cập nhật báo cáo",
            variant: "destructive",
          })
          return false
        }
      } catch (err: any) {
        toast({
          title: "Lỗi",
          description: err.message || "Đã xảy ra lỗi",
          variant: "destructive",
        })
        return false
      } finally {
        setLoading(false)
      }
    },
    [toast],
  )

  return {
    reportedReviews,
    loading,
    error,
    fetchReportedReviews,
    moderateReview,
    updateReportStatus,
  }
}
