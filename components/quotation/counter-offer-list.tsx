"use client"

import { useEffect, useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Separator } from "@/components/ui/separator"
import { toast } from "sonner"
import { apiClient } from "@/lib/api-client"
import { Loader2, TrendingDown, TrendingUp, Clock, CheckCircle, XCircle, AlertCircle } from "lucide-react"
import { formatDistanceToNow } from "date-fns"
import { vi } from "date-fns/locale"
import type { CounterOffer } from "@/types"
import { RespondCounterOfferDialog } from "./respond-counter-offer-dialog"

interface CounterOfferListProps {
  quotationId: number
  onCounterOfferUpdate?: () => void
}

export function CounterOfferList({ quotationId, onCounterOfferUpdate }: CounterOfferListProps) {
  const [counterOffers, setCounterOffers] = useState<CounterOffer[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [selectedCounterOffer, setSelectedCounterOffer] = useState<CounterOffer | null>(null)
  const [showRespondDialog, setShowRespondDialog] = useState(false)

  const loadCounterOffers = async () => {
    try {
      const data = await apiClient.getCounterOffersByQuotation(quotationId)
      setCounterOffers(data)
    } catch (error: any) {
      console.error("Failed to load counter-offers:", error)
      toast.error("Không thể tải danh sách đề xuất giá")
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    loadCounterOffers()
  }, [quotationId])

  const handleRespond = (counterOffer: CounterOffer) => {
    setSelectedCounterOffer(counterOffer)
    setShowRespondDialog(true)
  }

  const handleRespondSuccess = () => {
    loadCounterOffers()
    onCounterOfferUpdate?.()
  }

  const getStatusBadge = (status: CounterOffer["status"]) => {
    switch (status) {
      case "PENDING":
        return <Badge variant="outline" className="bg-yellow-50 text-yellow-700 border-yellow-200">Đang chờ</Badge>
      case "ACCEPTED":
        return <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">Đã chấp nhận</Badge>
      case "REJECTED":
        return <Badge variant="outline" className="bg-red-50 text-red-700 border-red-200">Đã từ chối</Badge>
      case "EXPIRED":
        return <Badge variant="outline" className="bg-gray-50 text-gray-700 border-gray-200">Hết hạn</Badge>
      case "SUPERSEDED":
        return <Badge variant="outline" className="bg-gray-50 text-gray-700 border-gray-200">Đã thay thế</Badge>
      default:
        return <Badge variant="outline">{status}</Badge>
    }
  }

  const getStatusIcon = (status: CounterOffer["status"]) => {
    switch (status) {
      case "PENDING":
        return <Clock className="h-4 w-4 text-yellow-600" />
      case "ACCEPTED":
        return <CheckCircle className="h-4 w-4 text-green-600" />
      case "REJECTED":
        return <XCircle className="h-4 w-4 text-red-600" />
      case "EXPIRED":
        return <AlertCircle className="h-4 w-4 text-gray-600" />
      case "SUPERSEDED":
        return <AlertCircle className="h-4 w-4 text-gray-600" />
      default:
        return null
    }
  }

  if (isLoading) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center py-8">
          <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
        </CardContent>
      </Card>
    )
  }

  if (counterOffers.length === 0) {
    return (
      <Card>
        <CardContent className="flex flex-col items-center justify-center py-8 text-center">
          <p className="text-muted-foreground">Chưa có đề xuất giá nào</p>
        </CardContent>
      </Card>
    )
  }

  return (
    <>
      <div className="space-y-4">
        {counterOffers.map((counterOffer) => (
          <Card key={counterOffer.counterOfferId}>
            <CardHeader>
              <div className="flex items-start justify-between">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    {getStatusIcon(counterOffer.status)}
                    <CardTitle className="text-base">
                      Đề xuất từ {counterOffer.offeredByUserName}
                    </CardTitle>
                  </div>
                  <CardDescription>
                    {formatDistanceToNow(new Date(counterOffer.createdAt), {
                      addSuffix: true,
                      locale: vi,
                    })}
                  </CardDescription>
                </div>
                {getStatusBadge(counterOffer.status)}
              </div>
            </CardHeader>

            <CardContent className="space-y-4">
              {/* Price Comparison */}
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <p className="text-sm text-muted-foreground">Giá gốc</p>
                  <p className="text-lg font-semibold">
                    {counterOffer.originalPrice.toLocaleString("vi-VN")} VND
                  </p>
                </div>
                <div className="space-y-1">
                  <p className="text-sm text-muted-foreground">Giá đề xuất</p>
                  <p className="text-lg font-semibold text-primary">
                    {counterOffer.offeredPrice.toLocaleString("vi-VN")} VND
                  </p>
                </div>
              </div>

              {/* Price Difference */}
              <div className="flex items-center gap-2 rounded-lg bg-muted p-3">
                {counterOffer.priceDifference < 0 ? (
                  <TrendingUp className="h-4 w-4 text-red-600" />
                ) : (
                  <TrendingDown className="h-4 w-4 text-green-600" />
                )}
                <span className="text-sm">
                  {counterOffer.priceDifference < 0 ? "Tăng" : "Giảm"}{" "}
                  <span className="font-semibold">
                    {Math.abs(counterOffer.priceDifference).toLocaleString("vi-VN")} VND
                  </span>{" "}
                  ({Math.abs(counterOffer.percentageChange).toFixed(1)}%)
                </span>
              </div>

              {/* Reason */}
              {counterOffer.reason && (
                <div className="space-y-1">
                  <p className="text-sm font-medium">Lý do:</p>
                  <p className="text-sm text-muted-foreground">{counterOffer.reason}</p>
                </div>
              )}

              {/* Message */}
              {counterOffer.message && (
                <div className="space-y-1">
                  <p className="text-sm font-medium">Tin nhắn:</p>
                  <p className="text-sm text-muted-foreground">{counterOffer.message}</p>
                </div>
              )}

              {/* Expiration */}
              {counterOffer.status === "PENDING" && (
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Clock className="h-4 w-4" />
                  {counterOffer.isExpired ? (
                    <span className="text-red-600">Đã hết hạn</span>
                  ) : counterOffer.hoursUntilExpiration !== undefined ? (
                    <span>
                      Hết hạn sau {counterOffer.hoursUntilExpiration} giờ
                    </span>
                  ) : (
                    <span>Hết hạn vào {new Date(counterOffer.expiresAt).toLocaleString("vi-VN")}</span>
                  )}
                </div>
              )}

              {/* Response */}
              {counterOffer.respondedAt && (
                <>
                  <Separator />
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <p className="text-sm font-medium">Phản hồi từ {counterOffer.respondedByUserName}</p>
                      <p className="text-xs text-muted-foreground">
                        {formatDistanceToNow(new Date(counterOffer.respondedAt), {
                          addSuffix: true,
                          locale: vi,
                        })}
                      </p>
                    </div>
                    {counterOffer.responseMessage && (
                      <p className="text-sm text-muted-foreground">{counterOffer.responseMessage}</p>
                    )}
                  </div>
                </>
              )}

              {/* Actions */}
              {counterOffer.canRespond && (
                <div className="flex gap-2 pt-2">
                  <Button
                    size="sm"
                    onClick={() => handleRespond(counterOffer)}
                    className="flex-1"
                  >
                    Phản hồi
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Respond Dialog */}
      {selectedCounterOffer && (
        <RespondCounterOfferDialog
          open={showRespondDialog}
          onOpenChange={setShowRespondDialog}
          counterOffer={selectedCounterOffer}
          onSuccess={handleRespondSuccess}
        />
      )}
    </>
  )
}

