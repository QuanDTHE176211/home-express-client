"use client"

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { Star } from "lucide-react"

interface EditReviewDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  review: any
  editForm: { rating: number; title: string; comment: string }
  setEditForm: (form: { rating: number; title: string; comment: string }) => void
  onSave: () => void
  isSaving: boolean
}

export function EditReviewDialog({
  open,
  onOpenChange,
  review,
  editForm,
  setEditForm,
  onSave,
  isSaving,
}: EditReviewDialogProps) {
  const renderStars = (rating: number, interactive = false, onRatingChange?: (rating: number) => void) => {
    return (
      <div className="flex gap-1">
        {[1, 2, 3, 4, 5].map((star) => (
          <Star
            key={star}
            className={`h-5 w-5 ${star <= rating ? "fill-yellow-400 text-yellow-400" : "text-muted-foreground"} ${
              interactive ? "cursor-pointer hover:scale-110 transition-transform" : ""
            }`}
            onClick={() => interactive && onRatingChange?.(star)}
          />
        ))}
      </div>
    )
  }

  const isFormValid = editForm.comment.trim().length > 0

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Chỉnh sửa đánh giá</DialogTitle>
          <DialogDescription>Cập nhật đánh giá của bạn cho {review?.transportName}</DialogDescription>
        </DialogHeader>
        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label>Đánh giá</Label>
            {renderStars(editForm.rating, true, (rating) => setEditForm({ ...editForm, rating }))}
          </div>
          <div className="space-y-2">
            <Label htmlFor="edit-title">Tiêu đề (tùy chọn)</Label>
            <Input
              id="edit-title"
              value={editForm.title}
              onChange={(e) => setEditForm({ ...editForm, title: e.target.value })}
              placeholder="Tóm tắt trải nghiệm của bạn"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="edit-comment">
              Nhận xét <span className="text-error">*</span>
            </Label>
            <Textarea
              id="edit-comment"
              value={editForm.comment}
              onChange={(e) => setEditForm({ ...editForm, comment: e.target.value })}
              placeholder="Chia sẻ chi tiết về trải nghiệm của bạn"
              rows={4}
              className={!isFormValid && editForm.comment.length === 0 ? "border-error" : ""}
            />
            {!isFormValid && editForm.comment.length === 0 && (
              <p className="text-xs text-error">Vui lòng nhập nhận xét</p>
            )}
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={isSaving}>
            Hủy
          </Button>
          <Button onClick={onSave} disabled={isSaving || !isFormValid}>
            {isSaving ? "Đang lưu..." : "Lưu thay đổi"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
