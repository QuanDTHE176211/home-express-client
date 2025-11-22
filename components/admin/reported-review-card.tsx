"use client"

import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { StarRating } from "@/components/reviews/star-rating"
import { AlertTriangle, EyeOff, Trash2, CheckCircle, Loader2 } from "lucide-react"
import { formatDate } from "@/lib/format"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"

interface ReportedReview {
  report_id: number
  review_id: number
  reporter_name: string
  reason: string
  description: string | null
  status: "pending" | "reviewed" | "resolved" | "dismissed"
  created_at: string
  review: {
    rating: number
    title: string | null
    comment: string | null
    reviewer_name: string
    booking_id: number
  }
}

interface ReportedReviewCardProps {
  report: ReportedReview
  onModerate: (reviewId: number, action: any) => Promise<boolean>
  onUpdateStatus: (reportId: number, status: string, notes?: string) => Promise<boolean>
  onRefresh: () => void
}

export function ReportedReviewCard({ report, onModerate, onUpdateStatus, onRefresh }: ReportedReviewCardProps) {
  const [showDialog, setShowDialog] = useState(false)
  const [actionType, setActionType] = useState<"approve" | "hide" | "delete" | null>(null)
  const [reason, setReason] = useState("")
  const [adminNotes, setAdminNotes] = useState("")
  const [loading, setLoading] = useState(false)

  const statusColors = {
    pending: "bg-yellow-500",
    reviewed: "bg-blue-500",
    resolved: "bg-green-500",
    dismissed: "bg-gray-500",
  }

  const statusLabels = {
    pending: "Chờ xử lý",
    reviewed: "Đã xem",
    resolved: "Đã giải quyết",
    dismissed: "Đã bỏ qua",
  }

  const handleAction = async () => {
    if (!actionType) return

    setLoading(true)
    const success = await onModerate(report.review_id, {
      action: actionType,
      reason: reason.trim() || undefined,
      notifyUser: true,
    })

    if (success) {
      await onUpdateStatus(report.report_id, "resolved", adminNotes.trim() || undefined)
      setShowDialog(false)
      onRefresh()
    }
    setLoading(false)
  }

  const handleStatusChange = async (newStatus: string) => {
    setLoading(true)
    const success = await onUpdateStatus(report.report_id, newStatus)
    if (success) {
      onRefresh()
    }
    setLoading(false)
  }

  const openDialog = (action: "approve" | "hide" | "delete") => {
    setActionType(action)
    setShowDialog(true)
  }

  return (
    <>
      <Card>
        <CardHeader>
          <div className="flex items-start justify-between">
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <AlertTriangle className="h-5 w-5 text-destructive" />
                <CardTitle className="text-lg">Báo cáo #{report.report_id}</CardTitle>
                <Badge className={statusColors[report.status]}>{statusLabels[report.status]}</Badge>
              </div>
              <p className="text-sm text-muted-foreground">
                Báo cáo bởi {report.reporter_name} • {formatDate(report.created_at)}
              </p>
            </div>

            <Select value={report.status} onValueChange={handleStatusChange} disabled={loading}>
              <SelectTrigger className="w-40">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="pending">Chờ xử lý</SelectItem>
                <SelectItem value="reviewed">Đã xem</SelectItem>
                <SelectItem value="resolved">Đã giải quyết</SelectItem>
                <SelectItem value="dismissed">Đã bỏ qua</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardHeader>

        <CardContent className="space-y-4">
          <div className="rounded-lg bg-muted p-4 space-y-2">
            <p className="text-sm font-medium">Lý do báo cáo: {report.reason}</p>
            {report.description && <p className="text-sm text-muted-foreground">{report.description}</p>}
          </div>

          <div className="rounded-lg border p-4 space-y-3">
            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium">{report.review.reviewer_name}</p>
                <p className="text-sm text-muted-foreground">Đơn hàng #{report.review.booking_id}</p>
              </div>
              <StarRating rating={report.review.rating} size="sm" />
            </div>

            {report.review.title && <p className="font-medium">{report.review.title}</p>}
            {report.review.comment && <p className="text-sm">{report.review.comment}</p>}
          </div>

          <div className="flex gap-2 justify-end">
            <Button variant="outline" size="sm" onClick={() => openDialog("approve")}>
              <CheckCircle className="mr-2 h-4 w-4" />
              Chấp nhận
            </Button>
            <Button variant="outline" size="sm" onClick={() => openDialog("hide")}>
              <EyeOff className="mr-2 h-4 w-4" />
              Ẩn đánh giá
            </Button>
            <Button variant="destructive" size="sm" onClick={() => openDialog("delete")}>
              <Trash2 className="mr-2 h-4 w-4" />
              Xóa đánh giá
            </Button>
          </div>
        </CardContent>
      </Card>

      <Dialog open={showDialog} onOpenChange={setShowDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {actionType === "approve" && "Chấp nhận đánh giá"}
              {actionType === "hide" && "Ẩn đánh giá"}
              {actionType === "delete" && "Xóa đánh giá"}
            </DialogTitle>
            <DialogDescription>
              {actionType === "approve" &&
                "Đánh giá này sẽ được giữ nguyên và báo cáo sẽ được đánh dấu là đã giải quyết."}
              {actionType === "hide" && "Đánh giá này sẽ bị ẩn khỏi công khai nhưng vẫn được lưu trong hệ thống."}
              {actionType === "delete" &&
                "Đánh giá này sẽ bị xóa vĩnh viễn khỏi hệ thống. Hành động này không thể hoàn tác."}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="reason">Lý do {actionType === "approve" ? "(tùy chọn)" : ""}</Label>
              <Textarea
                id="reason"
                placeholder={`Nhập lý do ${actionType === "approve" ? "chấp nhận" : actionType === "hide" ? "ẩn" : "xóa"} đánh giá...`}
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                rows={3}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="adminNotes">Ghi chú nội bộ (tùy chọn)</Label>
              <Textarea
                id="adminNotes"
                placeholder="Ghi chú cho quản trị viên khác..."
                value={adminNotes}
                onChange={(e) => setAdminNotes(e.target.value)}
                rows={2}
              />
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setShowDialog(false)} disabled={loading}>
              Hủy
            </Button>
            <Button
              onClick={handleAction}
              disabled={loading}
              variant={actionType === "delete" ? "destructive" : "default"}
            >
              {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Xác nhận
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  )
}
