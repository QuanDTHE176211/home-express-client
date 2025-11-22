/**
 * Price calculation engine for HomeExpress
 * Calculates total price based on distance, vehicle, items, and various factors
 */

import type { VehiclePricing, CategoryPricing, BookingItem } from "@/types"

interface PriceCalculationInput {
  distanceKm: number
  vehiclePricing: VehiclePricing
  items: BookingItem[]
  categoryPricingMap: Map<number, CategoryPricing>
  pickupFloor: number
  dropoffFloor: number
  hasElevatorPickup: boolean
  hasElevatorDropoff: boolean
  isPeakHour: boolean
  isWeekend: boolean
  isHoliday: boolean
}

interface PriceBreakdown {
  basePrice: number
  distancePrice: number
  itemsPrice: number
  floorFees: number
  timeMultiplier: number
  subtotal: number
  total: number
  breakdown: {
    label: string
    amount: number
    description?: string
  }[]
}

/**
 * Calculate total price for a booking
 */
export function calculatePrice(input: PriceCalculationInput): PriceBreakdown {
  const breakdown: PriceBreakdown = {
    basePrice: 0,
    distancePrice: 0,
    itemsPrice: 0,
    floorFees: 0,
    timeMultiplier: 1,
    subtotal: 0,
    total: 0,
    breakdown: [],
  }

  // 1. Base price
  breakdown.basePrice = input.vehiclePricing.base_price
  breakdown.breakdown.push({
    label: "Giá cơ bản",
    amount: breakdown.basePrice,
  })

  // 2. Distance price (tiered)
  breakdown.distancePrice = calculateDistancePrice(input.distanceKm, input.vehiclePricing)
  breakdown.breakdown.push({
    label: `Khoảng cách (${input.distanceKm.toFixed(1)}km)`,
    amount: breakdown.distancePrice,
    description: getDistanceBreakdown(input.distanceKm, input.vehiclePricing),
  })

  // 3. Items price
  breakdown.itemsPrice = calculateItemsPrice(input.items, input.categoryPricingMap)
  if (breakdown.itemsPrice > 0) {
    breakdown.breakdown.push({
      label: `Đồ đạc (${input.items.length} món)`,
      amount: breakdown.itemsPrice,
    })
  }

  // 4. Floor fees
  breakdown.floorFees = calculateFloorFees(
    input.pickupFloor,
    input.dropoffFloor,
    input.hasElevatorPickup,
    input.hasElevatorDropoff,
    input.vehiclePricing,
  )
  if (breakdown.floorFees > 0) {
    breakdown.breakdown.push({
      label: "Phụ phí tầng",
      amount: breakdown.floorFees,
    })
  }

  // 5. Calculate subtotal before time multipliers
  breakdown.subtotal = breakdown.basePrice + breakdown.distancePrice + breakdown.itemsPrice + breakdown.floorFees

  // 6. Time multipliers
  if (input.isHoliday) {
    breakdown.timeMultiplier = input.vehiclePricing.holiday_multiplier
    breakdown.breakdown.push({
      label: `Ngày lễ (×${breakdown.timeMultiplier})`,
      amount: breakdown.subtotal * (breakdown.timeMultiplier - 1),
    })
  } else if (input.isWeekend) {
    breakdown.timeMultiplier = input.vehiclePricing.weekend_multiplier
    breakdown.breakdown.push({
      label: `Cuối tuần (×${breakdown.timeMultiplier})`,
      amount: breakdown.subtotal * (breakdown.timeMultiplier - 1),
    })
  } else if (input.isPeakHour) {
    breakdown.timeMultiplier = input.vehiclePricing.peak_hour_multiplier
    breakdown.breakdown.push({
      label: `Giờ cao điểm (×${breakdown.timeMultiplier})`,
      amount: breakdown.subtotal * (breakdown.timeMultiplier - 1),
    })
  }

  // 7. Calculate total
  breakdown.total = Math.round(breakdown.subtotal * breakdown.timeMultiplier)

  return breakdown
}

/**
 * Calculate distance price using tiered pricing
 */
function calculateDistancePrice(distanceKm: number, pricing: VehiclePricing): number {
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
 * Get human-readable distance breakdown
 */
function getDistanceBreakdown(distanceKm: number, pricing: VehiclePricing): string {
  if (distanceKm <= 4) {
    return `${distanceKm.toFixed(1)}km × ${pricing.per_km_first_4km.toLocaleString()}đ`
  } else if (distanceKm <= 40) {
    return `4km × ${pricing.per_km_first_4km.toLocaleString()}đ + ${(distanceKm - 4).toFixed(1)}km × ${pricing.per_km_5_to_40km.toLocaleString()}đ`
  } else {
    return `4km × ${pricing.per_km_first_4km.toLocaleString()}đ + 36km × ${pricing.per_km_5_to_40km.toLocaleString()}đ + ${(distanceKm - 40).toFixed(1)}km × ${pricing.per_km_after_40km.toLocaleString()}đ`
  }
}

/**
 * Calculate items price with multipliers
 */
function calculateItemsPrice(items: BookingItem[], categoryPricingMap: Map<number, CategoryPricing>): number {
  let total = 0

  for (const item of items) {
    const categoryPricing = categoryPricingMap.get(item.category_id)
    if (!categoryPricing) continue

    let itemPrice = categoryPricing.price_per_unit * item.quantity

    // Apply multipliers
    if (item.is_fragile && categoryPricing.fragile_multiplier) {
      itemPrice *= categoryPricing.fragile_multiplier
    }
    if (item.requires_disassembly && categoryPricing.disassembly_multiplier) {
      itemPrice *= categoryPricing.disassembly_multiplier
    }
    if (item.weight && item.weight > 100 && categoryPricing.heavy_multiplier) {
      itemPrice *= categoryPricing.heavy_multiplier
    }

    total += itemPrice
  }

  return Math.round(total)
}

/**
 * Calculate floor fees
 */
function calculateFloorFees(
  pickupFloor: number,
  dropoffFloor: number,
  hasElevatorPickup: boolean,
  hasElevatorDropoff: boolean,
  pricing: VehiclePricing,
): number {
  let total = 0

  // Pickup floor fee
  if (pickupFloor > 3 && !hasElevatorPickup) {
    total += pricing.no_elevator_fee
  }

  // Dropoff floor fee
  if (dropoffFloor > 3 && !hasElevatorDropoff) {
    total += pricing.no_elevator_fee
  }

  return Math.round(total)
}

/**
 * Check if time is peak hour (7-9 AM or 5-7 PM)
 */
export function isPeakHour(date: Date): boolean {
  const hour = date.getHours()
  return (hour >= 7 && hour < 9) || (hour >= 17 && hour < 19)
}

/**
 * Check if date is weekend
 */
export function isWeekend(date: Date): boolean {
  const day = date.getDay()
  return day === 0 || day === 6
}

/**
 * Check if date is holiday (Vietnam public holidays)
 */
export function isHoliday(date: Date): boolean {
  const month = date.getMonth() + 1
  const day = date.getDate()

  // Major Vietnamese holidays
  const holidays = [
    { month: 1, day: 1 }, // New Year
    { month: 4, day: 30 }, // Reunification Day
    { month: 5, day: 1 }, // Labor Day
    { month: 9, day: 2 }, // National Day
  ]

  return holidays.some((h) => h.month === month && h.day === day)
}
