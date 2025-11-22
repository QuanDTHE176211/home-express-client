"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Combobox, type ComboboxOption } from "@/components/ui/combobox"
import { Badge } from "@/components/ui/badge"
import { Search, Plus, ExternalLink } from "lucide-react"
import type { ItemCandidate } from "@/types"
import { apiClient } from "@/lib/api-client"

interface ModelSearchTabProps {
  onAddCandidates: (candidates: ItemCandidate[]) => void
}

interface ProductModel {
  modelId: number
  brand: string
  model: string
  productName: string
  categoryId: number | null
  weightKg: number | null
  dimensionsMm: string | null
  source: string
  sourceUrl: string | null
  usageCount: number
}

export function ModelSearchTab({ onAddCandidates }: ModelSearchTabProps) {
  const [brand, setBrand] = useState("")
  const [model, setModel] = useState("")
  const [brandOptions, setBrandOptions] = useState<ComboboxOption[]>([])
  const [modelOptions, setModelOptions] = useState<ComboboxOption[]>([])
  const [results, setResults] = useState<ProductModel[]>([])
  const [isSearching, setIsSearching] = useState(false)
  const [isBrandLoading, setIsBrandLoading] = useState(false)
  const [isModelLoading, setIsModelLoading] = useState(false)

  useEffect(() => {
    const searchBrands = async () => {
      setIsBrandLoading(true)
      try {
        const data = await apiClient.searchBrands(brand || "")
        setBrandOptions(data.brands.map(b => ({ value: b, label: b })))
      } catch (err) {
        console.error(err)
      } finally {
        setIsBrandLoading(false)
      }
    }

    const timer = setTimeout(() => {
      searchBrands()
    }, 300)

    return () => clearTimeout(timer)
  }, [brand])

  useEffect(() => {
    if (!brand) {
      setModelOptions([])
      return
    }

    const searchModelsForBrand = async () => {
      setIsModelLoading(true)
      try {
        const data = await apiClient.searchModels(model || "", brand)
        setModelOptions(data.models.map(m => ({ value: m.model, label: m.model })))
      } catch (err) {
        console.error(err)
      } finally {
        setIsModelLoading(false)
      }
    }

    const timer = setTimeout(() => {
      searchModelsForBrand()
    }, 300)

    return () => clearTimeout(timer)
  }, [brand, model])

  const handleSearch = async () => {
    if (!brand && !model) return

    setIsSearching(true)
    try {
      const data = await apiClient.searchModels(model || "", brand || undefined)
      setResults(data.models || [])
    } catch (err) {
      console.error(err)
    } finally {
      setIsSearching(false)
    }
  }

  const handleAdd = async (result: ProductModel) => {
    let dimensions = null
    if (result.dimensionsMm) {
      try {
        const parsed = JSON.parse(result.dimensionsMm)
        dimensions = {
          width_cm: parsed.width / 10,
          height_cm: parsed.height / 10,
          depth_cm: parsed.depth / 10,
        }
      } catch (e) {
        console.error("Failed to parse dimensions", e)
      }
    }

    const candidate: ItemCandidate = {
      id: `model-${Date.now()}`,
      name: result.productName || `${result.brand} ${result.model}`,
      category_id: result.categoryId,
      category_name: null,
      size: dimensions ? "M" : null,
      weight_kg: result.weightKg ? Number(result.weightKg) : null,
      dimensions,
      quantity: 1,
      is_fragile: false,
      requires_disassembly: false,
      requires_packaging: false,
      source: "model",
      confidence: 0.9,
      image_url: null,
      notes: `${result.brand} ${result.model}`,
      metadata: { source: result.source, source_url: result.sourceUrl, model_id: result.modelId },
    }

    try {
      await apiClient.recordModelUsage(result.modelId)
    } catch (err) {
      console.error("Failed to record model usage", err)
    }

    onAddCandidates([candidate])
  }

  return (
    <Card>
      <CardContent className="p-6 space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label>Thương hiệu</Label>
            <Combobox
              options={brandOptions}
              value={brand}
              onValueChange={setBrand}
              placeholder="Nhập hoặc chọn thương hiệu"
              searchPlaceholder="Tìm thương hiệu..."
              emptyText="Chưa có thương hiệu này - nhập để thêm mới"
              allowCustom
            />
          </div>

          <div className="space-y-2">
            <Label>Model</Label>
            <Combobox
              options={modelOptions}
              value={model}
              onValueChange={setModel}
              placeholder="Nhập hoặc chọn model"
              searchPlaceholder="Tìm model..."
              emptyText="Chưa có model này - nhập để thêm mới"
              allowCustom
            />
          </div>
        </div>

        <Button onClick={handleSearch} disabled={isSearching} className="w-full">
          <Search className="h-4 w-4 mr-2" />
          Tìm kiếm
        </Button>

        {results.length > 0 && (
          <div className="space-y-2 max-h-96 overflow-y-auto">
            {results.map((result) => (
              <Card key={result.modelId}>
                <CardContent className="p-4">
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1">
                      <h4 className="font-medium">{result.productName || `${result.brand} ${result.model}`}</h4>
                      <p className="text-sm text-muted-foreground">
                        {result.brand} {result.model}
                      </p>
                      {result.dimensionsMm && (
                        <p className="text-xs text-muted-foreground mt-1">
                          {(() => {
                            try {
                              const dims = JSON.parse(result.dimensionsMm)
                              return `${dims.width} × ${dims.height} × ${dims.depth} mm`
                            } catch (e) {
                              return result.dimensionsMm
                            }
                          })()}
                          {result.weightKg && ` • ${result.weightKg} kg`}
                        </p>
                      )}
                      <div className="flex items-center gap-2 mt-2">
                        <Badge variant="secondary">Đã dùng {result.usageCount} lần</Badge>
                        {result.sourceUrl && (
                          <a
                            href={result.sourceUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-xs text-primary flex items-center gap-1"
                          >
                            {result.source} <ExternalLink className="h-3 w-3" />
                          </a>
                        )}
                      </div>
                    </div>
                    <Button size="sm" onClick={() => handleAdd(result)}>
                      <Plus className="h-4 w-4 mr-1" />
                      Thêm
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  )
}
