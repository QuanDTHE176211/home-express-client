"use client"

import Image from "next/image"
import { Card, CardContent, CardHeader } from "@/components/ui/card"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { Star, CheckCircle2 } from "lucide-react"
import type { ReviewWithDetails } from "@/types"

interface ReviewDisplayCardProps {
  review: ReviewWithDetails
  showResponse?: boolean
}

export function ReviewDisplayCard({ review, showResponse = true }: ReviewDisplayCardProps) {
  return (
    <Card>
      <CardHeader>
        <div className="flex items-start gap-4">
          <Avatar>
            <AvatarImage src={review.reviewer_avatar || undefined} />
            <AvatarFallback>{review.reviewer_name[0]}</AvatarFallback>
          </Avatar>
          <div className="flex-1">
            <div className="flex items-center gap-2">
              <h3 className="font-semibold">{review.reviewer_name}</h3>
              {review.is_verified && (
                <Badge variant="secondary" className="gap-1">
                  <CheckCircle2 className="h-3 w-3" />
                  Đã xác minh
                </Badge>
              )}
            </div>
            <div className="flex items-center gap-2 mt-1">
              <div className="flex">
                {[1, 2, 3, 4, 5].map((star) => (
                  <Star
                    key={star}
                    className={`h-4 w-4 ${
                      star <= review.rating ? "fill-yellow-400 text-yellow-400" : "fill-none text-muted-foreground"
                    }`}
                  />
                ))}
              </div>
              <span className="text-sm text-muted-foreground">
                {new Date(review.created_at).toLocaleDateString("vi-VN")}
              </span>
            </div>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {review.title && <h4 className="font-semibold">{review.title}</h4>}
        {review.comment && <p className="text-muted-foreground">{review.comment}</p>}

        {review.photo_urls && review.photo_urls.length > 0 && (
          <div className="flex gap-2 flex-wrap">
            {review.photo_urls.map((url, index) => (
              <Image
                key={index}
                src={url || "/placeholder.svg"}
                alt={`Review photo ${index + 1}`}
                width={80}
                height={80}
                className="h-20 w-20 rounded-lg object-cover"
              />
            ))}
          </div>
        )}

        {showResponse && review.response && (
          <div className="border-l-2 border-primary pl-4 mt-4">
            <p className="text-sm font-semibold mb-1">Phản hồi từ {review.reviewee_name}</p>
            <p className="text-sm text-muted-foreground">{review.response}</p>
            {review.responded_at && (
              <p className="text-xs text-muted-foreground mt-1">
                {new Date(review.responded_at).toLocaleDateString("vi-VN")}
              </p>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  )
}
