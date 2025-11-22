"use client"

import { Suspense, useEffect, useMemo, useState } from "react"
import Image from "next/image"
import { useRouter, useSearchParams } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Checkbox } from "@/components/ui/checkbox"
import { Textarea } from "@/components/ui/textarea"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { AlertCircle, CheckCircle2, Maximize, Package, Plus, Trash2, Weight } from "lucide-react"
import { BookingFlowBreadcrumb } from "@/components/customer/booking-flow-breadcrumb"
import type { DetectedItem } from "@/lib/types/scan"

type AddressForm = {
  address: string
  province: string
  district: string
  ward: string
  contactName: string
  contactPhone: string
  floor: string
  hasElevator: boolean
}

type BookingDetailsForm = {
  pickup: AddressForm
  delivery: AddressForm
  preferredDate: string
  preferredTimeSlot: "MORNING" | "AFTERNOON" | "EVENING"
  distanceKm: string
  specialRequirements: string
  notes: string
}

const PHONE_REGEX = /^(\+?84|0)(\d){8,10}$/

const createEmptyAddress = (): AddressForm => ({
  address: "",
  province: "",
  district: "",
  ward: "",
  contactName: "",
  contactPhone: "",
  floor: "0",
  hasElevator: true,
})

function ItemCard({
  item,
  onUpdate,
  onRemove,
}: {
  item: DetectedItem
  onUpdate: (id: string, updates: Partial<DetectedItem>) => void
  onRemove: (id: string) => void
}) {
  return (
    <Card className="relative">
      <CardContent className="p-4">
        <div className="flex gap-4">
          {item.imageUrl && (
            <div className="h-20 w-20 flex-shrink-0 overflow-hidden rounded-lg border">
              <Image
                src={item.imageUrl || "/placeholder.svg"}
                alt={item.displayName}
                width={80}
                height={80}
                className="h-full w-full object-cover"
              />
            </div>
          )}

          <div className="flex-1 space-y-3">
            <div>
              <Label htmlFor={`name-${item.id}`} className="text-xs text-muted-foreground">
                Tên vật phẩm
              </Label>
              <Input
                id={`name-${item.id}`}
                value={item.displayName}
                onChange={(event) => onUpdate(item.id, { displayName: event.target.value })}
                className="mt-1"
              />
            </div>

            <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
              <div>
                <Label htmlFor={`size-${item.id}`} className="text-xs text-muted-foreground">
                  Kích thước
                </Label>
                <Select
                  value={item.size}
                  onValueChange={(value: "S" | "M" | "L") => onUpdate(item.id, { size: value })}
                >
                  <SelectTrigger id={`size-${item.id}`} className="mt-1">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="S">S - Nhỏ</SelectItem>
                    <SelectItem value="M">M - Vừa</SelectItem>
                    <SelectItem value="L">L - Lớn</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label htmlFor={`qty-${item.id}`} className="text-xs text-muted-foreground">
                  Số lượng
                </Label>
                <Input
                  id={`qty-${item.id}`}
                  type="number"
                  min={1}
                  value={item.quantity}
                  onChange={(event) =>
                    onUpdate(item.id, { quantity: Number.parseInt(event.target.value, 10) || 1 })
                  }
                  className="mt-1"
                />
              </div>

              <div className="flex items-end">
                <label className="flex cursor-pointer items-center gap-2">
                  <Checkbox
                    checked={item.fragile}
                    onCheckedChange={(checked) => onUpdate(item.id, { fragile: Boolean(checked) })}
                  />
                  <span className="text-sm">Dễ vỡ</span>
                </label>
              </div>

              <div className="flex items-end">
                <label className="flex cursor-pointer items-center gap-2">
                  <Checkbox
                    checked={item.needsDisassembly}
                    onCheckedChange={(checked) => onUpdate(item.id, { needsDisassembly: Boolean(checked) })}
                  />
                  <span className="text-sm">Cần tháo rời</span>
                </label>
              </div>
            </div>

            {item.confidence < 0.7 && (
              <Badge variant="outline" className="text-xs">
                <AlertCircle className="mr-1 h-3 w-3" />
                Độ tin cậy: {Math.round(item.confidence * 100)}%
              </Badge>
            )}
          </div>

          <Button variant="ghost" size="icon" onClick={() => onRemove(item.id)} className="flex-shrink-0">
            <Trash2 className="h-4 w-4" />
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}

function EmptyState({ onAddManual }: { onAddManual: () => void }) {
  return (
    <div className="flex flex-col items-center justify-center py-12 text-center">
      <div className="mb-4 rounded-full bg-muted p-6">
        <Package className="h-12 w-12 text-muted-foreground" />
      </div>
      <h3 className="mb-2 text-lg font-semibold">Chưa có vật phẩm nào</h3>
      <p className="mb-4 text-sm text-muted-foreground">
        AI chưa phát hiện được vật phẩm. Hãy thêm thủ công để tiếp tục.
      </p>
      <Button onClick={onAddManual}>
        <Plus className="mr-2 h-4 w-4" />
        Thêm vật phẩm
      </Button>
    </div>
  )
}

function ReviewPageContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const sessionId = searchParams.get("sid")

  const [items, setItems] = useState<DetectedItem[]>([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [formErrors, setFormErrors] = useState<Record<string, string>>({})

  const [bookingDetails, setBookingDetails] = useState<BookingDetailsForm>({
    pickup: createEmptyAddress(),
    delivery: createEmptyAddress(),
    preferredDate: "",
    preferredTimeSlot: "MORNING",
    distanceKm: "",
    specialRequirements: "",
    notes: "",
  })

  const storageKey = useMemo(() => (sessionId ? `scan-session:${sessionId}:bookingDetails` : null), [sessionId])

  useEffect(() => {
    if (!storageKey || typeof window === "undefined") {
      return
    }

    try {
      const raw = window.sessionStorage.getItem(storageKey)
      if (!raw) return
      const saved = JSON.parse(raw) as Partial<BookingDetailsForm>
      setBookingDetails((prev) => ({
        pickup: { ...prev.pickup, ...(saved.pickup ?? {}) },
        delivery: { ...prev.delivery, ...(saved.delivery ?? {}) },
        preferredDate: saved.preferredDate ?? prev.preferredDate,
        preferredTimeSlot: (saved.preferredTimeSlot as BookingDetailsForm["preferredTimeSlot"]) ?? prev.preferredTimeSlot,
        distanceKm: saved.distanceKm ?? prev.distanceKm,
        specialRequirements: saved.specialRequirements ?? prev.specialRequirements,
        notes: saved.notes ?? prev.notes,
      }))
    } catch (restoreError) {
      console.warn("Unable to restore booking details", restoreError)
    }
  }, [storageKey])

  useEffect(() => {
    if (!sessionId) {
      router.push("/customer/bookings/create")
      return
    }

    const loadItems = async () => {
      setLoading(true)
      setError(null)
      try {
        const response = await fetch(`/api/scan-sessions/${sessionId}/items`)
        if (!response.ok) {
          throw new Error("Không thể tải danh sách vật phẩm")
        }
        const data = (await response.json()) as { items?: DetectedItem[] }
        setItems(Array.isArray(data.items) ? data.items : [])
      } catch (loadError) {
        setError(loadError instanceof Error ? loadError.message : "Có lỗi xảy ra")
      } finally {
        setLoading(false)
      }
    }

    loadItems()
  }, [sessionId, router])

  const totals = useMemo(() => {
    return items.reduce(
      (acc, item) => {
        const quantity = Math.max(1, item.quantity ?? 1)
        acc.weight += item.weight * quantity
        acc.volume += item.volume * quantity
        return acc
      },
      { weight: 0, volume: 0 },
    )
  }, [items])

  const updateAddressField = (type: "pickup" | "delivery", field: keyof AddressForm, value: string | boolean) => {
    setBookingDetails((prev) => ({
      ...prev,
      [type]: {
        ...prev[type],
        [field]: value,
      },
    }))
  }

  const updateDetailField = (field: Exclude<keyof BookingDetailsForm, "pickup" | "delivery">, value: string) => {
    setBookingDetails((prev) => ({
      ...prev,
      [field]: value,
    }))
  }

  const validateBookingDetails = (details: BookingDetailsForm) => {
    const errors: Record<string, string> = {}
    const requiredFields: Array<keyof AddressForm> = [
      "address",
      "province",
      "district",
      "ward",
      "contactName",
      "contactPhone",
    ]

    requiredFields.forEach((field) => {
      if (!details.pickup[field].toString().trim()) {
        errors[`pickup.${field}`] = "Bắt buộc"
      }
      if (!details.delivery[field].toString().trim()) {
        errors[`delivery.${field}`] = "Bắt buộc"
      }
    })

    if (details.pickup.contactPhone && !PHONE_REGEX.test(details.pickup.contactPhone.trim())) {
      errors["pickup.contactPhone"] = "Số điện thoại không hợp lệ"
    }

    if (details.delivery.contactPhone && !PHONE_REGEX.test(details.delivery.contactPhone.trim())) {
      errors["delivery.contactPhone"] = "Số điện thoại không hợp lệ"
    }

    if (!details.preferredDate) {
      errors.preferredDate = "Vui lòng chọn ngày chuyển nhà"
    }

    if (!details.distanceKm || Number.isNaN(Number(details.distanceKm)) || Number(details.distanceKm) <= 0) {
      errors.distanceKm = "Nhập khoảng cách ước tính (km)"
    }

    return errors
  }

  const handleUpdateItem = (id: string, updates: Partial<DetectedItem>) => {
    setItems((prev) => {
      const next = prev.map((item) => (item.id === id ? { ...item, ...updates } : item))
      return next
    })
  }

  const handleRemoveItem = (id: string) => {
    setItems((prev) => prev.filter((item) => item.id !== id))
  }

  const handleAddManualItem = () => {
    if (!sessionId) return
    const now = Date.now()
    const newItem: DetectedItem = {
      id: `manual-${now}`,
      sessionId,
      name: "vat-pham-moi",
      displayName: "Vật phẩm mới",
      category: "other",
      size: "M",
      quantity: 1,
      weight: 10,
      volume: 0.1,
      fragile: false,
      needsDisassembly: false,
      confidence: 1,
    }
    setItems((prev) => [...prev, newItem])
  }

  const handleSaveAndContinue = async () => {
    if (!sessionId) {
      router.push("/customer/bookings/create")
      return
    }

    if (items.length === 0) {
      setError("Vui lòng thêm ít nhất một vật phẩm")
      return
    }

    const validationErrors = validateBookingDetails(bookingDetails)
    if (Object.keys(validationErrors).length > 0) {
      setFormErrors(validationErrors)
      return
    }

    setFormErrors({})
    setSaving(true)
    setError(null)

    try {
      if (storageKey && typeof window !== "undefined") {
        window.sessionStorage.setItem(storageKey, JSON.stringify(bookingDetails))
      }

      // Save items first
      const itemsResponse = await fetch(`/api/scan-sessions/${sessionId}/items`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ items }),
      })

      if (!itemsResponse.ok) {
        throw new Error("Không thể lưu danh sách vật phẩm")
      }

      // Create booking and publish for bidding
      const publishResponse = await fetch(`/api/scan-sessions/${sessionId}/publish-bidding`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ bookingDetails }),
      })

      if (!publishResponse.ok) {
        const errorData = await publishResponse.json()
        throw new Error(errorData.error || "Không thể tạo đơn hàng")
      }

      const publishData = await publishResponse.json()

      // Redirect to bids page with both bookingId and sessionId
      router.push(`/customer/bids?bookingId=${publishData.bookingId}&sid=${sessionId}`)
    } catch (saveError) {
      setError(saveError instanceof Error ? saveError.message : "Có lỗi xảy ra")
      setSaving(false)
    }
  }

  const handleBack = () => {
    router.push("/customer/bookings/create")
  }

  if (loading) {
    return <ReviewPageSkeleton />
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-background to-muted/20 px-4 py-8">
      <div className="mx-auto max-w-4xl space-y-4">
        <BookingFlowBreadcrumb currentStep={2} onBack={handleBack} />

        <Card>
          <CardHeader>
            <CardTitle>Thông tin giao nhận</CardTitle>
            <CardDescription>Điền địa chỉ đón/giao và nhu cầu để đội xe chuẩn bị trước.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="grid gap-6 md:grid-cols-2">
              {renderAddressSection("Điểm đón", "pickup")}
              {renderAddressSection("Điểm giao", "delivery")}
            </div>
            <Separator />
            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="preferred-date">Ngày chuyển</Label>
                <Input
                  id="preferred-date"
                  type="date"
                  value={bookingDetails.preferredDate}
                  onChange={(event) => updateDetailField("preferredDate", event.target.value)}
                  min={new Date().toISOString().split("T")[0]}
                />
                {formErrors.preferredDate ? (
                  <p className="text-sm text-destructive">{formErrors.preferredDate}</p>
                ) : null}
              </div>
              <div className="space-y-2">
                <Label htmlFor="preferred-slot">Khung giờ ưu tiên</Label>
                <Select
                  value={bookingDetails.preferredTimeSlot}
                  onValueChange={(value: "MORNING" | "AFTERNOON" | "EVENING") =>
                    updateDetailField("preferredTimeSlot", value)
                  }
                >
                  <SelectTrigger id="preferred-slot">
                    <SelectValue placeholder="Chọn khung giờ" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="MORNING">Buổi sáng (8h - 11h)</SelectItem>
                    <SelectItem value="AFTERNOON">Buổi chiều (13h - 17h)</SelectItem>
                    <SelectItem value="EVENING">Buổi tối (18h - 21h)</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="distance-km">Khoảng cách ước tính (km)</Label>
                <Input
                  id="distance-km"
                  type="number"
                  min={1}
                  step="0.1"
                  value={bookingDetails.distanceKm}
                  onChange={(event) => updateDetailField("distanceKm", event.target.value)}
                  placeholder="Ví dụ: 12"
                />
                {formErrors.distanceKm ? <p className="text-sm text-destructive">{formErrors.distanceKm}</p> : null}
              </div>
              <div className="space-y-2">
                <Label htmlFor="special-requirements">Yêu cầu đặc biệt</Label>
                <Textarea
                  id="special-requirements"
                  value={bookingDetails.specialRequirements}
                  onChange={(event) => updateDetailField("specialRequirements", event.target.value)}
                  placeholder="Ví dụ: cần đóng gói đồ dễ vỡ, mang theo xe nâng..."
                  rows={3}
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="notes">Ghi chú thêm</Label>
              <Textarea
                id="notes"
                value={bookingDetails.notes}
                onChange={(event) => updateDetailField("notes", event.target.value)}
                placeholder="Thông tin bổ sung cho đội vận chuyển"
                rows={3}
              />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <CheckCircle2 className="h-5 w-5" />
              Xác nhận vật phẩm
            </CardTitle>
            <CardDescription>Kiểm tra và chỉnh sửa danh sách vật phẩm trước khi báo giá.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {items.length === 0 ? (
              <EmptyState onAddManual={handleAddManualItem} />
            ) : (
              <>
                <div className="space-y-3">
                  {items.map((item) => (
                    <ItemCard key={item.id} item={item} onUpdate={handleUpdateItem} onRemove={handleRemoveItem} />
                  ))}
                </div>
                <Button variant="outline" onClick={handleAddManualItem} className="w-full bg-transparent">
                  <Plus className="mr-2 h-4 w-4" />
                  Thêm vật phẩm
                </Button>
              </>
            )}

            {error && (
              <Alert variant="destructive">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}
          </CardContent>
        </Card>

        {items.length > 0 && (
          <Card className="sticky bottom-4 mt-4 shadow-lg">
            <CardContent className="p-4">
              <div className="flex flex-wrap items-center justify-between gap-4">
                <div className="flex items-center gap-6 text-sm">
                  <div className="flex items-center gap-2">
                    <Weight className="h-4 w-4 text-muted-foreground" />
                    <span className="text-muted-foreground">Khối lượng:</span>
                    <span className="font-semibold">{totals.weight.toFixed(1)} kg</span>
                  </div>
                  <Separator orientation="vertical" className="hidden h-6 md:block" />
                  <div className="flex items-center gap-2">
                    <Maximize className="h-4 w-4 text-muted-foreground" />
                    <span className="text-muted-foreground">Thể tích:</span>
                    <span className="font-semibold">{totals.volume.toFixed(2)} m³</span>
                  </div>
                </div>
                <div className="flex gap-2">
                  <Button variant="outline" onClick={handleBack} disabled={saving}>
                    Quay lại
                  </Button>
                  <Button
                    onClick={handleSaveAndContinue}
                    disabled={saving || items.length === 0}
                    size="lg"
                    className="bg-accent-green hover:bg-accent-green-dark"
                  >
                    {saving ? "Đang lưu..." : "Xác nhận & xem báo giá"}
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  )

  function renderAddressSection(title: string, type: "pickup" | "delivery") {
    const address = bookingDetails[type]
    return (
      <div className="space-y-3">
        <div>
          <Label>{title}</Label>
        </div>
        <div className="space-y-2">
          <Label htmlFor={`${type}-address`}>Địa chỉ</Label>
          <Input
            id={`${type}-address`}
            value={address.address}
            onChange={(event) => updateAddressField(type, "address", event.target.value)}
            placeholder="Số nhà, đường"
          />
          {formErrors[`${type}.address`] ? (
            <p className="text-sm text-destructive">{formErrors[`${type}.address`]}</p>
          ) : null}
        </div>
        <div className="grid gap-2 md:grid-cols-2">
          <div className="space-y-2">
            <Label htmlFor={`${type}-province`}>Tỉnh / Thành phố</Label>
            <Input
              id={`${type}-province`}
              value={address.province}
              onChange={(event) => updateAddressField(type, "province", event.target.value)}
              placeholder="TP. Hồ Chí Minh"
            />
            {formErrors[`${type}.province`] ? (
              <p className="text-sm text-destructive">{formErrors[`${type}.province`]}</p>
            ) : null}
          </div>
          <div className="space-y-2">
            <Label htmlFor={`${type}-district`}>Quận / Huyện</Label>
            <Input
              id={`${type}-district`}
              value={address.district}
              onChange={(event) => updateAddressField(type, "district", event.target.value)}
              placeholder="Quận 1"
            />
            {formErrors[`${type}.district`] ? (
              <p className="text-sm text-destructive">{formErrors[`${type}.district`]}</p>
            ) : null}
          </div>
        </div>
        <div className="grid gap-2 md:grid-cols-2">
          <div className="space-y-2">
            <Label htmlFor={`${type}-ward`}>Phường / Xã</Label>
            <Input
              id={`${type}-ward`}
              value={address.ward}
              onChange={(event) => updateAddressField(type, "ward", event.target.value)}
              placeholder="Phường Bến Nghé"
            />
            {formErrors[`${type}.ward`] ? (
              <p className="text-sm text-destructive">{formErrors[`${type}.ward`]}</p>
            ) : null}
          </div>
          <div className="space-y-2">
            <Label htmlFor={`${type}-contact-name`}>Người liên hệ</Label>
            <Input
              id={`${type}-contact-name`}
              value={address.contactName}
              onChange={(event) => updateAddressField(type, "contactName", event.target.value)}
              placeholder="Nguyễn Văn A"
            />
            {formErrors[`${type}.contactName`] ? (
              <p className="text-sm text-destructive">{formErrors[`${type}.contactName`]}</p>
            ) : null}
          </div>
        </div>
        <div className="grid gap-2 md:grid-cols-2">
          <div className="space-y-2">
            <Label htmlFor={`${type}-contact-phone`}>Số điện thoại</Label>
            <Input
              id={`${type}-contact-phone`}
              value={address.contactPhone}
              onChange={(event) => updateAddressField(type, "contactPhone", event.target.value)}
              placeholder="0901234567"
            />
            {formErrors[`${type}.contactPhone`] ? (
              <p className="text-sm text-destructive">{formErrors[`${type}.contactPhone`]}</p>
            ) : null}
          </div>
          <div className="space-y-2">
            <Label htmlFor={`${type}-floor`}>Tầng</Label>
            <Input
              id={`${type}-floor`}
              type="number"
              min={0}
              value={address.floor}
              onChange={(event) => updateAddressField(type, "floor", event.target.value)}
              placeholder="0"
            />
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Checkbox
            id={`${type}-elevator`}
            checked={address.hasElevator}
            onCheckedChange={(checked) => updateAddressField(type, "hasElevator", Boolean(checked))}
          />
          <Label htmlFor={`${type}-elevator`}>Có thang máy</Label>
        </div>
      </div>
    )
  }
}

function ReviewPageSkeleton() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-background to-muted/20 px-4 py-8">
      <div className="mx-auto max-w-4xl">
        <Card>
          <CardContent className="p-12 text-center">
            <div className="mx-auto mb-4 h-12 w-12 animate-spin rounded-full border-b-2 border-primary" />
            <p className="text-muted-foreground">Đang tải...</p>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

export default function ReviewPage() {
  return (
    <Suspense fallback={<ReviewPageSkeleton />}>
      <ReviewPageContent />
    </Suspense>
  )
}
