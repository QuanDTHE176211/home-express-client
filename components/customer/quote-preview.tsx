'use client'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Loader2, Info } from 'lucide-react'
import { formatVND } from '@/lib/currency'
import type { QuoteData } from '@/lib/types/scan'

interface QuotePreviewProps {
  quote: QuoteData | null
  loading: boolean
  error?: string
}

export function QuotePreview({ quote, loading, error }: QuotePreviewProps) {
  if (loading) {
    return (
      <Card className="mb-6 border-blue-200 bg-blue-50/50">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-blue-900">
            <Loader2 className="h-5 w-5 animate-spin" />
            Đang tính toán báo giá...
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-blue-700">
            Hệ thống AI đang phân tích yêu cầu của bạn để đưa ra ước tính chi phí.
          </p>
        </CardContent>
      </Card>
    )
  }

  if (error) {
    return (
      <Card className="mb-6 border-red-200 bg-red-50">
        <CardHeader>
          <CardTitle className="text-red-600 flex items-center gap-2">
            <Info className="h-5 w-5" />
            Lỗi tính báo giá
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-red-600">{error}</p>
        </CardContent>
      </Card>
    )
  }

  if (!quote) {
    return null
  }

  return (
    <Card className="mb-6 border-blue-200 bg-gradient-to-br from-blue-50 to-blue-100/50">
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="text-blue-900">Báo giá ước tính từ AI</CardTitle>
          <Badge variant="secondary" className="bg-blue-200 text-blue-900 hover:bg-blue-300">
            Ước tính
          </Badge>
        </div>
        <p className="text-sm text-blue-700 mt-2">
          Đây là giá ước tính từ hệ thống AI dựa trên thông tin bạn cung cấp. 
          Giá thực tế sẽ được các đội xe báo bên dưới.
        </p>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {/* Base Price */}
          <div className="flex justify-between text-sm">
            <span className="text-blue-800">Giá cơ bản:</span>
            <span className="font-medium text-blue-900">{formatVND(quote.breakdown.basePrice)}</span>
          </div>

          {/* Labor Cost */}
          <div className="flex justify-between text-sm">
            <span className="text-blue-800">
              Chi phí nhân công ({quote.labor.workers} người × {quote.labor.hours} giờ):
            </span>
            <span className="font-medium text-blue-900">{formatVND(quote.breakdown.laborCost)}</span>
          </div>

          {/* Vehicle Cost */}
          <div className="flex justify-between text-sm">
            <span className="text-blue-800">
              Chi phí xe ({quote.vehicle.type} - {quote.vehicle.capacity}):
            </span>
            <span className="font-medium text-blue-900">{formatVND(quote.breakdown.vehicleCost)}</span>
          </div>

          {/* Packaging Cost */}
          {quote.breakdown.packagingCost > 0 && (
            <div className="flex justify-between text-sm">
              <span className="text-blue-800">Chi phí đóng gói:</span>
              <span className="font-medium text-blue-900">{formatVND(quote.breakdown.packagingCost)}</span>
            </div>
          )}

          {/* Disassembly Cost */}
          {quote.breakdown.disassemblyCost > 0 && (
            <div className="flex justify-between text-sm">
              <span className="text-blue-800">Chi phí tháo lắp:</span>
              <span className="font-medium text-blue-900">{formatVND(quote.breakdown.disassemblyCost)}</span>
            </div>
          )}

          {/* Fragile Cost */}
          {quote.breakdown.fragileCost > 0 && (
            <div className="flex justify-between text-sm">
              <span className="text-blue-800">Chi phí đồ dễ vỡ:</span>
              <span className="font-medium text-blue-900">{formatVND(quote.breakdown.fragileCost)}</span>
            </div>
          )}

          {/* Separator */}
          <div className="border-t border-blue-300 my-3" />

          {/* Total */}
          <div className="flex justify-between items-center">
            <span className="font-bold text-lg text-blue-900">Tổng ước tính:</span>
            <span className="font-bold text-2xl text-blue-600">{formatVND(quote.total)}</span>
          </div>

          {/* Estimated Duration */}
          {quote.estimatedDuration && (
            <div className="mt-4 pt-3 border-t border-blue-200">
              <p className="text-xs text-blue-700">
                <strong>Thời gian ước tính:</strong> {quote.estimatedDuration}
              </p>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  )
}

