import { NextRequest, NextResponse } from "next/server"
import { requestBackend } from "@/app/api/_lib/backend"
import { normalizeBackendCandidates } from "@/app/api/_lib/intake"
import type { DetectedItem } from "@/lib/types/scan"

type AddressPayload = {
  address: string
  province: string
  district: string
  ward: string
  contactName: string
  contactPhone: string
  floor?: string
  hasElevator?: boolean
}

type BookingDetailsPayload = {
  pickup: AddressPayload
  delivery: AddressPayload
  preferredDate: string
  preferredTimeSlot?: "MORNING" | "AFTERNOON" | "EVENING"
  specialRequirements?: string
  notes?: string
}

const parseJson = async (response: Response) => {
  const text = await response.text()
  if (!text) return {}
  try {
    return JSON.parse(text)
  } catch {
    return { message: text }
  }
}

const toNumber = (value: unknown, fallback = 0) => {
  const numeric = typeof value === "number" ? value : value != null ? Number(value) : NaN
  return Number.isFinite(numeric) ? numeric : fallback
}

const buildDetectionPayload = (sessionId: string, items: DetectedItem[]) => {
  if (!Array.isArray(items) || items.length === 0) {
    return {
      items: [],
      enhancedItems: [],
      confidence: 1,
      serviceUsed: "MANUAL",
      fallbackUsed: false,
      originalConfidence: 1,
      processingTimeMs: 0,
      manualInputRequired: false,
      manualReviewRequired: false,
      imageCount: 0,
      imageUrls: [],
    }
  }

  const enhancedItems = items.map((item, index) => {
    const volume = item.volume > 0 ? item.volume : 0
    const edgeMeters = volume > 0 ? Math.cbrt(volume) : 0
    const edgeCm = edgeMeters > 0 ? Math.max(5, Math.round(edgeMeters * 100)) : null

    return {
      id: item.id ?? `${sessionId}-item-${index}`,
      name: item.displayName ?? item.name ?? `Item ${index + 1}`,
      category: item.category ?? "other",
      subcategory: null,
      confidence: item.confidence ?? 1,
      volumeM3: Number(volume.toFixed(3)),
      weightKg: Number(item.weight.toFixed(2)),
      fragile: item.fragile ?? false,
      disassemblyRequired: item.needsDisassembly ?? false,
      twoPersonLift: item.weight > 70,
      stackable: !(item.fragile ?? false),
      notes: item.name ?? undefined,
      orientation: "upright",
      dimsCm: edgeCm
        ? {
            length: edgeCm,
            width: edgeCm,
            height: edgeCm,
          }
        : undefined,
      weightConfidence: 0.8,
      dimsConfidence: edgeCm ? 0.6 : undefined,
      imageIndex: index,
      imageUrl: item.imageUrl ?? undefined,
    }
  })

  const basicItems = items.map((item, index) => ({
    category: item.category ?? "other",
    name: item.displayName ?? item.name ?? `Item ${index + 1}`,
    confidence: item.confidence ?? 1,
    rawLabel: item.name ?? undefined,
    dimensions: enhancedItems[index]?.dimsCm
      ? {
          width: enhancedItems[index]!.dimsCm!.width,
          height: enhancedItems[index]!.dimsCm!.height,
          depth: enhancedItems[index]!.dimsCm!.length,
          unit: "cm",
        }
      : undefined,
    imageIndex: index,
  }))

  const averageConfidence =
    enhancedItems.reduce((sum, item) => sum + (item.confidence ?? 1), 0) / enhancedItems.length

  return {
    items: basicItems,
    enhancedItems,
    confidence: Number(averageConfidence.toFixed(2)),
    serviceUsed: "MANUAL",
    fallbackUsed: false,
    originalConfidence: Number(averageConfidence.toFixed(2)),
    processingTimeMs: 0,
    manualInputRequired: false,
    manualReviewRequired: false,
    imageCount: enhancedItems.length,
    imageUrls: enhancedItems.map((item) => item.imageUrl).filter(Boolean),
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

  let bookingDetails: BookingDetailsPayload | null = null
  try {
    const body = await request.json()
    if (body && typeof body === "object" && "bookingDetails" in body) {
      bookingDetails = (body as any).bookingDetails as BookingDetailsPayload
    }
  } catch {
    // allow empty body
  }

  if (!bookingDetails) {
    return NextResponse.json({ error: "Thiếu thông tin bắt buộc để tạo booking" }, { status: 400 })
  }

  const requiredFields = [
    bookingDetails.pickup?.address,
    bookingDetails.pickup?.province,
    bookingDetails.pickup?.district,
    bookingDetails.pickup?.ward,
    bookingDetails.pickup?.contactName,
    bookingDetails.pickup?.contactPhone,
    bookingDetails.delivery?.address,
    bookingDetails.delivery?.province,
    bookingDetails.delivery?.district,
    bookingDetails.delivery?.ward,
    bookingDetails.delivery?.contactName,
    bookingDetails.delivery?.contactPhone,
    bookingDetails.preferredDate,
  ]

  if (requiredFields.some((field) => !field || `${field}`.trim().length === 0)) {
    return NextResponse.json({ error: "Thiếu thông tin bắt buộc để tạo booking" }, { status: 400 })
  }

  try {
    const sessionResponse = await requestBackend(request, `/intake/session/${sessionId}`, {
      method: "GET",
    })

    const sessionPayload = await parseJson(sessionResponse)
    if (!sessionResponse.ok) {
      const message = (sessionPayload as any)?.error ?? "Không thể tải dữ liệu phiên scan"
      return NextResponse.json({ error: message }, { status: sessionResponse.status })
    }

    const candidates = Array.isArray((sessionPayload as any)?.items)
      ? (sessionPayload as any).items
      : Array.isArray((sessionPayload as any)?.candidates)
        ? (sessionPayload as any).candidates
        : []

    const items = normalizeBackendCandidates(sessionId, candidates)

    const bookingRequest = {
      pickupAddress: {
        address: bookingDetails.pickup.address,
        province: bookingDetails.pickup.province,
        district: bookingDetails.pickup.district,
        ward: bookingDetails.pickup.ward,
        contactName: bookingDetails.pickup.contactName,
        contactPhone: bookingDetails.pickup.contactPhone,
        floor: toNumber(bookingDetails.pickup.floor, 0),
        hasElevator: bookingDetails.pickup.hasElevator ?? true,
      },
      deliveryAddress: {
        address: bookingDetails.delivery.address,
        province: bookingDetails.delivery.province,
        district: bookingDetails.delivery.district,
        ward: bookingDetails.delivery.ward,
        contactName: bookingDetails.delivery.contactName,
        contactPhone: bookingDetails.delivery.contactPhone,
        floor: toNumber(bookingDetails.delivery.floor, 0),
        hasElevator: bookingDetails.delivery.hasElevator ?? true,
      },
      preferredDate: bookingDetails.preferredDate,
      preferredTimeSlot: bookingDetails.preferredTimeSlot ?? "MORNING",
      notes: bookingDetails.notes ?? undefined,
      specialRequirements: bookingDetails.specialRequirements ?? undefined,
    }

    const createResponse = await requestBackend(request, "/bookings", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(bookingRequest),
    })

    const createPayload = await parseJson(createResponse)
    if (!createResponse.ok) {
      const message = (createPayload as any)?.error ?? "Không thể tạo booking"
      return NextResponse.json({ error: message }, { status: createResponse.status })
    }

    const booking = (createPayload as any)?.booking ?? (createPayload as any)?.bookingDetails
    const bookingId = toNumber(booking?.bookingId ?? booking?.booking_id, 0)
    if (!bookingId) {
      return NextResponse.json({ error: "Không xác định được bookingId" }, { status: 500 })
    }

    if (items.length > 0) {
      try {
        const detectionPayload = buildDetectionPayload(sessionId, items)
        await requestBackend(request, `/bookings/${bookingId}/items/detected`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ detectionResult: detectionPayload, replaceExisting: true }),
        })
      } catch (persistError) {
        console.warn("Không thể lưu danh sách vật phẩm", persistError)
      }
    }

    return NextResponse.json({
      bookingId,
      status: "QUEUED",
      message: (createPayload as any)?.message ?? "Booking created",
    })
  } catch (error) {
    console.error("Failed to publish scan session", error)
    return NextResponse.json({ error: "Không thể gửi yêu cầu đến backend" }, { status: 502 })
  }
}
