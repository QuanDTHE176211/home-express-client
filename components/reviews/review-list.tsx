"use client"

import { useState } from "react"
import { ReviewDisplayCard } from "./review-display-card"
import { ReviewStats } from "./review-stats"
import { Button } from "@/components/ui/button"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { useReviews } from "@/hooks/use-reviews"
import { Loader2 } from "lucide-react"
import { Alert, AlertDescription } from "@/components/ui/alert"

interface ReviewListProps {
  userId?: number
  canRespond?: boolean
  showStats?: boolean
}

export function ReviewList({ userId, canRespond = false, showStats = true }: ReviewListProps) {
  const { reviews, stats, loading, error, pagination, fetchReviews } = useReviews({ userId, autoFetch: true })
  const [ratingFilter, setRatingFilter] = useState<string>("all")
  const [responseFilter, setResponseFilter] = useState<string>("all")

  const handleFilterChange = () => {
    const filters: any = {}

    if (ratingFilter !== "all") {
      filters.rating = Number.parseInt(ratingFilter)
    }

    if (responseFilter === "with") {
      filters.hasResponse = true
    } else if (responseFilter === "without") {
      filters.hasResponse = false
    }

    fetchReviews(1, filters)
  }

  const handleLoadMore = () => {
    fetchReviews(pagination.currentPage + 1)
  }

  if (loading && reviews.length === 0) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    )
  }

  if (error) {
    return (
      <Alert variant="destructive">
        <AlertDescription>{error}</AlertDescription>
      </Alert>
    )
  }

  return (
    <div className="space-y-6">
      {showStats && stats && <ReviewStats stats={stats} />}

      <div className="flex gap-2 flex-wrap">
        <Select value={ratingFilter} onValueChange={setRatingFilter}>
          <SelectTrigger className="w-40">
            <SelectValue placeholder="Lọc theo sao" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Tất cả</SelectItem>
            <SelectItem value="5">5 sao</SelectItem>
            <SelectItem value="4">4 sao</SelectItem>
            <SelectItem value="3">3 sao</SelectItem>
            <SelectItem value="2">2 sao</SelectItem>
            <SelectItem value="1">1 sao</SelectItem>
          </SelectContent>
        </Select>

        <Select value={responseFilter} onValueChange={setResponseFilter}>
          <SelectTrigger className="w-40">
            <SelectValue placeholder="Phản hồi" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Tất cả</SelectItem>
            <SelectItem value="with">Có phản hồi</SelectItem>
            <SelectItem value="without">Chưa phản hồi</SelectItem>
          </SelectContent>
        </Select>

        <Button variant="outline" onClick={handleFilterChange}>
          Áp dụng
        </Button>
      </div>

      {reviews.length === 0 ? (
        <div className="text-center py-12">
          <p className="text-muted-foreground">Chưa có đánh giá nào</p>
        </div>
      ) : (
        <div className="space-y-4">
          {reviews.map((review) => (
            <ReviewDisplayCard key={review.review_id} review={review as any} showResponse={true} />
          ))}

          {pagination.currentPage < pagination.totalPages && (
            <div className="flex justify-center pt-4">
              <Button variant="outline" onClick={handleLoadMore} disabled={loading}>
                {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Xem thêm
              </Button>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
