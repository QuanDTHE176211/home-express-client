import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Package } from "lucide-react"

interface BookingItemsDisplayProps {
  items: Array<{
    name: string
    brand?: string | null
    model?: string | null
    quantity: number
    weight?: number | null
    declared_value_vnd?: number | null
    declaredValueVnd?: number | null
    is_fragile?: boolean
    isFragile?: boolean
    requires_disassembly?: boolean
    requiresDisassembly?: boolean
    requires_packaging?: boolean
    requiresPackaging?: boolean
  }>
}

export function BookingItemsDisplay({ items }: BookingItemsDisplayProps) {
  if (!items || items.length === 0) return null

  const totalValue = items.reduce((sum, item) => {
    const value = item.declared_value_vnd || item.declaredValueVnd || 0
    return sum + (value * item.quantity)
  }, 0)

  return (
    <Card className="hover:shadow-md transition-shadow">
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <span className="flex items-center gap-2">
            <Package className="h-5 w-5" />
            Đồ đạc ({items.length} loại)
          </span>
          {totalValue > 0 && (
            <Badge className="bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-100 text-sm">
              Tổng giá trị: {new Intl.NumberFormat('vi-VN', { 
                style: 'currency', 
                currency: 'VND',
                maximumFractionDigits: 0 
              }).format(totalValue)}
            </Badge>
          )}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {items.map((item, index) => {
            const isFragile = item.is_fragile || item.isFragile
            const requiresDisassembly = item.requires_disassembly || item.requiresDisassembly
            const requiresPackaging = item.requires_packaging || item.requiresPackaging
            const declaredValue = item.declared_value_vnd || item.declaredValueVnd

            return (
              <div key={index} className="p-4 bg-background rounded-lg border-l-4 border-primary">
                <div className="space-y-2">
                  <div>
                    <p className="font-semibold text-lg">{item.name}</p>
                    {(item.brand || item.model) && (
                      <p className="text-sm text-muted-foreground mt-1">
                        {item.brand && <span className="font-medium">🏷️ {item.brand}</span>}
                        {item.brand && item.model && " • "}
                        {item.model && <span>📦 {item.model}</span>}
                      </p>
                    )}
                  </div>
                  
                  <div className="flex flex-wrap gap-2">
                    <Badge variant="secondary">Số lượng: {item.quantity}</Badge>
                    {item.weight && <Badge variant="outline">{item.weight} kg</Badge>}
                    {declaredValue && (
                      <Badge className="bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-100">
                        💰 {new Intl.NumberFormat('vi-VN', { 
                          style: 'currency', 
                          currency: 'VND',
                          maximumFractionDigits: 0 
                        }).format(declaredValue)}
                      </Badge>
                    )}
                    {isFragile && <Badge variant="destructive">⚠️ Dễ vỡ - Cần cẩn thận!</Badge>}
                    {requiresDisassembly && (
                      <Badge className="bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-100">
                        🔧 Cần tháo lắp
                      </Badge>
                    )}
                    {requiresPackaging && <Badge variant="outline">📦 Cần đóng gói</Badge>}
                  </div>
                </div>
              </div>
            )
          })}
        </div>
        
        {totalValue > 0 && (
          <div className="mt-4 p-3 bg-green-50 dark:bg-green-950 border border-green-200 dark:border-green-800 rounded-lg">
            <p className="text-sm text-green-800 dark:text-green-200">
              💡 <strong>Bảo hiểm:</strong> Tổng giá trị khai báo {new Intl.NumberFormat('vi-VN', { 
                style: 'currency', 
                currency: 'VND',
                maximumFractionDigits: 0 
              }).format(totalValue)} - Cân nhắc mua bảo hiểm vận chuyển
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
