"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Checkbox } from "@/components/ui/checkbox"
import { Plus, Trash2 } from "lucide-react"
import type { ItemCandidate } from "@/types"

interface ManualEntryTabProps {
  onAddCandidates: (candidates: ItemCandidate[]) => void
}

interface ManualItem {
  name: string
  category: string
  size: "S" | "M" | "L"
  quantity: number
  weight_kg: string
  width_cm: string
  height_cm: string
  depth_cm: string
  is_fragile: boolean
  requires_disassembly: boolean
}

const CATEGORIES = ["Nội thất", "Điện tử", "Đồ gia dụng", "Quần áo", "Sách vở", "Đồ chơi", "Khác"]

export function ManualEntryTab({ onAddCandidates }: ManualEntryTabProps) {
  const [items, setItems] = useState<ManualItem[]>([
    {
      name: "",
      category: "",
      size: "M",
      quantity: 1,
      weight_kg: "",
      width_cm: "",
      height_cm: "",
      depth_cm: "",
      is_fragile: false,
      requires_disassembly: false,
    },
  ])

  const addRow = () => {
    setItems([
      ...items,
      {
        name: "",
        category: "",
        size: "M",
        quantity: 1,
        weight_kg: "",
        width_cm: "",
        height_cm: "",
        depth_cm: "",
        is_fragile: false,
        requires_disassembly: false,
      },
    ])
  }

  const removeRow = (index: number) => {
    setItems(items.filter((_, i) => i !== index))
  }

  const updateItem = (index: number, field: keyof ManualItem, value: any) => {
    console.log("[v0] Updating item", index, field, "with value:", value)
    const newItems = [...items]
    newItems[index] = { ...newItems[index], [field]: value }
    setItems(newItems)
  }

  const handleSubmit = () => {
    const validItems = items.filter((item) => item.name.trim().length > 0 && item.quantity > 0)

    if (validItems.length === 0) {
      console.log("[v0] No valid items to add")
      return
    }

    const candidates: ItemCandidate[] = validItems.map((item, index) => ({
      id: `manual-${Date.now()}-${index}`,
      name: item.name,
      category_id: null,
      category_name: item.category || null,
      size: item.size,
      weight_kg: item.weight_kg ? Number.parseFloat(item.weight_kg) : null,
      dimensions:
        item.width_cm || item.height_cm || item.depth_cm
          ? {
            width_cm: item.width_cm ? Number.parseFloat(item.width_cm) : null,
            height_cm: item.height_cm ? Number.parseFloat(item.height_cm) : null,
            depth_cm: item.depth_cm ? Number.parseFloat(item.depth_cm) : null,
          }
          : null,
      quantity: item.quantity,
      is_fragile: item.is_fragile,
      requires_disassembly: item.requires_disassembly,
      requires_packaging: false,
      source: "manual",
      confidence: 1,
      image_url: null,
      notes: null,
      metadata: null,
    }))

    console.log("[v0] Adding candidates:", candidates)
    onAddCandidates(candidates)

    // Reset form
    setItems([
      {
        name: "",
        category: "",
        size: "M",
        quantity: 1,
        weight_kg: "",
        width_cm: "",
        height_cm: "",
        depth_cm: "",
        is_fragile: false,
        requires_disassembly: false,
      },
    ])
  }

  return (
    <Card>
      <CardContent className="p-6 space-y-4">
        <div className="space-y-4 max-h-96 overflow-y-auto">
          {items.map((item, index) => (
            <Card key={index}>
              <CardContent className="p-4 space-y-3">
                <div className="flex items-center justify-between">
                  <h4 className="font-medium">Vật phẩm #{index + 1}</h4>
                  {items.length > 1 && (
                    <Button variant="ghost" size="sm" onClick={() => removeRow(index)}>
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  )}
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  <div className="space-y-2">
                    <Label>Tên vật phẩm *</Label>
                    <Input
                      type="text"
                      placeholder="VD: Tủ lạnh Samsung"
                      value={item.name}
                      onChange={(e) => {
                        const value = e.target.value
                        console.log("[v0] Name input changed:", value)
                        updateItem(index, "name", value)
                      }}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label>Loại</Label>
                    <Select value={item.category} onValueChange={(value) => updateItem(index, "category", value)}>
                      <SelectTrigger>
                        <SelectValue placeholder="Chọn loại" />
                      </SelectTrigger>
                      <SelectContent>
                        {CATEGORIES.map((cat) => (
                          <SelectItem key={cat} value={cat}>
                            {cat}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label>Kích thước</Label>
                    <Select
                      value={item.size}
                      onValueChange={(value: "S" | "M" | "L") => updateItem(index, "size", value)}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="S">S (Nhỏ)</SelectItem>
                        <SelectItem value="M">M (Vừa)</SelectItem>
                        <SelectItem value="L">L (Lớn)</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label>Số lượng *</Label>
                    <Input
                      type="number"
                      min="1"
                      value={item.quantity}
                      onChange={(e) => updateItem(index, "quantity", Number.parseInt(e.target.value) || 1)}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label>Cân nặng (kg)</Label>
                    <Input
                      type="number"
                      step="0.1"
                      placeholder="VD: 50"
                      value={item.weight_kg}
                      onChange={(e) => updateItem(index, "weight_kg", e.target.value)}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label>Kích thước (cm)</Label>
                    <div className="grid grid-cols-3 gap-2">
                      <Input
                        type="number"
                        placeholder="R"
                        value={item.width_cm}
                        onChange={(e) => updateItem(index, "width_cm", e.target.value)}
                      />
                      <Input
                        type="number"
                        placeholder="C"
                        value={item.height_cm}
                        onChange={(e) => updateItem(index, "height_cm", e.target.value)}
                      />
                      <Input
                        type="number"
                        placeholder="S"
                        value={item.depth_cm}
                        onChange={(e) => updateItem(index, "depth_cm", e.target.value)}
                      />
                    </div>
                  </div>
                </div>

                <div className="flex gap-4">
                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id={`fragile-${index}`}
                      checked={item.is_fragile}
                      onCheckedChange={(checked) => updateItem(index, "is_fragile", checked)}
                    />
                    <Label htmlFor={`fragile-${index}`} className="text-sm font-normal">
                      Dễ vỡ
                    </Label>
                  </div>

                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id={`disassembly-${index}`}
                      checked={item.requires_disassembly}
                      onCheckedChange={(checked) => updateItem(index, "requires_disassembly", checked)}
                    />
                    <Label htmlFor={`disassembly-${index}`} className="text-sm font-normal">
                      Cần tháo rời
                    </Label>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        <div className="flex gap-2">
          <Button variant="outline" onClick={addRow} className="flex-1 bg-transparent">
            <Plus className="h-4 w-4 mr-2" />
            Thêm dòng
          </Button>
          <Button onClick={handleSubmit} className="flex-1">
            Thêm vào danh sách
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}
