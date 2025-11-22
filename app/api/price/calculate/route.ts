import { type NextRequest, NextResponse } from "next/server"
import { calculatePrice, isPeakHour, isWeekend, isHoliday } from "@/lib/price-calculator"
import type { CategoryPricing } from "@/types"

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()

    const {
      vehiclePricing,
      categoryPricingMap,
      distanceKm,
      items,
      pickupFloor,
      dropoffFloor,
      hasElevatorPickup,
      hasElevatorDropoff,
      scheduledTime,
    } = body

    // Validate required fields
    if (!vehiclePricing || !distanceKm) {
      return NextResponse.json({ error: "Vehicle pricing and distance are required" }, { status: 400 })
    }

    // Determine time factors
    const bookingDate = scheduledTime ? new Date(scheduledTime) : new Date()
    const isPeak = isPeakHour(bookingDate)
    const isWeekendDay = isWeekend(bookingDate)
    const isHolidayDay = isHoliday(bookingDate)

    // Calculate price using the pricing data passed from client
    const priceBreakdown = calculatePrice({
      distanceKm,
      vehiclePricing,
      items: items || [],
      categoryPricingMap: new Map<number, CategoryPricing>(
        Object.entries(categoryPricingMap || {}).map(([key, value]) => [Number(key), value as CategoryPricing]),
      ),
      pickupFloor: pickupFloor || 1,
      dropoffFloor: dropoffFloor || 1,
      hasElevatorPickup: hasElevatorPickup || false,
      hasElevatorDropoff: hasElevatorDropoff || false,
      isPeakHour: isPeak,
      isWeekend: isWeekendDay,
      isHoliday: isHolidayDay,
    })

    return NextResponse.json(priceBreakdown)
  } catch (error) {
    console.error("[v0] Price calculation error:", error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to calculate price" },
      { status: 500 },
    )
  }
}
