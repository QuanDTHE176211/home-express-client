"use client"

import { useState } from "react"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { toast } from "sonner"
import { apiClient } from "@/lib/api-client"
import { Loader2 } from "lucide-react"
import type { QuotationDetail } from "@/types"

interface CreateCounterOfferDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  quotation: QuotationDetail
  onSuccess?: () => void
}

export function CreateCounterOfferDialog({
  open,
  onOpenChange,
  quotation,
  onSuccess,
}: CreateCounterOfferDialogProps) {
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [offeredPrice, setOfferedPrice] = useState<string>("")
  const [message, setMessage] = useState("")
  const [reason, setReason] = useState("")
  const [expirationHours, setExpirationHours] = useState<string>("24")

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!offeredPrice || parseFloat(offeredPrice) <= 0) {
      toast.error("Vui lòng nhập giá đề xuất hợp lệ")
      return
    }

    const priceValue = parseFloat(offeredPrice)
    if (priceValue >= quotation.total_price) {
      toast.error("Giá đề xuất phải thấp hơn giá hiện tại")
      return
    }

    setIsSubmitting(true)

    try {
      await apiClient.createCounterOffer(quotation.quotation_id, {
        offeredPrice: priceValue,
        message: message || undefined,
        reason: reason || undefined,
        expirationHours: parseInt(expirationHours),
      })

      toast.success("Đề xuất giá thành công", {
        description: "Đề xuất giá của bạn đã được gửi đến nhà vận chuyển",
      })

      // Reset form
      setOfferedPrice("")
      setMessage("")
      setReason("")
      setExpirationHours("24")

      onOpenChange(false)
      onSuccess?.()
    } catch (error: any) {
      console.error("Failed to create counter-offer:", error)
      toast.error("Không thể tạo đề xuất giá", {
        description: error.message || "Vui lòng thử lại sau",
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  const priceDifference = offeredPrice
    ? quotation.total_price - parseFloat(offeredPrice)
    : 0
  const percentageChange = offeredPrice
    ? ((priceDifference / quotation.total_price) * 100).toFixed(1)
    : "0"

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Đề xuất giá mới</DialogTitle>
          <DialogDescription>
            Đề xuất một mức giá mới cho báo giá này. Nhà vận chuyển sẽ xem xét và phản hồi.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Current Price */}
          <div className="rounded-lg bg-muted p-4">
            <div className="flex justify-between items-center">
              <span className="text-sm text-muted-foreground">Giá hiện tại:</span>
              <span className="text-lg font-semibold">
                {quotation.total_price.toLocaleString("vi-VN")} VND
              </span>
            </div>
          </div>

          {/* Offered Price */}
          <div className="space-y-2">
            <Label htmlFor="offeredPrice">
              Giá đề xuất <span className="text-destructive">*</span>
            </Label>
            <Input
              id="offeredPrice"
              type="number"
              placeholder="Nhập giá đề xuất"
              value={offeredPrice}
              onChange={(e) => setOfferedPrice(e.target.value)}
              min="1"
              step="1000"
              required
            />
            {offeredPrice && parseFloat(offeredPrice) > 0 && (
              <div className="text-sm space-y-1">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Chênh lệch:</span>
                  <span className={priceDifference > 0 ? "text-green-600" : "text-red-600"}>
                    {priceDifference > 0 ? "-" : "+"}
                    {Math.abs(priceDifference).toLocaleString("vi-VN")} VND
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Phần trăm:</span>
                  <span className={priceDifference > 0 ? "text-green-600" : "text-red-600"}>
                    {priceDifference > 0 ? "-" : "+"}
                    {Math.abs(parseFloat(percentageChange))}%
                  </span>
                </div>
              </div>
            )}
          </div>

          {/* Reason */}
          <div className="space-y-2">
            <Label htmlFor="reason">Lý do</Label>
            <Input
              id="reason"
              placeholder="Ví dụ: Giá thị trường thấp hơn"
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              maxLength={500}
            />
          </div>

          {/* Message */}
          <div className="space-y-2">
            <Label htmlFor="message">Tin nhắn</Label>
            <Textarea
              id="message"
              placeholder="Thêm tin nhắn cho nhà vận chuyển (tùy chọn)"
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              rows={3}
              maxLength={1000}
            />
          </div>

          {/* Expiration */}
          <div className="space-y-2">
            <Label htmlFor="expiration">Thời hạn phản hồi</Label>
            <Select value={expirationHours} onValueChange={setExpirationHours}>
              <SelectTrigger id="expiration">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="12">12 giờ</SelectItem>
                <SelectItem value="24">24 giờ (Mặc định)</SelectItem>
                <SelectItem value="48">48 giờ</SelectItem>
                <SelectItem value="72">72 giờ</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={isSubmitting}
            >
              Hủy
            </Button>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Gửi đề xuất
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}

