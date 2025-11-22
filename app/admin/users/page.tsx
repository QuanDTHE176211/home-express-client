"use client"

import { useCallback, useEffect, useState } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { useAuth } from "@/contexts/auth-context"
import { apiClient } from "@/lib/api-client"
import { DashboardLayout } from "@/components/dashboard/dashboard-layout"
import { AdminBreadcrumbs } from "@/components/admin/admin-breadcrumbs"
import { DataTable } from "@/components/dashboard/data-table"
import { RoleBadge } from "@/components/dashboard/role-badge"
import { StatusBadge } from "@/components/dashboard/status-badge"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Checkbox } from "@/components/ui/checkbox"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { Search, MoreVertical, CheckCircle, XCircle, Eye, Download, Users } from "lucide-react"
import type { ColumnDef } from "@tanstack/react-table"
import { formatDate } from "@/lib/format"
import type { User, Customer, Transport, Manager } from "@/types"
import { useToast } from "@/hooks/use-toast"
import { adminNavItems } from "@/lib/admin-nav-config"
import { ConfirmDialog } from "@/components/admin/confirm-dialog"
import { Pagination } from "@/components/admin/pagination"
import { useDebounce } from "@/hooks/use-debounce"
import { EmptyState } from "@/components/admin/empty-state"
import { TableSkeleton } from "@/components/admin/table-skeleton"
import { exportToCSV, formatExportDate } from "@/lib/export-utils"
import { logAuditAction } from "@/lib/audit-logger"
import { AdminErrorBoundary } from "@/components/admin/admin-error-boundary"
import { SortableHeader } from "@/components/admin/sortable-header"
import React from "react"

interface UserWithProfile {
  user: User
  profile: Customer | Transport | Manager
}

function AdminUsersPageContent() {
  const { user, loading } = useAuth()
  const router = useRouter()
  const searchParams = useSearchParams()
  const { toast } = useToast()

  // Read query parameters
  const roleParam = searchParams.get("role")
  const verifiedParam = searchParams.get("verified")
  const periodParam = searchParams.get("period")

  // Initialize filters based on query params
  const [search, setSearch] = useState("")
  const [roleFilter, setRoleFilter] = useState(roleParam || "ALL")
  const [statusFilter, setStatusFilter] = useState(
    verifiedParam === "true" ? "ACTIVE" : verifiedParam === "false" ? "INACTIVE" : "ALL"
  )
  const [users, setUsers] = useState<UserWithProfile[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [currentPage, setCurrentPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [totalItems, setTotalItems] = useState(0)
  const [itemsPerPage, setItemsPerPage] = useState(10)

  const [selectedUsers, setSelectedUsers] = useState<Set<number>>(new Set())
  const [isAllSelected, setIsAllSelected] = useState(false)

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
    onConfirm: async () => { },
  })

  const [sortConfig, setSortConfig] = useState<{ key: string; direction: "asc" | "desc" } | null>(null)

  const debouncedSearch = useDebounce(search, 500)

  const fetchUsers = useCallback(async () => {
    try {
      setIsLoading(true)
      const params: any = {
        page: currentPage,
        limit: itemsPerPage,
      }

      if (debouncedSearch) params.search = debouncedSearch
      if (roleFilter !== "ALL") params.role = roleFilter
      if (statusFilter !== "ALL") params.status = statusFilter === "ACTIVE" ? "true" : "false"

      const response = await apiClient.getUsers(params)
      setUsers(response.users as UserWithProfile[])
      setTotalPages(response.pagination.total_pages)
      setTotalItems(response.pagination.total_items)
      setSelectedUsers(new Set())
      setIsAllSelected(false)
    } catch (error) {
      toast({
        title: "Lỗi",
        description: "Không thể tải danh sách người dùng",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }, [currentPage, debouncedSearch, itemsPerPage, roleFilter, statusFilter, toast])

  useEffect(() => {
    if (!loading && user?.role === "MANAGER") {
      fetchUsers()
    }
  }, [user, loading, fetchUsers])

  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      const allUserIds = new Set(users.map((u) => u.user.user_id))
      setSelectedUsers(allUserIds)
      setIsAllSelected(true)
    } else {
      setSelectedUsers(new Set())
      setIsAllSelected(false)
    }
  }

  const handleSelectUser = (userId: number, checked: boolean) => {
    const newSelected = new Set(selectedUsers)
    if (checked) {
      newSelected.add(userId)
    } else {
      newSelected.delete(userId)
    }
    setSelectedUsers(newSelected)
    setIsAllSelected(newSelected.size === users.length)
  }

  const handleBulkDeactivate = async () => {
    if (selectedUsers.size === 0) return

    setConfirmDialog({
      open: true,
      title: "Vô hiệu hóa nhiều tài khoản",
      description: `Bạn có chắc chắn muốn vô hiệu hóa ${selectedUsers.size} tài khoản đã chọn?`,
      warning: "Các người dùng sẽ không thể đăng nhập và sử dụng dịch vụ.",
      variant: "destructive",
      onConfirm: async () => {
        try {
          const promises = Array.from(selectedUsers).map((userId) =>
            apiClient.deactivateUser(userId, "Bulk deactivated by admin"),
          )
          await Promise.all(promises)

          await logAuditAction({
            action: "BULK_USER_DEACTIVATED",
            target_type: "USER",
            details: { count: selectedUsers.size, userIds: Array.from(selectedUsers) },
          })

          toast({
            title: "Thành công",
            description: `Đã vô hiệu hóa ${selectedUsers.size} tài khoản`,
          })
          await fetchUsers()
        } catch (error) {
          toast({
            title: "Lỗi",
            description: "Không thể vô hiệu hóa một số tài khoản",
            variant: "destructive",
          })
        }
      },
    })
  }

  const handleExport = () => {
    const exportData = users.map((item) => {
      const profile = item.profile as any
      return {
        email: item.user.email,
        name: profile.full_name || profile.company_name || "N/A",
        role: item.user.role,
        status: item.user.is_active ? "Hoạt động" : "Vô hiệu hóa",
        created_at: formatExportDate(profile.created_at),
      }
    })

    exportToCSV(exportData, `users-${new Date().toISOString().split("T")[0]}`, [
      { key: "email", label: "Email" },
      { key: "name", label: "Họ tên" },
      { key: "role", label: "Vai trò" },
      { key: "status", label: "Trạng thái" },
      { key: "created_at", label: "Ngày tạo" },
    ])

    toast({
      title: "Thành công",
      description: "Đã xuất danh sách người dùng",
    })
  }

  const handleActivate = async (userId: number) => {
    setConfirmDialog({
      open: true,
      title: "Kích hoạt tài khoản",
      description: "Bạn có chắc chắn muốn kích hoạt tài khoản này?",
      onConfirm: async () => {
        try {
          await apiClient.activateUser(userId)
          await logAuditAction({
            action: "USER_ACTIVATED",
            target_type: "USER",
            target_id: userId,
          })
          toast({
            title: "Thành công",
            description: "Đã kích hoạt tài khoản",
          })
          await fetchUsers()
        } catch (error) {
          toast({
            title: "Lỗi",
            description: "Không thể kích hoạt tài khoản",
            variant: "destructive",
          })
        }
      },
    })
  }

  const handleDeactivate = async (userId: number) => {
    try {
      const checkResult = await apiClient.checkUserActiveBookings(userId)

      if (checkResult.data.hasActiveBookings) {
        setConfirmDialog({
          open: true,
          title: "Không thể vô hiệu hóa",
          description: `Người dùng này có ${checkResult.data.activeBookingsCount} đơn hàng đang hoạt động.`,
          warning: "Vui lòng đợi các đơn hàng hoàn thành hoặc hủy trước khi vô hiệu hóa tài khoản.",
          variant: "destructive",
          onConfirm: async () => { },
        })
      } else {
        setConfirmDialog({
          open: true,
          title: "Vô hiệu hóa tài khoản",
          description: "Bạn có chắc chắn muốn vô hiệu hóa tài khoản này?",
          warning: "Người dùng sẽ không thể đăng nhập và sử dụng dịch vụ.",
          variant: "destructive",
          onConfirm: async () => {
            try {
              await apiClient.deactivateUser(userId, "Deactivated by admin")
              await logAuditAction({
                action: "USER_DEACTIVATED",
                target_type: "USER",
                target_id: userId,
                details: { reason: "Deactivated by admin" },
              })
              toast({
                title: "Thành công",
                description: "Đã vô hiệu hóa tài khoản",
              })
              await fetchUsers()
            } catch (error) {
              toast({
                title: "Lỗi",
                description: "Không thể vô hiệu hóa tài khoản",
                variant: "destructive",
              })
            }
          },
        })
      }
    } catch (error) {
      toast({
        title: "Lỗi",
        description: "Không thể kiểm tra trạng thái người dùng",
        variant: "destructive",
      })
    }
  }

  const handleSort = (key: string) => {
    let direction: "asc" | "desc" = "asc"
    if (sortConfig && sortConfig.key === key && sortConfig.direction === "asc") {
      direction = "desc"
    }
    setSortConfig({ key, direction })
  }

  const sortedUsers = React.useMemo(() => {
    if (!sortConfig) return users

    const sorted = [...users].sort((a, b) => {
      let aValue: any
      let bValue: any

      switch (sortConfig.key) {
        case "email":
          aValue = a.user.email
          bValue = b.user.email
          break
        case "name":
          const aProfile = a.profile as any
          const bProfile = b.profile as any
          aValue = aProfile.full_name || aProfile.company_name || ""
          bValue = bProfile.full_name || bProfile.company_name || ""
          break
        case "role":
          aValue = a.user.role
          bValue = b.user.role
          break
        case "status":
          aValue = a.user.is_active ? 1 : 0
          bValue = b.user.is_active ? 1 : 0
          break
        case "created_at":
          aValue = new Date((a.profile as any).created_at).getTime()
          bValue = new Date((b.profile as any).created_at).getTime()
          break
        default:
          return 0
      }

      if (aValue < bValue) return sortConfig.direction === "asc" ? -1 : 1
      if (aValue > bValue) return sortConfig.direction === "asc" ? 1 : -1
      return 0
    })

    return sorted
  }, [users, sortConfig])

  const userColumns: ColumnDef<UserWithProfile>[] = [
    {
      id: "select",
      header: ({ table }) => (
        <Checkbox checked={isAllSelected} onCheckedChange={handleSelectAll} aria-label="Chọn tất cả" />
      ),
      cell: ({ row }) => (
        <Checkbox
          checked={selectedUsers.has(row.original.user.user_id)}
          onCheckedChange={(checked) => handleSelectUser(row.original.user.user_id, checked as boolean)}
          aria-label="Chọn hàng"
        />
      ),
      enableSorting: false,
      enableHiding: false,
    },
    {
      accessorKey: "user.email",
      header: () => <SortableHeader label="Email" sortKey="email" currentSort={sortConfig} onSort={handleSort} />,
      cell: ({ row }) => <span className="font-medium">{row.original.user.email}</span>,
    },
    {
      accessorKey: "profile.full_name",
      header: () => <SortableHeader label="Họ tên" sortKey="name" currentSort={sortConfig} onSort={handleSort} />,
      cell: ({ row }) => {
        const profile = row.original.profile as any
        return <span>{profile.full_name || profile.company_name || "N/A"}</span>
      },
    },
    {
      accessorKey: "user.role",
      header: () => <SortableHeader label="Vai trò" sortKey="role" currentSort={sortConfig} onSort={handleSort} />,
      cell: ({ row }) => <RoleBadge role={row.original.user.role} />,
    },
    {
      accessorKey: "user.is_active",
      header: () => <SortableHeader label="Trạng thái" sortKey="status" currentSort={sortConfig} onSort={handleSort} />,
      cell: ({ row }) => <StatusBadge active={row.original.user.is_active} />,
    },
    {
      accessorKey: "profile.created_at",
      header: () => (
        <SortableHeader label="Ngày tạo" sortKey="created_at" currentSort={sortConfig} onSort={handleSort} />
      ),
      cell: ({ row }) => formatDate((row.original.profile as any).created_at),
    },
    {
      id: "actions",
      header: "",
      cell: ({ row }) => {
        const isActive = row.original.user.is_active
        const userId = row.original.user.user_id

        return (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon">
                <MoreVertical className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={() => router.push(`/admin/users/${userId}`)}>
                <Eye className="mr-2 h-4 w-4" />
                Xem chi tiết
              </DropdownMenuItem>
              {isActive ? (
                <DropdownMenuItem onClick={() => handleDeactivate(userId)} className="text-error">
                  <XCircle className="mr-2 h-4 w-4" />
                  Vô hiệu hóa
                </DropdownMenuItem>
              ) : (
                <DropdownMenuItem onClick={() => handleActivate(userId)} className="text-success">
                  <CheckCircle className="mr-2 h-4 w-4" />
                  Kích hoạt
                </DropdownMenuItem>
              )}
            </DropdownMenuContent>
          </DropdownMenu>
        )
      },
    },
  ]

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-accent-green" />
      </div>
    )
  }

  if (!user) return null

  return (
    <DashboardLayout navItems={adminNavItems} title="Quản lý Users">
      <div className="space-y-6">
        <AdminBreadcrumbs />

        <div>
          <h1 className="text-3xl font-bold tracking-tight">Quản lý người dùng</h1>
          <p className="text-muted-foreground mt-1">Xem và quản lý tất cả người dùng trên nền tảng</p>
        </div>

        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle>Danh sách người dùng</CardTitle>
              <div className="flex gap-2">
                {selectedUsers.size > 0 && (
                  <Button onClick={handleBulkDeactivate} variant="destructive" size="sm">
                    <XCircle className="mr-2 h-4 w-4" />
                    Vô hiệu hóa ({selectedUsers.size})
                  </Button>
                )}
                <Button onClick={handleExport} variant="outline" size="sm" disabled={users.length === 0}>
                  <Download className="mr-2 h-4 w-4" />
                  Xuất CSV
                </Button>
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Filters */}
            <div className="flex flex-col md:flex-row gap-4">
              <div className="flex-1 relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Tìm kiếm email, tên..."
                  value={search}
                  onChange={(e) => {
                    setSearch(e.target.value)
                    setCurrentPage(1)
                  }}
                  className="pl-9 h-11"
                />
              </div>
              <Select
                value={roleFilter}
                onValueChange={(value) => {
                  setRoleFilter(value)
                  setCurrentPage(1)
                }}
              >
                <SelectTrigger className="w-full md:w-[180px] h-11">
                  <SelectValue placeholder="Lọc theo vai trò" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="ALL">Tất cả vai trò</SelectItem>
                  <SelectItem value="CUSTOMER">Khách hàng</SelectItem>
                  <SelectItem value="TRANSPORT">Vận chuyển</SelectItem>
                  <SelectItem value="MANAGER">Quản trị</SelectItem>
                </SelectContent>
              </Select>
              <Select
                value={statusFilter}
                onValueChange={(value) => {
                  setStatusFilter(value)
                  setCurrentPage(1)
                }}
              >
                <SelectTrigger className="w-full md:w-[180px] h-11">
                  <SelectValue placeholder="Trạng thái" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="ALL">Tất cả</SelectItem>
                  <SelectItem value="ACTIVE">Hoạt động</SelectItem>
                  <SelectItem value="INACTIVE">Vô hiệu hóa</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Table */}
            {isLoading ? (
              <TableSkeleton rows={itemsPerPage} columns={7} />
            ) : users.length === 0 ? (
              <EmptyState
                icon={Users}
                title="Không tìm thấy người dùng"
                description="Không có người dùng nào phù hợp với bộ lọc của bạn. Thử điều chỉnh bộ lọc hoặc tìm kiếm."
                action={{
                  label: "Xóa bộ lọc",
                  onClick: () => {
                    setSearch("")
                    setRoleFilter("ALL")
                    setStatusFilter("ALL")
                  },
                }}
              />
            ) : (
              <>
                <DataTable columns={userColumns} data={sortedUsers} />

                {totalPages > 1 && (
                  <Pagination
                    currentPage={currentPage}
                    totalPages={totalPages}
                    totalItems={totalItems}
                    itemsPerPage={itemsPerPage}
                    onPageChange={setCurrentPage}
                    onItemsPerPageChange={(newItemsPerPage) => {
                      setItemsPerPage(newItemsPerPage)
                      setCurrentPage(1)
                    }}
                  />
                )}
              </>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Confirmation dialog */}
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

export default function AdminUsersPage() {
  return (
    <AdminErrorBoundary>
      <AdminUsersPageContent />
    </AdminErrorBoundary>
  )
}
