"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Progress } from "@/components/ui/progress"
import { ArrowLeft, ArrowRight, Check, Package } from "lucide-react"
import { cn } from "@/lib/utils"
import { toast } from "sonner"
import { apiClient } from "@/lib/api-client"
import { AddressInput, type AddressData } from "@/components/booking/address-input"
import { DateTimeStep } from "@/components/booking/date-time-step"
import { ReviewStep } from "@/components/booking/review-step"
import { TransportEstimateCard } from "@/components/estimation/transport-estimate-card"
import { IntakeCollector } from "@/components/intake/intake-collector"
import type { TimeSlot, ItemCandidate } from "@/types"
import { DashboardLayout } from "@/components/dashboard/dashboard-layout"
import { navItems } from "@/lib/customer-nav-config"
import { normalizeVNPhone, isValidVNPhone } from "@/utils/phone"

const STEPS = ["Địa chỉ", "Đồ đạc", "Thời gian", "Xác nhận"]

interface BookingItem {
  categoryId: number
  name: string
  brand?: string
  model?: string
  quantity: number
  weight?: number
  declaredValueVnd?: number
  isFragile?: boolean
  requiresDisassembly?: boolean
  requiresPackaging?: boolean
  imageUrls?: string[]
}

interface BookingFormData {
  pickupAddress: AddressData
  deliveryAddress: AddressData
  items: BookingItem[]
  preferredDate: string
  preferredTimeSlot: TimeSlot
  specialRequirements: string
  notes: string
}

const initialFormData: BookingFormData = {
  pickupAddress: {
    address: "",
    province: "",
    district: "",
    ward: "",
    contactName: "",
    contactPhone: "",
    floor: null,
    hasElevator: false,
  },
  deliveryAddress: {
    address: "",
    province: "",
    district: "",
    ward: "",
    contactName: "",
    contactPhone: "",
    floor: null,
    hasElevator: false,
  },
  items: [],
  preferredDate: "",
  preferredTimeSlot: "FLEXIBLE",
  specialRequirements: "",
  notes: "",
}

export default function CreateBookingPage() {
  const router = useRouter()
  const [currentStep, setCurrentStep] = useState(1)
  const [formData, setFormData] = useState<BookingFormData>(initialFormData)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [errors, setErrors] = useState<Record<string, any>>({})
  const [itemCandidates, setItemCandidates] = useState<ItemCandidate[]>([])
  const [estimations, setEstimations] = useState<any[]>([])
  const [showEstimations, setShowEstimations] = useState(false)
  const [isEstimating, setIsEstimating] = useState(false)

  // Convert ItemCandidate to BookingItem
  const convertCandidatesToBookingItems = (candidates: ItemCandidate[]): BookingItem[] => {
    return candidates.map((c) => ({
      categoryId: c.category_id || 0,
      name: c.name,
      brand: (c.metadata as any)?.brand || undefined,
      model: (c.metadata as any)?.model || undefined,
      quantity: c.quantity,
      weight: c.weight_kg || undefined,
      declaredValueVnd: (c.metadata as any)?.declared_value || undefined,
      isFragile: c.is_fragile,
      requiresDisassembly: c.requires_disassembly,
      requiresPackaging: c.requires_packaging,
      imageUrls: c.image_url ? [c.image_url] : undefined,
    }))
  }

  const handleItemsCollected = (candidates: ItemCandidate[]) => {
    setItemCandidates(candidates)
    const bookingItems = convertCandidatesToBookingItems(candidates)
    setFormData((prev) => ({ ...prev, items: bookingItems }))
    toast.success(`Đã thu thập ${candidates.length} vật phẩm`)
  }

  useEffect(() => {
    // Load from saved items (from Đồ của tôi)
    const savedItemsCandidatesJson = sessionStorage.getItem("savedItemsCandidates")
    if (savedItemsCandidatesJson) {
      try {
        const savedCandidates = JSON.parse(savedItemsCandidatesJson)
        setItemCandidates(savedCandidates)
        const bookingItems = convertCandidatesToBookingItems(savedCandidates)
        setFormData((prev) => ({ ...prev, items: bookingItems }))
        sessionStorage.removeItem("savedItemsCandidates")
        toast.success(`Đã tải ${savedCandidates.length} món đồ từ kho`)
        // Do not auto-skip step 1 (address)
        // setCurrentStep(2)
      } catch (error) {
        console.error("Failed to load saved items:", error)
      }
      return
    }

    // Load from AI detection (old flow)
    // Removed legacy AI items loading logic
    const aiDetectedItemsJson = sessionStorage.getItem("aiDetectedItems")
    if (aiDetectedItemsJson) {
      sessionStorage.removeItem("aiDetectedItems")
    }
  }, [])

  // Validate current step
  const validateStep = (step: number): boolean => {
    const newErrors: Record<string, any> = {}

    if (step === 1) {
      // Validate addresses
      if (!formData.pickupAddress.address) newErrors.pickupAddress = { address: "Nhập địa chỉ đón" }
      if (!formData.pickupAddress.province)
        newErrors.pickupAddress = { ...newErrors.pickupAddress, province: "Chọn tỉnh/thành" }
      if (!formData.pickupAddress.district)
        newErrors.pickupAddress = { ...newErrors.pickupAddress, district: "Chọn quận/huyện" }
      if (!formData.pickupAddress.ward) newErrors.pickupAddress = { ...newErrors.pickupAddress, ward: "Chọn phường/xã" }
      if (!formData.pickupAddress.contactName)
        newErrors.pickupAddress = { ...newErrors.pickupAddress, contactName: "Nhập tên người liên hệ" }
      const normalizedPickupPhone = normalizeVNPhone(formData.pickupAddress.contactPhone)
      if (!formData.pickupAddress.contactPhone || !isValidVNPhone(normalizedPickupPhone)) {
        newErrors.pickupAddress = { ...newErrors.pickupAddress, contactPhone: "Số điện thoại không hợp lệ" }
      }

      if (!formData.deliveryAddress.address) newErrors.deliveryAddress = { address: "Nhập địa chỉ giao" }
      if (!formData.deliveryAddress.province)
        newErrors.deliveryAddress = { ...newErrors.deliveryAddress, province: "Chọn tỉnh/thành" }
      if (!formData.deliveryAddress.district)
        newErrors.deliveryAddress = { ...newErrors.deliveryAddress, district: "Chọn quận/huyện" }
      if (!formData.deliveryAddress.ward)
        newErrors.deliveryAddress = { ...newErrors.deliveryAddress, ward: "Chọn phường/xã" }
      if (!formData.deliveryAddress.contactName)
        newErrors.deliveryAddress = { ...newErrors.deliveryAddress, contactName: "Nhập tên người liên hệ" }
      const normalizedDeliveryPhone = normalizeVNPhone(formData.deliveryAddress.contactPhone)
      if (!formData.deliveryAddress.contactPhone || !isValidVNPhone(normalizedDeliveryPhone)) {
        newErrors.deliveryAddress = { ...newErrors.deliveryAddress, contactPhone: "Số điện thoại không hợp lệ" }
      }
    } else if (step === 2) {
      // Validate items
      if (formData.items.length === 0) {
        newErrors.items = "Phải có ít nhất 1 món đồ"
      }
    } else if (step === 3) {
      // Validate date/time
      if (!formData.preferredDate) {
        newErrors.preferredDate = "Chọn ngày đón"
      } else {
        const selectedDate = new Date(formData.preferredDate)
        const tomorrow = new Date()
        tomorrow.setDate(tomorrow.getDate() + 1)
        if (selectedDate < tomorrow) {
          newErrors.preferredDate = "Ngày đón phải sau hôm nay"
        }
      }
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  // Handle next step
  const handleNext = () => {
    if (validateStep(currentStep)) {
      setCurrentStep((prev) => Math.min(prev + 1, STEPS.length))
    } else {
      toast.error("Vui lòng điền đầy đủ thông tin")
    }
  }

  // Handle previous step
  const handlePrevious = () => {
    setCurrentStep((prev) => Math.max(prev - 1, 1))
  }

  // Handle form submission
  const handleSubmit = async () => {
    // Final validation
    if (!validateStep(currentStep)) {
      toast.error("Vui lòng kiểm tra lại thông tin")
      return
    }

    // Validate all previous steps
    for (let step = 1; step <= STEPS.length; step++) {
      if (!validateStep(step)) {
        setCurrentStep(step)
        toast.error(`Vui lòng hoàn thiện bước ${step}: ${STEPS[step - 1]}`)
        return
      }
    }

    setIsSubmitting(true)

    try {
      // Normalize phone numbers
      const pickupPhone = normalizeVNPhone(formData.pickupAddress.contactPhone)
      const deliveryPhone = normalizeVNPhone(formData.deliveryAddress.contactPhone)

      // Final validation for phone numbers
      if (!isValidVNPhone(pickupPhone)) {
        throw new Error("Số điện thoại đón hàng không hợp lệ")
      }
      if (!isValidVNPhone(deliveryPhone)) {
        throw new Error("Số điện thoại giao hàng không hợp lệ")
      }

      const response = await apiClient.createBooking({
        pickupAddress: {
          address: formData.pickupAddress.address.trim(),
          province: formData.pickupAddress.province,
          district: formData.pickupAddress.district,
          ward: formData.pickupAddress.ward,
          contactName: formData.pickupAddress.contactName.trim(),
          contactPhone: pickupPhone,
          floor: formData.pickupAddress.floor,
          hasElevator: formData.pickupAddress.hasElevator,
        },
        deliveryAddress: {
          address: formData.deliveryAddress.address.trim(),
          province: formData.deliveryAddress.province,
          district: formData.deliveryAddress.district,
          ward: formData.deliveryAddress.ward,
          contactName: formData.deliveryAddress.contactName.trim(),
          contactPhone: deliveryPhone,
          floor: formData.deliveryAddress.floor,
          hasElevator: formData.deliveryAddress.hasElevator,
        },
        items: formData.items,
        preferredDate: formData.preferredDate,
        preferredTimeSlot: formData.preferredTimeSlot,
        specialRequirements: formData.specialRequirements?.trim() || undefined,
        notes: formData.notes?.trim() || undefined,
      })

      // Extract booking ID from response
      const bookingId = (response as any).booking?.bookingId || (response as any).bookingId

      if (!bookingId) {
        throw new Error("Không thể tạo đơn hàng. Vui lòng thử lại.")
      }

      // Success feedback
      toast.success("Đơn hàng đã được tạo thành công!", {
        description: "Các nhà vận chuyển sẽ gửi báo giá trong thời gian sớm nhất.",
        duration: 5000,
      })

      // Clear session storage
      sessionStorage.removeItem("savedItemsCandidates")
      sessionStorage.removeItem("aiDetectedItems")

      // Navigate to quotations page
      router.push(`/customer/bookings/${bookingId}/quotations`)
    } catch (error: any) {
      console.error("Create booking error:", error)

      // Handle specific error cases
      if (error?.status === 401) {
        toast.error("Phiên đăng nhập đã hết hạn", {
          description: "Vui lòng đăng nhập lại để tiếp tục.",
        })
        router.push("/login")
      } else if (error?.status === 400) {
        toast.error("Thông tin không hợp lệ", {
          description: error.message || "Vui lòng kiểm tra lại thông tin đã nhập.",
        })
      } else if (error?.status === 500) {
        toast.error("Lỗi hệ thống", {
          description: "Vui lòng thử lại sau ít phút.",
        })
      } else {
        toast.error("Không thể tạo đơn hàng", {
          description: error instanceof Error ? error.message : "Đã có lỗi xảy ra. Vui lòng thử lại.",
        })
      }
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleGetEstimations = async () => {
    // Validate required data before estimation
    if (!formData.pickupAddress.address || !formData.deliveryAddress.address) {
      toast.error("Vui lòng nhập địa chỉ đón và giao hàng")
      return
    }

    if (formData.items.length === 0) {
      toast.error("Vui lòng thêm ít nhất 1 món đồ")
      return
    }

    if (!formData.preferredDate) {
      toast.error("Vui lòng chọn ngày đón hàng")
      return
    }

    setIsEstimating(true)
    setEstimations([])
    setShowEstimations(false)

    try {
      const response = await fetch("/api/estimation/auto", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          pickup_address: `${formData.pickupAddress.address}, ${formData.pickupAddress.ward}, ${formData.pickupAddress.district}, ${formData.pickupAddress.province}`,
          delivery_address: `${formData.deliveryAddress.address}, ${formData.deliveryAddress.ward}, ${formData.deliveryAddress.district}, ${formData.deliveryAddress.province}`,
          items: formData.items,
          pickup_floor: formData.pickupAddress.floor,
          delivery_floor: formData.deliveryAddress.floor,
          has_elevator_pickup: formData.pickupAddress.hasElevator,
          has_elevator_delivery: formData.deliveryAddress.hasElevator,
          pickup_datetime: formData.preferredDate,
        }),
      })

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`)
      }

      const data = await response.json()

      if (data.success && data.estimations && data.estimations.length > 0) {
        setEstimations(data.estimations)
        setShowEstimations(true)
        toast.success(`Tìm thấy ${data.estimations.length} nhà vận chuyển phù hợp`, {
          description: "Đây là giá tham khảo. Giá thực tế sẽ được các nhà vận chuyển báo sau khi tạo đơn.",
        })
      } else if (data.success && data.estimations?.length === 0) {
        toast.warning("Không tìm thấy nhà vận chuyển phù hợp", {
          description: "Bạn vẫn có thể tạo đơn và chờ các nhà vận chuyển báo giá.",
        })
      } else {
        toast.error("Không thể tính giá ước tính", {
          description: data.error || "Vui lòng thử lại hoặc tạo đơn để nhận báo giá từ các nhà vận chuyển.",
        })
      }
    } catch (error: any) {
      console.error("Estimation error:", error)
      toast.error("Không thể tải giá ước tính", {
        description: "Bạn vẫn có thể tạo đơn hàng để nhận báo giá trực tiếp từ các nhà vận chuyển.",
      })
    } finally {
      setIsEstimating(false)
    }
  }

  return (
    <DashboardLayout navItems={navItems} title="Create Booking">
      <div className="container max-w-4xl py-10 mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-2">Tạo chuyến đi mới</h1>
          <p className="text-muted-foreground">Điền thông tin để nhận báo giá từ các đơn vị vận chuyển</p>
        </div>

        {/* Progress Bar */}
        <div className="mb-8">
          <div className="flex justify-between mb-2">
            {STEPS.map((step, index) => (
              <div
                key={step}
                className={cn(
                  "text-sm font-medium transition-colors",
                  index + 1 === currentStep && "text-primary",
                  index + 1 < currentStep && "text-success",
                  index + 1 > currentStep && "text-muted-foreground",
                )}
              >
                <span className="flex items-center gap-2">
                  {index + 1 < currentStep ? (
                    <Check className="h-4 w-4" />
                  ) : (
                    <span
                      className={cn(
                        "flex h-6 w-6 items-center justify-center rounded-full border-2",
                        index + 1 === currentStep && "border-primary bg-primary text-primary-foreground",
                        index + 1 < currentStep && "border-success bg-success text-white",
                        index + 1 > currentStep && "border-muted-foreground",
                      )}
                    >
                      {index + 1}
                    </span>
                  )}
                  <span className="hidden sm:inline">{step}</span>
                </span>
              </div>
            ))}
          </div>
          <Progress value={(currentStep / STEPS.length) * 100} className="h-2" />
        </div>

        {/* Step Content */}
        <Card>
          <CardHeader>
            <CardTitle>{STEPS[currentStep - 1]}</CardTitle>
          </CardHeader>
          <CardContent className="min-h-[400px]">
            {currentStep === 1 && (
              <div className="space-y-6">
                <AddressInput
                  label="Địa chỉ đón"
                  value={formData.pickupAddress}
                  onChange={(value) => setFormData({ ...formData, pickupAddress: value })}
                  errors={errors.pickupAddress}
                />
                <AddressInput
                  label="Địa chỉ giao"
                  value={formData.deliveryAddress}
                  onChange={(value) => setFormData({ ...formData, deliveryAddress: value })}
                  errors={errors.deliveryAddress}
                />
              </div>
            )}

            {currentStep === 2 && (
              <div className="space-y-4">
                {/* Quick access to saved items */}
                <div className="flex justify-center">
                  <Button
                    variant="outline"
                    onClick={() => router.push("/customer/saved-items")}
                    size="sm"
                  >
                    <Package className="h-4 w-4 mr-2" />
                    Chọn từ Đồ của tôi
                  </Button>
                </div>

                <IntakeCollector
                  sessionId={0}
                  onContinue={handleItemsCollected}
                  hideFooter={true}
                  initialCandidates={itemCandidates}
                />
                {errors.items && <p className="text-sm text-destructive text-center mt-4">{errors.items}</p>}
                {formData.items.length > 0 && (
                  <div className="text-center text-sm text-muted-foreground mt-4">
                    Đã có <span className="font-semibold text-foreground">{formData.items.length}</span> vật phẩm
                  </div>
                )}
              </div>
            )}

            {currentStep === 3 && (
              <DateTimeStep
                preferredDate={formData.preferredDate}
                preferredTimeSlot={formData.preferredTimeSlot}
                specialRequirements={formData.specialRequirements}
                notes={formData.notes}
                onChange={(data) => setFormData({ ...formData, ...data })}
                errors={errors}
              />
            )}

            {currentStep === 4 && (
              <div className="space-y-6">
                <ReviewStep formData={formData} />

                {!showEstimations && (
                  <div className="flex justify-center">
                    <Button onClick={handleGetEstimations} disabled={isEstimating} variant="outline" size="lg">
                      {isEstimating ? "Đang tính giá..." : "Xem giá ước tính từ các nhà vận chuyển"}
                    </Button>
                  </div>
                )}

                {showEstimations && estimations.length > 0 && (
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <h3 className="text-lg font-semibold">Giá ước tính ({estimations.length} nhà vận chuyển)</h3>
                      <Button variant="ghost" size="sm" onClick={() => setShowEstimations(false)}>
                        Ẩn
                      </Button>
                    </div>
                    <p className="text-sm text-muted-foreground">
                      Đây là giá tham khảo. Sau khi tạo đơn, các nhà vận chuyển sẽ báo giá chính xác.
                    </p>
                    <div className="grid gap-4">
                      {estimations.map((estimate, index) => (
                        <TransportEstimateCard
                          key={estimate.transport_id}
                          estimate={estimate}
                          isLowest={index === 0}
                        />
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}
          </CardContent>

          <CardFooter className="flex justify-between">
            <Button variant="outline" onClick={handlePrevious} disabled={currentStep === 1 || isSubmitting}>
              <ArrowLeft className="mr-2 h-4 w-4" />
              Quay lại
            </Button>

            {currentStep < STEPS.length ? (
              <Button onClick={handleNext} disabled={isSubmitting}>
                Tiếp theo
                <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            ) : (
              <Button
                onClick={handleSubmit}
                disabled={isSubmitting}
                className="bg-success hover:bg-success/90"
              >
                {isSubmitting ? "Đang tạo đơn hàng..." : "Tạo đơn hàng"}
                <Check className="ml-2 h-4 w-4" />
              </Button>
            )}
          </CardFooter>
        </Card>
      </div>
    </DashboardLayout>
  )
}
