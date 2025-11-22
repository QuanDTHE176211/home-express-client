"use client"

import { useState } from "react"
import { Plus, Search, Filter, LayoutDashboard, Truck, Package, Star, DollarSign, FileText } from "lucide-react"
import { DashboardLayout } from "@/components/dashboard/dashboard-layout"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { VehicleCard } from "@/components/vehicle/vehicle-card"
import { VehicleCardSkeleton } from "@/components/vehicle/vehicle-card-skeleton"
import { AddVehicleModal } from "@/components/vehicle/add-vehicle-modal"
import { EditVehicleModal } from "@/components/vehicle/edit-vehicle-modal"
import { useVehicles } from "@/hooks/use-vehicles"
import { useToast } from "@/hooks/use-toast"
import { useDebounce } from "@/lib/debounce"
import { apiClient } from "@/lib/api-client"
import type { Vehicle } from "@/types"

const navItems = [
  { label: "Tổng quan", href: "/transport", icon: "LayoutDashboard" },
  { label: "Công việc", href: "/transport/jobs", icon: "Package" },
  { label: "Báo giá", href: "/transport/quotations", icon: "FileText" },
  { label: "Xe", href: "/transport/vehicles", icon: "Truck" },
  { label: "Giá cả", href: "/transport/pricing/categories", icon: "DollarSign" },
  { label: "Hồ sơ", href: "/transport/profile", icon: "Star" },
]

export default function VehiclesPage() {
  const [searchQuery, setSearchQuery] = useState("")
  const [statusFilter, setStatusFilter] = useState<string>("all")
  const [typeFilter, setTypeFilter] = useState<string>("all")
  const [showAddModal, setShowAddModal] = useState(false)
  const [editingVehicle, setEditingVehicle] = useState<Vehicle | null>(null)

  const debouncedSearch = useDebounce(searchQuery, 300)

  const { vehicles, isLoading, mutate } = useVehicles({
    status: statusFilter === "all" ? undefined : statusFilter,
  })
  const { toast } = useToast()

  // Calculate stats
  const stats = {
    total: vehicles.length,
    available: vehicles.filter((v: Vehicle) => v.status === "available").length,
    in_use: vehicles.filter((v: Vehicle) => v.status === "in_use").length,
    maintenance: vehicles.filter((v: Vehicle) => v.status === "maintenance").length,
  }

  // Filter vehicles
  const filteredVehicles = vehicles.filter((vehicle: Vehicle) => {
    const matchesSearch =
      vehicle.model.toLowerCase().includes(debouncedSearch.toLowerCase()) ||
      vehicle.license_plate.toLowerCase().includes(debouncedSearch.toLowerCase())
    const matchesType = typeFilter === "all" || vehicle.type === typeFilter
    return matchesSearch && matchesType
  })

  const handleEdit = (vehicle: Vehicle) => {
    setEditingVehicle(vehicle)
  }

  const handleDelete = async (vehicleId: number) => {
    if (!confirm("Bạn có chắc muốn xóa xe này? Xe sẽ được chuyển sang trạng thái không hoạt động.")) {
      return
    }

    try {
      await apiClient.deleteVehicle(vehicleId)
      toast({
        title: "Thành công",
        description: "Đã xóa xe thành công",
      })
      mutate()
    } catch (error) {
      toast({
        title: "Lỗi",
        description: error instanceof Error ? error.message : "Không thể xóa xe",
        variant: "destructive",
      })
    }
  }

  const handleConfigurePricing = (vehicleId: number) => {
    window.location.href = `/transport/vehicles/${vehicleId}/pricing`
  }

  const handleStatusChange = async (vehicleId: number, newStatus: string) => {
    try {
      await apiClient.updateVehicleStatus(vehicleId, newStatus)
      toast({
        title: "Thành công",
        description: "Đã cập nhật trạng thái xe",
      })
      mutate()
    } catch (error) {
      toast({
        title: "Lỗi",
        description: error instanceof Error ? error.message : "Không thể cập nhật trạng thái",
        variant: "destructive",
      })
    }
  }

  return (
    <DashboardLayout navItems={navItems} title="Quản lý Phương tiện">
      <div className="max-w-7xl mx-auto px-6 py-10 space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold">Quản lý Phương tiện</h1>
            <p className="text-muted-foreground">Quản lý danh sách xe và cấu hình giá</p>
          </div>
          <Button onClick={() => setShowAddModal(true)} className="bg-accent-green hover:bg-accent-green/90">
            <Plus className="mr-2 h-4 w-4" />
            Thêm xe mới
          </Button>
        </div>

        {/* Stats Overview */}
        <div className="grid gap-4 md:grid-cols-4">
          <Card className="hover:shadow-md transition-shadow">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Tổng số xe</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.total}</div>
            </CardContent>
          </Card>
          <Card className="hover:shadow-md transition-shadow">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Sẵn sàng</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-accent-green">{stats.available}</div>
            </CardContent>
          </Card>
          <Card className="hover:shadow-md transition-shadow">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Đang dùng</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-amber-600">{stats.in_use}</div>
            </CardContent>
          </Card>
          <Card className="hover:shadow-md transition-shadow">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Bảo trì</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-red-600">{stats.maintenance}</div>
            </CardContent>
          </Card>
        </div>

        {/* Filters */}
        <Card className="hover:shadow-md transition-shadow">
          <CardContent className="pt-6">
            <div className="flex flex-col gap-4 md:flex-row">
              <div className="relative flex-1">
                <Search
                  className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground"
                  aria-hidden="true"
                />
                <Input
                  placeholder="Tìm kiếm theo model hoặc biển số..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-9"
                  aria-label="Tìm kiếm phương tiện"
                />
              </div>
              <Select value={typeFilter} onValueChange={setTypeFilter}>
                <SelectTrigger className="w-full md:w-[200px]" aria-label="Lọc theo loại xe">
                  <Filter className="mr-2 h-4 w-4" aria-hidden="true" />
                  <SelectValue placeholder="Loại xe" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Tất cả loại xe</SelectItem>
                  <SelectItem value="motorcycle">Xe máy</SelectItem>
                  <SelectItem value="van">Xe Van</SelectItem>
                  <SelectItem value="truck_small">Xe tải 1.5 tấn</SelectItem>
                  <SelectItem value="truck_large">Xe tải 3.5 tấn</SelectItem>
                  <SelectItem value="other">Loại khác</SelectItem>
                </SelectContent>
              </Select>
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-full md:w-[200px]" aria-label="Lọc theo trạng thái">
                  <SelectValue placeholder="Trạng thái" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Tất cả trạng thái</SelectItem>
                  <SelectItem value="available">Sẵn sàng</SelectItem>
                  <SelectItem value="in_use">Đang dùng</SelectItem>
                  <SelectItem value="maintenance">Bảo trì</SelectItem>
                  <SelectItem value="inactive">Không hoạt động</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>

        {/* Vehicles List */}
        <div className="space-y-4">
          {isLoading ? (
            <>
              <VehicleCardSkeleton />
              <VehicleCardSkeleton />
              <VehicleCardSkeleton />
            </>
          ) : filteredVehicles.length === 0 ? (
            <Card className="hover:shadow-md transition-shadow">
              <CardContent className="flex flex-col items-center justify-center py-12">
                <Truck className="h-12 w-12 text-muted-foreground mb-4" />
                <h3 className="text-lg font-semibold mb-2">Không tìm thấy xe nào</h3>
                <p className="text-muted-foreground text-center mb-4">
                  {searchQuery || typeFilter !== "all" || statusFilter !== "all"
                    ? "Thử thay đổi bộ lọc để xem thêm kết quả"
                    : "Bắt đầu bằng cách thêm xe đầu tiên của bạn"}
                </p>
                <Button onClick={() => setShowAddModal(true)} className="bg-accent-green hover:bg-accent-green/90">
                  <Plus className="mr-2 h-4 w-4" />
                  Thêm xe đầu tiên
                </Button>
              </CardContent>
            </Card>
          ) : (
            filteredVehicles.map((vehicle: Vehicle) => (
              <VehicleCard
                key={vehicle.vehicle_id}
                vehicle={vehicle}
                onEdit={handleEdit}
                onDelete={handleDelete}
                onConfigurePricing={handleConfigurePricing}
                onStatusChange={handleStatusChange}
              />
            ))
          )}
        </div>
      </div>

      {/* Modals */}
      <AddVehicleModal open={showAddModal} onOpenChange={setShowAddModal} onSuccess={() => mutate()} />

      {editingVehicle && (
        <EditVehicleModal
          open={!!editingVehicle}
          onOpenChange={(open) => !open && setEditingVehicle(null)}
          vehicle={editingVehicle}
          onSuccess={() => mutate()}
        />
      )}
    </DashboardLayout>
  )
}

