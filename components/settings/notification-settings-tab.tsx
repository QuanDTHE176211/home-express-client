"use client"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"

export type NotificationSettingsTabProps = {
  emailNotifications: boolean
  setEmailNotifications: React.Dispatch<React.SetStateAction<boolean>>
  bookingUpdates: boolean
  setBookingUpdates: React.Dispatch<React.SetStateAction<boolean>>
  quotationAlerts: boolean
  setQuotationAlerts: React.Dispatch<React.SetStateAction<boolean>>
  promotions: boolean
  setPromotions: React.Dispatch<React.SetStateAction<boolean>>
  newsletter: boolean
  setNewsletter: React.Dispatch<React.SetStateAction<boolean>>
  onSave: (payload: {
    emailNotifications: boolean
    bookingUpdates: boolean
    quotationAlerts: boolean
    promotions: boolean
    newsletter: boolean
  }) => Promise<void> | void
}

export function NotificationSettingsTab(props: NotificationSettingsTabProps) {
  const {
    emailNotifications,
    setEmailNotifications,
    bookingUpdates,
    setBookingUpdates,
    quotationAlerts,
    setQuotationAlerts,
    promotions,
    setPromotions,
    newsletter,
    setNewsletter,
    onSave,
  } = props

  const [saving, setSaving] = useState(false)

  const handleSave = async () => {
    setSaving(true)
    try {
      await onSave({ emailNotifications, bookingUpdates, quotationAlerts, promotions, newsletter })
    } finally {
      setSaving(false)
    }
  }

  return (
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
          <Switch id="email-notifications" checked={emailNotifications} onCheckedChange={setEmailNotifications} />
        </div>
        <div className="flex items-center justify-between">
          <div className="space-y-0.5">
            <Label htmlFor="booking-updates">Cập nhật đơn hàng</Label>
            <p className="text-sm text-muted-foreground">Thông báo về trạng thái đơn hàng</p>
          </div>
          <Switch id="booking-updates" checked={bookingUpdates} onCheckedChange={setBookingUpdates} />
        </div>
        <div className="flex items-center justify-between">
          <div className="space-y-0.5">
            <Label htmlFor="quotation-alerts">Báo giá</Label>
            <p className="text-sm text-muted-foreground">Cập nhật về báo giá</p>
          </div>
          <Switch id="quotation-alerts" checked={quotationAlerts} onCheckedChange={setQuotationAlerts} />
        </div>
        <div className="flex items-center justify-between">
          <div className="space-y-0.5">
            <Label htmlFor="promotions">Khuyến mãi</Label>
            <p className="text-sm text-muted-foreground">Nhận tin khuyến mãi</p>
          </div>
          <Switch id="promotions" checked={promotions} onCheckedChange={setPromotions} />
        </div>
        <div className="flex items-center justify-between">
          <div className="space-y-0.5">
            <Label htmlFor="newsletter">Bản tin</Label>
            <p className="text-sm text-muted-foreground">Nhận bản tin định kỳ</p>
          </div>
          <Switch id="newsletter" checked={newsletter} onCheckedChange={setNewsletter} />
        </div>

        <div className="flex justify-end pt-2">
          <Button onClick={handleSave} disabled={saving} className="bg-accent-green hover:bg-accent-green-dark">
            {saving ? "Đang lưu..." : "Lưu thay đổi"}
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}
