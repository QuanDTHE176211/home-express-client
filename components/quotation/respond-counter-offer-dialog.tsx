"use client"

import { useState } from "react"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { toast } from "sonner"
import { apiClient } from "@/lib/api-client"
import { Loader2, CheckCircle, XCircle } from "lucide-react"
import type { CounterOffer } from "@/types"

interface RespondCounterOfferDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  counterOffer: CounterOffer
  onSuccess?: () => void
}

export function RespondCounterOfferDialog({
  open,
  onOpenChange,
  counterOffer,
  onSuccess,
}: RespondCounterOfferDialogProps) {
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [responseMessage, setResponseMessage] = useState("")
  const [action, setAction] = useState<"accept" | "reject" | null>(null)

  const handleSubmit = async (accept: boolean) => {
    setAction(accept ? "accept" : "reject")
    setIsSubmitting(true)

    try {
      await apiClient.respondToCounterOffer(counterOffer.counterOfferId, {
        accept,
        responseMessage: responseMessage || undefined,
      })

      toast.success(
        accept ? "Đã chấp nhận đề xuất giá" : "Đã từ chối đề xuất giá",
        {
          description: accept
            ? "Giá báo giá đã được cập nhật theo đề xuất"
            : "Đề xuất giá đã bị từ chối",
        }
      )

      setResponseMessage("")
      setAction(null)
      onOpenChange(false)
      onSuccess?.()
    } catch (error: any) {
      console.error("Failed to respond to counter-offer:", error)
      toast.error("Không thể phản hồi đề xuất giá", {
        description: error.message || "Vui lòng thử lại sau",
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Phản hồi đề xuất giá</DialogTitle>
          <DialogDescription>
            Chấp nhận hoặc từ chối đề xuất giá từ {counterOffer.offeredByUserName}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {/* Price Comparison */}
          <div className="rounded-lg border p-4 space-y-3">
            <div className="flex justify-between items-center">
              <span className="text-sm text-muted-foreground">Giá hiện tại:</span>
              <span className="text-lg font-semibold">
                {counterOffer.originalPrice.toLocaleString("vi-VN")} VND
              </span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm text-muted-foreground">Giá đề xuất:</span>
              <span className="text-lg font-semibold text-primary">
                {counterOffer.offeredPrice.toLocaleString("vi-VN")} VND
              </span>
            </div>
            <div className="flex justify-between items-center pt-2 border-t">
              <span className="text-sm font-medium">Chênh lệch:</span>
              <span className={counterOffer.priceDifference > 0 ? "text-green-600 font-semibold" : "text-red-600 font-semibold"}>
                {counterOffer.priceDifference > 0 ? "-" : "+"}
                {Math.abs(counterOffer.priceDifference).toLocaleString("vi-VN")} VND
                ({Math.abs(counterOffer.percentageChange).toFixed(1)}%)
              </span>
            </div>
          </div>

          {/* Counter-offer Details */}
          {counterOffer.reason && (
            <div className="space-y-1">
              <p className="text-sm font-medium">Lý do:</p>
              <p className="text-sm text-muted-foreground">{counterOffer.reason}</p>
            </div>
          )}

          {counterOffer.message && (
            <div className="space-y-1">
              <p className="text-sm font-medium">Tin nhắn:</p>
              <p className="text-sm text-muted-foreground">{counterOffer.message}</p>
            </div>
          )}

          {/* Response Message */}
          <div className="space-y-2">
            <Label htmlFor="responseMessage">Tin nhắn phản hồi (tùy chọn)</Label>
            <Textarea
              id="responseMessage"
              placeholder="Thêm tin nhắn phản hồi..."
              value={responseMessage}
              onChange={(e) => setResponseMessage(e.target.value)}
              rows={3}
              maxLength={1000}
            />
          </div>
        </div>

        <DialogFooter className="flex-col sm:flex-row gap-2">
          <Button
            type="button"
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={isSubmitting}
            className="w-full sm:w-auto"
          >
            Hủy
          </Button>
          <Button
            type="button"
            variant="destructive"
            onClick={() => handleSubmit(false)}
            disabled={isSubmitting}
            className="w-full sm:w-auto"
          >
            {isSubmitting && action === "reject" && (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            )}
            {!isSubmitting && <XCircle className="mr-2 h-4 w-4" />}
            Từ chối
          </Button>
          <Button
            type="button"
            onClick={() => handleSubmit(true)}
            disabled={isSubmitting}
            className="w-full sm:w-auto"
          >
            {isSubmitting && action === "accept" && (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            )}
            {!isSubmitting && <CheckCircle className="mr-2 h-4 w-4" />}
            Chấp nhận
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

