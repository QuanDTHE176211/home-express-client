"use client"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Separator } from "@/components/ui/separator"
import { Save } from "lucide-react"
import { useToast } from "@/hooks/use-toast"

interface AccountSettingsTabProps {
  user: any
  fullName: string
  setFullName: (value: string) => void
  phone: string
  setPhone: (value: string) => void
  dateOfBirth: string
  setDateOfBirth: (value: string) => void
  onSave: (payload: { fullName: string; phone: string; dateOfBirth: string }) => Promise<void>
}

export function AccountSettingsTab({
  user,
  fullName,
  setFullName,
  phone,
  setPhone,
  dateOfBirth,
  setDateOfBirth,
  onSave,
}: AccountSettingsTabProps) {
  const [saving, setSaving] = useState(false)
  const { toast } = useToast()

  const handleSave = async () => {
    setSaving(true)
    try {
      await onSave({ fullName, phone, dateOfBirth })

      toast({
        title: "Đã lưu thông tin tài khoản",
        description: "Thông tin tài khoản của bạn đã được cập nhật thành công.",
      })
    } catch (error) {
      toast({
        title: "Lỗi",
        description: error instanceof Error ? error.message : "Không thể cập nhật thông tin tài khoản.",
        variant: "destructive",
      })
    } finally {
      setSaving(false)
    }
  }

  return (
    <Card className="transition-shadow hover:shadow-md">
      <CardHeader>
        <CardTitle>Thông tin tài khoản</CardTitle>
        <CardDescription>Cập nhật thông tin cá nhân của bạn</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="fullName">Họ và tên</Label>
          <Input id="fullName" value={fullName} onChange={(e) => setFullName(e.target.value)} className="h-11" />
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
        <div className="space-y-2">
          <Label htmlFor="dateOfBirth">Ngày sinh</Label>
          <Input
            id="dateOfBirth"
            type="date"
            value={dateOfBirth}
            onChange={(e) => setDateOfBirth(e.target.value)}
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
  )
}

