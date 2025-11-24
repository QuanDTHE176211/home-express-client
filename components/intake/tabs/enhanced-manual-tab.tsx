"use client"

import { useState, useEffect, useCallback, useMemo } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "@/components/ui/command"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { cn } from "@/lib/utils"

// Custom Combobox that clearer about Creating New vs Selecting
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
               <p className="text-muted-foreground mb-2 text-xs">Không tìm thấy &quot;{inputValue}&quot;</p>
               <Button 
                 variant="secondary" 
                 size="sm" 
                 className="w-full h-8 text-xs font-medium bg-blue-50 text-blue-700 hover:bg-blue-100 dark:bg-blue-900/30 dark:text-blue-300"
                 onClick={() => {
                    onValueChange(inputValue)
                    setOpen(false)
                 }}
               >
                 + Tạo mới &quot;{inputValue}&quot;
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
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Checkbox } from "@/components/ui/checkbox"
import { Badge } from "@/components/ui/badge"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Plus, Trash2, Sparkles, ChevronDown, ChevronUp, Info, AlertCircle, FileText, X, Check, ArrowRight } from "lucide-react"
import { Textarea } from "@/components/ui/textarea"
import type { ItemCandidate } from "@/types"
import { apiClient } from "@/lib/api-client"

interface EnhancedManualTabProps {
  onAddCandidates: (candidates: ItemCandidate[]) => void
  submitButtonText?: string
  showSuccessToast?: boolean
}

import { ItemForm, type ManualItem, normalizeCategory } from "../item-form"

export function EnhancedManualTab({ 
  onAddCandidates,
  submitButtonText = "Lưu vào danh sách",
  showSuccessToast = true
}: EnhancedManualTabProps) {
  // Initial item is expanded by default
  const [items, setItems] = useState<ManualItem[]>([])

  // Quick Add State
  const [showQuickAdd, setShowQuickAdd] = useState(false)
  const [quickText, setQuickText] = useState("")
  const [isParsing, setIsParsing] = useState(false)
  const [hasSubmitted, setHasSubmitted] = useState(false)

  // Combobox data
  const [brandOptions, setBrandOptions] = useState<Record<string, {value: string, label: string}[]>>({})
  const [modelOptions, setModelOptions] = useState<Record<string, {value: string, label: string}[]>>({})
  const [modelSuggestions, setModelSuggestions] = useState<Record<string, any[]>>({})

  const createEmptyItem = (expanded = true): ManualItem => ({
    id: Math.random().toString(36).substr(2, 9),
    brand: "",
    model: "",
    productName: "",
    name: "",
    category: "",
    size: "M",
    quantity: 1,
    declared_value: "",
    weight_kg: "",
    width_cm: "",
    height_cm: "",
    depth_cm: "",
    is_fragile: false,
    requires_disassembly: false,
    isExpanded: expanded,
    isValid: false,
    isTouched: false
  })

  const isPlaceholderItem = useCallback((item: ManualItem) => {
    const noPrimaryFields = !item.name.trim() && !item.brand.trim() && !item.model.trim() && !item.category.trim()
    const noDetails = !item.declared_value.trim() && !item.weight_kg.trim() && !item.width_cm.trim() && !item.height_cm.trim() && !item.depth_cm.trim()
    const noFlags = !item.is_fragile && !item.requires_disassembly
    return !item.isTouched && noPrimaryFields && noDetails && noFlags && item.quantity === 1
  }, [])

  const meaningfulItems = useMemo(
    () => items.filter((item) => !isPlaceholderItem(item)),
    [items, isPlaceholderItem]
  )

  const validCount = useMemo(
    () => meaningfulItems.filter((item) => item.isValid).length,
    [meaningfulItems]
  )

  // Initialize with one item if empty
  // useEffect(() => {
  //   if (items.length === 0) {
  //     // setItems([createEmptyItem(true)])
  //   }
  // }, [])

  const validateItem = useCallback((item: ManualItem): boolean => {
    // Rule: Name is required OR (Brand + Model is required)
    // Rule: Quantity >= 1
    const hasName = !!item.name.trim()
    const hasBrandModel = !!item.brand.trim() && !!item.model.trim()
    const hasIdentity = hasName || hasBrandModel
    const validQty = item.quantity >= 1
    return hasIdentity && validQty
  }, [])

  // Update validation status whenever fields change
  const validationDeps = JSON.stringify(items.map(i => ({ n: i.name, b: i.brand, m: i.model, q: i.quantity })))
  useEffect(() => {
    setItems(prev => prev.map(item => ({ ...item, isValid: validateItem(item) })))
  }, [validationDeps, validateItem])

  const handleQuickParse = async () => {
    if (!quickText.trim()) return

    setIsParsing(true)
    try {
      const response = await apiClient.parseText(quickText)
      const parsedItems = response.data.candidates.map((c: any) => {
        const newItem = createEmptyItem(false) // Collapsed by default
        return {
          ...newItem,
          brand: c.brand || "",
          model: c.model || "",
          name: c.name || "",
          category: normalizeCategory(c.category_name, { 
              isFragile: c.is_fragile, 
              weight: c.weight_kg 
          }) || c.category_name || "",
          size: (c.size as "S" | "M" | "L") || "M",
          quantity: c.quantity || 1,
          declared_value: c.metadata?.declared_value ? String(c.metadata.declared_value) : "",
          is_fragile: c.is_fragile || false,
          requires_disassembly: c.requires_disassembly || false,
          weight_kg: c.weight_kg ? String(c.weight_kg) : "",
          width_cm: c.width_cm ? String(c.width_cm) : "",
          height_cm: c.height_cm ? String(c.height_cm) : "",
          depth_cm: c.depth_cm ? String(c.depth_cm) : "",
          isValid: true, // Will be re-validated by effect
          isTouched: true
        }
      })

      // Replace the empty initial item if it exists and is untouched
      let currentItems = [...items]
      if (currentItems.length === 1 && !currentItems[0].name && !currentItems[0].brand) {
        currentItems = []
      }

      setItems([...currentItems, ...parsedItems])
      setQuickText("")
      setShowQuickAdd(false)
      
      const { toast } = await import("sonner")
      toast.success(`Đã thêm ${parsedItems.length} vật phẩm`)
    } catch (err) {
      console.error(err)
      const { toast } = await import("sonner")
      toast.error("Lỗi phân tích văn bản")
    } finally {
      setIsParsing(false)
    }
  }

  // Search brands logic (throttled)
  const brandDeps = items.map(i => i.brand).join(",")
  useEffect(() => {
    items.forEach((item) => {
      if (!item.brand || brandOptions[item.id]) return // Skip if empty or already loaded
      
      const timer = setTimeout(async () => {
        try {
          const data = await apiClient.searchBrands(item.brand)
          setBrandOptions(prev => ({
            ...prev,
            [item.id]: data.brands.map((b) => ({ value: b, label: b }))
          }))
        } catch (err) { /* ignore */ }
      }, 500)
      return () => clearTimeout(timer)
    })
  }, [brandDeps, items, brandOptions])

  // Search models logic (throttled)
  const modelDeps = items.map(i => `${i.brand}:${i.model}`).join(",")
  useEffect(() => {
    items.forEach((item) => {
      if (!item.brand || !item.model || modelOptions[item.id]) return 
    
      const timer = setTimeout(async () => {
        try {
          const data = await apiClient.searchModels(item.model, item.brand)
          setModelOptions(prev => ({
            ...prev,
            [item.id]: data.models.map((m) => ({ value: m.model, label: m.model }))
          }))
          setModelSuggestions(prev => ({ ...prev, [item.id]: data.models }))
        } catch (err) { /* ignore */ }
      }, 500)
      return () => clearTimeout(timer)
    })
  }, [modelDeps, items, modelOptions])


  const addRow = () => {
    // Collapse all current items
    const collapsedItems = items.map(i => ({ ...i, isExpanded: false }))
    // Add new expanded item at the TOP of the list for better visibility
    setItems([createEmptyItem(true), ...collapsedItems])
  }

  const removeRow = (id: string) => {
    const newItems = items.filter((i) => i.id !== id)
    // If list becomes empty, add a new empty row
    if (newItems.length === 0) {
        setItems([createEmptyItem(true)])
    } else {
        setItems(newItems)
    }
  }

  const updateItem = (id: string, updates: Partial<ManualItem>) => {
    setItems(prev => prev.map(item => {
      if (item.id !== id) return item
      const merged = { ...item, ...updates }
      if (!("isTouched" in updates)) {
        merged.isTouched = true
      }
      return merged
    }))
  }

  const toggleExpand = (id: string) => {
    setItems(prev => prev.map(i => i.id === id ? { ...i, isExpanded: !i.isExpanded } : i))
  }

  const handleSubmit = async () => {
    setHasSubmitted(true)
    if (meaningfulItems.length === 0) {
      const { toast } = await import("sonner")
      toast.error("Them it nhat 1 vat pham de luu", {
        description: "Nhap thu cong hoac dan danh sach truoc khi luu."
      })
      return
    }
    const invalidItems = meaningfulItems.filter(i => !validateItem(i))
    if (invalidItems.length > 0) {
      const { toast } = await import("sonner")
      toast.error(`Có ${invalidItems.length} vật phẩm chưa hợp lệ`, {
        description: "Vui lòng kiểm tra các mục có viền đỏ."
      })
      const invalidIds = new Set(invalidItems.map((i) => i.id))
      setItems(prev => prev.map(i => invalidIds.has(i.id) ? { ...i, isExpanded: true, isTouched: true } : i))
      return
    }

    const candidates: ItemCandidate[] = meaningfulItems.map((item, index) => ({
      id: `manual-${Date.now()}-${index}`,
      name: item.name || `${item.brand} ${item.model}`.trim(),
      category_id: null,
      category_name: item.category || null,
      size: item.size,
      weight_kg: item.weight_kg ? parseFloat(item.weight_kg) : null,
      dimensions: item.width_cm || item.height_cm || item.depth_cm ? {
          width_cm: item.width_cm ? parseFloat(item.width_cm) : null,
          height_cm: item.height_cm ? parseFloat(item.height_cm) : null,
          depth_cm: item.depth_cm ? parseFloat(item.depth_cm) : null,
      } : null,
      quantity: item.quantity,
      is_fragile: item.is_fragile,
      requires_disassembly: item.requires_disassembly,
      requires_packaging: false,
      source: "manual",
      confidence: 1,
      image_url: null,
      notes: item.brand && item.model ? `${item.brand} ${item.model}` : null,
      metadata: {
        model_id: item.modelId || null,
        brand: item.brand || null,
        model: item.model || null,
        declared_value: item.declared_value ? parseFloat(item.declared_value) : null,
      },
    }))

    onAddCandidates(candidates)
    if (showSuccessToast) {
        const { toast } = await import("sonner")
        toast.success(`Đã lưu ${candidates.length} vật phẩm`)
    }
    // Reset to one empty row
    setHasSubmitted(false)
    setItems([createEmptyItem(true)])
  }

  return (
    <div className="space-y-6">
      {/* Smart Input Bar */}
      <div className="bg-muted/30 rounded-lg border p-4 transition-all">
        {!showQuickAdd ? (
          <div className="flex items-center justify-between gap-4">
            <div className="flex-1">
               <h3 className="font-medium text-sm mb-1">Thêm nhanh</h3>
               <p className="text-xs text-muted-foreground">Nhập thủ công hoặc dán danh sách (Ví dụ: &quot;1 tủ lạnh, 2 sofa&quot;)</p>
            </div>
            <div className="flex gap-2">
                <Button variant="outline" size="sm" onClick={addRow}>
                    <Plus className="h-4 w-4 mr-2" />
                    Nhập món lẻ
                </Button>
                <Button variant="secondary" size="sm" onClick={() => setShowQuickAdd(true)}>
                    <FileText className="h-4 w-4 mr-2" />
                    Dán văn bản
                </Button>
            </div>
          </div>
        ) : (
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <Label className="flex items-center gap-2 text-primary font-semibold">
                <Sparkles className="h-4 w-4" />
                Dán danh sách vật phẩm
              </Label>
              <Button variant="ghost" size="sm" onClick={() => setShowQuickAdd(false)} className="h-6 w-6 p-0">
                <X className="h-4 w-4" />
              </Button>
            </div>
            <Textarea 
              autoFocus
              placeholder="Ví dụ: 1 tủ lạnh Samsung, 2 bộ sofa, 1 máy giặt LG cửa ngang..."
              value={quickText}
              onChange={(e) => setQuickText(e.target.value)}
              className="min-h-[100px] font-medium"
            />
            <div className="flex justify-end">
              <Button 
                size="sm" 
                onClick={handleQuickParse} 
                disabled={!quickText.trim() || isParsing}
                className="bg-primary hover:bg-primary/90"
              >
                {isParsing ? "Đang phân tích..." : "Phân tích & Điền form"}
              </Button>
            </div>
          </div>
        )}
      </div>

      {/* Item List */}
      <div className="space-y-3">
        {items.map((item) => {
          const isPlaceholder = isPlaceholderItem(item)
          const showInvalid = (item.isTouched || hasSubmitted) && !item.isValid && !isPlaceholder
          const showValid = item.isValid && !isPlaceholder
          return (
            <Card 
            key={item.id} 
            className={cn(
                "transition-all duration-200",
                item.isExpanded ? "border-primary/50 shadow-md" : "hover:border-primary/30",
                showInvalid ? "border-destructive/50 bg-destructive/5" : ""
            )}
          >
            {/* Header / Summary Row */}
            <div 
                className={cn(
                    "p-4 flex items-center gap-4 cursor-pointer select-none",
                    item.isExpanded && "border-b bg-muted/10"
                )}
                onClick={() => toggleExpand(item.id)}
            >
                {/* Status Icon */}
                <div className="flex-shrink-0">
                    {showInvalid ? (
                        <div className="h-6 w-6 rounded-full bg-red-100 dark:bg-red-900 flex items-center justify-center animate-pulse">
                            <AlertCircle className="h-3 w-3 text-red-600 dark:text-red-400" />
                        </div>
                    ) : showValid ? (
                        <div className="h-6 w-6 rounded-full bg-green-100 dark:bg-green-900 flex items-center justify-center">
                            <Check className="h-3 w-3 text-green-600 dark:text-green-400" />
                        </div>
                    ) : (
                        <div className="h-6 w-6 rounded-full bg-muted text-muted-foreground flex items-center justify-center">
                            <Info className="h-3 w-3" />
                        </div>
                    )}
                </div>

                {/* Summary Text */}
                <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                        <h4 className={cn("font-medium truncate", !item.name && !item.brand && "text-muted-foreground italic")}>
                            {item.name || `${item.brand} ${item.model}` || "Chưa có tên"}
                        </h4>
                        {item.brand && <Badge variant="outline" className="text-[10px] h-5 px-1.5">{item.brand}</Badge>}
                        {item.category && <Badge variant="secondary" className="text-[10px] h-5 px-1.5">{item.category}</Badge>}
                    </div>
                    <div className="text-xs text-muted-foreground flex gap-3 mt-0.5 items-center flex-wrap">
                        <span>SL: {item.quantity}</span>
                        {item.declared_value && <span>• {new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND', maximumFractionDigits: 0 }).format(Number(item.declared_value))}</span>}
                        {item.weight_kg && <span>• {item.weight_kg}kg</span>}
                        {item.is_fragile && <Badge variant="destructive" className="text-[10px] h-5 px-1.5 ml-1">Dễ vỡ</Badge>}
                        {item.requires_disassembly && <Badge variant="outline" className="text-[10px] h-5 px-1.5 ml-1 border-orange-500 text-orange-600">Cần tháo lắp</Badge>}
                    </div>
                </div>

                {/* Actions */}
                <div className="flex items-center gap-1">
                    {item.isExpanded ? <ChevronUp className="h-4 w-4 text-muted-foreground" /> : <ChevronDown className="h-4 w-4 text-muted-foreground" />}
                </div>
            </div>

            {/* Expanded Form */}
            {item.isExpanded && (
                <CardContent className="p-4">
                    <ItemForm 
                        item={item} 
                        onChange={(updates) => updateItem(item.id, updates)} 
                        onDelete={() => removeRow(item.id)} 
                        showValidation={hasSubmitted && !isPlaceholder}
                    />
                </CardContent>
            )}
          </Card>
          )
        })}
      </div>

      {/* Footer Action */}
      <div className="flex gap-3 pt-4 border-t sticky bottom-0 bg-background/95 backdrop-blur py-4 z-10">
        <Button 
          onClick={handleSubmit} 
          disabled={meaningfulItems.length === 0}
          className="w-full bg-accent-green hover:bg-accent-green-dark h-11 text-base disabled:opacity-60 disabled:cursor-not-allowed"
        >
            {submitButtonText} ({validCount})
        </Button>
      </div>
    </div>
  )
}
