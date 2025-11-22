"use client"

import { useState, useEffect } from "react"
import { useParams, useRouter } from "next/navigation"
import { ArrowLeft, Save, RotateCcw, LayoutDashboard, Truck, Package, Star, DollarSign, FileText } from "lucide-react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import type { z } from "zod"
import { DashboardLayout } from "@/components/dashboard/dashboard-layout"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { PricingCalculator } from "@/components/pricing/pricing-calculator"
import { useVehicle } from "@/hooks/use-vehicles"
import { useToast } from "@/hooks/use-toast"
import { apiClient } from "@/lib/api-client"
import { vehiclePricingSchema } from "@/lib/validation-schemas"
import { formatVND } from "@/lib/format"

const navItems = [
  { label: "Tổng quan", href: "/transport", icon: "LayoutDashboard" },
  { label: "Công việc", href: "/transport/jobs", icon: "Package" },
  { label: "Báo giá", href: "/transport/quotations", icon: "FileText" },
  { label: "Xe", href: "/transport/vehicles", icon: "Truck" },
  { label: "Giá cả", href: "/transport/pricing/categories", icon: "DollarSign" },
  { label: "Hồ sơ", href: "/transport/profile", icon: "Star" },
]

type VehiclePricingFormData = z.infer<typeof vehiclePricingSchema>

export default function VehiclePricingPage() {
  const params = useParams()
  const router = useRouter()
  const vehicleId = Number(params.id)
  const { vehicle, isLoading } = useVehicle(vehicleId)
  const { toast } = useToast()
  const [isSubmitting, setIsSubmitting] = useState(false)

  const {
    register,
    handleSubmit,
    formState: { errors },
    watch,
    reset,
  } = useForm<VehiclePricingFormData>({
    resolver: zodResolver(vehiclePricingSchema),
    defaultValues: {
      vehicleId,
      basePrice: 300000,
      perKmFirst4km: 10000,
      perKm5To40km: 8000,
      perKmAfter40km: 6000,
      peakHourMultiplier: 1.2,
      weekendMultiplier: 1.1,
      holidayMultiplier: 1.3,
      noElevatorFee: 50000,
      elevatorDiscount: 25000,
    },
  })

  const formValues = watch()

  // Load existing pricing if available
  useEffect(() => {
    if (vehicle?.pricing) {
      reset({
        vehicleId,
        basePrice: vehicle.pricing.basePrice,
        perKmFirst4km: vehicle.pricing.perKmFirst4km,
        perKm5To40km: vehicle.pricing.perKm5To40km,
        perKmAfter40km: vehicle.pricing.perKmAfter40km,
        peakHourMultiplier: vehicle.pricing.peakHourMultiplier,
        weekendMultiplier: vehicle.pricing.weekendMultiplier,
        holidayMultiplier: vehicle.pricing.holidayMultiplier,
        noElevatorFee: vehicle.pricing.noElevatorFee,
        elevatorDiscount: vehicle.pricing.elevatorDiscount,
      })
    }
  }, [vehicle, vehicleId, reset])

  const onSubmit = async (data: VehiclePricingFormData) => {
    setIsSubmitting(true)
    try {
      await apiClient.setVehiclePricing(data)
      toast({
        title: "Thành công",
        description: "Đã lưu cấu hình giá",
      })
    } catch (error) {
      toast({
        title: "Lỗi",
        description: error instanceof Error ? error.message : "Không thể lưu cấu hình",
        variant: "destructive",
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleReset = () => {
    if (confirm("Bạn có chắc muốn đặt lại về giá trị mặc định?")) {
      reset({
        vehicleId,
        basePrice: 500000,
        perKmFirst4km: 15000,
        perKm5To40km: 10000,
        perKmAfter40km: 7000,
        peakHourMultiplier: 1.2,
        weekendMultiplier: 1.1,
        holidayMultiplier: 1.3,
        noElevatorFee: 100000,
        elevatorDiscount: 50000,
      })
    }
  }

  if (isLoading) {
    return (
      <DashboardLayout navItems={navItems} title="Cài đặt giá xe">
        <div className="flex items-center justify-center h-96">
          <p className="text-muted-foreground">Đang tải...</p>
        </div>
      </DashboardLayout>
    )
  }

  if (!vehicle) {
    return (
      <DashboardLayout navItems={navItems} title="Cài đặt giá xe">
        <div className="flex flex-col items-center justify-center h-96">
          <p className="text-muted-foreground mb-4">Không tìm thấy xe</p>
          <Button onClick={() => router.push("/transport/vehicles")}>Quay lại danh sách</Button>
        </div>
      </DashboardLayout>
    )
  }


  // NOTE: Pricing is now managed at vehicle-type level (Option A)
  return (
    <DashboardLayout navItems={navItems} title="Cài đặt giá xe">
      <div className="space-y-6">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="sm" onClick={() => router.push("/transport/vehicles")}>
            <ArrowLeft className="mr-2 h-4 w-4" />
            Quay lại
          </Button>
          <div>
            <h1 className="text-3xl font-bold">Giá theo loại xe</h1>
            <p className="text-muted-foreground">
              Từ phiên bản này, giá được cấu hình theo <b>loại xe</b>. Vui lòng sử dụng trang &quot;Giá theo loại xe&quot; để cài đặt.
            </p>
          </div>
        </div>
        <div className="flex gap-3">
          <Button onClick={() => router.push("/transport/pricing/vehicle-types")}>
            <DollarSign className="mr-2 h-4 w-4" />
            Mở trang Giá theo loại xe
          </Button>
        </div>
      </div>
    </DashboardLayout>
  )

  return (
    <DashboardLayout navItems={navItems} title="Cài đặt giá xe">
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="sm" onClick={() => router.push("/transport/vehicles")}>
            <ArrowLeft className="mr-2 h-4 w-4" />
            Quay lại
          </Button>
          <div>
            <h1 className="text-3xl font-bold">
              Cài đặt giá - {vehicle.model} ({vehicle.license_plate})
            </h1>
            <p className="text-muted-foreground">Cấu hình giá cơ bản, giá theo khoảng cách và các hệ số</p>
          </div>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
          <div className="grid gap-6 lg:grid-cols-3">
            {/* Left Column - Pricing Configuration */}
            <div className="lg:col-span-2 space-y-6">
              {/* Base Price */}
              <Card>
                <CardHeader>
                  <CardTitle>Giá cơ bản</CardTitle>
                  <CardDescription>Giá khởi điểm cho loại xe này</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    <Label htmlFor="basePrice">Giá khởi điểm (VND) *</Label>
                    <Input
                      id="basePrice"
                      type="number"
                      step="1000"
                      {...register("basePrice", { valueAsNumber: true })}
                    />
                    {errors.basePrice && <p className="text-sm text-error">{errors.basePrice?.message}</p>}
                    <p className="text-sm text-muted-foreground">
                      Giá hiện tại: {formatVND(formValues.basePrice || 0)}
                    </p>
                  </div>
                </CardContent>
              </Card>

              {/* Distance Pricing */}
              <Card>
                <CardHeader>
                  <CardTitle>Giá theo khoảng cách</CardTitle>
                  <CardDescription>Giá theo từng khoảng cách (VND/km)</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="perKmFirst4km">4km đầu tiên (VND/km) *</Label>
                    <Input
                      id="perKmFirst4km"
                      type="number"
                      step="1000"
                      {...register("perKmFirst4km", { valueAsNumber: true })}
                    />
                    {errors.perKmFirst4km && <p className="text-sm text-error">{errors.perKmFirst4km?.message}</p>}
                    <p className="text-sm text-muted-foreground">{formatVND(formValues.perKmFirst4km || 0)}/km</p>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="perKm5To40km">Từ 5-40km (VND/km) *</Label>
                    <Input
                      id="perKm5To40km"
                      type="number"
                      step="1000"
                      {...register("perKm5To40km", { valueAsNumber: true })}
                    />
                    {errors.perKm5To40km && <p className="text-sm text-error">{errors.perKm5To40km?.message}</p>}
                    <p className="text-sm text-muted-foreground">{formatVND(formValues.perKm5To40km || 0)}/km</p>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="perKmAfter40km">Sau 40km (VND/km) *</Label>
                    <Input
                      id="perKmAfter40km"
                      type="number"
                      step="1000"
                      {...register("perKmAfter40km", { valueAsNumber: true })}
                    />
                    {errors.perKmAfter40km && <p className="text-sm text-error">{errors.perKmAfter40km?.message}</p>}
                    <p className="text-sm text-muted-foreground">{formatVND(formValues.perKmAfter40km || 0)}/km</p>
                  </div>
                </CardContent>
              </Card>

              {/* Multipliers */}
              <Card>
                <CardHeader>
                  <CardTitle>Hệ số giờ cao điểm</CardTitle>
                  <CardDescription>Hệ số nhân cho các khung giờ đặc biệt</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="peakHourMultiplier">Giờ cao điểm (7-9h, 17-19h) *</Label>
                    <Input
                      id="peakHourMultiplier"
                      type="number"
                      step="0.1"
                      {...register("peakHourMultiplier", { valueAsNumber: true })}
                    />
                    {errors.peakHourMultiplier && (
                      <p className="text-sm text-error">{errors.peakHourMultiplier?.message}</p>
                    )}
                    <p className="text-sm text-muted-foreground">
                      ×{formValues.peakHourMultiplier || 1} ({((formValues.peakHourMultiplier || 1) * 100).toFixed(0)}
                      %)
                    </p>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="weekendMultiplier">Cuối tuần *</Label>
                    <Input
                      id="weekendMultiplier"
                      type="number"
                      step="0.1"
                      {...register("weekendMultiplier", { valueAsNumber: true })}
                    />
                    {errors.weekendMultiplier && (
                      <p className="text-sm text-error">{errors.weekendMultiplier?.message}</p>
                    )}
                    <p className="text-sm text-muted-foreground">
                      ×{formValues.weekendMultiplier || 1} ({((formValues.weekendMultiplier || 1) * 100).toFixed(0)}%)
                    </p>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="holidayMultiplier">Ngày lễ *</Label>
                    <Input
                      id="holidayMultiplier"
                      type="number"
                      step="0.1"
                      {...register("holidayMultiplier", { valueAsNumber: true })}
                    />
                    {errors.holidayMultiplier && (
                      <p className="text-sm text-error">{errors.holidayMultiplier?.message}</p>
                    )}
                    <p className="text-sm text-muted-foreground">
                      ×{formValues.holidayMultiplier || 1} ({((formValues.holidayMultiplier || 1) * 100).toFixed(0)}%)
                    </p>
                  </div>
                </CardContent>
              </Card>

              {/* Floor Fees */}
              <Card>
                <CardHeader>
                  <CardTitle>Phụ phí theo tầng</CardTitle>
                  <CardDescription>Phí bổ sung dựa trên tầng và thang máy</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="noElevatorFee">Không thang máy (tầng &gt; 3) *</Label>
                    <Input
                      id="noElevatorFee"
                      type="number"
                      step="1000"
                      {...register("noElevatorFee", { valueAsNumber: true })}
                    />
                    {errors.noElevatorFee && <p className="text-sm text-error">{errors.noElevatorFee?.message}</p>}
                    <p className="text-sm text-muted-foreground">+{formatVND(formValues.noElevatorFee || 0)}</p>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="elevatorDiscount">Giảm giá có thang máy *</Label>
                    <Input
                      id="elevatorDiscount"
                      type="number"
                      step="1000"
                      {...register("elevatorDiscount", { valueAsNumber: true })}
                    />
                    {errors.elevatorDiscount && <p className="text-sm text-error">{errors.elevatorDiscount?.message}</p>}
                    <p className="text-sm text-muted-foreground">-{formatVND(formValues.elevatorDiscount || 0)}</p>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Right Column - Calculator Preview */}
            <div className="lg:col-span-1">
              <div className="sticky top-6">
                <PricingCalculator
                  pricing={{
                    base_price: formValues.basePrice,
                    per_km_first_4km: formValues.perKmFirst4km,
                    per_km_5_to_40km: formValues.perKm5To40km,
                    per_km_after_40km: formValues.perKmAfter40km,
                    peak_hour_multiplier: formValues.peakHourMultiplier,
                    weekend_multiplier: formValues.weekendMultiplier,
                    holiday_multiplier: formValues.holidayMultiplier,
                    no_elevator_fee: formValues.noElevatorFee,
                    elevator_discount: formValues.elevatorDiscount,
                  }}
                  distance={8.5}
                />
              </div>
            </div>
          </div>

          {/* Actions */}
          <div className="flex justify-end gap-3">
            <Button type="button" variant="outline" onClick={handleReset} disabled={isSubmitting}>
              <RotateCcw className="mr-2 h-4 w-4" />
              Đặt lại mặc định
            </Button>
            <Button type="submit" disabled={isSubmitting}>
              <Save className="mr-2 h-4 w-4" />
              {isSubmitting ? "Đang lưu..." : "Lưu cấu hình"}
            </Button>
          </div>
        </form>
      </div>
    </DashboardLayout>
  )
}
