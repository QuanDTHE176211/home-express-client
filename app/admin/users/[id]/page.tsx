"use client"

import { useEffect, useState } from "react"
import { useRouter, useParams } from "next/navigation"
import { useAuth } from "@/contexts/auth-context"
import { apiClient } from "@/lib/api-client"
import { DashboardLayout } from "@/components/dashboard/dashboard-layout"
import { AdminBreadcrumbs } from "@/components/admin/admin-breadcrumbs"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { RoleBadge } from "@/components/dashboard/role-badge"
import { StatusBadge } from "@/components/dashboard/status-badge"
import { User, Mail, Phone, MapPin, Calendar, CheckCircle, XCircle, Edit, ArrowLeft, Package, Star } from "lucide-react"
import { formatDate } from "@/lib/format"
import type { User as UserType, Customer, Transport, Manager } from "@/types"
import { useToast } from "@/hooks/use-toast"
import { adminNavItems } from "@/lib/admin-nav-config"
import { logAuditAction } from "@/lib/audit-logger"

interface UserWithProfile {
  user: UserType
  profile: Customer | Transport | Manager
}

export default function UserDetailPage() {
  const params = useParams<{ id: string }>()
  const id = params.id
  const { user: currentUser, loading } = useAuth()
  const router = useRouter()
  const { toast } = useToast()
  const [userData, setUserData] = useState<UserWithProfile | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    if (!loading && (!currentUser || currentUser.role !== "MANAGER")) {
      router.push("/login")
      return
    }

    const fetchUser = async () => {
      try {
        setIsLoading(true)
        const userId = Number.parseInt(id)
        const response = await apiClient.getUserById(userId)
        // Handle both wrapped and unwrapped response structures
        const data = (response as any).data || response
        if (data.user && data.profile) {
          setUserData(data as UserWithProfile)
        } else {
          throw new Error("Invalid response structure")
        }
      } catch (error) {
        toast({
          title: "Lỗi",
          description: "Không thể tải thông tin người dùng",
          variant: "destructive",
        })
        router.push("/admin/users")
      } finally {
        setIsLoading(false)
      }
    }

    if (!loading) {
      fetchUser()
    }
  }, [id, currentUser, loading, router, toast])

  const handleActivate = async () => {
    if (!userData) return
    try {
      await apiClient.activateUser(userData.user.user_id)
      await logAuditAction({
        action: "USER_ACTIVATED",
        target_type: "USER",
        target_id: userData.user.user_id,
      })
      toast({
        title: "Thành công",
        description: "Đã kích hoạt tài khoản",
      })
      setUserData({
        ...userData,
        user: { ...userData.user, is_active: true },
      })
    } catch (error) {
      toast({
        title: "Lỗi",
        description: "Không thể kích hoạt tài khoản",
        variant: "destructive",
      })
    }
  }

  const handleDeactivate = async () => {
    if (!userData) return
    try {
      await apiClient.deactivateUser(userData.user.user_id, "Deactivated by admin")
      await logAuditAction({
        action: "USER_DEACTIVATED",
        target_type: "USER",
        target_id: userData.user.user_id,
        details: { reason: "Deactivated by admin" },
      })
      toast({
        title: "Thành công",
        description: "Đã vô hiệu hóa tài khoản",
      })
      setUserData({
        ...userData,
        user: { ...userData.user, is_active: false },
      })
    } catch (error) {
      toast({
        title: "Lỗi",
        description: "Không thể vô hiệu hóa tài khoản",
        variant: "destructive",
      })
    }
  }

  if (loading || isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-accent-green" />
      </div>
    )
  }

  if (!currentUser || !userData) return null

  const { user, profile } = userData
  const isCustomer = user.role === "CUSTOMER"
  const isTransport = user.role === "TRANSPORT"

  return (
    <DashboardLayout navItems={adminNavItems} title="Chi tiết người dùng">
      <div className="space-y-6">
        <AdminBreadcrumbs />

        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Button variant="ghost" size="icon" onClick={() => router.push("/admin/users")}>
              <ArrowLeft className="h-5 w-5" />
            </Button>
            <div>
              <h1 className="text-3xl font-bold tracking-tight">
                {profile
                  ? isCustomer
                    ? (profile as Customer).full_name
                    : isTransport
                      ? (profile as Transport).company_name
                      : (profile as Manager).full_name
                  : user.email}
              </h1>
              <p className="text-muted-foreground mt-1">{user.email}</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm">
              <Edit className="h-4 w-4 mr-2" />
              Chỉnh sửa
            </Button>
            {user.is_active ? (
              <Button variant="outline" size="sm" onClick={handleDeactivate} className="text-error bg-transparent">
                <XCircle className="h-4 w-4 mr-2" />
                Vô hiệu hóa
              </Button>
            ) : (
              <Button variant="outline" size="sm" onClick={handleActivate} className="text-success bg-transparent">
                <CheckCircle className="h-4 w-4 mr-2" />
                Kích hoạt
              </Button>
            )}
          </div>
        </div>

        {/* Overview Cards */}
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">Vai trò</CardTitle>
              <User className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <RoleBadge role={user.role} />
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">Trạng thái</CardTitle>
              <CheckCircle className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <StatusBadge active={user.is_active} />
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">Xác minh</CardTitle>
              <CheckCircle className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <Badge variant={user.is_verified ? "default" : "secondary"}>
                {user.is_verified ? "Đã xác minh" : "Chưa xác minh"}
              </Badge>
            </CardContent>
          </Card>

          {isTransport && (
            <>
              <Card>
                <CardHeader className="flex flex-row items-center justify-between pb-2">
                  <CardTitle className="text-sm font-medium">Chuyến hoàn thành</CardTitle>
                  <Package className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{(profile as Transport).completed_bookings}</div>
                  <p className="text-xs text-muted-foreground">Tổng: {(profile as Transport).total_bookings} chuyến</p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between pb-2">
                  <CardTitle className="text-sm font-medium">Đánh giá</CardTitle>
                  <Star className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{((profile as Transport).average_rating || 0).toFixed(1)}</div>
                  <p className="text-xs text-muted-foreground">Trung bình</p>
                </CardContent>
              </Card>
            </>
          )}
        </div>

        {/* Detailed Information */}
        <Tabs defaultValue="info" className="space-y-4">
          <TabsList>
            <TabsTrigger value="info">Thông tin</TabsTrigger>
            <TabsTrigger value="activity">Hoạt động</TabsTrigger>
            {isTransport && <TabsTrigger value="vehicles">Phương tiện</TabsTrigger>}
            <TabsTrigger value="reviews">Đánh giá</TabsTrigger>
          </TabsList>

          <TabsContent value="info" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Thông tin cơ bản</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid gap-4 md:grid-cols-2">
                  <div className="flex items-start gap-3">
                    <Mail className="h-5 w-5 text-muted-foreground mt-0.5" />
                    <div>
                      <p className="text-sm font-medium">Email</p>
                      <p className="text-sm text-muted-foreground">{user.email}</p>
                    </div>
                  </div>

                  <div className="flex items-start gap-3">
                    <Phone className="h-5 w-5 text-muted-foreground mt-0.5" />
                    <div>
                      <p className="text-sm font-medium">Số điện thoại</p>
                      <p className="text-sm text-muted-foreground">
                        {profile
                          ? isCustomer
                            ? (profile as Customer).phone || "Chưa cập nhật"
                            : isTransport
                              ? (profile as Transport).phone || "Chưa cập nhật"
                              : (profile as Manager).phone || "Chưa cập nhật"
                          : "Chưa cập nhật"}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-start gap-3">
                    <MapPin className="h-5 w-5 text-muted-foreground mt-0.5" />
                    <div>
                      <p className="text-sm font-medium">Địa chỉ</p>
                      <p className="text-sm text-muted-foreground">
                        {profile
                          ? isCustomer
                            ? (profile as Customer).address || "Chưa cập nhật"
                            : isTransport
                              ? (profile as Transport).address || "Chưa cập nhật"
                              : "N/A"
                          : "Chưa cập nhật"}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-start gap-3">
                    <Calendar className="h-5 w-5 text-muted-foreground mt-0.5" />
                    <div>
                      <p className="text-sm font-medium">Ngày tạo</p>
                      <p className="text-sm text-muted-foreground">
                        {(user as any).created_at ? formatDate((user as any).created_at) : "N/A"}
                      </p>
                    </div>
                  </div>
                </div>

                {isTransport && (
                  <div className="pt-4 border-t space-y-4">
                    <h3 className="font-semibold">Thông tin doanh nghiệp</h3>
                    <div className="grid gap-4 md:grid-cols-2">
                      <div>
                        <p className="text-sm font-medium">Giấy phép kinh doanh</p>
                        <p className="text-sm text-muted-foreground">
                          {(profile as Transport).business_license_number}
                        </p>
                      </div>
                      <div>
                        <p className="text-sm font-medium">Mã số thuế</p>
                        <p className="text-sm text-muted-foreground">{(profile as Transport).tax_code}</p>
                      </div>
                      <div>
                        <p className="text-sm font-medium">Trạng thái xác minh</p>
                        <Badge
                          variant={
                            (profile as Transport).verification_status === "APPROVED"
                              ? "default"
                              : (profile as Transport).verification_status === "PENDING"
                                ? "secondary"
                                : "destructive"
                          }
                        >
                          {(profile as Transport).verification_status === "APPROVED"
                            ? "Đã xác minh"
                            : (profile as Transport).verification_status === "PENDING"
                              ? "Chờ xác minh"
                              : "Từ chối"}
                        </Badge>
                      </div>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="activity">
            <Card>
              <CardHeader>
                <CardTitle>Lịch sử hoạt động</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground">Chưa có dữ liệu hoạt động</p>
              </CardContent>
            </Card>
          </TabsContent>

          {isTransport && (
            <TabsContent value="vehicles">
              <Card>
                <CardHeader>
                  <CardTitle>Phương tiện</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-muted-foreground">Chưa có phương tiện nào</p>
                </CardContent>
              </Card>
            </TabsContent>
          )}

          <TabsContent value="reviews">
            <Card>
              <CardHeader>
                <CardTitle>Đánh giá</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground">Chưa có đánh giá nào</p>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </DashboardLayout>
  )
}

