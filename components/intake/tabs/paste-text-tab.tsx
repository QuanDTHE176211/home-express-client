"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Checkbox } from "@/components/ui/checkbox"
import { Badge } from "@/components/ui/badge"
import { FileText, Plus, Edit, Check, X, Sparkles } from "lucide-react"
import type { ItemCandidate } from "@/types"
import { apiClient } from "@/lib/api-client"

interface PasteTextTabProps {
  onAddCandidates: (candidates: ItemCandidate[]) => void
}

interface ParsedItem {
  name: string
  brand: string | null
  model: string | null
  quantity: number
  category_name: string | null
  size: string | null
  is_fragile: boolean
  requires_disassembly: boolean
  confidence: number
  
  // For editing
  editing?: boolean
  declared_value?: string
}

export function PasteTextTab({ onAddCandidates }: PasteTextTabProps) {
  const [text, setText] = useState("")
  const [results, setResults] = useState<ParsedItem[]>([])
  const [isParsing, setIsParsing] = useState(false)
  const [parserUsed, setParserUsed] = useState<string>("")

  const handleParse = async () => {
    if (!text.trim()) return

    setIsParsing(true)
    try {
      const response = await apiClient.parseText(text)
      const items = response.data.candidates.map((c: any) => ({
        name: c.name,
        brand: c.brand || null,
        model: c.model || null,
        quantity: c.quantity || 1,
        category_name: c.category_name || null,
        size: c.size || null,
        is_fragile: c.is_fragile || false,
        requires_disassembly: c.requires_disassembly || false,
        confidence: c.confidence || 0.8,
        editing: false,
        declared_value: "",
      }))
      setResults(items)
      setParserUsed(response.data.metadata?.parser || "unknown")
    } catch (err) {
      console.error(err)
    } finally {
      setIsParsing(false)
    }
  }

  const updateItem = (index: number, field: keyof ParsedItem, value: any) => {
    const newResults = [...results]
    newResults[index] = { ...newResults[index], [field]: value }
    setResults(newResults)
  }

  const toggleEdit = (index: number) => {
    updateItem(index, "editing", !results[index].editing)
  }

  const removeItem = (index: number) => {
    setResults(results.filter((_, i) => i !== index))
  }

  const handleAddAll = () => {
    if (results.length === 0) return

    const candidates: ItemCandidate[] = results.map((item, index) => ({
      id: `text-${Date.now()}-${index}`,
      name: item.name,
      category_id: null,
      category_name: item.category_name,
      size: item.size as any,
      weight_kg: null,
      dimensions: null,
      quantity: item.quantity,
      is_fragile: item.is_fragile,
      requires_disassembly: item.requires_disassembly,
      requires_packaging: false,
      source: "text",
      confidence: item.confidence,
      image_url: null,
      notes: item.brand && item.model ? `${item.brand} ${item.model}` : null,
      metadata: {
        brand: item.brand,
        model: item.model,
        declared_value: item.declared_value ? parseFloat(item.declared_value) : null,
        parser: parserUsed,
      },
    }))

    onAddCandidates(candidates)
    setText("")
    setResults([])
  }

  return (
    <Card>
      <CardContent className="p-6 space-y-4">
        <div className="space-y-2">
          <Label>Dán văn bản danh sách vật phẩm</Label>
          <Textarea
            placeholder="VD:&#10;6 bộ bàn ghế sofa&#10;1 tivi samsung&#10;1 tủ lạnh"
            value={text}
            onChange={(e) => setText(e.target.value)}
            rows={6}
            className="font-mono text-sm"
          />
          <p className="text-xs text-muted-foreground">
            💡 AI sẽ tự động phân tích: số lượng, thương hiệu, model, phân loại (Điện tử/Nội thất), kích thước (S/M/L), dễ vỡ, cần tháo lắp
          </p>
        </div>

        <Button onClick={handleParse} disabled={!text.trim() || isParsing} className="w-full">
          <FileText className="h-4 w-4 mr-2" />
          {isParsing ? "Đang phân tích..." : "Phân tích văn bản"}
        </Button>

        {results.length > 0 && (
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <h4 className="font-medium">Đã phát hiện {results.length} vật phẩm</h4>
                {parserUsed === "ai" && (
                  <Badge variant="secondary">
                    <Sparkles className="h-3 w-3 mr-1" />
                    AI
                  </Badge>
                )}
              </div>
              <Button size="sm" onClick={handleAddAll} className="bg-accent-green hover:bg-accent-green-dark">
                <Plus className="h-4 w-4 mr-1" />
                Thêm tất cả ({results.length})
              </Button>
            </div>

            <div className="space-y-2 max-h-[500px] overflow-y-auto">
              {results.map((item, index) => (
                <Card key={index} className="border-2">
                  <CardContent className="p-4">
                    {!item.editing ? (
                      <>
                        {/* View mode */}
                        <div className="flex items-start justify-between mb-2">
                          <div className="flex-1">
                            <div className="font-medium text-lg">{item.name}</div>
                            {(item.brand || item.model) && (
                              <div className="text-sm text-muted-foreground">
                                {item.brand} {item.model}
                              </div>
                            )}
                          </div>
                          <div className="flex gap-1">
                            <Button variant="ghost" size="sm" onClick={() => toggleEdit(index)}>
                              <Edit className="h-4 w-4" />
                            </Button>
                            <Button variant="ghost" size="sm" onClick={() => removeItem(index)}>
                              <X className="h-4 w-4 text-destructive" />
                            </Button>
                          </div>
                        </div>

                        <div className="flex flex-wrap gap-2">
                          <Badge variant="secondary">SL: {item.quantity}</Badge>
                          {item.brand && <Badge variant="outline">🏷️ {item.brand}</Badge>}
                          {item.model && <Badge variant="outline">📦 {item.model}</Badge>}
                          {item.category_name && <Badge variant="outline">{item.category_name}</Badge>}
                          {item.size && <Badge variant="outline">{item.size}</Badge>}
                          {item.is_fragile && <Badge variant="destructive">⚠️ Dễ vỡ</Badge>}
                          {item.requires_disassembly && <Badge className="bg-orange-100 text-orange-800 dark:bg-orange-900">🔧 Cần tháo lắp</Badge>}
                          <Badge>{Math.round(item.confidence * 100)}%</Badge>
                        </div>
                      </>
                    ) : (
                      <>
                        {/* Edit mode */}
                        <div className="space-y-3">
                          <div className="grid grid-cols-2 gap-3">
                            <div className="col-span-2 space-y-2">
                              <Label>Tên vật phẩm</Label>
                              <Input
                                value={item.name}
                                onChange={(e) => updateItem(index, "name", e.target.value)}
                              />
                            </div>

                            <div className="space-y-2">
                              <Label>Thương hiệu</Label>
                              <Input
                                value={item.brand || ""}
                                onChange={(e) => updateItem(index, "brand", e.target.value || null)}
                                placeholder="VD: Samsung"
                              />
                            </div>

                            <div className="space-y-2">
                              <Label>Model</Label>
                              <Input
                                value={item.model || ""}
                                onChange={(e) => updateItem(index, "model", e.target.value || null)}
                                placeholder="VD: UN55TU7000"
                              />
                            </div>

                            <div className="space-y-2">
                              <Label>Số lượng</Label>
                              <Input
                                type="number"
                                min="1"
                                value={item.quantity}
                                onChange={(e) => updateItem(index, "quantity", parseInt(e.target.value) || 1)}
                              />
                            </div>

                            <div className="space-y-2">
                              <Label>Giá trị khai báo (VNĐ)</Label>
                              <Input
                                type="number"
                                step="100000"
                                value={item.declared_value || ""}
                                onChange={(e) => updateItem(index, "declared_value", e.target.value)}
                                placeholder="VD: 15000000"
                              />
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
                                Cần tháo lắp
                              </Label>
                            </div>
                          </div>

                          <div className="flex gap-2">
                            <Button variant="outline" size="sm" onClick={() => toggleEdit(index)} className="flex-1">
                              <Check className="h-4 w-4 mr-1" />
                              Xong
                            </Button>
                            <Button variant="ghost" size="sm" onClick={() => removeItem(index)}>
                              <X className="h-4 w-4" />
                              Xóa
                            </Button>
                          </div>
                        </div>
                      </>
                    )}
                  </CardContent>
                </Card>
              ))}
            </div>

            <div className="bg-blue-50 dark:bg-blue-950 border border-blue-200 dark:border-blue-800 rounded-lg p-3">
              <p className="text-sm text-blue-800 dark:text-blue-200">
                💡 <strong>Review lại thông tin:</strong> Click nút <Edit className="h-3 w-3 inline" /> để chỉnh sửa, bổ sung thông tin thiếu
              </p>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
