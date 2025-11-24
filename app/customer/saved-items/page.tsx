"use client"

import { useState, useEffect, useMemo, useCallback } from "react"
import { useRouter } from "next/navigation"
import { DashboardLayout } from "@/components/dashboard/dashboard-layout"
import { navItems } from "@/lib/customer-nav-config"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Checkbox } from "@/components/ui/checkbox"
import { Badge } from "@/components/ui/badge"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import {
  Package,
  Trash2,
  CheckSquare,
  Square,
  ArrowRight,
  Edit,
  Plus,
  PackageOpen,
} from "lucide-react"
import { apiClient } from "@/lib/api-client"
import { toast } from "sonner"
import { IntakeCollector } from "@/components/intake/intake-collector"
import type { ItemCandidate } from "@/types"

interface SavedItem {
  savedItemId: number
  name: string
  brand: string | null
  model: string | null
  categoryId: number | null
  size: string | null
  weightKg: number | null
  dimensions: string | null
  declaredValueVnd: number | null
  quantity: number
  isFragile: boolean
  requiresDisassembly: boolean
  requiresPackaging: boolean
  notes: string | null
  metadata: string | null
  createdAt: string
}

import { ItemForm, type ManualItem } from "@/components/intake/item-form"

/** ---------- Edit item dialog ---------- */
type EditItemDialogProps = {
  open: boolean
  onOpenChange: (open: boolean) => void
  item: SavedItem
  onSave: (updates: Partial<ManualItem>) => void
}

function EditItemDialog({
  open,
  onOpenChange,
  item,
  onSave,
}: EditItemDialogProps) {
  // Load dimensions
  const [formData, setFormData] = useState<ManualItem>(() => {
    let initialDims = { width_cm: "", height_cm: "", depth_cm: "" }
    
    if (item.dimensions) {
      const dims = safeJsonParse<{width_cm?: number, height_cm?: number, depth_cm?: number}>(item.dimensions)
      if (dims) {
        initialDims = {
          width_cm: dims.width_cm ? String(dims.width_cm) : "",
          height_cm: dims.height_cm ? String(dims.height_cm) : "",
          depth_cm: dims.depth_cm ? String(dims.depth_cm) : "",
        }
      }
    }

    return {
      id: String(item.savedItemId),
      brand: item.brand || "",
      model: item.model || "",
      productName: item.name,
      name: item.name,
      category: item.metadata ? (safeJsonParse<any>(item.metadata)?.category || "") : "",
      size: (item.size as "S" | "M" | "L") || "M",
      quantity: item.quantity,
      declared_value: item.declaredValueVnd ? String(item.declaredValueVnd) : "",
      weight_kg: item.weightKg ? String(item.weightKg) : "",
      width_cm: initialDims.width_cm,
      height_cm: initialDims.height_cm,
      depth_cm: initialDims.depth_cm,
      is_fragile: item.isFragile,
      requires_disassembly: item.requiresDisassembly,
      isExpanded: true,
      isValid: true,
      isTouched: true
    }
  })

  const handleFormChange = useCallback((updates: Partial<ManualItem>) => {
    setFormData((prev) => ({ ...prev, ...updates }))
  }, [])

  const handleSave = () => {
    onSave(formData)
    onOpenChange(false)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px] overflow-y-auto max-h-[90vh]">
        <DialogHeader>
          <DialogTitle>Chỉnh sửa vật phẩm</DialogTitle>
        </DialogHeader>
        <div className="py-4">
          <ItemForm 
            item={formData} 
            onChange={handleFormChange}
            isSingleMode={true}
          />
        </div>
        <div className="flex justify-end gap-3 mt-4">
          <Button variant="outline" onClick={() => onOpenChange(false)}>Hủy</Button>
          <Button onClick={handleSave} className="bg-accent-green hover:bg-accent-green-dark">Lưu thay đổi</Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}
const formatVnd = (n: number) =>
  new Intl.NumberFormat("vi-VN", {
    style: "currency",
    currency: "VND",
    maximumFractionDigits: 0,
  }).format(n)

function safeJsonParse<T = unknown>(input: string | null): T | null {
  if (!input) return null
  try {
    return JSON.parse(input) as T
  } catch {
    return null
  }
}

/** ---------- Add items dialog (reusable) ---------- */
type AddItemsDialogProps = {
  open: boolean
  onOpenChange: (open: boolean) => void
  pending: ItemCandidate[]
  onPendingChange: (c: ItemCandidate[]) => void
  onSave: () => void
}
function AddItemsDialog({
  open,
  onOpenChange,
  pending,
  onPendingChange,
  onSave,
}: AddItemsDialogProps) {
  return (
    <Dialog
      open={open}
      onOpenChange={(o) => {
        onOpenChange(o)
        if (!o) onPendingChange([])
      }}
    >
      <DialogContent className="p-0 sm:max-w-[1000px] w-[98vw] h-[90vh] sm:h-auto sm:max-h-[85vh] flex flex-col overflow-hidden">
        <DialogHeader className="shrink-0 px-6 pt-6 pb-4 border-b">
          <DialogTitle className="text-xl font-semibold">
            Thêm vật phẩm vào kho
          </DialogTitle>
          <DialogDescription className="text-sm mt-1">
            Dùng AI hoặc nhập thủ công. Bạn có thể lưu nhiều vật phẩm một lần.
          </DialogDescription>
        </DialogHeader>

        <div className="flex-1 overflow-y-auto px-4 sm:px-6 py-5">
          <IntakeCollector
            sessionId={0}
            onContinue={onPendingChange}
            hideFooter={true}
          />
        </div>

        <div className="shrink-0 border-t bg-background px-6 py-4 flex items-center justify-between mt-auto">
            <span className="text-sm text-muted-foreground">
              {pending.length > 0 ? (
                <>
                  <span className="font-medium text-foreground">
                    {pending.length}
                  </span>{" "}
                  vật phẩm sẵn sàng
                </>
              ) : (
                "Chưa có vật phẩm nào"
              )}
            </span>
            <div className="flex gap-3">
              <Button
                variant="outline"
                onClick={() => onOpenChange(false)}
                className="h-10 px-6"
              >
                Hủy
              </Button>
              <Button
                onClick={onSave}
                disabled={pending.length === 0}
                className="bg-accent-green hover:bg-accent-green-dark h-10 px-6"
              >
                <Plus className="h-4 w-4 mr-2" />
                Lưu vào kho ({pending.length})
              </Button>
            </div>
          </div>
      </DialogContent>
    </Dialog>
  )
}

/** ---------- page ---------- */
export default function SavedItemsPage() {
  const router = useRouter()
  const [items, setItems] = useState<SavedItem[]>([])
  const [selectedIds, setSelectedIds] = useState<Set<number>>(new Set())
  const [isLoading, setIsLoading] = useState(true)
  const [showAddDialog, setShowAddDialog] = useState(false)
  const [pendingCandidates, setPendingCandidates] = useState<ItemCandidate[]>(
    []
  )
  const [editingItem, setEditingItem] = useState<SavedItem | null>(null)

  const loadItems = useCallback(async () => {
    try {
      setIsLoading(true)
      const response = await apiClient.getSavedItems()
      setItems(response.items)
    } catch (error) {
      toast.error("Không thể tải kho đồ")
      console.error(error)
    } finally {
      setIsLoading(false)
    }
  }, [])

  useEffect(() => {
    loadItems()
  }, [loadItems])

  const toggleSelect = (id: number) => {
    setSelectedIds((prev) => {
      const next = new Set(prev)
      next.has(id) ? next.delete(id) : next.add(id)
      return next
    })
  }

  const toggleSelectAll = () => {
    setSelectedIds((prev) =>
      prev.size === items.length
        ? new Set()
        : new Set(items.map((i) => i.savedItemId))
    )
  }

  const handleDelete = async (id: number) => {
    if (!confirm("Xóa vật phẩm này khỏi kho?")) return
    try {
      await apiClient.deleteSavedItem(id)
      toast.success("Đã xóa khỏi kho")
      await loadItems()
      setSelectedIds((s) => {
        const n = new Set(s)
        n.delete(id)
        return n
      })
    } catch {
      toast.error("Không thể xóa")
    }
  }

  const handleDeleteSelected = async () => {
    if (selectedIds.size === 0) return
    if (!confirm(`Xóa ${selectedIds.size} vật phẩm đã chọn?`)) return
    try {
      await apiClient.deleteSavedItems(Array.from(selectedIds))
      toast.success(`Đã xóa ${selectedIds.size} vật phẩm`)
      setSelectedIds(new Set())
      await loadItems()
    } catch {
      toast.error("Không thể xóa")
    }
  }

  const handleDeleteAll = async () => {
    if (!confirm("Xóa TẤT CẢ vật phẩm trong kho?")) return
    try {
      await apiClient.deleteAllSavedItems()
      toast.success("Đã xóa tất cả")
      setSelectedIds(new Set())
      await loadItems()
    } catch {
      toast.error("Không thể xóa")
    }
  }

  const handleCreateBooking = () => {
    if (selectedIds.size === 0) {
      toast.error("Chọn ít nhất 1 vật phẩm")
      return
    }
    const selectedItems = items.filter((i) => selectedIds.has(i.savedItemId))
    const candidates: ItemCandidate[] = selectedItems.map((item) => ({
      id: `saved-${item.savedItemId}`,
      name: item.name,
      category_id: item.categoryId,
      category_name: null,
      size: item.size as any,
      weight_kg: item.weightKg ? Number(item.weightKg) : null,
      dimensions: safeJsonParse(item.dimensions),
      quantity: item.quantity,
      is_fragile: item.isFragile,
      requires_disassembly: item.requiresDisassembly,
      requires_packaging: item.requiresPackaging,
      source: "manual",
      confidence: 1,
      image_url: null,
      notes: item.notes,
      metadata: {
        ...(safeJsonParse<Record<string, unknown>>(item.metadata) || {}),
        declared_value: item.declaredValueVnd,
        saved_item_id: item.savedItemId,
      },
    }))
    sessionStorage.setItem("savedItemsCandidates", JSON.stringify(candidates))
    router.push("/customer/bookings/create")
  }

  const effective = useMemo(() => {
    if (selectedIds.size === 0) return items
    return items.filter((i) => selectedIds.has(i.savedItemId))
  }, [items, selectedIds])

  const totalValue = useMemo(
    () =>
      effective.reduce(
        (sum, item) => sum + (item.declaredValueVnd || 0) * item.quantity,
        0
      ),
    [effective]
  )
  const totalQuantity = useMemo(
    () => effective.reduce((sum, item) => sum + item.quantity, 0),
    [effective]
  )

  const handleSaveItems = async () => {
    if (pendingCandidates.length === 0) {
      toast.error("Chưa có vật phẩm để lưu")
      return
    }
    try {
      const itemsToSave = pendingCandidates.map((c) => ({
        name: c.name,
        brand: (c.metadata as any)?.brand || null,
        model: (c.metadata as any)?.model || null,
        categoryId: c.category_id || null,
        size: c.size || null,
        weightKg: c.weight_kg || null,
        dimensions: c.dimensions ? JSON.stringify(c.dimensions) : null,
        declaredValueVnd: (c.metadata as any)?.declared_value || null,
        quantity: c.quantity,
        isFragile: c.is_fragile || false,
        requiresDisassembly: c.requires_disassembly || false,
        requiresPackaging: c.requires_packaging || false,
        notes: c.notes || null,
        metadata: c.metadata ? JSON.stringify(c.metadata) : null,
      }))

      const response = await apiClient.saveItemsToStorage(itemsToSave)
      toast.success(response.message || `Đã lưu ${response.count} vật phẩm`)
      setPendingCandidates([])
      setShowAddDialog(false)
      await loadItems()
    } catch (error) {
      toast.error("Không thể lưu vào kho")
      console.error(error)
    }
  }

  const handleEditSave = async (updatedData: Partial<ManualItem>) => {
    if (!editingItem) return
    try {
      const updates = {
        name: updatedData.productName || updatedData.name,
        brand: updatedData.brand || null,
        model: updatedData.model || null,
        categoryId: updatedData.category && !isNaN(Number(updatedData.category)) ? Number(updatedData.category) : editingItem.categoryId,
        size: updatedData.size || null,
        weightKg: updatedData.weight_kg ? Number(updatedData.weight_kg) : null,
        dimensions: updatedData.width_cm && updatedData.height_cm && updatedData.depth_cm 
          ? JSON.stringify({
              width_cm: Number(updatedData.width_cm),
              height_cm: Number(updatedData.height_cm),
              depth_cm: Number(updatedData.depth_cm)
            }) 
          : editingItem.dimensions,
        declaredValueVnd: updatedData.declared_value ? Number(updatedData.declared_value) : null,
        quantity: updatedData.quantity || 1,
        isFragile: updatedData.is_fragile || false,
        requiresDisassembly: updatedData.requires_disassembly || false,
        notes: editingItem.notes, // Keep existing notes unless form adds note field
        metadata: editingItem.metadata
      }

      await apiClient.updateSavedItem(editingItem.savedItemId, updates)
      toast.success("Đã cập nhật vật phẩm")
      setEditingItem(null)
      loadItems()
    } catch (error) {
      toast.error("Không thể cập nhật vật phẩm")
      console.error(error)
    }
  }

  if (isLoading) {
    return (
      <DashboardLayout navItems={navItems} title="Đồ của tôi">
        <div className="container max-w-6xl py-10">
          <div className="text-center py-20">
            <Package className="h-12 w-12 mx-auto mb-4 animate-pulse text-muted-foreground" />
            <p className="text-muted-foreground">Đang tải...</p>
          </div>
        </div>
      </DashboardLayout>
    )
  }

  return (
    <DashboardLayout navItems={navItems} title="Đồ của tôi">
      <div className="container max-w-6xl py-10 mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold mb-2">Đồ của tôi</h1>
            <p className="text-muted-foreground">
              Thêm khi rảnh. Tạo đơn khi cần.
            </p>
          </div>
          <div className="flex gap-2">
            {items.length > 0 && (
              <Button
                variant="outline"
                onClick={() => router.push("/customer/bookings/create")}
              >
                Tạo đơn mới
                <ArrowRight className="h-4 w-4 ml-2" />
              </Button>
            )}
            <Button
              className="bg-accent-green hover:bg-accent-green-dark"
              onClick={() => setShowAddDialog(true)}
            >
              <Plus className="h-4 w-4 mr-2" />
              Thêm vật phẩm
            </Button>
          </div>
        </div>

        {/* Actions bar */}
        {items.length > 0 && (
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between flex-wrap gap-4">
                <div className="flex items-center gap-4">
                  <Button variant="outline" size="sm" onClick={toggleSelectAll}>
                    {selectedIds.size === items.length ? (
                      <>
                        <CheckSquare className="h-4 w-4 mr-2" />
                        Bỏ chọn tất cả
                      </>
                    ) : (
                      <>
                        <Square className="h-4 w-4 mr-2" />
                        Chọn tất cả
                      </>
                    )}
                  </Button>
                  <div className="flex flex-col">
                    <span className="text-sm text-muted-foreground">
                      {selectedIds.size > 0
                        ? `${selectedIds.size}/${items.length} đã chọn`
                        : `${items.length} vật phẩm`}
                      {" • "}
                      {totalQuantity} món
                    </span>
                    {totalValue > 0 && (
                      <span className="text-xs font-semibold text-green-600 dark:text-green-400">
                        Tổng giá trị: {formatVnd(totalValue)}
                      </span>
                    )}
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  {selectedIds.size > 0 && (
                    <>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={handleDeleteSelected}
                      >
                        <Trash2 className="h-4 w-4 mr-2" />
                        Xóa đã chọn
                      </Button>
                      <Button
                        size="sm"
                        onClick={handleCreateBooking}
                        className="bg-accent-green hover:bg-accent-green-dark"
                      >
                        Tạo đơn ({selectedIds.size})
                        <ArrowRight className="h-4 w-4 ml-2" />
                      </Button>
                    </>
                  )}
                  {items.length > 0 && (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={handleDeleteAll}
                      className="text-destructive"
                    >
                      <Trash2 className="h-4 w-4 mr-2" />
                      Xóa tất cả
                    </Button>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Items list */}
        {items.length === 0 ? (
          <Card>
            <CardContent className="p-12 text-center">
              <PackageOpen className="h-16 w-16 mx-auto mb-4 text-muted-foreground" />
              <h3 className="text-lg font-semibold mb-2">Kho đồ trống</h3>
              <p className="text-muted-foreground mb-6">
                Thêm vật phẩm khi rảnh. Tạo đơn khi cần.
              </p>
              <div className="flex gap-2 justify-center">
                <Button
                  className="bg-accent-green hover:bg-accent-green-dark"
                  onClick={() => setShowAddDialog(true)}
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Thêm vật phẩm ngay
                </Button>
                <Button
                  variant="outline"
                  onClick={() => router.push("/customer/bookings/create")}
                >
                  Hoặc tạo đơn ngay
                </Button>
              </div>
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-4">
            {items.map((item) => (
              <Card
                key={item.savedItemId}
                className={selectedIds.has(item.savedItemId) ? "border-primary" : ""}
              >
                <CardContent className="p-4">
                  <div className="flex items-start gap-4">
                    <Checkbox
                      checked={selectedIds.has(item.savedItemId)}
                      onCheckedChange={() => toggleSelect(item.savedItemId)}
                      className="mt-1"
                      aria-label="Chọn vật phẩm"
                    />

                    <div className="flex-1">
                      <div className="flex items-start justify-between mb-2">
                        <div>
                          <h3 className="font-semibold text-lg">
                            {item.name}
                          </h3>
                          {(item.brand || item.model) && (
                            <p className="text-sm text-muted-foreground">
                              {[item.brand, item.model].filter(Boolean).join(" ")}
                            </p>
                          )}
                        </div>
                        <div className="flex gap-2">
                          <Button
                            variant="ghost"
                            size="sm"
                            aria-label="Sửa vật phẩm"
                            onClick={() => setEditingItem(item)}
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            aria-label="Xóa vật phẩm"
                            onClick={() => handleDelete(item.savedItemId)}
                          >
                            <Trash2 className="h-4 w-4 text-destructive" />
                          </Button>
                        </div>
                      </div>

                      <div className="flex flex-wrap gap-2">
                        <Badge variant="secondary">SL: {item.quantity}</Badge>
                        {item.declaredValueVnd != null && (
                          <Badge className="bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-100">
                            {formatVnd(item.declaredValueVnd)}
                          </Badge>
                        )}
                        {item.size && <Badge variant="outline">{item.size}</Badge>}
                        {item.weightKg != null && (
                          <Badge variant="outline">{item.weightKg} kg</Badge>
                        )}
                        {item.isFragile && <Badge variant="destructive">Dễ vỡ</Badge>}
                        {item.requiresDisassembly && <Badge>Cần tháo rời</Badge>}
                        <Badge variant="outline" className="text-xs">
                          {new Date(item.createdAt).toLocaleDateString("vi-VN")}
                        </Badge>
                      </div>

                      {item.notes && (
                        <p className="text-sm text-muted-foreground mt-2">
                          {item.notes}
                        </p>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}

        {/* Reusable add dialog */}
        <AddItemsDialog
          open={showAddDialog}
          onOpenChange={setShowAddDialog}
          pending={pendingCandidates}
          onPendingChange={setPendingCandidates}
          onSave={handleSaveItems}
        />

        {/* Edit dialog */}
        {editingItem && (
          <EditItemDialog 
            key={editingItem.savedItemId}
            open={!!editingItem} 
            onOpenChange={(open) => !open && setEditingItem(null)} 
            item={editingItem} 
            onSave={handleEditSave} 
          />
        )}
      </div>
    </DashboardLayout>
  )
}
