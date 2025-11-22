"use client"

import { useState } from "react"
import { useAuth } from "@/contexts/auth-context"
import { useRateCards } from "@/hooks/use-pricing"
import { useCategories } from "@/hooks/use-categories"
import { apiClient } from "@/lib/api-client"
import { useToast } from "@/hooks/use-toast"
import { DashboardLayout } from "@/components/dashboard/dashboard-layout"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { formatVND } from "@/lib/format"
import { Trash2, LayoutDashboard, Package, FileText, Truck, DollarSign, Star } from "lucide-react"

const navItems = [
  { label: "Tổng quan", href: "/transport", icon: "LayoutDashboard" },
  { label: "Công việc", href: "/transport/jobs", icon: "Package" },
  { label: "Báo giá", href: "/transport/quotations", icon: "FileText" },
  { label: "Xe", href: "/transport/vehicles", icon: "Truck" },
  { label: "Giá cả (Loại đồ)", href: "/transport/pricing/categories", icon: "DollarSign" },
  { label: "Giá cước (Rate Card)", href: "/transport/pricing/rates", icon: "DollarSign" },
  { label: "Hồ sơ", href: "/transport/profile", icon: "Star" },
]

export default function RateCardPage() {
  const { user } = useAuth()
  const { rateCards, isLoading, mutate } = useRateCards(user?.user_id)
  const { categories } = useCategories({ isActive: true })
  const { toast } = useToast()
  const [isSubmitting, setIsSubmitting] = useState(false)

  const [formData, setFormData] = useState({
    categoryId: "",
    basePrice: "",
    pricePerKm: "",
    pricePerHour: "",
    minimumCharge: "",
    validFrom: new Date().toISOString().split('T')[0], // Today YYYY-MM-DD
    validUntil: new Date(new Date().setFullYear(new Date().getFullYear() + 1)).toISOString().split('T')[0] // Next year
  })

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!user?.user_id) return

    setIsSubmitting(true)
    try {
      await apiClient.createRateCard(user.user_id, {
        categoryId: Number(formData.categoryId),
        basePrice: Number(formData.basePrice),
        pricePerKm: Number(formData.pricePerKm),
        pricePerHour: Number(formData.pricePerHour),
        minimumCharge: Number(formData.minimumCharge),
        validFrom: new Date(formData.validFrom).toISOString(),
        validUntil: new Date(formData.validUntil).toISOString()
      })
      toast({ title: "Thành công", description: "Đã tạo bảng giá mới" })
      mutate()
      // Reset form partially
      setFormData(prev => ({ ...prev, categoryId: "", basePrice: "", pricePerKm: "", pricePerHour: "", minimumCharge: "" }))
    } catch (error: any) {
      toast({ title: "Lỗi", description: error.message, variant: "destructive" })
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleDelete = async (id: number) => {
    if (!user?.user_id) return
    if (!confirm("Bạn có chắc muốn xóa bảng giá này?")) return

    try {
      await apiClient.deleteRateCard(user.user_id, id)
      toast({ title: "Đã xóa", description: "Đã xóa bảng giá" })
      mutate()
    } catch (error: any) {
      toast({ title: "Lỗi", description: error.message, variant: "destructive" })
    }
  }

  return (
    <DashboardLayout navItems={navItems} title="Cài đặt giá cước">
      <div className="max-w-7xl mx-auto px-6 py-10 space-y-6">
        <div>
            <h1 className="text-3xl font-bold">Cài đặt giá cước vận chuyển</h1>
            <p className="text-muted-foreground">Thiết lập giá cước cơ bản, giá theo km và thời gian cho từng loại đồ/xe</p>
        </div>

        <div className="grid gap-6 md:grid-cols-3">
            {/* Form */}
            <Card className="md:col-span-1 h-fit">
                <CardHeader>
                    <CardTitle>Thêm bảng giá mới</CardTitle>
                </CardHeader>
                <CardContent>
                    <form onSubmit={handleSubmit} className="space-y-4">
                        <div className="space-y-2">
                            <Label>Danh mục áp dụng</Label>
                            <Select 
                                value={formData.categoryId} 
                                onValueChange={(val) => setFormData({...formData, categoryId: val})}
                            >
                                <SelectTrigger>
                                    <SelectValue placeholder="Chọn danh mục" />
                                </SelectTrigger>
                                <SelectContent>
                                    {categories.map((c: any) => (
                                        <SelectItem key={c.category_id} value={String(c.category_id)}>
                                            {c.name}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>
                        
                        <div className="space-y-2">
                            <Label>Giá mở cửa (Base Price)</Label>
                            <Input type="number" placeholder="0" value={formData.basePrice} onChange={e => setFormData({...formData, basePrice: e.target.value})} required />
                        </div>
                         <div className="space-y-2">
                            <Label>Giá mỗi Km (VND/km)</Label>
                            <Input type="number" placeholder="0" value={formData.pricePerKm} onChange={e => setFormData({...formData, pricePerKm: e.target.value})} required />
                        </div>
                         <div className="space-y-2">
                            <Label>Giá mỗi Giờ (VND/h)</Label>
                            <Input type="number" placeholder="0" value={formData.pricePerHour} onChange={e => setFormData({...formData, pricePerHour: e.target.value})} required />
                        </div>
                         <div className="space-y-2">
                            <Label>Cước tối thiểu</Label>
                            <Input type="number" placeholder="0" value={formData.minimumCharge} onChange={e => setFormData({...formData, minimumCharge: e.target.value})} required />
                        </div>
                        <div className="grid grid-cols-2 gap-2">
                             <div className="space-y-2">
                                <Label>Từ ngày</Label>
                                <Input type="date" value={formData.validFrom} onChange={e => setFormData({...formData, validFrom: e.target.value})} required />
                            </div>
                             <div className="space-y-2">
                                <Label>Đến ngày</Label>
                                <Input type="date" value={formData.validUntil} onChange={e => setFormData({...formData, validUntil: e.target.value})} required />
                            </div>
                        </div>
                        <Button type="submit" className="w-full" disabled={isSubmitting}>
                            {isSubmitting ? "Đang lưu..." : "Thêm bảng giá"}
                        </Button>
                    </form>
                </CardContent>
            </Card>

            {/* List */}
             <Card className="md:col-span-2">
                <CardHeader>
                    <CardTitle>Danh sách bảng giá hiện tại</CardTitle>
                </CardHeader>
                <CardContent>
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>Danh mục</TableHead>
                                <TableHead>Giá mở cửa</TableHead>
                                <TableHead>Giá/Km</TableHead>
                                <TableHead>Giá/Giờ</TableHead>
                                <TableHead>Hiệu lực đến</TableHead>
                                <TableHead></TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {isLoading ? (
                                <TableRow><TableCell colSpan={6} className="text-center">Đang tải...</TableCell></TableRow>
                            ) : rateCards.length === 0 ? (
                                <TableRow><TableCell colSpan={6} className="text-center text-muted-foreground">Chưa có bảng giá nào</TableCell></TableRow>
                            ) : (
                                rateCards.map((card: any) => (
                                    <TableRow key={card.rateCardId}>
                                        <TableCell className="font-medium">{card.categoryName || `ID: ${card.categoryId}`}</TableCell>
                                        <TableCell>{formatVND(card.basePrice)}</TableCell>
                                        <TableCell>{formatVND(card.pricePerKm)}</TableCell>
                                        <TableCell>{formatVND(card.pricePerHour)}</TableCell>
                                        <TableCell>{new Date(card.validUntil).toLocaleDateString()}</TableCell>
                                        <TableCell>
                                            <Button variant="ghost" size="icon" onClick={() => handleDelete(card.rateCardId)}>
                                                <Trash2 className="h-4 w-4 text-red-500" />
                                            </Button>
                                        </TableCell>
                                    </TableRow>
                                ))
                            )}
                        </TableBody>
                    </Table>
                </CardContent>
            </Card>
        </div>
      </div>
    </DashboardLayout>
  )
}
