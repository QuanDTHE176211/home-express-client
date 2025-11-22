import { NextRequest, NextResponse } from "next/server"
import { requestBackend } from "@/app/api/_lib/backend"
import { normalizeBackendCandidates } from "@/app/api/_lib/intake"
import type { DetectedItem } from "@/lib/types/scan"

type AddressDetails = {
  floor?: string
  hasElevator?: boolean
}

type BookingDetails = {
  pickup: AddressDetails
  delivery: AddressDetails
  distanceKm?: string
}

type VehiclePricingRule = {
  basePriceVnd?: number
  perKmFirst4KmVnd?: number
  perKm5To40KmVnd?: number
  perKmAfter40KmVnd?: number
  noElevatorFeePerFloorVnd?: number
  noElevatorFloorThreshold?: number
}

type CategoryPricingRule = {
  categoryName?: string
  pricePerUnitVnd?: number
  fragileMultiplier?: number
  disassemblyMultiplier?: number
}

type QuoteData = {
  total: number
  breakdown: {
    basePrice: number
    laborCost: number
    vehicleCost: number
    packagingCost: number
    disassemblyCost: number
    fragileCost: number
  }
  vehicle: {
    type: string
    capacity: string
  }
  labor: {
    workers: number
    hours: number
  }
  estimatedDuration: string
}

const VEHICLE_LABELS: Record<string, { label: string; capacity: string }> = {
  motorcycle: { label: "Xe máy", capacity: "0.3 m³" },
  van: { label: "Xe van", capacity: "3.5 m³" },
  truck_small: { label: "Xe tải nhỏ", capacity: "8 m³" },
  truck_large: { label: "Xe tải lớn", capacity: "18 m³" },
  other: { label: "Xe tải", capacity: "10 m³" },
}

const FALLBACK_PRICING = {
  basePrice: 350_000,
  perKmFirst4Km: 15_000,
  perKm5To40Km: 12_000,
  perKmAfter40Km: 9_000,
}

const roundToStep = (value: number, step = 1_000) => Math.round(value / step) * step

const toNumber = (value: unknown, fallback = 0) => {
  const numeric = typeof value === "number" ? value : value != null ? Number(value) : NaN
  return Number.isFinite(numeric) ? numeric : fallback
}

const parseBackendJson = async (response: Response) => {
  const text = await response.text()
  if (!text) return {}
  try {
    return JSON.parse(text)
  } catch {
    return { message: text }
  }
}

const parseBookingDetails = (raw: any): BookingDetails | null => {
  if (!raw || typeof raw !== "object") return null
  const pickup = typeof raw.pickup === "object" ? raw.pickup : {}
  const delivery = typeof raw.delivery === "object" ? raw.delivery : {}
  return {
    pickup: {
      floor: typeof pickup.floor === "number" ? pickup.floor.toString() : pickup.floor ?? undefined,
      hasElevator: typeof pickup.hasElevator === "boolean" ? pickup.hasElevator : true,
    },
    delivery: {
      floor: typeof delivery.floor === "number" ? delivery.floor.toString() : delivery.floor ?? undefined,
      hasElevator: typeof delivery.hasElevator === "boolean" ? delivery.hasElevator : true,
    },
    distanceKm: typeof raw.distanceKm === "string" || typeof raw.distanceKm === "number" ? String(raw.distanceKm) : undefined,
  }
}

const guessVehicleType = (weight: number, volume: number) => {
  if (volume <= 0.4 && weight <= 120) return "van"
  if (volume <= 8 && weight <= 1200) return "truck_small"
  if (volume <= 18) return "truck_large"
  return "truck_large"
}

const computeDistanceCost = (distanceKm: number, pricing: VehiclePricingRule | null) => {
  const rule = pricing ?? {}
  const firstSegment = toNumber(rule.perKmFirst4KmVnd, FALLBACK_PRICING.perKmFirst4Km)
  const secondSegment = toNumber(rule.perKm5To40KmVnd, FALLBACK_PRICING.perKm5To40Km)
  const thirdSegment = toNumber(rule.perKmAfter40KmVnd, FALLBACK_PRICING.perKmAfter40Km)

  let remaining = Math.max(distanceKm, 0)
  let total = 0

  const first = Math.min(remaining, 4)
  total += first * firstSegment
  remaining -= first

  if (remaining > 0) {
    const second = Math.min(remaining, 36)
    total += second * secondSegment
    remaining -= second
  }

  if (remaining > 0) {
    total += remaining * thirdSegment
  }

  return total
}

const computeNoElevatorFee = (
  pricing: VehiclePricingRule | null,
  floor: number,
): number => {
  if (!pricing) return 0
  const threshold = toNumber(pricing.noElevatorFloorThreshold ?? 3)
  if (floor <= threshold) return 0
  const feePerFloor = toNumber(pricing.noElevatorFeePerFloorVnd, 25_000)
  return (floor - threshold) * feePerFloor
}

const fetchEligibleVehicles = async (
  request: NextRequest,
  totalWeight: number,
  totalVolume: number,
  requiresTailLift: boolean,
  requiresTools: boolean,
) => {
  try {
    const response = await requestBackend(request, "/transport/vehicles/eligible", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        totalWeight,
        totalVolume,
        requiresTailLift,
        requiresTools,
      }),
    })

    const payload = await parseBackendJson(response)
    if (!response.ok) return []
    const data = (payload as any)?.data
    return Array.isArray(data) ? data : []
  } catch (error) {
    console.warn("Unable to load eligible vehicles", error)
    return []
  }
}

const fetchVehiclePricing = async (request: NextRequest, vehicleType: string) => {
  try {
    const response = await requestBackend(
      request,
      `/transport/pricing/vehicles?vehicleType=${encodeURIComponent(vehicleType)}&active=true`,
      { method: "GET" },
    )

    const payload = await parseBackendJson(response)
    if (!response.ok) return null
    const rules = (payload as any)?.data?.pricingRules
    if (!Array.isArray(rules) || rules.length === 0) return null
    const first = rules[0] as VehiclePricingRule
    return {
      basePriceVnd: toNumber(first.basePriceVnd, FALLBACK_PRICING.basePrice),
      perKmFirst4KmVnd: toNumber(first.perKmFirst4KmVnd, FALLBACK_PRICING.perKmFirst4Km),
      perKm5To40KmVnd: toNumber(first.perKm5To40KmVnd, FALLBACK_PRICING.perKm5To40Km),
      perKmAfter40KmVnd: toNumber(first.perKmAfter40KmVnd, FALLBACK_PRICING.perKmAfter40Km),
      noElevatorFeePerFloorVnd: first.noElevatorFeePerFloorVnd,
      noElevatorFloorThreshold: first.noElevatorFloorThreshold,
    }
  } catch (error) {
    console.warn("Unable to load vehicle pricing", error)
    return null
  }
}

const fetchCategoryPricing = async (request: NextRequest) => {
  try {
    const response = await requestBackend(request, "/transport/pricing/categories?active=true", {
      method: "GET",
    })
    const payload = await parseBackendJson(response)
    if (!response.ok) return new Map<string, CategoryPricingRule>()
    const rules = (payload as any)?.data?.pricingRules
    const map = new Map<string, CategoryPricingRule>()
    if (Array.isArray(rules)) {
      for (const rule of rules as CategoryPricingRule[]) {
        if (rule?.categoryName) {
          map.set(rule.categoryName.toLowerCase(), rule)
        }
      }
    }
    return map
  } catch (error) {
    console.warn("Unable to load category pricing", error)
    return new Map<string, CategoryPricingRule>()
  }
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ sessionId: string }> },
) {
  const { sessionId } = await params
  if (!sessionId) {
    return NextResponse.json({ error: "sessionId is required" }, { status: 400 })
  }

  let bookingDetails: BookingDetails | null = null
  try {
    const body = await request.json()
    if (body && typeof body === "object" && "bookingDetails" in body) {
      bookingDetails = parseBookingDetails((body as any).bookingDetails)
    }
  } catch {
    // ignore empty bodies
  }

  try {
    const sessionResponse = await requestBackend(request, `/intake/session/${sessionId}`, {
      method: "GET",
    })

    const sessionPayload = await parseBackendJson(sessionResponse)
    if (!sessionResponse.ok) {
      const message = (sessionPayload as any)?.error ?? "Unable to load intake items for quoting"
      return NextResponse.json({ error: message }, { status: sessionResponse.status })
    }

    const candidates = Array.isArray((sessionPayload as any)?.items)
      ? (sessionPayload as any).items
      : Array.isArray((sessionPayload as any)?.candidates)
        ? (sessionPayload as any).candidates
        : []

    const items = normalizeBackendCandidates(sessionId, candidates)

    if (items.length === 0) {
      return NextResponse.json(
        { error: "No items available for quoting", sessionId },
        { status: 400 },
      )
    }

    const totals = items.reduce(
      (acc, item) => {
        const quantity = Math.max(item.quantity ?? 1, 1)
        acc.weight += item.weight * quantity
        acc.volume += item.volume * quantity
        acc.count += quantity
        if (item.fragile) acc.fragile += quantity
        if (item.needsDisassembly) acc.disassembly += quantity
        return acc
      },
      { weight: 0, volume: 0, count: 0, fragile: 0, disassembly: 0 },
    )

    const distanceKm = Math.max(1, toNumber(bookingDetails?.distanceKm, 10))

    const requiresTools = items.some((item) => item.needsDisassembly)
    const requiresTailLift = totals.weight > 800 || totals.volume > 10

    const eligibleVehicles = await fetchEligibleVehicles(
      request,
      Math.max(1, totals.weight),
      Math.max(0.1, totals.volume),
      requiresTailLift,
      requiresTools,
    )

    const fallbackType = guessVehicleType(totals.weight, totals.volume)
    const selectedVehicle = Array.isArray(eligibleVehicles) && eligibleVehicles.length > 0 ? eligibleVehicles[0] : null
    const vehicleType = (selectedVehicle?.type ?? fallbackType) as string
    const vehicleLabel = VEHICLE_LABELS[vehicleType] ?? VEHICLE_LABELS.other
    const vehicleCapacity = selectedVehicle?.capacity_m3
      ? `${Number(selectedVehicle.capacity_m3).toFixed(1)} m³`
      : vehicleLabel.capacity

    const vehiclePricing = await fetchVehiclePricing(request, vehicleType)
    const categoryPricing = await fetchCategoryPricing(request)

    const baseVehicleCost = toNumber(vehiclePricing?.basePriceVnd, FALLBACK_PRICING.basePrice)
    const distanceCost = computeDistanceCost(distanceKm, vehiclePricing)
    const elevatorPenalty = bookingDetails?.pickup?.hasElevator === false
      ? computeNoElevatorFee(vehiclePricing, toNumber(bookingDetails.pickup.floor, 0))
      : 0

    const packagingCost = items.reduce((sum, item) => {
      const quantity = Math.max(item.quantity ?? 1, 1)
      const base = 15_000 * quantity
      const fragile = item.fragile ? 45_000 * quantity : 0
      return sum + base + fragile
    }, 0)

    const itemHandlingCost = items.reduce((sum, item) => {
      const quantity = Math.max(item.quantity ?? 1, 1)
      const categoryKey = (item.category ?? "other").toLowerCase()
      const rule = categoryPricing.get(categoryKey)
      const pricePerUnit = toNumber(rule?.pricePerUnitVnd, 55_000)
      let cost = pricePerUnit * quantity
      const fragileMultiplier = rule?.fragileMultiplier ?? 1.25
      const disassemblyMultiplier = rule?.disassemblyMultiplier ?? 1.3
      if (item.fragile) {
        cost *= fragileMultiplier
      }
      if (item.needsDisassembly) {
        cost *= disassemblyMultiplier
      }
      return sum + cost
    }, 0)

    const laborWorkers = Math.max(2, Math.ceil(totals.weight / 90))
    const laborHours = Math.max(2, Math.ceil(distanceKm / 8))
    const laborCost = roundToStep(laborWorkers * laborHours * 85_000)

    const total = roundToStep(
      baseVehicleCost + distanceCost + itemHandlingCost + packagingCost + elevatorPenalty + laborCost,
    )

    const quote: QuoteData = {
      total,
      breakdown: {
        basePrice: roundToStep(baseVehicleCost),
        laborCost,
        vehicleCost: roundToStep(distanceCost),
        packagingCost: roundToStep(packagingCost),
        disassemblyCost: roundToStep(items.reduce((sum, item) => (item.needsDisassembly ? sum + 45_000 : sum), 0)),
        fragileCost: roundToStep(items.reduce((sum, item) => (item.fragile ? sum + 35_000 : sum), 0)),
      },
      vehicle: {
        type: vehicleLabel.label,
        capacity: vehicleCapacity,
      },
      labor: {
        workers: laborWorkers,
        hours: laborHours,
      },
      estimatedDuration: `${laborHours}-${laborHours + 2} giờ`,
    }

    return NextResponse.json({ sessionId, quote })
  } catch (error) {
    console.error("Failed to generate quote", error)
    return NextResponse.json({ error: "Unable to generate quote" }, { status: 502 })
  }
}
