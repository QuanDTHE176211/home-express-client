"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { useAuth } from "@/contexts/auth-context"
import { useLanguage } from "@/contexts/language-context"
import { DashboardLayout } from "@/components/dashboard/dashboard-layout"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import { Separator } from "@/components/ui/separator"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import {
  LayoutDashboard,
  Package,
  FileText,
  Truck,
  Star,
  DollarSign,
  User,
  Bell,
  Shield,
  CreditCard,
  Save,
  Eye,
  EyeOff,
  Palette,
} from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import { apiClient } from "@/lib/api-client"

const navItems = [
  { label: "Tổng quan", href: "/transport", icon: "LayoutDashboard" },
  { label: "Công việc", href: "/transport/jobs", icon: "Package" },
  { label: "Báo giá", href: "/transport/quotations", icon: "FileText" },
  { label: "Xe", href: "/transport/vehicles", icon: "Truck" },
  { label: "Giá cả", href: "/transport/pricing/categories", icon: "DollarSign" },
  { label: "Hồ sơ", href: "/transport/profile", icon: "Star" },
]

export default function TransportSettingsPage() {
  const { user, loading } = useAuth()
  const router = useRouter()
  const { toast } = useToast()
  const { t } = useLanguage()

  const [saving, setSaving] = useState(false)
  const [loadingSettings, setLoadingSettings] = useState(true)
  const [showCurrentPassword, setShowCurrentPassword] = useState(false)
  const [showNewPassword, setShowNewPassword] = useState(false)

  // Account settings
  const [fullName, setFullName] = useState("")
  const [phone, setPhone] = useState("")

  // Password settings
  const [currentPassword, setCurrentPassword] = useState("")
  const [newPassword, setNewPassword] = useState("")
  const [confirmPassword, setConfirmPassword] = useState("")

  // Notification settings
  const [emailNotifications, setEmailNotifications] = useState(true)
  const [newJobAlerts, setNewJobAlerts] = useState(true)
  const [quotationUpdates, setQuotationUpdates] = useState(true)
  const [paymentNotifications, setPaymentNotifications] = useState(true)
  const [reviewNotifications, setReviewNotifications] = useState(true)

  // Business settings
  const [autoAcceptJobs, setAutoAcceptJobs] = useState(false)
  const [serviceRadius, setServiceRadius] = useState("10")
  const [minJobValue, setMinJobValue] = useState("0")
  const [responseTime, setResponseTime] = useState("2")

  // Payment settings
  const [bankName, setBankName] = useState("")
  const [bankAccountNumber, setBankAccountNumber] = useState("")
  const [bankAccountHolder, setBankAccountHolder] = useState("")
  const [taxCode, setTaxCode] = useState("")

  useEffect(() => {
    if (!loading && (!user || user.role !== "TRANSPORT")) {
      router.push("/login")
    }
  }, [user, loading, router])

  // Load persisted transport profile + settings
  useEffect(() => {
    let active = true

    const load = async () => {
      if (!user || user.role !== "TRANSPORT") {
        setLoadingSettings(false)
        return
      }

      setLoadingSettings(true)

      try {
        const [profile, settings] = await Promise.all([apiClient.getProfile(), apiClient.getTransportSettings()])
        if (!active) return

        const transportProfile = profile.transport
        if (transportProfile) {
          setFullName(transportProfile.company_name ?? "")
          setPhone(transportProfile.phone ?? "")
          setBankName(transportProfile.bank_name ?? "")
          setBankAccountNumber(transportProfile.bank_account_number ?? "")
          setBankAccountHolder(transportProfile.bank_account_holder ?? "")
          setTaxCode(transportProfile.tax_code ?? "")
        }

        setAutoAcceptJobs(settings.autoAcceptJobs)
        setServiceRadius(String(settings.searchRadiusKm))
        setMinJobValue(String(settings.minJobValueVnd))
        setResponseTime(String(settings.responseTimeHours))
        setEmailNotifications(settings.emailNotifications)
        setNewJobAlerts(settings.newJobAlerts)
        setQuotationUpdates(settings.quotationUpdates)
        setPaymentNotifications(settings.paymentNotifications)
        setReviewNotifications(settings.reviewNotifications)
      } catch (error) {
        if (active) {
          toast({
            title: "Loi",
            description: "Khong the tai cai dat doanh nghiep.",
            variant: "destructive",
          })
        }
      } finally {
        if (active) {
          setLoadingSettings(false)
        }
      }
    }

    load()
    return () => {
      active = false
    }
  }, [user, toast])


  const handleSaveAccount = async () => {
    setSaving(true)
    try {
      await apiClient.updateProfile({
        company_name: fullName || undefined,
        phone: phone || undefined,
      })
      toast({
        title: "Da luu thong tin tai khoan",
        description: "Thong tin tai khoan cua ban da duoc cap nhat.",
      })
    } catch (error) {
      toast({
        title: "Loi",
        description: error instanceof Error ? error.message : "Khong the cap nhat thong tin tai khoan. Vui long thu lai.",
        variant: "destructive",
      })
    } finally {
      setSaving(false)
    }
  }

  const handleChangePassword = async () => {
    if (newPassword !== confirmPassword) {
      toast({
        title: "Loi",
        description: "Mat khau xac nhan khong khop.",
        variant: "destructive",
      })
      return
    }

    if (newPassword.length < 8) {
      toast({
        title: "Loi",
        description: "Mat khau phai co it nhat 8 ky tu.",
        variant: "destructive",
      })
      return
    }

    setSaving(true)
    try {
      await apiClient.changePassword(currentPassword, newPassword)
      setCurrentPassword("")
      setNewPassword("")
      setConfirmPassword("")
      toast({
        title: "Da doi mat khau",
        description: "Mat khau cua ban da duoc cap nhat.",
      })
    } catch (error) {
      toast({
        title: "Loi",
        description: error instanceof Error ? error.message : "Khong the doi mat khau. Vui long thu lai.",
        variant: "destructive",
      })
    } finally {
      setSaving(false)
    }
  }

  const handleSaveNotifications = async () => {
    setSaving(true)
    try {
      await apiClient.updateTransportSettings({
        emailNotifications,
        newJobAlerts,
        quotationUpdates,
        paymentNotifications,
        reviewNotifications,
      })
      toast({
        title: "Da luu cai dat thong bao",
        description: "Cai dat thong bao da duoc cap nhat.",
      })
    } catch (error) {
      toast({
        title: "Loi",
        description: error instanceof Error ? error.message : "Khong the cap nhat thong bao. Vui long thu lai.",
        variant: "destructive",
      })
    } finally {
      setSaving(false)
    }
  }

  const handleSaveBusiness = async () => {
    setSaving(true)
    try {
      await apiClient.updateTransportSettings({
        autoAcceptJobs,
        searchRadiusKm: Number(serviceRadius) || 0,
        minJobValueVnd: Number(minJobValue) || 0,
        responseTimeHours: Number(responseTime) || 0,
      })
      toast({
        title: "Da luu cai dat kinh doanh",
        description: "Cai dat dich vu van chuyen da duoc cap nhat.",
      })
    } catch (error) {
      toast({
        title: "Loi",
        description: error instanceof Error ? error.message : "Khong the cap nhat cai dat kinh doanh.",
        variant: "destructive",
      })
    } finally {
      setSaving(false)
    }
  }

  const handleSavePayment = async () => {
    setSaving(true)
    try {
      await apiClient.updateProfile({
        bank_name: bankName || undefined,
        bank_account_number: bankAccountNumber || undefined,
        bank_account_holder: bankAccountHolder || undefined,
        tax_code: taxCode || undefined,
      })
      toast({
        title: "Da luu thong tin thanh toan",
        description: "Thong tin ngan hang da duoc cap nhat.",
      })
    } catch (error) {
      toast({
        title: "Loi",
        description: error instanceof Error ? error.message : "Khong the cap nhat thong tin thanh toan.",
        variant: "destructive",
      })
    } finally {
      setSaving(false)
    }
  }

  if (loading || loadingSettings) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-accent-green" />
      </div>
    )
  }

  if (!user) return null

  return (
    <DashboardLayout navItems={navItems} title="Cài đặt">
      <div className="max-w-7xl mx-auto px-6 py-10 space-y-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Cài đặt</h1>
          <p className="text-muted-foreground mt-1">Quản lý cài đặt tài khoản và dịch vụ vận chuyển</p>
        </div>

        <Tabs defaultValue="account" className="space-y-6">
          <TabsList className="grid w-full grid-cols-3 lg:grid-cols-6">
            <TabsTrigger value="account" className="gap-2">
              <User className="h-4 w-4" />
              <span className="hidden sm:inline">Tài khoản</span>
            </TabsTrigger>
            <TabsTrigger value="notifications" className="gap-2">
              <Bell className="h-4 w-4" />
              <span className="hidden sm:inline">Thông báo</span>
            </TabsTrigger>
            <TabsTrigger value="business" className="gap-2">
              <Truck className="h-4 w-4" />
              <span className="hidden sm:inline">Kinh doanh</span>
            </TabsTrigger>
            <TabsTrigger value="payment" className="gap-2">
              <CreditCard className="h-4 w-4" />
              <span className="hidden sm:inline">Thanh toán</span>
            </TabsTrigger>
            <TabsTrigger value="appearance" className="gap-2">
              <Palette className="h-4 w-4" />
              <span className="hidden sm:inline">Giao diện</span>
            </TabsTrigger>
            <TabsTrigger value="security" className="gap-2">
              <Shield className="h-4 w-4" />
              <span className="hidden sm:inline">Bảo mật</span>
            </TabsTrigger>
          </TabsList>

          {/* Account Settings Tab */}
          <TabsContent value="account" className="space-y-6">
            <Card className="transition-shadow hover:shadow-md">
              <CardHeader>
                <CardTitle>Thông tin tài khoản</CardTitle>
                <CardDescription>Cập nhật thông tin cá nhân của bạn</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="fullName">Họ và tên</Label>
                  <Input
                    id="fullName"
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    className="h-11"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="email">Email</Label>
                  <Input id="email" type="email" value={user?.email} disabled className="h-11 bg-muted" />
                  <p className="text-xs text-muted-foreground">Email không thể thay đổi</p>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="phone">Số điện thoại</Label>
                  <Input id="phone" value={phone} onChange={(e) => setPhone(e.target.value)} className="h-11" />
                </div>

                <Separator />

                <div className="flex justify-end">
                  <Button
                    onClick={handleSaveAccount}
                    disabled={saving}
                    className="bg-accent-green hover:bg-accent-green-dark"
                  >
                    <Save className="mr-2 h-4 w-4" />
                    {saving ? "Đang lưu..." : "Lưu thay đổi"}
                  </Button>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Notifications Tab */}
          <TabsContent value="notifications" className="space-y-6">
            <Card className="transition-shadow hover:shadow-md">
              <CardHeader>
                <CardTitle>Thông báo</CardTitle>
                <CardDescription>Quản lý các thông báo bạn nhận</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label htmlFor="email-notifications">Thông báo qua Email</Label>
                    <p className="text-sm text-muted-foreground">Nhận tất cả thông báo qua email</p>
                  </div>
                  <Switch
                    id="email-notifications"
                    checked={emailNotifications}
                    onCheckedChange={setEmailNotifications}
                  />
                </div>
                <Separator />
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label htmlFor="new-job-alerts">Công việc mới</Label>
                    <p className="text-sm text-muted-foreground">Thông báo khi có công việc mới phù hợp</p>
                  </div>
                  <Switch id="new-job-alerts" checked={newJobAlerts} onCheckedChange={setNewJobAlerts} />
                </div>
                <Separator />
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label htmlFor="quotation-updates">Cập nhật báo giá</Label>
                    <p className="text-sm text-muted-foreground">Thông báo về trạng thái báo giá của bạn</p>
                  </div>
                  <Switch id="quotation-updates" checked={quotationUpdates} onCheckedChange={setQuotationUpdates} />
                </div>
                <Separator />
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label htmlFor="payment-notifications">Thanh toán</Label>
                    <p className="text-sm text-muted-foreground">Thông báo về thanh toán và thu nhập</p>
                  </div>
                  <Switch
                    id="payment-notifications"
                    checked={paymentNotifications}
                    onCheckedChange={setPaymentNotifications}
                  />
                </div>
                <Separator />
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label htmlFor="review-notifications">Đánh giá</Label>
                    <p className="text-sm text-muted-foreground">Thông báo khi nhận được đánh giá mới</p>
                  </div>
                  <Switch
                    id="review-notifications"
                    checked={reviewNotifications}
                    onCheckedChange={setReviewNotifications}
                  />
                </div>

                <Separator />

                <div className="flex justify-end">
                  <Button
                    onClick={handleSaveNotifications}
                    disabled={saving}
                    className="bg-accent-green hover:bg-accent-green-dark"
                  >
                    <Save className="mr-2 h-4 w-4" />
                    {saving ? "Đang lưu..." : "Lưu thay đổi"}
                  </Button>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Business Settings Tab */}
          <TabsContent value="business" className="space-y-6">
            <Card className="transition-shadow hover:shadow-md">
              <CardHeader>
                <CardTitle>Cài đặt dịch vụ</CardTitle>
                <CardDescription>Cấu hình dịch vụ vận chuyển của bạn</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label htmlFor="auto-accept">Tự động chấp nhận công việc</Label>
                    <p className="text-sm text-muted-foreground">Tự động chấp nhận công việc phù hợp với tiêu chí</p>
                  </div>
                  <Switch id="auto-accept" checked={autoAcceptJobs} onCheckedChange={setAutoAcceptJobs} />
                </div>
                <Separator />
                <div className="space-y-2">
                  <Label htmlFor="service-radius">Bán kính phục vụ (km)</Label>
                  <Input
                    id="service-radius"
                    type="number"
                    value={serviceRadius}
                    onChange={(e) => setServiceRadius(e.target.value)}
                    className="h-11"
                  />
                  <p className="text-xs text-muted-foreground">Khoảng cách tối đa bạn sẵn sàng phục vụ</p>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="min-job-value">Giá trị công việc tối thiểu (VNĐ)</Label>
                  <Input
                    id="min-job-value"
                    type="number"
                    value={minJobValue}
                    onChange={(e) => setMinJobValue(e.target.value)}
                    className="h-11"
                  />
                  <p className="text-xs text-muted-foreground">Chỉ nhận công việc có giá trị từ mức này trở lên</p>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="response-time">Thời gian phản hồi (giờ)</Label>
                  <Select value={responseTime} onValueChange={setResponseTime}>
                    <SelectTrigger id="response-time" className="h-11">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="1">1 giờ</SelectItem>
                      <SelectItem value="2">2 giờ</SelectItem>
                      <SelectItem value="4">4 giờ</SelectItem>
                      <SelectItem value="8">8 giờ</SelectItem>
                      <SelectItem value="24">24 giờ</SelectItem>
                    </SelectContent>
                  </Select>
                  <p className="text-xs text-muted-foreground">Thời gian cam kết phản hồi báo giá</p>
                </div>

                <Separator />

                <div className="flex justify-end">
                  <Button
                    onClick={handleSaveBusiness}
                    disabled={saving}
                    className="bg-accent-green hover:bg-accent-green-dark"
                  >
                    <Save className="mr-2 h-4 w-4" />
                    {saving ? "Đang lưu..." : "Lưu thay đổi"}
                  </Button>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Payment Settings Tab */}
          <TabsContent value="payment" className="space-y-6">
            <Card className="transition-shadow hover:shadow-md">
              <CardHeader>
                <CardTitle>Thông tin thanh toán</CardTitle>
                <CardDescription>Cập nhật thông tin nhận thanh toán</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="bank-name">Ngân hàng</Label>
                  <Input
                    id="bank-name"
                    value={bankName}
                    onChange={(e) => setBankName(e.target.value)}
                    className="h-11"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="bank-account-number">Số tài khoản</Label>
                  <Input
                    id="bank-account-number"
                    value={bankAccountNumber}
                    onChange={(e) => setBankAccountNumber(e.target.value)}
                    className="h-11"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="bank-account-holder">Tên chủ tài khoản</Label>
                  <Input
                    id="bank-account-holder"
                    value={bankAccountHolder}
                    onChange={(e) => setBankAccountHolder(e.target.value)}
                    placeholder="NGUYEN VAN A"
                    className="h-11"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="tax-code">Mã số thuế</Label>
                  <Input id="tax-code" value={taxCode} onChange={(e) => setTaxCode(e.target.value)} className="h-11" />
                </div>

                <Separator />

                <div className="flex justify-end">
                  <Button
                    onClick={handleSavePayment}
                    disabled={saving}
                    className="bg-accent-green hover:bg-accent-green-dark"
                  >
                    <Save className="mr-2 h-4 w-4" />
                    {saving ? "Đang lưu..." : "Lưu thay đổi"}
                  </Button>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Appearance Tab */}
          <TabsContent value="appearance" className="space-y-6">
            <Card className="transition-shadow hover:shadow-md">
              <CardHeader>
                <CardTitle>Giao diện</CardTitle>
                <CardDescription>Tùy chỉnh giao diện hệ thống</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="language">Ngôn ngữ</Label>
                  <Select value="vi" disabled>
                    <SelectTrigger id="language" className="h-11">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="vi">Tiếng Việt</SelectItem>
                      <SelectItem value="en">English</SelectItem>
                    </SelectContent>
                  </Select>
                  <p className="text-xs text-muted-foreground">Hiện tại chỉ hỗ trợ Tiếng Việt</p>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Security Tab */}
          <TabsContent value="security" className="space-y-6">
            <Card className="transition-shadow hover:shadow-md">
              <CardHeader>
                <CardTitle>Đổi mật khẩu</CardTitle>
                <CardDescription>Cập nhật mật khẩu của bạn để bảo mật tài khoản</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="current-password">Mật khẩu hiện tại</Label>
                  <div className="relative">
                    <Input
                      id="current-password"
                      type={showCurrentPassword ? "text" : "password"}
                      value={currentPassword}
                      onChange={(e) => setCurrentPassword(e.target.value)}
                      placeholder="••••••••"
                      className="h-11 pr-10"
                    />
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      className="absolute right-0 top-0 h-full px-3 hover:bg-transparent"
                      onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                    >
                      {showCurrentPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </Button>
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="new-password">Mật khẩu mới</Label>
                  <div className="relative">
                    <Input
                      id="new-password"
                      type={showNewPassword ? "text" : "password"}
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                      placeholder="••••••••"
                      className="h-11 pr-10"
                    />
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      className="absolute right-0 top-0 h-full px-3 hover:bg-transparent"
                      onClick={() => setShowNewPassword(!showNewPassword)}
                    >
                      {showNewPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </Button>
                  </div>
                  <p className="text-xs text-muted-foreground">Mật khẩu phải có ít nhất 8 ký tự</p>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="confirm-password">Xác nhận mật khẩu mới</Label>
                  <Input
                    id="confirm-password"
                    type="password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder="••••••••"
                    className="h-11"
                  />
                </div>

                <Separator />

                <div className="flex justify-end">
                  <Button
                    onClick={handleChangePassword}
                    disabled={saving || !currentPassword || !newPassword || !confirmPassword}
                    variant="outline"
                  >
                    Đổi mật khẩu
                  </Button>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </DashboardLayout>
  )
}







