"use client"

import { useState, useEffect } from "react"
import { useRouter, useParams } from "next/navigation"
import { DashboardLayout } from "@/components/dashboard/dashboard-layout"
import { AdminBreadcrumbs } from "@/components/admin/admin-breadcrumbs"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { AlertTriangle, ArrowLeft, Loader2 } from "lucide-react"
import { apiClient } from "@/lib/api-client"
import { useAuth } from "@/contexts/auth-context"
import { adminNavItems } from "@/lib/admin-nav-config"
import { Skeleton } from "@/components/ui/skeleton"
import { useToast } from "@/hooks/use-toast"
import { logAuditAction } from "@/lib/audit-logger"
import type { ExceptionWithDetails } from "@/types"

export default function ExceptionDetailPage() {
  const router = useRouter()
  const params = useParams()
  const exceptionId = Number.parseInt(params.id as string)
  const { user, loading: authLoading } = useAuth()
  const { toast } = useToast()

  const [loading, setLoading] = useState(true)
  const [updating, setUpdating] = useState(false)
  const [exception, setException] = useState<ExceptionWithDetails | null>(null)
  const [status, setStatus] = useState<string>("")
  const [resolutionNotes, setResolutionNotes] = useState("")

  useEffect(() => {
    if (!authLoading && (!user || user.role !== "MANAGER")) {
      router.push("/login")
    }
  }, [user, authLoading, router])

  useEffect(() => {
    if (!user || user.role !== "MANAGER") return

    const fetchException = async () => {
      try {
        setLoading(true)
        const response = await apiClient.getException(exceptionId)
        setException(response.data)
        setStatus(response.data.status)
        setResolutionNotes(response.data.resolution_notes || "")
      } catch (error) {
        console.error("Failed to fetch exception:", error)
      } finally {
        setLoading(false)
      }
    }

    fetchException()
  }, [user, exceptionId])

  const handleUpdate = async () => {
    if (!exception) return

    try {
      setUpdating(true)
      await apiClient.updateException(exception.exception_id, {
        status,
        resolutionNotes: resolutionNotes || undefined,
      })

      await logAuditAction({
        action: "EXCEPTION_UPDATED",
        target_type: "EXCEPTION",
        target_id: exceptionId,
        details: { status, notes: resolutionNotes }
      })

      toast({
        title: "Thành công",
        description: "Cập nhật ngoại lệ thành công",
      })
      router.push("/admin/exceptions")
    } catch (error: any) {
      toast({
        title: "Lỗi",
        description: error.message || "Không thể cập nhật ngoại lệ",
        variant: "destructive",
      })
    } finally {
      setUpdating(false)
    }
  }

  if (authLoading || !user || loading) {
    return (
      <DashboardLayout navItems={adminNavItems} title="Chi tiết Ngoại lệ">
        <div className="space-y-6">
          <Skeleton className="h-8 w-64" />
          <Skeleton className="h-96 w-full" />
        </div>
      </DashboardLayout>
    )
  }

  if (!exception) {
    return (
      <DashboardLayout navItems={adminNavItems} title="Chi tiết Ngoại lệ">
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <AlertTriangle className="h-12 w-12 text-muted-foreground mb-4" />
            <p className="text-lg font-medium">Không tìm thấy ngoại lệ</p>
            <Button onClick={() => router.push("/admin/exceptions")} className="mt-4">
              Quay lại danh sách
            </Button>
          </CardContent>
        </Card>
      </DashboardLayout>
    )
  }

  return (
    <DashboardLayout navItems={adminNavItems} title="Chi tiết Ngoại lệ">
      <div className="space-y-6">
        <AdminBreadcrumbs />

        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={() => router.push("/admin/exceptions")}>
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div>
            <h1 className="text-3xl font-bold">Chi tiết Ngoại lệ</h1>
            <p className="text-muted-foreground">Exception #{exception.exception_id}</p>
          </div>
        </div>

        <div className="grid gap-6 md:grid-cols-3">
          <div className="md:col-span-2 space-y-6">
            <Card>
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div>
                    <CardTitle>{exception.title}</CardTitle>
                    <CardDescription>Loại: {exception.type}</CardDescription>
                  </div>
                  <div className="flex gap-2">
                    <Badge
                      variant={
                        exception.priority === "URGENT" || exception.priority === "HIGH" ? "destructive" : "default"
                      }
                    >
                      {exception.priority}
                    </Badge>
                    <Badge>{exception.status}</Badge>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <h3 className="font-semibold mb-2">Mô tả</h3>
                  <p className="text-muted-foreground">{exception.description}</p>
                </div>

                {exception.booking_info && (
                  <div>
                    <h3 className="font-semibold mb-2">Thông tin Booking</h3>
                    <div className="space-y-1 text-sm">
                      <p>
                        <span className="font-medium">Booking ID:</span> #{exception.booking_info.booking_id}
                      </p>
                      <p>
                        <span className="font-medium">Khách hàng:</span> {exception.booking_info.customer_name}
                      </p>
                      {exception.booking_info.transport_name && (
                        <p>
                          <span className="font-medium">Vận chuyển:</span> {exception.booking_info.transport_name}
                        </p>
                      )}
                      <p>
                        <span className="font-medium">Điểm đón:</span> {exception.booking_info.pickup_location}
                      </p>
                      <p>
                        <span className="font-medium">Điểm giao:</span> {exception.booking_info.delivery_location}
                      </p>
                    </div>
                  </div>
                )}

                {exception.metadata && (
                  <div>
                    <h3 className="font-semibold mb-2">Metadata</h3>
                    <pre className="text-xs bg-muted p-4 rounded-lg overflow-auto">
                      {JSON.stringify(exception.metadata, null, 2)}
                    </pre>
                  </div>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Xử lý Ngoại lệ</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium">Trạng thái</label>
                  <Select value={status} onValueChange={setStatus}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="PENDING">Chờ xử lý</SelectItem>
                      <SelectItem value="IN_PROGRESS">Đang xử lý</SelectItem>
                      <SelectItem value="RESOLVED">Đã giải quyết</SelectItem>
                      <SelectItem value="ESCALATED">Đã leo thang</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium">Ghi chú giải quyết</label>
                  <Textarea
                    value={resolutionNotes}
                    onChange={(e) => setResolutionNotes(e.target.value)}
                    placeholder="Nhập ghi chú về cách giải quyết ngoại lệ..."
                    rows={5}
                  />
                </div>

                <Button onClick={handleUpdate} disabled={updating} className="w-full">
                  {updating && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  Cập nhật Ngoại lệ
                </Button>
              </CardContent>
            </Card>
          </div>

          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Thông tin</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4 text-sm">
                <div>
                  <p className="text-muted-foreground">Tạo lúc</p>
                  <p className="font-medium">{new Date(exception.created_at).toLocaleString("vi-VN")}</p>
                </div>

                {exception.assigned_to_name && (
                  <div>
                    <p className="text-muted-foreground">Phụ trách</p>
                    <p className="font-medium">{exception.assigned_to_name}</p>
                  </div>
                )}

                {exception.resolved_at && (
                  <div>
                    <p className="text-muted-foreground">Giải quyết lúc</p>
                    <p className="font-medium">{new Date(exception.resolved_at).toLocaleString("vi-VN")}</p>
                  </div>
                )}

                {exception.resolved_by_name && (
                  <div>
                    <p className="text-muted-foreground">Giải quyết bởi</p>
                    <p className="font-medium">{exception.resolved_by_name}</p>
                  </div>
                )}
              </CardContent>
            </Card>

            {exception.booking_info && (
              <Card>
                <CardHeader>
                  <CardTitle>Hành động nhanh</CardTitle>
                </CardHeader>
                <CardContent className="space-y-2">
                  <Button
                    variant="outline"
                    className="w-full justify-start bg-transparent"
                    onClick={() => router.push(`/admin/bookings/${exception.booking_info?.booking_id}`)}
                  >
                    Xem Booking
                  </Button>
                  {exception.incident_id && (
                    <Button
                      variant="outline"
                      className="w-full justify-start bg-transparent"
                      onClick={() => router.push(`/admin/incidents/${exception.incident_id}`)}
                    >
                      Xem Sự cố
                    </Button>
                  )}
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      </div>
    </DashboardLayout>
  )
}
