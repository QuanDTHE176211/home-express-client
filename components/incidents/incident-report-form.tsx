"use client"

import type React from "react"

import { useState } from "react"
import Image from "next/image"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { AlertCircle, Camera, Loader2, Upload, X } from "lucide-react"
import { Alert, AlertDescription } from "@/components/ui/alert"
import type { IncidentType, IncidentSeverity } from "@/types"

interface IncidentReportFormProps {
  bookingId: number
  onSuccess?: () => void
  onCancel?: () => void
}

const INCIDENT_TYPES: { value: IncidentType; label: string; description: string }[] = [
  { value: "DAMAGE", label: "Hàng hóa bị hư hỏng", description: "Đồ đạc bị hỏng trong quá trình vận chuyển" },
  { value: "ACCIDENT", label: "Tai nạn giao thông", description: "Xe gặp tai nạn trên đường" },
  { value: "DELAY", label: "Chậm trễ", description: "Không thể giao hàng đúng giờ" },
  { value: "WEATHER", label: "Thời tiết xấu", description: "Mưa bão, ngập lụt ảnh hưởng vận chuyển" },
  { value: "VEHICLE_BREAKDOWN", label: "Xe hỏng", description: "Xe bị hỏng giữa đường" },
  { value: "CUSTOMER_ISSUE", label: "Vấn đề từ khách hàng", description: "Khách không có mặt, từ chối nhận hàng" },
  { value: "ADDRESS_ISSUE", label: "Vấn đề địa chỉ", description: "Địa chỉ sai, không tìm thấy" },
  { value: "OTHER", label: "Khác", description: "Vấn đề khác" },
]

const SEVERITY_LEVELS: { value: IncidentSeverity; label: string; color: string }[] = [
  { value: "LOW", label: "Thấp", color: "text-blue-600" },
  { value: "MEDIUM", label: "Trung bình", color: "text-yellow-600" },
  { value: "HIGH", label: "Cao", color: "text-orange-600" },
  { value: "CRITICAL", label: "Nghiêm trọng", color: "text-red-600" },
]

export function IncidentReportForm({ bookingId, onSuccess, onCancel }: IncidentReportFormProps) {
  const [loading, setLoading] = useState(false)
  const [type, setType] = useState<IncidentType>("DAMAGE")
  const [severity, setSeverity] = useState<IncidentSeverity>("MEDIUM")
  const [title, setTitle] = useState("")
  const [description, setDescription] = useState("")
  const [location, setLocation] = useState("")
  const [photos, setPhotos] = useState<string[]>([])
  const [error, setError] = useState<string | null>(null)

  const selectedType = INCIDENT_TYPES.find((t) => t.value === type)

  const handlePhotoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files
    if (!files) return

    // In production, upload to storage and get URLs
    const newPhotos = Array.from(files).map((file) => URL.createObjectURL(file))
    setPhotos((prev) => [...prev, ...newPhotos].slice(0, 10))
  }

  const removePhoto = (index: number) => {
    setPhotos((prev) => prev.filter((_, i) => i !== index))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)

    if (!title.trim()) {
      setError("Vui lòng nhập tiêu đề sự cố")
      return
    }

    if (!description.trim()) {
      setError("Vui lòng mô tả chi tiết sự cố")
      return
    }

    if (photos.length === 0) {
      setError("Vui lòng tải lên ít nhất 1 ảnh minh chứng")
      return
    }

    setLoading(true)

    try {
      // In production, call API to create incident
      await new Promise((resolve) => setTimeout(resolve, 1500))

      if (onSuccess) {
        onSuccess()
      }
    } catch (err: any) {
      setError(err.message || "Không thể gửi báo cáo sự cố")
    } finally {
      setLoading(false)
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <AlertCircle className="h-5 w-5 text-destructive" />
          Báo cáo sự cố
        </CardTitle>
        <CardDescription>Ghi nhận sự cố xảy ra trong quá trình vận chuyển</CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-6">
          {error && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          <div className="space-y-2">
            <Label htmlFor="type">Loại sự cố</Label>
            <Select value={type} onValueChange={(value) => setType(value as IncidentType)}>
              <SelectTrigger id="type">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {INCIDENT_TYPES.map((t) => (
                  <SelectItem key={t.value} value={t.value}>
                    <div>
                      <div className="font-medium">{t.label}</div>
                      <div className="text-xs text-muted-foreground">{t.description}</div>
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {selectedType && <p className="text-sm text-muted-foreground">{selectedType.description}</p>}
          </div>

          <div className="space-y-2">
            <Label htmlFor="severity">Mức độ nghiêm trọng</Label>
            <Select value={severity} onValueChange={(value) => setSeverity(value as IncidentSeverity)}>
              <SelectTrigger id="severity">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {SEVERITY_LEVELS.map((s) => (
                  <SelectItem key={s.value} value={s.value}>
                    <span className={s.color}>{s.label}</span>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="title">Tiêu đề sự cố</Label>
            <Input
              id="title"
              placeholder="Tóm tắt ngắn gọn sự cố"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              maxLength={100}
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Mô tả chi tiết</Label>
            <Textarea
              id="description"
              placeholder="Mô tả chi tiết những gì đã xảy ra, nguyên nhân, tình trạng hiện tại..."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={5}
              maxLength={1000}
              required
            />
            <p className="text-xs text-muted-foreground text-right">{description.length}/1000</p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="location">Vị trí xảy ra sự cố (tùy chọn)</Label>
            <Input
              id="location"
              placeholder="Địa chỉ hoặc vị trí cụ thể"
              value={location}
              onChange={(e) => setLocation(e.target.value)}
            />
          </div>

          <div className="space-y-2">
            <Label>Ảnh minh chứng (bắt buộc, tối đa 10 ảnh)</Label>
            <div className="flex flex-wrap gap-2">
              {photos.map((photo, index) => (
                <div key={index} className="relative h-24 w-24">
                  <Image
                    src={photo || "/placeholder.svg"}
                    alt={`Evidence ${index + 1}`}
                    width={96}
                    height={96}
                    className="h-full w-full rounded-lg object-cover"
                  />
                  <button
                    type="button"
                    onClick={() => removePhoto(index)}
                    className="absolute -right-2 -top-2 rounded-full bg-destructive p-1 text-destructive-foreground"
                  >
                    <X className="h-3 w-3" />
                  </button>
                </div>
              ))}

              {photos.length < 10 && (
                <label className="flex h-24 w-24 cursor-pointer flex-col items-center justify-center gap-1 rounded-lg border-2 border-dashed border-muted-foreground/25 hover:border-muted-foreground/50">
                  <Camera className="h-6 w-6 text-muted-foreground" />
                  <span className="text-xs text-muted-foreground">Chụp ảnh</span>
                  <input
                    type="file"
                    accept="image/*"
                    capture="environment"
                    multiple
                    onChange={handlePhotoUpload}
                    className="hidden"
                  />
                </label>
              )}

              {photos.length < 10 && (
                <label className="flex h-24 w-24 cursor-pointer flex-col items-center justify-center gap-1 rounded-lg border-2 border-dashed border-muted-foreground/25 hover:border-muted-foreground/50">
                  <Upload className="h-6 w-6 text-muted-foreground" />
                  <span className="text-xs text-muted-foreground">Tải lên</span>
                  <input type="file" accept="image/*" multiple onChange={handlePhotoUpload} className="hidden" />
                </label>
              )}
            </div>
            <p className="text-xs text-muted-foreground">
              Chụp ảnh rõ ràng hiện trường, hàng hóa bị hư hỏng, hoặc bất kỳ bằng chứng nào liên quan
            </p>
          </div>

          <div className="flex gap-2 justify-end">
            {onCancel && (
              <Button type="button" variant="outline" onClick={onCancel} disabled={loading}>
                Hủy
              </Button>
            )}
            <Button type="submit" disabled={loading} variant="destructive">
              {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Gửi báo cáo sự cố
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  )
}
