import type { VehicleType, VehiclePricing } from "@/types"

/**
 * Utility functions for Member 3 - Vehicle & Pricing
 */

// Vehicle type labels (Vietnamese)
export const vehicleTypeLabels: Record<VehicleType, string> = {
  motorcycle: "Xe máy",
  van: "Xe Van",
  truck_small: "Xe tải 1.5 tấn",
  truck_large: "Xe tải 3.5 tấn",
  other: "Loại khác",
}

// Vehicle type icons
export const vehicleTypeIcons: Record<VehicleType, string> = {
  motorcycle: "🏍️",
  van: "🚐",
  truck_small: "🚚",
  truck_large: "🚛",
  other: "🚗",
}

// Vehicle status labels
export type VehicleStatusKey = "ACTIVE" | "IN_USE" | "UNDER_MAINTENANCE" | "INACTIVE"

export const vehicleStatusLabels: Record<VehicleStatusKey, string> = {
  ACTIVE: "Sẵn sàng",
  IN_USE: "Đang dùng",
  UNDER_MAINTENANCE: "Bảo trì",
  INACTIVE: "Không hoạt động",
}

// Vehicle status colors (Tailwind classes)
export const vehicleStatusColors: Record<VehicleStatusKey, string> = {
  ACTIVE: "bg-success/10 text-success border-success",
  IN_USE: "bg-warning/10 text-warning border-warning",
  UNDER_MAINTENANCE: "bg-error/10 text-error border-error",
  INACTIVE: "bg-gray-100 text-gray-800 border-gray-300",
}

export function normalizeVehicleStatus(status?: string): VehicleStatusKey {
  if (!status) return "ACTIVE"

  const value = status.toString().trim().toUpperCase()

  if (value === "INACTIVE") return "INACTIVE"
  if (value === "IN_USE") return "IN_USE"
  if (value === "UNDER_MAINTENANCE" || value === "MAINTENANCE") return "UNDER_MAINTENANCE"
  if (value === "AVAILABLE") return "ACTIVE"

  return "ACTIVE"
}

/**
 * Validate Vietnamese license plate format
 * Format: 51F-12345 (2 digits + 1 letter + dash + 4-5 digits)
 */
export function validateLicensePlate(plate: string): boolean {
  const regex = /^[0-9]{2}[A-Z]-[0-9]{4,5}$/
  return regex.test(plate)
}

/**
 * Calculate distance price using tiered pricing
 */
export function calculateDistancePrice(distanceKm: number, pricing: VehiclePricing): number {
  let total = 0

  if (distanceKm <= 4) {
    total = distanceKm * pricing.per_km_first_4km
  } else if (distanceKm <= 40) {
    total = 4 * pricing.per_km_first_4km + (distanceKm - 4) * pricing.per_km_5_to_40km
  } else {
    total = 4 * pricing.per_km_first_4km + 36 * pricing.per_km_5_to_40km + (distanceKm - 40) * pricing.per_km_after_40km
  }

  return Math.round(total)
}

/**
 * Calculate category price with modifiers
 */
export function calculateCategoryPrice(
  basePrice: number,
  isFragile: boolean,
  requiresDisassembly: boolean,
  isHeavy: boolean,
  fragileMultiplier: number,
  disassemblyMultiplier: number,
  heavyMultiplier: number,
): number {
  let price = basePrice

  if (isFragile) price *= fragileMultiplier
  if (requiresDisassembly) price *= disassemblyMultiplier
  if (isHeavy) price *= heavyMultiplier

  return Math.round(price)
}

/**
 * Check if time is peak hour (7-9 AM or 5-7 PM)
 */
export function isPeakHour(datetime: Date): boolean {
  const hour = datetime.getHours()
  return (hour >= 7 && hour < 9) || (hour >= 17 && hour < 19)
}

/**
 * Check if date is weekend
 */
export function isWeekend(datetime: Date): boolean {
  const day = datetime.getDay()
  return day === 0 || day === 6
}

/**
 * Check if date is holiday (simplified - you can expand this)
 */
export function isHoliday(datetime: Date): boolean {
  // Vietnamese holidays (simplified)
  const holidays = [
    "01-01", // New Year
    "04-30", // Reunification Day
    "05-01", // Labor Day
    "09-02", // National Day
  ]

  const monthDay = `${String(datetime.getMonth() + 1).padStart(2, "0")}-${String(datetime.getDate()).padStart(2, "0")}`
  return holidays.includes(monthDay)
}

/**
 * Recommend vehicle type based on total weight and volume
 */
export function recommendVehicleType(totalWeightKg: number, totalVolumeM3: number): VehicleType {
  if (totalWeightKg <= 30 && totalVolumeM3 <= 0.3) {
    return "motorcycle"
  } else if (totalWeightKg <= 600 && totalVolumeM3 <= 6) {
    return "van"
  } else if (totalWeightKg <= 1200 && totalVolumeM3 <= 12) {
    return "truck_small"
  } else {
    return "truck_large"
  }
}

/**
 * Generate SHA-256 hash for address caching
 */
export async function hashAddress(address: string): Promise<string> {
  const encoder = new TextEncoder()
  const data = encoder.encode(address.toLowerCase().trim())
  const hashBuffer = await crypto.subtle.digest("SHA-256", data)
  const hashArray = Array.from(new Uint8Array(hashBuffer))
  const hashHex = hashArray.map((b) => b.toString(16).padStart(2, "0")).join("")
  return hashHex
}
