"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { useAuth } from "@/contexts/auth-context"
import { apiClient } from "@/lib/api-client"
import { DashboardLayout } from "@/components/dashboard/dashboard-layout"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { LayoutDashboard, Package, FileText, Truck, Star, Save, AlertCircle, CheckCircle, DollarSign } from "lucide-react"
import { useToast } from "@/hooks/use-toast"

type TransportProfileForm = {
  companyName: string
  businessLicenseNumber: string
  taxCode: string
  phone: string
  address: string
  city: string
  district: string
  ward: string
  verificationStatus: "PENDING" | "APPROVED" | "REJECTED" | string
  verifiedAt: string | null
  nationalIdNumber: string
  nationalIdType: string
  bankCode: string
  bankAccountNumber: string
  bankAccountHolder: string
}

const navItems = [
  { label: "Tổng quan", href: "/transport", icon: "LayoutDashboard" },
  { label: "Công việc", href: "/transport/jobs", icon: "Package" },
  { label: "Báo giá", href: "/transport/quotations", icon: "FileText" },
  { label: "Xe", href: "/transport/vehicles", icon: "Truck" },
  { label: "Giá cước", href: "/transport/pricing/categories", icon: "DollarSign" },
  { label: "Hồ sơ", href: "/transport/profile", icon: "Star" },
]

export default function TransportProfile() {
  const { user, loading } = useAuth()
  const router = useRouter()
  const { toast } = useToast()

  const [saving, setSaving] = useState(false)
  const [profile, setProfile] = useState<TransportProfileForm | null>(null)
  const [profileLoading, setProfileLoading] = useState(true)

  useEffect(() => {
    if (!loading && (!user || user.role !== "TRANSPORT")) {
      router.push("/login")
    }
  }, [user, loading, router])

  useEffect(() => {
    const loadProfile = async () => {
      try {
        setProfileLoading(true)
        const response = await apiClient.getProfile()
        if (!response.transport) {
          toast({
            title: "Không tìm thấy hồ sơ",
            description: "Vui lòng liên hệ hỗ trợ nếu bạn cần cập nhật thông tin.",
            variant: "destructive",
          })
          setProfile(null)
          return
        }

        const transport = response.transport as Record<string, any>
        setProfile({
          companyName: transport.company_name ?? "",
          businessLicenseNumber: transport.business_license_number ?? "",
          taxCode: transport.tax_code ?? "",
          phone: transport.phone ?? "",
          address: transport.address ?? "",
          city: transport.city ?? "",
          district: transport.district ?? "",
          ward: transport.ward ?? "",
          verificationStatus: transport.verification_status ?? "PENDING",
          verifiedAt: transport.verified_at ?? null,
          nationalIdNumber: transport.national_id_number ?? "",
          nationalIdType: transport.national_id_type ?? "",
          bankCode: transport.bank_code ?? "",
          bankAccountNumber: transport.bank_account_number ?? "",
          bankAccountHolder: transport.bank_account_holder ?? "",
        })
      } catch (error) {
        console.error("Failed to load transport profile", error)
        toast({
          title: "Không tải được hồ sơ",
          description: "Không thể lấy thông tin hồ sơ. Vui lòng thử lại sau.",
          variant: "destructive",
        })
        setProfile(null)
      } finally {
        setProfileLoading(false)
      }
    }

    if (!loading && user?.role === "TRANSPORT") {
      void loadProfile()
    }
  }, [user, loading, toast])

  const handleSave = async () => {
    if (!profile) return

    setSaving(true)
    try {
      await apiClient.updateProfile({
        companyName: profile.companyName,
        taxCode: profile.taxCode || undefined,
        phone: profile.phone || undefined,
        address: profile.address || undefined,
        city: profile.city || undefined,
        district: profile.district || undefined,
        ward: profile.ward || undefined,
        bankCode: profile.bankCode || undefined,
        bankAccountNumber: profile.bankAccountNumber || undefined,
        bankAccountHolder: profile.bankAccountHolder || undefined,
      })

      toast({
        title: "Thành công",
        description: "Cập nhật hồ sơ thành công",
      })
    } catch (error) {
      console.error("Failed to update transport profile", error)
      toast({
        title: "Lỗi",
        description: "Không thể cập nhật hồ sơ",
        variant: "destructive",
      })
    } finally {
      setSaving(false)
    }
  }

  if (loading || profileLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-accent-green" />
      </div>
    )
  }

  if (!user || user.role !== "TRANSPORT") {
    return null
  }

  if (!profile) {
    return (
      <DashboardLayout navItems={navItems} title="Hồ sơ công ty">
        <div className="max-w-4xl mx-auto px-6 py-10">
          <Card>
            <CardHeader>
              <CardTitle>Không thấy hồ sơ vận chuyển</CardTitle>
              <CardDescription>
                Không thể lấy thông tin hồ sơ. Vui lòng thử tải lại trang hoặc liên hệ hỗ trợ của Home Express.
              </CardDescription>
            </CardHeader>
            <CardContent className="flex items-center gap-3 text-muted-foreground">
              <AlertCircle className="h-5 w-5 text-destructive" />
              <span>Không có dữ liệu hiện có.</span>
            </CardContent>
          </Card>
        </div>
      </DashboardLayout>
    )
  }

  const verificationDate = profile.verifiedAt ? new Date(profile.verifiedAt).toLocaleDateString("vi-VN") : null

  return (
    <DashboardLayout navItems={navItems} title="Hồ sơ công ty">
      <div className="max-w-7xl mx-auto px-6 py-10 space-y-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Hồ sơ công ty</h1>
          <p className="text-muted-foreground mt-1">Quản lý thông tin công ty và tài khoản ngân hàng</p>
        </div>

        <Card className="hover:shadow-md transition-shadow">
          <CardHeader>
            <CardTitle>Trạng thái xác minh</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-4">
              {profile.verificationStatus === "APPROVED" && (
                <>
                  <div className="p-3 bg-success/10 rounded-lg">
                    <CheckCircle className="h-6 w-6 text-success" />
                  </div>
                  <div className="flex-1">
                    <p className="font-semibold text-success">Đã xác minh</p>
                    <p className="text-sm text-muted-foreground">
                      Công ty của bạn đã được xác minh
                      {verificationDate ? ` vào ${verificationDate}` : ""}
                    </p>
                  </div>
                </>
              )}

              {profile.verificationStatus === "PENDING" && (
                <>
                  <div className="p-3 bg-amber-100 rounded-lg">
                    <AlertCircle className="h-6 w-6 text-amber-500" />
                  </div>
                  <div className="flex-1">
                    <p className="font-semibold text-amber-600">Đang chờ xác minh</p>
                    <p className="text-sm text-muted-foreground">
                      Hồ sơ của bạn đang được nhân viên Home Express kiểm tra. Vui lòng theo dõi email để nắm thông tin.
                    </p>
                  </div>
                </>
              )}

              {profile.verificationStatus === "REJECTED" && (
                <>
                  <div className="p-3 bg-destructive/10 rounded-lg">
                    <AlertCircle className="h-6 w-6 text-destructive" />
                  </div>
                  <div className="flex-1">
                    <p className="font-semibold text-destructive">Bị từ chối</p>
                    <p className="text-sm text-muted-foreground">
                      Hồ sơ của bạn chưa được xác minh. Vui lòng kiểm tra email để biết lý do và gửi lại thông tin cần thiết.
                    </p>
                  </div>
                </>
              )}
            </div>
          </CardContent>
        </Card>

        <Card className="hover:shadow-md transition-shadow">
          <CardHeader>
            <CardTitle>Thông tin công ty</CardTitle>
            <CardDescription>Cập nhật thông tin pháp lý và thông tin liên hệ</CardDescription>
          </CardHeader>
          <CardContent className="grid gap-6 md:grid-cols-2">
            <div className="space-y-3">
              <div className="space-y-2">
                <Label>Tên công ty</Label>
                <Input
                  value={profile.companyName}
                  onChange={(event) => setProfile({ ...profile, companyName: event.target.value })}
                  className="h-11"
                />
              </div>
              <div className="space-y-2">
                <Label>Số đăng ký kinh doanh</Label>
                <Input value={profile.businessLicenseNumber} disabled className="h-11 bg-muted" />
              </div>
              <div className="space-y-2">
                <Label>Mã số thuế</Label>
                <Input
                  value={profile.taxCode}
                  onChange={(event) => setProfile({ ...profile, taxCode: event.target.value })}
                  className="h-11"
                />
              </div>
            </div>

            <div className="space-y-3">
              <div className="space-y-2">
                <Label>
                  Trạng thái xác minh
                  <Badge
                    variant={
                      profile.verificationStatus === "APPROVED"
                        ? "default"
                        : profile.verificationStatus === "PENDING"
                          ? "secondary"
                          : "destructive"
                    }
                    className="ml-2"
                  >
                    {profile.verificationStatus === "APPROVED" && "Đã xác minh"}
                    {profile.verificationStatus === "PENDING" && "Đang chờ"}
                    {profile.verificationStatus === "REJECTED" && "Bị từ chối"}
                    {!["APPROVED", "PENDING", "REJECTED"].includes(profile.verificationStatus) &&
                      profile.verificationStatus}
                  </Badge>
                </Label>
                <p className="text-sm text-muted-foreground">
                  Nhận thông tin xác minh vào email: <span className="font-medium">{user.email}</span>
                </p>
                {verificationDate && (
                  <p className="text-sm text-muted-foreground">Xác minh vào ngày {verificationDate}</p>
                )}
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="hover:shadow-md transition-shadow">
          <CardHeader>
            <CardTitle>Thông tin liên hệ</CardTitle>
            <CardDescription>Cập nhật số điện thoại và địa chỉ</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="phone">Số điện thoại</Label>
                <Input
                  id="phone"
                  value={profile.phone}
                  onChange={(event) => setProfile({ ...profile, phone: event.target.value })}
                  className="h-11"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="address">Địa chỉ</Label>
                <Input
                  id="address"
                  value={profile.address}
                  onChange={(event) => setProfile({ ...profile, address: event.target.value })}
                  className="h-11"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label htmlFor="city">Thành phố</Label>
                <Input
                  id="city"
                  value={profile.city}
                  onChange={(event) => setProfile({ ...profile, city: event.target.value })}
                  className="h-11"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="district">Quận/Huyện</Label>
                <Input
                  id="district"
                  value={profile.district}
                  onChange={(event) => setProfile({ ...profile, district: event.target.value })}
                  className="h-11"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="ward">Phường/Xã</Label>
                <Input
                  id="ward"
                  value={profile.ward}
                  onChange={(event) => setProfile({ ...profile, ward: event.target.value })}
                  className="h-11"
                />
              </div>
            </div>

            <Separator />

            <div className="flex justify-end">
              <Button onClick={handleSave} disabled={saving} className="bg-accent-green hover:bg-accent-green-dark">
                <Save className="mr-2 h-4 w-4" />
                {saving ? "Đang lưu..." : "Lưu thay đổi"}
              </Button>
            </div>
          </CardContent>
        </Card>

        <Card className="hover:shadow-md transition-shadow">
          <CardHeader>
            <CardTitle>Tài khoản ngân hàng</CardTitle>
            <CardDescription>Thông tin nhận thanh toán</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="bank_code">Ngân hàng</Label>
                <Input
                  id="bank_code"
                  value={profile.bankCode}
                  onChange={(event) => setProfile({ ...profile, bankCode: event.target.value })}
                  placeholder="VCB, TCB, ACB..."
                  className="h-11"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="bank_account_number">Số tài khoản</Label>
                <Input
                  id="bank_account_number"
                  value={profile.bankAccountNumber}
                  onChange={(event) => setProfile({ ...profile, bankAccountNumber: event.target.value })}
                  className="h-11"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="bank_account_holder">Tên chủ tài khoản</Label>
              <Input
                id="bank_account_holder"
                value={profile.bankAccountHolder}
                onChange={(event) => setProfile({ ...profile, bankAccountHolder: event.target.value })}
                placeholder="NGUYEN VAN A"
                className="h-11"
              />
            </div>

            <Separator />

            <div className="flex justify-end">
              <Button onClick={handleSave} disabled={saving} className="bg-accent-green hover:bg-accent-green-dark">
                <Save className="mr-2 h-4 w-4" />
                {saving ? "Đang lưu..." : "Lưu thay đổi"}
              </Button>
            </div>
          </CardContent>
        </Card>

        <Card className="hover:shadow-md transition-shadow">
          <CardHeader>
            <CardTitle>Giấy tờ tùy thân</CardTitle>
            <CardDescription>CMND/CCCD của người đại diện</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="national_id_type">Loại giấy tờ</Label>
                <Input id="national_id_type" value={profile.nationalIdType} disabled className="h-11 bg-muted" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="national_id_number">Số CMND/CCCD</Label>
                <Input id="national_id_number" value={profile.nationalIdNumber} disabled className="h-11 bg-muted" />
              </div>
            </div>
            <p className="text-xs text-muted-foreground">
              Thông tin giấy tờ tùy thân không thể thay đổi. Vui lòng liên hệ hỗ trợ nếu cần cập nhật.
            </p>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  )
}

