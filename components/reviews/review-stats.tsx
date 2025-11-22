"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Progress } from "@/components/ui/progress"
import { StarRating } from "./star-rating"
import { Star } from "lucide-react"

interface ReviewStatsProps {
  stats: {
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
}

export function ReviewStats({ stats }: ReviewStatsProps) {
  const ratingBars = [
    { stars: 5, count: stats.rating_distribution.five_star },
    { stars: 4, count: stats.rating_distribution.four_star },
    { stars: 3, count: stats.rating_distribution.three_star },
    { stars: 2, count: stats.rating_distribution.two_star },
    { stars: 1, count: stats.rating_distribution.one_star },
  ]

  const getPercentage = (count: number) => {
    return stats.total_reviews > 0 ? (count / stats.total_reviews) * 100 : 0
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Tổng quan đánh giá</CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="flex items-center gap-6">
          <div className="text-center">
            <div className="text-4xl font-bold">{stats.average_rating.toFixed(1)}</div>
            <StarRating rating={stats.average_rating} size="md" className="justify-center mt-2" />
            <p className="text-sm text-muted-foreground mt-1">{stats.total_reviews} đánh giá</p>
          </div>

          <div className="flex-1 space-y-2">
            {ratingBars.map(({ stars, count }) => (
              <div key={stars} className="flex items-center gap-2">
                <div className="flex items-center gap-1 w-12">
                  <span className="text-sm">{stars}</span>
                  <Star className="h-3 w-3 fill-yellow-400 text-yellow-400" />
                </div>
                <Progress value={getPercentage(count)} className="flex-1" />
                <span className="text-sm text-muted-foreground w-12 text-right">{count}</span>
              </div>
            ))}
          </div>
        </div>

        <div className="grid grid-cols-3 gap-4 pt-4 border-t">
          <div className="text-center">
            <div className="text-2xl font-bold">{stats.verified_reviews}</div>
            <p className="text-xs text-muted-foreground">Đã xác minh</p>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold">{stats.with_photos}</div>
            <p className="text-xs text-muted-foreground">Có hình ảnh</p>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold">{stats.with_response}</div>
            <p className="text-xs text-muted-foreground">Có phản hồi</p>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
