"use client"

import { useState } from "react"
import Link from "next/link"
import Image from "next/image"
import useSWR from "swr"
import { Search, Star, X } from "lucide-react"

import { DashboardLayout } from "@/components/dashboard/dashboard-layout"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { customerNavItems } from "@/lib/customer-nav-config"
import { useDebounce } from "@/lib/debounce"
import { apiClient } from "@/lib/api-client"
import { useToast } from "@/hooks/use-toast"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import { Dialog, DialogContent } from "@/components/ui/dialog"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { ReviewCard } from "@/components/reviews/review-card"
import { EditReviewDialog } from "@/components/reviews/edit-review-dialog"

type ReviewTab = "all" | "with-response" | "no-response"

export default function ReviewsPage() {
  const [searchQuery, setSearchQuery] = useState("")
  const [activeTab, setActiveTab] = useState<ReviewTab>("all")
  const [deleteReviewId, setDeleteReviewId] = useState<string | null>(null)
  const [editReview, setEditReview] = useState<any>(null)
  const [editForm, setEditForm] = useState({ rating: 5, title: "", comment: "" })
  const [isDeleting, setIsDeleting] = useState(false)
  const [isEditing, setIsEditing] = useState(false)
  const [selectedPhoto, setSelectedPhoto] = useState<string | null>(null)
  const debouncedSearch = useDebounce(searchQuery, 300)
  const { toast } = useToast()

  const { data: response, isLoading, error, mutate } = useSWR("/customer/reviews", () => apiClient.getMyReviews())

  const reviews = response?.data?.reviews ?? []

  const filteredReviews = reviews.filter((review: any) => {
    if (!debouncedSearch) return true
    const query = debouncedSearch.toLowerCase()
    return (
      review.transportName?.toLowerCase().includes(query) ||
      review.title?.toLowerCase().includes(query) ||
      review.comment?.toLowerCase().includes(query)
    )
  })

  const tabFilteredReviews = filteredReviews.filter((review: any) => {
    if (activeTab === "with-response") return Boolean(review.response)
    if (activeTab === "no-response") return !review.response
    return true
  })

  const handleDelete = async () => {
    if (!deleteReviewId) return

    setIsDeleting(true)
    try {
      await apiClient.deleteReview(Number(deleteReviewId))
      await mutate()
      toast({
        title: "Đã xóa đánh giá",
        description: "Đánh giá của bạn đã được xóa thành công.",
      })
      setDeleteReviewId(null)
    } catch (err) {
      toast({
        title: "Lỗi",
        description: "Không thể xóa đánh giá. Vui lòng thử lại.",
        variant: "destructive",
      })
    } finally {
      setIsDeleting(false)
    }
  }

  const handleEdit = async () => {
    if (!editReview || !editForm.comment.trim()) {
      toast({
        title: "Lỗi",
        description: "Vui lòng nhập nhận xét.",
        variant: "destructive",
      })
      return
    }

    setIsEditing(true)
    try {
      await apiClient.updateReview(editReview.reviewId, editForm)
      await mutate()
      toast({
        title: "Đã cập nhật đánh giá",
        description: "Đánh giá của bạn đã được cập nhật thành công.",
      })
      setEditReview(null)
    } catch (err) {
      toast({
        title: "Lỗi",
        description: "Không thể cập nhật đánh giá. Vui lòng thử lại.",
        variant: "destructive",
      })
    } finally {
      setIsEditing(false)
    }
  }

  const openEditDialog = (review: any) => {
    setEditReview(review)
    setEditForm({
      rating: review.rating,
      title: review.title ?? "",
      comment: review.comment ?? "",
    })
  }

  return (
    <DashboardLayout navItems={customerNavItems} title="Đánh giá">
      <div className="max-w-7xl mx-auto px-6 py-10 space-y-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Đánh giá của tôi</h1>
          <p className="text-muted-foreground mt-1">Quản lý các đánh giá bạn đã viết cho đơn vận chuyển</p>
        </div>

        {error && (
          <Alert variant="destructive">
            <AlertDescription>Không thể tải danh sách đánh giá. Vui lòng thử lại sau.</AlertDescription>
          </Alert>
        )}

        <div className="relative max-w-md">
          <Search
            className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground"
            aria-hidden="true"
          />
          <Input
            placeholder="Tìm theo tên công ty hoặc nội dung..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10 h-11"
            aria-label="Tìm kiếm đánh giá"
          />
        </div>

        <Tabs value={activeTab} onValueChange={(value) => setActiveTab(value as ReviewTab)}>
          <TabsList>
            <TabsTrigger value="all">
              Tất cả
              {!isLoading && <span className="ml-2 text-xs">({filteredReviews.length})</span>}
            </TabsTrigger>
            <TabsTrigger value="with-response">
              Đã phản hồi
              {!isLoading && (
                <span className="ml-2 text-xs">({filteredReviews.filter((r: any) => r.response).length})</span>
              )}
            </TabsTrigger>
            <TabsTrigger value="no-response">
              Chưa phản hồi
              {!isLoading && (
                <span className="ml-2 text-xs">({filteredReviews.filter((r: any) => !r.response).length})</span>
              )}
            </TabsTrigger>
          </TabsList>

          <TabsContent value={activeTab} className="mt-6">
            {isLoading ? (
              <div className="space-y-4">
                {[...Array(3)].map((_, i) => (
                  <Card key={`skeleton-${i}`} className="animate-pulse">
                    <CardContent className="p-6">
                      <div className="h-32 bg-muted rounded" />
                    </CardContent>
                  </Card>
                ))}
              </div>
            ) : tabFilteredReviews.length === 0 ? (
              <Card>
                <CardContent className="flex flex-col items-center justify-center py-12">
                  <Star className="h-12 w-12 text-muted-foreground mb-4" />
                  <p className="text-lg font-medium mb-2">Chưa có đánh giá</p>
                  <p className="text-sm text-muted-foreground text-center">
                    {searchQuery ? "Không tìm thấy đánh giá nào phù hợp." : "Bạn chưa viết đánh giá nào."}
                  </p>
                  {!searchQuery && (
                    <Button asChild className="mt-4">
                      <Link href="/customer/bookings">Xem các chuyến đi</Link>
                    </Button>
                  )}
                </CardContent>
              </Card>
            ) : (
              <div className="space-y-4">
                {tabFilteredReviews.map((review: any, index: number) => (
                  <ReviewCard
                    key={review.reviewId ?? `review-${index}`}
                    review={review}
                    onEdit={openEditDialog}
                    onDelete={setDeleteReviewId}
                    onPhotoClick={setSelectedPhoto}
                  />
                ))}
              </div>
            )}
          </TabsContent>
        </Tabs>
      </div>

      <AlertDialog open={Boolean(deleteReviewId)} onOpenChange={() => setDeleteReviewId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Xác nhận xóa đánh giá</AlertDialogTitle>
            <AlertDialogDescription>
              Bạn có chắc chắn muốn xóa đánh giá này? Hành động này không thể hoàn tác.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isDeleting}>Hủy</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} disabled={isDeleting} className="bg-error hover:bg-error/90">
              {isDeleting ? "Đang xóa..." : "Xóa"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <EditReviewDialog
        open={Boolean(editReview)}
        onOpenChange={() => setEditReview(null)}
        review={editReview}
        editForm={editForm}
        setEditForm={setEditForm}
        onSave={handleEdit}
        isSaving={isEditing}
      />

      <Dialog open={Boolean(selectedPhoto)} onOpenChange={() => setSelectedPhoto(null)}>
        <DialogContent className="sm:max-w-[800px] p-0">
          <button
            onClick={() => setSelectedPhoto(null)}
            className="absolute right-4 top-4 rounded-sm opacity-70 ring-offset-background transition-opacity hover:opacity-100 focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:pointer-events-none data-[state=open]:bg-accent data-[state=open]:text-muted-foreground z-10 bg-background/80 p-2"
          >
            <X className="h-4 w-4" />
            <span className="sr-only">Đóng</span>
          </button>
          {selectedPhoto && (
            <Image
              src={selectedPhoto}
              alt="Ảnh đánh giá"
              width={1200}
              height={800}
              className="h-auto w-full max-h-[80vh] object-contain"
            />
          )}
        </DialogContent>
      </Dialog>
    </DashboardLayout>
  )
}

