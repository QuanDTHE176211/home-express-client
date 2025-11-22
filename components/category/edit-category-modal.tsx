"use client"

import { useState, useEffect } from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Checkbox } from "@/components/ui/checkbox"
import { useToast } from "@/hooks/use-toast"
import { apiClient } from "@/lib/api-client"
import { categorySchema } from "@/lib/validation-schemas"
import type { CategoryWithSizes } from "@/types"

interface CategoryFormData {
  name: string
  nameEn?: string
  description?: string
  icon?: string
  defaultWeightKg?: number | null
  defaultVolumeM3?: number | null
  defaultLengthCm?: number | null
  defaultWidthCm?: number | null
  defaultHeightCm?: number | null
  isFragileDefault: boolean
  requiresDisassemblyDefault: boolean
  displayOrder: number
  isActive: boolean
}

interface EditCategoryModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onSuccess: () => void
  category: CategoryWithSizes | null
}

export function EditCategoryModal({ open, onOpenChange, onSuccess, category }: EditCategoryModalProps) {
  const [isSubmitting, setIsSubmitting] = useState(false)
  const { toast } = useToast()

  const {
    register,
    handleSubmit,
    formState: { errors },
    watch,
    setValue,
    reset,
  } = useForm<CategoryFormData>({
    resolver: zodResolver(categorySchema) as any,
    defaultValues: {
      isFragileDefault: false,
      requiresDisassemblyDefault: false,
      displayOrder: 0,
      isActive: true,
    },
  })

  const isFragileDefault = watch("isFragileDefault")
  const requiresDisassemblyDefault = watch("requiresDisassemblyDefault")
  const isActive = watch("isActive")

  useEffect(() => {
    if (category) {
      reset({
        name: category.name,
        nameEn: category.name_en || "",
        description: category.description || "",
        icon: category.icon || "",
        defaultWeightKg: category.default_weight_kg || null,
        defaultVolumeM3: category.default_volume_m3 || null,
        defaultLengthCm: category.default_length_cm || null,
        defaultWidthCm: category.default_width_cm || null,
        defaultHeightCm: category.default_height_cm || null,
        isFragileDefault: category.is_fragile_default || false,
        requiresDisassemblyDefault: category.requires_disassembly_default || false,
        displayOrder: category.display_order || 0,
        isActive: category.is_active,
      })
    }
  }, [category, reset])

  const onSubmit = async (data: CategoryFormData) => {
    if (!category) return

    setIsSubmitting(true)
    try {
      await apiClient.updateCategory(category.category_id, {
        name: data.name,
        nameEn: data.nameEn,
        description: data.description,
        icon: data.icon,
        defaultWeightKg: data.defaultWeightKg || undefined,
        defaultVolumeM3: data.defaultVolumeM3 || undefined,
        defaultLengthCm: data.defaultLengthCm || undefined,
        defaultWidthCm: data.defaultWidthCm || undefined,
        defaultHeightCm: data.defaultHeightCm || undefined,
        isFragileDefault: data.isFragileDefault,
        requiresDisassemblyDefault: data.requiresDisassemblyDefault,
        displayOrder: data.displayOrder,
        isActive: data.isActive,
      })

      toast({
        title: "Thành công",
        description: "Đã cập nhật danh mục",
      })

      onSuccess()
      onOpenChange(false)
    } catch (error) {
      toast({
        title: "Lỗi",
        description: error instanceof Error ? error.message : "Không thể cập nhật danh mục",
        variant: "destructive",
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle>Chỉnh sửa danh mục</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
          <div className="space-y-4">
            <h3 className="font-medium">Thông tin cơ bản</h3>
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="name">Tên (VN) *</Label>
                <Input id="name" placeholder="Tủ lạnh" {...register("name")} />
                {errors.name && <p className="text-sm text-error">{errors.name.message}</p>}
              </div>
              <div className="space-y-2">
                <Label htmlFor="nameEn">Tên (EN)</Label>
                <Input id="nameEn" placeholder="Refrigerator" {...register("nameEn")} />
                {errors.nameEn && <p className="text-sm text-error">{errors.nameEn.message}</p>}
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">Mô tả</Label>
              <Textarea id="description" placeholder="Tủ lạnh các loại" rows={2} {...register("description")} />
              {errors.description && <p className="text-sm text-error">{errors.description.message}</p>}
            </div>

            <div className="space-y-2">
              <Label htmlFor="icon">Icon (emoji hoặc URL)</Label>
              <Input id="icon" placeholder="🧊" {...register("icon")} />
              {errors.icon && <p className="text-sm text-error">{errors.icon.message}</p>}
            </div>
          </div>

          <div className="space-y-4">
            <h3 className="font-medium">Thông số mặc định</h3>
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="defaultWeightKg">Trọng lượng (kg)</Label>
                <Input
                  id="defaultWeightKg"
                  type="number"
                  placeholder="80"
                  {...register("defaultWeightKg", { valueAsNumber: true })}
                />
                {errors.defaultWeightKg && <p className="text-sm text-error">{errors.defaultWeightKg.message}</p>}
              </div>
              <div className="space-y-2">
                <Label htmlFor="defaultVolumeM3">Thể tích (m³)</Label>
                <Input
                  id="defaultVolumeM3"
                  type="number"
                  step="0.1"
                  placeholder="0.5"
                  {...register("defaultVolumeM3", { valueAsNumber: true })}
                />
                {errors.defaultVolumeM3 && <p className="text-sm text-error">{errors.defaultVolumeM3.message}</p>}
              </div>
            </div>

            <div className="space-y-2">
              <Label>Kích thước (cm)</Label>
              <div className="grid gap-4 sm:grid-cols-3">
                <div className="space-y-2">
                  <Input
                    id="defaultLengthCm"
                    type="number"
                    placeholder="Dài"
                    {...register("defaultLengthCm", { valueAsNumber: true })}
                  />
                  {errors.defaultLengthCm && <p className="text-sm text-error">{errors.defaultLengthCm.message}</p>}
                </div>
                <div className="space-y-2">
                  <Input
                    id="defaultWidthCm"
                    type="number"
                    placeholder="Rộng"
                    {...register("defaultWidthCm", { valueAsNumber: true })}
                  />
                  {errors.defaultWidthCm && <p className="text-sm text-error">{errors.defaultWidthCm.message}</p>}
                </div>
                <div className="space-y-2">
                  <Input
                    id="defaultHeightCm"
                    type="number"
                    placeholder="Cao"
                    {...register("defaultHeightCm", { valueAsNumber: true })}
                  />
                  {errors.defaultHeightCm && <p className="text-sm text-error">{errors.defaultHeightCm.message}</p>}
                </div>
              </div>
            </div>
          </div>

          <div className="space-y-3">
            <h3 className="font-medium">Đặc tính mặc định</h3>
            <div className="space-y-3">
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="isFragileDefault"
                  checked={isFragileDefault}
                  onCheckedChange={(checked) => setValue("isFragileDefault", checked as boolean)}
                />
                <Label htmlFor="isFragileDefault" className="font-normal cursor-pointer">
                  Dễ vỡ (fragile)
                </Label>
              </div>
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="requiresDisassemblyDefault"
                  checked={requiresDisassemblyDefault}
                  onCheckedChange={(checked) => setValue("requiresDisassemblyDefault", checked as boolean)}
                />
                <Label htmlFor="requiresDisassemblyDefault" className="font-normal cursor-pointer">
                  Cần tháo lắp (disassembly)
                </Label>
              </div>
            </div>
          </div>

          <div className="space-y-4">
            <h3 className="font-medium">Hiển thị</h3>
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="displayOrder">Thứ tự</Label>
                <Input
                  id="displayOrder"
                  type="number"
                  placeholder="0"
                  {...register("displayOrder", { valueAsNumber: true })}
                />
                {errors.displayOrder && <p className="text-sm text-error">{errors.displayOrder.message}</p>}
              </div>
              <div className="flex items-center space-x-2 pt-8">
                <Checkbox
                  id="isActive"
                  checked={isActive}
                  onCheckedChange={(checked) => setValue("isActive", checked as boolean)}
                />
                <Label htmlFor="isActive" className="font-normal cursor-pointer">
                  Kích hoạt
                </Label>
              </div>
            </div>
          </div>

          <div className="flex justify-end gap-3">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)} disabled={isSubmitting}>
              Hủy
            </Button>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? "Đang cập nhật..." : "Cập nhật"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}

export default EditCategoryModal
