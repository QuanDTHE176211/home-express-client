"use client"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Loader2, MessageSquare } from "lucide-react"
import { apiClient } from "@/lib/api-client"

interface ReviewResponseFormProps {
  reviewId: number
  reviewerName: string
  onSuccess?: () => void
}

export function ReviewResponseForm({ reviewId, reviewerName, onSuccess }: ReviewResponseFormProps) {
  const [response, setResponse] = useState("")
  const [submitting, setSubmitting] = useState(false)

  const handleSubmit = async () => {
    if (!response.trim()) {
      alert("Vui lòng nhập phản hồi")
      return
    }

    try {
      setSubmitting(true)

      await apiClient.respondToReview(reviewId, response)

      alert("Phản hồi đã được gửi thành công!")
      setResponse("")

      if (onSuccess) {
        onSuccess()
      }
    } catch (error: any) {
      alert(error.message || "Không thể gửi phản hồi")
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <Card className="border-primary/50 bg-primary/5">
      <CardHeader>
        <div className="flex items-start gap-4">
          <div className="rounded-full bg-primary/10 p-3">
            <MessageSquare className="h-6 w-6 text-primary" />
          </div>
          <div className="flex-1">
            <CardTitle>Phản hồi đánh giá</CardTitle>
            <CardDescription>Trả lời đánh giá từ {reviewerName}</CardDescription>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <Textarea
          placeholder="Nhập phản hồi của bạn..."
          value={response}
          onChange={(e) => setResponse(e.target.value)}
          rows={4}
          maxLength={500}
        />
        <div className="flex justify-between items-center">
          <p className="text-xs text-muted-foreground">{response.length}/500</p>
          <Button onClick={handleSubmit} disabled={submitting || !response.trim()}>
            {submitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Gửi phản hồi
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}
