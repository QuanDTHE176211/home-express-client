"use client"

import type React from "react"

import { useState } from "react"
import Image from "next/image"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Star, Loader2, Upload, X } from "lucide-react"
import { apiClient } from "@/lib/api-client"
import type { ReviewRating } from "@/types"

interface ReviewSubmissionDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  bookingId: number
  revieweeName: string
  onSuccess?: () => void
}

export function ReviewSubmissionDialog({
  open,
  onOpenChange,
  bookingId,
  revieweeName,
  onSuccess,
}: ReviewSubmissionDialogProps) {
  const [rating, setRating] = useState<ReviewRating>(5)
  const [hoveredRating, setHoveredRating] = useState<number | null>(null)
  const [title, setTitle] = useState("")
  const [comment, setComment] = useState("")
  const [photos, setPhotos] = useState<string[]>([])
  const [submitting, setSubmitting] = useState(false)

  const handlePhotoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files
    if (!files) return

    // In production, upload to storage and get URLs
    const newPhotos = Array.from(files).map((file) => URL.createObjectURL(file))
    setPhotos((prev) => [...prev, ...newPhotos].slice(0, 5))
  }

  const removePhoto = (index: number) => {
    setPhotos((prev) => prev.filter((_, i) => i !== index))
  }

  const handleSubmit = async () => {
    if (!comment.trim()) {
      alert("Vui lòng nhập nhận xét")
      return
    }

    try {
      setSubmitting(true)

      await apiClient.submitReview({
        bookingId,
        rating,
        title: title || undefined,
        comment,
        photoUrls: photos.length > 0 ? photos : undefined,
      })

      alert("Đánh giá đã được gửi thành công!")
      onOpenChange(false)

      if (onSuccess) {
        onSuccess()
      }
    } catch (error: any) {
      alert(error.message || "Không thể gửi đánh giá")
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Đánh giá dịch vụ</DialogTitle>
          <DialogDescription>Chia sẻ trải nghiệm của bạn với {revieweeName}</DialogDescription>
        </DialogHeader>

        <div className="space-y-6 py-4">
          {/* Rating Stars */}
          <div className="space-y-2">
            <Label>Đánh giá tổng thể</Label>
            <div className="flex gap-2">
              {[1, 2, 3, 4, 5].map((star) => (
                <button
                  key={star}
                  type="button"
                  onClick={() => setRating(star as ReviewRating)}
                  onMouseEnter={() => setHoveredRating(star)}
                  onMouseLeave={() => setHoveredRating(null)}
                  className="transition-transform hover:scale-110"
                >
                  <Star
                    className={`h-8 w-8 ${
                      star <= (hoveredRating || rating)
                        ? "fill-yellow-400 text-yellow-400"
                        : "fill-none text-muted-foreground"
                    }`}
                  />
                </button>
              ))}
              <span className="ml-2 text-sm text-muted-foreground self-center">
                {rating === 5 && "Xuất sắc"}
                {rating === 4 && "Tốt"}
                {rating === 3 && "Trung bình"}
                {rating === 2 && "Kém"}
                {rating === 1 && "Rất kém"}
              </span>
            </div>
          </div>

          {/* Title */}
          <div className="space-y-2">
            <Label htmlFor="title">Tiêu đề (tùy chọn)</Label>
            <Input
              id="title"
              placeholder="Tóm tắt trải nghiệm của bạn"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              maxLength={100}
            />
          </div>

          {/* Comment */}
          <div className="space-y-2">
            <Label htmlFor="comment">Nhận xét chi tiết</Label>
            <Textarea
              id="comment"
              placeholder="Chia sẻ chi tiết về trải nghiệm của bạn..."
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              rows={5}
              maxLength={1000}
              required
            />
            <p className="text-xs text-muted-foreground text-right">{comment.length}/1000</p>
          </div>

          {/* Photos */}
          <div className="space-y-2">
            <Label>Ảnh (tùy chọn, tối đa 5 ảnh)</Label>
            <div className="flex flex-wrap gap-2">
                {photos.map((photo, index) => (
                  <div key={index} className="relative h-20 w-20">
                    <Image
                      src={photo || "/placeholder.svg"}
                      alt={`Photo ${index + 1}`}
                      width={80}
                      height={80}
                      className="h-full w-full rounded-lg object-cover"
                    />
                  <button
                    type="button"
                    onClick={() => removePhoto(index)}
                    className="absolute -right-2 -top-2 rounded-full bg-destructive p-1 text-destructive-foreground"
                  >
                    <X className="h-3 w-3" />
                  </button>
                </div>
              ))}

              {photos.length < 5 && (
                <label className="flex h-20 w-20 cursor-pointer flex-col items-center justify-center gap-1 rounded-lg border-2 border-dashed border-muted-foreground/25 hover:border-muted-foreground/50">
                  <Upload className="h-5 w-5 text-muted-foreground" />
                  <span className="text-xs text-muted-foreground">Tải ảnh</span>
                  <input type="file" accept="image/*" multiple onChange={handlePhotoUpload} className="hidden" />
                </label>
              )}
            </div>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={submitting}>
            Hủy
          </Button>
          <Button onClick={handleSubmit} disabled={submitting || !comment.trim()}>
            {submitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Gửi đánh giá
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
