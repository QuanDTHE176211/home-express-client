"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Separator } from "@/components/ui/separator"
import { Badge } from "@/components/ui/badge"
import { MapPin, Package, Calendar, Clock, FileText } from "lucide-react"
import { useLocationNames } from "@/hooks/use-location-names"
import type { TimeSlot } from "@/types"

interface ReviewStepProps {
  formData: {
    pickupAddress: {
      address: string
      province: string
      district: string
      ward: string
      contactName: string
      contactPhone: string
      floor: number | null
      hasElevator: boolean
    }
    deliveryAddress: {
      address: string
      province: string
      district: string
      ward: string
      contactName: string
      contactPhone: string
      floor: number | null
      hasElevator: boolean
    }
    items: Array<{
      categoryId: number
      name: string
      quantity: number
      weight?: number
      isFragile?: boolean
      requiresDisassembly?: boolean
      requiresPackaging?: boolean
    }>
    preferredDate: string
    preferredTimeSlot: TimeSlot
    specialRequirements: string
    notes: string
  }
}

const TIME_SLOT_LABELS: Record<TimeSlot, string> = {
  MORNING: "Buổi sáng (7:00 - 12:00)",
  AFTERNOON: "Buổi chiều (12:00 - 17:00)",
  EVENING: "Buổi tối (17:00 - 21:00)",
  FLEXIBLE: "Linh hoạt",
}

const formatDate = (dateString: string) => {
  const date = new Date(dateString)
  return date.toLocaleDateString("vi-VN", {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
  })
}

const formatAddress = (
  address: ReviewStepProps["formData"]["pickupAddress"],
  names: ReturnType<typeof useLocationNames>,
) => {
  if (names.isLoading && !names.provinceName && !names.districtName && !names.wardName) {
    return address.address || "Đang tải địa chỉ..."
  }

  const parts = [
    address.address,
    names.wardName || address.ward,
    names.districtName || address.district,
    names.provinceName || address.province,
  ].filter(Boolean)

  return parts.join(", ")
}

export function ReviewStep({ formData }: ReviewStepProps) {
  const pickupNames = useLocationNames({
    provinceCode: formData.pickupAddress.province,
    districtCode: formData.pickupAddress.district,
    wardCode: formData.pickupAddress.ward,
  })

  const deliveryNames = useLocationNames({
    provinceCode: formData.deliveryAddress.province,
    districtCode: formData.deliveryAddress.district,
    wardCode: formData.deliveryAddress.ward,
  })

  return (
    <div className="space-y-6">
      <div className="rounded-lg bg-muted/50 p-4">
        <p className="text-sm text-muted-foreground">
          Vui lòng kiểm tra kỹ thông tin trước khi hoàn tất. Sau khi tạo booking, các đối tác vận chuyển sẽ gửi báo
          giá cho bạn.
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <MapPin className="h-5 w-5" />
            Địa chỉ
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <p className="mb-1 text-sm font-medium text-muted-foreground">Địa chỉ đón</p>
            <p className="font-medium">{formatAddress(formData.pickupAddress, pickupNames)}</p>
            <p className="mt-1 text-sm text-muted-foreground">
              Liên hệ: {formData.pickupAddress.contactName} - {formData.pickupAddress.contactPhone}
            </p>
            {formData.pickupAddress.floor !== null && (
              <p className="text-sm text-muted-foreground">
                Tầng {formData.pickupAddress.floor} {formData.pickupAddress.hasElevator && "- Có thang máy"}
              </p>
            )}
          </div>

          <Separator />

          <div>
            <p className="mb-1 text-sm font-medium text-muted-foreground">Địa chỉ giao</p>
            <p className="font-medium">{formatAddress(formData.deliveryAddress, deliveryNames)}</p>
            <p className="mt-1 text-sm text-muted-foreground">
              Liên hệ: {formData.deliveryAddress.contactName} - {formData.deliveryAddress.contactPhone}
            </p>
            {formData.deliveryAddress.floor !== null && (
              <p className="text-sm text-muted-foreground">
                Tầng {formData.deliveryAddress.floor} {formData.deliveryAddress.hasElevator && "- Có thang máy"}
              </p>
            )}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Package className="h-5 w-5" />
            Đồ đạc & vật dụng
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {formData.items.length === 0 ? (
            <p className="text-sm text-muted-foreground">Chưa có vật dụng nào được thêm.</p>
          ) : (
            formData.items.map((item, index) => (
              <div key={`${item.categoryId}-${index}`} className="rounded-lg border p-3">
                <div className="flex items-center justify-between">
                  <p className="font-medium">{item.name}</p>
                  <Badge variant="secondary">x{item.quantity}</Badge>
                </div>
                <div className="mt-2 flex flex-wrap gap-2 text-xs text-muted-foreground">
                  {item.isFragile && <Badge variant="outline">Dễ vỡ</Badge>}
                  {item.requiresDisassembly && <Badge variant="outline">Cần tháo rời</Badge>}
                  {item.requiresPackaging && <Badge variant="outline">Cần đóng gói</Badge>}
                  {item.weight && <Badge variant="outline">Khoảng {item.weight} kg</Badge>}
                </div>
              </div>
            ))
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Calendar className="h-5 w-5" />
            Thời gian
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          <div className="flex items-center gap-2">
            <Calendar className="h-4 w-4 text-primary" />
            <span className="font-medium">{formatDate(formData.preferredDate)}</span>
          </div>
          <div className="flex items-center gap-2">
            <Clock className="h-4 w-4 text-primary" />
            <span className="font-medium">{TIME_SLOT_LABELS[formData.preferredTimeSlot]}</span>
          </div>
        </CardContent>
      </Card>

      {(formData.specialRequirements || formData.notes) && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FileText className="h-5 w-5" />
              Ghi chú
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {formData.specialRequirements && (
              <div>
                <p className="text-sm font-medium text-muted-foreground">Yêu cầu đặc biệt</p>
                <p className="font-medium">{formData.specialRequirements}</p>
              </div>
            )}
            {formData.notes && (
              <div>
                <p className="text-sm font-medium text-muted-foreground">Ghi chú thêm</p>
                <p className="font-medium whitespace-pre-line">{formData.notes}</p>
              </div>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  )
}
