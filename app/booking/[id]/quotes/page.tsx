"use client"

import { useMemo, useState } from "react"
import type { ReactNode } from "react"
import useSWR from "swr"
import { useParams } from "next/navigation"
import { buildApiUrl } from "@/lib/api-url"
import { TransportEstimateCard } from "@/components/estimation/transport-estimate-card"
import { Card } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Separator } from "@/components/ui/separator"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Loader2, ArrowLeft, Sparkles, MapPin, Star, Banknote } from "lucide-react"
import Link from "next/link"
import { formatVND } from "@/lib/format"

type ApiBreakdown = {
  basePrice: number
  distancePrice: number
  itemsPrice: number
  floorFees: number
  subtotal?: number
  multiplier: number
}

type ApiEstimate = {
  transportId: number
  transportName: string
  rating: number
  completedJobs: number
  vehicleType: string
  vehicleName: string
  licensePlate: string
  totalPrice: number
  estimatedDuration: number
  rankScore: number
  breakdown: ApiBreakdown
  distanceKm?: number
}

type AutoEstimationResponse = {
  estimations: ApiEstimate[]
  priceRange?: { lowest: number; highest: number; average: number }
  recommendedVehicleType?: string
  distanceKm?: number
  success: boolean
  message?: string
}

type EstimatesPayload = {
  bookingId: number
  estimates: AutoEstimationResponse
}

const fetcher = (url: string) =>
  fetch(url, { credentials: "include" }).then(async (res) => {
    if (!res.ok) {
      const text = await res.text()
      throw new Error(text || "Không lấy được bảng giá")
    }
    return res.json()
  })

export default function BookingQuotesPage() {
  const params = useParams()
  const bookingId = params?.id as string
  const { data, isLoading, error, mutate } = useSWR<EstimatesPayload>(
    bookingId ? buildApiUrl(`/bookings/${bookingId}/estimates`) : null,
    fetcher
  )

  const [assigningId, setAssigningId] = useState<number | null>(null)
  const [assignMessage, setAssignMessage] = useState<string | null>(null)
  const [assignError, setAssignError] = useState<string | null>(null)

  const estimates = data?.estimates?.estimations || []

  const summary = useMemo(() => {
    if (!estimates.length) return null
    // Tính nhanh 3 gợi ý: rẻ nhất, rating cao, gần nhất (hoặc rank cao nếu thiếu distance)
    const cheapest = [...estimates].sort((a, b) => a.totalPrice - b.totalPrice)[0]
    const topRated = [...estimates].sort((a, b) => (b.rating ?? 0) - (a.rating ?? 0))[0]
    const nearest =
      estimates.filter((e) => e.distanceKm !== undefined).sort((a, b) => (a.distanceKm ?? 0) - (b.distanceKm ?? 0))[0] ||
      [...estimates].sort((a, b) => (b.rankScore ?? 0) - (a.rankScore ?? 0))[0]
    return { cheapest, topRated, nearest }
  }, [estimates])

  async function handleAssign(transportId: number, estimatedPrice?: number) {
    if (!bookingId) return
    setAssigningId(transportId)
    setAssignError(null)
    setAssignMessage(null)
    try {
      // Gọi API gán nhà xe vào booking
      const res = await fetch(buildApiUrl(`/bookings/${bookingId}/assign-transport`), {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          transport_id: transportId,
          estimated_price: estimatedPrice,
        }),
      })
      const payload = await res.json().catch(() => ({}))
      if (!res.ok) {
        throw new Error(payload?.error || payload?.message || "Không gán được nhà xe")
      }
      setAssignMessage("Đã gán nhà vận chuyển, kiểm tra chi tiết đơn để tiếp tục.")
      mutate()
    } catch (e: any) {
      setAssignError(e.message || "Có lỗi xảy ra")
    } finally {
      setAssigningId(null)
    }
  }

  function mapEstimate(e: ApiEstimate) {
    // Map camelCase từ API về snake_case cho component card sẵn có
    return {
      transport_id: e.transportId,
      transport_name: e.transportName,
      rating: e.rating,
      completed_jobs: e.completedJobs,
      vehicle_type: e.vehicleType,
      vehicle_name: e.vehicleName,
      license_plate: e.licensePlate,
      total_price: e.totalPrice,
      estimated_duration: e.estimatedDuration,
      rank_score: e.rankScore,
      breakdown: {
        base_price: e.breakdown?.basePrice || 0,
        distance_price: e.breakdown?.distancePrice || 0,
        items_price: e.breakdown?.itemsPrice || 0,
        floor_fees: e.breakdown?.floorFees || 0,
        multiplier: e.breakdown?.multiplier || 1,
        subtotal: e.breakdown?.subtotal || e.totalPrice,
      },
    }
  }

  return (
    <div className="max-w-6xl mx-auto px-4 py-8 space-y-6">
      <div className="flex items-center justify-between gap-3">
        <Link href={`/booking/${bookingId}`}>
          <Button variant="ghost" size="sm" className="gap-2">
            <ArrowLeft className="w-4 h-4" />
            Quay lại đơn
          </Button>
        </Link>
        <Badge variant="outline">Booking #{bookingId}</Badge>
      </div>

      <div className="space-y-2">
        <h1 className="text-2xl font-semibold">Bảng giá dự tính</h1>
        <p className="text-sm text-muted-foreground">
          Tham khảo giá dựa trên rate card của nhà vận chuyển. Chọn 1 nhà xe để mời báo giá chi tiết.
        </p>
      </div>

      {isLoading && (
        <div className="flex items-center gap-2 text-muted-foreground">
          <Loader2 className="w-4 h-4 animate-spin" />
          Đang tải bảng giá...
        </div>
      )}

      {error && (
        <Alert variant="destructive">
          <AlertTitle>Lỗi</AlertTitle>
          <AlertDescription>{error.message || "Không lấy được dữ liệu"}</AlertDescription>
        </Alert>
      )}

      {!isLoading && !error && summary && (
        <Card className="p-4 bg-muted/30">
          <div className="flex items-center gap-2 mb-4">
            <Sparkles className="w-4 h-4 text-primary" />
            <span className="text-sm font-medium">Gợi ý nhanh</span>
          </div>
          <div className="grid gap-3 md:grid-cols-3">
            {summary.cheapest && (
              <QuickTile
                title="Rẻ nhất"
                icon={<Banknote className="w-4 h-4" />}
                value={formatVND(summary.cheapest.totalPrice)}
                sub={summary.cheapest.transportName}
              />
            )}
            {summary.topRated && (
              <QuickTile
                title="Đánh giá cao"
                icon={<Star className="w-4 h-4" />}
                value={`${summary.topRated.rating.toFixed(1)}★`}
                sub={summary.topRated.transportName}
              />
            )}
            {summary.nearest && (
              <QuickTile
                title="Gần nhất"
                icon={<MapPin className="w-4 h-4" />}
                value={
                  summary.nearest.distanceKm !== undefined
                    ? `${summary.nearest.distanceKm?.toFixed(1)} km`
                    : "Ưu tiên gần"
                }
                sub={summary.nearest.transportName}
              />
            )}
          </div>
        </Card>
      )}

      {assignMessage && (
        <Alert className="border-green-500 text-green-700">
          <AlertTitle>Thành công</AlertTitle>
          <AlertDescription>{assignMessage}</AlertDescription>
        </Alert>
      )}
      {assignError && (
        <Alert variant="destructive">
          <AlertTitle>Gán thất bại</AlertTitle>
          <AlertDescription>{assignError}</AlertDescription>
        </Alert>
      )}

      {!isLoading && !error && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="font-semibold">Danh sách đề xuất</h2>
            {data?.estimates?.priceRange && (
              <span className="text-sm text-muted-foreground">
                Tầm giá: {formatVND(data.estimates.priceRange.lowest)} -{" "}
                {formatVND(data.estimates.priceRange.highest)}
              </span>
            )}
          </div>
          <Separator />

          {estimates.length === 0 && (
            <div className="text-sm text-muted-foreground">Chưa có bảng giá phù hợp.</div>
          )}

          <div className="grid gap-4">
            {estimates.map((e) => (
              <TransportEstimateCard
                key={e.transportId}
                estimate={mapEstimate(e)}
                isLowest={e.transportId === summary?.cheapest?.transportId}
                onSelect={() => handleAssign(e.transportId, e.totalPrice)}
              />
            ))}
          </div>
        </div>
      )}

      <div className="text-xs text-muted-foreground">
        * Đây là giá dự tính từ rate card. Nhà xe sẽ liên hệ hoặc gửi báo giá chi tiết sau khi bạn chọn.
      </div>
    </div>
  )
}

function QuickTile({
  title,
  icon,
  value,
  sub,
}: {
  title: string
  icon: ReactNode
  value: string
  sub?: string
}) {
  return (
    <Card className="p-3">
      <div className="flex items-center gap-2 text-sm text-muted-foreground mb-1">
        {icon}
        <span>{title}</span>
      </div>
      <div className="text-lg font-semibold">{value}</div>
      {sub && <div className="text-xs text-muted-foreground truncate">{sub}</div>}
    </Card>
  )
}
