"use client"

import { useState } from "react"
import { Plus, Edit, Trash, Search } from "lucide-react"
import { DashboardLayout } from "@/components/dashboard/dashboard-layout"
import { AdminBreadcrumbs } from "@/components/admin/admin-breadcrumbs"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { DataTable } from "@/components/dashboard/data-table"
import { AddCategoryModal } from "@/components/category/add-category-modal"
import { EditCategoryModal } from "@/components/category/edit-category-modal"
import { ConfirmDialog } from "@/components/admin/confirm-dialog"
import { useCategories } from "@/hooks/use-categories"
import { useToast } from "@/hooks/use-toast"
import { apiClient } from "@/lib/api-client"
import { logAuditAction } from "@/lib/audit-logger"
import { adminNavItems } from "@/lib/admin-nav-config"
import { SortableHeader } from "@/components/admin/sortable-header"
import React from "react"
import type { ColumnDef } from "@tanstack/react-table"
import type { CategoryWithSizes } from "@/types"

export default function AdminCategoriesPage() {
  const { categories, isLoading, mutate } = useCategories()
  const { toast } = useToast()
  const [showAddModal, setShowAddModal] = useState(false)
  const [showEditModal, setShowEditModal] = useState(false)
  const [selectedCategory, setSelectedCategory] = useState<CategoryWithSizes | null>(null)
  const [searchQuery, setSearchQuery] = useState("")
  const [confirmDialog, setConfirmDialog] = useState<{
    open: boolean
    title: string
    description: string
    warning?: string
    onConfirm: () => Promise<void>
    variant?: "default" | "destructive"
  }>({
    open: false,
    title: "",
    description: "",
    onConfirm: async () => {},
  })

  const [sortConfig, setSortConfig] = useState<{ key: string; direction: "asc" | "desc" } | null>(null)

  const handleSort = (key: string) => {
    let direction: "asc" | "desc" = "asc"
    if (sortConfig && sortConfig.key === key && sortConfig.direction === "asc") {
      direction = "desc"
    }
    setSortConfig({ key, direction })
  }

  const filteredAndSortedCategories = React.useMemo(() => {
    if (!categories) return categories

    let filtered = categories
    if (searchQuery) {
      filtered = categories.filter((category) =>
        category.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        category.name_en?.toLowerCase().includes(searchQuery.toLowerCase())
      )
    }

    if (!sortConfig) return filtered

    const sorted = [...filtered].sort((a, b) => {
      let aValue: any
      let bValue: any

      switch (sortConfig.key) {
        case "name":
          aValue = a.name
          bValue = b.name
          break
        case "display_order":
          aValue = a.display_order || 0
          bValue = b.display_order || 0
          break
        case "status":
          aValue = a.is_active ? 1 : 0
          bValue = b.is_active ? 1 : 0
          break
        default:
          return 0
      }

      if (aValue < bValue) return sortConfig.direction === "asc" ? -1 : 1
      if (aValue > bValue) return sortConfig.direction === "asc" ? 1 : -1
      return 0
    })

    return sorted
  }, [categories, sortConfig, searchQuery])

  const handleEdit = (category: CategoryWithSizes) => {
    setSelectedCategory(category)
    setShowEditModal(true)
  }

  const handleEditSuccess = async () => {
    if (selectedCategory) {
      await logAuditAction({
        action: "CATEGORY_UPDATED",
        target_type: "CATEGORY",
        target_id: selectedCategory.category_id,
      })
    }
    mutate()
  }

  const handleDelete = async (categoryId: number, categoryName: string) => {
    try {
      const usageCheck = await apiClient.checkCategoryUsage(categoryId)

      if (usageCheck.data.isInUse) {
        setConfirmDialog({
          open: true,
          title: "Không thể xóa danh mục",
          description: `Danh mục "${categoryName}" đang được sử dụng.`,
          warning: `Có ${usageCheck.data.totalItems} mục và ${usageCheck.data.activeBookings} đơn hàng đang hoạt động sử dụng danh mục này. Vui lòng chuyển các mục sang danh mục khác trước khi xóa.`,
          variant: "destructive",
          onConfirm: async () => {},
        })
      } else {
        setConfirmDialog({
          open: true,
          title: "Xóa danh mục",
          description: `Bạn có chắc chắn muốn xóa danh mục "${categoryName}"?`,
          warning: "Hành động này không thể hoàn tác.",
          variant: "destructive",
          onConfirm: async () => {
            try {
              await apiClient.deleteCategory(categoryId)
              await logAuditAction({
                action: "CATEGORY_DELETED",
                target_type: "CATEGORY",
                target_id: categoryId,
              })
              toast({
                title: "Thành công",
                description: "Đã xóa danh mục",
              })
              mutate()
            } catch (error) {
              toast({
                title: "Lỗi",
                description: error instanceof Error ? error.message : "Không thể xóa danh mục",
                variant: "destructive",
              })
            }
          },
        })
      }
    } catch (error) {
      toast({
        title: "Lỗi",
        description: "Không thể kiểm tra trạng thái danh mục",
        variant: "destructive",
      })
    }
  }

  const columns: ColumnDef<CategoryWithSizes>[] = [
    {
      accessorKey: "icon",
      header: "Icon",
      cell: ({ row }) => <span className="text-2xl">{row.original.icon || "📦"}</span>,
    },
    {
      accessorKey: "name",
      header: () => <SortableHeader label="Tên" sortKey="name" currentSort={sortConfig} onSort={handleSort} />,
      cell: ({ row }) => (
        <div>
          <div className="font-medium">{row.original.name}</div>
          {row.original.name_en && <div className="text-sm text-muted-foreground">{row.original.name_en}</div>}
        </div>
      ),
    },
    {
      accessorKey: "default_weight_kg",
      header: "Trọng lượng",
      cell: ({ row }) => <span>{row.original.default_weight_kg ? `${row.original.default_weight_kg}kg` : "-"}</span>,
    },
    {
      accessorKey: "default_volume_m3",
      header: "Thể tích",
      cell: ({ row }) => <span>{row.original.default_volume_m3 ? `${row.original.default_volume_m3}m³` : "-"}</span>,
    },
    {
      accessorKey: "is_active",
      header: () => <SortableHeader label="Trạng thái" sortKey="status" currentSort={sortConfig} onSort={handleSort} />,
      cell: ({ row }) => (
        <Badge variant={row.original.is_active ? "default" : "secondary"}>
          {row.original.is_active ? "Hoạt động" : "Tạm dừng"}
        </Badge>
      ),
    },
    {
      id: "actions",
      header: "Thao tác",
      cell: ({ row }) => (
        <div className="flex gap-2">
          <Button variant="ghost" size="sm" onClick={() => handleEdit(row.original)}>
            <Edit className="h-4 w-4" />
          </Button>
          <Button variant="ghost" size="sm" onClick={() => handleDelete(row.original.category_id, row.original.name)}>
            <Trash className="h-4 w-4" />
          </Button>
        </div>
      ),
    },
  ]

  const handleAddSuccess = async () => {
    mutate()
    const newCategories = await apiClient.getCategories()
    if (newCategories.data && newCategories.data.length > 0) {
      const newCategory = newCategories.data[newCategories.data.length - 1]
      await logAuditAction({
        action: "CATEGORY_CREATED",
        target_type: "CATEGORY",
        target_id: newCategory.category_id,
      })
    }
  }

  return (
    <DashboardLayout navItems={adminNavItems} title="Quản lý Danh mục">
      <div className="space-y-6">
        <AdminBreadcrumbs />

        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold">Quản lý Danh mục Đồ đạc</h1>
            <p className="text-muted-foreground">Quản lý các loại đồ đạc trong hệ thống</p>
          </div>
          <Button onClick={() => setShowAddModal(true)}>
            <Plus className="mr-2 h-4 w-4" />
            Thêm danh mục
          </Button>
        </div>

        <Card>
          <CardContent className="pt-6">
            <div className="mb-4">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  placeholder="Tìm kiếm danh mục..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-9"
                />
              </div>
            </div>
            {isLoading ? (
              <div className="flex items-center justify-center py-12">
                <p className="text-muted-foreground">Đang tải...</p>
              </div>
            ) : (
              <DataTable columns={columns} data={filteredAndSortedCategories} />
            )}
          </CardContent>
        </Card>
      </div>

      <AddCategoryModal open={showAddModal} onOpenChange={setShowAddModal} onSuccess={handleAddSuccess} />

      <EditCategoryModal
        open={showEditModal}
        onOpenChange={setShowEditModal}
        onSuccess={handleEditSuccess}
        category={selectedCategory}
      />

      <ConfirmDialog
        open={confirmDialog.open}
        onOpenChange={(open) => setConfirmDialog({ ...confirmDialog, open })}
        title={confirmDialog.title}
        description={confirmDialog.description}
        warning={confirmDialog.warning}
        onConfirm={confirmDialog.onConfirm}
        variant={confirmDialog.variant}
      />
    </DashboardLayout>
  )
}

