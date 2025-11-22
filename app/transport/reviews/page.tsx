"use client"

import { useCallback, useEffect, useState } from "react"
import Image from "next/image"
import { DashboardLayout } from "@/components/dashboard/dashboard-layout"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Textarea } from "@/components/ui/textarea"
import { Progress } from "@/components/ui/progress"
import { Star, Search, TrendingUp, MessageSquare, CheckCircle2, Filter, Download } from "lucide-react"
import { formatDate } from "@/lib/format"
import { apiClient } from "@/lib/api-client"
import { useToast } from "@/hooks/use-toast"
import { Package, Truck, DollarSign, Settings, FileText, BarChart3, StarIcon } from "lucide-react"

const navItems = [
  { href: "/transport", label: "Tổng quan", icon: "Package" },
  { href: "/transport/jobs", label: "Công việc", icon: "Truck" },
  { href: "/transport/quotations", label: "Báo giá", icon: "FileText" },
  { href: "/transport/vehicles", label: "Xe", icon: "Truck" },
  { href: "/transport/earnings", label: "Thu nhập", icon: "DollarSign" },
  { href: "/transport/analytics", label: "Phân tích", icon: "TrendingUp" },
  { href: "/transport/contracts", label: "Hợp đồng", icon: "FileText" },
  { href: "/transport/reviews", label: "Đánh giá", icon: "Star" },
  { href: "/transport/settings", label: "Cài đặt", icon: "Settings" },
]

interface Review {
  review_id: number
  booking_id: number
  reviewer_name: string
  reviewer_avatar: string | null
  rating: number
  title: string | null
  comment: string | null
  photo_urls: string[] | null
  response: string | null
  responded_at: string | null
  is_verified: boolean
  booking_pickup_location: string
  booking_delivery_location: string
  created_at: string
}

interface ReviewStats {
  total_reviews: number
  average_rating: number
  rating_distribution: {
    five_star: number
    four_star: number
    three_star: number
    two_star: number
    one_star: number
  }
  verified_reviews: number
  with_photos: number
  with_response: number
}

export default function TransportReviewsPage() {
  const { toast } = useToast()
  const [reviews, setReviews] = useState<Review[]>([])
  const [stats, setStats] = useState<ReviewStats | null>(null)
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState("")
  const [ratingFilter, setRatingFilter] = useState<string>("all")
  const [responseFilter, setResponseFilter] = useState<string>("all")
  const [currentPage, setCurrentPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [respondingTo, setRespondingTo] = useState<number | null>(null)
  const [responseText, setResponseText] = useState("")
  const [submitting, setSubmitting] = useState(false)

  const fetchReviews = useCallback(async () => {
    try {
      setLoading(true)
      const params: any = { page: currentPage, limit: 10 }
      if (ratingFilter !== "all") params.rating = Number.parseInt(ratingFilter)
      if (responseFilter === "responded") params.hasResponse = true
      if (responseFilter === "not_responded") params.hasResponse = false

      const response = await apiClient.getMyReviews(params)
      if (response.success) {
        setReviews(response.data.reviews)
        setStats(response.data.stats)
        setTotalPages(response.data.pagination.totalPages)
      }
    } catch (error: any) {
      toast({
        title: "Lỗi",
        description: error.message || "Không thể tải đánh giá",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }, [currentPage, ratingFilter, responseFilter, toast])

  useEffect(() => {
    fetchReviews()
  }, [fetchReviews])

  const handleRespond = async (reviewId: number) => {
    if (!responseText.trim()) {
      toast({
        title: "Lỗi",
        description: "Vui lòng nhập phản hồi",
        variant: "destructive",
      })
      return
    }

    try {
      setSubmitting(true)
      const response = await apiClient.respondToReview(reviewId, responseText.trim())
      if (response.success) {
        toast({
          title: "Thành công",
          description: "Đã gửi phản hồi",
        })
        setRespondingTo(null)
        setResponseText("")
        fetchReviews()
      }
    } catch (error: any) {
      toast({
        title: "Lỗi",
        description: error.message || "Không thể gửi phản hồi",
        variant: "destructive",
      })
    } finally {
      setSubmitting(false)
    }
  }

  const handleExport = () => {
    const csv = [
      ["Ngày", "Khách hàng", "Đánh giá", "Tiêu đề", "Nhận xét", "Đã phản hồi"].join(","),
      ...filteredReviews.map((review) =>
        [
          formatDate(review.created_at),
          review.reviewer_name,
          review.rating,
          review.title || "",
          review.comment || "",
          review.response ? "Có" : "Không",
        ].join(","),
      ),
    ].join("\n")

    const blob = new Blob(["\uFEFF" + csv], { type: "text/csv;charset=utf-8;" })
    const link = document.createElement("a")
    link.href = URL.createObjectURL(blob)
    link.download = `danh-gia-${new Date().toISOString().split("T")[0]}.csv`
    link.click()
  }

  const filteredReviews = reviews.filter((review) => {
    const matchesSearch =
      searchTerm === "" ||
      review.reviewer_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      review.comment?.toLowerCase().includes(searchTerm.toLowerCase())
    return matchesSearch
  })

  const getInitials = (name: string) => {
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
      .slice(0, 2)
  }

  const getRatingPercentage = (count: number) => {
    return stats && stats.total_reviews > 0 ? (count / stats.total_reviews) * 100 : 0
  }

  if (loading && !stats) {
    return (
      <DashboardLayout navItems={navItems} title="Đánh giá">
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-accent-green" />
        </div>
      </DashboardLayout>
    )
  }

  return (
    <DashboardLayout navItems={navItems} title="Đánh giá">
      <div className="max-w-7xl mx-auto px-6 py-10">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold">Đánh giá từ khách hàng</h1>
            <p className="text-muted-foreground mt-1">Xem và phản hồi đánh giá từ khách hàng</p>
          </div>
          <Button onClick={handleExport} variant="outline">
            <Download className="h-4 w-4 mr-2" />
            Xuất CSV
          </Button>
        </div>

        {/* Stats Overview */}
        {stats && (
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4 mb-8">
            <Card className="p-6 hover:shadow-md transition-shadow">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Tổng đánh giá</p>
                  <p className="text-3xl font-bold mt-1">{stats.total_reviews}</p>
                </div>
                <div className="h-12 w-12 rounded-full bg-blue-100 flex items-center justify-center">
                  <Star className="h-6 w-6 text-blue-600" />
                </div>
              </div>
            </Card>

            <Card className="p-6 hover:shadow-md transition-shadow">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Đánh giá TB</p>
                  <p className="text-3xl font-bold mt-1">{stats.average_rating.toFixed(1)}</p>
                  <div className="flex items-center mt-1">
                    {[...Array(5)].map((_, i) => (
                      <Star
                        key={i}
                        className={`h-4 w-4 ${i < Math.floor(stats.average_rating) ? "fill-yellow-400 text-yellow-400" : "text-gray-300"
                          }`}
                      />
                    ))}
                  </div>
                </div>
                <div className="h-12 w-12 rounded-full bg-yellow-100 flex items-center justify-center">
                  <TrendingUp className="h-6 w-6 text-yellow-600" />
                </div>
              </div>
            </Card>

            <Card className="p-6 hover:shadow-md transition-shadow">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Đã phản hồi</p>
                  <p className="text-3xl font-bold mt-1">{stats.with_response}</p>
                  <p className="text-xs text-muted-foreground mt-1">
                    {stats.total_reviews > 0
                      ? `${((stats.with_response / stats.total_reviews) * 100).toFixed(0)}% tổng số`
                      : "0%"}
                  </p>
                </div>
                <div className="h-12 w-12 rounded-full bg-green-100 flex items-center justify-center">
                  <MessageSquare className="h-6 w-6 text-green-600" />
                </div>
              </div>
            </Card>

            <Card className="p-6 hover:shadow-md transition-shadow">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Đã xác minh</p>
                  <p className="text-3xl font-bold mt-1">{stats.verified_reviews}</p>
                  <p className="text-xs text-muted-foreground mt-1">
                    {stats.total_reviews > 0
                      ? `${((stats.verified_reviews / stats.total_reviews) * 100).toFixed(0)}% tổng số`
                      : "0%"}
                  </p>
                </div>
                <div className="h-12 w-12 rounded-full bg-purple-100 flex items-center justify-center">
                  <CheckCircle2 className="h-6 w-6 text-purple-600" />
                </div>
              </div>
            </Card>
          </div>
        )}

        {/* Rating Distribution */}
        {stats && (
          <Card className="p-6 mb-8 hover:shadow-md transition-shadow">
            <h3 className="font-semibold mb-4">Phân bố đánh giá</h3>
            <div className="space-y-3">
              {[
                { stars: 5, count: stats.rating_distribution.five_star },
                { stars: 4, count: stats.rating_distribution.four_star },
                { stars: 3, count: stats.rating_distribution.three_star },
                { stars: 2, count: stats.rating_distribution.two_star },
                { stars: 1, count: stats.rating_distribution.one_star },
              ].map(({ stars, count }) => (
                <div key={stars} className="flex items-center gap-3">
                  <div className="flex items-center gap-1 w-16">
                    <span className="text-sm font-medium">{stars}</span>
                    <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                  </div>
                  <Progress value={getRatingPercentage(count)} className="flex-1 h-2" />
                  <span className="text-sm text-muted-foreground w-12 text-right">{count}</span>
                </div>
              ))}
            </div>
          </Card>
        )}

        {/* Filters */}
        <Card className="p-6 mb-6 hover:shadow-md transition-shadow">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Tìm kiếm theo tên khách hàng hoặc nội dung..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            <Select value={ratingFilter} onValueChange={setRatingFilter}>
              <SelectTrigger className="w-full md:w-[180px]">
                <Filter className="h-4 w-4 mr-2" />
                <SelectValue placeholder="Lọc theo sao" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Tất cả</SelectItem>
                <SelectItem value="5">5 sao</SelectItem>
                <SelectItem value="4">4 sao</SelectItem>
                <SelectItem value="3">3 sao</SelectItem>
                <SelectItem value="2">2 sao</SelectItem>
                <SelectItem value="1">1 sao</SelectItem>
              </SelectContent>
            </Select>
            <Select value={responseFilter} onValueChange={setResponseFilter}>
              <SelectTrigger className="w-full md:w-[180px]">
                <SelectValue placeholder="Trạng thái phản hồi" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Tất cả</SelectItem>
                <SelectItem value="responded">Đã phản hồi</SelectItem>
                <SelectItem value="not_responded">Chưa phản hồi</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </Card>

        {/* Reviews List */}
        <div className="space-y-4">
          {filteredReviews.length === 0 ? (
            <Card className="p-12 text-center hover:shadow-md transition-shadow">
              <Star className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
              <h3 className="text-lg font-semibold mb-2">Chưa có đánh giá</h3>
              <p className="text-muted-foreground">
                {searchTerm || ratingFilter !== "all" || responseFilter !== "all"
                  ? "Không tìm thấy đánh giá phù hợp với bộ lọc"
                  : "Bạn chưa nhận được đánh giá nào từ khách hàng"}
              </p>
            </Card>
          ) : (
            filteredReviews.map((review) => (
              <Card key={review.review_id} className="p-6 hover:shadow-md transition-shadow">
                <div className="flex items-start gap-4">
                  <Avatar className="h-12 w-12">
                    <AvatarImage src={review.reviewer_avatar || undefined} />
                    <AvatarFallback>{getInitials(review.reviewer_name)}</AvatarFallback>
                  </Avatar>
                  <div className="flex-1">
                    <div className="flex items-start justify-between mb-2">
                      <div>
                        <div className="flex items-center gap-2">
                          <p className="font-medium">{review.reviewer_name}</p>
                          {review.is_verified && (
                            <Badge variant="secondary" className="text-xs">
                              <CheckCircle2 className="h-3 w-3 mr-1" />
                              Đã xác minh
                            </Badge>
                          )}
                        </div>
                        <div className="flex items-center gap-2 mt-1">
                          <div className="flex">
                            {[...Array(5)].map((_, i) => (
                              <Star
                                key={i}
                                className={`h-4 w-4 ${i < review.rating ? "fill-yellow-400 text-yellow-400" : "text-gray-300"
                                  }`}
                              />
                            ))}
                          </div>
                          <span className="text-sm text-muted-foreground">{formatDate(review.created_at)}</span>
                        </div>
                      </div>
                    </div>

                    <div className="text-sm text-muted-foreground mb-3">
                      {review.booking_pickup_location} → {review.booking_delivery_location}
                    </div>

                    {review.title && <h4 className="font-medium mb-2">{review.title}</h4>}
                    {review.comment && <p className="text-sm leading-relaxed mb-3">{review.comment}</p>}

                    {review.photo_urls && review.photo_urls.length > 0 && (
                      <div className="flex gap-2 mb-3">
                        {review.photo_urls.map((url, index) => (
                          <Image
                            key={index}
                            src={url || "/placeholder.svg"}
                            alt={`Review photo ${index + 1}`}
                            width={80}
                            height={80}
                            className="h-20 w-20 rounded object-cover"
                          />
                        ))}
                      </div>
                    )}

                    {review.response && (
                      <div className="bg-muted p-4 rounded-lg mt-4">
                        <p className="text-sm font-medium mb-1">Phản hồi của bạn</p>
                        <p className="text-sm">{review.response}</p>
                        <p className="text-xs text-muted-foreground mt-2">{formatDate(review.responded_at!)}</p>
                      </div>
                    )}

                    {!review.response && respondingTo !== review.review_id && (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setRespondingTo(review.review_id)}
                        className="mt-3"
                      >
                        <MessageSquare className="h-4 w-4 mr-2" />
                        Phản hồi
                      </Button>
                    )}

                    {respondingTo === review.review_id && (
                      <div className="mt-4 space-y-3">
                        <Textarea
                          placeholder="Nhập phản hồi của bạn..."
                          value={responseText}
                          onChange={(e) => setResponseText(e.target.value)}
                          rows={3}
                        />
                        <div className="flex gap-2">
                          <Button onClick={() => handleRespond(review.review_id)} disabled={submitting} size="sm">
                            {submitting ? "Đang gửi..." : "Gửi phản hồi"}
                          </Button>
                          <Button
                            variant="outline"
                            onClick={() => {
                              setRespondingTo(null)
                              setResponseText("")
                            }}
                            size="sm"
                          >
                            Hủy
                          </Button>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </Card>
            ))
          )}
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex items-center justify-center gap-2 mt-8">
            <Button
              variant="outline"
              onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
              disabled={currentPage === 1}
            >
              Trước
            </Button>
            <span className="text-sm text-muted-foreground">
              Trang {currentPage} / {totalPages}
            </span>
            <Button
              variant="outline"
              onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
              disabled={currentPage === totalPages}
            >
              Sau
            </Button>
          </div>
        )}
      </div>
    </DashboardLayout>
  )
}

