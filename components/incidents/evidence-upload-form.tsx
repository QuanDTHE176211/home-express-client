"use client"

import type React from "react"

import { useState } from "react"
import Image from "next/image"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { Camera, Loader2, Upload, X } from "lucide-react"
import type { EvidenceType } from "@/types"

interface EvidenceUploadFormProps {
  bookingId: number
  type: EvidenceType
  onSuccess?: () => void
  onCancel?: () => void
}

const EVIDENCE_LABELS: Record<EvidenceType, { title: string; description: string }> = {
  BEFORE_PICKUP: {
    title: "Ảnh trước khi lấy hàng",
    description: "Chụp ảnh hiện trạng hàng hóa trước khi bắt đầu vận chuyển",
  },
  AFTER_PICKUP: {
    title: "Ảnh sau khi lấy hàng",
    description: "Chụp ảnh hàng hóa đã được xếp lên xe",
  },
  DURING_TRANSPORT: {
    title: "Ảnh trong quá trình vận chuyển",
    description: "Chụp ảnh hàng hóa đang được vận chuyển",
  },
  AFTER_DELIVERY: {
    title: "Ảnh sau khi giao hàng",
    description: "Chụp ảnh hàng hóa đã được giao và khách hàng ký nhận",
  },
}

export function EvidenceUploadForm({ bookingId, type, onSuccess, onCancel }: EvidenceUploadFormProps) {
  const [loading, setLoading] = useState(false)
  const [photos, setPhotos] = useState<string[]>([])
  const [notes, setNotes] = useState("")

  const labels = EVIDENCE_LABELS[type]

  const handlePhotoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files
    if (!files) return

    const newPhotos = Array.from(files).map((file) => URL.createObjectURL(file))
    setPhotos((prev) => [...prev, ...newPhotos].slice(0, 10))
  }

  const removePhoto = (index: number) => {
    setPhotos((prev) => prev.filter((_, i) => i !== index))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (photos.length === 0) {
      alert("Vui lòng tải lên ít nhất 1 ảnh")
      return
    }

    setLoading(true)

    try {
      // In production, call API to upload evidence
      await new Promise((resolve) => setTimeout(resolve, 1500))

      if (onSuccess) {
        onSuccess()
      }
    } catch (err: any) {
      alert(err.message || "Không thể tải lên ảnh")
    } finally {
      setLoading(false)
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>{labels.title}</CardTitle>
        <CardDescription>{labels.description}</CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="space-y-2">
            <Label>Ảnh minh chứng (tối đa 10 ảnh)</Label>
            <div className="flex flex-wrap gap-2">
              {photos.map((photo, index) => (
                <div key={index} className="relative h-24 w-24">
                  <Image
                    src={photo || "/placeholder.svg"}
                    alt={`Photo ${index + 1}`}
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
          </div>

          <div className="space-y-2">
            <Label htmlFor="notes">Ghi chú (tùy chọn)</Label>
            <Textarea
              id="notes"
              placeholder="Thêm ghi chú về tình trạng hàng hóa..."
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={3}
              maxLength={500}
            />
          </div>

          <div className="flex gap-2 justify-end">
            {onCancel && (
              <Button type="button" variant="outline" onClick={onCancel} disabled={loading}>
                Hủy
              </Button>
            )}
            <Button type="submit" disabled={loading || photos.length === 0}>
              {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Tải lên ảnh
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  )
}
