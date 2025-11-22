"use client"

import { useState, useEffect, Suspense } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { useLanguage } from "@/contexts/language-context"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { AlertCircle, Star, Truck, Clock, MessageSquare, RefreshCw } from "lucide-react"
import { BookingFlowBreadcrumb } from "@/components/customer/booking-flow-breadcrumb"
import { QuotePreview } from "@/components/customer/quote-preview"
import { apiClient } from "@/lib/api-client"
import { formatVND } from "@/lib/currency"
import { toast } from "sonner"
import type { QuotationDetail, Bid } from "@/types"
import type { QuoteData } from "@/lib/types/scan"

function EmptyState() {
    return (
        <div className="space-y-4">
            {[1, 2, 3].map((i) => (
                <Card key={i} className="animate-pulse">
                    <CardContent className="p-6">
                        <div className="flex items-center justify-between gap-4">
                            <div className="flex items-center gap-4 flex-1">
                                <div className="h-12 w-12 rounded-full bg-muted" />
                                <div className="space-y-2 flex-1">
                                    <div className="h-4 w-32 bg-muted rounded" />
                                    <div className="h-3 w-48 bg-muted rounded" />
                                </div>
                            </div>
                            <div className="h-8 w-32 bg-muted rounded" />
                        </div>
                    </CardContent>
                </Card>
            ))}
            <Alert>
                <Clock className="h-4 w-4" />
                <AlertDescription>Nhà xe đang xem yêu cầu của bạn. Vui lòng đợi trong giây lát...</AlertDescription>
            </Alert>
        </div>
    )
}

function BidCard({ bid, onSelect, isSelecting }: { bid: Bid; onSelect: () => void; isSelecting: boolean }) {
    return (
        <Card className="hover:shadow-md transition-shadow">
            <CardContent className="p-6">
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                    <div className="flex items-start gap-4 flex-1">
                        <Avatar className="h-12 w-12">
                            <AvatarImage src={bid.transporterAvatar || "/placeholder.svg"} alt={bid.transporterName} />
                            <AvatarFallback>{bid.transporterName.charAt(0)}</AvatarFallback>
                        </Avatar>
                        <div className="space-y-2 flex-1">
                            <div className="flex items-center gap-2 flex-wrap">
                                <h3 className="font-semibold">{bid.transporterName}</h3>
                                <Badge variant="secondary" className="gap-1">
                                    <Star className="h-3 w-3 fill-current" />
                                    {bid.rating.toFixed(1)}
                                </Badge>
                                <span className="text-sm text-muted-foreground">{bid.completedJobs} việc</span>
                            </div>
                            <div className="flex items-center gap-4 text-sm text-muted-foreground">
                                <div className="flex items-center gap-1">
                                    <Truck className="h-4 w-4" />
                                    <span>{bid.vehicleType}</span>
                                </div>
                                <div className="flex items-center gap-1">
                                    <Clock className="h-4 w-4" />
                                    <span>{bid.estimatedArrival}</span>
                                </div>
                            </div>
                            {bid.note && (
                                <div className="flex items-start gap-1 text-sm text-muted-foreground">
                                    <MessageSquare className="h-4 w-4 mt-0.5 flex-shrink-0" />
                                    <span className="line-clamp-2">{bid.note}</span>
                                </div>
                            )}
                        </div>
                    </div>
                    <div className="flex sm:flex-col items-center sm:items-end gap-3 w-full sm:w-auto">
                        <div className="text-right flex-1 sm:flex-none">
                            <div className="text-2xl font-bold text-primary">{formatVND(bid.amount)}</div>
                        </div>
                        <Button onClick={onSelect} disabled={isSelecting} className="w-full sm:w-auto">
                            {isSelecting ? "Đang chọn..." : "Chọn"}
                        </Button>
                    </div>
                </div>
            </CardContent>
        </Card>
    )
}

function mapQuotationToBid(quotation: QuotationDetail): Bid {
    return {
        id: quotation.quotation_id,
        transporterId: quotation.transport_id,
        transporterName: quotation.transporter_name || `Nhà xe #${quotation.transport_id}`,
        transporterAvatar: quotation.transporter_avatar || undefined,
        rating: quotation.transporter_rating || 0,
        completedJobs: quotation.transporter_completed_jobs || 0,
        amount: quotation.total_price || 0,
        note: quotation.notes || undefined,
        estimatedArrival: quotation.estimated_duration_hours
            ? `${quotation.estimated_duration_hours} giờ`
            : "Chưa xác định",
        vehicleType: "Xe tải",
        createdAt: quotation.created_at,
    }
}

function BidsPageContent() {
    const router = useRouter()
    const searchParams = useSearchParams()
    const bookingId = Number(searchParams.get("bookingId"))
    const sessionId = searchParams.get("sid")
    const { t } = useLanguage()

    const [bids, setBids] = useState<Bid[]>([])
    const [loading, setLoading] = useState(true)
    const [selecting, setSelecting] = useState(false)
    const [error, setError] = useState<string | null>(null)
    const [sortBy, setSortBy] = useState<"price" | "rating">("price")
    const [isPolling, setIsPolling] = useState(true)

    // Quote preview state
    const [quoteData, setQuoteData] = useState<QuoteData | null>(null)
    const [quoteLoading, setQuoteLoading] = useState(false)
    const [quoteError, setQuoteError] = useState<string>()

    // Fetch quote when session ID is provided
    useEffect(() => {
        if (sessionId) {
            fetchQuote(sessionId)
        }
    }, [sessionId])

    async function fetchQuote(sid: string) {
        try {
            setQuoteLoading(true)
            setQuoteError(undefined)

            const response = await fetch(`/api/scan-sessions/${sid}/quote`, {
                method: 'POST',
            })

            if (!response.ok) {
                throw new Error('Không thể tính báo giá')
            }

            const data = await response.json()
            setQuoteData(data.quote)
        } catch (error) {
            console.error('Error fetching quote:', error)
            setQuoteError(error instanceof Error ? error.message : 'Không thể tính báo giá. Vui lòng thử lại.')
        } finally {
            setQuoteLoading(false)
        }
    }

    useEffect(() => {
        if (!bookingId || isNaN(bookingId)) {
            toast.error("Không tìm thấy booking ID")
            router.push("/customer/bookings/create")
            return
        }

        const loadBids = async () => {
            try {
                const response = await apiClient.getBookingQuotations(bookingId)
                const quotations = response.quotations || []
                const mappedBids = quotations.map(mapQuotationToBid).sort((a: Bid, b: Bid) => a.amount - b.amount)
                setBids(mappedBids)
                setError(null)
            } catch (err) {
                console.error("Failed to load quotations:", err)
                setError(err instanceof Error ? err.message : "Có lỗi xảy ra")
            } finally {
                setLoading(false)
            }
        }

        loadBids()

        if (isPolling) {
            const intervalId = setInterval(() => {
                if (!document.hidden) {
                    loadBids()
                }
            }, 10000)
            return () => clearInterval(intervalId)
        }
    }, [bookingId, router, isPolling])

    const handleRetry = () => {
        setError(null)
        setLoading(true)
        setIsPolling(true)
    }

    const handleSelectBid = async (quotationId: number) => {
        setSelecting(true)
        setError(null)

        try {
            await apiClient.acceptQuotation(quotationId)
            toast.success("Đã chọn nhà xe thành công!")
            router.push(`/customer/checkout?bookingId=${bookingId}`)
        } catch (err) {
            const errorMessage = err instanceof Error ? err.message : "Có lỗi xảy ra"
            setError(errorMessage)
            toast.error(errorMessage)
            setSelecting(false)
        }
    }

    const sortedBids = [...bids].sort((a, b) => {
        if (sortBy === "price") {
            return a.amount - b.amount
        }
        return b.rating - a.rating
    })

    if (loading && bids.length === 0) {
        return (
            <div className="min-h-screen bg-gradient-to-b from-background to-muted/20 py-8 px-4">
                <div className="max-w-4xl mx-auto">
                    <BookingFlowBreadcrumb currentStep={4} />
                    <Card>
                        <CardHeader>
                            <CardTitle>Chọn nhà xe</CardTitle>
                            <CardDescription>Đang chờ nhà xe báo giá...</CardDescription>
                        </CardHeader>
                        <CardContent>
                            <EmptyState />
                        </CardContent>
                    </Card>
                </div>
            </div>
        )
    }

    return (
        <div className="min-h-screen bg-gradient-to-b from-background to-muted/20 py-8 px-4">
            <div className="max-w-4xl mx-auto">
                <BookingFlowBreadcrumb currentStep={4} />

                {/* Quote Preview Section */}
                <QuotePreview
                    quote={quoteData}
                    loading={quoteLoading}
                    error={quoteError}
                />

                <Card>
                    <CardHeader>
                        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                            <div>
                                <CardTitle>Chọn nhà xe</CardTitle>
                                <CardDescription>
                                    {bids.length > 0 ? `${bids.length} nhà xe đã báo giá` : "Đang chờ nhà xe báo giá..."}
                                </CardDescription>
                            </div>
                            {bids.length > 0 && (
                                <Select value={sortBy} onValueChange={(value: "price" | "rating") => setSortBy(value)}>
                                    <SelectTrigger className="w-[180px]">
                                        <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="price">Giá thấp nhất</SelectItem>
                                        <SelectItem value="rating">Đánh giá cao nhất</SelectItem>
                                    </SelectContent>
                                </Select>
                            )}
                        </div>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        {bids.length === 0 ? (
                            <EmptyState />
                        ) : (
                            <div className="space-y-3">
                                {sortedBids.map((bid) => (
                                    <BidCard key={bid.id} bid={bid} onSelect={() => handleSelectBid(bid.id)} isSelecting={selecting} />
                                ))}
                            </div>
                        )}
                        {error && (
                            <Alert variant="destructive">
                                <AlertCircle className="h-4 w-4" />
                                <AlertDescription>
                                    <div className="flex items-center justify-between gap-4">
                                        <span>{error}</span>
                                        <Button variant="outline" size="sm" onClick={handleRetry}>
                                            <RefreshCw className="h-4 w-4 mr-2" />
                                            Thử lại
                                        </Button>
                                    </div>
                                </AlertDescription>
                            </Alert>
                        )}
                    </CardContent>
                </Card>
            </div>
        </div>
    )
}

export default function BidsPage() {
    return (
        <Suspense
            fallback={
                <div className="min-h-screen bg-gradient-to-b from-background to-muted/20 py-8 px-4">
                    <div className="max-w-4xl mx-auto">
                        <Card>
                            <CardContent className="p-12 text-center">
                                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4" />
                                <p className="text-muted-foreground">Đang tải...</p>
                            </CardContent>
                        </Card>
                    </div>
                </div>
            }
        >
            <BidsPageContent />
        </Suspense>
    )
}
