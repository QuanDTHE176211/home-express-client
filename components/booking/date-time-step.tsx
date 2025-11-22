"use client"

import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Card, CardContent } from "@/components/ui/card"
import { Calendar, Clock } from "lucide-react"
import { cn } from "@/lib/utils"
import type { TimeSlot } from "@/types"

interface DateTimeStepProps {
  preferredDate: string
  preferredTimeSlot: TimeSlot
  specialRequirements: string
  notes: string
  onChange: (data: {
    preferredDate?: string
    preferredTimeSlot?: TimeSlot
    specialRequirements?: string
    notes?: string
  }) => void
  errors?: Record<string, string>
}

const TIME_SLOTS: { value: TimeSlot; label: string; time: string }[] = [
  { value: "MORNING", label: "Buổi sáng", time: "7:00 - 12:00" },
  { value: "AFTERNOON", label: "Buổi chiều", time: "12:00 - 17:00" },
  { value: "EVENING", label: "Buổi tối", time: "17:00 - 21:00" },
  { value: "FLEXIBLE", label: "Linh hoạt", time: "Tùy thời gian" },
]

export function DateTimeStep({
  preferredDate,
  preferredTimeSlot,
  specialRequirements,
  notes,
  onChange,
  errors,
}: DateTimeStepProps) {
  // Get tomorrow's date as minimum
  const tomorrow = new Date()
  tomorrow.setDate(tomorrow.getDate() + 1)
  const minDate = tomorrow.toISOString().split("T")[0]

  return (
    <div className="space-y-6">
      {/* Date Selection */}
      <div className="space-y-2">
        <Label htmlFor="preferred-date" className="flex items-center gap-2">
          <Calendar className="h-4 w-4" />
          Ngày đón <span className="text-destructive">*</span>
        </Label>
        <Input
          id="preferred-date"
          type="date"
          min={minDate}
          value={preferredDate}
          onChange={(e) => onChange({ preferredDate: e.target.value })}
          className={errors?.preferredDate ? "border-destructive" : ""}
        />
        {errors?.preferredDate && <p className="text-sm text-destructive">{errors.preferredDate}</p>}
        <p className="text-sm text-muted-foreground">Chọn ngày bạn muốn được đón hàng</p>
      </div>

      {/* Time Slot Selection */}
      <div className="space-y-2">
        <Label className="flex items-center gap-2">
          <Clock className="h-4 w-4" />
          Khung giờ <span className="text-destructive">*</span>
        </Label>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {TIME_SLOTS.map((slot) => (
            <Card
              key={slot.value}
              className={cn(
                "cursor-pointer transition-all hover:border-primary",
                preferredTimeSlot === slot.value && "border-primary bg-primary/5",
              )}
              onClick={() => onChange({ preferredTimeSlot: slot.value })}
            >
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium">{slot.label}</p>
                    <p className="text-sm text-muted-foreground">{slot.time}</p>
                  </div>
                  <div
                    className={cn(
                      "h-5 w-5 rounded-full border-2 transition-colors",
                      preferredTimeSlot === slot.value ? "border-primary bg-primary" : "border-muted-foreground",
                    )}
                  >
                    {preferredTimeSlot === slot.value && (
                      <div className="h-full w-full flex items-center justify-center">
                        <div className="h-2 w-2 rounded-full bg-white" />
                      </div>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>

      {/* Special Requirements */}
      <div className="space-y-2">
        <Label htmlFor="special-requirements">Yêu cầu đặc biệt</Label>
        <Textarea
          id="special-requirements"
          placeholder="Ví dụ: Cần xe tải lớn, có thang máy tải, cần bảo hiểm..."
          value={specialRequirements}
          onChange={(e) => onChange({ specialRequirements: e.target.value })}
          rows={3}
        />
      </div>

      {/* Notes */}
      <div className="space-y-2">
        <Label htmlFor="notes">Ghi chú</Label>
        <Textarea
          id="notes"
          placeholder="Thông tin bổ sung khác..."
          value={notes}
          onChange={(e) => onChange({ notes: e.target.value })}
          rows={3}
        />
      </div>
    </div>
  )
}
