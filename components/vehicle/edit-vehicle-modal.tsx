"use client"

import { useState, useEffect } from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import type { z } from "zod"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Checkbox } from "@/components/ui/checkbox"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { useToast } from "@/hooks/use-toast"
import { apiClient } from "@/lib/api-client"
import { vehicleSchema } from "@/lib/validation-schemas"
import { vehicleTypeLabels } from "@/lib/vehicle-utils"
import type { Vehicle } from "@/types"

type VehicleFormData = z.infer<typeof vehicleSchema>

interface EditVehicleModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  vehicle: Vehicle
  onSuccess: () => void
}

export function EditVehicleModal({ open, onOpenChange, vehicle, onSuccess }: EditVehicleModalProps) {
  const [isSubmitting, setIsSubmitting] = useState(false)
  const { toast } = useToast()

  const {
    register,
    handleSubmit,
    formState: { errors },
    watch,
    setValue,
    reset,
  } = useForm<VehicleFormData>({
    resolver: zodResolver(vehicleSchema) as any,
  })

  // Reset form when vehicle changes
  useEffect(() => {
    if (vehicle) {
      reset({
        type: vehicle.type,
        model: vehicle.model,
        licensePlate: vehicle.license_plate,
        capacityKg: vehicle.capacity_kg,
        capacityM3: vehicle.capacity_m3 || undefined,
        year: vehicle.year || undefined,
        color: vehicle.color || undefined,
        hasTailLift: vehicle.has_tail_lift,
        hasTools: vehicle.has_tools,
        description: vehicle.description || undefined,
        imageUrl: vehicle.image_url || undefined,
      })
    }
  }, [vehicle, reset])

  const vehicleType = watch("type")
  const hasTailLift = watch("hasTailLift")
  const hasTools = watch("hasTools")

  const onSubmit = async (data: VehicleFormData) => {
    setIsSubmitting(true)
    try {
      await apiClient.updateVehicle(vehicle.vehicle_id, {
        type: data.type,
        model: data.model,
        licensePlate: data.licensePlate,
        capacityKg: data.capacityKg,
        capacityM3: data.capacityM3 || undefined,
        year: data.year || undefined,
        color: data.color || undefined,
        hasTailLift: data.hasTailLift,
        hasTools: data.hasTools,
        description: data.description || undefined,
        imageUrl: data.imageUrl || undefined,
      })

      toast({
        title: "Thành công",
        description: "Đã cập nhật thông tin xe",
      })

      onSuccess()
      onOpenChange(false)
    } catch (error) {
      toast({
        title: "Lỗi",
        description: error instanceof Error ? error.message : "Không thể cập nhật xe",
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
          <DialogTitle>Chỉnh sửa thông tin xe</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
          {/* Vehicle Type */}
          <div className="space-y-3">
            <Label>Loại xe *</Label>
            <RadioGroup value={vehicleType} onValueChange={(value) => setValue("type", value as any)}>
              <div className="grid grid-cols-2 gap-3">
                {Object.entries(vehicleTypeLabels).map(([value, label]) => (
                  <div key={value} className="flex items-center space-x-2">
                    <RadioGroupItem value={value} id={`edit-${value}`} />
                    <Label htmlFor={`edit-${value}`} className="font-normal cursor-pointer">
                      {label}
                    </Label>
                  </div>
                ))}
              </div>
            </RadioGroup>
            {errors.type && <p className="text-sm text-error">{errors.type.message}</p>}
          </div>

          {/* Basic Info */}
          <div className="space-y-4">
            <h3 className="font-medium">Thông tin cơ bản</h3>
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="edit-model">Model *</Label>
                <Input id="edit-model" placeholder="Toyota Hiace" {...register("model")} />
                {errors.model && <p className="text-sm text-error">{errors.model.message}</p>}
              </div>
              <div className="space-y-2">
                <Label htmlFor="edit-licensePlate">Biển số *</Label>
                <Input id="edit-licensePlate" placeholder="51F-12345" {...register("licensePlate")} />
                {errors.licensePlate && <p className="text-sm text-error">{errors.licensePlate.message}</p>}
              </div>
            </div>
          </div>

          {/* Capacity */}
          <div className="space-y-4">
            <h3 className="font-medium">Tải trọng</h3>
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="edit-capacityKg">Trọng lượng (kg) *</Label>
                <Input
                  id="edit-capacityKg"
                  type="number"
                  placeholder="1500"
                  {...register("capacityKg", { valueAsNumber: true })}
                />
                {errors.capacityKg && <p className="text-sm text-error">{errors.capacityKg.message}</p>}
              </div>
              <div className="space-y-2">
                <Label htmlFor="edit-capacityM3">Thể tích (m³)</Label>
                <Input
                  id="edit-capacityM3"
                  type="number"
                  step="0.1"
                  placeholder="10"
                  {...register("capacityM3", { valueAsNumber: true })}
                />
                {errors.capacityM3 && <p className="text-sm text-error">{errors.capacityM3.message}</p>}
              </div>
            </div>
          </div>

          {/* Additional Info */}
          <div className="space-y-4">
            <h3 className="font-medium">Thông tin bổ sung</h3>
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="edit-year">Năm sản xuất</Label>
                <Input id="edit-year" type="number" placeholder="2022" {...register("year", { valueAsNumber: true })} />
                {errors.year && <p className="text-sm text-error">{errors.year.message}</p>}
              </div>
              <div className="space-y-2">
                <Label htmlFor="edit-color">Màu sắc</Label>
                <Input id="edit-color" placeholder="Trắng" {...register("color")} />
                {errors.color && <p className="text-sm text-error">{errors.color.message}</p>}
              </div>
            </div>
          </div>

          {/* Features */}
          <div className="space-y-3">
            <h3 className="font-medium">Tính năng</h3>
            <div className="space-y-3">
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="edit-hasTools"
                  checked={hasTools}
                  onCheckedChange={(checked) => setValue("hasTools", checked as boolean)}
                />
                <Label htmlFor="edit-hasTools" className="font-normal cursor-pointer">
                  Có dụng cụ tháo lắp
                </Label>
              </div>
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="edit-hasTailLift"
                  checked={hasTailLift}
                  onCheckedChange={(checked) => setValue("hasTailLift", checked as boolean)}
                />
                <Label htmlFor="edit-hasTailLift" className="font-normal cursor-pointer">
                  Có thang nâng
                </Label>
              </div>
            </div>
          </div>

          {/* Description */}
          <div className="space-y-2">
            <Label htmlFor="edit-description">Mô tả</Label>
            <Textarea id="edit-description" placeholder="Xe mới, sạch sẽ..." rows={3} {...register("description")} />
            {errors.description && <p className="text-sm text-error">{errors.description.message}</p>}
          </div>

          {/* Image URL */}
          <div className="space-y-2">
            <Label htmlFor="edit-imageUrl">URL ảnh xe</Label>
            <Input id="edit-imageUrl" type="url" placeholder="https://..." {...register("imageUrl")} />
            {errors.imageUrl && <p className="text-sm text-error">{errors.imageUrl.message}</p>}
          </div>

          {/* Actions */}
          <div className="flex justify-end gap-3">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)} disabled={isSubmitting}>
              Hủy
            </Button>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? "Đang lưu..." : "Lưu thay đổi"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}

export default EditVehicleModal
