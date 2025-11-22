"use client"

import { useState } from "react"
import { useAuth } from "@/contexts/auth-context"
import { useVehiclePricing } from "@/hooks/use-vehicles"
import { apiClient } from "@/lib/api-client"
import { useToast } from "@/hooks/use-toast"
import { DashboardLayout } from "@/components/dashboard/dashboard-layout"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Separator } from "@/components/ui/separator"
import { formatVND } from "@/lib/format"
import { Save, LayoutDashboard, Package, FileText, Truck, DollarSign, Star } from "lucide-react"

const navItems = [
  { label: "Tổng quan", href: "/transport", icon: "LayoutDashboard" },
  { label: "Công việc", href: "/transport/jobs", icon: "Package" },
  { label: "Báo giá", href: "/transport/quotations", icon: "FileText" },
  { label: "Xe", href: "/transport/vehicles", icon: "Truck" },
  { label: "Giá cả (Loại đồ)", href: "/transport/pricing/categories", icon: "DollarSign" },
  { label: "Giá cước (Rate Card)", href: "/transport/pricing/rates", icon: "DollarSign" },
  { label: "Giá cước xe (Vehicle Rates)", href: "/transport/pricing/vehicles", icon: "DollarSign" },
  { label: "Hồ sơ", href: "/transport/profile", icon: "Star" },
]

const VEHICLE_TYPES = [
  { value: "motorcycle", label: "Xe máy" },
  { value: "van", label: "Xe Van" },
  { value: "truck_small", label: "Xe tải nhỏ (1-2 tấn)" },
  { value: "truck_large", label: "Xe tải lớn (> 3 tấn)" },
  { value: "other", label: "Khác" }
]

export default function VehiclePricingPage() {
  const { user } = useAuth()
  const { pricingRules, isLoading, mutate } = useVehiclePricing(user?.user_id)
  const { toast } = useToast()
  const [saving, setSaving] = useState<Record<string, boolean>>({})
  
  // Local state for form data, keyed by vehicleType
  const [pricingData, setPricingData] = useState<Record<string, any>>({})

  const handleInputChange = (vehicleType: string, field: string, value: number) => {
    setPricingData(prev => ({
      ...prev,
      [vehicleType]: {
        ...getInitialData(vehicleType),
        ...prev[vehicleType],
        [field]: value
      }
    }))
  }

  const getExistingPricing = (type: string) => {
    return pricingRules.find((p: any) => p.vehicleType === type)
  }

  const getInitialData = (type: string) => {
    const existing = getExistingPricing(type)
    if (existing) return existing
    
    // Defaults
    if (pricingData[type]) return pricingData[type]
    
    return {
      basePriceVnd: 0,
      perKmFirst4KmVnd: 0,
      perKm5To40KmVnd: 0,
      perKmAfter40KmVnd: 0,
      minChargeVnd: 0,
      elevatorBonusVnd: 0,
      noElevatorFeePerFloorVnd: 0,
      noElevatorFloorThreshold: 3,
      peakHourMultiplier: 1.0,
      weekendMultiplier: 1.0
    }
  }

  const handleSave = async (type: string) => {
    if (!user?.user_id) return

    const data = pricingData[type] || getExistingPricing(type)
    if (!data) return

    setSaving(prev => ({ ...prev, [type]: true }))
    try {
      await apiClient.setVehiclePricing({
        transportId: user.user_id,
        vehicleType: type,
        basePriceVnd: Number(data.basePriceVnd),
        perKmFirst4KmVnd: Number(data.perKmFirst4KmVnd),
        perKm5To40KmVnd: Number(data.perKm5To40KmVnd),
        perKmAfter40KmVnd: Number(data.perKmAfter40KmVnd),
        minChargeVnd: Number(data.minChargeVnd),
        elevatorBonusVnd: Number(data.elevatorBonusVnd || 0),
        noElevatorFeePerFloorVnd: Number(data.noElevatorFeePerFloorVnd || 0),
        noElevatorFloorThreshold: Number(data.noElevatorFloorThreshold || 3),
        peakHourMultiplier: Number(data.peakHourMultiplier || 1),
        weekendMultiplier: Number(data.weekendMultiplier || 1),
        validFrom: new Date().toISOString()
      })
      
      toast({ title: "Thành công", description: "Đã lưu cấu hình giá xe" })
      mutate()
    } catch (error: any) {
      toast({ title: "Lỗi", description: error.message, variant: "destructive" })
    } finally {
      setSaving(prev => ({ ...prev, [type]: false }))
    }
  }

  if (isLoading) {
    return (
      <DashboardLayout navItems={navItems} title="Cài đặt giá cước xe">
        <div className="flex items-center justify-center h-96">
          <p className="text-muted-foreground">Đang tải...</p>
        </div>
      </DashboardLayout>
    )
  }

  return (
    <DashboardLayout navItems={navItems} title="Cài đặt giá cước xe">
      <div className="max-w-7xl mx-auto px-6 py-10 space-y-6">
        <div>
          <h1 className="text-3xl font-bold">Cài đặt giá cước theo loại xe</h1>
          <p className="text-muted-foreground">Cấu hình chi tiết giá mở cửa, giá km theo bậc thang cho từng loại xe</p>
        </div>

        <div className="grid gap-6">
          {VEHICLE_TYPES.map((type) => {
            const currentData = pricingData[type.value] || getInitialData(type.value)
            const isSaving = saving[type.value]

            return (
              <Card key={type.value}>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <Truck className="h-6 w-6 text-primary" />
                      <div>
                        <CardTitle>{type.label}</CardTitle>
                        <CardDescription>Cấu hình giá cho {type.label}</CardDescription>
                      </div>
                    </div>
                    <Button onClick={() => handleSave(type.value)} disabled={isSaving}>
                      <Save className="mr-2 h-4 w-4" />
                      {isSaving ? "Đang lưu..." : "Lưu cấu hình"}
                    </Button>
                  </div>
                </CardHeader>
                <CardContent className="space-y-6">
                  {/* Basic Rates */}
                  <div className="grid gap-4 md:grid-cols-3">
                    <div className="space-y-2">
                      <Label>Giá mở cửa (Base)</Label>
                      <Input 
                        type="number" 
                        value={currentData.basePriceVnd} 
                        onChange={e => handleInputChange(type.value, 'basePriceVnd', Number(e.target.value))}
                      />
                      <p className="text-xs text-muted-foreground">{formatVND(currentData.basePriceVnd)}</p>
                    </div>
                    <div className="space-y-2">
                      <Label>Cước tối thiểu</Label>
                      <Input 
                        type="number" 
                        value={currentData.minChargeVnd}
                        onChange={e => handleInputChange(type.value, 'minChargeVnd', Number(e.target.value))}
                      />
                      <p className="text-xs text-muted-foreground">{formatVND(currentData.minChargeVnd)}</p>
                    </div>
                  </div>

                  <Separator />

                  {/* Tiered KM Rates */}
                  <div>
                    <h4 className="font-medium mb-3">Giá cước theo Km (Tiered Pricing)</h4>
                    <div className="grid gap-4 md:grid-cols-3">
                      <div className="space-y-2">
                        <Label>0 - 4 km đầu</Label>
                        <Input 
                          type="number" 
                          value={currentData.perKmFirst4KmVnd}
                          onChange={e => handleInputChange(type.value, 'perKmFirst4KmVnd', Number(e.target.value))}
                        />
                        <p className="text-xs text-muted-foreground">{formatVND(currentData.perKmFirst4KmVnd)}/km</p>
                      </div>
                      <div className="space-y-2">
                        <Label>Km thứ 5 - 40</Label>
                        <Input 
                          type="number" 
                          value={currentData.perKm5To40KmVnd}
                          onChange={e => handleInputChange(type.value, 'perKm5To40KmVnd', Number(e.target.value))}
                        />
                        <p className="text-xs text-muted-foreground">{formatVND(currentData.perKm5To40KmVnd)}/km</p>
                      </div>
                      <div className="space-y-2">
                        <Label>Km thứ 41 trở đi</Label>
                        <Input 
                          type="number" 
                          value={currentData.perKmAfter40KmVnd}
                          onChange={e => handleInputChange(type.value, 'perKmAfter40KmVnd', Number(e.target.value))}
                        />
                        <p className="text-xs text-muted-foreground">{formatVND(currentData.perKmAfter40KmVnd)}/km</p>
                      </div>
                    </div>
                  </div>

                  <Separator />

                  {/* Additional Fees */}
                  <div>
                    <h4 className="font-medium mb-3">Phụ phí & Hệ số</h4>
                    <div className="grid gap-4 md:grid-cols-4">
                      <div className="space-y-2">
                        <Label>Phí thang bộ (VND/tầng)</Label>
                        <Input 
                          type="number" 
                          value={currentData.noElevatorFeePerFloorVnd}
                          onChange={e => handleInputChange(type.value, 'noElevatorFeePerFloorVnd', Number(e.target.value))}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label>Tầng miễn phí</Label>
                        <Input 
                          type="number" 
                          value={currentData.noElevatorFloorThreshold}
                          onChange={e => handleInputChange(type.value, 'noElevatorFloorThreshold', Number(e.target.value))}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label>Hệ số giờ cao điểm</Label>
                        <Input 
                          type="number" step="0.1"
                          value={currentData.peakHourMultiplier}
                          onChange={e => handleInputChange(type.value, 'peakHourMultiplier', Number(e.target.value))}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label>Hệ số cuối tuần</Label>
                        <Input 
                          type="number" step="0.1"
                          value={currentData.weekendMultiplier}
                          onChange={e => handleInputChange(type.value, 'weekendMultiplier', Number(e.target.value))}
                        />
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )
          })}
        </div>
      </div>
    </DashboardLayout>
  )
}
