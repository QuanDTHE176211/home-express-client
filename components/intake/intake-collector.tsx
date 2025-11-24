"use client"

import { useState } from "react"
import Image from "next/image"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Trash2, Save, Pencil, Check } from "lucide-react"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Checkbox } from "@/components/ui/checkbox"
import type { ItemCandidate } from "@/types"
import { EnhancedManualTab } from "./tabs/enhanced-manual-tab"
import { ItemForm, type ManualItem } from "./item-form" // Import ItemForm
import { apiClient } from "@/lib/api-client"

interface IntakeCollectorProps {
  sessionId: number
  onContinue: (candidates: ItemCandidate[]) => void
  hideFooter?: boolean
  initialCandidates?: ItemCandidate[]
}

export function IntakeCollector({ 
  sessionId, 
  onContinue, 
  hideFooter = false,
  initialCandidates = []
}: IntakeCollectorProps) {
  const [candidates, setCandidates] = useState<ItemCandidate[]>(initialCandidates)
  const [editingId, setEditingId] = useState<string | null>(null)

  function addCandidates(newCandidates: ItemCandidate[]) {
    const candidatesWithScore = newCandidates.map(c => ({
      ...c,
      confidence: calculateConfidence(c)
    }))
    setCandidates(prev => {
      const next = [...prev, ...candidatesWithScore]
      if (hideFooter) {
        setTimeout(() => onContinue(next), 0)
      }
      return next
    })
  }

  function removeCandidate(id: string) {
    setCandidates(prev => {
      const next = prev.filter(c => c.id !== id)
      if (hideFooter) {
        setTimeout(() => onContinue(next), 0)
      }
      return next
    })
  }

  function toggleEdit(id: string) {
    setEditingId(prev => (prev === id ? null : id))
  }

  function clearCandidates() {
    setCandidates([])
    if (hideFooter) {
      setTimeout(() => onContinue([]), 0)
    }
  }

  async function handleSaveToStorage() {
    // Placeholder for saving to storage
    const { toast } = await import("sonner")
    toast.success("Đã lưu danh sách vào kho")
  }

  function handleContinue() {
    onContinue(candidates)
  }

  function calculateConfidence(c: ItemCandidate): number {
    // ... (same as before)
    let score = 0.0
    if (c.name && c.name.trim().length > 0) score += 0.3
    if (c.quantity > 0) score += 0.1
    if (c.category_name && c.category_name !== "Khác") score += 0.2
    const hasWeight = c.weight_kg && c.weight_kg > 0
    const hasDimensions = c.dimensions && (
      (c.dimensions.width_cm && c.dimensions.width_cm > 0) || 
      (c.dimensions.height_cm && c.dimensions.height_cm > 0) ||
      (c.dimensions.depth_cm && c.dimensions.depth_cm > 0)
    )
    if (hasWeight || hasDimensions) {
      score += 0.3
    } else if (c.size && c.size !== "M") {
      score += 0.15
    }
    const meta = c.metadata as any
    if (meta?.brand || meta?.model) {
      score += 0.1
    }
    return Math.min(Math.round(score * 100) / 100, 1.0)
  }

  function updateCandidate(id: string, updates: Partial<ItemCandidate>) {
    // ... (same as before)
    const newCandidates = candidates.map(c => {
      if (c.id !== id) return c
      const updated = { ...c, ...updates }
      updated.confidence = calculateConfidence(updated)
      return updated
    })
    setCandidates(newCandidates)
    if (hideFooter) {
      onContinue(newCandidates)
    }
  }

  // Helper to convert ItemCandidate to ManualItem for the form
  function candidateToManualItem(c: ItemCandidate): ManualItem {
    return {
      id: c.id,
      brand: (c.metadata as any)?.brand || "",
      model: (c.metadata as any)?.model || "",
      productName: c.name,
      name: c.name,
      category: c.category_name || "",
      size: c.size || "M",
      quantity: c.quantity,
      declared_value: (c.metadata as any)?.declared_value ? String((c.metadata as any).declared_value) : "",
      weight_kg: c.weight_kg ? String(c.weight_kg) : "",
      width_cm: c.dimensions?.width_cm ? String(c.dimensions.width_cm) : "",
      height_cm: c.dimensions?.height_cm ? String(c.dimensions.height_cm) : "",
      depth_cm: c.dimensions?.depth_cm ? String(c.dimensions.depth_cm) : "",
      is_fragile: c.is_fragile || false,
      requires_disassembly: c.requires_disassembly || false,
      isExpanded: true,
      isValid: true,
      isTouched: true
    }
  }

  return (
    <div className="space-y-6">
      {/* ... (EnhancedManualTab) */}
      <EnhancedManualTab 
        onAddCandidates={addCandidates} 
        submitButtonText="Thêm vào danh sách bên dưới"
        showSuccessToast={false}
      />

      {/* Candidates list */}
      {candidates.length > 0 && (
        <div className="pt-4 border-t">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-semibold text-lg">Danh sách đã thêm ({candidates.length})</h3>
            <Button variant="destructive" size="sm" onClick={clearCandidates}>
              Xóa tất cả
            </Button>
          </div>
          
          <div className="grid gap-3 max-h-[500px] overflow-y-auto pr-2">
            {candidates.map((candidate) => (
              <Card key={candidate.id} className={editingId === candidate.id ? "border-primary border-2 shadow-md" : "border"}>
                <CardContent className="p-4">
                  {editingId === candidate.id ? (
                    /* Edit mode using FULL ItemForm */
                    <div className="space-y-3">
                        <ItemForm 
                            item={candidateToManualItem(candidate)}
                            onChange={(updates) => {
                                // Convert ManualItem updates back to Partial<ItemCandidate>
                                const convertedUpdates: Partial<ItemCandidate> = {}
                                if (updates.name !== undefined) convertedUpdates.name = updates.name
                                if (updates.quantity !== undefined) convertedUpdates.quantity = updates.quantity
                                if (updates.category !== undefined) convertedUpdates.category_name = updates.category
                                if (updates.size !== undefined) convertedUpdates.size = updates.size as any
                                if (updates.weight_kg !== undefined) convertedUpdates.weight_kg = updates.weight_kg ? parseFloat(updates.weight_kg) : null
                                
                                // Handle dimensions
                                if (updates.width_cm !== undefined || updates.height_cm !== undefined || updates.depth_cm !== undefined) {
                                    convertedUpdates.dimensions = {
                                        width_cm: updates.width_cm ? parseFloat(updates.width_cm) : candidate.dimensions?.width_cm,
                                        height_cm: updates.height_cm ? parseFloat(updates.height_cm) : candidate.dimensions?.height_cm,
                                        depth_cm: updates.depth_cm ? parseFloat(updates.depth_cm) : candidate.dimensions?.depth_cm,
                                    }
                                }
                                
                                if (updates.is_fragile !== undefined) convertedUpdates.is_fragile = updates.is_fragile
                                if (updates.requires_disassembly !== undefined) convertedUpdates.requires_disassembly = updates.requires_disassembly
                                
                                // Handle metadata (brand, model, value)
                                const meta = { ...(candidate.metadata as any || {}) }
                                if (updates.brand !== undefined) meta.brand = updates.brand
                                if (updates.model !== undefined) meta.model = updates.model
                                if (updates.declared_value !== undefined) meta.declared_value = updates.declared_value ? parseFloat(updates.declared_value) : null
                                convertedUpdates.metadata = meta

                                updateCandidate(candidate.id, convertedUpdates)
                            }}
                            isSingleMode={true}
                        />
                        <div className="flex justify-end gap-2 border-t pt-2">
                            <Button variant="ghost" size="sm" onClick={() => toggleEdit(candidate.id)}>
                                Hủy
                            </Button>
                            <Button variant="default" size="sm" onClick={() => toggleEdit(candidate.id)} className="bg-accent-green hover:bg-accent-green-dark">
                                <Check className="h-4 w-4 mr-1" /> Xong
                            </Button>
                        </div>
                    </div>
                  ) : (
                    /* View mode */
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3 flex-1">
                        {candidate.image_url && (
                          <Image
                            src={candidate.image_url || "/placeholder.svg"}
                            alt={candidate.name}
                            width={40}
                            height={40}
                            className="h-10 w-10 rounded object-cover"
                          />
                        )}
                        <div className="flex-1">
                          <div className="font-medium">{candidate.name}</div>
                          <div className="text-sm text-muted-foreground flex items-center gap-2 flex-wrap">
                            <span>SL: {candidate.quantity}</span>
                            {candidate.size && <Badge variant="outline" className="text-xs">{candidate.size}</Badge>}
                            {candidate.is_fragile && <Badge variant="destructive" className="text-xs">Dễ vỡ</Badge>}
                            {candidate.requires_disassembly && <Badge className="text-xs">Cần tháo lắp</Badge>}
                            {(candidate.metadata as any)?.declared_value && (
                              <Badge className="bg-green-100 text-green-800 text-xs">
                                {new Intl.NumberFormat('vi-VN', { 
                                  style: 'currency', 
                                  currency: 'VND',
                                  maximumFractionDigits: 0,
                                  notation: 'compact'
                                }).format((candidate.metadata as any).declared_value)}
                              </Badge>
                            )}
                            {candidate.confidence != null && (
                              <Badge variant={candidate.confidence >= 0.8 ? "default" : candidate.confidence >= 0.5 ? "secondary" : "destructive"} className="text-xs">
                                {Math.round(candidate.confidence * 100)}%
                              </Badge>
                            )}
                          </div>
                        </div>
                      </div>
                      <div className="flex gap-1">
                        <Button variant="ghost" size="sm" onClick={() => toggleEdit(candidate.id)}>
                          <Pencil className="h-4 w-4" />
                        </Button>
                        <Button variant="ghost" size="sm" onClick={() => removeCandidate(candidate.id)}>
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      )}

      {/* Sticky footer - only show if not embedded */}
      {!hideFooter && (
        <div className="sticky bottom-0 bg-background border-t p-4 flex items-center justify-between shadow-lg rounded-t-lg">
          <div className="text-sm text-muted-foreground">
            Đã thu thập <span className="font-bold text-foreground">{candidates.length}</span> mục
          </div>
          <div className="flex gap-2">
            <Button
              onClick={handleSaveToStorage}
              disabled={candidates.length === 0}
              size="lg"
              variant="outline"
            >
              <Save className="h-4 w-4 mr-2" />
              Lưu vào kho
            </Button>
            <Button
              onClick={handleContinue}
              disabled={candidates.length === 0}
              size="lg"
              className="bg-accent-green hover:bg-accent-green-dark"
            >
              Tiếp tục → Xác nhận
            </Button>
          </div>
        </div>
      )}
    </div>
  )
}
