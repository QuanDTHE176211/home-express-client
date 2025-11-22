"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Separator } from "@/components/ui/separator"
import { formatVND } from "@/lib/format"
import type { VehiclePricing } from "@/types"

interface PricingCalculatorProps {
  pricing: Partial<VehiclePricing>
  distance: number
}

export function PricingCalculator({ pricing, distance }: PricingCalculatorProps) {
  const calculateBreakdown = () => {
    if (!pricing.per_km_first_4km || !pricing.per_km_5_to_40km || !pricing.per_km_after_40km) {
      return null
    }

    const breakdown: {
      first4km?: number
      next5to40km?: number
      after40km?: number
      total: number
    } = { total: 0 }

    if (distance <= 4) {
      breakdown.first4km = distance * pricing.per_km_first_4km
      breakdown.total = breakdown.first4km
    } else if (distance <= 40) {
      breakdown.first4km = 4 * pricing.per_km_first_4km
      breakdown.next5to40km = (distance - 4) * pricing.per_km_5_to_40km
      breakdown.total = breakdown.first4km + breakdown.next5to40km
    } else {
      breakdown.first4km = 4 * pricing.per_km_first_4km
      breakdown.next5to40km = 36 * pricing.per_km_5_to_40km
      breakdown.after40km = (distance - 40) * pricing.per_km_after_40km
      breakdown.total = breakdown.first4km + breakdown.next5to40km + breakdown.after40km
    }

    return breakdown
  }

  const breakdown = calculateBreakdown()

  return (
    <Card>
      <CardHeader>
        <CardTitle>Ví dụ tính giá</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground">Khoảng cách:</span>
            <span className="font-semibold">{distance} km</span>
          </div>

          {breakdown && (
            <div className="space-y-1 text-sm">
              {breakdown.first4km !== undefined && (
                <div className="text-muted-foreground">
                  • 4km đầu: 4 × {formatVND(pricing.per_km_first_4km || 0)} = {formatVND(breakdown.first4km)}
                </div>
              )}
              {breakdown.next5to40km !== undefined && (
                <div className="text-muted-foreground">
                  • {distance - 4}km tiếp: {distance - 4} × {formatVND(pricing.per_km_5_to_40km || 0)} ={" "}
                  {formatVND(breakdown.next5to40km)}
                </div>
              )}
              {breakdown.after40km !== undefined && (
                <div className="text-muted-foreground">
                  • {distance - 40}km sau: {distance - 40} × {formatVND(pricing.per_km_after_40km || 0)} ={" "}
                  {formatVND(breakdown.after40km)}
                </div>
              )}
            </div>
          )}
        </div>

        <Separator />

        <div className="flex justify-between items-center">
          <span className="font-semibold">Tổng:</span>
          <span className="text-lg font-bold text-success">{formatVND(breakdown?.total || 0)}</span>
        </div>

        {pricing.peak_hour_multiplier && pricing.peak_hour_multiplier > 1 && (
          <>
            <Separator />
            <div className="space-y-2 text-sm">
              <p className="text-muted-foreground">Với hệ số giờ cao điểm:</p>
              <div className="flex justify-between items-center">
                <span>×{pricing.peak_hour_multiplier}</span>
                <span className="font-semibold text-warning">
                  {formatVND((breakdown?.total || 0) * pricing.peak_hour_multiplier)}
                </span>
              </div>
            </div>
          </>
        )}

        <div className="mt-4 p-3 bg-muted rounded-lg text-sm space-y-1">
          <p className="font-medium">Lưu ý:</p>
          <ul className="list-disc list-inside text-muted-foreground space-y-1">
            <li>Giá chưa bao gồm phí đồ đạc</li>
            <li>Phụ phí tầng áp dụng riêng</li>
            <li>Hệ số có thể kết hợp</li>
          </ul>
        </div>
      </CardContent>
    </Card>
  )
}
