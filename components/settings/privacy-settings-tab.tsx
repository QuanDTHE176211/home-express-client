"use client"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"

export type PrivacySettingsTabProps<T extends string = "public" | "private"> = {
  profileVisibility: T
  setProfileVisibility: React.Dispatch<React.SetStateAction<T>>
  showPhone: boolean
  setShowPhone: React.Dispatch<React.SetStateAction<boolean>>
  showEmail: boolean
  setShowEmail: React.Dispatch<React.SetStateAction<boolean>>
  onSave: (payload: { profileVisibility: T; showPhone: boolean; showEmail: boolean }) => Promise<void> | void
}

export function PrivacySettingsTab<T extends string = "public" | "private">(props: PrivacySettingsTabProps<T>) {
  const { profileVisibility, setProfileVisibility, showPhone, setShowPhone, showEmail, setShowEmail, onSave } = props
  const [saving, setSaving] = useState(false)

  const handleSave = async () => {
    setSaving(true)
    try {
      await onSave({ profileVisibility, showPhone, showEmail })
    } finally {
      setSaving(false)
    }
  }

  return (
    <Card className="transition-shadow hover:shadow-md">
      <CardHeader>
        <CardTitle>Quyen rieng tu</CardTitle>
        <CardDescription>Dieu chinh thong tin ma nguoi khac co the xem</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="profile-visibility">Che do hien thi ho so</Label>
          <Select value={profileVisibility} onValueChange={(value) => setProfileVisibility(value as T)}>
            <SelectTrigger id="profile-visibility" className="h-11">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="public">Cong khai</SelectItem>
              <SelectItem value="private">Rieng tu</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="flex items-center justify-between">
          <div className="space-y-0.5">
            <Label htmlFor="show-phone">Hien thi so dien thoai</Label>
            <p className="text-sm text-muted-foreground">Cho phep nguoi khac xem so dien thoai cua ban</p>
          </div>
          <Switch id="show-phone" checked={showPhone} onCheckedChange={setShowPhone} />
        </div>

        <div className="flex items-center justify-between">
          <div className="space-y-0.5">
            <Label htmlFor="show-email">Hien thi email</Label>
            <p className="text-sm text-muted-foreground">Cho phep nguoi khac xem email cua ban</p>
          </div>
          <Switch id="show-email" checked={showEmail} onCheckedChange={setShowEmail} />
        </div>

        <div className="flex justify-end pt-2">
          <Button onClick={handleSave} disabled={saving} className="bg-accent-green hover:bg-accent-green-dark">
            {saving ? "Dang luu..." : "Luu thay doi"}
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}
