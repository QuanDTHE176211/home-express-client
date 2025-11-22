"use client"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Star, MessageSquare } from "lucide-react"
import { ReviewSubmissionDialog } from "./review-submission-dialog"

interface ReviewPromptCardProps {
  bookingId: number
  revieweeName: string
  revieweeType: "customer" | "transport"
  onReviewSubmitted?: () => void
}

export function ReviewPromptCard({ bookingId, revieweeName, revieweeType, onReviewSubmitted }: ReviewPromptCardProps) {
  const [showDialog, setShowDialog] = useState(false)

  return (
    <>
      <Card className="border-primary/50 bg-primary/5">
        <CardHeader>
          <div className="flex items-start gap-4">
            <div className="rounded-full bg-primary/10 p-3">
              <Star className="h-6 w-6 text-primary" />
            </div>
            <div className="flex-1">
              <CardTitle>Đánh giá dịch vụ</CardTitle>
              <CardDescription>
                Hãy chia sẻ trải nghiệm của bạn với {revieweeName}. Đánh giá của bạn giúp cải thiện chất lượng dịch vụ.
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <Button onClick={() => setShowDialog(true)} className="w-full">
            <MessageSquare className="mr-2 h-4 w-4" />
            Viết đánh giá
          </Button>
        </CardContent>
      </Card>

      <ReviewSubmissionDialog
        open={showDialog}
        onOpenChange={setShowDialog}
        bookingId={bookingId}
        revieweeName={revieweeName}
        onSuccess={onReviewSubmitted}
      />
    </>
  )
}
