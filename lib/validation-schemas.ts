import { z } from "zod"

/**
 * Validation schemas for Member 2 features
 */

// Address validation schema
export const addressSchema = z.object({
  address: z.string().min(10, "Địa chỉ phải có ít nhất 10 ký tự"),
  province: z.string().min(1, "Chọn tỉnh/thành phố"),
  district: z.string().min(1, "Chọn quận/huyện"),
  ward: z.string().min(1, "Chọn phường/xã"),
  contactName: z.string().min(2, "Nhập tên người liên hệ"),
  contactPhone: z.string().regex(/^0[1-9][0-9]{8}$/, "Số điện thoại không hợp lệ"),
  floor: z.number().min(0).nullable(),
  hasElevator: z.boolean(),
})

// Booking item schema
export const bookingItemSchema = z.object({
  categoryId: z.number(),
  name: z.string().min(2, "Tên món đồ phải có ít nhất 2 ký tự"),
  quantity: z.number().min(1, "Số lượng phải lớn hơn 0"),
  weight: z.number().positive().optional(),
  isFragile: z.boolean().optional(),
  requiresDisassembly: z.boolean().optional(),
  requiresPackaging: z.boolean().optional(),
  imageUrls: z.array(z.string().url()).optional(),
})

// Create booking schema
export const createBookingSchema = z.object({
  pickupAddress: addressSchema,
  deliveryAddress: addressSchema,
  items: z.array(bookingItemSchema).min(1, "Phải có ít nhất 1 món đồ"),
  preferredDate: z.string().refine(
    (date) => {
      const d = new Date(date)
      const tomorrow = new Date()
      tomorrow.setDate(tomorrow.getDate() + 1)
      return d >= tomorrow
    },
    { message: "Ngày đón phải sau hôm nay" },
  ),
  preferredTimeSlot: z.enum(["MORNING", "AFTERNOON", "EVENING", "FLEXIBLE"]),
  specialRequirements: z.string().optional(),
  notes: z.string().optional(),
})

// Submit quotation schema
export const submitQuotationSchema = z.object({
  bookingId: z.number(),
  basePrice: z.number().min(100000, "Phí cơ bản tối thiểu 100.000đ"),
  distancePrice: z.number().min(0),
  itemHandlingPrice: z.number().min(0),
  additionalServicesPrice: z.number().min(0).default(0),
  includesPackaging: z.boolean().default(false),
  includesDisassembly: z.boolean().default(false),
  includesInsurance: z.boolean().default(false),
  insuranceValue: z.number().positive().optional(),
  estimatedDurationHours: z.number().min(1).max(24),
  estimatedStartTime: z.string(),
  notes: z.string().max(500).optional(),
})

// Cancel booking schema
export const cancelBookingSchema = z.object({
  cancellationReason: z.string().min(10, "Lý do hủy phải có ít nhất 10 ký tự"),
})

// ============================================================================
// MEMBER 3: VEHICLE, PRICING & ESTIMATION VALIDATION SCHEMAS
// ============================================================================

// Vehicle validation schema
export const vehicleSchema = z.object({
  type: z.enum(["motorcycle", "van", "truck_small", "truck_large", "other"]),
  model: z.string().min(2, "Model phải có ít nhất 2 ký tự").max(100, "Model không được quá 100 ký tự"),
  licensePlate: z
    .string()
    .regex(/^[0-9]{2}[A-Z]{1,3}-?[0-9]{4,6}$/, "Biển số không đúng định dạng (VD: 51F-12345 hoặc 59AB-123456)"),
  capacityKg: z.number().positive("Tải trọng phải lớn hơn 0").max(10000, "Tải trọng tối đa 10,000kg"),
  capacityM3: z.number().positive().max(100).nullable().optional(),
  year: z
    .number()
    .min(1990, "Năm sản xuất không hợp lệ")
    .max(new Date().getFullYear() + 1)
    .nullable()
    .optional(),
  color: z.string().max(50).optional(),
  hasTailLift: z.boolean().default(false),
  hasTools: z.boolean().default(true),
  description: z.string().max(500).optional(),
  imageUrl: z.string().url().optional(),
})

// Vehicle pricing validation schema
export const vehiclePricingSchema = z.object({
  vehicleId: z.number(),
  basePrice: z.number().min(50000, "Giá cơ bản tối thiểu 50.000đ").max(5000000, "Giá cơ bản tối đa 5.000.000đ"),
  perKmFirst4km: z.number().min(1000, "Giá/km tối thiểu 1.000đ").max(100000, "Giá/km tối đa 100.000đ"),
  perKm5To40km: z.number().min(1000).max(100000),
  perKmAfter40km: z.number().min(1000).max(100000),
  peakHourMultiplier: z.number().min(1.0, "Hệ số tối thiểu 1.0").max(3.0, "Hệ số tối đa 3.0"),
  weekendMultiplier: z.number().min(1.0).max(3.0),
  holidayMultiplier: z.number().min(1.0).max(3.0),
  noElevatorFee: z.number().min(0).max(500000),
  elevatorDiscount: z.number().min(0).max(500000),
})

// Vehicle type pricing validation schema (Option A)
export const vehicleTypePricingSchema = z.object({
  vehicleType: z.enum(["motorcycle", "van", "truck_small", "truck_large", "other"]),
  basePrice: z
    .number()
    .min(50000, "Giá cơ bản tối thiểu 50.000đ")
    .max(5000000, "Giá cơ bản tối đa 5.000.000đ"),
  perKmFirst4km: z.number().min(1000, "Giá/km tối thiểu 1.000đ").max(100000, "Giá/km tối đa 100.000đ"),
  perKm5To40km: z.number().min(1000).max(100000),
  perKmAfter40km: z.number().min(1000).max(100000),
  peakHourMultiplier: z.number().min(1.0, "Hệ số tối thiểu 1.0").max(3.0, "Hệ số tối đa 3.0"),
  weekendMultiplier: z.number().min(1.0).max(3.0),
  holidayMultiplier: z.number().min(1.0).max(3.0),
  noElevatorFee: z.number().min(0).max(500000),
  elevatorDiscount: z.number().min(0).max(500000),
})

// Category pricing validation schema
export const categoryPricingSchema = z.object({
  categoryId: z.number(),
  pricePerUnit: z.number().min(10000, "Giá tối thiểu 10.000đ").max(10000000, "Giá tối đa 10.000.000đ"),
  fragileMultiplier: z.number().min(1.0).max(3.0),
  disassemblyMultiplier: z.number().min(1.0).max(3.0),
  heavyMultiplier: z.number().min(1.0).max(3.0),
  minPrice: z.number().min(0).optional(),
  maxPrice: z.number().min(0).optional(),
})

// Category validation schema
export const categorySchema = z.object({
  name: z.string().min(2, "Tên danh mục phải có ít nhất 2 ký tự").max(100),
  nameEn: z.string().max(100).optional(),
  description: z.string().max(500).optional(),
  icon: z.string().optional(),
  defaultWeightKg: z.number().positive("Trọng lượng phải > 0").max(1000).nullable().optional(),
  defaultVolumeM3: z.number().positive().max(10).nullable().optional(),
  defaultLengthCm: z.number().positive("Chiều dài phải > 0").max(500).nullable().optional(),
  defaultWidthCm: z.number().positive("Chiều rộng phải > 0").max(500).nullable().optional(),
  defaultHeightCm: z.number().positive("Chiều cao phải > 0").max(500).nullable().optional(),
  isFragileDefault: z.boolean().default(false),
  requiresDisassemblyDefault: z.boolean().default(false),
  displayOrder: z.number().int().min(0),
  isActive: z.boolean().default(true),
})

// Size validation schema
export const sizeSchema = z.object({
  name: z.string().min(1, "Tên kích cỡ không được để trống").max(50),
  weightKg: z.number().positive("Trọng lượng phải > 0").max(1000),
  heightCm: z.number().positive().max(500).optional(),
  widthCm: z.number().positive().max(500).optional(),
  depthCm: z.number().positive().max(500).optional(),
  priceMultiplier: z.number().min(0.1, "Hệ số giá tối thiểu 0.1").max(5.0, "Hệ số giá tối đa 5.0"),
})
