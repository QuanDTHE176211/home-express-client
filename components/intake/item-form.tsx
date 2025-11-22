"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { CardContent } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Checkbox } from "@/components/ui/checkbox"
import { Badge } from "@/components/ui/badge"
import { Trash2, ChevronDown, Check, AlertCircle, X } from "lucide-react"
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "@/components/ui/command"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { cn } from "@/lib/utils"
import { apiClient } from "@/lib/api-client"

export interface ManualItem {
  id: string
  brand: string
  model: string
  productName: string
  name: string
  category: string
  size: "S" | "M" | "L"
  quantity: number
  declared_value: string
  weight_kg: string
  width_cm: string
  height_cm: string
  depth_cm: string
  is_fragile: boolean
  requires_disassembly: boolean
  isExpanded: boolean
  modelId?: number
  isValid: boolean
}

export const CATEGORIES = [
  "Nội thất lớn (Sofa, Giường, Tủ...)", 
  "Điện lạnh (Tủ lạnh, Máy giặt...)", 
  "Thiết bị điện tử (TV, PC...)", 
  "Đồ bếp & Dễ vỡ", 
  "Hàng nặng & Đặc biệt (Két sắt, Piano...)", 
  "Quần áo & Phụ kiện", 
  "Chăn ga gối đệm",
  "Sách vở & Tài liệu", 
  "Khác"
]

// Mapping keywords to category index
export const CATEGORY_KEYWORDS: Record<number, string[]> = {
  0: ["nội thất", "sofa", "giường", "tủ", "bàn", "ghế", "kệ", "giá", "salon", "divan", "đệm ghế", "phản", "sập"],
  1: ["lạnh", "máy giặt", "điều hòa", "máy sấy", "tủ đông", "bình nóng lạnh", "quạt", "hút mùi"],
  2: ["điện tử", "tivi", "tv", "máy tính", "pc", "laptop", "màn hình", "loa", "amply", "dàn âm thanh", "máy in", "wifi", "camera", "máy chiếu"],
  3: ["bếp", "chén", "bát", "đĩa", "ly", "cốc", "tách", "nồi", "xoong", "chảo", "thủy tinh", "gốm", "sứ", "lò vi sóng", "lò nướng", "gia dụng", "dễ vỡ", "gương", "kính", "bình hoa", "lọ hoa", "tranh", "ảnh"],
  4: ["nặng", "két", "piano", "đàn", "máy chạy bộ", "máy tập", "bể cá", "hồ cá", "tượng", "xe máy", "xe đạp", "cây cảnh"],
  5: ["quần", "áo", "thời trang", "giày", "dép", "túi", "vali", "mũ", "nón", "khăn"],
  6: ["chăn", "ga", "gối", "đệm", "nệm", "màn", "mùng", "drap"],
  7: ["sách", "vở", "tài liệu", "hồ sơ", "giấy", "truyện", "tạp chí", "văn phòng phẩm"]
}

export function normalizeCategory(input: string, context?: { isFragile?: boolean, weight?: number }): string {
    // 1. Exact match
    if (input && CATEGORIES.includes(input)) return input

    // 2. Text Analysis (Keywords)
    if (input) {
        const lower = input.toLowerCase()
        for (const [indexStr, keywords] of Object.entries(CATEGORY_KEYWORDS)) {
            if (keywords.some(k => lower.includes(k))) {
                return CATEGORIES[Number(indexStr)]
            }
        }
    }

    // 3. Context Analysis (Heuristics) - "Smart" inference based on properties
    if (context) {
        // If explicitly marked fragile, prioritize "Đồ bếp & Dễ vỡ"
        if (context.isFragile) return CATEGORIES[3] 
        
        // If very heavy (>30kg), prioritize "Hàng nặng & Đặc biệt"
        if (context.weight && context.weight > 30) return CATEGORIES[4]
        
        // If it has a name but we failed to classify, default to "Khác" instead of empty
        // This ensures "unknown" items are at least categorized
        if (input) return CATEGORIES[8] // "Khác"
    }
    
    return ""
}

function SmartCombobox({ 
  value, 
  onValueChange, 
  options, 
  placeholder, 
  searchPlaceholder,
  disabled = false
}: {
  value: string
  onValueChange: (val: string) => void
  options: { value: string; label: string }[]
  placeholder: string
  searchPlaceholder: string
  disabled?: boolean
}) {
  const [open, setOpen] = useState(false)
  const [inputValue, setInputValue] = useState("")

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          role="combobox"
          aria-expanded={open}
          disabled={disabled}
          className={cn("w-full justify-between font-normal h-9 text-sm", !value && "text-muted-foreground")}
        >
          <span className="truncate">{value || placeholder}</span>
          <ChevronDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-[300px] p-0" align="start">
        <Command>
          <CommandInput 
            placeholder={searchPlaceholder} 
            onValueChange={setInputValue}
          />
          <CommandList>
            <CommandEmpty className="py-3 px-4 text-sm">
               <p className="text-muted-foreground mb-2 text-xs">Không tìm thấy "{inputValue}"</p>
               <Button 
                 variant="secondary" 
                 size="sm" 
                 className="w-full h-8 text-xs font-medium bg-blue-50 text-blue-700 hover:bg-blue-100 dark:bg-blue-900/30 dark:text-blue-300"
                 onClick={() => {
                    onValueChange(inputValue)
                    setOpen(false)
                 }}
               >
                 + Tạo mới "{inputValue}"
               </Button>
            </CommandEmpty>
            <CommandGroup>
              {options.map((option) => (
                <CommandItem
                  key={option.value}
                  value={option.value}
                  onSelect={(currentValue) => {
                    onValueChange(option.value)
                    setOpen(false)
                  }}
                >
                  <Check
                    className={cn(
                      "mr-2 h-4 w-4",
                      value === option.value ? "opacity-100" : "opacity-0"
                    )}
                  />
                  {option.label}
                </CommandItem>
              ))}
            </CommandGroup>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  )
}

interface ItemFormProps {
  item: ManualItem
  onChange: (updates: Partial<ManualItem>) => void
  onDelete?: () => void
  isSingleMode?: boolean
}

export function ItemForm({ item, onChange, onDelete, isSingleMode = false }: ItemFormProps) {
  const [brandOptions, setBrandOptions] = useState<{value: string, label: string}[]>([])
  const [modelOptions, setModelOptions] = useState<{value: string, label: string}[]>([])
  const [modelSuggestions, setModelSuggestions] = useState<any[]>([])

  // Search brands
  useEffect(() => {
    if (!item.brand) return
    const timer = setTimeout(async () => {
      try {
        const data = await apiClient.searchBrands(item.brand)
        setBrandOptions(data.brands.map((b) => ({ value: b, label: b })))
      } catch {}
    }, 500)
    return () => clearTimeout(timer)
  }, [item.brand])

  // Search models
  useEffect(() => {
    if (!item.brand || !item.model) return
    const timer = setTimeout(async () => {
      try {
        const data = await apiClient.searchModels(item.model, item.brand)
        setModelOptions(data.models.map((m) => ({ value: m.model, label: m.model })))
        setModelSuggestions(data.models)
      } catch {}
    }, 500)
    return () => clearTimeout(timer)
  }, [item.brand, item.model])

  // Normalize category
  useEffect(() => {
    const normalized = normalizeCategory(item.category, {
        isFragile: item.is_fragile,
        weight: item.weight_kg ? parseFloat(item.weight_kg) : undefined
    })
    if (normalized && normalized !== item.category) {
        onChange({ category: normalized })
    }
  }, [item.category, item.is_fragile, item.weight_kg])

  const handleUpdate = (field: keyof ManualItem, value: any) => {
    const updates: Partial<ManualItem> = { [field]: value }

    // Logic auto-fill name
    if (field === "brand" || field === "model") {
        const newBrand = field === "brand" ? value : item.brand
        const newModel = field === "model" ? value : item.model
        if (newBrand && newModel) {
            if (!item.name || item.name === `${item.brand} ${item.model}`) {
                updates.name = `${newBrand} ${newModel}`
            }
        }
    }

    // Logic auto-fill from model suggestion
    if (field === "model" && value) {
        const suggestion = modelSuggestions.find(s => s.model === value)
        if (suggestion) {
            updates.modelId = suggestion.modelId
            updates.productName = suggestion.productName || ""
            if (!item.name || item.name.includes(item.brand)) {
                updates.name = suggestion.productName || `${suggestion.brand} ${suggestion.model}`
            }
            if (suggestion.weightKg) updates.weight_kg = suggestion.weightKg.toString()
            if (suggestion.dimensionsMm) {
                try {
                    const dims = JSON.parse(suggestion.dimensionsMm)
                    updates.width_cm = (dims.width / 10).toString()
                    updates.height_cm = (dims.height / 10).toString()
                    updates.depth_cm = (dims.depth / 10).toString()
                } catch {}
            }
        }
    }

    // Logic auto-fill size from weight
    if (field === "weight_kg" && value) {
        const w = parseFloat(value)
        if (!isNaN(w)) {
            if (w < 10) updates.size = "S"
            else if (w <= 30) updates.size = "M"
            else updates.size = "L"
        }
    }

    onChange(updates)
  }

  return (
    <div className="space-y-4 animate-in slide-in-from-top-2 duration-200">
        {/* Brand & Model */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1.5">
                <Label className="text-xs">Thương hiệu</Label>
                <SmartCombobox
                    options={brandOptions}
                    value={item.brand}
                    onValueChange={(v) => handleUpdate("brand", v)}
                    placeholder="Chọn/nhập thương hiệu"
                    searchPlaceholder="Tìm thương hiệu..."
                />
            </div>
            <div className="space-y-1.5">
                <Label className="text-xs">Model</Label>
                <SmartCombobox
                    options={modelOptions}
                    value={item.model}
                    onValueChange={(v) => handleUpdate("model", v)}
                    placeholder="Chọn/nhập model"
                    searchPlaceholder="Tìm model..."
                    disabled={!item.brand}
                />
            </div>
        </div>

        {/* Name & Category */}
        <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
            <div className="sm:col-span-3 space-y-1.5">
                <Label className="text-xs">Tên vật phẩm <span className="text-destructive">*</span></Label>
                <Input 
                    value={item.name}
                    onChange={(e) => handleUpdate("name", e.target.value)}
                    placeholder="Ví dụ: Tủ lạnh 2 cánh"
                    className={cn("h-9", !item.name && !item.brand && "border-destructive")}
                />
            </div>
            <div className="space-y-1.5">
                <Label className="text-xs">Phân loại</Label>
                <Select value={item.category} onValueChange={(v) => handleUpdate("category", v)}>
                    <SelectTrigger className="h-9"><SelectValue placeholder="Chọn" /></SelectTrigger>
                    <SelectContent>
                        {CATEGORIES.map((cat) => (
                            <SelectItem key={cat} value={cat}>{cat}</SelectItem>
                        ))}
                    </SelectContent>
                </Select>
            </div>
        </div>

        {/* Quantity, Weight, Value, Size */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            <div className="space-y-1.5">
                <Label className="text-xs">Số lượng <span className="text-destructive">*</span></Label>
                <Input 
                    type="number" 
                    min={1}
                    value={item.quantity}
                    onChange={(e) => handleUpdate("quantity", Number(e.target.value))}
                    className="h-9"
                />
            </div>
            <div className="space-y-1.5">
                <Label className="text-xs">Cân nặng (kg)</Label>
                <Input 
                    type="number" 
                    step="0.1"
                    value={item.weight_kg}
                    onChange={(e) => handleUpdate("weight_kg", e.target.value)}
                    placeholder={
                        item.size === "S" ? "< 10" : 
                        item.size === "M" ? "10-30" : 
                        item.size === "L" ? "> 30" : "0.0"
                    }
                    className="h-9"
                />
            </div>
            <div className="space-y-1.5">
                <Label className="text-xs">Giá trị (VNĐ)</Label>
                <Input 
                    value={item.declared_value}
                    onChange={(e) => handleUpdate("declared_value", e.target.value.replace(/\D/g, ''))}
                    placeholder="0"
                    className="h-9"
                />
            </div>
            <div className="space-y-1.5">
                <Label className="text-xs">Kích thước ước lượng</Label>
                <Select value={item.size} onValueChange={(v: any) => handleUpdate("size", v)}>
                    <SelectTrigger className="h-9"><SelectValue /></SelectTrigger>
                    <SelectContent>
                        <SelectItem value="S">S (Nhỏ - &lt; 10kg)</SelectItem>
                        <SelectItem value="M">M (Vừa - 10-30kg)</SelectItem>
                        <SelectItem value="L">L (Lớn - &gt; 30kg)</SelectItem>
                    </SelectContent>
                </Select>
            </div>
        </div>

        {/* Detailed Dimensions (Optional) */}
        <div className="space-y-1.5">
            <Label className="text-xs text-muted-foreground">Kích thước chi tiết (cm) - Không bắt buộc</Label>
            <div className="grid grid-cols-3 gap-4">
                <div className="relative">
                    <Input 
                        type="number" 
                        placeholder="Dài" 
                        value={item.width_cm}
                        onChange={(e) => handleUpdate("width_cm", e.target.value)}
                        className="h-9 pr-8" 
                    />
                    <span className="absolute right-2.5 top-1/2 -translate-y-1/2 text-[10px] text-muted-foreground pointer-events-none">Dài</span>
                </div>
                <div className="relative">
                    <Input 
                        type="number" 
                        placeholder="Rộng" 
                        value={item.depth_cm}
                        onChange={(e) => handleUpdate("depth_cm", e.target.value)}
                        className="h-9 pr-8" 
                    />
                    <span className="absolute right-2.5 top-1/2 -translate-y-1/2 text-[10px] text-muted-foreground pointer-events-none">Rộng</span>
                </div>
                <div className="relative">
                    <Input 
                        type="number" 
                        placeholder="Cao" 
                        value={item.height_cm}
                        onChange={(e) => handleUpdate("height_cm", e.target.value)}
                        className="h-9 pr-8" 
                    />
                    <span className="absolute right-2.5 top-1/2 -translate-y-1/2 text-[10px] text-muted-foreground pointer-events-none">Cao</span>
                </div>
            </div>
        </div>

        {/* Flags */}
        <div className="flex flex-wrap items-center gap-x-6 gap-y-3 pt-2">
            <div className="flex items-center space-x-2">
                <Checkbox 
                    id={`fragile-${item.id}`} 
                    checked={item.is_fragile}
                    onCheckedChange={(c) => handleUpdate("is_fragile", !!c)}
                />
                <Label htmlFor={`fragile-${item.id}`} className="text-xs cursor-pointer font-normal">Hàng dễ vỡ</Label>
            </div>
            <div className="flex items-center space-x-2">
                <Checkbox 
                    id={`disassemble-${item.id}`} 
                    checked={item.requires_disassembly}
                    onCheckedChange={(c) => handleUpdate("requires_disassembly", !!c)}
                />
                <Label htmlFor={`disassemble-${item.id}`} className="text-xs cursor-pointer font-normal">Cần hỗ trợ tháo lắp</Label>
            </div>
        </div>

        {onDelete && (
            <div className="pt-2 flex justify-end border-t mt-2">
                <Button variant="ghost" size="sm" onClick={(e) => { e.stopPropagation(); onDelete(); }} className="text-destructive hover:bg-destructive/10">
                    <Trash2 className="h-4 w-4 mr-2" />
                    Xóa dòng này
                </Button>
            </div>
        )}
    </div>
  )
}
