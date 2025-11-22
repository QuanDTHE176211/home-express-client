"use client"

import Image from "next/image"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Star, MessageSquare, Edit, Trash2 } from "lucide-react"
import { formatDate } from "@/lib/format"

interface ReviewCardProps {
  review: any
  onEdit: (review: any) => void
  onDelete: (reviewId: string) => void
  onPhotoClick: (photo: string) => void
}

export function ReviewCard({ review, onEdit, onDelete, onPhotoClick }: ReviewCardProps) {
  const renderStars = (rating: number) => {
    return (
      <div className="flex gap-1">
        {[1, 2, 3, 4, 5].map((star) => (
          <Star
            key={star}
            className={`h-5 w-5 ${star <= rating ? "fill-yellow-400 text-yellow-400" : "text-muted-foreground"}`}
          />
        ))}
      </div>
    )
  }

  return (
    <Card className="hover:shadow-md transition-shadow">
      <CardHeader>
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-3">
            <Avatar className="h-10 w-10">
              <AvatarImage src={review.transportLogo || "/placeholder.svg"} alt={review.transportName} />
              <AvatarFallback className="bg-accent-green text-white">
                {review.transportName?.charAt(0) || "T"}
              </AvatarFallback>
            </Avatar>
            <div>
              <CardTitle className="text-base">{review.transportName || "Không rõ"}</CardTitle>
              <p className="text-sm text-muted-foreground">{formatDate(review.createdAt)}</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8"
              onClick={() => onEdit(review)}
              aria-label="Chỉnh sửa đánh giá"
            >
              <Edit className="h-4 w-4" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8 text-error hover:text-error"
              onClick={() => onDelete(review.reviewId)}
              aria-label="Xóa đánh giá"
            >
              <Trash2 className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          {renderStars(review.rating)}
          {review.title && <p className="font-semibold">{review.title}</p>}
        </div>

        {review.comment && <p className="text-sm text-muted-foreground">{review.comment}</p>}

        {review.photos && review.photos.length > 0 && (
          <div className="flex gap-2 flex-wrap">
            {review.photos.map((photo: string, index: number) => (
              <button key={index} onClick={() => onPhotoClick(photo)} className="relative group cursor-pointer">
                <Image
                  src={photo || "/placeholder.svg"}
                  alt={`Ảnh đánh giá ${index + 1}`}
                  width={80}
                  height={80}
                  className="h-20 w-20 rounded-lg object-cover transition-opacity group-hover:opacity-80"
                />
              </button>
            ))}
          </div>
        )}

        {review.response && (
          <div className="bg-muted/50 rounded-lg p-4 space-y-2">
            <div className="flex items-center gap-2">
              <MessageSquare className="h-4 w-4 text-muted-foreground" />
              <span className="text-sm font-medium">Phản hồi từ đơn vị vận chuyển</span>
            </div>
            <p className="text-sm text-muted-foreground">{review.response}</p>
            {review.responseDate && <p className="text-xs text-muted-foreground">{formatDate(review.responseDate)}</p>}
          </div>
        )}

        <div className="flex items-center justify-between pt-2 border-t">
          <span className="text-sm text-muted-foreground">
            Booking #{review.bookingId}
            {review.isVerified && (
              <Badge variant="secondary" className="ml-2">
                Đã xác minh
              </Badge>
            )}
          </span>
          <Button variant="link" size="sm" asChild>
            <a href={`/customer/bookings/${review.bookingId}`}>Xem booking</a>
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}
