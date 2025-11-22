"use client"

import { Card } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Star, Clock, TrendingUp } from "lucide-react"
import { formatVND } from "@/lib/format"

interface TransportEstimate {
  transport_id: number
  transport_name: string
  rating: number
  completed_jobs: number
  vehicle_type: string
  vehicle_name: string
  license_plate: string
  total_price: number
  breakdown: {
    base_price: number
    distance_price: number
    items_price: number
    floor_fees: number
    multiplier: number
    subtotal: number
  }
  estimated_duration: number
  rank_score: number
}

interface TransportEstimateCardProps {
  estimate: TransportEstimate
  isLowest?: boolean
  onSelect?: (transportId: number) => void
}

export function TransportEstimateCard({ estimate, isLowest, onSelect }: TransportEstimateCardProps) {
  return (
    <Card className={`p-6 ${isLowest ? "border-primary border-2" : ""}`}>
      {isLowest && <Badge className="mb-4 bg-primary">Giá tốt nhất</Badge>}

      <div className="flex items-start justify-between mb-4">
        <div>
          <h3 className="font-semibold text-lg">{estimate.transport_name}</h3>
          <div className="flex items-center gap-4 mt-2 text-sm text-muted-foreground">
            <div className="flex items-center gap-1">
              <Star className="w-4 h-4 fill-yellow-400 text-yellow-400" />
              <span>{estimate.rating}</span>
            </div>
            <div className="flex items-center gap-1">
              <TrendingUp className="w-4 h-4" />
              <span>{estimate.completed_jobs} chuyến</span>
            </div>
          </div>
        </div>
        <div className="text-right">
          <div className="text-2xl font-bold text-primary">{formatVND(estimate.total_price)}</div>
          <div className="text-sm text-muted-foreground mt-1">{estimate.vehicle_name}</div>
        </div>
      </div>

      <div className="space-y-2 mb-4 text-sm">
        <div className="flex justify-between">
          <span className="text-muted-foreground">Giá cơ bản:</span>
          <span>{formatVND(estimate.breakdown.base_price)}</span>
        </div>
        <div className="flex justify-between">
          <span className="text-muted-foreground">Phí quãng đường:</span>
          <span>{formatVND(estimate.breakdown.distance_price)}</span>
        </div>
        <div className="flex justify-between">
          <span className="text-muted-foreground">Phí hàng hóa:</span>
          <span>{formatVND(estimate.breakdown.items_price)}</span>
        </div>
        {estimate.breakdown.floor_fees > 0 && (
          <div className="flex justify-between">
            <span className="text-muted-foreground">Phí tầng lầu:</span>
            <span>{formatVND(estimate.breakdown.floor_fees)}</span>
          </div>
        )}
        {estimate.breakdown.multiplier > 1 && (
          <div className="flex justify-between">
            <span className="text-muted-foreground">Hệ số giờ cao điểm:</span>
            <span>x{estimate.breakdown.multiplier.toFixed(2)}</span>
          </div>
        )}
      </div>

      <div className="flex items-center gap-2 text-sm text-muted-foreground mb-4">
        <Clock className="w-4 h-4" />
        <span>Thời gian ước tính: {estimate.estimated_duration} phút</span>
      </div>

      {onSelect && (
        <Button onClick={() => onSelect(estimate.transport_id)} className="w-full">
          Chọn nhà vận chuyển này
        </Button>
      )}
    </Card>
  )
}
