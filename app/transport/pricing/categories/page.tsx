"use client"

import { useState } from "react"
import { Save, LayoutDashboard, Truck, Package, Star, DollarSign, FileText } from "lucide-react"
import { DashboardLayout } from "@/components/dashboard/dashboard-layout"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Separator } from "@/components/ui/separator"
import { useCategories } from "@/hooks/use-categories"
import { useCategoryPricing } from "@/hooks/use-vehicles"
import { useToast } from "@/hooks/use-toast"
import { apiClient } from "@/lib/api-client"
import { formatVND } from "@/lib/format"
import { useAuth } from "@/contexts/auth-context"

const navItems = [
  { label: "Tổng quan", href: "/transport", icon: "LayoutDashboard" },
  { label: "Công việc", href: "/transport/jobs", icon: "Package" },
  { label: "Báo giá", href: "/transport/quotations", icon: "FileText" },
  { label: "Xe", href: "/transport/vehicles", icon: "Truck" },
  { label: "Giá cả", href: "/transport/pricing/categories", icon: "DollarSign" },
  { label: "Hồ sơ", href: "/transport/profile", icon: "Star" },
]

export default function CategoryPricingPage() {
  const { user } = useAuth()
  const { categories, isLoading: categoriesLoading } = useCategories({ isActive: true })
  const { pricingRules, isLoading: pricingLoading, mutate } = useCategoryPricing(user?.user_id)
  const { toast } = useToast()
  const [savingIds, setSavingIds] = useState<Set<number>>(new Set())

  const [pricingData, setPricingData] = useState<Record<number, any>>({})

  const handlePriceChange = (categoryId: number, field: string, value: number) => {
    setPricingData((prev) => ({
      ...prev,
      [categoryId]: {
        ...prev[categoryId],
        [field]: value,
      },
    }))
  }

  const handleSave = async (categoryId: number, categoryName: string) => {
    const data = pricingData[categoryId]
    if (!data?.pricePerUnit) {
      toast({
        title: "Lỗi",
        description: "Vui lòng nhập giá cho danh mục này",
        variant: "destructive",
      })
      return
    }

    if (!user?.user_id) {
      toast({
        title: "Lỗi",
        description: "Không tìm thấy thông tin tài khoản vận chuyển",
        variant: "destructive",
      })
      return
    }

    setSavingIds((prev) => new Set(prev).add(categoryId))
    try {
      await apiClient.setCategoryPricing({
        transportId: user.user_id,
        categoryId,
        pricePerUnitVnd: data.pricePerUnit,
        fragileMultiplier: data.fragileMultiplier || 1.2,
        disassemblyMultiplier: data.disassemblyMultiplier || 1.3,
        heavyMultiplier: data.heavyMultiplier || 1.5,
        heavyThresholdKg: 100,
        validFrom: new Date().toISOString(),
      })

      toast({
        title: "Thành công",
        description: `Đã lưu giá cho ${categoryName}`,
      })

      mutate()
    } catch (error) {
      toast({
        title: "Lỗi",
        description: error instanceof Error ? error.message : "Không thể lưu giá",
        variant: "destructive",
      })
    } finally {
      setSavingIds((prev) => {
        const newSet = new Set(prev)
        newSet.delete(categoryId)
        return newSet
      })
    }
  }

  const getExistingPricing = (categoryId: number) => {
    return pricingRules.find((p: any) => p.categoryId === categoryId)
  }

  if (categoriesLoading || pricingLoading) {
    return (
      <DashboardLayout navItems={navItems} title="Cài đặt giá theo loại đồ">
        <div className="flex items-center justify-center h-96">
          <p className="text-muted-foreground">Đang tải...</p>
        </div>
      </DashboardLayout>
    )
  }

  return (
    <DashboardLayout navItems={navItems} title="Cài đặt giá theo loại đồ">
      <div className="max-w-7xl mx-auto px-6 py-10 space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-3xl font-bold">Cài đặt giá theo loại đồ</h1>
          <p className="text-muted-foreground">Cấu hình giá và hệ số cho từng loại đồ đạc</p>
        </div>

        {/* Categories List */}
        <div className="space-y-4">
          {categories.map((category: any) => {
            const existingPricing = getExistingPricing(category.category_id)
            const currentData = pricingData[category.category_id] || existingPricing || {}
            const isSaving = savingIds.has(category.category_id)

            return (
              <Card key={category.category_id} className="hover:shadow-md transition-shadow">
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      {category.icon && <span className="text-2xl">{category.icon}</span>}
                      <div>
                        <CardTitle>{category.name}</CardTitle>
                        <CardDescription>
                          Mặc định: {category.default_weight_kg}kg, {category.default_volume_m3}m³
                        </CardDescription>
                      </div>
                    </div>
                    <Button
                      size="sm"
                      onClick={() => handleSave(category.category_id, category.name)}
                      disabled={isSaving}
                    >
                      <Save className="mr-2 h-4 w-4" />
                      {isSaving ? "Đang lưu..." : "Lưu"}
                    </Button>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid gap-4 md:grid-cols-2">
                    <div className="space-y-2">
                      <Label htmlFor={`price-${category.category_id}`}>Giá của bạn (VND) *</Label>
                      <Input
                        id={`price-${category.category_id}`}
                        type="number"
                        step="1000"
                        placeholder="80000"
                        value={currentData.pricePerUnit || ""}
                        onChange={(e) =>
                          handlePriceChange(category.category_id, "pricePerUnit", Number(e.target.value))
                        }
                      />
                      {currentData.pricePerUnit && (
                        <p className="text-sm text-muted-foreground">{formatVND(currentData.pricePerUnit)}</p>
                      )}
                    </div>
                  </div>

                  <Separator />

                  <div>
                    <h4 className="font-medium mb-3">Hệ số điều chỉnh:</h4>
                    <div className="grid gap-4 md:grid-cols-3">
                      <div className="space-y-2">
                        <Label htmlFor={`fragile-${category.category_id}`}>Dễ vỡ</Label>
                        <Input
                          id={`fragile-${category.category_id}`}
                          type="number"
                          step="0.1"
                          placeholder="1.2"
                          value={currentData.fragileMultiplier || ""}
                          onChange={(e) =>
                            handlePriceChange(category.category_id, "fragileMultiplier", Number(e.target.value))
                          }
                        />
                        <p className="text-sm text-muted-foreground">
                          ×{currentData.fragileMultiplier || 1.2} (
                          {((currentData.fragileMultiplier || 1.2) * 100).toFixed(0)}%)
                        </p>
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor={`disassembly-${category.category_id}`}>Tháo lắp</Label>
                        <Input
                          id={`disassembly-${category.category_id}`}
                          type="number"
                          step="0.1"
                          placeholder="1.3"
                          value={currentData.disassemblyMultiplier || ""}
                          onChange={(e) =>
                            handlePriceChange(category.category_id, "disassemblyMultiplier", Number(e.target.value))
                          }
                        />
                        <p className="text-sm text-muted-foreground">
                          ×{currentData.disassemblyMultiplier || 1.3} (
                          {((currentData.disassemblyMultiplier || 1.3) * 100).toFixed(0)}%)
                        </p>
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor={`heavy-${category.category_id}`}>Nặng (&gt;100kg)</Label>
                        <Input
                          id={`heavy-${category.category_id}`}
                          type="number"
                          step="0.1"
                          placeholder="1.5"
                          value={currentData.heavyMultiplier || ""}
                          onChange={(e) =>
                            handlePriceChange(category.category_id, "heavyMultiplier", Number(e.target.value))
                          }
                        />
                        <p className="text-sm text-muted-foreground">
                          ×{currentData.heavyMultiplier || 1.5} (
                          {((currentData.heavyMultiplier || 1.5) * 100).toFixed(0)}
                          %)
                        </p>
                      </div>
                    </div>
                  </div>

                  {currentData.pricePerUnit && (
                    <>
                      <Separator />
                      <div className="p-3 bg-muted rounded-lg">
                        <p className="text-sm font-medium mb-2">Ví dụ tính giá:</p>
                        <div className="space-y-1 text-sm text-muted-foreground">
                          <div>• Thường: {formatVND(currentData.pricePerUnit)}</div>
                          <div>
                            • Dễ vỡ: {formatVND(currentData.pricePerUnit * (currentData.fragileMultiplier || 1.2))}
                          </div>
                          <div>
                            • Tháo lắp:{" "}
                            {formatVND(currentData.pricePerUnit * (currentData.disassemblyMultiplier || 1.3))}
                          </div>
                          <div>
                            • Nặng: {formatVND(currentData.pricePerUnit * (currentData.heavyMultiplier || 1.5))}
                          </div>
                        </div>
                      </div>
                    </>
                  )}
                </CardContent>
              </Card>
            )
          })}
        </div>
      </div>
    </DashboardLayout>
  )
}

