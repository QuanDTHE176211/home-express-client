"use client"

import { useState } from "react"
import Image from "next/image"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Checkbox } from "@/components/ui/checkbox"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Card, CardContent } from "@/components/ui/card"
import { Plus, Trash2, Package } from "lucide-react"
import { useCategories } from "@/hooks/use-bookings"

interface BookingItem {
  categoryId: number
  name: string
  quantity: number
  weight?: number
  isFragile?: boolean
  requiresDisassembly?: boolean
  requiresPackaging?: boolean
  imageUrls?: string[]
}

interface ItemsStepProps {
  items: BookingItem[]
  onChange: (items: BookingItem[]) => void
  error?: string
}

export function ItemsStep({ items, onChange, error }: ItemsStepProps) {
  const { categories, isLoading } = useCategories()
  const [editingIndex, setEditingIndex] = useState<number | null>(null)

  const addItem = () => {
    onChange([
      ...items,
      {
        categoryId: 0,
        name: "",
        quantity: 1,
        weight: undefined,
        isFragile: false,
        requiresDisassembly: false,
        requiresPackaging: false,
      },
    ])
    setEditingIndex(items.length)
  }

  const removeItem = (index: number) => {
    onChange(items.filter((_, i) => i !== index))
  }

  const updateItem = (index: number, updates: Partial<BookingItem>) => {
    const newItems = [...items]
    newItems[index] = { ...newItems[index], ...updates }
    onChange(newItems)
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="font-semibold">Danh sách đồ đạc</h3>
          <p className="text-sm text-muted-foreground">Thêm các món đồ cần vận chuyển</p>
        </div>
        <Button onClick={addItem} size="sm">
          <Plus className="mr-2 h-4 w-4" />
          Thêm món đồ
        </Button>
      </div>

      {error && <p className="text-sm text-destructive">{error}</p>}

      {items.length === 0 ? (
        <Card className="border-dashed">
          <CardContent className="flex flex-col items-center justify-center py-12">
            <Package className="h-12 w-12 text-muted-foreground mb-4" />
            <p className="text-muted-foreground mb-4">Chưa có món đồ nào</p>
            <Button onClick={addItem} variant="outline">
              <Plus className="mr-2 h-4 w-4" />
              Thêm món đồ đầu tiên
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {items.map((item, index) => (
            <Card key={index}>
              <CardContent className="p-4 space-y-4">
                {item.imageUrls && item.imageUrls.length > 0 && (
                  <div className="flex gap-2 mb-2">
                    {item.imageUrls.map((url, idx) => (
                      <div key={idx} className="w-20 h-20 rounded-lg overflow-hidden bg-muted">
                        <Image
                          src={url || "/placeholder.svg"}
                          alt={item.name}
                          width={80}
                          height={80}
                          className="h-full w-full object-cover"
                        />
                      </div>
                    ))}
                  </div>
                )}

                <div className="flex items-center justify-between">
                  <h4 className="font-medium">Món đồ #{index + 1}</h4>
                  <Button variant="ghost" size="sm" onClick={() => removeItem(index)}>
                    <Trash2 className="h-4 w-4 text-destructive" />
                  </Button>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Loại đồ</Label>
                    <Select
                      value={item.categoryId.toString()}
                      onValueChange={(value) => updateItem(index, { categoryId: Number(value) })}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Chọn loại đồ" />
                      </SelectTrigger>
                      <SelectContent>
                        {isLoading ? (
                          <SelectItem value="0" disabled>
                            Đang tải...
                          </SelectItem>
                        ) : (
                          categories.map((cat) => (
                            <SelectItem key={cat.categoryId} value={cat.categoryId.toString()}>
                              {cat.name}
                            </SelectItem>
                          ))
                        )}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label>Tên món đồ</Label>
                    <Input
                      placeholder="Ví dụ: Tủ lạnh Samsung"
                      value={item.name}
                      onChange={(e) => updateItem(index, { name: e.target.value })}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label>Số lượng</Label>
                    <Input
                      type="number"
                      min="1"
                      value={item.quantity}
                      onChange={(e) => updateItem(index, { quantity: Number(e.target.value) })}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label>Khối lượng (kg)</Label>
                    <Input
                      type="number"
                      min="0"
                      step="0.1"
                      placeholder="Tùy chọn"
                      value={item.weight ?? ""}
                      onChange={(e) =>
                        updateItem(index, { weight: e.target.value ? Number(e.target.value) : undefined })
                      }
                    />
                  </div>
                </div>

                <div className="flex flex-wrap gap-4">
                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id={`fragile-${index}`}
                      checked={item.isFragile}
                      onCheckedChange={(checked) => updateItem(index, { isFragile: checked as boolean })}
                    />
                    <Label htmlFor={`fragile-${index}`} className="cursor-pointer">
                      Dễ vỡ
                    </Label>
                  </div>

                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id={`disassembly-${index}`}
                      checked={item.requiresDisassembly}
                      onCheckedChange={(checked) => updateItem(index, { requiresDisassembly: checked as boolean })}
                    />
                    <Label htmlFor={`disassembly-${index}`} className="cursor-pointer">
                      Cần tháo lắp
                    </Label>
                  </div>

                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id={`packaging-${index}`}
                      checked={item.requiresPackaging}
                      onCheckedChange={(checked) => updateItem(index, { requiresPackaging: checked as boolean })}
                    />
                    <Label htmlFor={`packaging-${index}`} className="cursor-pointer">
                      Cần đóng gói
                    </Label>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}
