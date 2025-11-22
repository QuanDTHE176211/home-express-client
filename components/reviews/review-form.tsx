"use client"

import type React from "react"

import { useState } from "react"
import Image from "next/image"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { StarRating } from "./star-rating"
import { useReviews } from "@/hooks/use-reviews"
import { Loader2, Upload, X } from "lucide-react"
import { useToast } from "@/hooks/use-toast"

interface ReviewFormProps {
  bookingId: number
  onSuccess?: () => void
  onCancel?: () => void
}

export function ReviewForm({ bookingId, onSuccess, onCancel }: ReviewFormProps) {
  const { submitReview, loading } = useReviews({ autoFetch: false })
  const { toast } = useToast()

  const [rating, setRating] = useState(5)
  const [title, setTitle] = useState("")
  const [comment, setComment] = useState("")
  const [photos, setPhotos] = useState<string[]>([])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (rating === 0) {
      toast({
        title: "Lỗi",
        description: "Vui lòng chọn số sao đánh giá",
        variant: "destructive",
      })
      return
    }

    const success = await submitReview({
      bookingId,
      rating,
      title: title.trim() || undefined,
      comment: comment.trim() || undefined,
      photoUrls: photos.length > 0 ? photos : undefined,
    })

    if (success && onSuccess) {
      onSuccess()
    }
  }

  const handlePhotoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files
    if (!files) return

    // In a real app, upload to storage and get URLs
    // For now, create object URLs for preview
    const newPhotos = Array.from(files).map((file) => URL.createObjectURL(file))
    setPhotos((prev) => [...prev, ...newPhotos].slice(0, 5))
  }

  const removePhoto = (index: number) => {
    setPhotos((prev) => prev.filter((_, i) => i !== index))
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Đánh giá chuyến đi</CardTitle>
        <CardDescription>Chia sẻ trải nghiệm của bạn để giúp cải thiện dịch vụ</CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="space-y-2">
            <Label>Đánh giá của bạn</Label>
            <StarRating rating={rating} interactive onChange={setRating} size="lg" />
            <p className="text-sm text-muted-foreground">
              {rating === 5 && "Xuất sắc"}
              {rating === 4 && "Tốt"}
              {rating === 3 && "Trung bình"}
              {rating === 2 && "Kém"}
              {rating === 1 && "Rất kém"}
            </p>
          </div>

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

          <div className="space-y-2">
            <Label htmlFor="comment">Nhận xét (tùy chọn)</Label>
            <Textarea
              id="comment"
              placeholder="Chia sẻ chi tiết về trải nghiệm của bạn..."
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              rows={5}
              maxLength={1000}
            />
            <p className="text-xs text-muted-foreground text-right">{comment.length}/1000</p>
          </div>

          <div className="space-y-2">
            <Label>Hình ảnh (tùy chọn, tối đa 5 ảnh)</Label>
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
                <label className="flex h-20 w-20 cursor-pointer items-center justify-center rounded-lg border-2 border-dashed border-muted-foreground/25 hover:border-muted-foreground/50">
                  <Upload className="h-6 w-6 text-muted-foreground" />
                  <input type="file" accept="image/*" multiple onChange={handlePhotoUpload} className="hidden" />
                </label>
              )}
            </div>
          </div>

          <div className="flex gap-2 justify-end">
            {onCancel && (
              <Button type="button" variant="outline" onClick={onCancel} disabled={loading}>
                Hủy
              </Button>
            )}
            <Button type="submit" disabled={loading}>
              {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Gửi đánh giá
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  )
}
