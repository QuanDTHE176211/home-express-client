"use client"

import { useCallback, useEffect, useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { useToast } from "@/hooks/use-toast"
import { apiClient } from "@/lib/api-client"
import { Loader2 } from "lucide-react"

interface EmailPreferencesData {
  email_booking_updates: boolean
  email_quotations: boolean
  email_payments: boolean
  email_reviews: boolean
  email_marketing: boolean
  push_booking_updates: boolean
  push_quotations: boolean
  push_payments: boolean
  push_reviews: boolean
  quiet_hours_enabled: boolean
  quiet_hours_start: string | null
  quiet_hours_end: string | null
}

export function EmailPreferences() {
  const { toast } = useToast()
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [preferences, setPreferences] = useState<EmailPreferencesData>({
    email_booking_updates: true,
    email_quotations: true,
    email_payments: true,
    email_reviews: true,
    email_marketing: false,
    push_booking_updates: true,
    push_quotations: true,
    push_payments: true,
    push_reviews: true,
    quiet_hours_enabled: false,
    quiet_hours_start: null,
    quiet_hours_end: null,
  })

  const fetchPreferences = useCallback(async () => {
    setLoading(true)
    try {
      const response = await apiClient.getNotificationPreferences()
      if (response.success) {
        setPreferences(response.data)
      }
    } catch (error: any) {
      toast({
        title: "Lỗi",
        description: error.message || "Không thể tải cài đặt thông báo",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }, [toast])

  useEffect(() => {
    fetchPreferences()
  }, [fetchPreferences])

  const handleSave = async () => {
    setSaving(true)
    try {
      const response = await apiClient.updateNotificationPreferences(preferences)
      if (response.success) {
        toast({
          title: "Thành công",
          description: "Đã lưu cài đặt thông báo",
        })
      }
    } catch (error: any) {
      toast({
        title: "Lỗi",
        description: error.message || "Không thể lưu cài đặt",
        variant: "destructive",
      })
    } finally {
      setSaving(false)
    }
  }

  const updatePreference = (key: keyof EmailPreferencesData, value: boolean | string) => {
    setPreferences((prev) => ({ ...prev, [key]: value }))
  }

  if (loading) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center py-8">
          <Loader2 className="h-6 w-6 animate-spin" />
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Thông báo qua Email</CardTitle>
          <CardDescription>Chọn loại thông báo bạn muốn nhận qua email</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label htmlFor="email_booking_updates">Cập nhật đơn hàng</Label>
              <p className="text-sm text-muted-foreground">Nhận thông báo về trạng thái đơn đặt chuyển nhà</p>
            </div>
            <Switch
              id="email_booking_updates"
              checked={preferences.email_booking_updates}
              onCheckedChange={(checked) => updatePreference("email_booking_updates", checked)}
            />
          </div>

          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label htmlFor="email_quotations">Báo giá</Label>
              <p className="text-sm text-muted-foreground">Nhận thông báo khi có báo giá mới</p>
            </div>
            <Switch
              id="email_quotations"
              checked={preferences.email_quotations}
              onCheckedChange={(checked) => updatePreference("email_quotations", checked)}
            />
          </div>

          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label htmlFor="email_payments">Thanh toán</Label>
              <p className="text-sm text-muted-foreground">Nhận xác nhận thanh toán và hóa đơn</p>
            </div>
            <Switch
              id="email_payments"
              checked={preferences.email_payments}
              onCheckedChange={(checked) => updatePreference("email_payments", checked)}
            />
          </div>

          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label htmlFor="email_reviews">Đánh giá</Label>
              <p className="text-sm text-muted-foreground">Nhận thông báo về đánh giá và phản hồi</p>
            </div>
            <Switch
              id="email_reviews"
              checked={preferences.email_reviews}
              onCheckedChange={(checked) => updatePreference("email_reviews", checked)}
            />
          </div>

          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label htmlFor="email_marketing">Khuyến mãi và tin tức</Label>
              <p className="text-sm text-muted-foreground">Nhận email về chương trình khuyến mãi và tin tức mới</p>
            </div>
            <Switch
              id="email_marketing"
              checked={preferences.email_marketing}
              onCheckedChange={(checked) => updatePreference("email_marketing", checked)}
            />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Thông báo đẩy</CardTitle>
          <CardDescription>Cài đặt thông báo đẩy trên trình duyệt</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label htmlFor="push_booking_updates">Cập nhật đơn hàng</Label>
              <p className="text-sm text-muted-foreground">Nhận thông báo đẩy về trạng thái đơn hàng</p>
            </div>
            <Switch
              id="push_booking_updates"
              checked={preferences.push_booking_updates}
              onCheckedChange={(checked) => updatePreference("push_booking_updates", checked)}
            />
          </div>

          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label htmlFor="push_quotations">Báo giá</Label>
              <p className="text-sm text-muted-foreground">Nhận thông báo đẩy khi có báo giá mới</p>
            </div>
            <Switch
              id="push_quotations"
              checked={preferences.push_quotations}
              onCheckedChange={(checked) => updatePreference("push_quotations", checked)}
            />
          </div>

          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label htmlFor="push_payments">Thanh toán</Label>
              <p className="text-sm text-muted-foreground">Nhận thông báo đẩy về thanh toán</p>
            </div>
            <Switch
              id="push_payments"
              checked={preferences.push_payments}
              onCheckedChange={(checked) => updatePreference("push_payments", checked)}
            />
          </div>

          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label htmlFor="push_reviews">Đánh giá</Label>
              <p className="text-sm text-muted-foreground">Nhận thông báo đẩy về đánh giá</p>
            </div>
            <Switch
              id="push_reviews"
              checked={preferences.push_reviews}
              onCheckedChange={(checked) => updatePreference("push_reviews", checked)}
            />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Giờ yên tĩnh</CardTitle>
          <CardDescription>Tắt thông báo trong khoảng thời gian nhất định</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label htmlFor="quiet_hours_enabled">Bật giờ yên tĩnh</Label>
              <p className="text-sm text-muted-foreground">Không nhận thông báo trong khoảng thời gian này</p>
            </div>
            <Switch
              id="quiet_hours_enabled"
              checked={preferences.quiet_hours_enabled}
              onCheckedChange={(checked) => updatePreference("quiet_hours_enabled", checked)}
            />
          </div>

          {preferences.quiet_hours_enabled && (
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="quiet_hours_start">Bắt đầu</Label>
                <Input
                  id="quiet_hours_start"
                  type="time"
                  value={preferences.quiet_hours_start || "22:00"}
                  onChange={(e) => updatePreference("quiet_hours_start", e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="quiet_hours_end">Kết thúc</Label>
                <Input
                  id="quiet_hours_end"
                  type="time"
                  value={preferences.quiet_hours_end || "08:00"}
                  onChange={(e) => updatePreference("quiet_hours_end", e.target.value)}
                />
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      <div className="flex justify-end">
        <Button onClick={handleSave} disabled={saving}>
          {saving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
          Lưu cài đặt
        </Button>
      </div>
    </div>
  )
}
